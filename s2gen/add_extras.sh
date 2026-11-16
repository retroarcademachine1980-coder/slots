#!/bin/bash
# add_extras.sh slug=class1,class2 ... : copy live sections the scraper missed into the saved pages (in place), then lint.
export PATH=/tmp/n/node_modules/node/bin:$PATH
CHROME=$(find /opt/ms-playwright -name chrome-headless-shell -type f | head -1); export CHROME
P=/user-code/packages/site-app/src/pages
for a in "$@"; do
  s=${a%%=*}; cls=${a#*=}
  (cd /tmp/pw && EXTRA_CLASS=$cls node extra.js /tmp/gen/scr $s | tail -1)
  [ -f /tmp/gen/scr/extra_$s.json ] && python3 /tmp/gen/insert_sections.py $P/$s /tmp/gen/scr/extra_$s.json
done
cd /user-code && timeout 300 npm run lint 2>&1 | grep -E ' error ' | head -12; echo linted
