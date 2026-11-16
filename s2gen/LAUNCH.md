# Studio Two Spin Raiders - launch notes (updated 2026-11-16 11:45)
## Built and saved
- Home; item pages /venue /attraction /hotel /food-and-drink (live place layout), /fruit-machine (live machine layout), /destination (live town layout, town-places provider), /offer (live offer panel)
- Hubs: arcade theme-parks attractions zoos piers museums historical-sites outdoors cinemas bowling holiday-parks sea-life tours fishing-lakes casinos agc services bingo-halls arcade-bars places-to-stay classic-fruit-machines days-out where-to-eat offers family-fun seaside retro-arcades
- New pages (copied from seaside, add_page.py + mkpage.py): hidden-gems beaches retro-video-games plan-a-trip (TripBuilder component) map search (Explorer component)
- Casino (kept, tucked away; footer link 'Casino offers (18+)'): review pages all-british-casino casino-casino mrvegas-casino-review william-hill-vegas video-slots funcasino (live .cr-wrap layout + full review text); casino-offers, affiliate-partners, race-casino (live offers page, 16 affiliate buttons with rel sponsored); 500-jackpot-slots (AGC filter panel). Builders: tools/review.js + prep_review.py, tools/offers.js + prep_offers.py, prep_500.py
## Still to build (linked from menu/home/footer)
report-a-change form (live uses /?report=change and the SpinRaidersChangeReports collection, which the new site lacks; footer links there for now); check near-me, about-us, privacy-policy, terms, responsiblegambling against live; re-point old Beaches links (/seaside) to /beaches
## 301 redirects at launch (Bulk Create Redirects, 100/call)
- every live two-part URL from routeManifest -> /<newprefix>/<A>-<B> (venue/attraction/hotel/fruit-machine; offers -> /offer/<A>-<B>)
- /food-and-drink -> /where-to-eat (item URLs /food-and-drink/<slug> unchanged)
- /destination/<slug> unchanged
- legacy aliases (31k in routeManifest.aliases) -> resolve to their canonical then new URL; prioritise those with traffic
## Blockers
- CMS item cap 10,000 on free plan (site has 11,173) -> move premium plan

## Notes
- Fuel prices: TripBuilder reads dist/fuel-prices/*.json from the repo main branch via jsDelivr (refreshed by the fuel-prices GitHub Action). Live trip builder's 'Use latest average' used the live site's _functions/fuelAverage; the new planner uses the fuel finder's station prices instead.
- Map uses Leaflet 1.9.4 from unpkg and OpenStreetMap tiles, like live; places without their own coordinates are pinned at their town centre and say so.
- Item pages answer 503 (router 400) in the dev preview; check them in the Wix editor preview.
- Live offer cards open /offers#offer=<id>; new site links to /offer/<slug> pages.
- Machine reset: clone repo, bash s2gen/setup.sh (node, playwright, pillow, assets).
