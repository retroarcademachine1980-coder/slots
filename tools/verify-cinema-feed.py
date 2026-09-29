import importlib.util,time
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path
s=importlib.util.spec_from_file_location('feed',Path(__file__).with_name('refresh-cinema-showtimes.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
now=time.time();d={'cinema':'SCOBAR','published':datetime.fromtimestamp(now,ZoneInfo('Europe/London')).strftime('%Y-%m-%d %H:%M:%S'),'films':{'1':{'name':'Test film','certificate':'PG'}},'schedule':{'day':{'1':{str(int(now+3600)):{'film_id':'1','booking_url':'https://barnstaple.scottcinemas.co.uk/book-now/test/1'},str(int(now-60)):{'film_id':'1','booking_url':'https://barnstaple.scottcinemas.co.uk/book-now/test/2'},str(int(now+7200)):{'film_id':'1','booking_url':'https://evil.example/book'}}}},'link':'http://barnstaple.scottcinemas.co.uk/nowshowing'}
r=m.normalise(d,'SCOBAR',now);assert len(r['showtimes'])==1;assert r['sourceUrl'].startswith('https:')
d['published']='2020-01-01 00:00:00'
try:m.normalise(d,'SCOBAR',now);raise AssertionError('accepted stale data')
except ValueError:pass
assert m.safe_url('https://scottcinemas.co.uk.evil.example/film')==''
print('PASS expired screenings, stale source rejection, official booking host allowlist and UK timestamps')
