#!/bin/bash
# newpages.sh slug ... : scrape the live pages, add each as a new page copied from seaside, generate it, lint.
export PATH=/tmp/n/node_modules/node/bin:$PATH
CHROME=$(find /opt/ms-playwright -name chrome-headless-shell -type f | head -1); export CHROME
cd /tmp/pw && node scrape_run.mjs /tmp/gen/scr "$@" 2>&1 | tail -5
cd /user-code; P=packages/site-app/src/pages
for s in "$@"; do
  [ -f /tmp/gen/scr/scraped_$s.json ] || continue
  if [ ! -d $P/$s ]; then
    T=$(python3 -c "import json;S=json.load(open('/tmp/gen/scr/scraped_$s.json'));print(S['title'].split('|')[0].strip())")
    ST=$(python3 -c "import json;S=json.load(open('/tmp/gen/scr/scraped_$s.json'));print(S['title'])")
    D=$(python3 -c "import json;S=json.load(open('/tmp/gen/scr/scraped_$s.json'));print(S.get('seo_description',''))")
    python3 /tmp/gen/add_page.py $P seaside $s "$T" "$ST" "$D" && python3 /tmp/gen/mkpage.py $s
  fi
  python3 /tmp/gen/prep_listbase.py $P/$s /tmp/gen/lb_$s >/dev/null && python3 /tmp/gen/prep_cat.py /tmp/gen/scr/scraped_$s.json /tmp/gen/assets.json /tmp/gen/cat_$s.json $s && python3 /tmp/gen/gen_cat.py /tmp/gen/lb_$s $P /tmp/gen/cat_$s.json | tail -1
done
timeout 300 npm run lint 2>&1 | grep -E ' error ' | head -15; echo linted
