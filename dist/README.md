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

## To ship a change later
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
