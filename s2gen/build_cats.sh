#!/bin/bash
# build_cats.sh live_slug[:site_folder] ...  — regenerate category pages from scraped live layouts, then save in groups of 6
cd /user-code; N=/tmp/n/node_modules/node/bin/node; W=$(readlink -f node_modules/.bin/wix)
rm -rf /tmp/expB; $N $W origami export-site --site bbe39ca3-42ff-4580-bbe5-278b6674efbe -d /tmp/expB >/dev/null 2>&1 || { echo EXPORT-FAILED; exit 1; }
P=packages/site-app/src/pages; done=()
for a in "$@"; do
  live=${a%%:*}; out=${a#*:}; [ "$out" = "$a" ] && out=$live
  [ -d /tmp/expB/$P/$out ] || { echo "no page $out"; continue; }
  python3 /tmp/gen/prep_listbase.py /tmp/expB/$P/$out /tmp/gen/lb_$out >/dev/null || { echo "listbase fail $out"; continue; }
  python3 /tmp/gen/prep_cat.py /tmp/gen/scr/scraped_$live.json /tmp/gen/assets.json /tmp/gen/cat_$out.json $out || continue
  python3 /tmp/gen/gen_cat.py /tmp/gen/lb_$out $P /tmp/gen/cat_$out.json || { echo "gen fail $out"; continue; }
  done+=($out)
done
npm run lint 2>&1 | grep -v ' warning ' | grep -E ' error |failed|passed' | cut -c1-260 | head -10
for ((i=0;i<${#done[@]};i+=6)); do
  grp=("${done[@]:i:6}"); echo "saving ${grp[*]}"
  bash /tmp/gen/save_pages.sh "${grp[@]}" > /tmp/gen/save_$i.log 2>&1; grep -v "^    at " /tmp/gen/save_$i.log | grep -E -o "\"updated\":\[[^]]*\]|✖.*|\[jsx[A-Za-z]+\].*" | head -3 | cut -c1-300
done
