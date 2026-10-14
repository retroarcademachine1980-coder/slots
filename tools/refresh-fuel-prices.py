"""Publish only dated public Fuel Finder prices; never change reviews or CMS.

The CI downloader uses the ordinary anonymous government CSV-download button.
It does not inspect application internals, decrypt responses or use credentials.
Local runs must supply a CSV downloaded through the normal browser flow.
"""
import argparse,csv,hashlib,io,json,math,os,re,shutil,sys,tempfile
from collections import defaultdict
from datetime import datetime,timezone
from pathlib import Path

SOURCE='https://www.gov.uk/guidance/access-the-latest-fuel-prices-and-forecourt-data-via-api-or-email'
PORTAL='https://www.developer.fuel-finder.service.gov.uk/access-latest-fuelprices'
LICENSE='https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'
OUT=Path(__file__).resolve().parents[1]/'dist/fuel-prices'
GRADES=('E10','E5','B7S','B7P')
COLUMNS=['id','name','brand','postcode','address','town','latitude','longitude','fuels']
REQUIRED={'forecourts.node_id','forecourts.trading_name','forecourts.brand_name','forecourts.location.postcode','forecourts.location.city','forecourts.temporary_closure','forecourts.permanent_closure'}|{'forecourts.fuel_price.'+grade for grade in GRADES}|{'forecourts.price_submission_timestamp.'+grade for grade in GRADES}|{'forecourts.price_change_effective_timestamp.'+grade for grade in GRADES}

def iso(value):
 return value.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')

def date(value):
 if not value:return None
 try:return datetime.strptime(value.split(' (')[0],'%a %b %d %Y %H:%M:%S GMT%z').astimezone(timezone.utc)
 except ValueError:return None

def norm(value):
 return re.sub(r'[^a-z0-9]+',' ',value.casefold()).strip()

def parse_csv(path,published_at,now=None,min_rows=5000):
 now=now or datetime.now(timezone.utc)
 if not published_at.tzinfo:raise ValueError('Publication time requires timezone')
 if published_at>now or (now-published_at).total_seconds()>30*3600:raise ValueError('Government snapshot is stale or in the future')
 raw=Path(path).read_bytes();reader=csv.DictReader(io.StringIO(raw.decode('utf-8-sig'),newline=''))
 if not REQUIRED.issubset(reader.fieldnames or []):raise ValueError('Government CSV columns changed')
 seen=set();areas=defaultdict(list);towns=defaultdict(set);names={};count=0;closed=0;invalid=0
 for row in reader:
  count+=1;identity=row['forecourts.node_id']
  if not re.fullmatch(r'[0-9a-f]{64}',identity):raise ValueError('Unexpected forecourt identity')
  if identity in seen:raise ValueError('Duplicate forecourt identity')
  seen.add(identity)
  if any(row[field].casefold() not in ('true','false') for field in ['forecourts.temporary_closure','forecourts.permanent_closure']):raise ValueError('Unknown closure status')
  if row['forecourts.temporary_closure'].casefold()=='true' or row['forecourts.permanent_closure'].casefold()=='true':closed+=1;continue
  postcode=re.sub(r'\s+','',row['forecourts.location.postcode'].upper());match=re.match(r'^([A-Z]{1,2})\d',postcode)
  if not match:invalid+=1;continue
  area=match[1];fuels={}
  for grade in GRADES:
   value=row['forecourts.fuel_price.'+grade]
   if not value:continue
   try:price=float(value)
   except ValueError:invalid+=1;continue
   reported=date(row['forecourts.price_submission_timestamp.'+grade]);effective=date(row['forecourts.price_change_effective_timestamp.'+grade])
   if not math.isfinite(price) or not 80<=price<=400 or not reported or not effective or reported>now or effective>now:invalid+=1;continue
   fuels[grade]=[price,iso(reported),iso(effective)]
  if not fuels:continue
  town=row['forecourts.location.city'].strip();name=row['forecourts.trading_name'].strip()
  if not name:invalid+=1;continue
  address=', '.join(filter(None,[row.get('forecourts.location.address_line_1','').strip(),row.get('forecourts.location.address_line_2','').strip()]))
  try:latitude=float(row.get('forecourts.location.latitude',''));longitude=float(row.get('forecourts.location.longitude',''))
  except ValueError:latitude=longitude=None
  if latitude is not None and (not math.isfinite(latitude) or not math.isfinite(longitude) or not -90<=latitude<=90 or not -180<=longitude<=180):latitude=longitude=None
  areas[area].append([identity,name,row['forecourts.brand_name'].strip(),row['forecourts.location.postcode'].strip(),address,town,latitude,longitude,fuels])
  key=norm(town)
  if key:towns[key].add(area);names.setdefault(key,town)
 if count<min_rows or len(seen)!=count or invalid>count*.05:raise ValueError('Incomplete or invalid government CSV')
 station_count=sum(map(len,areas.values()))
 if station_count<min_rows:raise ValueError('Too few usable forecourts')
 revision=hashlib.sha256(raw).hexdigest();published=iso(published_at)
 manifest={'schemaVersion':1,'dataKind':'govuk-fuel-finder-public-csv','revision':revision,'sourceUrl':SOURCE,'licenseUrl':LICENSE,'attribution':'Contains public sector information licensed under the Open Government Licence v3.0.','publishedAt':published,'checkedAt':iso(now),'stationCount':station_count,'closedExcluded':closed,'invalidExcluded':invalid,'columns':COLUMNS,'areas':sorted(areas),'towns':{key:[names[key],sorted(value)] for key,value in sorted(towns.items())}}
 chunks={area:{'schemaVersion':1,'revision':revision,'publishedAt':published,'stations':sorted(rows,key=lambda item:item[0])} for area,rows in areas.items()}
 return manifest,chunks

def write_data(manifest,chunks,output=OUT):
 output.mkdir(parents=True,exist_ok=True)
 for name,data in [*chunks.items(),('manifest',manifest)]:
  target=output/(name+'.json');temporary=target.with_suffix('.tmp')
  temporary.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8');temporary.replace(target)

def download_csv(directory):
 if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('Browser downloader is CI-only; use --csv for a locally downloaded file')
 from playwright.sync_api import sync_playwright
 with sync_playwright() as playwright:
  options={'channel':'chrome'} if shutil.which('google-chrome') else {}
  browser=playwright.chromium.launch(headless=True,**options)
  try:
   page=browser.new_page(accept_downloads=True,locale='en-GB')
   page.goto(PORTAL,wait_until='domcontentloaded',timeout=30000)
   page.get_by_role('heading',name='Ways to access latest Fuel Finder data',exact=True).wait_for(timeout=30000)
   with page.expect_download(timeout=60000) as awaited:
    page.get_by_role('link',name='Download the CSV file',exact=True).click()
   download=awaited.value
   match=re.fullmatch(r'UpdatedFuelPrice-(\d{13})\.csv',download.suggested_filename)
   if not match:raise ValueError('Government download filename changed')
   path=Path(directory)/download.suggested_filename;download.save_as(path)
   published=datetime.fromtimestamp(int(match[1])/1000,timezone.utc)
   return path,published
  finally:browser.close()

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--csv');parser.add_argument('--published-at');parser.add_argument('--output',type=Path,default=OUT);parser.add_argument('--force',action='store_true');args=parser.parse_args()
 if not args.csv and not args.force:
  try:
   previous=json.loads((args.output/'manifest.json').read_text(encoding='utf-8'));checked=datetime.fromisoformat(previous['checkedAt'].replace('Z','+00:00'))
   if (datetime.now(timezone.utc)-checked).total_seconds()<2*3600:print('Fuel Finder: recently checked; current dated data retained');return 0
  except (OSError,ValueError,KeyError):pass
 with tempfile.TemporaryDirectory(prefix='spin-raiders-fuel-') as directory:
  if args.csv:
   if not args.published_at:raise ValueError('--published-at required with --csv')
   path=Path(args.csv);published=datetime.fromisoformat(args.published_at.replace('Z','+00:00'))
  else:path,published=download_csv(directory)
  manifest,chunks=parse_csv(path,published);write_data(manifest,chunks,args.output)
  print(json.dumps({'source':'Fuel Finder','publishedAt':manifest['publishedAt'],'stations':manifest['stationCount'],'areas':len(chunks),'closedExcluded':manifest['closedExcluded'],'invalidExcluded':manifest['invalidExcluded']}))
 return 0

if __name__=='__main__':
 try:sys.exit(main())
 except Exception as error:
  print('Fuel Finder refresh failed ('+type(error).__name__+'); prior dated files retained.',file=sys.stderr);sys.exit(1)
