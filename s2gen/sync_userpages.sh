#!/bin/bash
# sync_userpages.sh keep1 keep2 ... — make /user-code pages match the stored site, except the named pages (so an import only sends those)
cd /user-code; N=/tmp/n/node_modules/node/bin/node; W=$(readlink -f node_modules/.bin/wix)
rm -rf /tmp/expQ; $N $W origami export-site --site bbe39ca3-42ff-4580-bbe5-278b6674efbe -d /tmp/expQ >/dev/null 2>&1 || { echo EXPORT-FAILED; exit 1; }
P=packages/site-app/src; keep=" $* "
for d in /tmp/expQ/$P/pages/*/; do p=$(basename "$d"); case "$keep" in *" $p "*) continue;; esac; rm -rf "$P/pages/$p"; cp -r "$d" "$P/pages/$p"; done
for f in $(ls /tmp/expQ/$P | grep -v '^pages$'); do rm -rf "$P/$f"; cp -r "/tmp/expQ/$P/$f" "$P/$f"; done
cp /tmp/expQ/packages/site-app/package.json packages/site-app/package.json
echo synced
