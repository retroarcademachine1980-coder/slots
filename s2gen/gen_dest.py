# Destination (town) page generator copying the live spin-raiders.com place page:
# crumbs, photo + info card (chip, title, town, hero text, rating box, lede), guide article + aside link,
# "Make a day of it" box and "Explore more days out" links.
# usage: python3 gen_place.py '<page dir glob>' '<config.json>'
#   config: {"fields": {"title","town","image","lede"}, "chip_fallback": "..."}
import json,sys,re,os,glob
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import helpers as H
TP='{ from: useTownPlaces }'
from helpers import rule,gi,fill,section,grid_ic,lay,sty
cfg=json.loads(open(sys.argv[2]).read()); F=cfg['fields']
page_dir=glob.glob(sys.argv[1])[0]
S=open(os.path.join(page_dir,'structure.jsx')).read()
L=open(os.path.join(page_dir,'layout.css')).read()
pid=re.search(r'<Page\s+id="([^"]+)"',S).group(1)
hdr=re.search(r'<Header_\w+ id="([^"]+)"',S).group(1); ftr=re.search(r'<Footer_\w+ id="([^"]+)"',S).group(1)
pbg=re.search(r'backgroundLayer=\{\[<Background id="([^"]+)"',S[S.index('<Page'):]).group(1)
prov=re.search(r'<(CmsPageProvider_\w+)>',S).group(1)
SITE='https://www.spin-raiders.com'
INK='#102744'; GREY='#536981'; BLUEL='#EEF6FF'; WHITE='#FFFFFF'; LINK='#1A5FB4'
def esc(s): return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
def ph(i,h): return {"id":"dataItem-"+i,"type":"Builder.RichText","html":h}
def rt(i,h): return f'<WRichText id="{i}" className="{i}" richText={{{json.dumps(ph(i,h),ensure_ascii=False)}}} />'
def btxt(i,field,phh): return f'<WRichText id="{i}" className="{i}" richText={{fn(textToRichText, ctx({json.dumps("currentItem.fields."+field+".value")}, {{ from: useCmsContext }}), {{ placeholder: {json.dumps(ph(i,phh),ensure_ascii=False)} }})}} />'
def brich(i,field,phh): return f'<WRichText id="{i}" className="{i}" richText={{ctx({json.dumps("currentItem.fields."+field+".value")}, {{ from: useCmsContext, placeholder: {json.dumps(ph(i,phh),ensure_ascii=False)} }})}} />'
def lnk(href): return {"target":"_self","href":href if href.startswith('http') else SITE+href,"rel":"noreferrer noopener"}
def sbtn(i,label,href): return f'<Button id="{i}" className="{i}" label={{{json.dumps(label,ensure_ascii=False)}}} link={{{json.dumps(lnk(href))}}} />'
def bbtn(i,label,field): return f'<Button id="{i}" className="{i}" label={{{json.dumps(label,ensure_ascii=False)}}} link={{ctx({json.dumps("currentItem.fields."+field+".value")}, {{ from: useCmsContext }})}} />'
PHU='3a517e_c00db68d44ed453e96b9547639584056~mv2.jpg'
IMGPH="{ name: 'place', uri: '"+PHU+"', width: 2752, height: 1100, alt: '', type: 'Builder.Image', url: media.getCroppedImageUrl('wix:image://v1/"+PHU+"/place#originWidth=2752&originHeight=1100', 0, 0, 0, 0, 2752, 1100, { name: 'place', autoEncode: true, devicePixelRatio: 1 }) }"
def bimg(i,field): return f'<Image id="{i}" className="{i}" displayMode={{"fill"}} image={{ctx({json.dumps("currentItem.fields."+field+".value")}, {{ from: useCmsContext, placeholder: {IMGPH} }})}} />'
def bgc(i): return f'<Background id="{i}" className="{i}" />'
def box(i,kids): return f'<BoxContainer id="{i}" className="{i}" children={{\n<InternalContainer id="{i}-ic" className="{i}-ic" backgroundLayer={{[{bgc(i+"-bg")}]}}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n} />'
def sec(i,kids): return f'<Section id="{i}" className="{i}">\n<InternalContainer id="{i}-ic" className="{i}-ic" backgroundLayer={{[{bgc(i+"-bg")}]}}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n</Section>'
def font(i,size,weight,color,lh=1.4,fam='inter',sizem=None,upper=False,align=None):
    sty.append(f'.{i} {{\n    font: normal normal {weight} --spx({size})/{lh}em {fam};\n    color: {color};\n'+('    text-transform: uppercase;\n' if upper else '')+(f'    text-align: {align};\n' if align else '')+'}')
def boxgrid(i,cd,rd,cm,rm,pd,pm,gd=(0,0),gm=(0,0),color=None,radius=0,shadow=None):
    g=grid_ic(i,cd,rd,cm,rm,pd,pm,gd,gm)
    rule(i+'-ic','min-width: --spx(0);','min-width: --spx(0);',ic=g[0],icm=g[1])
    H.bglay(i+'-bg'); fill(i+'-bg',color or 'transparent')
    s=f'.{i}-ic {{\n'
    if radius: s+=''.join(f'    --border{k}Radius: {radius}px;\n' for k in ['StartStart','StartEnd','EndStart','EndEnd'])
    if shadow: s+=f'    --boxShadow: {shadow};\n'
    if s.count('\n')>1: sty.append(s+'}')
def pill(i,bg,fg,size=14,r=999,pad=(9,16),border=None,weight=700):
    b=''.join(f'    {k}: {border};\n' for k in ['border-top','border-bottom','border-inline-start','border-inline-end']) if border else ''
    sty.append(f'.{i} {{\n    --preset: baseButton;\n    background: {bg};\n'+b+''.join(f'    border-{k}-radius: {r}px;\n' for k in ['start-start','start-end','end-start','end-end'])+f'    padding-top: {pad[0]}px;\n    padding-bottom: {pad[0]}px;\n    padding-inline-start: {pad[1]}px;\n    padding-inline-end: {pad[1]}px;\n    --content-horizontal-alignment: start;\n}}\n.{i} .label {{\n    font: normal normal {weight} --spx({size})/1.3em inter;\n    color: {fg};\n}}')
NOB='0px solid transparent'
secs=[]
NAVY='#0B2545'; YEL='#FFE455'; T2='#243B55'
def ptxt(i,key,phh): return f'<WRichText id="{i}" className="{i}" richText={{fn(textToRichText, ctx({json.dumps(key)}, {TP}), {{ placeholder: {json.dumps(ph(i,phh),ensure_ascii=False)} }})}} />'
# ---- s1 town photo banner, fuel link, search, quick towns
CH=[('Blackpool','/destination/blackpool'),('Skegness','/destination/skegness'),('Great Yarmouth','/destination/great-yarmouth'),('Southend','/destination/southend-on-sea'),('Hotels','/places-to-stay'),('Arcades','/arcade')]
secs.append(sec('s1',[bimg('h-img','heroImage'),sbtn('h-fuel','Compare local fuel prices ↓','/plan-a-trip#fuel-prices'),box('h-sb',[sbtn('h-q','Search for a town, venue or attraction…','/search'),sbtn('h-go','Search →','/search')])]+[sbtn(f'h-c{n}',t,u) for n,(t,u) in enumerate(CH)]))
NC=len(CH)
section('s1',2,grid_ic('s1-ic','minmax(0px, 1fr) '+' '.join(['max-content']*NC)+' minmax(0px, 1fr)','minmax(0px, 1fr) auto auto auto','minmax(0px, 1fr) minmax(0px, 1fr) minmax(0px, 1fr)','minmax(0px, 1fr) auto auto auto auto',(0,0,0),(0,0,0),(8,14),(8,10)),minh=700,minhm=440)
fill('s1-bg','#103958')
gi('h-img','1 / 5',f'1 / {NC+3}','1 / 6','1 / 4',h='100%',hm='100%',a='stretch',am='stretch')
gi('h-fuel','2 / 3',f'2 / {NC+2}','2 / 3','1 / 4',w='auto',wm='auto',j='center',jm='center'); pill('h-fuel',YEL,NAVY,size=17,r=999,pad=(12,20),border=NOB,weight=800)
gi('h-sb','3 / 4',f'1 / {NC+3}','3 / 4','1 / 4',w='--spx(1050)',wm='calc(100% - --spx(24))',j='center',jm='center')
boxgrid('h-sb','minmax(0px, 1fr) max-content','auto','minmax(0px, 1fr) max-content','auto',(6,8),(6,6),(10,0),(6,0),color='rgba(11, 37, 69, 0.55)',radius=12)
gi('h-q','1 / 2','1 / 2','1 / 2','1 / 2'); pill('h-q',WHITE,'#5B6B80',size=19,r=8,pad=(10,14),border=NOB,weight=400)
gi('h-go','1 / 2','2 / 3','1 / 2','2 / 3',w='auto',wm='auto',a='center',am='center'); pill('h-go','transparent',WHITE,size=16,r=8,pad=(10,12),border=NOB,weight=700)
for n in range(NC):
    gi(f'h-c{n}','4 / 5',f'{n+2} / {n+3}',f'{4+n//3} / {5+n//3}',f'{n%3+1} / {n%3+2}',w='auto',wm='100%',j='center',jm='stretch')
    pill(f'h-c{n}','rgba(0, 51, 84, 0.87)',WHITE,size=13,r=999,pad=(6,12),border=NOB,weight=500)
# ---- s2 category tabs
TB=[('All Results','/search'),('Attractions & Family Fun','/attractions'),('Eat & Drink','/where-to-eat'),('Places to Stay','/places-to-stay'),('Nature & Outdoors','/outdoors'),('Cinemas','/cinemas'),('Fishing Lakes','/fishing-lakes')]
secs.append(sec('s2',[sbtn(f't{n}',t,u) for n,(t,u) in enumerate(TB)]))
section('s2',3,grid_ic('s2-ic',' '.join(['minmax(0px, 1fr)']*len(TB)),'auto','minmax(0px, 1fr) minmax(0px, 1fr)',' '.join(['auto']*4),(10,20,10),(10,12,10),(8,0),(8,8)))
fill('s2-bg',WHITE)
for n in range(len(TB)):
    gi(f't{n}','1 / 2',f'{n+1} / {n+2}',f'{n//2+1} / {n//2+2}',f'{n%2+1} / {n%2+2}',h='--spx(78)',hm='--spx(56)',a='stretch',am='stretch')
    pill(f't{n}',YEL if n==0 else WHITE,'#070E53',size=13,r=10,pad=(8,10),border='1px solid #D2E2F6',weight=700)
    sty.append(f'.t{n} {{\n    --content-horizontal-alignment: center;\n}}')
# ---- s3 town guide
secs.append(sec('s3',[ptxt('g-h','welcome','<h2>Welcome</h2>'),btxt('g-intro','pageIntro','<p>&nbsp;</p>'),brich('g-body','overview','<p>&nbsp;</p>')]))
section('s3',4,grid_ic('s3-ic','minmax(0px, 1fr) --spx(172)','auto auto auto','minmax(0px, 1fr)','auto auto auto',(44,68,30),(26,16,20),(0,22),(0,14)))
fill('s3-bg',WHITE)
gi('g-h','1 / 2','1 / 2','1 / 2','1 / 2'); font('g-h',51,900,NAVY,lh=1.15)
gi('g-intro','2 / 3','1 / 2','2 / 3','1 / 2'); font('g-intro',20,500,'#0B1F3A',lh=1.55)
gi('g-body','3 / 4','1 / 2','3 / 4','1 / 2'); font('g-body',18,400,T2,lh=1.75)
# ---- s4 start with the fun
secs.append(sec('s4',[box('f-box',[box('f-hb',[ptxt('f-h','funHeading','<h2>Start with the fun</h2>')]),
    rt('f-p','<p>What gets everyone excited about the trip? Choose your main attraction first, give it time, and leave a little room for a wander. Open a photograph to see what is waiting inside.</p>'),
    box('f-card',[f'<Image id="f-img" className="f-img" displayMode={{"fill"}} image={{ctx("stopImage", {TP})}} />',ptxt('f-t','stopTitle','<h3>Main attraction</h3>'),ptxt('f-s','stopText','<p>&nbsp;</p>'),
        f'<Button id="f-go" className="f-go" label={{"Come inside — read the guide →"}} link={{ctx("stopLink", {TP})}} />']),
    sbtn('f-more','Explore more things to do ↓','/attractions')])]))
section('s4',5,grid_ic('s4-ic','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(10,68,30),(10,16,20),(0,0),(0,0)))
fill('s4-bg',WHITE)
gi('f-box','1 / 2','1 / 2','1 / 2','1 / 2')
boxgrid('f-box','--spx(347) minmax(0px, 1fr)','auto auto auto auto','minmax(0px, 1fr)','auto auto auto auto',(32,28),(22,16),(24,18),(0,14),color='#E5FAFF',radius=18)
gi('f-hb','1 / 2','1 / 3','1 / 2','1 / 2',w='auto',wm='100%')
boxgrid('f-hb','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(12,18),(10,14),color=NAVY,radius=12)
gi('f-h','1 / 2','1 / 2','1 / 2','1 / 2'); font('f-h',38,900,WHITE,lh=1.15)
gi('f-p','2 / 3','1 / 3','2 / 3','1 / 2',w='--spx(950)',wm='100%'); font('f-p',17,400,T2,lh=1.6)
gi('f-card','3 / 4','1 / 2','3 / 4','1 / 2')
boxgrid('f-card','minmax(0px, 1fr)','--spx(231) auto auto auto','minmax(0px, 1fr)','--spx(200) auto auto auto',(0,0,22),(0,0,18),(0,12),(0,10),color=WHITE,radius=14,shadow='0px 6px 18px rgba(11, 37, 69, 0.12)')
rule('f-img','width: 100%;\nheight: 100%;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;\nposition: relative;','width: 100%;\nheight: 100%;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;')
for k,(i,r) in enumerate([('f-t',2),('f-s',3),('f-go',4)]):
    gi(i,f'{r} / {r+1}','1 / 2',f'{r} / {r+1}','1 / 2',w='calc(100% - --spx(44))' if i!='f-go' else 'auto',wm='calc(100% - --spx(36))' if i!='f-go' else 'auto',j='center',jm='center')
font('f-t',26,900,NAVY,lh=1.2); font('f-s',16,400,NAVY,lh=1.6)
pill('f-go',YEL,NAVY,size=15,r=6,pad=(6,10),border=NOB,weight=700)
gi('f-more','4 / 5','1 / 3','4 / 5','1 / 2',w='auto',wm='100%'); pill('f-more','#FFE05B',NAVY,size=17,r=10,pad=(16,20),border=NOB,weight=800)
# ---- s5 places list + plan panel
card_kids=['<Image id="al-img" className="al-img" displayMode={"fill"} image={item.image} />',
    f'<WRichText id="al-t" className="al-t" richText={{fn(textToRichText, item.title, {{ placeholder: {json.dumps(ph("al-t","<h4>Place</h4>"))} }})}} />',
    f'<WRichText id="al-s" className="al-s" richText={{fn(textToRichText, item.town, {{ placeholder: {json.dumps(ph("al-s","<p>Town</p>"))} }})}} />',
    f'<WRichText id="al-r" className="al-r" richText={{fn(textToRichText, item.rating, {{ placeholder: {json.dumps(ph("al-r","<p>&nbsp;</p>"))} }})}} />',
    '<Button id="al-b" className="al-b" label={"View details →"} link={item.link} />']
rep=(f'<Repeater id="al-rep" className="al-rep" items={{ctx("pageItems", {TP})}} renderItem={{item => (\n'
     f'<InternalContainer id="al-card" className="al-card" backgroundLayer={{[{bgc("al-card-bg")}]}}>\n'+'\n'.join(card_kids)+'\n</InternalContainer>\n)}\n'
     f'emptyStateContent={{<InternalContainer id="al-empty" className="al-empty" />}} />')
secs.append(sec('s5',[ptxt('l-n','countText','<p>&nbsp;</p>'),ptxt('l-h','listHeading','<h2>Things to do</h2>'),rep,
    f'<Button id="l-prev" className="l-prev" label={{"← Previous"}} onClick={{callback(ctx("prevPage", {TP}))}} />',
    ptxt('l-pg','pageText','<p>&nbsp;</p>'),
    f'<Button id="l-next" className="l-next" label={{"Next →"}} onClick={{callback(ctx("nextPage", {TP}))}} />',
    box('l-map',[rt('l-map-h','<h2>⌖ Area map</h2>'),bbtn('l-map-b','View larger map →','googleMapsUrl')]),
    box('l-plan',[ptxt('l-plan-h','planHeading','<h2>Plan more</h2>'),rt('l-plan-p','<p>Bring together places to visit, food and drink, and somewhere to stay.</p>'),sbtn('l-plan-b','Plan your day →','/plan-a-trip')]),
    sbtn('l-blog','Search articles and blog posts →','/search')]))
Q='minmax(0px, 1fr)'
section('s5',6,grid_ic('s5-ic',f'{Q} {Q} {Q} --spx(241)','auto auto auto auto minmax(0px, 1fr) auto',Q,'auto auto auto auto auto auto auto',(40,68,30),(24,16,24),(14,12),(0,12)))
fill('s5-bg',WHITE)
gi('l-n','1 / 2','1 / 4','1 / 2','1 / 2'); font('l-n',16,400,'#0047B2',lh=1.3)
gi('l-h','2 / 3','1 / 4','2 / 3','1 / 2'); font('l-h',18,700,'#080E53',lh=1.3)
gi('al-rep','3 / 6','1 / 4','3 / 4','1 / 2',a='start',am='start')
gi('l-prev','6 / 7','1 / 2','4 / 5','1 / 2',w='auto',wm='auto'); pill('l-prev',WHITE,INK,size=14,r=6,pad=(9,16),border='1px solid #D2E2F6',weight=700)
gi('l-pg','6 / 7','2 / 3','4 / 5','1 / 2',a='center',am='center',j='center',jm='center'); font('l-pg',13,600,GREY,lh=1.3,align='center')
gi('l-next','6 / 7','3 / 4','4 / 5','1 / 2',w='auto',wm='auto',j='end',jm='end'); pill('l-next',WHITE,INK,size=14,r=6,pad=(9,16),border='1px solid #D2E2F6',weight=700)
gi('l-map','3 / 4','4 / 5','5 / 6','1 / 2')
boxgrid('l-map','minmax(0px, 1fr) max-content','auto','minmax(0px, 1fr) max-content','auto',(12,10),(12,12),(8,0),(8,0),color=WHITE,radius=10,shadow='0px 0px 0px 1px #D2E2F6')
gi('l-map-h','1 / 2','1 / 2','1 / 2','1 / 2',a='center',am='center'); font('l-map-h',20,800,'#080E53',lh=1.2)
gi('l-map-b','1 / 2','2 / 3','1 / 2','2 / 3',w='auto',wm='auto',a='center',am='center'); pill('l-map-b','transparent','#006BFF',size=12,r=0,pad=(0,0),border=NOB,weight=400)
gi('l-plan','4 / 5','4 / 5','6 / 7','1 / 2')
boxgrid('l-plan','minmax(0px, 1fr)','auto auto auto','minmax(0px, 1fr)','auto auto auto',(16,16),(16,16),(0,12),(0,10),color='#EAF6FF',radius=10)
gi('l-plan-h','1 / 2','1 / 2','1 / 2','1 / 2'); font('l-plan-h',25,800,'#080E53',lh=1.15)
gi('l-plan-p','2 / 3','1 / 2','2 / 3','1 / 2'); font('l-plan-p',15,400,'#080E53',lh=1.5)
gi('l-plan-b','3 / 4','1 / 2','3 / 4','1 / 2',w='auto',wm='auto'); pill('l-plan-b','#FFDF28','#07144A',size=16,r=8,pad=(12,14),border=NOB,weight=700)
gi('l-blog','7 / 8','1 / 4','7 / 8','1 / 2',w='auto',wm='auto') if False else gi('l-blog','6 / 7','4 / 5','7 / 8','1 / 2',w='auto',wm='auto',a='center',am='start')
pill('l-blog','transparent','#006BFF',size=14,r=0,pad=(0,0),border=NOB,weight=400)
sty.append('.al-rep {\n    --spx-ref-width: 1280;\n    --spx-resolver-type: scale;\n    --preset: grid;\n    --column-count: 3;\n    --column-min-width: --spx(200);\n    --row-gap: --spx(18);\n    --column-gap: --spx(14);\n    --background-color: transparent;\n}')
rule('al-card','min-width: --spx(0);','min-width: --spx(0);',ic='display: flex;\nflex-direction: column;\npadding-top: --spx(0);\npadding-right: --spx(0);\npadding-bottom: --spx(14);\npadding-left: --spx(0);',icm='display: flex;\nflex-direction: column;\npadding-top: --spx(0);\npadding-right: --spx(0);\npadding-bottom: --spx(12);\npadding-left: --spx(0);')
H.bglay('al-card-bg'); fill('al-card-bg','#E8F3FA')
sty.append('.al-card {\n'+''.join(f'    --border{k}Radius: 10px;\n' for k in ['StartStart','StartEnd','EndStart','EndEnd'])+'}')
for o,i in enumerate(['al-img','al-t','al-s','al-r','al-b']):
    if i=='al-img': rule(i,'width: 100%;\naspect-ratio: 5 / 4;\nmin-width: 0px;\norder: 1;\nposition: relative;\nmargin-bottom: --spx(10);','width: 100%;\naspect-ratio: 5 / 4;\nmin-width: 0px;\norder: 1;\nmargin-bottom: --spx(10);')
    else:
        mb='' if i=='al-b' else '\nmargin-bottom: --spx(4);'
        w='auto' if i=='al-b' else 'calc(100% - --spx(20))'
        rule(i,f'width: {w};\nheight: auto;\nmin-width: 0px;\norder: {o+1};\nposition: relative;\nmargin-left: --spx(10);\nmargin-right: --spx(10);'+mb,f'width: {w};\nheight: auto;\nmin-width: 0px;\norder: {o+1};\nmargin-left: --spx(12);\nmargin-right: --spx(12);'+mb)
font('al-t',18,800,'#080E53',lh=1.2); font('al-s',13,400,'#12347B',lh=1.3); font('al-r',13,400,'#12347B',lh=1.3)
pill('al-b','transparent','#006BFF',size=13,r=0,pad=(2,0),border=NOB,weight=600)
rule('al-empty','min-width: --spx(0);','min-width: --spx(0);',ic='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: minmax(--spx(40), auto);',icm='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: minmax(--spx(40), auto);')
# ---- s6 fuel for the journey (live town fuel prices, from the trip builder component)
secs.append(sec('s6',['<TripBuilder id="fz" className="fz" mode={"fuel"} town={ctx("currentItem.fields.title.value", { from: useCmsContext })} />']))
section('s6',7,grid_ic('s6-ic','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(10,20,30),(10,12,20),(0,0),(0,0)))
fill('s6-bg',WHITE)
gi('fz','1 / 2','1 / 2','1 / 2','1 / 2')
# ---- s7 more ways to spend your day (live list)
EX=[('Theme parks','/theme-parks'),('Zoos & wildlife','/zoos'),('Museums','/museums'),('Historic places','/historical-sites'),('Beaches','/beaches'),('Piers','/piers'),('Outdoors','/outdoors'),('Hidden gems','/hidden-gems'),('Cinema','/cinemas'),('Bowling','/bowling'),('Fishing','/fishing-lakes'),('Holiday parks','/holiday-parks'),('Retro games','/retro-video-games'),('Arcade bars','/arcade-bars'),('Adult gaming centres','/agc'),('Fruit Machine Archive','/classic-fruit-machines'),('Offers','/offers'),('Plan a trip','/plan-a-trip'),('Fuel prices','/plan-a-trip#fuel-prices')]
secs.append(sec('s7',[rt('x-h','<h2>More ways to spend your day</h2>')]+[sbtn(f'x{n}',t,u) for n,(t,u) in enumerate(EX)]))
C=4; R=(len(EX)+C-1)//C; CM=2; RM=(len(EX)+CM-1)//CM
section('s7',8,grid_ic('s7-ic',' '.join([Q]*C),' '.join(['auto']*(R+1)),' '.join([Q]*CM),' '.join(['auto']*(RM+1)),(24,24,40),(18,16,30),(32,6),(8,6)))
fill('s7-bg','#F5F9FD')
gi('x-h','1 / 2',f'1 / {C+1}','1 / 2',f'1 / {CM+1}'); font('x-h',27,900,'#0B192C',lh=1.2)
for n in range(len(EX)):
    gi(f'x{n}',f'{n//C+2} / {n//C+3}',f'{n%C+1} / {n%C+2}',f'{n//CM+2} / {n//CM+3}',f'{n%CM+1} / {n%CM+2}',w='100%',wm='100%')
    pill(f'x{n}','transparent','#174B7C',size=14,r=0,pad=(8,0),border=NOB,weight=500)
# wrap every section after the banner in the town provider
NS=7
# ---- write
def keep(ids):
    o=[]
    for i in ids:
        m=re.search(r'\n?\.'+re.escape(i)+r' \{.*?\n\}',L[:L.index('@media')],re.S); o.append(m.group(0).strip())
    return '\n'.join(o)
base=keep([pid,hdr,ftr,pbg])
base=re.sub(r'(\.'+re.escape(pid)+r' \{.*?grid-template-rows: )[^;\n]*',r'\1'+' '.join(['auto']*(NS+2)),base,flags=re.S)
base=re.sub(r'(\.'+re.escape(ftr)+r' \{.*?grid-row: )[^;\n]*',r'\g<1>'+f'{NS+2} / {NS+3}',base,flags=re.S)
head=S[:S.index('export const Structure')]
need=["import TownPlaces, { useTownPlaces } from '@site/site-code/townPlaces'","import TripBuilder from '@site/site-code/TripBuilder'","import { Repeater } from '@origami-wrappers/wixEditorElements/repeater'","import { Button } from '@origami-wrappers/wixEditorElements/button'","import { Image } from '@origami-wrappers/wixEditorElements/image'","import { BoxContainer } from '@origami-wrappers/wixEditorElements/boxcontainer'","import { WRichText } from '@origami-wrappers/wixEditorElements/wrichtext'","import { media } from '@wix/sdk'"]
hl=[l for l in head.split('\n') if not any(x in l for x in ['/line\'','/svgimage\'','{ svg }'])]
hl=[l for l in hl if 'townPlaces' not in l and 'TripBuilder' not in l and '/repeater\'' not in l]
for n_ in need:
    if not any(n_.split(' from ')[1] in l for l in hl): hl.append(n_)
hl=[("import { callback, ctx, fn } from '@wix/origami-runtime'" if "'@wix/origami-runtime'" in l else l) for l in hl]
head='\n'.join(hl).rstrip()+'\n\n'
pg=S[S.index('export const Structure'):S.index('<Section id=')]
pg='\n'.join(l for l in pg.split('\n') if '<TownPlaces' not in l)
pg=pg.replace(f'<{prov}>',f'<{prov}>\n<TownPlaces town={{ctx("currentItem.fields.title.value", {{ from: useCmsContext }})}} pageSize={{6}}>',1)
out=head+pg+'\n'.join(secs)+f'\n        </Page>\n</TownPlaces>\n    </{prov}>\n)\n'
open(os.path.join(page_dir,'structure.jsx'),'w').write(out)
def ref(w): return f'    --spx-ref-width: {w};\n    --spx-resolver-type: scale;\n'
o=[];om=[]
for sel,d,m,ic,icm in lay:
    body=ref(1280)+''.join('    '+l+'\n' for l in d.split('\n') if l)
    if ic: body+='    @origami-target internal-container-content-wrapper {\n'+''.join('        '+l+'\n' for l in ic.split('\n'))+'    }\n'
    o.append(f'.{sel} {{\n{body}}}')
    bm=ref(375)+''.join('    '+l+'\n' for l in (m or '').split('\n') if l)
    if icm: bm+='    @origami-target internal-container-content-wrapper {\n'+''.join('        '+l+'\n' for l in icm.split('\n'))+'    }\n'
    om.append('    '+f'.{sel} {{\n{bm}}}'.replace('\n','\n    '))
mq=re.search(r'@media \([^)]*\)',L).group(0)
open(os.path.join(page_dir,'layout.css'),'w').write(base+'\n'+'\n'.join(o)+'\n'+mq+' {\n'+'\n'.join(om)+'\n}\n')
open(os.path.join(page_dir,'style.css'),'w').write('\n'.join(sty)+'\n')
un=json.load(open(os.path.join(page_dir,'unmapped.json')))
comps={k:v for k,v in un.get('components',{}).items() if k in (hdr,ftr)}
un['components']=comps; json.dump(un,open(os.path.join(page_dir,'unmapped.json'),'w'),indent=4,ensure_ascii=False)
print('ok',page_dir,prov,len(out))
