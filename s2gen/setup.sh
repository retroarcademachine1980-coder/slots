#!/bin/bash
# One-shot dev machine setup after a reset (/tmp is wiped, /user-code is kept).
# Then: python3 /tmp/gen/make_assets.py  (base crops + extra crops/sizes + icons from /tmp/gen/media.json if present)
mkdir -p /tmp/n && cd /tmp/n && { [ -x node_modules/node/bin/node ] || { npm init -y >/dev/null 2>&1; npm i node@24 >/dev/null 2>&1; }; }
export PATH=/tmp/n/node_modules/node/bin:$PATH
[ -d /tmp/slots/.git ] || git clone -q -b studio-two-build --depth 1 https://github.com/retroarcademachine1980-coder/slots /tmp/slots
cd /tmp/slots && git pull -q origin studio-two-build
rm -rf /tmp/gen /tmp/s2data && cp -r s2gen /tmp/gen && cp -r s2data /tmp/s2data && mkdir -p /tmp/gen/scr
mkdir -p /tmp/pw && cd /tmp/pw && { [ -d node_modules/playwright ] || { npm init -y >/dev/null 2>&1; npm i playwright@1.48.2 >/dev/null 2>&1; }; }
cp /tmp/gen/scrape_fn.js /tmp/gen/scrape_fn2.js /tmp/gen/scrape_run.mjs /tmp/pw/
python3 -c "import PIL" 2>/dev/null || pip install -q pillow 2>/dev/null || pip install -q --break-system-packages pillow
python3 /tmp/gen/make_assets.py
echo "node $(node -v) chrome $(find /opt/ms-playwright -name chrome-headless-shell -type f | head -1)"
