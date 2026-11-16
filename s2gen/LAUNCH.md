# Studio Two Spin Raiders - launch notes (updated 2026-11-16 11:45)
## Built and saved
- Home; item pages /venue /attraction /hotel /food-and-drink (live place layout), /fruit-machine (live machine layout), /destination (live town layout, town-places provider), /offer (live offer panel)
- Hubs: arcade theme-parks attractions zoos piers museums historical-sites outdoors cinemas bowling holiday-parks sea-life tours fishing-lakes casinos agc services bingo-halls arcade-bars places-to-stay classic-fruit-machines days-out where-to-eat offers family-fun seaside retro-arcades
- New pages (copied from seaside, add_page.py + mkpage.py): hidden-gems beaches retro-video-games
## Still to build (linked from menu/home/footer)
plan-a-trip (trip builder + fuel prices), map, search, report-a-change; check about-us, privacy-policy, terms, responsiblegambling against live
## 301 redirects at launch (Bulk Create Redirects, 100/call)
- every live two-part URL from routeManifest -> /<newprefix>/<A>-<B> (venue/attraction/hotel/fruit-machine; offers -> /offer/<A>-<B>)
- /food-and-drink -> /where-to-eat (item URLs /food-and-drink/<slug> unchanged)
- /destination/<slug> unchanged
- legacy aliases (31k in routeManifest.aliases) -> resolve to their canonical then new URL; prioritise those with traffic
## Blockers
- CMS item cap 10,000 on free plan (site has 11,173) -> move premium plan

## Notes
- Item pages answer 503 (router 400) in the dev preview; check them in the Wix editor preview.
- Live offer cards open /offers#offer=<id>; new site links to /offer/<slug> pages.
- Machine reset: clone repo, bash s2gen/setup.sh (node, playwright, pillow, assets).
