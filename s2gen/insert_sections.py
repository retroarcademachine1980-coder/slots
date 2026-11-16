# Insert text sections (live sections the scraper missed) into an existing page without regenerating it,
# so its pictures and other blocks stay exactly as saved. Sections go just before "More ways to spend your day"
# (or before the last section); later sections, the footer and the page grid move down.
# usage: python3 insert_sections.py <page dir> <extra_<slug>.json>
import json,re,sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import helpers as H
d,xf=sys.argv[1:3]
X=json.load(open(xf))
fix=lambda h: re.sub(r'\s(class|style|data-[a-z-]+|id)="[^"]*"','',re.sub(r'href="(/[^"]*)"',lambda m:'href="https://www.spin-raiders.com'+m.group(1)+'"',h))
S=open(os.path.join(d,'structure.jsx')).read(); L=open(os.path.join(d,'layout.css')).read(); St=open(os.path.join(d,'style.css')).read()
if 'id="sx0"' in S: print('already has inserted sections'); sys.exit(0)
pid=re.search(r'<Page\s+id="([^"]+)"',S).group(1); ftr=re.search(r'<Footer_\w+ id="([^"]+)"',S).group(1)
mi=L.index('@media'); base,mob=L[:mi],L[mi:]
sids=re.findall(r'<Section id="([^"]+)"',S)
def row_of(sid):
    m=re.search(r'\n\.'+re.escape(sid)+r' \{[^}]*?grid-row: (\d+) / (\d+);',base); return int(m.group(1)) if m else None
rows={s:row_of(s) for s in sids}
tgt=None
for s in sids:
    blk=S[S.index(f'<Section id="{s}"'):]; blk=blk[:blk.index('</Section>')]
    if 'More ways to spend your day' in blk: tgt=s
tgt=tgt or sids[-1]; R=rows[tgt]; k=len(X)
def bump(m):
    a,b=int(m.group(2)),int(m.group(3))
    return m.group(1)+(f'{a+k} / {b+k}' if a>=R else f'{a} / {b}')+';'
for s in sids+[ftr]:
    base=re.sub(r'(\n\.'+re.escape(s)+r' \{[^}]*?grid-row: )(\d+) / (\d+);',bump,base,count=1)
base=re.sub(r'(\n?\.'+re.escape(pid)+r' \{[^}]*?grid-template-rows: )([^;\n]*)',lambda m:m.group(1)+m.group(2)+' auto'*k,base,count=1)
H.lay.clear(); H.sty.clear(); secs=[]
for n,h in enumerate(X):
    sid=f'sx{n}'; t=f'sx{n}-t'
    secs.append(H.sec(sid,[H.rt(t,fix(h))]))
    H.section(sid,R+n,H.grid_ic(sid+'-ic','minmax(0px, 1fr)','auto','minmax(0px, 1fr)','auto',(26,40,26),(20,16,20)))
    H.fill(sid+'-bg','#FFFFFF')
    H.gi(t,'1 / 2','1 / 2','1 / 2','1 / 2',w='--spx(880)',wm='100%')
    H.sty.append(f'.{t} {{\n    font: normal normal 400 --spx(16)/1.65em inter;\n    color: #27425F;\n}}')
i=S.index(f'<Section id="{tgt}"'); S=S[:i]+'\n'.join(secs)+'\n'+S[i:]
def ref(w): return f'    --spx-ref-width: {w};\n    --spx-resolver-type: scale;\n'
o=[];om=[]
for sel,dd,m,ic,icm in H.lay:
    b_=ref(1280)+''.join('    '+l+'\n' for l in dd.split('\n') if l)
    if ic: b_+='    @origami-target internal-container-content-wrapper {\n'+''.join('        '+l+'\n' for l in ic.split('\n'))+'    }\n'
    o.append(f'.{sel} {{\n{b_}}}')
    bm=ref(375)+''.join('    '+l+'\n' for l in (m or '').split('\n') if l)
    if icm: bm+='    @origami-target internal-container-content-wrapper {\n'+''.join('        '+l+'\n' for l in icm.split('\n'))+'    }\n'
    om.append('    '+f'.{sel} {{\n{bm}}}'.replace('\n','\n    '))
mob=mob.rstrip()
assert mob.endswith('}'); mob=mob[:-1].rstrip()+'\n'+'\n'.join(om)+'\n}\n'
open(os.path.join(d,'structure.jsx'),'w').write(S)
open(os.path.join(d,'layout.css'),'w').write(base.rstrip()+'\n'+'\n'.join(o)+'\n'+mob)
open(os.path.join(d,'style.css'),'w').write(St.rstrip()+'\n'+'\n'.join(H.sty)+'\n')
print('inserted',k,'sections at row',R,'before',tgt,'in',d)
