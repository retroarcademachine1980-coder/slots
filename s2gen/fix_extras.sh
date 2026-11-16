#!/bin/bash
# fix_extras.sh slug=class1,class2 ... : add live sections the block scraper missed (as text sections) and regenerate.
# Pages with manual_<slug>.json keep their manual blocks; others are re-scraped and rebuilt through prep_cat.
export PATH=/tmp/n/node_modules/node/bin:$PATH
CHROME=$(find /opt/ms-playwright -name chrome-headless-shell -type f | head -1); export CHROME
cd /user-code; P=packages/site-app/src/pages
for a in "$@"; do
  s=${a%%=*}; cls=${a#*=}
  (cd /tmp/pw && EXTRA_CLASS=$cls node extra.js /tmp/gen/scr $s | tail -1)
  if [ -f /tmp/gen/manual_$s.json ]; then
    python3 - "$s" <<'PY'
import json,sys,os,re
s=sys.argv[1]; C=json.load(open('/tmp/gen/manual_%s.json'%s))
xf='/tmp/gen/scr/extra_%s.json'%s
X=json.load(open(xf)) if os.path.exists(xf) else []
fix=lambda h: re.sub(r'\s(class|style|data-[a-z-]+)="[^"]*"','',re.sub(r'href="(/[^"]*)"',lambda m:'href="https://www.spin-raiders.com'+m.group(1)+'"',h))
at=len(C['blocks'])-1 if C['blocks'] and C['blocks'][-1]['type'] in ('cta','more') else len(C['blocks'])
for h in reversed(X): C['blocks'].insert(at,{'type':'editorial','html':fix(h)})
json.dump(C,open('/tmp/gen/cat_%s.json'%s,'w'),ensure_ascii=False)
print('manual',s,[b['type'] for b in C['blocks']])
PY
  else
    (cd /tmp/pw && node scrape_run.mjs /tmp/gen/scr $s | tail -1)
    python3 /tmp/gen/prep_cat.py /tmp/gen/scr/scraped_$s.json /tmp/gen/assets.json /tmp/gen/cat_$s.json $s | tail -1
  fi
  python3 /tmp/gen/prep_listbase.py $P/$s /tmp/gen/lb_$s >/dev/null && python3 /tmp/gen/gen_cat.py /tmp/gen/lb_$s $P /tmp/gen/cat_$s.json | tail -1
done
timeout 300 npm run lint 2>&1 | grep -E ' error ' | head -12; echo linted
