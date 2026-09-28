#!/usr/bin/env python3
"""Rewrite full-size Wix image URLs in dist/sr.js to sized, compressed ones.

  python3 tools/size-images.py        (then run tools/split-bundle.py)

A bare https://static.wixstatic.com/media/<id>~mv2.png URL serves the ORIGINAL upload — the search
hero was a 2.75 MB PNG, the trip-planner panel 2.0 MB. Adding Wix's image transform
(/v1/fit/w_1400,h_1400,q_70,enc_auto/…) makes Wix serve a resized WebP/AVIF of ~100 KB instead.
GIFs are left alone (animation) and anything already carrying /v1/ is untouched.
Idempotent — safe to run after every edit of sr.js.
"""
import re, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'sr.js'
src = p.read_text(encoding='utf-8')
pat = re.compile(r'https://static\.wixstatic\.com/media/([A-Za-z0-9_]+~mv2\.(?:png|jpe?g|webp))(?!/v1/)(?![A-Za-z0-9_./])')
n = 0
def sub(m):
    global n; n += 1
    return 'https://static.wixstatic.com/media/%s/v1/fit/w_1400,h_1400,q_70,enc_auto/file.webp' % m.group(1)
out = pat.sub(sub, src)
p.write_text(out, encoding='utf-8')
print('rewrote', n, 'image URLs in', p)
