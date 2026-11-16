# Turn a scraped live category page (scrape_cat.js output) into a gen_cat.py config.
# usage: python3 prep_cat.py scraped.json assets.json out.json
#   assets.json: {"sizes": {uri: [w,h]}, "crops": {src_url: [new_uri,w,h]}, "icons": {key: svg_id}}
import json,sys,os,re,glob
here=os.path.dirname(os.path.abspath(__file__))
S=json.load(open(sys.argv[1])); A=json.load(open(sys.argv[2]))
PFX={'Venues':'/venue','NearbyAttractions':'/attraction','HotelGuides':'/hotel','FoodAndDrink':'/food-and-drink','ClassicFruitMachines':'/fruit-machine','Locations':'/destination','AffiliateOffers':'/offer'}
RM={}
for f in sorted(glob.glob(os.path.join(here,'..','s2data','rmchunk*.txt'))):
    for line in open(f):
        p=line.rstrip('\n').split('\t')
        if len(p)>=3 and p[0] in PFX: RM[p[2].rstrip('/')]=p[0]
STATIC={'/food-and-drink':'/where-to-eat','/retro-video-games':'/retro-arcades','/beaches':'/seaside','/?raidertube=1':'/','/food-and-drink-hub':'/where-to-eat'}
def newpath(h):
    if not h or h.startswith('http') or h.startswith('#') or h.startswith('mailto'): return h
    base,frag=(h.split('#',1)+[''])[:2]
    base=base.rstrip('/') or '/'
    if base in STATIC: out=STATIC[base]
    elif base in RM:
        segs=[x for x in base.split('/') if x]
        out=PFX[RM[base]]+'/'+'-'.join(segs[1:])
    else: out=base
    return out+('#'+frag if frag else '')
def fixhtml(h):
    h=re.sub(r'href="(/[^"]*)"',lambda m:'href="https://www.spin-raiders.com'+newpath(m.group(1))+'"',h)
    return re.sub(r'\s(class|style|data-[a-z-]+)="[^"]*"','',h)
def img(it):
    src=it.get('src') or ''
    if it.get('crop') and src in A['crops']:
        u,w,h=A['crops'][src]; return u,w,h
    u=it.get('uri'); w,h=A['sizes'].get(u,[1600,1000]); return u,w,h
hubcfg={}
for f in glob.glob(os.path.join(here,'hub_*.json')):
    j=json.load(open(f)); hubcfg[j['slug']]=j
slug=S['slug']
out_slug=sys.argv[4] if len(sys.argv)>4 else slug
C={'slug':out_slug,'title':S['title'].split('|')[0].strip(),'seo_title':S['title'],'seo_description':S.get('seo_description',''),'blocks':[]}
for b in S['blocks']:
    t=b['type']
    if t=='hero':
        w,h=A['sizes'].get(b['uri'],[2400,800])
        C['blocks'].append({'type':'hero','uri':b['uri'],'w':w,'h':h,'alt':b.get('alt') or C['title'],'search_text':b.get('search_text') or 'Search places, towns or days out…','towns':[[x,newpath(u)] for x,u in b['towns'] if x]})
    elif t=='intro': C['blocks'].append(b)
    elif t=='hero2':
        w,h=A['sizes'].get(b['uri'],[2019,1413])
        C['blocks'].append({'type':'hero2','uri':b['uri'],'w':w,'h':h,'title':b['title'],'desc':b['desc'],'pill':b.get('pill'),'sub':b.get('sub')})
    elif t=='hero3':
        w,h=A['sizes'].get(b['uri'],[1100,900])
        C['blocks'].append({'type':'hero3','uri':b['uri'],'w':w,'h':h,'alt':b.get('alt') or b['title'],'title':b['title'],'desc':b['desc'],'h2':b.get('h2'),'sub':b.get('sub'),'badge':b.get('badge'),'search':b.get('search') or 'Search a venue, town or location…'})
    elif t=='iconbtns':
        C['blocks'].append({'type':'iconbtns','items':[{'label':i['label'],'icon':A['icons'].get(i['key'],A['icons'].get('map'))} for i in b['items']]})
    elif t=='cta':
        C['blocks'].append({'type':'cta','title':b['title'],'text':b.get('text',''),'button':[b['button'][0],newpath(b['button'][1])] if b.get('button') else None})
    elif t=='strip':
        C['blocks'].append({'type':'strip','items':[{'label':i['label'],'href':newpath(i['href']),'icon':A['icons'].get(i['key'],A['icons'].get('map')),'on':i.get('on')} for i in b['items']]})
    elif t=='tiles':
        items=[]
        for i in b['items']:
            u,w,h=img(i); items.append({'label':i['label'],'href':newpath(i['href']) if i.get('href') else None,'uri':u,'w':w,'h':h})
        C['blocks'].append({'type':'tiles','title':b.get('title') or '','button':[b['button'][0],newpath(b['button'][1])] if b.get('button') else None,'items':items})
    elif t=='featured':
        items=[]
        for i in b['items']:
            u,w,h=img(i); items.append({'kicker':i['kicker'],'title':i['title'],'town':i['town'],'text':i['text'],'href':newpath(i['href']),'uri':u,'w':w,'h':h,'alt':i.get('alt') or i['title']})
        C['blocks'].append({'type':'featured','title':b['title'],'button':[b['button'][0],newpath(b['button'][1])] if b.get('button') else None,'items':items})
    elif t=='all':
        src=(hubcfg.get(slug,{}).get('sources') or [{}])[0]
        if not src.get('collection'): continue
        two=any(x['type']=='iconbtns' for x in C['blocks'])
        tops=[i['label'] for x in C['blocks'] if x['type']=='iconbtns' for i in x['items']]
        WORDS={'outdoors':'Nature|Beach|Garden|Forest|National Park|Country Park|Reserve|Countryside|Walking|Outdoor|Fishing|Fishery|Lake','agc':'Adult Gaming|AGC','arcade-bars':'Arcade Bar|Gaming Bar|Late Lounge|NQ64|Four Quarters|Pixel Bar','holiday-parks':'Holiday Park|Hotel|Camping|Caravan','bowling':'Bowling','cinemas':'Cinema|Cineworld|Odeon|Vue','bingo-halls':'Bingo','services':'Service Station|Motorway Services|Services','casinos':'Casino'}
        if two: C['blocks'].append({'words':WORDS.get(slug,''),'type':'all2','title':b['title'],'collection':src['collection'],'filter':src.get('filter'),'sub':src.get('sub') or 'town','topics':tops}); continue
        C['blocks'].append({'type':'all','title':b['title'],'button':[b['button'][0],newpath(b['button'][1])] if b.get('button') else None,'collection':src['collection'],'filter':src.get('filter'),'sub':src.get('sub') or 'town'})
    elif t=='editorial':
        if b['html'].strip(): C['blocks'].append({'type':'editorial','html':fixhtml(b['html'])})
    elif t=='promos':
        items=[]
        for i in b['items']:
            u,w,h=img(i); items.append({'uri':u,'w':w,'h':h,'alt':i.get('alt') or '','href':newpath(i['href']) if i.get('href') else None})
        C['blocks'].append({'type':'promos','items':items})
    elif t=='more':
        C['blocks'].append({'type':'more','items':[[x,newpath(u)] for x,u in b['items']]})
missing=[i for b in C['blocks'] for i in b.get('items',[]) if isinstance(i,dict) and 'uri' in i and not i['uri']]
for b in C['blocks']:
    if isinstance(b.get('items'),list): b['items']=[i for i in b['items'] if not (isinstance(i,dict) and 'uri' in i and not i['uri']) and not (isinstance(i,dict) and 'icon' in i and not i['icon'])]
C['blocks']=[b for b in C['blocks'] if not (isinstance(b.get('items'),list) and b['type'] in ('tiles','featured','promos','iconbtns','strip') and not b['items'])]
json.dump(C,open(sys.argv[3],'w'),ensure_ascii=False,indent=1)
print('ok',slug,[b['type'] for b in C['blocks']],'missing images',len(missing))
