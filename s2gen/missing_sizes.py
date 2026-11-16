# Print image uris in scraped pages that assets.json has no size for. usage: python3 missing_sizes.py slug ...
import json,sys
A=json.load(open('/tmp/gen/assets.json')); miss=set()
def walk(o):
    if isinstance(o,dict):
        u=o.get('uri')
        if u and not o.get('crop') and u not in A['sizes']: miss.add(u)
        for v in o.values(): walk(v)
    elif isinstance(o,list):
        for v in o: walk(v)
for s in sys.argv[1:]: walk(json.load(open('/tmp/gen/scr/scraped_%s.json'%s)))
print(json.dumps(sorted(miss)))
