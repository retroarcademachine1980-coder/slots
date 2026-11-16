# Build cat_<out>.json for the casino offers page from tools/offers.js output. usage: python3 prep_offers.py <live slug> <out slug>
import json,re,sys,subprocess,html as H
live,out=sys.argv[1:3]
D=json.load(open('/tmp/gen/scr/offers_%s.json'%live)); A=json.load(open('/tmp/gen/assets.json'))
def logo(src):
    u,w,h=A['crops'][src]; return u,w,h
hu=re.search(r'media/([^/]+)',D['hero']['src']).group(1)
F=[]
for o in D['featured']:
    u,w,h=logo(o['logo']); F.append({**o,'uri':u,'w':w,'h':h,'alt':o.get('alt') or o['title']})
O=[]
for o in D['offers']:
    u,w,h=logo(o['logo']); O.append({**o,'uri':u,'w':w,'h':h,'alt':o.get('alt') or o['name']})
MORE=[['Theme parks','/theme-parks'],['Zoos & wildlife','/zoos'],['Museums','/museums'],['Historic places','/historical-sites'],['Beaches','/beaches'],['Piers','/piers'],['Outdoors','/outdoors'],['Hidden gems','/hidden-gems'],['Cinema','/cinemas'],['Bowling','/bowling'],['Fishing','/fishing-lakes'],['Holiday parks','/holiday-parks'],['Retro games','/retro-video-games'],['Arcade bars','/arcade-bars'],['Adult gaming centres','/agc'],['Fruit Machine Archive','/classic-fruit-machines'],['Offers','/offers'],['Plan a trip','/plan-a-trip'],['Fuel prices','/plan-a-trip#fuel-prices']]
b={'type':'casinooffers','hero':{'uri':hu,'w':D['hero']['w'],'h':D['hero']['h'],'alt':D['hero']['alt']},'h1':D['h1'],'featTitle':D['featTitle'],'featText':D['featText'],'featured':F,
   'why':D['why'],'whyTitle':D['whyTitle'],'resp':D['resp'],'allTitle':D['allTitle'],'allText':D['allText'],'offers':O}
page=subprocess.run(['curl','-sL','https://www.spin-raiders.com/'+live],capture_output=True,text=True).stdout
t=H.unescape(re.search(r'<title>(.*?)</title>',page,re.S).group(1).strip())
d=re.search(r'<meta name="description" content="([^"]*)"',page); d=H.unescape(d.group(1)) if d else ''
C={'slug':out,'title':t.split('|')[0].strip(),'seo_title':t,'seo_description':d,'blocks':[b,{'type':'more','items':MORE}]}
json.dump(C,open('/tmp/gen/cat_%s.json'%out,'w'),ensure_ascii=False,indent=1)
print(out,'|',t,'| featured',len(F),'offers',len(O),'| affiliate',[o['go']['href'][:40] for o in O])
