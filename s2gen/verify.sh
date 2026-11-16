#!/bin/bash
# verify.sh page... — export the site and show whether each page carries the new layout ids
cd /user-code; N=/tmp/n/node_modules/node/bin/node; W=$(readlink -f node_modules/.bin/wix)
rm -rf /tmp/expV; $N $W origami export-site --site bbe39ca3-42ff-4580-bbe5-278b6674efbe -d /tmp/expV >/dev/null 2>&1 || { echo EXPORT-FAILED; exit 1; }
for p in "$@"; do f=$(ls /tmp/expV/packages/site-app/src/pages/$p/*.jsx 2>/dev/null | grep -v index | head -1); echo "$p: $(grep -c 'id="tl0x0"\|id="h2t"\|id="fc0x0"' $f 2>/dev/null) new-ids, ib-icons $(grep -c 'id="cs' $f 2>/dev/null)"; done
