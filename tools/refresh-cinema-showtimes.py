"""Refresh only operator-authorised Scott Cinema feeds; never modify reviews or CMS."""
import json,time,sys,re
from html.parser import HTMLParser
from pathlib import Path
from datetime import datetime,timezone
from zoneinfo import ZoneInfo
from urllib.request import urlopen,Request
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor
VENUES={'SCOBAR':'Barnstaple','SCONEW':'Newton Abbot','SCORAD':'Sidmouth','SCOBWR':'Bridgwater','SCOEXM':'Exmouth','SCOORP':'Bristol'}
PRICE_HOSTS={'SCOBAR':'barnstaple','SCONEW':'newtonabbot','SCORAD':'sidmouth','SCOBWR':'bridgwater','SCOEXM':'exmouth','SCOORP':'bristolwestburypark'}
OUT=Path(__file__).resolve().parents[1]/'dist/cinema-showtimes'

class PriceTable(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.active=False;self.cell=None;self.row=[];self.rows=[]
 def handle_starttag(self,tag,attrs):
  if tag=='table' and 'pricelist' in dict(attrs).get('class','').split():self.active=True
  if not self.active:return
  if tag=='tr':self.row=[]
  if tag in ('td','th'):self.cell=[]
  if tag=='br' and self.cell is not None:self.cell.append(' ')
 def handle_data(self,data):
  if self.active and self.cell is not None:self.cell.append(data)
 def handle_endtag(self,tag):
  if not self.active:return
  if tag in ('td','th') and self.cell is not None:
   self.row.append(' '.join(''.join(self.cell).split()));self.cell=None
  if tag=='tr' and self.row:self.rows.append(self.row)
  if tag=='table':self.active=False

def prices_from_html(html,code,now):
 parser=PriceTable();parser.feed(html);table=parser.rows
 if len(table)<4 or len(table[0])!=3 or table[0][1:] not in (['Standard Seats','Premium Seats'],['Stalls','Balcony']):
  raise ValueError('Unrecognised operator ticket table; no prices inferred')
 rows=[]
 for cells in table[1:]:
  if len(cells)!=3 or not cells[0]:raise ValueError('Incomplete ticket row')
  amounts=[]
  for cell in cells[1:]:
   if cell=='-':amounts.append(None);continue
   match=re.fullmatch(r'£\s*(\d+\.\d{2})',cell)
   if not match or not 0<float(match[1])<200:raise ValueError('Invalid ticket amount')
   amounts.append(float(match[1]))
  if all(value is None for value in amounts):raise ValueError('Ticket row has no price')
  rows.append({'label':cells[0],'amounts':amounts})
 text=' '.join(re.sub('<[^>]*>',' ',html).split())
 # Parse the operator's stated fee, rather than assuming it stays at today's amount.
 text=text.replace('&pound;','£')
 fee=re.search(r'Booking Fee of (\d+)p per ticket up to a maximum value of £(\d+\.\d{2})\. The Booking Fee for a Family ticket is £(\d+\.\d{2})',text)
 if not fee:raise ValueError('Booking fee wording changed; prices require review')
 return {'checkedAt':datetime.fromtimestamp(now,timezone.utc).isoformat(),'sourceUrl':'https://'+PRICE_HOSTS[code]+'.scottcinemas.co.uk/yourcinema','currency':'GBP','seatColumns':table[0][1:],'rows':rows,'onlineFeePerTicket':int(fee[1])/100,'onlineFeeCap':float(fee[2]),'onlineFamilyFee':float(fee[3])}

def refresh_prices(code,now):
 url='https://'+PRICE_HOSTS[code]+'.scottcinemas.co.uk/yourcinema'
 with urlopen(Request(url,headers={'User-Agent':'SpinRaidersCinemaListings/1.0'}),timeout=30) as response:
  return prices_from_html(response.read().decode('utf-8'),code,now)
def safe_url(value):
 p=urlparse(str(value or ''))
 return str(value).replace('http://','https://',1) if p.scheme in ('http','https') and (p.hostname or '').endswith('.scottcinemas.co.uk') else ''
def normalise(d,code,now):
 if d.get('cinema')!=code or not isinstance(d.get('films'),dict) or not isinstance(d.get('schedule'),dict):raise ValueError('Unexpected feed structure or cinema')
 published=datetime.strptime(d['published'],'%Y-%m-%d %H:%M:%S').replace(tzinfo=ZoneInfo('Europe/London')).timestamp()
 if now-published>6*3600 or published>now+600:raise ValueError('Stale or future source timestamp')
 rows=[]
 for screens in d['schedule'].values():
  for slots in screens.values():
   for stamp,slot in slots.items():
    starts=int(stamp);film=d['films'].get(str(slot.get('film_id',slot.get('filmid'))),{});url=safe_url(slot.get('booking_url'))
    if not(now<starts<now+90*86400) or not film.get('name') or not url:continue
    rows.append({'startsAt':datetime.fromtimestamp(starts,timezone.utc).isoformat(),'title':film['name'],'certificate':film.get('certificate',''),'minutes':film.get('minutes',''),'format':slot.get('performance_type',''),'screen':str(slot.get('screen_number','')),'subtitled':slot.get('subtitles')=='Y','audioDescription':slot.get('audio_description')=='Y','relaxed':slot.get('AFS')=='Y','wheelchairAccess':slot.get('wheelchair_access')=='Y','soldOut':slot.get('sold_out',slot.get('soldout'))=='Y','bookingUrl':url})
 rows=list({(r['startsAt'],r['bookingUrl']):r for r in rows}.values());rows.sort(key=lambda r:(r['startsAt'],r['title']))
 return {'cinema':code,'town':VENUES[code],'updatedAt':datetime.fromtimestamp(now,timezone.utc).isoformat(),'sourceUpdatedAt':datetime.fromtimestamp(published,timezone.utc).isoformat(),'source':'Scott Cinemas API','sourceUrl':safe_url(d.get('link')),'showtimes':rows}
def refresh(code):
 try:
  req=Request('https://www.scottcinemas.co.uk/json.php?cinema='+code,headers={'User-Agent':'SpinRaidersCinemaListings/1.0'})
  with urlopen(req,timeout=30) as r:d=json.load(r)
  now=time.time();out=normalise(d,code,now);OUT.mkdir(exist_ok=True);path=OUT/(code+'.json')
  price_error=None
  try:out['ticketPrices']=refresh_prices(code,now)
  except Exception as e:
   price_error=str(e)
   if path.exists():
    previous=json.loads(path.read_text(encoding='utf-8')).get('ticketPrices')
    if previous:out['ticketPrices']=previous
  tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8');tmp.replace(path)
  return {'cinema':code,'ok':True,'showtimes':len(out['showtimes']),'priceRows':len(out.get('ticketPrices',{}).get('rows',[])),'priceError':price_error}
 except Exception as e:return {'cinema':code,'ok':False,'error':str(e)}
if __name__=='__main__':
 with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(refresh,VENUES))
 print(json.dumps(results,indent=2));sys.exit(0 if all(r['ok'] for r in results) else 1)
