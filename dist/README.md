# Spin Raiders site code bundle

Generated 27 Sep 2026 from the 125 snippets in Wix → Settings → Custom Code on the live site.
All of them were scoped to "All pages" and 102 sat in the `<head>`, adding ~1.1 MB of code
(serialised twice by Wix = ~2 MB of the 3.5 MB homepage HTML) before anything could render.

| file | what | size |
|---|---|---|
| `sr.min.js` | all 129 inline scripts, in the original head → bodyStart → bodyEnd order, each wrapped in its own try/catch so one failing snippet can't stop the rest | 1.0 MB raw / ~310 KB gzip |
| `sr.min.css` | all 14 `<style>` blocks, same order | 46 KB / ~11 KB gzip |
| `sr.js`, `sr.css` | the same, unminified, with a `/* [n] name */` comment above every snippet so you can find and delete dead ones later | |
| `wix-loader-snippet.html` | the one snippet that replaces the 125 | |
| `MANIFEST.txt` | every snippet, its size, position and whether it was moved or must stay | |

## Rollout — test on the draft site first

1. Copy this `dist/` folder into the `slots` repo and push to `main`.
2. Note the short commit hash (`git rev-parse --short HEAD`), and put it in place of `COMMIT` in
   `wix-loader-snippet.html` (both URLs). Pinning to a commit lets jsDelivr cache the files for a year,
   which fixes the "efficient cache lifetimes" audit; `@main` would cache for 12 h only.
3. In Wix → Settings → Custom Code, add the loader snippet: Head, All pages, Load once.
4. Delete every other Spin Raiders snippet (all 125 except the ones below). Leaving any in place
   would run the code twice.
5. **Keep** in Wix, always: "Google AdSense Auto Ads (head)" (AdSense is under review — NEVER remove
   or edit this snippet) and the Pinterest / Bing / Yandex verification metas.
   **Delete** only: "Proper Casinos 01–06" (empty placeholders).
6. Publish, then re-run PageSpeed on the homepage and one destination page.

## Status — 28 Sep 2026: LIVE
Done via the Wix Custom Embeds API on 28 Sep 2026 (01:15). The loader snippet is embed
`a7b6db23-d37d-4400-b04c-85ec1b97e4a2`. The 121 replaced snippets were **disabled, not deleted**
(so they can be re-enabled one by one if anything is missing). Left enabled and untouched:
GTM ("spin raiders"), **both Google AdSense snippets**, Private Traffic Tracker V1.
Homepage mobile PageSpeed before → after: FCP 9.8 s → 3.3 s, LCP 17.9 s → ~10 s (PSI varies ±3 s run to run
because Wix sometimes serves a 0.76 MB "lite" shell and sometimes the full 1.2 MB render).
Also 28 Sep: bundle loaded `async fetchpriority=high`; Google Fonts non-blocking; hero/tile images served
phone-sized; Imperial Hotel photo re-hosted on Wix (467 KB → 94 KB); 32 unused Wix apps uninstalled and site
published via API (the rendered clientSpecMap still listed 59 apps 3 min later — re-check).

## What still makes the homepage slow (measured 28 Sep, slow-4G/4x CPU)
Cold mobile load is ~3.9 MB: Wix scripts ~1.5 MB, images ~1.3 MB, fonts 340 KB, our bundle 310 KB, AdSense 350 KB
(must stay). Under throttling everything downloads at once so the bundle lands at ~12 s and the hero paints
right after it. To get near 2 s the Wix page underneath must shrink — it is still the old full homepage
(400 elements, 360 KB inline CSS) that the skin paints over. Next steps in order:
1. Empty the old homepage sections in the Wix editor (keep header/footer), publish.
2. Split the bundle by route so the homepage loads ~80 KB instead of 310 KB (54 snippets self-gate on URL).
3. Trim Google Fonts to the weights actually used.

## Image sizing (28 Sep 2026, 08:15)
227 image URLs in the snippets were bare `static.wixstatic.com/media/<id>~mv2.png` links, which serve the
ORIGINAL upload: the search-page hero was a 2.75 MB PNG and the trip-planner panel 2.0 MB, on every
destination/search page (LCP 54 s on throttled mobile). `tools/size-images.py` now rewrites them to
`/v1/fit/w_1400,h_1400,q_70,enc_auto/file.webp` (browsers get AVIF/WebP: 2.75 MB → 174 KB, 2.0 MB → 87 KB).
Run it after editing sr.js, then split-bundle.py. LIVE since 08:40 on commit 9e84889 (loader embed revision 13).
Live re-measure (2 runs each, slow 4G + 4x CPU): /destination/blackpool LCP 54 s → 25 s, 4.8 → 3.1 MB;
/search?q=blackpool 48 s → 22 s; /destination/cleethorpes ~21 s. Wix's edge cache kept serving the old
loader for a few minutes after the embed update — check with curl for the slots@<hash> before measuring. Measured on /destination/blackpool, slow 4G + 4x CPU:
4.8 MB → 2.4 MB, LCP 54 s → 16 s; /search?q=blackpool 7.4 MB → 2.9 MB, LCP 48 s → 13.5 s.
Still heavy on inner pages: sr.rest.min.js (~300 KB gz, loads at once off the homepage), Google Maps embed
(~1.3 MB of script from the Wix map element), Wowcher deal photos (up to 470 KB each, external, can't be resized),
and ~1 MB of images for the hidden old Wix sections the skin paints over.

## Affiliate/offer photos re-hosted (28 Sep 2026, 09:45)
158 photos that pages pulled from Wowcher, Booking-style hotel sites, Coral Island, Visit Blackpool etc. were
downloaded, resized to 800px WebP (25.7 MB of originals -> 6.6 MB, ~40 KB each) and uploaded to the site's own
Wix media (folder copies also in img/offers/). CMS display fields were switched to the Wix copies:
DestinationRecommendations image/dealImage/fallbackImage (153 items), Venues mainImage/heroImage/gallery (4),
WowcherOffers (2), HomepageArcadeFeed monthly-hotel (1), NearbyAttractions heroImage (1). Source/provenance fields
(imageSource, imageSourceUrl, exteriorPhotoSource...) were left untouched for backlink outreach.
tools/rehost_map.json maps every original URL to its Wix copy. Not re-hosted: YouTube thumbnails, the Hunstanton
webcam (live), OSM tiles, and 3 that could not be fetched (Flibco London 404, two Wikimedia photos rate-limited).
After this no page downloads images from outside hosts. Card photos now request 720px q62 instead of 1200px q76.
Measured (slow 4G + 4x CPU, Pixel 5): /destination/blackpool LCP ~22 s, /search ~20 s, homepage LCP 2.2 s.
Inner pages are now limited by sr.rest.min.js (276 KB gz, must download + run before the page paints) and ~2 MB of
Wix's own scripts/images. Next: split sr.rest by page type; empty the hidden old Wix sections in the editor.

## Page-type split (28 Sep 2026, 10:15) — LIVE on e3b678a (loader embed revision 16)
V8 coverage on town, search, venue, food-and-drink and machine pages showed 26 rest snippets (235 KB) only run
their URL check there (list in dist/inner-idle.json). On those page types the bootstrap now loads sr.page.min.js
(86 snippets) straight away and sr.idle.min.js after load / first tap. Every other page still gets the full
sr.rest.min.js at once; the homepage is unchanged. Verified against the live site before switching: identical
text and page height, 0.00-0.41% pixel difference (lighter banner) on 8 pages. The loader also preloads the
search/town banner (now 1000px q60, 83 KB instead of 174 KB) on /destination/<town> and /search.
If a snippet is added that should paint on those page types, re-run the coverage check and update inner-idle.json.
Measured after: typical 4G phone (9 Mbps, 2x CPU) — Blackpool 3.5 s, Cleethorpes 3.4 s, search 5.2 s,
venue 3.5 s, homepage 1.0 s (largest paint). Slow 4G + 4x CPU — Blackpool 22 s, search 18.6 s, Cleethorpes 18 s,
venue 11.6 s. What is left is mostly Wix's own scripts (~900 KB) plus AdSense.

## Old skins and the flicker (28 Sep 2026, 11:55) — paint hold LIVE (loader embed revision 17)
Findings (layer-by-layer screenshot tests + draw-order recording, scratch scripts skins.py / layers.py):
- The "Seaside Skin" (core/pages/bootstrap/adult/archive/native/reports/offers/archive-quality/Loader), "Clean Rebuild
  Preview" (map.js, style-1/2.css), "Arcade Life fun.js/fun.css" and "Casino Design styles/layout" blocks are NOT old:
  the Seaside Skin Loader refuses to draw unless all 16 of those parts are registered in window.SR_SEASIDE_SOURCE, and the
  newer page designs read its data/helpers. Removing any one of them collapses town pages to ~2,500 px. "Proper Casinos
  01-06" are the /casinos listings (content). "category router compatibility" routes the ?explore= links.
- The flicker was two things: (1) the original Wix page painted first on town/search/food/machine/seaside pages (the
  Early Native Shell Guard only covered some routes and arrives with the async bundle); (2) double drawing — the Seaside
  skin draws a whole town/venue page, then the final design replaces it (#sr-location-directory on /destination/<town>
  ~0.75 s later, #sr-shell-page on /arcade-venues/ ~1 s later; search flashed the Blackpool picks strip).
Fix: dist/paint-hold.html is now the first thing in the loader embed. On those page types it keeps the page on the dark
brand background until the FINAL design's container is on screen, then shows it in one go (15 s safety release).
Verified live: town, venue, search, machine and home pages now show only their final design; finished pages identical to
the baseline on 21 of 22 comparable pages (/map varies between loads on its own). The Seaside drawing still happens
underneath (hidden) — removing it needs the final designs to stop depending on the Seaside layer (a rebuild job).

## Town pages: old layer no longer draws (28 Sep 2026, 12:45) — LIVE on b9dcb77 (loader revision 18)
The Seaside bootstrap router (inside the "bootstrap.js" string in block "[7] Seaside Skin bootstrap.js") now returns
early for route "destination" unless window.SR_SEASIDE_DRAW_TOWN is set. The final town design (block "[49] Universal
Location V2 Skin", #sr-location-directory) only needs SR_SEASIDE.archiveQuery + SR_SEARCH_DATA/VIEW, which still load.
Verified: 22-page baseline identical except og:image/twitter:image on town pages now keep Wix's own 2500px version of
the same photo instead of a 1200px one. Slow 4G + 4x CPU: Blackpool 22 s -> 9.8 s, Cleethorpes 18 s -> 9.8 s.
Next: venue pages (#sr-shell-page from "[117] venue page renderer v3") read SR_SEASIDE.currentRecord, which the
Seaside venue render sets — needs that record loaded without drawing before the same switch-off can be made.

## Final pass 28 Sep 2026 (13:40) — LIVE on bdf9a4c (loader embed revision 20)
- Seaside router no longer draws hidden pages for destination, venue or archive routes (venue v3 fetches its own record;
  the archive design gets an empty hidden #sr-seaside-root to mount beside).
- Photos right-sized: venue hero 1000 / gallery 900 / nearby cards 480 (a 1.69 MB PNG thumbnail was loading raw),
  directory/search cards 480, town deals strip 560, homepage cards 480-500 q55 AVIF (restaurant card 114 -> 46 KB),
  homepage promo crops 700 q55, search banner 1000 q60 (preloaded on /search; the town banner is preloaded on towns).
- Tried and rejected: display:none on #SITE_CONTAINER from the first byte (mixed results, not worth the risk).
Measured live, Pixel 5 — typical 4G (9 Mbps, 2x CPU): home 1.1 s, Blackpool 3.2 s, Cleethorpes 3.4 s, Admiral York 3.7 s,
search 4.9 s, food page 2.0 s first paint. Slow 4G (1.6 Mbps, 4x CPU): home 2.2 s, towns 9.3-9.9 s, venue 9.8 s,
search 10.8 s (this morning: towns 22-54 s, search 48 s).
Regression: 25-page screenshot + SEO-tag comparison with the morning baseline — identical apart from share-preview image
size on town/venue pages and photo recompression (<0.8% pixels), plus pages that vary on their own (blog, casino-offers).
REMAINING (needs the Wix editor / owner decision, not code): the hidden Wix sections still load full-size originals —
/classic-fruit-machine-archive's old repeater (93 image elements, ~17 MB, 64 downloaded at once), the hidden dynamic-page
hero on food pages (~400 KB) and town pages (~140 KB). Their CMS image fields hold bare https URLs, so Wix can't resize.
Also: 3,438 of 3,650 ClassicFruitMachines records are active:false but still in the Wix sitemap -> "Record unavailable" soft 404s.

## To ship a change later
Run `sh tools/ship.sh "message"` (sizes images, splits bundles, commits, pushes, prints the hash), then put the
hash into the loader embed.

Edit the source in the repo, rebuild/push, update the commit hash in the loader. Never paste code
back into Custom Code snippets.

## What this fixes and what it doesn't
Fixes: render-blocking requests, duplicated JavaScript, cache lifetimes, most of the DOM/HTML weight,
"old design flashes" caused by head scripts repainting the page.
Doesn't fix on its own: the ~30 `setInterval` / `MutationObserver` pollers ("Skin Guard", "Shell Guard",
"Original Skin Guard", "Editorial Depth"…) which are the forced-reflow and main-thread work. Those are
layers of skins guarding against each other and want retiring one by one now that they're in one file
where you can see them. Next step after this ships: split the bundle by route (seaside/casino/archive/
trip/account each only on their own pages) — 54 snippets already self-gate on the URL, so it's mechanical.

## If the old "Spin Blitz" casino site ever reappears on the live URL (fixed 28 Sep 2026)
It was never in the editor. Wix's Release Manager (Dashboard > Settings > Release Manager) had a stale
release from an old branch (branch ea0199f5, revision 2, the casino site) registered as "Live Site 100%",
so visitors were routed to it no matter how often the editor was published. Fix: open Release Manager,
make sure "Live Site" shows the latest main revision (was 6282) and no old branch; discard any leftover
release candidate. Check with:  curl -s https://www.spin-raiders.com/ | grep -o '"siteRevision":[0-9]*'

## Never uninstall the Wix CMS or Site Search apps (28 Sep 2026)
An app clean-up removed "Wix CMS" (e593b0bd-b783-45b8-97c2-873d42aacaf4) and "Site Search"
(13322a7c-6039-ac58-86e8-48b76f901d91). Every dynamic page (venues, destinations, food) then 404'd.
They were reinstalled via the Apps Installer API and the site republished. If a clean-up is ever done
again, keep both of these, plus anything the Velo code or Custom Embeds reference.

## Auto-publish from GitHub switched OFF (28 Sep 2026, 03:15)
`wix publish` (GitHub Action) and the REST "Publish Site" API both publish a new technical branch built
from OLD revision 5616 of Original-Branch (the casino site). Every push to main therefore put the casino
site live and 404'd all dynamic pages. The Action now only runs by hand. To publish, open the editor on
Original-Branch and press Publish (restored revision 6283 this way). Do NOT use the Publish Site API.

## Homepage split (28 Sep 2026)
The homepage no longer downloads the whole 1 MB bundle before it can paint. `tools/split-bundle.py`
builds two files from `sr.js`:
- `sr.core.min.js` — the 16 snippets that actually act on `/` (measured in headless Chromium with every
  snippet instrumented: 12 did DOM work or were read via a global by one that did, plus the newsletter).
  ~83 KB raw / 27 KB gzip. Loaded immediately on `/` with fetchpriority=high.
- `sr.rest.min.js` — the other 116, loaded on `/` 1.5 s after the load event or on the first
  pointer/key/touch, whichever is first. They all bail on `/` anyway (they gate on other paths), so
  nothing changes visually — verified pixel-identical against the full bundle on desktop and mobile.
`sr.min.js` (all 129 in one file) is still built and kept for reference/rollback but the loader no longer uses it.
The loader has ONE static `<script async fetchpriority=high src=…/sr.core.min.js>` on every page (static so the
browser's preload scanner finds it at once — a dynamically inserted tag was measured landing 10 s later on slow 4G).
The generated bootstrap at the top of sr.core.min.js loads sr.rest.min.js: immediately on inner pages, deferred on `/`.
Inner pages therefore run the 13 core snippets before the other 116 — verified pixel-identical to the old single
bundle on /, /seaside, /classic-fruit-machine-archive, /casino-offers, /destination/blackpool, /agc, /?view=offers
and /search?q=blackpool. The core list lives in
`dist/homepage-core.json` (0-based snippet indexes in sr.js order); after editing sr.js re-run
`python3 tools/split-bundle.py` and commit all three files together.

Measured 28 Sep 2026 04:20, Pixel-6 emulation, slow 4G (1.6 Mbps / 150 ms) + 4x CPU throttle, real network:
hero painted at 8.8–12.4 s with the single bundle; 1.9–2.5 s with the core bundle (3 runs: 2.00 / 2.05 / 1.94 s).
Two of the core snippets ("Homepage Style Discovery Cards", "Days Out Experience") do their rendering inside timer
callbacks, which the instrumented probe could not attribute — they were found by injecting the rest snippets one by
one (scratch script "bisect"). If the homepage ever comes up empty with only the core loaded, repeat that bisection.

## SEO wording (28 Sep 2026)

Strategy: the homepage and every general page use days-out / road-trip / family wording ("Your next big day out
starts here"); arcade wording stays on arcade, AGC, casino and fruit-machine pages only.

- Server titles/descriptions: `src/public/seo.js` (`HOME_TITLE`, `GENERAL_PAGE_SEO`), rendered into the HTML by
  masterPage.js. Client copy of the same wording: snippet [125] in dist/sr.js, which stops later page designs
  swapping the title back. Change both together.
- Town pages: a town is let into Google when its intro is 40+ words, or 25+ words with 3+ venues/attractions
  listed (was 40+ words only, which kept Blackpool, Leeds, Glasgow etc. out).
- Not done yet: town titles/descriptions still come from each Locations record's seoTitle/seoDescription and
  mostly say "Arcades & Gaming Guide". The planned days-out rewrite (662 non-services towns) needs Jamie's go-ahead
  for a bulk CMS update.
