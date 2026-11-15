import json
T={}
L='https://www.spin-raiders.com'
M=375
NAVY='var(--wst-base-2-color)'; WHITE='var(--wst-base-1-color)'; PINK='var(--wst-accent-1-color)'; YEL='var(--wst-accent-2-color)'; CYAN='var(--wst-accent-3-color)'; DEEP='var(--wst-accent-4-color)'
BLUE='#1F63C6'; LIGHT='var(--wst-shade-1-color)'; MUTED='var(--wst-shade-3-color)'
IMG={}
def reg(k,u,w,h): IMG[k]=(u,w,h)
for k,u,w,h in [('hero','3a517e_42651a2e3b284d329c0d12dcab45d1a0~mv2.webp',2360,1400),('letter','3a517e_95a3a249979b43e785602d22bcc28221~mv2.webp',1400,1122),('sign','3a517e_86911cbaeac642f38d1c7acf74cf329b~mv2.webp',624,1510),
 ('i_arcades','3a517e_52e74eea1aca4bdfba687daca57c3ace~mv2.png',264,264),('i_attractions','3a517e_656602c065184755876f2d59164bffd3~mv2.png',264,264),('i_food','3a517e_da879da84c7e49e19d36d01b284e3db5~mv2.png',264,264),('i_fruit','3a517e_e9a2cc320b1b4a8ab6077d177ac9e3f2~mv2.png',264,264),('i_gems','3a517e_aef4f08148bc43178b8e3daec3b4e870~mv2.png',264,264),('logo','3a517e_5432348708874a9792a6d36b5f83321a~mv2.png',460,116),('i_stay','3a517e_cefcf263cde84efd82e734a2524aa216~mv2.png',264,264),('i_plan','3a517e_02f30be442be4db7966280daca028da3~mv2.png',264,264),('i_seaside','3a517e_2a9d7d0910744bd3967372341bdeeddc~mv2.png',264,264),
 ('masala','3a517e_809ead30953140cc948d147392fd0498~mv2.jpg',1536,710),('circus','3a517e_d668362d87f04319a8765390e4ded49b~mv2.jpg',777,520),('imperial','3a517e_7586bf9946f24ea68c33cd71c784dada~mv2.jpg',1920,1440),('pizza','3a517e_7312bc3bee4e42b5a836af20596b3f2b~mv2.jpg',2000,924),('retro','3a517e_98f35c1aba72494b8741c7456780983d~mv2.webp',1672,940),
 ('skeg','3a517e_860087263c4a40a0b4ad77cacfef2339~mv2.jpg',5178,3456),('sport','3a517e_0ee13679028448f19669a22fdf9cc082~mv2.jpg',1280,855),('gy','3a517e_7aec5b44fb894b3085e44aab6c7927b5~mv2.jpg',4608,3456),('york','3a517e_52e848542e574b3aa3a03418dd17ad6e~mv2.jpg',1600,906),('scar','3a517e_a0f2883ca5cb45f08abc6090bb3847ba~mv2.jpg',6540,4360),('more','3a517e_c80f3b24abd74418ad1b7c55e4a51cc7~mv2.webp',800,450),
 ('cine','3a517e_b5bff630b8ac4e5d8e226cc740e772d9~mv2.jpg',1536,710),
 ('gs1','3a517e_407ff834b8884746ada80d0674cd53dc~mv2.jpg',1,1),('gs2','3a517e_c7fb6003ff1b4379a4beeb89026d7361~mv2.webp',1,1),('cc','3a517e_b8302628a14b4aa8aeb3a6b126c6b387~mv2.webp',1,1)]: reg(k,u,w,h)
SIZES={}
for k,(u,w,h) in list(IMG.items()):
    pass
def imgdata(i,k,alt): u,w,h=IMG[k]; return {"name":k,"uri":u,"width":w,"height":h,"id":"dataItem-"+i,"alt":alt,"type":"Builder.Image"}
def rt(i,html): return f'<WRichText id="{i}" className="{i}" richText={{{json.dumps({"html":html,"id":"dataItem-"+i,"type":"Builder.RichText"},ensure_ascii=False)}}} />'
def im(i,k,alt,href=None):
    ln=f' link={{{json.dumps({"type":"ExternalLink","id":"dataItem-"+i+"-l","url":L+href,"target":"_self"})}}}' if href else ''
    return f'<Image id="{i}" className="{i}" displayMode={{"fill"}} image={{{json.dumps(imgdata(i,k,alt),ensure_ascii=False)}}}{ln} />'
def btn(i,label,href): return f'<Button id="{i}" className="{i}" label={{{json.dumps(label,ensure_ascii=False)}}} link={{{json.dumps({"type":"ExternalLink","id":"dataItem-"+i,"url":L+href,"target":"_self"})}}} />'
def bgel(i,photo=None):
    if photo:
        k,alt=photo
        return f'<Background id="{i}" className="{i}" fittingType="fill" focalPoint={{{{ x: 50, y: 50 }}}} image={{{json.dumps(imgdata(i+"-img",k,alt),ensure_ascii=False)}}} />'
    return f'<Background id="{i}" className="{i}" />'
def box(i,kids,bg=False,photo=None):
    b=f' backgroundLayer={{[{bgel(i+"-bg",photo)}]}}' if (bg or photo) else ''
    return f'<BoxContainer id="{i}" className="{i}" children={{\n<InternalContainer id="{i}-ic" className="{i}-ic"{b}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n} />'
def sec(i,kids,photo=None): return f'<Section id="{i}" className="{i}">\n<InternalContainer id="{i}-ic" className="{i}-ic" backgroundLayer={{[{bgel(i+"-bg",photo)}]}}>\n'+'\n'.join(kids)+'\n</InternalContainer>\n</Section>'
def scr(s): return f'<span style="font-family:caveat;font-weight:700;color:{BLUE};">{s}</span>'

lay=[]; sty=[]
def rule(sel,d,m,ic=None,icm=None): lay.append((sel,d,m,ic,icm))
def bglay(i):
    s='width: auto;\nheight: auto;\nalign-self: stretch;\njustify-self: stretch;\ngrid-row: 1 / -1;\ngrid-column: 1 / -1;\nposition: relative;'
    rule(i,s,s)
def fill(i,color,photo=False):
    if photo: sty.append(f'.{i} {{\n    --backgroundColor: {color};\n    --backgroundImage: none;\n    --backgroundColorOpacity: 1;\n    --backgroundMediaOpacity: 1;\n}}')
    else: sty.append(f'.{i} {{\n    --backgroundColor: {color};\n    --backgroundImage: none;\n    --backgroundColorOpacity: 1;\n}}')
def grid_ic(i,cols_d,rows_d,cols_m,rows_m,pad_d,pad_m,gap_d=(24,24),gap_m=(16,16),minh=None,minhm=None):
    pd=f'padding-top: --spx({pad_d[0]});\npadding-bottom: --spx({pad_d[2] if len(pad_d)>2 else pad_d[0]});\npadding-left: --spx({pad_d[1]});\npadding-right: --spx({pad_d[1]});'
    pm=f'padding-top: --spx({pad_m[0]});\npadding-bottom: --spx({pad_m[2] if len(pad_m)>2 else pad_m[0]});\npadding-left: --spx({pad_m[1]});\npadding-right: --spx({pad_m[1]});'
    return (f'display: grid;\ngrid-template-columns: {cols_d};\ngrid-template-rows: {rows_d};\n'+pd+f'\ncolumn-gap: --spx({gap_d[0]});\nrow-gap: --spx({gap_d[1]});',
            f'display: grid;\ngrid-template-columns: {cols_m};\ngrid-template-rows: {rows_m};\n'+pm+f'\ncolumn-gap: --spx({gap_m[0]});\nrow-gap: --spx({gap_m[1]});')
def section(i,row,g,minh=0,minhm=0):
    rule(i,f'width: auto;\nheight: auto;\nmin-width: 0px;\nmin-height: 0px;\ngrid-row: {row} / {row+1};\ngrid-column: 1 / 2;\nalign-self: stretch;\njustify-self: stretch;\nposition: relative;','width: auto;\nheight: auto;\nmin-width: 0px;\nmin-height: 0px;')
    rule(i+'-ic',f'width: 100%;\nmin-height: --spx({minh});',f'width: 100%;\nmin-height: --spx({minhm});',ic=g[0],icm=g[1])
    bglay(i+'-bg')
def gi(i,rd,cd,rm,cm,w='100%',a='start',j='start',h='auto',hm='auto',wm='100%',am='start',jm='start'):
    rule(i,f'width: {w};\nheight: {h};\nmin-width: 0px;\ngrid-row: {rd};\ngrid-column: {cd};\nalign-self: {a};\njustify-self: {j};\nposition: relative;',
         f'width: {wm};\nheight: {hm};\nmin-width: 0px;\ngrid-row: {rm};\ngrid-column: {cm};\nalign-self: {am};\njustify-self: {jm};')
def boxic_grid(i,g): rule(i,'min-width: --spx(0);','min-width: --spx(0);',ic=g[0],icm=g[1])
def stack(i,pad_d,pad_m,pd=None):
    def P(p):
        if isinstance(p,int): p=(p,p,p,p)
        return f'padding-top: --spx({p[0]});\npadding-right: --spx({p[1]});\npadding-bottom: --spx({p[2]});\npadding-left: --spx({p[3]});'
    rule(i,'min-width: --spx(0);','min-width: --spx(0);',ic='display: flex;\nflex-direction: column;\n'+P(pad_d),icm='display: flex;\nflex-direction: column;\n'+P(pad_m))
def sc(i,order,mb,mbm=None,w='100%',h='auto',a='start',hm=None):
    mbm=mb if mbm is None else mbm
    rule(i,f'width: {w};\nheight: {h};\nmin-width: 0px;\nalign-self: {a};\norder: {order};\nposition: relative;'+(f'\nmargin-bottom: --spx({mb});' if mb else ''),
         f'width: {w};\nheight: {hm or h};\nmin-width: 0px;\nalign-self: {a};\norder: {order};'+(f'\nmargin-bottom: --spx({mbm});' if mbm else ''))
def stackkids(ids,gaps,gapm=None,widths=None,heights=None):
    for n,i in enumerate(ids):
        last=n==len(ids)-1
        w=(widths or {}).get(i,'100%'); h,hm=(heights or {}).get(i,('auto','auto'))
        sc(i,n+1,None if last else gaps[n] if isinstance(gaps,list) else gaps,None if last else (gapm[n] if isinstance(gapm,list) else gapm) if gapm is not None else None,w=w,h=h,hm=hm)
def txt(i,slot,color=None,align=None,extra=''):
    c=color or f'var(--wst-{slot}-color)'
    s=f'.{i} {{\n    font: var(--wst-{slot}-font);\n    color: {c};\n    letter-spacing: var(--wst-{slot}-letter-spacing);\n    text-decoration: var(--wst-{slot}-text-decoration);\n'+(f'    text-align: {align};\n' if align else '')+extra+'}'
    sty.append(s)
def card(i,radius=18,shadow=True,borders=None):
    s=f'.{i}-ic {{\n    --borderStartStartRadius: {radius}px;\n    --borderStartEndRadius: {radius}px;\n    --borderEndStartRadius: {radius}px;\n    --borderEndEndRadius: {radius}px;\n'
    if shadow: s+='    --boxShadow: 0px 6px 22px rgba(11, 25, 44, 0.10);\n'
    if borders:
        for side,(wd,col) in borders.items(): s+=f'    --border{side}Width: {wd}px;\n    --border{side}Color: {col};\n    --border{side}Style: solid;\n'
    sty.append(s+'}')
def cbtn(i,bg,fg,r=999):
    sty.append(f'.{i} {{\n    --preset: baseButton;\n    background: {bg};\n    border-start-start-radius: {r}px;\n    border-start-end-radius: {r}px;\n    border-end-start-radius: {r}px;\n    border-end-end-radius: {r}px;\n    padding-top: 12px;\n    padding-bottom: 12px;\n    padding-inline-start: 22px;\n    padding-inline-end: 22px;\n    box-shadow: 0px 4px 0px rgba(11, 25, 44, 0.18);\n}}\n.{i} .label {{\n    font: var(--wst-heading-6-font);\n    color: {fg};\n    letter-spacing: var(--wst-heading-6-letter-spacing);\n    text-decoration-line: none;\n}}')
def link(href,label,color=None): return f'<a href="{L}{href}" target="_self">{label}</a>'
