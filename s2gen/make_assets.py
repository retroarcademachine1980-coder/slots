# assets.json = assets_base.json + assets_extra.json (+ sr-icon-* ids from /tmp/gen/media.json when present)
import json,os,re
h=os.path.dirname(os.path.abspath(__file__))
A=json.load(open(os.path.join(h,'assets_base.json'))); A.setdefault('sizes',{}); A.setdefault('icons',{}); A.setdefault('crops',{})
X=json.load(open(os.path.join(h,'assets_extra.json')))
A['crops'].update(X.get('crops',{})); A['sizes'].update(X.get('sizes',{}))
mp=os.path.join(h,'media.json')
if os.path.exists(mp):
    for name,i,w,hh in json.load(open(mp)):
        m=re.match(r'sr-icon-(.+)\.png$',name)
        if m: A['icons'].setdefault(m.group(1),i)
json.dump(A,open(os.path.join(h,'assets.json'),'w'))
print('assets crops',len(A['crops']),'sizes',len(A['sizes']),'icons',len(A['icons']))
