"""Publish dated Fuel Finder data from FuelCosts' documented open public API.

Use an identifiable bot, cache requests, validate complete snapshots and attribute
both sources. Government CSV files can also be validated offline with --csv.
Never change reviews or CMS; never infer an absent fuel grade or hide data age.
"""
import argparse,csv,hashlib,io,json,math,os,re,sys,tempfile,time
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError
from http.client import RemoteDisconnected,IncompleteRead
from collections import defaultdict
from datetime import datetime,timezone
from pathlib import Path

SOURCE='https://www.gov.uk/guidance/access-the-latest-fuel-prices-and-forecourt-data-via-api-or-email'
PORTAL='https://www.developer.fuel-finder.service.gov.uk/fuel-finder/access-latest-fuelprices'
LICENSE='https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'
OUT=Path(__file__).resolve().parents[1]/'dist/fuel-prices'
STAGE='starting'
GRADES=('E10','E5','B7S','B7P')
COLUMNS=['id','name','brand','postcode','address','town','latitude','longitude','fuels']
API='https://fuelcosts.co.uk/api/stations'
API_SOURCE='https://fuelcosts.co.uk/fuel-finder'
USER_AGENT='SpinRaidersFuelUpdater/1.0 (+https://www.spin-raiders.com/about-us)'
REQUIRED={'forecourts.node_id','forecourts.trading_name','forecourts.brand_name','forecourts.location.postcode','forecourts.location.city','forecourts.temporary_closure','forecourts.permanent_closure'}|{'forecourts.fuel_price.'+grade for grade in GRADES}|{'forecourts.price_submission_timestamp.'+grade for grade in GRADES}|{'forecourts.price_change_effective_timestamp.'+grade for grade in GRADES}

def iso(value):
 return value.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')

def date(value):
 if not value:return None
 try:return datetime.strptime(value.split(' (')[0],'%a %b %d %Y %H:%M:%S GMT%z').astimezone(timezone.utc)
 except ValueError:return None

def norm(value):
 return re.sub(r'[^a-z0-9]+',' ',value.casefold()).strip()

def station_key(value,brand=''):
 value=norm(value);brand=norm(brand)
 if brand and value.startswith(brand+' '):value=value[len(brand)+1:]
 value=re.sub(r'\b(north|south|east|west)bound\b',r'\1',value)
 return re.sub(r'\s+',' ',re.sub(r'\b(services?|area)\b',' ',value)).strip()

def station_index(areas):
 index=defaultdict(set)
 for area,rows in areas.items():
  for row in rows:
   for key in {norm(row[1]),station_key(row[1],row[2])}:
    if key:index[key].add(area)
 return {key:sorted(value) for key,value in sorted(index.items())}

def text(value):
 return value.strip() if isinstance(value,str) else ''

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
 manifest['stationNames']=station_index(areas)
 return manifest,chunks

def write_data(manifest,chunks,output=OUT):
 output.mkdir(parents=True,exist_ok=True)
 for name,data in [*chunks.items(),('manifest',manifest)]:
  target=output/(name+'.json');temporary=target.with_suffix('.tmp')
  temporary.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8');temporary.replace(target)

def api_date(value):
 try:
  parsed=datetime.fromisoformat(value.replace('Z','+00:00'))
  return parsed.astimezone(timezone.utc) if parsed.tzinfo else None
 except (ValueError,TypeError,AttributeError):return None

def parse_api_pages(pages,now=None,min_rows=5000):
 now=now or datetime.now(timezone.utc)
 if not pages:raise ValueError('No public API pages')
 metadata=pages[0].get('meta',{});total=metadata.get('total');per_page=metadata.get('perPage');total_pages=metadata.get('totalPages')
 if not isinstance(total,int) or isinstance(total,bool) or not min_rows<=total<=15000 or not isinstance(per_page,int) or not 1<=per_page<=500 or total_pages!=math.ceil(total/per_page) or len(pages)!=total_pages:raise ValueError('Incomplete public API pagination')
 versions=[];seen=set();areas=defaultdict(list);towns=defaultdict(set);names={};closed=0;invalid=0
 for index,page in enumerate(pages,1):
  meta=page.get('meta',{});stations=page.get('stations');filters=meta.get('filters',{})
  published=api_date(meta.get('lastUpdated',{}).get('prices'))
  if meta.get('page')!=index or meta.get('total')!=total or meta.get('perPage')!=per_page or meta.get('totalPages')!=total_pages or not isinstance(stations,list) or len(stations)!=(per_page if index<total_pages else total-per_page*(total_pages-1)):raise ValueError('Public API pagination changed')
  if filters.get('lat') is not None or filters.get('lon') is not None or filters.get('fuel') is not None or filters.get('brand') is not None:raise ValueError('Public API returned a filtered dataset')
  if not published or published>now or (now-published).total_seconds()>3*3600:raise ValueError('Public API snapshot is stale or in the future')
  versions.append(published)
  for row in stations:
   identity=row.get('node_id');location=row.get('location',{});prices=row.get('prices')
   if not isinstance(identity,str) or not re.fullmatch(r'[0-9a-f]{64}',identity) or identity in seen:raise ValueError('Duplicate or invalid forecourt identity')
   seen.add(identity)
   closure=[row.get('is_temporarily_closed'),row.get('is_permanently_closed'),row.get('isActive')]
   if any(type(value) is not bool for value in closure):raise ValueError('Unknown API closure status')
   if closure[0] or closure[1] or not closure[2]:closed+=1;continue
   if not isinstance(location,dict) or not isinstance(prices,list):raise ValueError('Public station schema changed')
   postcode=re.sub(r'\s+','',text(location.get('postcode')).upper());match=re.match(r'^([A-Z]{1,2})\d',postcode)
   if not match:invalid+=1;continue
   fuels={};grade_map={'E10':'E10','E5':'E5','B7_STANDARD':'B7S','B7_PREMIUM':'B7P'}
   for item in prices:
    grade=grade_map.get(item.get('fuel_type'))
    if not grade:continue
    if grade in fuels:raise ValueError('Duplicate price grade')
    price=item.get('price');reported=api_date(item.get('price_last_updated'));effective=api_date(item.get('price_change_effective_timestamp'))
    if isinstance(price,bool) or not isinstance(price,(int,float)) or not math.isfinite(price) or not 80<=price<=400 or not reported or not effective or reported>now or effective>now:invalid+=1;continue
    fuels[grade]=[price,iso(reported),iso(effective)]
   if not fuels:continue
   name=text(row.get('trading_name'));town=text(location.get('city'))
   if not name:invalid+=1;continue
   address=', '.join(filter(None,[text(location.get('address_line_1')),text(location.get('address_line_2'))]))
   latitude=location.get('latitude');longitude=location.get('longitude')
   if not isinstance(latitude,(int,float)) or not isinstance(longitude,(int,float)) or not math.isfinite(latitude) or not math.isfinite(longitude) or not -90<=latitude<=90 or not -180<=longitude<=180:latitude=longitude=None
   area=match[1];areas[area].append([identity,name,text(row.get('brand_name')),text(location.get('postcode')),address,town,latitude,longitude,fuels]);key=norm(town)
   if key:towns[key].add(area);names.setdefault(key,town)
 if max(versions)!=min(versions):raise ValueError('Source changed during pagination; prior complete snapshot retained')
 count=sum(map(len,areas.values()))
 if len(seen)!=total or count<min_rows or invalid>total*.01:raise ValueError('Incomplete or invalid public forecourt data')
 published=iso(min(versions));rows={area:sorted(values,key=lambda item:item[0]) for area,values in areas.items()}
 revision=hashlib.sha256(json.dumps(rows,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
 manifest={'schemaVersion':1,'dataKind':'fuelcosts-fuel-finder-public-api','revision':revision,'sourceUrl':SOURCE,'providerUrl':API_SOURCE,'licenseUrl':LICENSE,'attribution':'Fuel price data from FuelCosts.co.uk and UK Government Fuel Finder. Contains public sector information licensed under the Open Government Licence v3.0.','publishedAt':published,'checkedAt':iso(now),'stationCount':count,'closedExcluded':closed,'invalidExcluded':invalid,'columns':COLUMNS,'areas':sorted(areas),'towns':{key:[names[key],sorted(value)] for key,value in sorted(towns.items())}}
 manifest['stationNames']=station_index(rows)
 return manifest,{area:{'schemaVersion':1,'revision':revision,'publishedAt':published,'stations':values} for area,values in rows.items()}

def read_api_page(request):
 # Retry only temporary transport/service failures, never invalid source data.
 for attempt in range(1,4):
  try:
   with urlopen(request,timeout=45) as response:
    if 'json' not in response.headers.get('Content-Type','').lower():raise ValueError('Public API did not return JSON')
    raw=response.read(5*1024*1024+1)
    if len(raw)>5*1024*1024:raise ValueError('Unexpected public API page size')
   return raw
  except HTTPError as error:
   if error.code not in (429,500,502,503,504) or attempt==3:raise
  except (URLError,RemoteDisconnected,IncompleteRead,TimeoutError,ConnectionResetError):
   if attempt==3:raise
  print('Fuel Finder temporary connection failure; retrying this page ('+str(attempt)+'/3).',file=sys.stderr)
  time.sleep(attempt*2)

def download_api_pages(directory):
 global STAGE
 pages=[];count=1;index=1
 while index<=count:
  STAGE='reading public forecourt API page '+str(index)
  request=Request(API+'?sort=price&perPage=500&page='+str(index),headers={'User-Agent':USER_AGENT,'Accept':'application/json'})
  raw=read_api_page(request)
  page=json.loads(raw);pages.append(page);count=page.get('meta',{}).get('totalPages',0)
  if not isinstance(count,int) or not 1<=count<=40:raise ValueError('Unexpected public API page count')
  (Path(directory)/('page-'+str(index)+'.json')).write_bytes(raw);index+=1
  if index<=count:time.sleep(.3)
 return pages


def download_consistent_snapshot(directory):
 # A retailer update can land between API pages. Start again from page one;
 # never combine revisions or weaken the existing completeness checks.
 for attempt in range(1, 4):
  attempt_directory = Path(directory) / ('attempt-' + str(attempt))
  attempt_directory.mkdir()
  try:
   return parse_api_pages(download_api_pages(attempt_directory))
  except ValueError as error:
   if str(error) != 'Source changed during pagination; prior complete snapshot retained' or attempt == 3:
    raise
   print('Fuel Finder source changed during download; retrying the complete snapshot (' + str(attempt) + '/3).', file=sys.stderr)
   time.sleep(2)


def main():
 parser=argparse.ArgumentParser();parser.add_argument('--csv');parser.add_argument('--published-at');parser.add_argument('--output',type=Path,default=OUT);parser.add_argument('--force',action='store_true');args=parser.parse_args()
 if not args.csv and not args.force:
  try:
   previous=json.loads((args.output/'manifest.json').read_text(encoding='utf-8'));checked=datetime.fromisoformat(previous['checkedAt'].replace('Z','+00:00'))
   if (datetime.now(timezone.utc)-checked).total_seconds()<45*60:print('Fuel Finder: recently checked; current dated data retained');return 0
  except (OSError,ValueError,KeyError):pass
 with tempfile.TemporaryDirectory(prefix='spin-raiders-fuel-') as directory:
  if args.csv:
   if not args.published_at:raise ValueError('--published-at required with --csv')
   path=Path(args.csv);published=datetime.fromisoformat(args.published_at.replace('Z','+00:00'))
   manifest,chunks=parse_csv(path,published)
  else:manifest,chunks=download_consistent_snapshot(directory)
  write_data(manifest,chunks,args.output)
  print(json.dumps({'source':'Fuel Finder','publishedAt':manifest['publishedAt'],'stations':manifest['stationCount'],'areas':len(chunks),'closedExcluded':manifest['closedExcluded'],'invalidExcluded':manifest['invalidExcluded']}))
 return 0

if __name__=='__main__':
 try:sys.exit(main())
 except Exception as error:
  message=str(error).splitlines()[0]
  message=re.sub(r'(https?://[^\s?]+)\?[^\s]+',r'\1?[redacted]',message)
  print('Fuel Finder refresh failed at '+STAGE+' ('+type(error).__name__+'): '+message[:250]+'. Prior dated files retained.',file=sys.stderr);sys.exit(1)
