# Add a new static page by copying an existing one (same header, footer and canvas), as the
# wix-site-edit new-page guide says: new Page id, new header/footer/background ids, new SEO, no unmapped ids.
# usage: python3 add_page.py <pages dir> <source slug> <new slug> '<title>' '<seo title>' '<seo description>'
import json,sys,os,re,random,string,subprocess
pages,src,slug,title,seot,seod=sys.argv[1:7]
d=os.path.join(pages,src)
S=open(os.path.join(d,'structure.jsx')).read(); L=open(os.path.join(d,'layout.css')).read()
St=open(os.path.join(d,'style.css')).read(); V=open(os.path.join(d,'version')).read().strip()
U=json.load(open(os.path.join(d,'unmapped.json')))
def rid(n): return ''.join(random.choice(string.ascii_lowercase+string.digits) for _ in range(n))
pid=re.search(r'<Page\s+id="([^"]+)"',S).group(1)
hdr=re.search(r'<Header_\w+ id="([^"]+)"',S).group(1); ftr=re.search(r'<Footer_\w+ id="([^"]+)"',S).group(1)
pbg=re.search(r'backgroundLayer=\{\[<Background id="([^"]+)"',S[S.index('<Page'):]).group(1)
new={pid:'p'+rid(4),hdr:'comp-'+rid(8),ftr:'comp-'+rid(8),pbg:'comp-'+rid(9)}
for o,n in new.items():
    S=re.sub(r'(?<![\w-])'+re.escape(o)+r'(?![\w-])',n,S); L=re.sub(r'(?<![\w-])'+re.escape(o)+r'(?![\w-])',n,L); St=re.sub(r'(?<![\w-])'+re.escape(o)+r'(?![\w-])',n,St)
S=re.sub(r'pageUriSEO: "[^"]*"','pageUriSEO: '+json.dumps(slug),S,1)
S=re.sub(r'(\n\s*title: )"[^"]*"',lambda m:m.group(1)+json.dumps(title,ensure_ascii=False),S,1)
S=re.sub(r"(descriptionSEO:\s*)'[^']*'",lambda m:m.group(1)+json.dumps(seod,ensure_ascii=False),S,1)
S=re.sub(r'(descriptionSEO:\s*)"[^"]*"',lambda m:m.group(1)+json.dumps(seod,ensure_ascii=False),S,1)
S=re.sub(r'pageTitleSEO: "[^"]*"','pageTitleSEO: '+json.dumps(seot,ensure_ascii=False),S,1)
U['components']={}
item={"version":V,"metadata":{"targetPath":"pages/"+slug,"internalPaths":{"servicesConfigsPath":"servicesConfigs/index"}},
 "nodes":{"structure":{"type":"File","format":"jsx","content":S},"layout":{"type":"File","format":"css","content":L},
  "style":{"type":"File","format":"css","content":St},"unmapped":{"type":"File","format":"json","content":json.dumps(U,indent=4,ensure_ascii=False)},
  "servicesConfigs":{"type":"Folder","nodes":{"index":{"type":"File","format":"ts","content":"export default {}\n"}}}}}
f='/tmp/new-page-'+slug+'.json'; json.dump(item,open(f,'w'),ensure_ascii=False)
print('page',slug,new[pid],f)
