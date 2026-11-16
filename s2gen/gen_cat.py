# Category page generator that copies the live spin-raiders.com category page layout
# usage: python3 gen_cat.py <listbase> <pages dir> <config.json>
import json,sys,re,os,shutil,hashlib,html
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import helpers as H
from helpers import rule,gi,txt,cbtn,fill,section,grid_ic,lay,sty,NAVY,WHITE,PINK,YEL,CYAN
LB,PAGES=sys.argv[1],sys.argv[2]; C=json.load(open(sys.argv[3]))
slug=C['slug']; SITE='https://www.spin-raiders.com'
S=open(os.path.join(LB,'structure.jsx')).read(); L=open(os.path.join(LB,'layout.css')).read()
oldpid=re.search(r'<Page\s+id="([^"]+)"',S).group(1)
hdr=re.search(r'<Header_\w+ id="([^"]+)"',S).group(1); ftr=re.search(r'<Footer_\w+ id="([^"]+)"',S).group(1)
pbg=re.search(r'backgroundLayer=\{\[<Background id="([^"]+)"',S[S.index('<Page'):]).group(1)
pid=oldpid if C.get('keep_id',True) else 'c'+hashlib.md5(slug.encode()).hexdigest()[:4]
ROLES={'Venues':'w1piy7m','NearbyAttractions':'v25olth','HotelGuides':'rchxpjc','FoodAndDrink':'ar5gsd0','ClassicFruitMachines':'28pp9fa','Locations':'z42qzjc','AffiliateOffers':'k61pfck'}
PFX={'Venues':'/venue','NearbyAttractions':'/attraction','HotelGuides':'/hotel','FoodAndDrink':'/food-and-drink','ClassicFruitMachines':'/fruit-machine','Locations':'/destination','AffiliateOffers':'/offer'}
INK='#102744'; GREY='#536981'; MAG='#A01859'; LIGHTBLUE='#F1FBFF'; PALE='#F5F9FD'; BAR='#00A3E0'
def esc(s): return html.escape(s,quote=False)
def ph(i,h): return {"id":"dataItem-"+i,"type":"Builder.RichText","html":h}
def rt(i,h): return f'<WRichText id="{i}" className="{i}" richText={{{json.dumps(ph(i,h),ensure_ascii=False)}}} />'
def lnk(i,href): return {"type":"ExternalLink","id":"dataItem-"+i+"-l","url":(href if href.startswith('http') else SITE+href),"target":"_self"}
def imgd(i,uri,w,h,alt): return {"name":alt[:60] or 'image',"uri":uri,"width":w,"height":h,"id":"dataItem-"+i,"alt":alt,"type":"Builder.Image"}
def image(i,uri,w,h,alt,href=None):
    l=f' link={{{json.dumps(lnk(i,href))}}}' if href else ''
    return f'<Image id="{i}" className="{i}" displayMode={{"fill"}} image={{{json.dumps(imgd(i,uri,w,h,alt),ensure_ascii=False)}}}{l} />'
def button(i,label,href): return f'<Button id="{i}" className="{i}" label={{{json.dumps(label,ensure_ascii=False)}}} link={{{json.dumps(lnk(i,href))}}} />'
def svgimg(i,sid,href=None):
    l=f' link={{{json.dumps(lnk(i,href))}}}' if href else ''
    return f"<SvgImage id=\"{i}\" className=\"{i}\" displayMode={{'fit'}} svgId={{svg(media.getShapeUrl('wix:image://v1/{sid}').url, '{sid}')}}{l} />"
def bgc(i): return f'<Background id="{i}" className="{i}" />'
def box(i,kids): return f'<BoxContainer id="{i}" className="{i}" children={{\n<InternalContainer id="{i}-ic" className="{i}-ic" backgroundLayer={{[{bgc(i+"-bg")}]}}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n} />'
def sec(i,kids): return f'<Section id="{i}" className="{i}">\n<InternalContainer id="{i}-ic" className="{i}-ic" backgroundLayer={{[{bgc(i+"-bg")}]}}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n</Section>'
def boxgrid(i,cd,rd,cm,rm,pd,pm,gd=(0,0),gm=(0,0),color=None,radius=0,shadow=None):
    g=grid_ic(i,cd,rd,cm,rm,pd,pm,gd,gm)
    rule(i+'-ic','min-width: --spx(0);','min-width: --spx(0);',ic=g[0],icm=g[1])
    H.bglay(i+'-bg'); fill(i+'-bg',color or 'transparent')
    s=f'.{i}-ic {{\n'
    if radius: s+=''.join(f'    --border{k}Radius: {radius}px;\n' for k in ['StartStart','StartEnd','EndStart','EndEnd'])
    if shadow: s+=f'    --boxShadow: {shadow};\n'
    if s.count('\n')>1: sty.append(s+'}')
def flexbox(i,gap,gapm,justify='flex-start',color=None,pad=(0,0)):
    def F(g,p): return f'display: flex;\nflex-direction: row;\nflex-wrap: wrap;\nalign-items: center;\ncolumn-gap: --spx({g});\nrow-gap: --spx({g});\npadding-top: --spx({p[0]});\npadding-bottom: --spx({p[0]});\npadding-left: --spx({p[1]});\npadding-right: --spx({p[1]});'
    rule(i+'-ic','min-width: --spx(0);','min-width: --spx(0);',ic=F(gap,pad),icm=F(gapm,pad))
    H.bglay(i+'-bg'); fill(i+'-bg',color or 'transparent')
def chipgrid(i,ids,cd,cm,gap,gapm,justify='center'):
    def G(c,g,n): return f'display: grid;\ngrid-template-columns: repeat({c}, auto);\ngrid-template-rows: {" ".join(["auto"]*((n+c-1)//c))};\ncolumn-gap: --spx({g});\nrow-gap: --spx({g});'
    rule(i+'-ic','min-width: --spx(0);','min-width: --spx(0);',ic=G(cd,gap,len(ids)),icm=G(cm,gapm,len(ids)))
    H.bglay(i+'-bg'); fill(i+'-bg','transparent')
    for n,x in enumerate(ids):
        gi(x,f'{n//cd+1} / {n//cd+2}',f'{n%cd+1} / {n%cd+2}',f'{n//cm+1} / {n//cm+2}',f'{n%cm+1} / {n%cm+2}',w='auto',wm='auto',j='center' if justify=='center' else 'start',jm='center' if justify=='center' else 'start')
def flexitem(i,w='auto',wm=None): rule(i,f'width: {w};\nheight: auto;\nmin-width: 0px;\nposition: relative;',f'width: {wm or w};\nheight: auto;\nmin-width: 0px;')
def font(i,size,weight,color,lh=1.3,fam='oswald-v2',extra='',sizem=None,align=None):
    fam=fam or 'inter'
    sty.append(f'.{i} {{\n    font: normal normal {weight} --spx({size})/{lh}em {fam};\n    color: {color};\n'+(f'    text-align: {align};\n' if align else '')+'}')
def pill(i,bg,fg,size=15,r=999,pad=(12,22),border=None,shadow=True):
    b=''.join(f'    {k}: {border};\n' for k in ['border-top','border-bottom','border-inline-start','border-inline-end']) if border else ''
    sh='    box-shadow: 0px 4px 0px rgba(11, 25, 44, 0.18);\n' if shadow else ''
    sty.append(f'.{i} {{\n    --preset: baseButton;\n    background: {bg};\n'+b+''.join(f'    border-{k}-radius: {r}px;\n' for k in ['start-start','start-end','end-start','end-end'])+f'    padding-top: {pad[0]}px;\n    padding-bottom: {pad[0]}px;\n    padding-inline-start: {pad[1]}px;\n    padding-inline-end: {pad[1]}px;\n'+sh+f'}}\n.{i} .label {{\n    font: var(--wst-heading-6-font);\n    font-size: {size}px;\n    color: {fg};\n    letter-spacing: 0;\n    text-decoration-line: none;\n}}')
secs=[]; row=2
def do_hero(b,k=0):
    global row
    sid=f's{row}'
    h=b
    chips=[button(f'tc{n}',t,u) for n,(t,u) in enumerate(b['towns'])]
    secs.append(sec(sid+'',[image('h-img',h['uri'],h['w'],h['h'],h['alt']),
        box('srch',[rt('srch-t','<p>🔍&nbsp;&nbsp;'+esc(b['search_text'])+'</p>'),button('srch-b',"Let’s explore →",'/search')]),
        box('chips',chips)]))
    g=grid_ic(sid+'-ic','minmax(0px, 1fr)','minmax(0px, 1fr) auto auto','minmax(0px, 1fr)','minmax(0px, 1fr) auto auto',(0,24,22),(0,12,16),(0,12),(0,10))
    section(sid+'',row,g,427,330); fill(sid+'-bg','#0B2A4A')
    rule('h-img','height: 100%;\nmin-width: 0px;\ngrid-row: 1 / 4;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;\nposition: relative;\nmargin-left: --spx(-24);\nmargin-right: --spx(-24);\nmargin-bottom: --spx(-22);\nwidth: calc(100% + --spx(48));','width: calc(100% + --spx(24));\nheight: 100%;\nmin-width: 0px;\ngrid-row: 1 / 4;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;\nmargin-left: --spx(-12);\nmargin-bottom: --spx(-16);')
    gi('srch','2 / 3','1 / 2','2 / 3','1 / 2',w='--spx(820)',wm='100%',j='center',jm='center')
    boxgrid('srch','minmax(0px, 1fr) auto','auto','minmax(0px, 1fr) auto','auto',(8,8),(6,6),(12,0),(8,0),color=WHITE,radius=14,shadow='0px 10px 30px rgba(5, 14, 28, 0.35)')
    rule('srch-ic','min-width: --spx(0);','min-width: --spx(0);',ic='display: grid;\ngrid-template-columns: minmax(0px, 1fr) auto;\ngrid-template-rows: auto;\npadding-top: --spx(8);\npadding-bottom: --spx(8);\npadding-left: --spx(22);\npadding-right: --spx(8);\ncolumn-gap: --spx(12);',icm='display: grid;\ngrid-template-columns: minmax(0px, 1fr) auto;\ngrid-template-rows: auto;\npadding-top: --spx(6);\npadding-bottom: --spx(6);\npadding-left: --spx(12);\npadding-right: --spx(6);\ncolumn-gap: --spx(8);')
    gi('srch-t','1 / 2','1 / 2','1 / 2','1 / 2',a='center',am='center'); font('srch-t',17,400,'#6B7A8C',fam=None)
    gi('srch-b','1 / 2','2 / 3','1 / 2','2 / 3',w='auto',wm='auto',a='center',am='center')
    pill('srch-b','linear-gradient(180deg, #F0407F, #D81B60)',WHITE,size=17,r=10,pad=(14,22))
    gi('chips','3 / 4','1 / 2','3 / 4','1 / 2',w='auto',wm='auto',j='center',jm='center')
    chipgrid('chips',[f'tc{n}' for n in range(len(chips))],6,3,8,6)
    for n in range(len(chips)): pill(f'tc{n}','rgba(16, 39, 68, 0.88)',WHITE,size=13,pad=(7,14),border='1px solid rgba(255,255,255,0.35)',shadow=False)
    row+=1

def do_intro(b,k=0):
    global row
    sid=f's{row}'
    secs.append(sec(sid+'',[box('intro',[box('in-bar',[]),box('in-txt',[rt('in-h','<h1>'+esc(b['h1'])+'</h1>'),rt('in-p','<p>'+esc(b['intro'])+'</p>')])])]))
    section(sid+'',row,grid_ic(sid+'-ic','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(22,0,14),(14,0,10)))
    fill(sid+'-bg',WHITE)
    gi('intro','1 / 2','1 / 2','1 / 2','1 / 2')
    boxgrid('intro','--spx(5) minmax(0px, 1fr)','auto','--spx(5) minmax(0px, 1fr)','auto',(0,0),(0,0),color=LIGHTBLUE,radius=4)
    gi('in-bar','1 / 2','1 / 2','1 / 2','1 / 2',w='--spx(5)',wm='--spx(5)',h='100%',hm='100%',a='stretch',am='stretch'); boxgrid('in-bar','1fr','1fr','1fr','1fr',(0,0),(0,0),color=BAR)
    gi('in-txt','1 / 2','2 / 3','1 / 2','2 / 3')
    boxgrid('in-txt','minmax(0px, 1fr)','auto auto','minmax(0px, 1fr)','auto auto',(20,22,22),(16,16,18),(0,8),(0,6))
    gi('in-h','1 / 2','1 / 2','1 / 2','1 / 2'); font('in-h',36,900,INK,lh=1.1,sizem=27)
    gi('in-p','2 / 3','1 / 2','2 / 3','1 / 2',w='--spx(820)',wm='100%'); font('in-p',16,400,'#27425F',lh=1.6,fam=None)
    row+=1

def do_strip(b,k=0):
    global row
    sid=f's{row}'
    items=b['items']; kids=[]
    for n,it in enumerate(items):
        kids.append(box(f'cs{n}',[image(f'cs{n}-i',it['icon'],132,132,it['label'],it['href']),rt(f'cs{n}-t',f'<p><a href="{SITE}{it["href"]}" target="_self"><span style="color:#102744;">{esc(it["label"])}</span></a></p>')]))
    secs.append(sec(sid+'',kids))
    nI=len(items)
    section(sid+'',row,grid_ic(sid+'-ic',f'repeat({nI}, minmax(0px, 1fr))','auto','repeat(3, minmax(0px, 1fr))','auto',(10,0,26),(8,0,18),(0,0),(6,6)))
    fill(sid+'-bg',WHITE)
    for n,it in enumerate(items):
        r=n//3+1; c=n%3+1
        gi(f'cs{n}','1 / 2',f'{n+1} / {n+2}',f'{r} / {r+1}',f'{c} / {c+1}',h='100%',hm='100%',a='stretch',am='stretch')
        on=it.get('on')
        boxgrid(f'cs{n}','minmax(0px, 1fr)','auto auto','minmax(0px, 1fr)','auto auto',(12,6,10),(10,4,8),(0,6),(0,4),color=('#FFF2B8' if on else WHITE),radius=10,shadow=('0px 0px 0px 2px #F2C200' if on else None))
        rule(f'cs{n}-i','width: --spx(44);\nheight: --spx(44);\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: start;\njustify-self: center;\nposition: relative;','width: --spx(36);\nheight: --spx(36);\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: start;\njustify-self: center;')
        gi(f'cs{n}-t','2 / 3','1 / 2','2 / 3','1 / 2'); font(f'cs{n}-t',12,700,INK,lh=1.25,align='center',sizem=11,fam=None)
    row+=1

def head(k,title,blabel,bhref):
    return [rt(f'{k}-h','<h2>'+esc(title)+'</h2>')]+([button(f'{k}-v',blabel,bhref)] if blabel else [])
def headlay(k):
    gi(f'{k}-h','1 / 2','1 / 2','1 / 2','1 / 2',a='center',am='center'); font(f'{k}-h',32,900,INK,lh=1.15,sizem=24)
    gi(f'{k}-v','1 / 2','2 / 3','2 / 3','1 / 2',w='auto',wm='auto',a='center',am='center',j='end',jm='start')
    pill(f'{k}-v',WHITE,INK,size=14,r=999,pad=(9,16),border='2px solid #102744',shadow=False)

def do_tiles(b,k=0):
    global row
    sid=f's{row}'
    T=b['items']; BT=b.get('button') or [None,None]; kids=head(f't{k}',b['title'],BT[0],BT[1])
    for n,t in enumerate(T):
        kids.append(box(f'tl{k}x{n}',[image(f'tl{k}x{n}-i',t['uri'],t['w'],t['h'],t['label'],t['href']),rt(f'tl{k}x{n}-t',(f'<p><a href="{SITE}{t["href"]}" target="_self"><span style="color:#FFFFFF;">{esc(t["label"])}</span></a></p>' if t.get("href") else f'<p>{esc(t["label"])}</p>'))]))
    secs.append(sec(sid+'',kids))
    rowsT=(len(T)+2)//3
    section(sid+'',row,grid_ic(sid+'-ic','repeat(3, minmax(0px, 1fr))','auto '+' '.join(['auto']*rowsT),'minmax(0px, 1fr)','auto auto '+' '.join(['auto']*len(T)),(26,40,30),(18,16,22),(22,22),(0,14)))
    fill(sid+'-bg',WHITE)
    gi(f't{k}-h','1 / 2','1 / 3','1 / 2','1 / 2')
    if BT[0]: rule(f't{k}-v','width: auto;\nheight: auto;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 3 / 4;\nalign-self: center;\njustify-self: end;\nposition: relative;','width: auto;\nheight: auto;\nmin-width: 0px;\ngrid-row: 2 / 3;\ngrid-column: 1 / 2;\nalign-self: center;\njustify-self: start;')
    font(f't{k}-h',32,900,INK,lh=1.15,sizem=24)
    if BT[0]: pill(f't{k}-v',WHITE,INK,size=14,r=999,pad=(9,16),border='2px solid #102744',shadow=False)
    for n,t in enumerate(T):
        r=n//3+2; c=n%3+1
        gi(f'tl{k}x{n}',f'{r} / {r+1}',f'{c} / {c+1}',f'{n+3} / {n+4}','1 / 2')
        boxgrid(f'tl{k}x{n}','minmax(0px, 1fr)','minmax(0px, 1fr)','minmax(0px, 1fr)','minmax(0px, 1fr)',(0,0),(0,0),color='#0B2A4A',radius=14,shadow='0px 6px 22px rgba(11, 25, 44, 0.12)')
        rule(f'tl{k}x{n}-i','width: 100%;\naspect-ratio: 16 / 10;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;\nposition: relative;','width: 100%;\naspect-ratio: 16 / 9;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;')
        rule(f'tl{k}x{n}-t','width: auto;\nheight: auto;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: end;\njustify-self: start;\nposition: relative;\nmargin-left: --spx(18);\nmargin-bottom: --spx(14);','width: auto;\nheight: auto;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: end;\njustify-self: start;\nmargin-left: --spx(14);\nmargin-bottom: --spx(10);')
        font(f'tl{k}x{n}-t',22,800,WHITE,lh=1.15,sizem=19); sty.append(f'.tl{k}x{n}-t {{\n    background-color: rgba(11, 25, 44, 0.72);\n}}')
    row+=1

def do_featured(b,k=0):
    global row
    sid=f's{row}'
    F=b['items']; BT=b.get('button') or [None,None]; kids=head(f'f{k}',b['title'],BT[0],BT[1])
    for n,f in enumerate(F):
        kids.append(box(f'fc{k}x{n}',[image(f'fc{k}x{n}-i',f['uri'],f['w'],f['h'],f['alt'],f['href']),rt(f'fc{k}x{n}-k','<p>'+esc(f['kicker'])+'</p>'),
            rt(f'fc{k}x{n}-t',f'<h4><a href="{SITE}{f["href"]}" target="_self"><span style="color:#102744;">{esc(f["title"])}</span></a></h4>'),rt(f'fc{k}x{n}-s','<p>'+esc(f['town'])+'</p>'),rt(f'fc{k}x{n}-d','<p>'+esc(f['text'])+'</p>'),
            button(f'fc{k}x{n}-b','→',f['href'])]))
    secs.append(sec(sid+'',kids))
    nF=len(F)
    section(sid+'',row,grid_ic(sid+'-ic',f'repeat({nF}, minmax(0px, 1fr))','auto auto','minmax(0px, 1fr)','auto auto '+' '.join(['auto']*nF),(26,40,30),(18,16,22),(20,22),(0,14)))
    fill(sid+'-bg',WHITE)
    rule(f'f{k}-h',f'width: auto;\nheight: auto;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / {nF};\nalign-self: center;\njustify-self: start;\nposition: relative;','width: auto;\nheight: auto;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: center;\njustify-self: start;')
    if BT[0]: rule(f'f{k}-v',f'width: auto;\nheight: auto;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: {nF} / {nF+1};\nalign-self: center;\njustify-self: end;\nposition: relative;','width: auto;\nheight: auto;\nmin-width: 0px;\ngrid-row: 2 / 3;\ngrid-column: 1 / 2;\nalign-self: center;\njustify-self: start;')
    font(f'f{k}-h',32,900,INK,lh=1.15,sizem=24)
    if BT[0]: pill(f'f{k}-v',WHITE,INK,size=14,r=999,pad=(9,16),border='2px solid #102744',shadow=False)
    for n,f in enumerate(F):
        gi(f'fc{k}x{n}','2 / 3',f'{n+1} / {n+2}',f'{n+3} / {n+4}','1 / 2',h='100%',a='stretch')
        rule(f'fc{k}x{n}-ic','min-width: --spx(0);','min-width: --spx(0);',ic='display: flex;\nflex-direction: column;\npadding-top: --spx(0);\npadding-right: --spx(0);\npadding-bottom: --spx(16);\npadding-left: --spx(0);',icm='display: flex;\nflex-direction: column;\npadding-top: --spx(0);\npadding-right: --spx(0);\npadding-bottom: --spx(14);\npadding-left: --spx(0);')
        H.bglay(f'fc{k}x{n}-bg'); fill(f'fc{k}x{n}-bg',WHITE)
        sty.append(f'.fc{k}x{n}-ic {{\n'+''.join(f'    --border{k}Radius: 14px;\n' for k in ['StartStart','StartEnd','EndStart','EndEnd'])+'    --boxShadow: 0px 6px 22px rgba(11, 25, 44, 0.12);\n}')
        order=['i','k','t','s','d','b']
        for o,p in enumerate(order):
            i=f'fc{k}x{n}-{p}'
            if p=='i': rule(i,f'width: 100%;\naspect-ratio: 16 / 10;\nmin-width: 0px;\norder: 1;\nposition: relative;\nmargin-bottom: --spx(12);','width: 100%;\naspect-ratio: 16 / 10;\nmin-width: 0px;\norder: 1;\nmargin-bottom: --spx(10);')
            else:
                mb='' if p=='b' else '\nmargin-bottom: --spx(6);'
                grow='\nflex-grow: 1;' if p=='d' else ''
                w='auto' if p=='b' else 'calc(100% - --spx(32))'
                rule(i,f'width: {w};\nheight: auto;\nmin-width: 0px;\norder: {o+1};\nposition: relative;\nmargin-left: --spx(16);\nmargin-right: --spx(16);'+mb+grow,f'width: {w};\nheight: auto;\nmin-width: 0px;\norder: {o+1};\nmargin-left: --spx(14);\nmargin-right: --spx(14);'+mb+grow)
        font(f'fc{k}x{n}-k',11,800,MAG,lh=1.4,fam=None)
        font(f'fc{k}x{n}-t',19,900,INK,lh=1.2)
        font(f'fc{k}x{n}-s',13,700,GREY,lh=1.3,fam=None)
        font(f'fc{k}x{n}-d',14,400,'#27425F',lh=1.5,fam=None)
        pill(f'fc{k}x{n}-b',INK,WHITE,size=15,r=999,pad=(6,14),shadow=False)
    row+=1

def do_all(b,k=0):
    global row
    sid=f's{row}'
    A=b; c=A['collection']; prov='CmsProvider_'+c
    flt=('filter={{ '+A['filter']+': { $isNotEmpty: true } }}') if A.get('filter') else ''
    card_kids=[f'<Image id="al-img" className="al-img" displayMode={{"fill"}} image={{item.fields.heroImage.value ?? {json.dumps({"name":"Spin Raiders","uri":"3a517e_c00db68d44ed453e96b9547639584056~mv2.jpg","width":2752,"height":1100,"alt":"","type":"Builder.Image"})}}} />',
        f'<WRichText id="al-t" className="al-t" richText={{fn(textToRichText, item.fields.title.value, {{ placeholder: {json.dumps(ph("al-t","<h4>Place</h4>"))} }})}} />',
        f'<WRichText id="al-s" className="al-s" richText={{fn(textToRichText, item.fields.{A["sub"]}.value, {{ placeholder: {json.dumps(ph("al-s","<p>Town</p>"))} }})}} />',
        f'<Button id="al-b" className="al-b" label={{"Read the guide →"}} link={{item.getPageLink({{ pageRole: {json.dumps(ROLES[c])}, href: {json.dumps(PFX[c])} }})}} />']
    rep=(f'<{prov} {flt}>\n<Repeater id="al-rep" className="al-rep" items={{ctx("items", {{ from: useCmsContext }})}} onLoadMore={{callback(ctx("pagination.loadMore", {{ from: useCmsContext }}))}} isLoading={{ctx("pagination.isLoading", {{ from: useCmsContext }})}} renderItem={{item => (\n'
         f'<InternalContainer id="al-card" className="al-card" backgroundLayer={{[{bgc("al-card-bg")}]}}>\n'+'\n'.join(card_kids)+'\n</InternalContainer>\n)}\n'
         f'emptyStateContent={{<InternalContainer id="al-empty" className="al-empty" />}} />\n</{prov}>')
    secs.append(sec(sid+'',head('a',A['title'],(A.get('button') or [None,None])[0],(A.get('button') or [None,None])[1])+[rep]))
    section(sid+'',row,grid_ic(sid+'-ic','minmax(0px, 1fr) auto','auto auto','minmax(0px, 1fr)','auto auto auto',(26,40,34),(18,16,24),(16,22),(0,12)))
    fill(sid+'-bg',WHITE)
    gi('a-h','1 / 2','1 / 2','1 / 2','1 / 2',a='center',am='center'); font('a-h',32,900,INK,lh=1.15,sizem=24)
    if (A.get('button') or [None])[0]: gi('a-v','1 / 2','2 / 3','2 / 3','1 / 2',w='auto',wm='auto',a='center',am='center',j='end',jm='start'); pill('a-v',WHITE,INK,size=14,r=999,pad=(9,16),border='2px solid #102744',shadow=False)
    gi('al-rep','2 / 3','1 / 3','3 / 4','1 / 2')
    sty.append('.al-rep {\n    --spx-ref-width: 1280;\n    --spx-resolver-type: scale;\n    --preset: grid;\n    --column-count: 3;\n    --row-gap: --spx(22);\n    --column-gap: --spx(22);\n    --background-color: transparent;\n}')
    rule('al-card','min-width: --spx(0);','min-width: --spx(0);',ic='display: flex;\nflex-direction: column;\npadding-top: --spx(0);\npadding-right: --spx(0);\npadding-bottom: --spx(16);\npadding-left: --spx(0);',icm='display: flex;\nflex-direction: column;\npadding-top: --spx(0);\npadding-right: --spx(0);\npadding-bottom: --spx(14);\npadding-left: --spx(0);')
    H.bglay('al-card-bg'); fill('al-card-bg',WHITE)
    sty.append('.al-card {\n'+''.join(f'    --border{k}Radius: 14px;\n' for k in ['StartStart','StartEnd','EndStart','EndEnd'])+'    --boxShadow: 0px 6px 22px rgba(11, 25, 44, 0.12);\n}')
    for o,i in enumerate(['al-img','al-t','al-s','al-b']):
        if i=='al-img': rule(i,'width: 100%;\naspect-ratio: 16 / 10;\nmin-width: 0px;\norder: 1;\nposition: relative;\nmargin-bottom: --spx(12);','width: 100%;\naspect-ratio: 16 / 10;\nmin-width: 0px;\norder: 1;\nmargin-bottom: --spx(10);')
        else:
            mb='' if i=='al-b' else '\nmargin-bottom: --spx(6);'
            w='auto' if i=='al-b' else 'calc(100% - --spx(32))'
            rule(i,f'width: {w};\nheight: auto;\nmin-width: 0px;\norder: {o+1};\nposition: relative;\nmargin-left: --spx(16);\nmargin-right: --spx(16);'+mb,f'width: {w};\nheight: auto;\nmin-width: 0px;\norder: {o+1};\nmargin-left: --spx(14);\nmargin-right: --spx(14);'+mb)
    font('al-t',19,900,INK,lh=1.2); font('al-s',13,700,GREY,lh=1.3,fam=None)
    pill('al-b','linear-gradient(180deg, #F0407F, #D81B60)',WHITE,size=14,r=999,pad=(9,16))
    rule('al-empty','min-width: --spx(0);','min-width: --spx(0);',ic='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: minmax(--spx(40), auto);',icm='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: minmax(--spx(40), auto);')
    row+=1

def do_editorial(b,k=0):
    global row
    sid=f's{row}'
    secs.append(sec(sid+'',[rt(f'ed{k}',b['html'])]))
    section(sid+'',row,grid_ic(sid+'-ic','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(30,40,26),(22,16,18)))
    fill(sid+'-bg',WHITE)
    gi(f'ed{k}','1 / 2','1 / 2','1 / 2','1 / 2',w='--spx(880)',wm='100%'); font(f'ed{k}',16,400,'#27425F',lh=1.65,fam=None)
    row+=1

def do_promos(b,k=0):
    global row
    sid=f's{row}'
    P=b['items']; kids=[box(f'pb{n}',[image(f'pr{n}',p['uri'],p['w'],p['h'],p['alt'],p.get('href'))]) for n,p in enumerate(P)]
    secs.append(sec(sid+'',kids))
    section(sid+'',row,grid_ic(sid+'-ic',f'repeat({len(P)}, minmax(0px, 1fr))','auto','minmax(0px, 1fr)',' '.join(['auto']*len(P)),(10,40,34),(8,16,24),(20,0),(0,14)))
    fill(sid+'-bg',WHITE)
    for n,p in enumerate(P):
        rule(f'pb{n}',f'width: 100%;\nheight: auto;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: {n+1} / {n+2};\nalign-self: start;\njustify-self: stretch;\nposition: relative;',f'width: 100%;\nheight: auto;\nmin-width: 0px;\ngrid-row: {n+1} / {n+2};\ngrid-column: 1 / 2;\nalign-self: start;\njustify-self: stretch;')
        rule(f'pb{n}-ic','min-width: --spx(0);','min-width: --spx(0);',ic='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: auto;',icm='display: grid;\ngrid-template-columns: minmax(0px, 1fr);\ngrid-template-rows: auto;')
        H.bglay(f'pb{n}-bg'); fill(f'pb{n}-bg','transparent')
        sty.append(f'.pb{n}-ic {{\n'+''.join(f'    --border{k}Radius: 14px;\n' for k in ['StartStart','StartEnd','EndStart','EndEnd'])+'}')
        rule(f'pr{n}','width: 100%;\naspect-ratio: 835 / 482;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nposition: relative;','width: 100%;\naspect-ratio: 835 / 482;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;')
    row+=1

def do_more(b,k=0):
    global row
    sid=f's{row}'
    M=b['items']; kids=[rt('mw-h','<h2>More ways to spend your day</h2>'),box('mw',[button(f'mw{n}',t,u) for n,(t,u) in enumerate(M)])]
    secs.append(sec(sid+'',kids))
    section(sid+'',row,grid_ic(sid+'-ic','minmax(0px, 1fr)','auto auto','minmax(0px, 1fr)','auto auto',(24,40,30),(18,16,22),(0,16),(0,12)))
    fill(sid+'-bg',PALE)
    gi('mw-h','1 / 2','1 / 2','1 / 2','1 / 2'); font('mw-h',26,900,INK,lh=1.15,sizem=22)
    gi('mw','2 / 3','1 / 2','2 / 3','1 / 2'); chipgrid('mw',[f'mw{n}' for n in range(len(M))],7,2,8,6,justify='start')
    for n in range(len(M)): pill(f'mw{n}',WHITE,INK,size=14,r=999,pad=(8,14),border='1px solid #C9DDF2',shadow=False)
    row+=1
    

def bgimg(i,uri,w,h,alt): return f'<Background id="{i}" className="{i}" fittingType="fill" focalPoint={{{{ x: 50, y: 50 }}}} image={{{json.dumps(imgd(i+"-img",uri,w,h,alt),ensure_ascii=False)}}} />'
def do_hero2(b,k=0):
    global row
    sid=f's{row}'
    kids=[box('h2t',[rt('h2t-t','<h1>'+esc(b['title'])+'</h1>')]),box('h2d',[rt('h2d-t','<p>'+esc(b['desc'])+'</p>')])]
    if b.get('pill'): kids.append(box('h2p',[rt('h2p-t','<p>'+esc(b['pill'])+'</p>')]))
    if b.get('sub'): kids.append(rt('h2s','<p>'+esc(b['sub'])+'</p>'))
    secs.append(f'<Section id="{sid}" className="{sid}">\n<InternalContainer id="{sid}-ic" className="{sid}-ic" backgroundLayer={{[{bgimg(sid+"-bg",b["uri"],b["w"],b["h"],b["title"]) if b.get("uri") else bgc(sid+"-bg")}]}}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n</Section>')
    n=len(kids); rows=' '.join(['auto']*n)
    section(sid,row,grid_ic(sid+'-ic','minmax(0px, 1fr)',rows,'minmax(0px, 1fr)',rows,(26,40,30),(18,16,22),(0,16),(0,12)),372,330)
    fill(sid+'-bg','#0B2A4A',photo=True)
    gi('h2t','1 / 2','1 / 2','1 / 2','1 / 2',w='auto',wm='auto')
    boxgrid('h2t','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(12,18),(10,14),color='rgba(11, 31, 58, 0.93)',radius=4,shadow='5px 6px 0px 0px #FFC933')
    gi('h2t-t','1 / 2','1 / 2','1 / 2','1 / 2'); font('h2t-t',41,900,WHITE,lh=1.0,sizem=30,extra='')
    sty.append('.h2t-t {\n    text-transform: uppercase;\n}')
    gi('h2d','2 / 3','1 / 2','2 / 3','1 / 2',w='--spx(600)',wm='100%')
    boxgrid('h2d','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(12,16),(10,12),color='rgba(11, 31, 58, 0.8)',radius=6)
    gi('h2d-t','1 / 2','1 / 2','1 / 2','1 / 2'); font('h2d-t',15,500,WHITE,lh=1.55,fam=None)
    r=3
    if b.get('pill'):
        gi('h2p',f'{r} / {r+1}','1 / 2',f'{r} / {r+1}','1 / 2',w='auto',wm='auto')
        boxgrid('h2p','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(7,14),(6,12),color='#E0247A',radius=3)
        gi('h2p-t','1 / 2','1 / 2','1 / 2','1 / 2'); font('h2p-t',15,900,WHITE,lh=1.2,sizem=13)
        sty.append('.h2p-t {\n    text-transform: uppercase;\n}'); r+=1
    if b.get('sub'):
        gi('h2s',f'{r} / {r+1}','1 / 2',f'{r} / {r+1}','1 / 2',w='auto',wm='100%'); font('h2s',15,600,WHITE,lh=1.4,fam=None)
        sty.append('.h2s {\n    background-color: rgba(11, 31, 58, 0.8);\n}')
    row+=1
def do_iconbtns(b,k=0):
    global row
    sid=f's{row}'; items=b['items']; kids=[]
    for n,it in enumerate(items):
        kids.append(box(f'ib{n}',[image(f'ib{n}-i',it['icon'],132,132,it['label']),rt(f'ib{n}-t','<p>'+esc(it['label'])+'</p>')]))
    secs.append(sec(sid,kids))
    cd=5; cm=2; nr=(len(items)+cd-1)//cd; nrm=(len(items)+cm-1)//cm
    section(sid,row,grid_ic(sid+'-ic',' '.join(['minmax(0px, 1fr)']*cd),' '.join(['auto']*nr),' '.join(['minmax(0px, 1fr)']*cm),' '.join(['auto']*nrm),(18,40,10),(14,16,8),(12,12),(8,8)))
    fill(sid+'-bg',WHITE)
    for n,it in enumerate(items):
        gi(f'ib{n}',f'{n//cd+1} / {n//cd+2}',f'{n%cd+1} / {n%cd+2}',f'{n//cm+1} / {n//cm+2}',f'{n%cm+1} / {n%cm+2}',h='100%',hm='100%',a='stretch',am='stretch')
        boxgrid(f'ib{n}','max-content minmax(0px, 1fr)','auto','max-content minmax(0px, 1fr)','auto',(10,12),(8,8),(10,0),(8,0),color=WHITE,radius=8,shadow='0px 0px 0px 1px #D2E2F6')
        rule(f'ib{n}-i','width: --spx(36);\nheight: --spx(36);\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: center;\njustify-self: start;\nposition: relative;','width: --spx(30);\nheight: --spx(30);\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: center;\njustify-self: start;')
        gi(f'ib{n}-t','1 / 2','2 / 3','1 / 2','2 / 3',a='center',am='center'); font(f'ib{n}-t',13,700,INK,lh=1.25,fam=None,sizem=12)
    row+=1
def do_cta(b,k=0):
    global row
    sid=f's{row}'
    kids=[rt('ct-h','<h2>'+esc(b['title'])+'</h2>'),rt('ct-p','<p>'+esc(b.get('text',''))+'</p>')]
    if b.get('button'): kids.append(button('ct-b',b['button'][0],b['button'][1]))
    secs.append(sec(sid,kids))
    section(sid,row,grid_ic(sid+'-ic','minmax(0px, 1fr) max-content','auto auto','minmax(0px, 1fr)','auto auto auto',(24,40,24),(18,16,18),(20,6),(0,10)))
    fill(sid+'-bg','#EAF8FF')
    gi('ct-h','1 / 2','1 / 2','1 / 2','1 / 2'); font('ct-h',26,900,INK,lh=1.15,sizem=22)
    gi('ct-p','2 / 3','1 / 2','2 / 3','1 / 2'); font('ct-p',15,400,'#27425F',lh=1.5,fam=None)
    if b.get('button'):
        rule('ct-b','width: auto;\nheight: auto;\nmin-width: 0px;\ngrid-row: 1 / 3;\ngrid-column: 2 / 3;\nalign-self: center;\njustify-self: end;\nposition: relative;','width: auto;\nheight: auto;\nmin-width: 0px;\ngrid-row: 3 / 4;\ngrid-column: 1 / 2;\nalign-self: center;\njustify-self: start;')
        pill('ct-b','linear-gradient(180deg, #F0407F, #D81B60)',WHITE,size=15,r=999,pad=(11,20))
    row+=1
def do_hero3(b,k=0):
    global row
    sid=f's{row}'
    left=[rt('h3t','<h1>'+esc(b['title'])+'</h1>'),rt('h3d','<p>'+esc(b['desc'])+'</p>')]
    if b.get('h2'): left.append(rt('h3h','<h2>'+esc(b['h2'])+'</h2>'))
    if b.get('sub'): left.append(rt('h3s','<p>'+esc(b['sub'])+'</p>'))
    if b.get('badge'): left.append(box('h3b',[rt('h3b-t','<p>18+</p>')]))
    left.append(box('h3q',[rt('h3q-t','<p>'+esc(b['search'])+'</p>'),button('h3q-b','Search →','/search')]))
    secs.append(sec(sid,[box('h3l',left),image('h3i',b['uri'],b['w'],b['h'],b['alt'])]))
    section(sid,row,grid_ic(sid+'-ic','minmax(0px, 1fr) minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto auto',(0,0,0),(0,0,0),(0,0),(0,0)),560,0)
    fill(sid+'-bg','#0B2545')
    gi('h3l','1 / 2','1 / 2','2 / 3','1 / 2',h='100%',hm='auto',a='stretch',am='start')
    n=len(left); boxgrid('h3l','minmax(0px, 1fr)',' '.join(['auto']*n),'minmax(0px, 1fr)',' '.join(['auto']*n),(32,32),(24,18),(0,16),(0,14))
    r=1
    def nxt(i,**kw):
        nonlocal r; gi(i,f'{r} / {r+1}','1 / 2',f'{r} / {r+1}','1 / 2',**kw); r+=1
    nxt('h3t'); font('h3t',44,900,WHITE,lh=1.15,sizem=30); sty.append('.h3t {\n    text-transform: uppercase;\n}')
    nxt('h3d'); font('h3d',16,500,WHITE,lh=1.7,fam=None)
    if b.get('h2'): nxt('h3h'); font('h3h',15,900,WHITE,lh=1.3,fam=None); sty.append('.h3h {\n    text-transform: uppercase;\n}')
    if b.get('sub'): nxt('h3s'); font('h3s',16,500,WHITE,lh=1.7,fam=None)
    if b.get('badge'):
        nxt('h3b',w='--spx(40)',wm='--spx(36)')
        boxgrid('h3b','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(9,0),(8,0),color=WHITE,radius=999,shadow='0px 0px 0px 3px #E0247A')
        gi('h3b-t','1 / 2','1 / 2','1 / 2','1 / 2',a='center',am='center'); font('h3b-t',13,900,'#E0247A',lh=1.0,fam=None,align='center')
    nxt('h3q',w='100%',wm='100%')
    boxgrid('h3q','minmax(0px, 1fr) max-content','auto','minmax(0px, 1fr) max-content','auto',(5,5),(4,4),(8,0),(6,0),color=WHITE,radius=6)
    gi('h3q-t','1 / 2','1 / 2','1 / 2','1 / 2',a='center',am='center'); font('h3q-t',15,400,'#6B7A8C',fam=None)
    gi('h3q-b','1 / 2','2 / 3','1 / 2','2 / 3',w='auto',wm='auto',a='center',am='center')
    pill('h3q-b','linear-gradient(180deg, #F0407F, #D81B60)',WHITE,size=15,r=4,pad=(13,24))
    rule('h3i','width: 100%;\nheight: 100%;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 2 / 3;\nalign-self: stretch;\njustify-self: stretch;\nposition: relative;','width: 100%;\nheight: --spx(240);\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;')
    row+=1
FN={'hero3':do_hero3,'hero2':do_hero2,'iconbtns':do_iconbtns,'cta':do_cta,'hero':do_hero,'intro':do_intro,'strip':do_strip,'tiles':do_tiles,'featured':do_featured,'all':do_all,'editorial':do_editorial,'promos':do_promos,'more':do_more}
cnt={}
for blk in C['blocks']:
    t=blk['type']; FN[t](blk,cnt.get(t,0)); cnt[t]=cnt.get(t,0)+1

NS=row-2
# ---------- write files
def keep(ids):
    o=[]
    for i in ids:
        m=re.search(r'\n?\.'+re.escape(i)+r' \{.*?\n\}',L[:L.index('@media')],re.S); o.append(m.group(0).strip())
    return '\n'.join(o)
base=keep([oldpid,hdr,ftr,pbg]).replace('.'+oldpid+' {','.'+pid+' {')
base=re.sub(r'(\.'+re.escape(pid)+r' \{.*?grid-template-rows: )[^;\n]*',r'\1'+' '.join(['auto']*(NS+2)),base,flags=re.S)
base=re.sub(r'(\.'+re.escape(ftr)+r' \{.*?grid-row: )[^;\n]*',r'\g<1>'+f'{NS+2} / {NS+3}',base,flags=re.S)
out=os.path.join(PAGES,slug)
if os.path.exists(out):
    for f in os.listdir(out):
        fp=os.path.join(out,f)
        if f.startswith('['): continue
        shutil.rmtree(fp) if os.path.isdir(fp) else os.remove(fp)
shutil.copytree(LB,out,dirs_exist_ok=True)
camel='Cat'+''.join(w.capitalize() for w in re.split(r'[^a-z0-9]+',slug))
gd=os.path.join(out,'_generated')
for f in os.listdir(gd):
    p=os.path.join(gd,f); t=open(p).read().replace('ArcadeVenuesList',camel)
    if f.endswith('.jsx') and f!='index.jsx':
        t='\n'.join(l for l in t.split('\n') if not ('/line/css' in l))
        for need in ['boxcontainer','repeater','button','image','wrichtext','svgimage']:
            imp=f"import '@origami-wrappers/wixEditorElements/{need}/css'"
            if imp not in t: t=imp+'\n'+t
    os.remove(p); open(os.path.join(gd,f.replace('ArcadeVenuesList',camel)),'w').write(t)
imports=[l for l in S[:S.index('export const Structure')].split('\n') if l.startswith('import') and not any(x in l for x in ['cmsprovider_','/line\'','{ svg }','{ media }','origami-runtime'])]
imports+=["import { BoxContainer } from '@origami-wrappers/wixEditorElements/boxcontainer'","import { SvgImage } from '@origami-wrappers/wixEditorElements/svgimage'","import { Button } from '@origami-wrappers/wixEditorElements/button'","import { Image } from '@origami-wrappers/wixEditorElements/image'","import { Repeater } from '@origami-wrappers/wixEditorElements/repeater'","import { WRichText } from '@origami-wrappers/wixEditorElements/wrichtext'","import { callback, ctx, fn, svg } from '@wix/origami-runtime'","import { media } from '@wix/sdk'",
    ]
for _b in C['blocks']:
    if _b['type']=='all':
        c=_b['collection']; imports+=[f"import {{ CmsProvider_{c} }} from '@origami-wrappers/companionApp/cmsprovider_{c.lower()}'",f"import {{ useCmsContext }} from '@origami-wrappers/companionApp/cmsprovider_{c.lower()}'"]
if 'textToRichText' not in '\n'.join(imports):
    tl=[l for l in S.split('\n') if 'textToRichText' in l and l.startswith('import')]
    imports+=tl
imports=list(dict.fromkeys(imports))
pg=S[S.index('export const Structure'):]
_bi=pg.index('backgroundLayer={[<Background id="'+pbg); _bj=pg.index(']}',_bi); pg=pg[:pg.index('>',_bj)+1]
pg=pg.replace(f"id: '{oldpid}'",f"id: '{pid}'").replace(f'id="{oldpid}"',f'id="{pid}"').replace(f'className="{oldpid}"',f'className="{pid}"')
pg=re.sub(r"title: '[^']*'",lambda m:"title: "+json.dumps(C['title']),pg,count=1)
pg=re.sub(r"pageTitleSEO: (?:'[^']*'|\"[^\"]*\")",lambda m:"pageTitleSEO: "+json.dumps(C.get('seo_title',''),ensure_ascii=False),pg,count=1)
pg=re.sub(r"descriptionSEO: (?:'[^']*'|\"[^\"]*\")",lambda m:"descriptionSEO: "+json.dumps(C.get('seo_description',''),ensure_ascii=False),pg,count=1)
if 'pageUriSEO' not in pg: pg=pg.replace("type: 'Page',","type: 'Page',\n                pageUriSEO: "+json.dumps(slug)+",",1)
open(os.path.join(out,'structure.jsx'),'w').write('\n'.join(imports)+'\n\n'+pg+'\n'+'\n'.join(secs)+'\n        </Page>\n)\n')
def ref(w): return f'    --spx-ref-width: {w};\n    --spx-resolver-type: scale;\n'
def fixcols(t):
    if not t: return t
    def rep(m): return ' '.join([m.group(2).strip()]*int(m.group(1)))
    out=[]
    for line in t.split('\n'):
        if line.startswith('grid-template-columns:') or line.startswith('grid-template-rows:'):
            line=re.sub(r'repeat\((\d+),\s*((?:minmax\([^)]*\)|[^)])*)\)',rep,line)
            if line.startswith('grid-template-columns:'):
                line=re.sub(r'(?<![\w-])auto(?![\w-])','max-content',line); line=line.replace('--spx(5)','max-content')
        out.append(line)
    return '\n'.join(out)
lay[:]=[(a,b,c,fixcols(d),fixcols(e)) for a,b,c,d,e in lay]
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
mob='.al-rep {\n    --spx-ref-width: 375;\n    --spx-resolver-type: scale;\n    --preset: grid;\n    --column-count: 1;\n}'
has_all=any(_b['type']=='all' for _b in C['blocks'])
open(os.path.join(out,'style.css'),'w').write('\n'.join(sty)+'\n'+((mq+' {\n    '+mob.replace('\n','\n    ')+'\n}\n') if has_all else ''))
un=json.load(open(os.path.join(LB,'unmapped.json'))); un['components']={k:v for k,v in un.get('components',{}).items() if k in (hdr,ftr)}
json.dump(un,open(os.path.join(out,'unmapped.json'),'w'),indent=4,ensure_ascii=False)
print('ok',slug,pid,'sections',NS)
