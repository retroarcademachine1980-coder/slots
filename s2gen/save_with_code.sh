#!/bin/bash
# save_with_code.sh page|global/<path>... — fresh export + the named pages + site code, then import from that folder (only those pages change)
export PATH=/tmp/n/node_modules/node/bin:$PATH
cd /user-code; W=$(readlink -f node_modules/.bin/wix); X=/tmp/expC
rm -rf $X; node $W origami export-site --site bbe39ca3-42ff-4580-bbe5-278b6674efbe -d $X >/dev/null 2>&1 || { echo EXPORT-FAILED; exit 1; }
for p in "$@"; do case "$p" in global/*) rm -rf "$X/packages/site-app/src/$p"; cp -r "packages/site-app/src/$p" "$X/packages/site-app/src/$p";; *) rm -rf "$X/packages/site-app/src/pages/$p"; cp -r "packages/site-app/src/pages/$p" "$X/packages/site-app/src/pages/$p";; esac; done
for f in src package.json; do rm -rf "$X/packages/site-code/$f"; cp -r "packages/site-code/$f" "$X/packages/site-code/$f"; done
cp packages/site-code/.env.local $X/packages/site-code/ 2>/dev/null
cd $X && (yarn install >/tmp/gen/yi.log 2>&1 || npm install --no-audit --no-fund --legacy-peer-deps --package-lock=false >/tmp/gen/yi.log 2>&1); tail -2 /tmp/gen/yi.log | cut -c1-200
node $W origami import-site -d $X --json > /tmp/gen/impC.log 2>&1; echo exit=$?
grep '^Update pages\|^Add\|^Delete\|^Replace' /tmp/gen/impC.log | head -14
grep -v '^    at ' /tmp/gen/impC.log | tr -s ' \n' ' ' | grep -o '[0-9]* updated, [0-9]* unchanged\|not applied.\{0,300\}\|failed.\{0,300\}\|[Ss]ite code import[^.]*\.' | head -6
