# Fruit machine page generator copying the live spin-raiders.com place page:
# crumbs, photo + info card (chip, title, town, hero text, rating box, lede), guide article + aside link,
# "Make a day of it" box and "Explore more days out" links.
# usage: python3 gen_place.py '<page dir glob>' '<config.json>'
#   config: {"fields": {"title","town","image","lede"}, "chip_fallback": "..."}
import json,sys,re,os,glob
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import helpers as H
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
NAVYD='#0B2545'
# ---- s1 navy band: crumbs, title, maker/year, tags, back link
secs.append(sec('s1',[sbtn('c-home','Home','/'),rt('c-s1','<p>›</p>'),sbtn('c-arch','Classic Fruit Machines','/classic-fruit-machines'),rt('c-s2','<p>›</p>'),btxt('c-title','title','<p>Machine</p>'),
    btxt('m-title','title','<h1>Machine</h1>'),btxt('m-sub','mSub','<p>Maker</p>'),box('m-tags',[btxt('m-tags-t','mTags','<p>&nbsp;</p>')]),sbtn('m-back','Back to machines','/classic-fruit-machines')]))
section('s1',2,grid_ic('s1-ic','max-content max-content max-content max-content minmax(0px, 1fr) max-content','auto auto auto auto','max-content max-content max-content max-content minmax(0px, 1fr)','auto auto auto auto auto',(12,24,18),(10,16,16),(6,8),(4,8)))
fill('s1-bg',NAVYD)
for n,i in enumerate(['c-home','c-s1','c-arch','c-s2','c-title']):
    gi(i,'1 / 2',f'{n+1} / {n+2}','1 / 2',f'{n+1} / {n+2}',w='auto',wm='auto',a='center',am='center')
for i in ['c-home','c-arch']: pill(i,'transparent','#CFE3FF',size=12,r=0,pad=(0,0),border=NOB,weight=500)
for i in ['c-s1','c-s2','c-title']: font(i,12,500,'#CFE3FF',lh=1.3,sizem=11)
gi('m-back','1 / 2','6 / 7','5 / 6','1 / 6',w='auto',wm='auto',j='end',jm='start'); pill('m-back','transparent','#CFE3FF',size=12,r=0,pad=(0,0),border=NOB,weight=500)
gi('m-title','2 / 3','1 / 7','2 / 3','1 / 6'); font('m-title',36,900,WHITE,lh=1.15,sizem=28)
gi('m-sub','3 / 4','1 / 7','3 / 4','1 / 6'); font('m-sub',13,700,'#CFE3FF',lh=1.3)
gi('m-tags','4 / 5','1 / 7','4 / 5','1 / 6',w='auto',wm='100%')
boxgrid('m-tags','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(5,12),(5,10),color='#DCEBFF',radius=6)
gi('m-tags-t','1 / 2','1 / 2','1 / 2','1 / 2'); font('m-tags-t',11,700,'#0B2545',lh=1.4)
# ---- s2 machine card picture
secs.append(sec('s2',[box('m-fig',[bimg('m-img','mFigure')])]))
section('s2',3,grid_ic('s2-ic','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(18,24,18),(12,12,12),(0,0),(0,0)))
fill('s2-bg',WHITE)
gi('m-fig','1 / 2','1 / 2','1 / 2','1 / 2',h='--spx(680)',hm='--spx(220)')
boxgrid('m-fig','minmax(0px, 1fr)','minmax(0px, 1fr)','minmax(0px, 1fr)','minmax(0px, 1fr)',(0,0),(0,0),radius=14,shadow='0px 10px 26px rgba(11, 25, 44, 0.18)')
rule('m-img','width: 100%;\nheight: 100%;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;\nposition: relative;','width: 100%;\nheight: 100%;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;')
# ---- s3 about + details
secs.append(sec('s3',[rt('a-h','<h2>About this machine</h2>'),brich('a-body','mAbout','<p>About this machine.</p>'),box('a-det',[rt('a-det-h','<h2>Machine details</h2>'),brich('a-det-b','mDetails','<p>Details.</p>')])]))
section('s3',4,grid_ic('s3-ic','minmax(0px, 1fr) minmax(0px, 1fr) minmax(0px, 1fr)','auto auto','minmax(0px, 1fr)','auto auto auto',(20,24,20),(16,16,16),(28,10),(0,14)))
fill('s3-bg',WHITE)
gi('a-h','1 / 2','1 / 3','1 / 2','1 / 2'); font('a-h',24,900,INK,lh=1.2,sizem=21)
gi('a-body','2 / 3','1 / 3','2 / 3','1 / 2'); font('a-body',15,400,'#1F3550',lh=1.75)
gi('a-det','1 / 3','3 / 4','3 / 4','1 / 2')
boxgrid('a-det','minmax(0px, 1fr)','auto auto','minmax(0px, 1fr)','auto auto',(18,20),(16,16),(0,10),(0,8),color=BLUEL,radius=14)
gi('a-det-h','1 / 2','1 / 2','1 / 2','1 / 2'); font('a-det-h',20,900,INK,lh=1.2)
gi('a-det-b','2 / 3','1 / 2','2 / 3','1 / 2'); font('a-det-b',13,400,'#1F3550',lh=1.55)
# ---- s4 how to play / features / where to play
cards=[('hp','How to play',btxt('hp-b','mPlay','<p>&nbsp;</p>')),('kf','Key features',brich('kf-b','mFeatures','<p>&nbsp;</p>')),('wp','Where to play',brich('wp-b','mVenues','<p>&nbsp;</p>'))]
secs.append(sec('s4',[box(k,[rt(k+'-h','<h2>'+t+'</h2>'),b]) for k,t,b in cards]))
section('s4',5,grid_ic('s4-ic','minmax(0px, 1fr) minmax(0px, 1fr) minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto auto auto',(10,24,20),(10,16,16),(18,0),(0,14)))
fill('s4-bg',WHITE)
for n,(k,t,b) in enumerate(cards):
    gi(k,'1 / 2',f'{n+1} / {n+2}',f'{n+1} / {n+2}','1 / 2',h='100%',hm='auto',a='stretch',am='start')
    boxgrid(k,'minmax(0px, 1fr)','auto auto','minmax(0px, 1fr)','auto auto',(18,20),(16,16),(0,10),(0,8),color=BLUEL,radius=14)
    gi(k+'-h','1 / 2','1 / 2','1 / 2','1 / 2'); font(k+'-h',20,900,INK,lh=1.2)
    gi(k+'-b','2 / 3','1 / 2','2 / 3','1 / 2'); font(k+'-b',13,400,'#1F3550',lh=1.6)
# ---- s5 explore more
EX=[('Theme parks','/theme-parks'),('Zoos & wildlife','/zoos'),('Museums','/museums'),('Historic places','/historical-sites'),('Beaches','/beaches'),('Piers','/piers'),('Outdoors','/outdoors'),('Hidden gems','/hidden-gems'),('Cinema','/cinemas'),('Bowling','/bowling'),('Fishing','/fishing-lakes'),('Holiday parks','/holiday-parks'),('Retro games','/retro-video-games'),('Arcade bars','/arcade-bars'),('Adult gaming centres','/agc'),('Fruit Machine Archive','/classic-fruit-machines'),('Offers','/offers'),('Plan a trip','/plan-a-trip'),('Fuel prices','/plan-a-trip')]
secs.append(sec('s5',[rt('x-h','<h2>More ways to spend your day</h2>')]+[sbtn(f'x{n}',t,u) for n,(t,u) in enumerate(EX)]))
C=4; R=(len(EX)+C-1)//C; CM=2; RM=(len(EX)+CM-1)//CM
section('s5',6,grid_ic('s5-ic',' '.join(['minmax(0px, 1fr)']*C),' '.join(['auto']*(R+1)),' '.join(['minmax(0px, 1fr)']*CM),' '.join(['auto']*(RM+1)),(24,24,40),(18,16,30),(10,6),(8,6)))
fill('s5-bg','#F5F9FD')
gi('x-h','1 / 2',f'1 / {C+1}','1 / 2',f'1 / {CM+1}'); font('x-h',22,900,INK,lh=1.2,sizem=19)
for n in range(len(EX)):
    gi(f'x{n}',f'{n//C+2} / {n//C+3}',f'{n%C+1} / {n%C+2}',f'{n//CM+2} / {n//CM+3}',f'{n%CM+1} / {n%CM+2}',w='auto',wm='auto')
    pill(f'x{n}','transparent',LINK,size=13,r=0,pad=(2,0),border=NOB,weight=500)
NS=5
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
need=["import { Button } from '@origami-wrappers/wixEditorElements/button'","import { Image } from '@origami-wrappers/wixEditorElements/image'","import { BoxContainer } from '@origami-wrappers/wixEditorElements/boxcontainer'","import { WRichText } from '@origami-wrappers/wixEditorElements/wrichtext'","import { media } from '@wix/sdk'"]
hl=[l for l in head.split('\n') if not any(x in l for x in ['/line\'','/svgimage\'','{ svg }'])]
for n_ in need:
    if not any(n_.split(' from ')[1] in l for l in hl): hl.append(n_)
head='\n'.join(hl).rstrip()+'\n\n'
pg=S[S.index('export const Structure'):S.index('<Section id=')]
out=head+pg+'\n'.join(secs)+f'\n        </Page>\n    </{prov}>\n)\n'
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
