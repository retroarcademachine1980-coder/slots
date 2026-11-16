# Studio Two Spin Raiders - launch notes (updated 2026-11-16 11:45)
## Built and saved
- Home; item pages /venue /attraction /hotel /food-and-drink (live place layout), /fruit-machine (live machine layout), /destination (live town layout, town-places provider), /offer (live offer panel)
- Hubs: arcade theme-parks attractions zoos piers museums historical-sites outdoors cinemas bowling holiday-parks sea-life tours fishing-lakes casinos agc services bingo-halls arcade-bars places-to-stay classic-fruit-machines days-out where-to-eat offers family-fun seaside retro-arcades
- New pages (copied from seaside, add_page.py + mkpage.py): hidden-gems beaches retro-video-games plan-a-trip (TripBuilder component) map search (Explorer component)
- Casino (kept, tucked away; footer link 'Casino offers (18+)'): review pages all-british-casino casino-casino mrvegas-casino-review william-hill-vegas video-slots funcasino (live .cr-wrap layout + full review text); casino-offers, affiliate-partners, race-casino (live offers page, 16 affiliate buttons with rel sponsored); 500-jackpot-slots (AGC filter panel). Builders: tools/review.js + prep_review.py, tools/offers.js + prep_offers.py, prep_500.py
## Still to build (linked from menu/home/footer)
check near-me, about-us, privacy-policy, terms, responsiblegambling against live; re-point old Beaches links (/seaside) to /beaches
## 301 redirects at launch (Bulk Create Redirects, 100/call)
- every live two-part URL from routeManifest -> /<newprefix>/<A>-<B> (venue/attraction/hotel/fruit-machine; offers -> /offer/<A>-<B>)
- /food-and-drink -> /where-to-eat (item URLs /food-and-drink/<slug> unchanged)
- /destination/<slug> unchanged
- legacy aliases (31k in routeManifest.aliases) -> resolve to their canonical then new URL; prioritise those with traffic
## Blockers
- CMS item cap blocks NEW items too: /report-a-change form gets WDE0195 'Items limit exceeded' until the premium plan is on (tested 16 Nov).
- general-1-1, general-6-1, general-8-1 are stale duplicates: live sends them to /, /destination/great-yarmouth, /destination/bridlington. At launch: 301 those three and remove the pages (ask Jamie first).
- Live /?report=change links (old pages) land on the home page; new form is /report-a-change.
- CMS item cap 10,000 on free plan (site has 11,173) -> move premium plan

## Notes
- Fuel prices: TripBuilder reads dist/fuel-prices/*.json from the repo main branch via jsDelivr (refreshed by the fuel-prices GitHub Action). Live trip builder's 'Use latest average' used the live site's _functions/fuelAverage; the new planner uses the fuel finder's station prices instead.
- Map uses Leaflet 1.9.4 from unpkg and OpenStreetMap tiles, like live; places without their own coordinates are pinned at their town centre and say so.
- Item pages answer 503 (router 400) in the dev preview; check them in the Wix editor preview.
- Live offer cards open /offers#offer=<id>; new site links to /offer/<slug> pages.
- Machine reset: clone repo, bash s2gen/setup.sh (node, playwright, pillow, assets).

## Category lists (16 Nov)
- Category lists (casinos, bowling, holiday parks, arcade bars, bingo, services, cinemas, outdoors) now use the live rule:
  read Venues, NearbyAttractions, HotelGuides and FoodAndDrink (outdoors: NearbyAttractions + AffiliateOffers) by the page words,
  keep places with active / directoryReady / cardReady not false and no closed/duplicate status, one card per record.
- Totals vs live on 16 Nov: casinos 119/119, arcade bars 19/19, bingo 14/14, services 11/11, bowling 151 vs 149-151 (live moves),
  cinemas 100 vs 99, outdoors 59 vs 58, holiday parks 198 vs 204 (live also shows about 6 affiliate stay offers; its offer rule
  depends on the live route registry, which the new site does not have).
- "Explore by destination" grids are on those pages (not AGC, which still uses the older CMS list).
- Retro Arcades: live has an H1 and a "Help improve this guide" block the new page lacks.

## Page sweep, evening 16 Nov
- Casino reviews: All British Casino now has the live Final Verdict (9.7/10) and all 11 FAQ answers; Mr Vegas Pros/Cons/Verdict;
  review H1s read as live; "More ways to spend your day" added to the 6 casino pages and £500 jackpot. Affiliate buttons untouched (2 per review page).
- AGC and £500 jackpot: live list (845 / 847), Explore by category tiles (live: Luxury Leisure tile has no matches on live either) and Explore by destination.
- Fishing lakes: live golf & fishing list (14), Plan your country escape, More golf, fishing & country ideas. The live "Country stays, golf & fishing offers"
  block shows no offers today, so it was left out.
- Not copied: casino-offers "Popular casino categories" (image-only tiles that jump to #all on live); home "See the arcade. Before you travel."
  (lazy section, not found by the scraper yet); classic fruit machine list is paginated differently (live 24 per page, new 6) but holds the same machines.
- Import rejects new attributes on site-code providers: carry new DirectoryFilter settings in baseField "@live:…" and readyField "@type:…" / "@agconly".

## Late 16 Nov
- Days Out: live listing rule on NearbyAttractions (748); live shows 912 because it also mixes in ~164 offers picked by the live route registry
  (same limitation as Holiday Parks). Explore by destination grid added (12 towns, all tested).
- Plan a Trip: fuel heading now "Compare petrol and diesel prices" (as live). Trip builder export filter fixed for the save typecheck.
- Review pages: both live heroes now present (cr-hero H1 "X Casino Review" + the cx-review-hero box with Raider Score, offer facts and the
  sponsored "AD · VISIT CASINO" link), the second as an H2 to keep one H1 per page.
- Offers: live's "GREAT DAYS OUT FOR LESS" strap is already in the new hero image (and its alt text), so no text was added.
- Needs Jamie: classic-fruit-machine-archive — live shows the archive landing (Featured machines, Browse by manufacturer, Popular eras & styles,
  Explore the archive); the new page is the long list of every machine description. Copying the landing over it would replace that list,
  so it waits for his say-so.
- After a dev-machine reset, pages come back in the re-exported format (prettified JSX, comp-* ids). insert_regions/insert_topics handle it;
  insert_sections/insert_list/copy_section were written for the generated format — check before use.
