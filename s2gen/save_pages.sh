#!/bin/bash
# Save only the named page folders: fresh export of the live editor state + those pages, then import (keeps each save under Wix's 10-page limit)
# usage: save_pages.sh page1 [page2 ...]   (page = folder under packages/site-app/src/pages)
cd /user-code
N=/tmp/n/node_modules/node/bin/node; [ -x $N ] || npm i --no-save --prefix /tmp/n node@24.22.1 >/dev/null 2>&1
W=$(readlink -f node_modules/.bin/wix)
X=/tmp/expSave; rm -rf $X
$N $W origami export-site --site bbe39ca3-42ff-4580-bbe5-278b6674efbe -d $X >/dev/null 2>&1 || { echo EXPORT-FAILED; exit 1; }
for p in "$@"; do
  rm -rf "$X/packages/site-app/src/pages/$p"; cp -r "packages/site-app/src/pages/$p" "$X/packages/site-app/src/pages/$p"
done
for f in src package.json; do rm -rf "$X/packages/site-code/$f"; cp -r "packages/site-code/$f" "$X/packages/site-code/$f"; done
npm run lint 2>&1 | grep -v ' warning ' | grep -E ' error |failed|passed' | cut -c1-300 | head -8
$N $W origami import-site -d $X --json 2>&1 | grep -v '^    at ' | tail -60 | cut -c1-400
