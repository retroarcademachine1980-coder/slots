# copy_section.py: copy the section containing <marker> from a saved template page into another page, in place.
# usage: python3 copy_section.py <template dir> <target dir> <marker text> <new section id> [before-marker|end]
# The copy goes just before the "Plan Your Perfect Day Out" section (or before the last section); later sections,
# the footer and the page grid move down. Any destination grid (rg-*) in the template is left out.
# usage: python3 insert_list.py <template page dir> <target page dir> <json settings>
#   settings: {"words": "...", "topics": "...", "baseField": "@live:...", "readyField": "...", "title": "...", "townField": "town"}
import json, re, sys, os

tpl, dst, marker, new_sid = sys.argv[1:5]; where = sys.argv[5] if len(sys.argv) > 5 else 'end'; cfg = {}
rd = lambda d, f: open(os.path.join(d, f)).read()
TS, TL, TT = rd(tpl, 'structure.jsx'), rd(tpl, 'layout.css'), rd(tpl, 'style.css')
S, L, St = rd(dst, 'structure.jsx'), rd(dst, 'layout.css'), rd(dst, 'style.css')
if marker in S: print('target already has', marker); sys.exit(0)

def blocks(css):
    """Top-level CSS blocks as (selector, full text), keeping nested braces."""
    out = []; i = 0; n = len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0: break
        sel = css[i:j].strip(); depth = 0; k = j
        while k < n:
            if css[k] == '{': depth += 1
            elif css[k] == '}':
                depth -= 1
                if depth == 0: break
            k += 1
        out.append((sel, css[i:k + 1].strip())); i = k + 1
    return out

def first_id(sel):
    m = re.match(r'\.([A-Za-z0-9_-]+)', sel); return m.group(1) if m else None

# ---- the template block
mk = TS.index(marker); b0 = TS.rindex('<Section id="', 0, mk); b1 = TS.index('</Section>', mk) + len('</Section>')
# include a provider wrapper if the section is wrapped by one
blk = TS[b0:b1]
old_sid = re.search(r'<Section id="([^"]+)"', blk).group(1)
# drop the destination grid (rg-*) from the copy
gi = -1
if gi >= 0:
    end = blk.rindex('</InternalContainer>\n</Section>')
    blk = blk[:gi].rstrip('\n') + '\n' + blk[end:]
ids = set(re.findall(r'id="([^"]+)"', blk))
def ren(t): return re.sub(r'(?<![A-Za-z0-9_-])' + re.escape(old_sid) + r'(?=-ic|-bg|["\s{.,:]|$)', new_sid, t)
blk = ren(blk)
for k, v in cfg.items():
    if k == 'title': continue
    blk = re.sub(r'(<DirectoryFilter [^>]*?\b' + re.escape(k) + r'=\{)"[^"]*"(\})', lambda m: m.group(1) + json.dumps(v, ensure_ascii=False) + m.group(2), blk, count=1)
if cfg.get('title'):
    blk = re.sub(r'(<WRichText id="a-h"[^>]*?"html": ")<h2>[^<]*</h2>', lambda m: m.group(1) + '<h2>' + cfg['title'].replace('"', '\\"') + '</h2>', blk, count=1)

# ---- css rules for the copied ids
def pick(css, keep):
    mi = css.index('@media'); base, mob = css[:mi], css[mi:]
    bb = [t for s, t in blocks(base) if first_id(s) in keep]
    inner = mob[mob.index('{') + 1: mob.rindex('}')]
    mm = [t for s, t in blocks(inner) if first_id(s) in keep]
    return bb, mm
keep = ids - {i for i in ids if i.startswith('rg')}
lb, lm = pick(TL, keep)
sb = [t for s, t in blocks(TT) if first_id(s) in keep]
lb = [ren(x) for x in lb]; lm = [ren(x) for x in lm]; sb = [ren(x) for x in sb]

# reset the section grid rows to what the list itself uses (the template may have grown them for its grid)

TOK = r'minmax\([^)]*\)|repeat\([^)]*\)|[^\s;]+'
def fixrows(rules, n):
    out = []
    for r in rules:
        if first_id(r) == new_sid + '-ic':
            r = re.sub(r'(grid-template-rows: )([^;\n]*)', lambda m: m.group(1) + ' '.join((re.findall(TOK, m.group(2)) + ['auto'] * n)[:n]), r, count=1)
        out.append(r)
    return out


# ---- place it in the target page
pid = re.search(r'<Page\s+id="([^"]+)"', S).group(1); ftr = re.search(r'<Footer_\w+ id="([^"]+)"', S).group(1)
mi = L.index('@media'); base, mob = L[:mi], L[mi:]
sids = re.findall(r'<Section id="([^"]+)"', S)
def row_of(sid):
    m = re.search(r'\n\.' + re.escape(sid) + r' \{[^}]*?grid-row: (\d+) / (\d+);', base); return int(m.group(1)) if m else None
tgt = None
if where != 'end':
    for s_ in sids:
        seg = S[S.index(f'<Section id="{s_}"'):]; seg = seg[:seg.index('</Section>')]
        if where in seg: tgt = s_
if tgt: R = row_of(tgt)
else:
    R = max(row_of(s_) or 0 for s_ in sids) + 1
def bump(m):
    a, b = int(m.group(2)), int(m.group(3))
    return m.group(1) + (f'{a+1} / {b+1}' if a >= R else f'{a} / {b}') + ';'
for s in sids + [ftr]:
    base = re.sub(r'(\n\.' + re.escape(s) + r' \{[^}]*?grid-row: )(\d+) / (\d+);', bump, base, count=1)
base = re.sub(r'(\n?\.' + re.escape(pid) + r' \{[^}]*?grid-template-rows: )([^;\n]*)', lambda m: m.group(1) + m.group(2) + ' auto', base, count=1)
lb = [re.sub(r'(^\.' + re.escape(new_sid) + r' \{[^}]*?grid-row: )\d+ / \d+;', lambda m: m.group(1) + f'{R} / {R+1};', r, count=1) for r in lb]
i = S.index(f'<Section id="{tgt}"') if tgt else S.index('</Section>', S.rindex('<Section id="')) + len('</Section>')
# the provider wraps the section; insert before the target section (or its own provider wrapper)
while not tgt:
    m_ = re.match(r'\s*</(DirectoryFilter|TownPlaces|CmsProvider_\w+)>', S[i:])
    if not m_: break
    i += m_.end()
clash = [x for x in set(re.findall(r'id="([^"]+)"', blk)) if f'id="{x}"' in S]
if clash: print('id clash, not copied:', clash[:8]); sys.exit(1)
S = S[:i] + ('\n' if not tgt else '') + blk + ('\n' if tgt else '') + S[i:]
# imports the copied block needs
head = S[:S.index('export const Structure')]
need = [l for l in TS[:TS.index('export const Structure')].split('\n') if l.startswith('import') and l not in head]
need = [l for l in need if 'cmsprovider' not in l.lower()]
S = '\n'.join(need) + ('\n' if need else '') + S
mob = mob.rstrip(); assert mob.endswith('}')
mob = mob[:-1].rstrip() + '\n' + '\n'.join(lm) + '\n}\n'
open(os.path.join(dst, 'structure.jsx'), 'w').write(S)
open(os.path.join(dst, 'layout.css'), 'w').write(base.rstrip() + '\n' + '\n'.join(lb) + '\n' + mob)
open(os.path.join(dst, 'style.css'), 'w').write(St.rstrip() + '\n' + '\n'.join(sb) + '\n')
# wrapper css imports in the generated page file
g = os.path.join(dst, '_generated'); tg = os.path.join(tpl, '_generated')
tj = [f for f in os.listdir(tg) if f.endswith('.jsx') and f != 'index.jsx'][0]; dj = [f for f in os.listdir(g) if f.endswith('.jsx') and f != 'index.jsx'][0]
tcss = [l for l in open(os.path.join(tg, tj)).read().split('\n') if l.startswith("import '@origami-wrappers/") and l.endswith("/css'")]
dt = open(os.path.join(g, dj)).read(); add = [l for l in tcss if l not in dt]
if add: open(os.path.join(g, dj), 'w').write('\n'.join(add) + '\n' + dt)
print('section copied as', new_sid, 'at row', R, 'before', tgt or 'footer', '| rules', len(lb), len(lm), len(sb), '| imports', len(need), '| css imports', len(add))
