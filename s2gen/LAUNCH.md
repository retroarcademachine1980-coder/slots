# Studio Two Spin Raiders - launch notes (updated 2026-11-15 21:30)
## Built and saved
- Home; item pages /venue /attraction /hotel /fruit-machine /destination /offer(default template) /food-and-drink
- Hubs: arcade theme-parks attractions zoos piers museums historical-sites outdoors cinemas bowling holiday-parks sea-life tours fishing-lakes casinos agc services bingo-halls arcade-bars places-to-stay classic-fruit-machines days-out where-to-eat
## Still to build (linked from menu/home/footer)
offers, hidden-gems, family-fun, seaside, beaches, plan-a-trip (trip builder + fuel prices), map, search, retro-video-games, about-us, privacy-policy, terms, safer-gambling, report-a-change
## 301 redirects at launch (Bulk Create Redirects, 100/call)
- every live two-part URL from routeManifest -> /<newprefix>/<A>-<B> (venue/attraction/hotel/fruit-machine; offers -> /offer/<A>-<B>)
- /food-and-drink -> /where-to-eat (item URLs /food-and-drink/<slug> unchanged)
- /destination/<slug> unchanged
- legacy aliases (31k in routeManifest.aliases) -> resolve to their canonical then new URL; prioritise those with traffic
## Blockers
- CMS item cap 10,000 on free plan (site has 11,173) -> move premium plan
