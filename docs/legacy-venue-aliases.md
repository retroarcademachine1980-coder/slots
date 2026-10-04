# Legacy venue inputs retained through one-way canonical aliases

This is a local testable migration candidate. Native hook invocation and raw encoded-path handling still require acceptance in the exact final Wix test build. No production acceptance is implied.

## Finite source evidence

The production6300 native Venues router uses `/{title}`, lowercase true. Its captured sitemap SHA256 is `c5599fc45dc6053fa70d27d6ccc014977efb9576eefa5cb119e065add8cb4698`.

Every one of its 2,107 emitted paths intersects the captured source IDs under the documented literal lowercase/space-to-dash rule, after a single URI decode of the already emitted path. No general slugifier, new title-derived URL, title search, or first-row lookup is used at runtime. There are 2,105 unique-source paths and two duplicate-title paths. Forty URL-to-record associations have direct native response proof, including 36 fresh response projections; the other associations rely on the reviewed finite pattern evidence, not an exhaustive page crawl.

The retired runtime also emitted exact CMS slug tokens. Its 2,109 source rows contribute 1,697 additional paths. Of 412 overlapping inputs, 410 have unique source identity and two retain the existing duplicate-title collision sets. All overlapping runtime keys occur in the corresponding native candidate set.

Final finite union: 3,806 source bindings, 3,804 incoming paths, 2,109 source records. The active versioned mapping lives only in config/routes/manifest.json. Test input/record projections contain public routing fields only.

## Collision and availability behavior

- Coastfields Holiday Village has two source rows in the existing approved, proven-same-entity, content-preserved group. Both may redirect to its single canonical group owner.
- Golden Sands Amusements refers to distinct Hunstanton and Seaton Carew entities. It fails with ambiguous_legacy_source/503 before availability-based selection, regardless of row order, a missing row, or one town being non-public.
- The original record resolver is unchanged: 1,588 source records pass and 521 remain record_not_public. No source record is deleted or made public by these aliases.
- Per path, native inputs have 1,586 ready, 520 non-public and one collision; runtime-slug inputs have 1,588 ready, 520 non-public and one collision. The combined union has 2,823 ready, 980 non-public and one collision.
- Canonical destinations always come from the shared record/source-group authority. Old shortUrl fields cannot become redirect targets. No legacy path enters emitted canonical inventories, cards or sitemap output.
- A pure redirect manifest tombstones any input with a blocked candidate, so later candidate ordering cannot resurrect a partial redirect. Other independent valid inputs remain usable.

## Exact encoded-slash exceptions

Eight actual sitemap inputs contain `%2F` inside a title. Their literal allowlist is in legacyRedirects.js. Four pass record readiness and four remain non-public.

Generic parsing still rejects arbitrary encoded slash, backslash, encoded percent, traversal, unsafe origin, credentials, query and fragment variants. Native handling additionally requires the documented full same-origin request.url to match the exact allowlist and exactly one request.path token matching the raw or once-decoded suffix. Missing URL, mismatched URL/token and split path segments fail closed. This deliberately does not infer alternate native request representations.

The exact native test must exercise all eight via the test selection/session without appended query or fragment. If Wix presents another representation, capture it and review a bounded adjustment; do not loosen generic parsing or claim live proof from local mocks.

## Maintained regression coverage

`tests/legacy-venue-aliases.test.mjs` covers all finite input membership and normalization, all source readiness outcomes, actual backend API and exported native hook, title/runtime pairs, group/link parity, Golden Sands availability permutations, encoded variants and malicious near misses, source outage/metadata drift, and pure-helper ordering. Wix I/O is mocked, production routing modules are loaded unchanged.

Primary platform documentation:
- https://dev.wix.com/docs/velo/events-service-plugins/routers/service-plugins/wix-router/router
- https://dev.wix.com/docs/velo/events-service-plugins/routers/service-plugins/wix-router/wix-router-request/pages
