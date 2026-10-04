# Cinema venue repair — 29 September 2026

## Deployed
- Cinema renderer and link repair: `dist/sr-cinema-venues-20260929.js`, pinned in the active Wix loader to commit `9455f7a3ebab13ffe9dd2cf78fa88d5a94e9f869`.
- Only the existing active custom embed was changed. No Wix CLI publish and no legacy snippets enabled.
- 11 existing cinema records retained. Cineworld Hull's original review, 4.5/5 Raider Score and all nine supplied photos remain unchanged in CMS. The renderer now displays gallery images, captions and credits.
- 28 exact redirects cover existing cinema URL aliases. They resolve to the working root collection/place renderer; these are functional redirects, not native clean-path server-rendered pages.
- Added 88 Vue official-source researched guides to NearbyAttractions. IDs are `sr-vue-<official-venue-slug>`. No first-hand reviews, ratings or venue photos were fabricated.
- 190 exact redirects cover new Vue clean aliases and Wix-generated native paths. All 190 succeeded with zero failures in two batches (100 and 90).
- Wix's redirect recipe claimed a maximum batch size of 500; the actual API and current method article permit 100. The first oversized redirect request wrote nothing. The already successful CMS inserts were not repeated.

## Verified
- Syntax check passed.
- Isolated DOM tests exercised 102 cinema aliases across 99 records, including links inside shadow roots, original review text, gallery captions, unsafe image URL rejection and separation of Raider Score from public ratings.
- Anonymous public CMS queries and DOM rendering passed for Cineworld Hull, Vue Hull and Vue Manchester Printworks.
- Hull renders all nine supplied images and the original 4.5/5 score.
- Live site HTML contains the pinned patch. Existing redirect checks reached HTTP 200; previously cached 404 responses for Hull/Barnstaple were resolved on fresh requests.
- No full browser visual/device test was performed in this session.

## Outstanding data connections
- No Google/Places/Maps-named credential was found in Wix Secrets Manager metadata. No secret values were requested. Google review ratings, review text and automatic Google photos are not connected.
- Vue guides currently link to official live listings; Vue showtimes are not automatically imported.
- Existing automatic showtime implementation covers six Scott Cinemas only. Stale or unavailable feeds show a booking fallback rather than old screening times.
- Venue photography for the new Vue records is still unverified/unpopulated. Do not call these complete photo guides.
- Venue-specific accessibility details and parking allowances are incomplete for some Vue locations and are explicitly qualified in the guides.

Do not activate the disabled `publish-wix.yml` workflow to deploy this patch: it can publish an obsolete saved site revision. Preserve the active loader's other concurrent changes when updating a pinned script.
