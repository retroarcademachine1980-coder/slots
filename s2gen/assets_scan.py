# Scan scraped_*.json: measure every non-crop image, list crop srcs still to import and icon keys still to upload.
# usage: python3 assets_scan.py scr_dir assets.json   (assets.json is created/updated in place)
import json,sys,os,glob,io,urllib.request
d,ap=sys.argv[1],sys.argv[2]
A=json.load(open(ap)) if os.path.exists(ap) else {'sizes':{},'crops':{},'icons':{}}
try:
    from PIL import Image
except ImportError:
    os.system('pip install -q --break-system-packages pillow >/dev/null 2>&1'); from PIL import Image
uris=set(); crops=set(); icons={}
for f in glob.glob(os.path.join(d,'scraped_*.json')):
    S=json.load(open(f))
    for b in S['blocks']:
        if b['type']=='hero' and b.get('uri'): uris.add(b['uri'])
        for it in b.get('items',[]) if isinstance(b.get('items'),list) else []:
            if isinstance(it,dict) and it.get('src'):
                if it.get('crop'): crops.add(it['src'])
                elif it.get('uri'): uris.add(it['uri'])
for f in glob.glob(os.path.join(d,'icons_*.json')): icons.update(json.load(open(f)))
for u in sorted(uris):
    if u in A['sizes']: continue
    try:
        data=urllib.request.urlopen(urllib.request.Request('https://static.wixstatic.com/media/'+u,headers={'User-Agent':'Mozilla/5.0'}),timeout=60).read()
        A['sizes'][u]=list(Image.open(io.BytesIO(data)).size)
    except Exception as e: print('size fail',u,str(e)[:60])
json.dump(A,open(ap,'w'))
todo_c=sorted(c for c in crops if c not in A['crops'])
todo_i={k:v for k,v in icons.items() if k not in A['icons']}
json.dump({'crops':todo_c,'icons':todo_i},open(os.path.join(d,'todo.json'),'w'))
print('sizes',len(A['sizes']),'crops todo',len(todo_c),'icons todo',list(todo_i))
