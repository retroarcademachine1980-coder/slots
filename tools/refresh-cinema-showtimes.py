"""Refresh only operator-authorised Scott Cinema feeds; never modify reviews or CMS."""
import json,time,sys
from pathlib import Path
from datetime import datetime,timezone
from zoneinfo import ZoneInfo
from urllib.request import urlopen,Request
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor
VENUES={'SCOBAR':'Barnstaple','SCONEW':'Newton Abbot','SCORAD':'Sidmouth','SCOBWR':'Bridgwater','SCOEXM':'Exmouth','SCOORP':'Bristol'}
OUT=Path(__file__).resolve().parents[1]/'dist/cinema-showtimes'
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
  out=normalise(d,code,time.time());OUT.mkdir(exist_ok=True);path=OUT/(code+'.json');tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n');tmp.replace(path)
  return {'cinema':code,'ok':True,'showtimes':len(out['showtimes'])}
 except Exception as e:return {'cinema':code,'ok':False,'error':str(e)}
if __name__=='__main__':
 with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(refresh,VENUES))
 print(json.dumps(results,indent=2));sys.exit(0 if all(r['ok'] for r in results) else 1)
