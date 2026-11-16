# Write a new page folder from add_page.py's /tmp/new-page-<slug>.json (wjsx-add-page is not on npm here).
# _generated comes from the seaside page with its name swapped. usage: python3 mkpage.py <slug> ...
import json,os,sys
P='/user-code/packages/site-app/src/pages'
for s in sys.argv[1:]:
    J=json.load(open('/tmp/new-page-%s.json'%s)); d=os.path.join(P,s)
    if os.path.exists(d): print('exists',s); continue
    os.makedirs(os.path.join(d,'servicesConfigs')); os.makedirs(os.path.join(d,'_generated'))
    N=J['nodes']
    for k,fn in [('structure','structure.jsx'),('layout','layout.css'),('style','style.css'),('unmapped','unmapped.json')]: open(os.path.join(d,fn),'w').write(N[k]['content'])
    open(os.path.join(d,'servicesConfigs','index.ts'),'w').write(N['servicesConfigs']['nodes']['index']['content'])
    open(os.path.join(d,'version'),'w').write(J['version'])
    nm=''.join(w.capitalize() for w in s.split('-'))
    src=os.path.join(P,'seaside','_generated')
    for f in os.listdir(src):
        open(os.path.join(d,'_generated',f.replace('Seaside',nm)),'w').write(open(os.path.join(src,f)).read().replace('Seaside',nm))
    print('made',s)
