# Build cat_<slug>.json for a casino review page from tools/review.js + tools/extra.js output.
# usage: python3 prep_review.py <slug> '<logo sizes json>'
import json,re,sys,subprocess,html as H
slug=sys.argv[1]; SZ=json.loads(sys.argv[2])
R=json.load(open('/tmp/gen/scr/review_%s.json'%slug))
X=json.load(open('/tmp/gen/scr/extra_%s.json'%slug)) if __import__('os').path.exists('/tmp/gen/scr/extra_%s.json'%slug) else []
def rich(h):
    h=re.sub(r'<div>([^<]*)</div><div>(<strong>[^<]*</strong>)</div>',r'<p>\1: \2</p>',h)
    h=re.sub(r'<span>([^<]*)</span><strong>([^<]*)</strong>',r'<p>\1: <strong>\2</strong></p>',h)
    h=re.sub(r'<dt>(.*?)</dt><dd>(.*?)</dd>',r'<p><strong>\1:</strong> \2</p>',h)
    h=re.sub(r'</?(dl|div|span|section|article)[^>]*>','',h)
    h=re.sub(r'href="(/[^"]*)"',lambda m:'href="https://www.spin-raiders.com'+m.group(1)+'"',h)
    return re.sub(r'\s(class|style|data-[a-z-]+)="[^"]*"','',h)
u=re.search(r'media/([^/]+)',R['logo']['src']).group(1) if R.get('logo') else None
w,h=SZ.get(u,[400,240]) if u else (0,0)
b={'type':'review','back':R['back'],'logo':({'uri':u,'w':w,'h':h,'alt':R['logo']['alt']} if u else None),'pills':R['pills'],'h1':R['h1'].strip(),'offer':R['offer'].strip(),
   'buttons':R['buttons'],'main':rich(R['main']),'aside':rich(R['aside']),'cards':[rich(c) for c in R['cards']],'note':rich(R['note'])}
side=[x for x in X if re.match(r'<h2>(Quick facts|Raider rating breakdown|Visit )',x)]
body=[x for x in X if x not in side]
blocks=[b]
if side: blocks.append({'type':'editorial','html':rich(''.join(side))})
if body: blocks.append({'type':'editorial','html':rich(''.join(body))})
page=subprocess.run(['curl','-sL','https://www.spin-raiders.com/'+slug],capture_output=True,text=True).stdout
t=H.unescape(re.search(r'<title>(.*?)</title>',page,re.S).group(1).strip())
d=re.search(r'<meta name="description" content="([^"]*)"',page); d=H.unescape(d.group(1)) if d else ''
C={'slug':slug,'title':t.split('|')[0].strip(),'seo_title':t,'seo_description':d,'blocks':blocks}
json.dump(C,open('/tmp/gen/cat_%s.json'%slug,'w'),ensure_ascii=False,indent=1)
aff=[x['href'] for x in R['buttons'] if 'sponsored' in x['rel']]
print(slug,'|',t,'| logo',u,w,h,'| affiliate',aff,'| side',len(side),'body',len(body))
