#!/bin/bash
# check.sh in.tsv out.tsv : each line "from<TAB>to" -> "fromcode tocode from to"
P=${P:-24}
cat "$1" | xargs -P $P -d '\n' -I{} bash -c 'f=$(cut -f1 <<<"{}"); t=$(cut -f2 <<<"{}"); a=$(curl -s -o /dev/null -m 40 -w "%{http_code}" "https://www.spin-raiders.com$f"); b=$(curl -s -o /dev/null -m 40 -w "%{http_code}" "https://www.spin-raiders.com$t"); echo "$a $b $f $t"' > "$2"
