# Add the live "Explore by category" grid (town photos that filter the list) to a saved category page, in place.
# The grid goes at the bottom of the DirectoryFilter list section, so each town button can call toggleTopic.
# usage: python3 insert_regions.py <page dir> <regions_<slug>.json>
import json, re, sys, os, html
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import helpers as H
from helpers import rule, gi, fill, sty

d, xf = sys.argv[1:3]
R = json.load(open(xf))
B = [b for b in R['buttons'] if b.get('town')]
if not B: print('no town buttons in', xf); sys.exit(0)
SITE = 'https://www.spin-raiders.com'
INK = '#102744'; GREY = '#536981'
F = '{ from: useDirectoryFilter }'
S = open(os.path.join(d, 'structure.jsx')).read(); L = open(os.path.join(d, 'layout.css')).read(); St = open(os.path.join(d, 'style.css')).read()
if 'id="tc-grid"' in S: print('already has the destination grid'); sys.exit(0)
if '<DirectoryFilter' not in S: print('no DirectoryFilter list on', d); sys.exit(1)

def esc(s): return html.escape(s, quote=False)
def ph(i, h): return {"id": "dataItem-" + i, "type": "Builder.RichText", "html": h}
def rt(i, h): return f'<WRichText id="{i}" className="{i}" richText={{{json.dumps(ph(i, h), ensure_ascii=False)}}} />'
def lnk(href): return {"target": "_self", "href": (href if href.startswith('http') else SITE + href), "rel": "noreferrer noopener"}
def bgc(i): return f'<Background id="{i}" className="{i}" />'
def box(i, kids): return f'<BoxContainer id="{i}" className="{i}" children={{\n<InternalContainer id="{i}-ic" className="{i}-ic" backgroundLayer={{[{bgc(i + "-bg")}]}}>\n' + '\n'.join(kids) + '\n</InternalContainer>\n} />'
def image(i, uri, w, h, alt):
    nm = re.sub(r'[^a-z0-9]+', '-', (alt or 'image').lower()).strip('-')[:40] or 'image'
    url = f"media.getCroppedImageUrl('wix:image://v1/{uri}/{nm}#originWidth={w}&originHeight={h}', 0, 0, 0, 0, {w}, {h}, {{ name: '{nm}', autoEncode: true, devicePixelRatio: 1 }})"
    data = json.dumps({"name": nm, "uri": uri, "width": w, "height": h, "alt": alt, "type": "Builder.Image", "url": "@@U@@"}, ensure_ascii=False).replace('"@@U@@"', url)
    return f'<Image id="{i}" className="{i}" displayMode={{"fill"}} image={{{data}}} />'
def font(i, size, weight, color, lh=1.3, fam='inter', align=None):
    sty.append(f'.{i} {{\n    font: normal normal {weight} --spx({size})/{lh}em {fam};\n    color: {color};\n' + (f'    text-align: {align};\n' if align else '') + '}')
def pill(i, fg, size):
    sty.append(f'.{i} {{\n    --preset: baseButton;\n    background: transparent;\n' + ''.join(f'    {k}: 0px solid transparent;\n' for k in ['border-top', 'border-bottom', 'border-inline-start', 'border-inline-end']) + '    padding-top: 2px;\n    padding-bottom: 2px;\n    padding-inline-start: 0px;\n    padding-inline-end: 0px;\n}\n' + f'.{i} .label {{\n    font: var(--wst-heading-6-font);\n    font-size: {size}px;\n    color: {fg};\n    letter-spacing: 0;\n    text-decoration-line: none;\n}}')

# the list section and its direct children (tags at brace depth 0 inside its InternalContainer)
blk0 = S.index('<DirectoryFilter'); blk1 = S.index('</DirectoryFilter>', blk0)
sid = re.search(r'<Section id="([^"]+)"', S[blk0:blk1]).group(1)
ic_open = S.index(f'<InternalContainer id="{sid}-ic"', blk0)
# content starts after the opening InternalContainer tag line
start = S.index('\n', ic_open) + 1
end = S.rindex('</InternalContainer>\n</Section>', blk0, blk1)
body = S[start:end]
kids = []; depth = 0; i = 0; instr = False
while i < len(body):
    c = body[i]
    if instr:
        if c == '\\': i += 2; continue
        if c == '"': instr = False
    elif c == '"' and depth > 0: instr = True
    elif c == '{': depth += 1
    elif c == '}': depth -= 1
    elif c == '<' and depth == 0:
        m = re.match(r'<(\w+) id="([^"]+)"', body[i:])
        if m: kids.append(m.group(2))
    i += 1
mi = L.index('@media'); base, mob = L[:mi], L[mi:]
def rows_of(css, ident):
    m = re.search(r'\n\s*\.' + re.escape(ident) + r' \{[^}]*?grid-row: (\d+) / (\d+);', css)
    return int(m.group(2)) - 1 if m else 0
D = max(rows_of(base, k) for k in kids); M = max(rows_of(mob, k) for k in kids)
TOK = r'minmax\([^)]*\)|repeat\([^)]*\)|[^\s;]+'
def grow(css, n_used, add):
    pat = r'(\n\s*\.' + re.escape(sid + '-ic') + r' \{.*?grid-template-rows: )([^;\n]*)'
    m = re.search(pat, css, re.S)
    toks = re.findall(TOK, m.group(2))
    toks += ['auto'] * max(0, n_used - len(toks))
    return css[:m.start(2)] + ' '.join(toks + ['auto'] * add) + css[m.end(2):]
note = R.get('note') or ''
mp = R.get('map')
add_d = 3 if note else 2; add_m = (4 if note else 3) if mp else (3 if note else 2)
base = grow(base, D, add_d); mob = grow(mob, M, add_m)

H.lay.clear(); H.sty.clear()
new = [rt('tc-hd', '<h2>' + esc(R.get('title') or 'Explore by category') + '</h2>')]
if mp: new.append(f'<Button id="tc-map" className="tc-map" label={{{json.dumps(mp[0], ensure_ascii=False)}}} link={{{json.dumps(lnk(mp[1]))}}} />')
if note: new.append(rt('tc-note', '<p>' + esc(note) + '</p>'))
tiles = []
for n, b in enumerate(B):
    w = b.get('w') or 320; h = b.get('h') or 212
    pic = [image(f'tc{n}-i', b['uri'], w, h, b.get('alt') or b['town'])] if b.get('uri') else []
    tiles.append(box(f'tc{n}', pic + [
                               f'<Button id="tc{n}-b" className="tc{n}-b" label={{{json.dumps(b.get("label") or b["town"], ensure_ascii=False)}}} onClick={{callback(ctx("toggleTopic", {F}), {json.dumps(b["town"], ensure_ascii=False)})}} />']))
new.append(box('tc-grid', tiles))
if 'id="rg-hd"' in S[start:end]:
    at = S.index('<WRichText id="rg-hd"', start); S = S[:at] + '\n'.join(new) + '\n' + S[at:]
else:
    S = S[:end] + '\n'.join(new) + '\n' + S[end:]

# placement: heading (+ map link) row, optional note row, grid row
r = D + 1; rm = M + 1
RG = [k for k in kids if k in ('rg-hd', 'rg-map', 'rg-note', 'rg-grid')]
def start_of(css, ident):
    m = re.search(r'\n\s*\.' + re.escape(ident) + r' \{[^}]*?grid-row: (\d+) / \d+;', css); return int(m.group(1)) if m else None
if RG:
    r = min(start_of(base, k) for k in RG); rm = min(start_of(mob, k) for k in RG)
r0, rm0 = r, rm
gi('tc-hd', f'{r} / {r+1}', '1 / 4', f'{rm} / {rm+1}', '1 / -1', a='center', am='center'); font('tc-hd', 30, 900, INK, lh=1.15, fam='oswald-v2')
if mp:
    gi('tc-map', f'{r} / {r+1}', '4 / 5', f'{rm+1} / {rm+2}', '1 / -1', w='auto', wm='auto', a='center', am='center', j='end', jm='start'); pill('tc-map', '#1A73C9', 14); rm += 1
r += 1; rm += 1
if note:
    gi('tc-note', f'{r} / {r+1}', '1 / 5', f'{rm} / {rm+1}', '1 / -1'); font('tc-note', 15, 400, '#425A70', lh=1.5); r += 1; rm += 1
gi('tc-grid', f'{r} / {r+1}', '1 / 5', f'{rm} / {rm+1}', '1 / -1')
cd, cm = 6, 2
nr, nrm = (len(B) + cd - 1) // cd, (len(B) + cm - 1) // cm
g = H.grid_ic('tc-grid-ic', ' '.join(['minmax(0px, 1fr)'] * cd), ' '.join(['auto'] * nr), ' '.join(['minmax(0px, 1fr)'] * cm), ' '.join(['auto'] * nrm), (0, 0), (0, 0), (14, 14), (10, 10))
rule('tc-grid-ic', 'min-width: --spx(0);', 'min-width: --spx(0);', ic=g[0], icm=g[1]); H.bglay('tc-grid-bg'); fill('tc-grid-bg', 'transparent')
for n in range(len(B)):
    t = f'tc{n}'
    gi(t, f'{n//cd+1} / {n//cd+2}', f'{n%cd+1} / {n%cd+2}', f'{n//cm+1} / {n//cm+2}', f'{n%cm+1} / {n%cm+2}', h='100%', hm='100%', a='stretch', am='stretch')
    gt = H.grid_ic(t + '-ic', 'minmax(0px, 1fr)', 'auto auto', 'minmax(0px, 1fr)', 'auto auto', (0, 0, 10), (0, 0, 8), (0, 8), (0, 6))
    rule(t + '-ic', 'min-width: --spx(0);', 'min-width: --spx(0);', ic=gt[0], icm=gt[1]); H.bglay(t + '-bg'); fill(t + '-bg', '#FFFFFF')
    sty.append(f'.{t}-ic {{\n' + ''.join(f'    --border{k}Radius: 10px;\n' for k in ['StartStart', 'StartEnd', 'EndStart', 'EndEnd']) + '    --boxShadow: 0px 0px 0px 1px #D2E2F6;\n}')
    if B[n].get('uri'): rule(t + '-i', 'width: 100%;\naspect-ratio: 3 / 2;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: start;\njustify-self: stretch;\nposition: relative;',
         'width: 100%;\naspect-ratio: 3 / 2;\nmin-width: 0px;\ngrid-row: 1 / 2;\ngrid-column: 1 / 2;\nalign-self: start;\njustify-self: stretch;')
    br = '2 / 3' if B[n].get('uri') else '1 / 3'
    gi(t + '-b', br, '1 / 2', br, '1 / 2', w='auto', wm='auto', a='center', am='center', j='center', jm='center'); pill(t + '-b', INK, 14)

used_d = r + 1 - r0; used_m = rm + 1 - rm0
if RG:
    def shift(css, n):
        for k in RG:
            css = re.sub(r'(\n\s*\.' + re.escape(k) + r' \{[^}]*?grid-row: )(\d+) / (\d+);', lambda m: m.group(1) + f'{int(m.group(2)) + n} / {int(m.group(3)) + n};', css, count=1)
        return css
    base = shift(base, used_d); mob = shift(mob, used_m)
def ref(w): return f'    --spx-ref-width: {w};\n    --spx-resolver-type: scale;\n'
o = []; om = []
for sel, dd, m, ic, icm in H.lay:
    b_ = ref(1280) + ''.join('    ' + l + '\n' for l in dd.split('\n') if l)
    if ic: b_ += '    @origami-target internal-container-content-wrapper {\n' + ''.join('        ' + l + '\n' for l in ic.split('\n')) + '    }\n'
    o.append(f'.{sel} {{\n{b_}}}')
    bm = ref(375) + ''.join('    ' + l + '\n' for l in (m or '').split('\n') if l)
    if icm: bm += '    @origami-target internal-container-content-wrapper {\n' + ''.join('        ' + l + '\n' for l in icm.split('\n')) + '    }\n'
    om.append('    ' + f'.{sel} {{\n{bm}}}'.replace('\n', '\n    '))
mob = mob.rstrip(); assert mob.endswith('}'); mob = mob[:-1].rstrip() + '\n' + '\n'.join(om) + '\n}\n'
open(os.path.join(d, 'structure.jsx'), 'w').write(S)
open(os.path.join(d, 'layout.css'), 'w').write(base.rstrip() + '\n' + '\n'.join(o) + '\n' + mob)
open(os.path.join(d, 'style.css'), 'w').write(St.rstrip() + '\n' + '\n'.join(sty) + '\n')
print('destination grid', len(B), 'towns into', sid, 'rows', D + 1, '/', M + 1, 'kids', kids, 'in', d)
