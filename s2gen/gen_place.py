# Item ("place") page generator copying the live spin-raiders.com place page:
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
# ---- s1 crumbs
secs.append(sec('s1',[sbtn('c-home','Home','/'),rt('c-s1','<p>›</p>'),btxt('c-town',F['town'],'<p>Town</p>'),rt('c-s2','<p>›</p>'),btxt('c-title',F['title'],'<p>Place</p>')]))
section('s1',2,grid_ic('s1-ic','max-content max-content max-content max-content minmax(0px, 1fr)','auto','max-content max-content max-content max-content minmax(0px, 1fr)','auto',(18,70,0),(14,16,0),(6,0),(4,0)))
fill('s1-bg',WHITE)
for n,i in enumerate(['c-home','c-s1','c-town','c-s2','c-title']):
    gi(i,'1 / 2',f'{n+1} / {n+2}','1 / 2',f'{n+1} / {n+2}',w='auto',wm='auto',a='center',am='center')
pill('c-home','transparent',LINK,size=12,r=0,pad=(0,0),border=NOB,weight=500)
for i in ['c-s1','c-town','c-s2','c-title']: font(i,12,500,LINK if i=='c-town' else GREY,lh=1.3,sizem=11)
# ---- s2 photo + info card
card=[box('p-chip',[btxt('p-chip-t','srChip','<p>Day out</p>')]),btxt('p-title',F['title'],'<h1>Place name</h1>'),
      rt('p-pin','<p>⌖</p>'),btxt('p-town',F['town'],'<p>Town</p>'),btxt('p-hero','srHeroText','<p>About this place.</p>'),
      box('p-rate',[btxt('p-rate-s','srRating','<p>★</p>'),btxt('p-rate-n','srReviews','<p>&nbsp;</p>')])]+([btxt('p-lede',F['lede'],'<p>&nbsp;</p>')] if F.get('lede') else [])
secs.append(sec('s2',[box('p-photo',[bimg('p-img',F['image'])]),box('p-card',card)]))
section('s2',3,grid_ic('s2-ic','minmax(0px, 1fr) minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto auto',(8,70,24),(8,16,18),(28,0),(0,16)))
fill('s2-bg',WHITE)
gi('p-photo','1 / 2','1 / 2','1 / 2','1 / 2',h='--spx(400)',hm='--spx(240)',a='start')
boxgrid('p-photo','minmax(0px, 1fr)','minmax(0px, 1fr)','minmax(0px, 1fr)','minmax(0px, 1fr)',(0,0),(0,0),radius=18,shadow='0px 10px 26px rgba(11, 25, 44, 0.16)')
rule('p-img','width: 100%;\nheight: 100%;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;\nposition: relative;','width: 100%;\nheight: 100%;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;')
gi('p-card','1 / 2','2 / 3','2 / 3','1 / 2',a='start')
boxgrid('p-card','max-content minmax(0px, 1fr)','auto auto auto auto auto auto','max-content minmax(0px, 1fr)','auto auto auto auto auto auto',(26,26,30),(20,18,22),(6,12),(6,10),color=BLUEL,radius=18)
gi('p-chip','1 / 2','1 / 3','1 / 2','1 / 3',w='auto',wm='auto')
boxgrid('p-chip','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(4,10),(4,10),color='#DCEBFF',radius=999)
gi('p-chip-t','1 / 2','1 / 2','1 / 2','1 / 2'); font('p-chip-t',10,800,LINK,lh=1.3,upper=True)
gi('p-title','2 / 3','1 / 3','2 / 3','1 / 3'); font('p-title',40,900,INK,lh=1.12,sizem=30)
gi('p-pin','3 / 4','1 / 2','3 / 4','1 / 2',w='auto',wm='auto'); font('p-pin',12,500,GREY,lh=1.3)
gi('p-town','3 / 4','2 / 3','3 / 4','2 / 3'); font('p-town',12,500,GREY,lh=1.3)
gi('p-hero','4 / 5','1 / 3','4 / 5','1 / 3'); font('p-hero',14,400,'#1F3550',lh=1.75,sizem=14)
gi('p-rate','5 / 6','1 / 3','5 / 6','1 / 3',w='auto',wm='auto')
boxgrid('p-rate','minmax(0px, 1fr)','auto auto','minmax(0px, 1fr)','auto auto',(8,12),(8,12),(0,2),(0,2),color=WHITE,radius=8,shadow='0px 0px 0px 1px #D2E2F6')
gi('p-rate-s','1 / 2','1 / 2','1 / 2','1 / 2'); font('p-rate-s',17,800,INK,lh=1.2)
gi('p-rate-n','2 / 3','1 / 2','2 / 3','1 / 2'); font('p-rate-n',9,600,GREY,lh=1.3,upper=True)
if F.get('lede'): gi('p-lede','6 / 7','1 / 3','6 / 7','1 / 3'); font('p-lede',13,400,'#1F3550',lh=1.6)
# ---- s3 guide + aside
secs.append(sec('s3',[brich('g-body','srGuide','<p>Our guide to this place.</p>'),bbtn('g-aside','More to do nearby →','srTownLink')]))
section('s3',4,grid_ic('s3-ic','minmax(0px, 1fr) minmax(0px, 1fr) minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto auto',(30,70,36),(20,16,24),(32,0),(0,18)))
fill('s3-bg',WHITE)
gi('g-body','1 / 2','1 / 3','2 / 3','1 / 2'); font('g-body',15,400,'#1F3550',lh=1.75,sizem=15)
gi('g-aside','1 / 2','3 / 4','1 / 2','1 / 2',w='auto',wm='auto')
pill('g-aside',WHITE,LINK,size=14,r=10,pad=(14,18),border='1px solid #D2E2F6',weight=700)
# ---- s4 make a day of it
day=[rt('d-h','<h2>Make a day of it</h2>'),rt('d-p','<p>Keep the adventure going: add something to do, a food stop or a night away. Start with the place, then choose the stops that fit your day.</p>'),
     bbtn('d-b0','Explore the destination →','srTownLink'),sbtn('d-b1','More things to do','/attractions'),sbtn('d-b2','Food & drink','/where-to-eat'),sbtn('d-b3','Places to stay','/places-to-stay')]
secs.append(sec('s4',[box('d-box',day)]))
section('s4',5,grid_ic('s4-ic','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(10,70,30),(10,16,24),(0,0),(0,0)))
fill('s4-bg',WHITE)
gi('d-box','1 / 2','1 / 2','1 / 2','1 / 2')
boxgrid('d-box','max-content max-content max-content max-content minmax(0px, 1fr)','auto auto auto','minmax(0px, 1fr) minmax(0px, 1fr)','auto auto auto auto auto',(24,26,26),(20,18,22),(10,10),(8,8),color=BLUEL,radius=18)
gi('d-h','1 / 2','1 / 6','1 / 2','1 / 3'); font('d-h',24,900,INK,lh=1.2,sizem=21)
gi('d-p','2 / 3','1 / 6','2 / 3','1 / 3',w='--spx(760)',wm='100%'); font('d-p',14,400,'#1F3550',lh=1.6)
for n in range(4):
    gi(f'd-b{n}','3 / 4',f'{n+1} / {n+2}',f'{3+n//2} / {4+n//2}',f'{n%2+1} / {n%2+2}',w='auto',wm='100%')
    pill(f'd-b{n}','linear-gradient(180deg, #F0407F, #D81B60)' if n==0 else WHITE,WHITE if n==0 else INK,size=14,r=999,pad=(10,18),border=None if n==0 else '1px solid #D2E2F6')
# ---- s5 explore more
EX=[('Theme parks','/theme-parks'),('Zoos & wildlife','/zoos'),('Aquariums','/sea-life'),('Museums','/museums'),('Historic sites','/historical-sites'),('Beaches','/seaside'),('Piers','/piers'),('Food & drink','/where-to-eat'),('Places to stay','/places-to-stay'),('Bowling','/bowling'),('Cinemas','/cinemas'),('Tours','/tours'),('Arcades','/arcade'),('Plan a trip','/plan-a-trip')]
secs.append(sec('s5',[rt('x-h','<h2>Explore more days out</h2>')]+[sbtn(f'x{n}',t,u) for n,(t,u) in enumerate(EX)]))
C=7; R=(len(EX)+C-1)//C; CM=2; RM=(len(EX)+CM-1)//CM
section('s5',6,grid_ic('s5-ic',' '.join(['minmax(0px, 1fr)']*C),' '.join(['auto']*(R+1)),' '.join(['minmax(0px, 1fr)']*CM),' '.join(['auto']*(RM+1)),(10,70,40),(10,16,30),(10,10),(8,8)))
fill('s5-bg',WHITE)
gi('x-h','1 / 2',f'1 / {C+1}','1 / 2',f'1 / {CM+1}'); font('x-h',20,900,INK,lh=1.2,sizem=18)
for n in range(len(EX)):
    gi(f'x{n}',f'{n//C+2} / {n//C+3}',f'{n%C+1} / {n%C+2}',f'{n//CM+2} / {n//CM+3}',f'{n%CM+1} / {n%CM+2}',w='100%',wm='100%')
    pill(f'x{n}',WHITE,INK,size=13,r=999,pad=(8,12),border='1px solid #D2E2F6',weight=600)
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
