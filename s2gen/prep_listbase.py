# Make a listbase template from an exported page folder: rename its generated component to ArcadeVenuesList and clear SEO
import os,re,sys,shutil
src,dst=sys.argv[1],sys.argv[2]
if os.path.exists(dst): shutil.rmtree(dst)
shutil.copytree(src,dst,ignore=shutil.ignore_patterns('[[]*'))
gd=os.path.join(dst,'_generated')
import re as _r
n=_r.search(r"from '\./([^.']+)\.jsx'",open(os.path.join(gd,'index.jsx')).read()).group(1)
for f in os.listdir(gd):
    if f!='index.jsx' and not f.startswith(n+'.'): os.remove(os.path.join(gd,f))
print('generated',n)
for f in os.listdir(gd):
    p=os.path.join(gd,f); t=open(p).read().replace(n,'ArcadeVenuesList'); os.remove(p)
    open(os.path.join(gd,f.replace(n,'ArcadeVenuesList')),'w').write(t)
p=os.path.join(dst,'structure.jsx'); s=open(p).read()
s=re.sub(r"pageTitleSEO: (?:'[^']*'|\"(?:[^\"\\\\]|\\\\.)*\")","pageTitleSEO: ''",s,count=1)
s=re.sub(r"descriptionSEO: (?:'[^']*'|\"(?:[^\"\\\\]|\\\\.)*\")","descriptionSEO: ''",s,count=1)
open(p,'w').write(s); print('ok',os.listdir(gd))
