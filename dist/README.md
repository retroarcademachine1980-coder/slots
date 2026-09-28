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
