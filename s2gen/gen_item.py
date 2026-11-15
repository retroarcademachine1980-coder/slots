import json,sys,re,os,glob
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import helpers as H
from helpers import rule,gi,txt,card,cbtn,fill,section,grid_ic,stack,stackkids,boxic_grid,bglay,lay,sty,NAVY,WHITE,PINK,YEL,CYAN,LIGHT,MUTED,BLUE
cfg=json.loads(open(sys.argv[2]).read())
page_dir=glob.glob(sys.argv[1])[0]
S=open(os.path.join(page_dir,'structure.jsx')).read()
L=open(os.path.join(page_dir,'layout.css')).read()
pid=re.search(r'<Page\s+id="([^"]+)"',S).group(1)
hdr=re.search(r'<Header_\w+ id="([^"]+)"',S).group(1); ftr=re.search(r'<Footer_\w+ id="([^"]+)"',S).group(1)
pbg=re.search(r'backgroundLayer=\{\[<Background id="([^"]+)"',S[S.index('<Page'):]).group(1)
prov=re.search(r'<(CmsPageProvider_\w+)>',S).group(1)
def keep(ids):
    out=[]
    for i in ids:
        m=re.search(r'\n?\.'+re.escape(i)+r' \{.*?\n\}',L[:L.index('@media')],re.S); out.append(m.group(0).strip())
    return '\n'.join(out)
base=keep([pid,hdr,ftr,pbg])
base=re.sub(r'(\.'+re.escape(pid)+r' \{.*?grid-template-rows: )[^;\n]*',r'\1auto auto auto auto auto',base,flags=re.S)
base=re.sub(r'(\.'+re.escape(ftr)+r' \{.*?grid-row: )[^;\n]*',r'\g<1>5 / 6',base,flags=re.S)
F=cfg['fields']
def ph(i,html): return {"id":"dataItem-"+i,"type":"Builder.RichText","html":html}
def btxt(i,field,tag,phhtml):
    return f'<WRichText id="{i}" className="{i}" richText={{fn(textToRichText, ctx({json.dumps("currentItem.fields."+field+".value")}, {{ from: useCmsContext }}), textEnum({json.dumps(tag)}), {{ placeholder: {json.dumps(ph(i,phhtml),ensure_ascii=False)} }})}} />'
def brich(i,field,phhtml):
    return f'<WRichText id="{i}" className="{i}" richText={{ctx({json.dumps("currentItem.fields."+field+".value")}, {{ from: useCmsContext, placeholder: {json.dumps(ph(i,phhtml),ensure_ascii=False)} }})}} />'
def stat(i,html): return f'<WRichText id="{i}" className="{i}" richText={{{json.dumps(ph(i,html),ensure_ascii=False)}}} />'
IMGPH={"name":"Spin Raiders","uri":"3a517e_c00db68d44ed453e96b9547639584056~mv2.jpg","width":2752,"height":1100,"alt":"","type":"Builder.Image"}
def bimg(i,field): return f'<Image id="{i}" className="{i}" displayMode={{"fill"}} image={{ctx({json.dumps("currentItem.fields."+field+".value")}, {{ from: useCmsContext, placeholder: {json.dumps(IMGPH)} }})}} />'
def blink(i,label,field): return f'<Button id="{i}" className="{i}" label={{{json.dumps(label,ensure_ascii=False)}}} link={{fn(webUrlToLink, ctx({json.dumps("currentItem.fields."+field+".value")}, {{ from: useCmsContext }}), {{ placeholder: {{ type: "ExternalLink", url: "https://www.spin-raiders.com", target: "_blank" }} }})}} />'
def slink(i,label,href): return f'<Button id="{i}" className="{i}" label={{{json.dumps(label,ensure_ascii=False)}}} link={{{json.dumps({"type":"ExternalLink","id":"dataItem-"+i,"url":"https://www.spin-raiders.com"+href,"target":"_self"})}}} />'
def bg(i,photo=None): return f'<Background id="{i}" className="{i}" />'
def box(i,kids,b=True): return f'<BoxContainer id="{i}" className="{i}" children={{\n<InternalContainer id="{i}-ic" className="{i}-ic"'+(f' backgroundLayer={{[{bg(i+"-bg")}]}}' if b else '')+'>\n'+'\n'.join(kids)+'\n</InternalContainer>\n} />'
def sec(i,kids): return f'<Section id="{i}" className="{i}">\n<InternalContainer id="{i}-ic" className="{i}-ic" backgroundLayer={{[{bg(i+"-bg")}]}}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n</Section>'
# ---- S1 hero band
left=[btxt('v-kicker',F['kicker'],'p','<p>Day out</p>'),
      box('v-plank',[btxt('v-title',F['title'],'h1','<h1>Place name</h1>')]),
      btxt('v-town',F['town'],'p','<p>Town</p>'),
      btxt('v-intro',F['intro'],'p','<p>Short description.</p>')]
s1=sec('s1',[box('v-left',left,b=False),bimg('v-img',F['image'])])
section('s1',2,grid_ic('s1-ic','minmax(0px, 1fr) minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto auto',(40,40,44),(20,16,24),(36,0),(0,18)),380,0)
fill('s1-bg','#0B2A4A')
gi('v-left','1 / 2','1 / 2','1 / 2','1 / 2',a='center')
stack('v-left-ic',0,0)
stackkids(['v-kicker','v-plank','v-town','v-intro'],[10,10,14],[8,8,12],widths={'v-plank':'auto'})
rule('v-plank-ic','min-width: --spx(0);','min-width: --spx(0);',ic='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: auto;\npadding-top: --spx(14);\npadding-bottom: --spx(14);\npadding-left: --spx(24);\npadding-right: --spx(24);',icm='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: auto;\npadding-top: --spx(10);\npadding-bottom: --spx(10);\npadding-left: --spx(14);\npadding-right: --spx(14);')
gi('v-title','1 / 2','1 / 2','1 / 2','1 / 2')
H.bglay('v-plank-bg'); fill('v-plank-bg',BLUE)
sty.append('.v-plank-ic {\n    --borderStartStartRadius: 10px;\n    --borderStartEndRadius: 10px;\n    --borderEndStartRadius: 10px;\n    --borderEndEndRadius: 10px;\n    --boxShadow: 0px 6px 0px rgba(5, 14, 28, 0.45);\n    --borderTopWidth: 3px;\n    --borderTopColor: #0E3F86;\n    --borderTopStyle: solid;\n    --borderBottomWidth: 3px;\n    --borderBottomColor: #0E3F86;\n    --borderBottomStyle: solid;\n    --borderLeftWidth: 3px;\n    --borderLeftColor: #0E3F86;\n    --borderLeftStyle: solid;\n    --borderRightWidth: 3px;\n    --borderRightColor: #0E3F86;\n    --borderRightStyle: solid;\n}')
txt('v-kicker','heading-6',YEL); txt('v-title','heading-1',WHITE); txt('v-town','heading-5',CYAN); txt('v-intro','paragraph-1',WHITE)
gi('v-img','1 / 2','2 / 3','2 / 3','1 / 2',h='--spx(340)',hm='--spx(220)',a='center')
sty.append('.v-img {\n    --corvid-border-radius: 18px;\n    border-radius: 18px;\n}')
# ---- S2 body + info card
info=[stat('v-info-h','<h3>Visit info</h3>'),btxt('v-addr',F['address'],'p','<p>Address</p>'),btxt('v-pc',F['postcode'],'p','<p>Postcode</p>'),
      stat('v-hours-h','<h6>Opening hours</h6>'),btxt('v-hours',F['hours'],'p','<p>Check before you travel</p>'),btxt('v-phone',F['phone'],'p','<p>Phone</p>'),
      blink('v-web','Visit website →',F['website']),blink('v-dir','Get directions →',F['directions'])]
s2=sec('s2',[brich('v-body',F['body'],'<p>Our guide to this place.</p>'),box('v-info',info)])
section('s2',3,grid_ic('s2-ic','minmax(0px, 2fr) minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto auto',(44,40,48),(28,16,32),(40,0),(0,24)))
fill('s2-bg',WHITE)
gi('v-body','1 / 2','1 / 2','2 / 3','1 / 2')
gi('v-info','1 / 2','2 / 3','1 / 2','1 / 2')
stack('v-info-ic',22,18)
ids=['v-info-h','v-addr','v-pc','v-hours-h','v-hours','v-phone','v-web','v-dir']
stackkids(ids,[12,2,14,4,12,18,10],[10,2,12,4,10,14,8])
H.bglay('v-info-bg'); fill('v-info-bg',LIGHT); card('v-info',18)
txt('v-body','paragraph-1',NAVY); txt('v-info-h','heading-4',NAVY); txt('v-hours-h','heading-6',NAVY)
for i in ['v-addr','v-pc','v-hours','v-phone']: txt(i,'paragraph-2',NAVY)
cbtn('v-web',PINK,WHITE,12); cbtn('v-dir','#0B2A4A',WHITE,12)
# ---- S3 more
more=[stat('m-t','<h2>Make a day of it</h2>'),slink('m-b1','Arcades','/arcade'),slink('m-b2','Attractions','/attractions'),slink('m-b3','Food & drink','/food-and-drink'),slink('m-b4','Plan a day out →','/plan-a-trip')]
s3=sec('s3',more)
section('s3',4,grid_ic('s3-ic','max-content max-content max-content max-content minmax(0px, 1fr)','auto auto','minmax(0px, 1fr) minmax(0px, 1fr)','auto auto auto',(34,40,40),(24,16,28),(12,16),(10,10)))
fill('s3-bg','#F4F9FE')
gi('m-t','1 / 2','1 / 6','1 / 2','1 / 3'); txt('m-t','heading-2',NAVY)
for n in range(4):
    gi(f'm-b{n+1}','2 / 3',f'{n+1} / {n+2}',f'{n//2+2} / {n//2+3}',f'{n%2+1} / {n%2+2}',w='max-content',wm='100%')
    cbtn(f'm-b{n+1}',PINK if n==3 else '#0B2A4A',WHITE,999)
# ---- write
head=S[:S.index('export const Structure')]
imports=["import { Button } from '@origami-wrappers/wixEditorElements/button'","import { textEnum } from '@wix/origami-runtime'","import { webUrlToLink } from '@origami-wrappers/viewer_core_services/datatypeconversions'"]
head='\n'.join(l for l in head.split('\n') if not any(x in l for x in ['/line\'','/svgimage\'','{ svg }']))
head=head.rstrip()+'\n'+'\n'.join(imports)+'\n\n'
pg=S[S.index('export const Structure'):S.index('<Section id=')]
out=head+pg+'\n'.join([s1,s2,s3])+f'\n        </Page>\n    </{prov}>\n)\n'
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
for n,nm in enumerate(['Top','Guide','More'],1): comps[f's{n}']={"anchors":{"type":"AnchorInfo","id":f"anchors-s{n}","name":nm}}
un['components']=comps; json.dump(un,open(os.path.join(page_dir,'unmapped.json'),'w'),indent=4,ensure_ascii=False)
print('ok',page_dir,prov,len(out))
