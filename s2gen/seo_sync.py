# Copy each live spin-raiders.com page's <title> and meta description onto the matching Studio Two page
import os, re, json, html, urllib.request, sys
ONLY = set(sys.argv[1:])
alias = {'where-to-eat': 'food-and-drink'}
done = []; miss = []
TQ = re.compile(r"""pageTitleSEO: (?:'[^']*'|"(?:[^"\\]|\\.)*")""")
DQ = re.compile(r"""descriptionSEO: (?:'[^']*'|"(?:[^"\\]|\\.)*")""")
for d in sorted(os.listdir('.')):
    f = os.path.join(d, 'structure.jsx')
    if d.startswith('(') or not os.path.isfile(f):
        continue
    if ONLY and d not in ONLY:
        continue
    s = open(f).read()
    src = alias.get(d, d)
    try:
        raw = urllib.request.urlopen(urllib.request.Request('https://www.spin-raiders.com/' + src, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40).read().decode('utf-8', 'replace')
    except Exception as e:
        miss.append((d, str(e)[:40])); continue
    tm = re.search(r'<title>(.*?)</title>', raw, re.S)
    mm = re.search(r'<meta name="description" content="([^"]*)"', raw)
    t = html.unescape(tm.group(1).strip()) if tm else ''
    m = html.unescape(mm.group(1)) if mm else ''
    if not t or '404' in t:
        miss.append((d, 'no title')); continue
    if 'Spin Raiders' not in t:
        t = t + ' | Spin Raiders'
    s = TQ.sub(lambda _: 'pageTitleSEO: ' + json.dumps(t, ensure_ascii=False), s, count=1)
    if m:
        s = DQ.sub(lambda _: 'descriptionSEO: ' + json.dumps(m, ensure_ascii=False), s, count=1)
    open(f, 'w').write(s); done.append(d)
print('done', len(done)); print('missing', miss)
