# Rebuild assets.json after a machine reset: base crops/icons + site media named sr-icon-<key>.png / sr-tile-<n>.webp
# usage: python3 recover_assets.py scr_dir media.json assets.json
# media.json: [[displayName, id, width, height], ...]
import json,sys,os,glob,re,subprocess
d,mp,ap=sys.argv[1:4]
A=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'assets_base.json')))
A.setdefault('sizes',{}); A.setdefault('icons',{})
M=json.load(open(mp))
for name,i,w,h in M:
    m=re.match(r'sr-icon-(.+)\.png$',name)
    if m: A['icons'].setdefault(m.group(1),i)
crops=set()
for f in glob.glob(os.path.join(d,'scraped_*.json')):
    for b in json.load(open(f))['blocks']:
        for it in b.get('items',[]) if isinstance(b.get('items'),list) else []:
            if isinstance(it,dict) and it.get('crop') and it.get('src'): crops.add(it['src'])
todo=sorted(c for c in crops if c not in A['crops'])
tiles={int(re.match(r'sr-tile-(\d+)\.webp$',n).group(1)):(i,w,h) for n,i,w,h in M if re.match(r'sr-tile-\d+\.webp$',n)}
bad=0
for n,src in enumerate(todo):
    if n not in tiles: print('no tile',n); bad+=1; continue
    i,w,h=tiles[n]; m=re.search(r'w_(\d+),h_(\d+)',src)
    if m and (int(m.group(1)),int(m.group(2)))!=(w,h): print('size mismatch',n,src[-60:],w,h); bad+=1
    A['crops'][src]=[i,w,h]
json.dump(A,open(ap,'w'))
print('crops',len(A['crops']),'todo-mapped',len(todo),'tiles',len(tiles),'bad',bad,'icons',sorted(A['icons']))
