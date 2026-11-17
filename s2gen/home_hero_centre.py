D='/user-code/packages/site-app/src/pages/(home)/'
s=open(D+'structure.jsx').read()
old='3a517e_c00db68d44ed453e96b9547639584056~mv2.jpg'; new='3a517e_7d387b07c6784f2ab93de7fa5ef4d458~mv2.jpg'
n=s.count(old); s=s.replace(old,new)
s=s.replace("focalPoint={{ x: 22, y: 50 }}","focalPoint={{ x: 50, y: 50 }}",1)
s=s.replace("alt: 'Big Days Out, Brilliant Discoveries sign and a signpost to arcades, beaches, attractions, food and drink and places to stay, on a sunny beach with beach huts',","alt: 'Big Days Out, Brilliant Discoveries sign and a signpost to arcades, beaches, attractions, food and drink and places to stay, on a sunny beach with beach huts and a lighthouse',",1)
s=s.replace("<p>🔍&nbsp;&nbsp;Search places, towns or days out…</p>","<p>🔍&nbsp;&nbsp;Search for a place, attraction, town or something to do…</p>",1)
open(D+'structure.jsx','w').write(s)
L=open(D+'layout.css').read()
a=L.index('.comp-mwid7h1w {'); b=L.index('}',a)
blk=L[a:b].replace('width: --spx(470);','width: --spx(560);').replace('margin-left: --spx(300)','margin-left: --spx(0)')
L=L[:a]+blk+L[b:]
a=L.index('.comp-mwid7h38 {'); b=L.index('}',a)
blk=L[a:b].replace('width: --spx(470);','width: max-content;').replace('margin-left: --spx(300)','margin-left: --spx(0)')
L=L[:a]+blk+L[b:]
a=L.index('.comp-mwid7h2a {'); b=L.index('}',a)
L=L[:a]+L[a:b].replace('width: --spx(190);','width: --spx(170);')+L[b:]
open(D+'layout.css','w').write(L)
print(n, L[L.index('.comp-mwid7h1w {'):L.index('.comp-mwid7h1w {')+420])
