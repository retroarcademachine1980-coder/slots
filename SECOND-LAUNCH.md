# Second launch — implementation checkpoint, 22 September 2026

Status: **not ready to publish**. Keep `main` and the live site unchanged.

Site: `517c2402-3182-4b3f-a2f1-be5611e7e22f`.
Git branch: `clean-code-rebuild`.
Wix design branch: `a1ffd007-a36b-448d-af43-b8f9b1e8be9b`.

## Code added

- `src/public/discovery-core.js`: publication eligibility, exact canonical routes, normalised British search aliases, typo/transposition matching, ambiguous-result handling, valid offers, exact/saved/local monetised recommendation ordering, nearest canonical destination.
- `src/backend/discovery-service.js`: fresh, paginated CMS reads. Failed reads surface an error, not a misleading partial catalogue. No long-lived catalogue cache.
- `src/backend/discovery.web.js`: public search/recommendations and nearest destination; member-only affiliate URL resolution with fresh readiness/expiry checks.
- `src/backend/member-discovery.web.js`: author-scoped preferences and saved venues. Server-resolved member identity; collection author permissions remain enabled. No rating or readiness writes.
- `src/public/member-preferences.js`: allowlisted preference validation and explicit marketing-consent timestamps.
- `src/public/discovery-controller.js`: stale-response protection and deliberate second-click offer flow after login.
- `src/public/discovery-ui.js`: Velo adapters to bind existing Editor controls, request location only on an explicit click, and load homepage recommendations.

All public responses use selected display fields. Raw CMS records, research notes, member data and affiliate URLs are not included in public search cards. Exact offers remain selectable cards so exact-match handling does not bypass membership.

## Verified

`npm test`: 19 passing tests, covering suppression, route mismatches, duplicates, bookmaking, typo matching, ambiguity, expiry, private-field omission, pagination, data-source failure, member isolation, consent and offer login behaviour.

`npm run lint`: passes.

These are local JavaScript and mocked Velo integration tests. They are **not** a Wix compiler pass, Editor integration test, mobile check or live member-login sign-off.

## Editor findings — actual observed state

The design branch opens successfully from Wix Dashboard → Edit Site → clean-code-rebuild.
Its Velo panel explicitly says: **“You're viewing the latest code from origin/main as read-only.”**
The panel directs development through Local Dev Setup (`wix dev`). Selecting the Wix design branch does not by itself select the matching Git code branch.

Observed Editor page bindings absent from the Git snapshot include:

- `UK Amusement Arcades.jrgbr.js`
- `Search Results.cfe9p.js`
- `Search Suggestions.p2cgc.js`
- `map.ngnt4.js`
- dynamic Arcade Venues and Arcade Locations item pages (their exact code filenames still need syncing).

The branch preview still includes the retired “Bookmakers With Fruit Machines” navigation. It must be removed in this branch too before release. Existing protected casino-offer/review layouts must be preserved.

No masterPage override, invented page IDs, synthetic Editor page files or replacement page layout has been installed. The new adapters are **not yet bound to page controls**.

## Next integration steps

1. Open Local Editor with this code branch and the correct Wix design branch. Sync the actual page-code files and element IDs; preserve existing page structures and approved design.
2. Bind `mountSearch({input, submit, render, status})` to the observed search controls. `render` must populate the existing card repeater and spelling suggestions. Set repeater handlers before assigning data and render plain text through `.text`, not unsanitised HTML. Do not bind affiliate cards directly to external URLs.
3. Use `offerClickHandler(status)` for offer buttons. First click opens login; completed login stays on-page; a second click obtains the fresh destination URL. Marketing opt-in is separate.
4. Wire homepage local/saved recommendation sections, manual location selection, member preference controls and save buttons. `chooseNearbyArea()` is only for the explicit location button. Implement preference category/radius filtering and explicit viewed/impression tracking before claiming full personalisation; these are not complete yet.
5. Verify all card/routes, loading/error/empty states, keyboard navigation and mobile layouts in the actual branch preview. Wix Members and navigation APIs have preview limitations; use an authorised appropriate test environment, not an unapproved production publish.

## Preview blocker

The attempt to start `wix dev` was blocked by automatic approval review: the CLI triggers telemetry/error data to Sentry, and the payload was not established or explicitly authorised. Do not retry or bypass that restriction without resolving approval. No preview server or Wix build success is claimed.

## CMS/image checkpoint

Fresh enumeration: 2,104 Venues, 738 Locations. 12 venue and 24 location records had `directoryReady=true`. 689 venue records lacked `heroImage`; two locations did before the Renfrew fix below. These counts include held records and do not imply 689 publishable venues.

Completed previously in this conversation: verified Tenpin Southampton exterior and eight location images (Newtownards, Looe, Northampton, Lake District, Bideford, Stoke-on-Trent, Bury and Lisburn).

Completed in this checkpoint: Renfrew town hall photograph, visually inspected, alt and CC BY-SA 3.0 attribution attached. CMS record `loc-funstation-braehead-20260911`; photo `3a517e_7ef7bae0c9e742f38f53a538a79594f6~mv2.jpg`. Public readiness flags unchanged. Ballymena is the remaining destination hero gap. Venue gaps remain 689.

Never bulk-promote images from galleries, reuse a brand photo across branches, or relist the 538 suppressed records simply because a hero or route exists. Exact exterior verification and venue-specific editorial completion remain required. Existing images also need crop/resolution verification; a non-empty image field is not a launch-quality sign-off.

## Sources for implementation

- https://dev.wix.com/docs/velo/apis/wix-web-module/web-method
- https://dev.wix.com/docs/velo/apis/wix-data/wix-data-query/find
- https://dev.wix.com/docs/velo/apis/wix-data/wix-data-query-result/next
- https://dev.wix.com/docs/velo/apis/wix-data/save
- https://dev.wix.com/docs/velo/apis/wix-members-backend/current-member/get-member
- https://dev.wix.com/docs/velo/apis/wix-members-frontend/authentication/prompt-login
- https://dev.wix.com/docs/velo/apis/wix-window-frontend/get-current-geolocation
- https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/git-integration-wix-cli-for-sites/about-git-integration-wix-cli-for-sites

## Search and report follow-up

Search now indexes town, location slug, destination, brand, operator and postcode independently of display location; Mr P punctuation/spacing variants match consistently. Search submission preserves the result list instead of redirecting to an exact destination. Historical research notes no longer override current publication flags. Explicit closed/duplicate/quarantined statuses and readiness flags still apply. 23 tests and lint pass. These changes remain unconnected to production pages.

CMS audit found four Mr P records: Bognor enabled; Chatham, Fareham and Portsmouth disabled. Search matching alone cannot surface those disabled branches. SpinRaidersChangeReports returned zero rows. Wix intake submissions query failed with unsupported namespace; this is not proof that other submission channels are empty.

Southport live remediation: mapEnabled restored for Funtime and Jackpot; MERKUR and Golden Sovereign restored to discovery at user request. Public map verified six venue cards plus two attractions. Other Southport records and town-filter redirect remain unresolved.

## Live navigation repair and fuzzy fallback

Existing core embed 323eeaea-60ee-4132-b793-a0642038df96 changed in place from revision 34 to 35. Its full-page venue navigation handler previously ran only when the current page was already a venue. It now handles same-origin venue/destination targets from any page, retaining modifier-key/external/download exclusions. No extra embed was created. The before/after source is in legacy-recovery. Confirmed by clicking six Southport destination card buttons: Funtime, Golden Sovereign, Late Lounge, Jackpot, Funland, MERKUR each reached its own URL AND showed its own H1. Existing open browser pages need refreshing to load the changed handler.

Velo search now labels fuzzy matches as Did you mean suggestions and offers related matches when at least half the meaningful query words match, only if there is no full match. Completely unrelated input is not passed off as a match. This remains branch-only pending Editor integration.

Wix Forms dashboard was checked after API failure: no forms and No submissions yet. Custom report form has no upload input. Venue photo submission is still a launch blocker, alongside missing images, full Editor integration and retiring the legacy renderer set.

## Unified search wiring — 22 September 2026

Background branch search is now wired end-to-end in code without publishing:

- `masterPage.js` routes existing search-like header/home/directory controls to `/search?q=...`.
- `Search Results.cfe9p.js` and `Search Suggestions.p2cgc.js` now mount the shared Velo discovery UI.
- Search results use the existing Editor input/repeater/status controls through type/semantic matching rather than invented element IDs.
- The catalogue now covers ready Venues, Locations, NearbyAttractions, DestinationRecommendations and active WowcherOffers.
- Wowcher affiliate URLs remain private and use the same signed-in, deliberate second-click resolver as other affiliate offers.
- The transfer-ready legacy seaside finder copy now points to `/search` instead of bypassing Velo through `/map`.
- The live custom embed was deliberately not changed because custom-embed API updates are site-global/immediate and this rebuild is not approved for publication yet.
- The existing map page is deliberately not hijacked by global search wiring; its real Editor controls/page code still need to be synced before its map-specific search can be connected safely.

No publish was performed. The Wix Editor/local-dev branch-sync blocker remains: Classic Editor currently exposes origin/main as read-only, and the previous local-dev attempt was stopped at telemetry approval review.
