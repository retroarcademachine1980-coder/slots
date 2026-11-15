# Content page generator: pulls a live spin-raiders.com page and rebuilds its text as a Studio Two page
import json,sys,re,os,shutil,hashlib,html,urllib.request
from html.parser import HTMLParser
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import helpers as H
from helpers import rule,gi,txt,fill,section,grid_ic,lay,sty,NAVY,WHITE,YEL,BLUE
LB,PAGES,slug=sys.argv[1],sys.argv[2],sys.argv[3]
outslug=sys.argv[4] if len(sys.argv)>4 else slug
raw=urllib.request.urlopen(urllib.request.Request('https://www.spin-raiders.com/'+slug,headers={'User-Agent':'Mozilla/5.0'}),timeout=60).read().decode('utf-8','replace')
tm=re.search(r'<title>(.*?)</title>',raw,re.S); title=html.unescape(tm.group(1).strip()) if tm else slug
mdm=re.search(r'<meta name="description" content="([^"]*)"',raw); md=html.unescape(mdm.group(1)) if mdm else ''
body=raw[raw.find('<main'):raw.rfind('</main>')] if '<main' in raw else raw
ALLOW={'h1','h2','h3','h4','p','ul','ol','li','a','strong','b','em','i','br'}
SKIP=('script','style','noscript','header','footer','nav','svg','button')
class P(HTMLParser):
    def __init__(s): super().__init__(); s.out=[]; s.skip=0
    def handle_starttag(s,t,a):
        if t in SKIP: s.skip+=1; return
        if s.skip or t not in ALLOW: return
        if t=='a':
            href=dict(a).get('href','') or ''
            if not href or href.startswith('javascript') or href.startswith('#'): return
            if href.startswith('/'): href='https://www.spin-raiders.com'+href
            s.out.append(('o','a',href))
        else: s.out.append(('o',t,None))
    def handle_endtag(s,t):
        if t in SKIP: s.skip=max(0,s.skip-1); return
        if s.skip or t not in ALLOW: return
        s.out.append(('c',t,None))
    def handle_data(s,d):
        if s.skip: return
        if d.strip() or (d and s.out and s.out[-1][0]=='t'): s.out.append(('t',d,None))
p=P(); p.feed(body)
blocks=[]; cur=None; buf=''; h1=None
def esc(x): return html.escape(x,quote=False)
def ext(v): return v.startswith('http') and 'spin-raiders.com' not in v
for k,t,v in p.out:
    if k=='o' and t in('h1','h2','h3','h4','p','li'):
        if cur and buf.strip(): blocks.append((cur,buf.strip()))
        cur=t; buf=''
    elif k=='c' and t==cur:
        if buf.strip(): blocks.append((cur,buf.strip()))
        cur=None; buf=''
    elif k=='o' and t=='a' and not cur and ext(v):
        cur='solo'; buf=f'<a href="{html.escape(v)}" target="_blank" rel="sponsored noopener"><strong>'
    elif k=='c' and t=='a' and cur=='solo':
        if re.sub('<[^>]+>','',buf).strip(): blocks.append(('p',buf+'</strong></a>'))
        cur=None; buf=''
    elif k=='o' and t=='a' and cur:
        buf+=f'<a href="{html.escape(v)}" target="{"_blank" if ext(v) else "_self"}"'+(' rel="sponsored noopener"' if ext(v) else '')+'>'
    elif k=='c' and t=='a' and cur: buf+='</a>'
    elif k=='o' and t in('strong','b') and cur: buf+='<strong>'
    elif k=='c' and t in('strong','b') and cur: buf+='</strong>'
    elif k=='o' and t in('em','i') and cur: buf+='<em>'
    elif k=='c' and t in('em','i') and cur: buf+='</em>'
    elif k=='o' and t=='br' and cur: buf+='<br>'
    elif k=='t' and cur: buf+=esc(re.sub(r'\s+',' ',t))
clean=[]
for t,b in blocks:
    b=re.sub(r'\s+',' ',b).strip()
    for tag in ('a','strong','em'):
        o=b.count('<'+tag+' ')+b.count('<'+tag+'>'); c=b.count('</'+tag+'>')
        if o>c: b+=('</'+tag+'>')*(o-c)
    if not re.sub('<[^>]+>','',b).strip(): continue
    if clean and clean[-1]==(t,b): continue
    clean.append((t,b))
if clean and clean[0][0]=='h1': h1=re.sub('<[^>]+>','',clean[0][1]); clean=clean[1:]
h1=h1 or title.split('|')[0].strip()
if len(''.join(b for _,b in clean))<200: print('THIN',slug,len(clean)); sys.exit(3)
chunks=[]; c=''; inlist=False
for t,b in clean:
    piece=''
    if t=='li':
        if not inlist: piece+='<ul>'; inlist=True
        piece+=f'<li><p>{b}</p></li>'
    else:
        if inlist: piece+='</ul>'; inlist=False
        tag={'h1':'h2'}.get(t,t); piece+=f'<{tag}>{b}</{tag}>'
    c+=piece
    if len(c)>3500 and not inlist: chunks.append(c); c=''
if inlist: c+='</ul>'
if c: chunks.append(c)
S=open(os.path.join(LB,'structure.jsx')).read(); L=open(os.path.join(LB,'layout.css')).read()
oldpid=re.search(r'<Page\s+id="([^"]+)"',S).group(1)
hdr=re.search(r'<Header_\w+ id="([^"]+)"',S).group(1); ftr=re.search(r'<Footer_\w+ id="([^"]+)"',S).group(1)
pbg=re.search(r'backgroundLayer=\{\[<Background id="([^"]+)"',S[S.index('<Page'):]).group(1)
pid='t'+hashlib.md5(outslug.encode()).hexdigest()[:4]
def keep(ids):
    o=[]
    for i in ids:
        m=re.search(r'\n?\.'+re.escape(i)+r' \{.*?\n\}',L[:L.index('@media')],re.S); o.append(m.group(0).strip())
    return '\n'.join(o)
base=keep([oldpid,hdr,ftr,pbg]).replace('.'+oldpid+' {','.'+pid+' {')
base=re.sub(r'(\.'+re.escape(pid)+r' \{.*?grid-template-rows: )[^;\n]*',r'\1auto auto auto auto',base,flags=re.S)
base=re.sub(r'(\.'+re.escape(ftr)+r' \{.*?grid-row: )[^;\n]*',r'\g<1>4 / 5',base,flags=re.S)
def ph(i,h): return {"id":"dataItem-"+i,"type":"Builder.RichText","html":h}
def stat(i,h): return f'<WRichText id="{i}" className="{i}" richText={{{json.dumps(ph(i,h),ensure_ascii=False)}}} />'
def bg(i): return f'<Background id="{i}" className="{i}" />'
def box(i,kids): return f'<BoxContainer id="{i}" className="{i}" children={{\n<InternalContainer id="{i}-ic" className="{i}-ic" backgroundLayer={{[{bg(i+"-bg")}]}}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n} />'
def sec(i,kids): return f'<Section id="{i}" className="{i}">\n<InternalContainer id="{i}-ic" className="{i}-ic" backgroundLayer={{[{bg(i+"-bg")}]}}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n</Section>'
s1=sec('s1',[stat('b-kick','<p>Spin Raiders</p>'),box('b-plank',[stat('b-title','<h1>'+html.escape(h1,quote=False)+'</h1>')])]+([stat('b-sub','<p>'+html.escape(md,quote=False)+'</p>')] if md else []))
section('s1',2,grid_ic('s1-ic','minmax(0px, 1fr)','auto auto auto','minmax(0px, 1fr)','auto auto auto',(40,40,40),(26,16,26),(0,12),(0,10)),0,0)
fill('s1-bg','#0B2A4A')
gi('b-kick','1 / 2','1 / 2','1 / 2','1 / 2'); gi('b-plank','2 / 3','1 / 2','2 / 3','1 / 2',w='auto',wm='100%')
if md: gi('b-sub','3 / 4','1 / 2','3 / 4','1 / 2',w='--spx(760)',wm='100%'); txt('b-sub','paragraph-1',WHITE)
rule('b-plank-ic','min-width: --spx(0);','min-width: --spx(0);',ic='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: auto;\npadding-top: --spx(14);\npadding-bottom: --spx(14);\npadding-left: --spx(26);\npadding-right: --spx(26);',icm='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: auto;\npadding-top: --spx(10);\npadding-bottom: --spx(10);\npadding-left: --spx(14);\npadding-right: --spx(14);')
gi('b-title','1 / 2','1 / 2','1 / 2','1 / 2'); H.bglay('b-plank-bg'); fill('b-plank-bg',BLUE)
sty.append('.b-plank-ic {\n    --borderStartStartRadius: 10px;\n    --borderStartEndRadius: 10px;\n    --borderEndStartRadius: 10px;\n    --borderEndEndRadius: 10px;\n    --boxShadow: 0px 6px 0px rgba(5, 14, 28, 0.45);\n}')
txt('b-kick','heading-6',YEL); txt('b-title','heading-1',WHITE)
ids=[f'c{n}' for n in range(len(chunks))]
s2=sec('s2',[stat(i,h) for i,h in zip(ids,chunks)])
rows=' '.join(['auto']*len(ids))
section('s2',3,grid_ic('s2-ic','minmax(0px, 1fr)',rows,'minmax(0px, 1fr)',rows,(40,40,56),(28,16,40),(0,18),(0,14)))
fill('s2-bg',WHITE)
for n,i in enumerate(ids): gi(i,f'{n+1} / {n+2}','1 / 2',f'{n+1} / {n+2}','1 / 2',w='--spx(860)',wm='100%'); txt(i,'paragraph-1',NAVY)
out=os.path.join(PAGES,outslug)
if os.path.exists(out):
    for f in os.listdir(out):
        fp=os.path.join(out,f)
        if f.startswith('['): continue
        shutil.rmtree(fp) if os.path.isdir(fp) else os.remove(fp)
shutil.copytree(LB,out,dirs_exist_ok=True)
camel='Txt'+''.join(w.capitalize() for w in re.split(r'[^a-z0-9]+',outslug))
gd=os.path.join(out,'_generated')
for f in os.listdir(gd):
    fp=os.path.join(gd,f); t=open(fp).read().replace('ArcadeVenuesList',camel)
    if f.endswith('.jsx') and f!='index.jsx':
        t='\n'.join(l for l in t.split('\n') if not any(x in l for x in ['/line/css','/repeater/css','/image/css','/button/css','site-service-cms']))
        imp="import '@origami-wrappers/wixEditorElements/boxcontainer/css'"
        if imp not in t: t=imp+'\n'+t
    os.remove(fp); open(os.path.join(gd,f.replace('ArcadeVenuesList',camel)),'w').write(t)
imports=[l for l in S[:S.index('export const Structure')].split('\n') if l.startswith('import') and not any(x in l for x in ['cmsprovider_','/line\'','/repeater\'','/image\'','/button\'','origami-runtime','{ media }','datatypeconversions'])]
imports.append("import { BoxContainer } from '@origami-wrappers/wixEditorElements/boxcontainer'")
imports=list(dict.fromkeys(imports))
pg=S[S.index('export const Structure'):]
_bi=pg.index('backgroundLayer={[<Background id="'+pbg); _bj=pg.index(']}',_bi); pg=pg[:pg.index('>',_bj)+1]
pg=pg.replace(f"id: '{oldpid}'",f"id: '{pid}'").replace(f'id="{oldpid}"',f'id="{pid}"').replace(f'className="{oldpid}"',f'className="{pid}"')
pg=re.sub(r"title: '[^']*'",lambda m:"title: "+json.dumps(h1[:60]),pg,count=1)
pg=pg.replace("type: 'Page',","type: 'Page',\n                pageUriSEO: "+json.dumps(outslug)+",",1)
open(os.path.join(out,'structure.jsx'),'w').write('\n'.join(imports)+'\n\n'+pg+'\n'+s1+'\n'+s2+'\n        </Page>\n)\n')
def ref(w): return f'    --spx-ref-width: {w};\n    --spx-resolver-type: scale;\n'
o=[];om=[]
for sel,d,m,ic,icm in lay:
    b_=ref(1280)+''.join('    '+l+'\n' for l in d.split('\n') if l)
    if ic: b_+='    @origami-target internal-container-content-wrapper {\n'+''.join('        '+l+'\n' for l in ic.split('\n'))+'    }\n'
    o.append(f'.{sel} {{\n{b_}}}')
    bm=ref(375)+''.join('    '+l+'\n' for l in (m or '').split('\n') if l)
    if icm: bm+='    @origami-target internal-container-content-wrapper {\n'+''.join('        '+l+'\n' for l in icm.split('\n'))+'    }\n'
    om.append('    '+f'.{sel} {{\n{bm}}}'.replace('\n','\n    '))
mq=re.search(r'@media \([^)]*\)',L).group(0)
open(os.path.join(out,'layout.css'),'w').write(base+'\n'+'\n'.join(o)+'\n'+mq+' {\n'+'\n'.join(om)+'\n}\n')
open(os.path.join(out,'style.css'),'w').write('\n'.join(sty)+'\n')
un=json.load(open(os.path.join(LB,'unmapped.json'))); un['components']={k:v for k,v in un.get('components',{}).items() if k in (hdr,ftr)}
json.dump(un,open(os.path.join(out,'unmapped.json'),'w'),indent=4,ensure_ascii=False)
json.dump({'slug':outslug,'title':title,'description':md,'h1':h1},open(os.path.join('/tmp/gen','seo_'+outslug+'.json'),'w'))
print('ok',outslug,pid,len(chunks),sum(len(c) for c in chunks),'links',sum(c.count('<a ') for c in chunks))
