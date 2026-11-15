import json,sys,re,os,glob,shutil,hashlib
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import helpers as H
from helpers import rule,gi,txt,card,cbtn,fill,section,grid_ic,stack,stackkids,lay,sty,NAVY,WHITE,PINK,YEL,CYAN,LIGHT,BLUE
LB=sys.argv[1]; PRESET=os.environ.get('REP_PRESET','cards'); PAGES=sys.argv[2]; hub=json.loads(open(sys.argv[3]).read())
slug=hub['slug']
S=open(os.path.join(LB,'structure.jsx')).read(); L=open(os.path.join(LB,'layout.css')).read()
oldpid=re.search(r'<Page\s+id="([^"]+)"',S).group(1)
hdr=re.search(r'<Header_\w+ id="([^"]+)"',S).group(1); ftr=re.search(r'<Footer_\w+ id="([^"]+)"',S).group(1)
pbg=re.search(r'backgroundLayer=\{\[<Background id="([^"]+)"',S[S.index('<Page'):]).group(1)
pid='h'+hashlib.md5(slug.encode()).hexdigest()[:4]
ROLES={'Venues':'w1piy7m','NearbyAttractions':'v25olth','HotelGuides':'rchxpjc','FoodAndDrink':'ar5gsd0','ClassicFruitMachines':'28pp9fa','Locations':'z42qzjc'}
PFX={'Venues':'/venue','NearbyAttractions':'/attraction','HotelGuides':'/hotel','FoodAndDrink':'/food-and-drink','ClassicFruitMachines':'/fruit-machine','Locations':'/destination'}
def keep(ids):
    out=[]
    for i in ids:
        m=re.search(r'\n?\.'+re.escape(i)+r' \{.*?\n\}',L[:L.index('@media')],re.S); out.append(m.group(0).strip())
    return '\n'.join(out)
srcs=hub['sources']; NS=2+len(srcs)  # banner, intro, lists
base=keep([oldpid,hdr,ftr,pbg]).replace('.'+oldpid+' {','.'+pid+' {')
base=re.sub(r'(\.'+re.escape(pid)+r' \{.*?grid-template-rows: )[^;\n]*',r'\1'+' '.join(['auto']*(NS+2)),base,flags=re.S)
base=re.sub(r'(\.'+re.escape(ftr)+r' \{.*?grid-row: )[^;\n]*',r'\g<1>'+f'{NS+2} / {NS+3}',base,flags=re.S)
def ph(i,html): return {"id":"dataItem-"+i,"type":"Builder.RichText","html":html}
def stat(i,html): return f'<WRichText id="{i}" className="{i}" richText={{{json.dumps(ph(i,html),ensure_ascii=False)}}} />'
def bg(i): return f'<Background id="{i}" className="{i}" />'
def box(i,kids,b=True): return f'<BoxContainer id="{i}" className="{i}" children={{\n<InternalContainer id="{i}-ic" className="{i}-ic"'+(f' backgroundLayer={{[{bg(i+"-bg")}]}}' if b else '')+'>\n'+'\n'.join(kids)+'\n</InternalContainer>\n} />'
def sec(i,kids): return f'<Section id="{i}" className="{i}">\n<InternalContainer id="{i}-ic" className="{i}-ic" backgroundLayer={{[{bg(i+"-bg")}]}}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n</Section>'
secs=[]; row=2
# ---- banner / plank hero
if hub.get('banner'):
    w,h=2560,854
    img={"name":slug,"uri":hub['banner'],"width":w,"height":h,"id":"dataItem-b-img","alt":hub['title']+' – Spin Raiders','type':'Builder.Image'}
    secs.append(sec('s1',[f'<Image id="b-img" className="b-img" displayMode={{"fill"}} image={{{json.dumps(img,ensure_ascii=False)}}} />']))
    section('s1',row,grid_ic('s1-ic','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(0,0,0),(0,0,0),(0,0),(0,0)))
    fill('s1-bg','#0B2A4A')
    rule('b-img','width: 100%;\naspect-ratio: 2560 / 854;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: start;\njustify-self: stretch;\nposition: relative;','width: 100%;\naspect-ratio: 2560 / 1100;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: start;\njustify-self: stretch;')
else:
    secs.append(sec('s1',[stat('b-kick','<p>'+hub.get('kicker','Spin Raiders guides')+'</p>'),box('b-plank',[stat('b-title','<h1>'+hub['title']+'</h1>')]),stat('b-sub','<p>'+hub.get('tagline','')+'</p>')]))
    section('s1',row,grid_ic('s1-ic','minmax(0px, 1fr)','auto auto auto','minmax(0px, 1fr)','auto auto auto',(44,40,44),(28,16,28),(0,12),(0,10)),0,0)
    fill('s1-bg','#0B2A4A')
    gi('b-kick','1 / 2','1 / 2','1 / 2','1 / 2'); gi('b-plank','2 / 3','1 / 2','2 / 3','1 / 2',w='auto',wm='100%'); gi('b-sub','3 / 4','1 / 2','3 / 4','1 / 2',w='--spx(760)',wm='100%')
    rule('b-plank-ic','min-width: --spx(0);','min-width: --spx(0);',ic='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: auto;\npadding-top: --spx(14);\npadding-bottom: --spx(14);\npadding-left: --spx(26);\npadding-right: --spx(26);',icm='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: auto;\npadding-top: --spx(10);\npadding-bottom: --spx(10);\npadding-left: --spx(14);\npadding-right: --spx(14);')
    gi('b-title','1 / 2','1 / 2','1 / 2','1 / 2'); H.bglay('b-plank-bg'); fill('b-plank-bg',BLUE)
    sty.append('.b-plank-ic {\n    --borderStartStartRadius: 10px;\n    --borderStartEndRadius: 10px;\n    --borderEndStartRadius: 10px;\n    --borderEndEndRadius: 10px;\n    --boxShadow: 0px 6px 0px rgba(5, 14, 28, 0.45);\n}')
    txt('b-kick','heading-6',YEL); txt('b-title','heading-1',WHITE); txt('b-sub','paragraph-1',WHITE)
row+=1
# ---- intro
kids=[stat('i-h','<h2>'+hub['heading']+'</h2>')]+([stat('i-p','<p>'+hub['intro']+'</p>')] if hub.get('intro') else [])
secs.append(sec('s2',kids))
section('s2',row,grid_ic('s2-ic','minmax(0px, 1fr)','auto auto','minmax(0px, 1fr)','auto auto',(40,40,8),(28,16,4),(0,14),(0,10)))
fill('s2-bg',WHITE)
gi('i-h','1 / 2','1 / 2','1 / 2','1 / 2'); txt('i-h','heading-2',NAVY)
if hub.get('intro'): gi('i-p','2 / 3','1 / 2','2 / 3','1 / 2',w='--spx(860)',wm='100%'); txt('i-p','paragraph-1',NAVY)
row+=1
# ---- lists
provs=[]
for n,s in enumerate(srcs):
    c=s['collection']; prov='CmsProvider_'+c; provs.append(c); k=f'l{n}'
    flt=('filter={{ '+s['filter']+': { $isNotEmpty: true } }}') if s.get('filter') else ''
    hook='useCmsContext' if n==0 else f'useCmsContext_{n}'
    img_el=(f'<Image id="{k}-img" className="{k}-img" displayMode={{"fill"}} image={{item.fields.heroImage.value ?? {json.dumps({"name":"Spin Raiders","uri":"3a517e_c00db68d44ed453e96b9547639584056~mv2.jpg","width":2752,"height":1100,"alt":"","type":"Builder.Image"})}}} />') if s.get('image',True) else ''
    sub=s.get('sub')
    card_kids=[x for x in [img_el,
        f'<WRichText id="{k}-t" className="{k}-t" richText={{fn(textToRichText, item.fields.title.value, {{ placeholder: {json.dumps(ph(k+"-t","<h4>Place</h4>"))} }})}} />',
        (f'<WRichText id="{k}-s" className="{k}-s" richText={{fn(textToRichText, item.fields.{sub}.value, {{ placeholder: {json.dumps(ph(k+"-s","<p>Town</p>"))} }})}} />' if sub else ''),
        f'<Button id="{k}-b" className="{k}-b" label={{{json.dumps(s.get("button","Read the guide →"),ensure_ascii=False)}}} link={{item.getPageLink({{ pageRole: {json.dumps(ROLES[c])}, href: {json.dumps(PFX[c])} }})}} />'] if x]
    rep=(f'<{prov} {flt}>\n<Repeater id="{k}-rep" className="{k}-rep" items={{ctx("items", {{ from: {hook} }})}} onLoadMore={{callback(ctx("pagination.loadMore", {{ from: {hook} }}))}} isLoading={{ctx("pagination.isLoading", {{ from: {hook} }})}} renderItem={{item => (\n'
         f'<InternalContainer id="{k}-card" className="{k}-card" backgroundLayer={{[{bg(k+"-card-bg")}]}}>\n'+'\n'.join(card_kids)+'\n</InternalContainer>\n)}\n'
         f'emptyStateContent={{<InternalContainer id="{k}-empty" className="{k}-empty" />}} />\n</{prov}>')
    head=stat(f'{k}-h','<h3>'+s['heading']+'</h3>') if s.get('heading') else None
    secs.append(sec(f's{3+n}',([head] if head else [])+[rep]))
    section(f's{3+n}',row,grid_ic(f's{3+n}-ic','minmax(0px, 1fr)','auto auto' if head else 'auto','minmax(0px, 1fr)','auto auto' if head else 'auto',(24,40,48),(16,16,32),(0,16),(0,12)))
    fill(f's{3+n}-bg',WHITE if n%2==0 else '#F4F9FE')
    r0=1
    if head: gi(f'{k}-h','1 / 2','1 / 2','1 / 2','1 / 2'); txt(f'{k}-h','heading-3',NAVY); r0=2
    gi(f'{k}-rep',f'{r0} / {r0+1}','1 / 2',f'{r0} / {r0+1}','1 / 2')
    sty.append(f'.{k}-rep {{\n    --preset: PRESET;\n    --column-count: 3;\n    --row-gap: --spx(24);\n    --column-gap: --spx(24);\n    --background-color: transparent;\n}}')
    ids=[i for i in [f'{k}-img' if img_el else None,f'{k}-t',f'{k}-s' if sub else None,f'{k}-b'] if i]
    rule(f'{k}-card','min-width: --spx(0);','min-width: --spx(0);',ic='display: flex;\nflex-direction: column;\npadding-top: --spx(0);\npadding-right: --spx(0);\npadding-bottom: --spx(18);\npadding-left: --spx(0);',icm='display: flex;\nflex-direction: column;\npadding-top: --spx(0);\npadding-right: --spx(0);\npadding-bottom: --spx(16);\npadding-left: --spx(0);')
    H.bglay(f'{k}-card-bg'); fill(f'{k}-card-bg',WHITE)
    sty.append(f'.{k}-card {{\n    --borderStartStartRadius: 16px;\n    --borderStartEndRadius: 16px;\n    --borderEndStartRadius: 16px;\n    --borderEndEndRadius: 16px;\n    --boxShadow: 0px 6px 22px rgba(11, 25, 44, 0.10);\n}}')
    for o,i in enumerate(ids):
        last=o==len(ids)-1
        if i.endswith('-img'):
            rule(i,f'width: 100%;\naspect-ratio: 16 / 10;\nmin-width: 0px;\norder: {o+1};\nposition: relative;\nmargin-bottom: --spx(14);',f'width: 100%;\naspect-ratio: 16 / 10;\nmin-width: 0px;\norder: {o+1};\nmargin-bottom: --spx(12);')
        else:
            mb='' if last else '\nmargin-bottom: --spx(8);'
            w='auto' if i.endswith('-b') else 'calc(100% - --spx(36))'
            rule(i,f'width: {w};\nheight: auto;\nmin-width: 0px;\norder: {o+1};\nposition: relative;\nmargin-left: --spx(18);\nmargin-right: --spx(18);'+mb,f'width: {w};\nheight: auto;\nmin-width: 0px;\norder: {o+1};\nmargin-left: --spx(16);\nmargin-right: --spx(16);'+mb)
    txt(f'{k}-t','heading-4',NAVY)
    if sub: txt(f'{k}-s','paragraph-2','var(--wst-shade-3-color)')
    cbtn(f'{k}-b',PINK,WHITE,999)
    rule(f'{k}-empty','min-width: --spx(0);','min-width: --spx(0);',ic='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: minmax(--spx(40), auto);',icm='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: minmax(--spx(40), auto);')
    row+=1
# ---- write files
out=os.path.join(PAGES,slug)
if os.path.exists(out): shutil.rmtree(out)
shutil.copytree(LB,out)
camel='Hub'+''.join(w.capitalize() for w in re.split(r'[^a-z0-9]+',slug))
gd=os.path.join(out,'_generated')
for f in os.listdir(gd):
    p=os.path.join(gd,f); t=open(p).read().replace('ArcadeVenuesList',camel)
    if f.endswith('.jsx') and f!='index.jsx':
        t='\n'.join(l for l in t.split('\n') if not ('/line/css' in l))
        for need in ['boxcontainer','repeater','button','image','wrichtext']:
            imp=f"import '@origami-wrappers/wixEditorElements/{need}/css'"
            if imp not in t: t=imp+'\n'+t
    os.remove(p); open(os.path.join(gd,f.replace('ArcadeVenuesList',camel)),'w').write(t)
imports=[l for l in S[:S.index('export const Structure')].split('\n') if l.startswith('import') and not any(x in l for x in ['cmsprovider_','/line\'','{ svg }','{ media }'])]
imports=[l for l in imports if 'origami-runtime' not in l]
imports+=["import { BoxContainer } from '@origami-wrappers/wixEditorElements/boxcontainer'","import { callback, ctx, fn } from '@wix/origami-runtime'"]
for n,c in enumerate(dict.fromkeys(provs)):
    imports.append(f"import {{ CmsProvider_{c} }} from '@origami-wrappers/companionApp/cmsprovider_{c.lower()}'")
    imports.append(f"import {{ useCmsContext{'' if n==0 else ' as useCmsContext_'+str(n)} }} from '@origami-wrappers/companionApp/cmsprovider_{c.lower()}'")
imports=list(dict.fromkeys(imports))
pg=S[S.index('export const Structure'):]
_bi=pg.index('backgroundLayer={[<Background id="'+pbg); _bj=pg.index(']}',_bi)
pg=pg[:pg.index('>',_bj)+1]
pg=pg.replace(f"id: '{oldpid}'",f"id: '{pid}'").replace(f'id="{oldpid}"',f'id="{pid}"').replace(f'className="{oldpid}"',f'className="{pid}"')
pg=re.sub(r"title: '[^']*'",lambda m:"title: "+json.dumps(hub['title']),pg,count=1)
pg=pg.replace("type: 'Page',","type: 'Page',\n                pageUriSEO: "+json.dumps(slug)+",",1)
pg=pg.replace('hidePage: false','hidePage: true') if False else pg
struct='\n'.join(imports)+'\n\n'+pg+'\n'+'\n'.join(secs)+'\n        </Page>\n)\n'
open(os.path.join(out,'structure.jsx'),'w').write(struct)
def ref(w): return f'    --spx-ref-width: {w};\n    --spx-resolver-type: scale;\n'
o=[];om=[]
for sel,d,m,ic,icm in lay:
    body=ref(1280)+''.join('    '+l+'\n' for l in d.split('\n') if l)
    if ic: body+='    @origami-target internal-container-content-wrapper {\n'+''.join('        '+l+'\n' for l in ic.split('\n'))+'    }\n'
    o.append(f'.{sel} {{\n{body}}}')
    bm=ref(375)+''.join('    '+l+'\n' for l in (m or '').split('\n') if l)
    if icm: bm+='    @origami-target internal-container-content-wrapper {\n'+''.join('        '+l+'\n' for l in icm.split('\n'))+'    }\n'
    om.append('    '+f'.{sel} {{\n{bm}}}'.replace('\n','\n    '))
mob=[f'.{k}-rep {{\n    --spx-ref-width: 375;\n    --column-count: 1;\n}}' for k in [f'l{n}' for n in range(len(srcs))]]
mq=re.search(r'@media \([^)]*\)',L).group(0)
open(os.path.join(out,'layout.css'),'w').write(base+'\n'+'\n'.join(o)+'\n'+mq+' {\n'+'\n'.join(om)+'\n}\n')
open(os.path.join(out,'style.css'),'w').write('\n'.join(sty)+'\n'+mq+' {\n'+'\n'.join('    '+x.replace('\n','\n    ') for x in mob)+'\n}\n')
un=json.load(open(os.path.join(LB,'unmapped.json')))
comps={k:v for k,v in un.get('components',{}).items() if k in (hdr,ftr)}
un['components']=comps; json.dump(un,open(os.path.join(out,'unmapped.json'),'w'),indent=4,ensure_ascii=False)
print('ok',slug,pid,len(struct))
