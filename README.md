# Spin Raiders unified canonical routing

This is a testable migration candidate. Local checks are separate from acceptance of the exact compiled Wix UI/backend build. Production promotion requires the recorded native, HTTP, SEO, browser and recovery gates; do not infer readiness from repository sync or a visible commit label.

## Maintained authorities

- `config/routes/manifest.json` is the single reviewed inventory of original record identities, canonical paths, incoming aliases, source groups, record policies, landing content and endpoint evidence. `tools/build-route-manifest.mjs` compiles it losslessly into deterministic supported Velo modules below a conservative 100,000-byte engineering budget. The obsolete intermediate-manifest assembler has been retired.
- `src/public/routes/canonicalRoutes.js` defines canonical URL policy shared by backend models, native resolution, SEO and browser validation. CMS `shortUrl`, affiliate URLs, query IDs, archive prefixes and guessed title slugs cannot override it.
- `config/routes/native-bindings.json` is the minimal reviewed Original native metadata input. Its generators validate captured IDs, page names, registered prefixes and handlers before producing native navigation, handler summaries and loader fallback ownership. They do not infer native runtime acceptance or read an old isolated-branch snapshot.
- `src/runtime/manifest.json` orders the final maintained runtime modules. The deterministic runtime builder integrates the route client once and emits delivery chunks plus a distinct test entry. Retired skins and competing renderers are not loaded underneath it.

Original CMS records remain the content authority. Approved same-entity groups and the explicitly reviewed editorial index preserve source prose, photos, attribution and conflicting facts. `publicDetailProjection` default-denies internal and unknown nested fields. Source readiness/status restrictions remain effective.

## Routing behavior

Search, directory cards, map pins, discovery, homepage models, rich-text links, native pages and sitemaps share the same record authority. The native resolver retrieves the exact collection and ID, verifies current metadata/readiness and rejects ambiguous identities. Offers join exactly one eligible hotel guide before producing a business route; merchant URLs remain explicit offer actions.

The browser client rejects inconsistent responses, coalesces requests, bounds caching, rejects stale completions and verifies the expected immutable backend fingerprint. It does not trust CMS routing properties or use a link-rewriting observer.

Path aliases resolve forward to canonical targets through server301s. Query-ID aliases use client replacement and are not described as HTTP301s. See `docs/legacy-venue-aliases.md` for the finite native-title/runtime-slug inventory, collision policy, strict eight-path encoded-slash exceptions and acceptance limits. Legacy inputs never enter emitted canonical inventories.

Food uses `/food-and-drink/{name}/{town}`. Its original town/name data-binding pattern remains a legacy input; the source-aware before/query/after hooks require native acceptance. Machine pages use `/classic-fruit-machines/{manufacturer}/{machine}`.

## Build and checks

Use the repository's pinned toolchain and supported Node test loader. Do not fabricate `velo.dependencies.json`; see `docs/LINT-AND-PACKAGE.md`.

- `npm test` runs pure policy and actual-module/mock-Wix integration tests
- `npm run check` runs the checked-in project checks
- `node tools/verify-ui.cjs` runs the maintained UI suites against one immutable source/bundle snapshot
- `node tools/generate-native-handlers.mjs`, `node tools/generate-native-navigation.mjs` and `node tools/build-loader-page-ownership.mjs` consume the reviewed native binding input
- `node tools/build-route-manifest.mjs` compiles the reviewed route manifest
- `node tools/compute-release-identity.mjs config/routes/manifest.json` computes the review identity; the manifest and generated assets must be pinned to that exact identity before release
- `python tools/build-runtime.py --fingerprint=<reviewed-sha256>` emits production and test bundles

Node build commands importing Velo aliases use `NODE_OPTIONS='--import ./tools/register-wix-test-loader.mjs'`. Runtime source uses supported `public/...` and `backend/...` aliases.

`--release-manager-test` selects a separately compiled client using the test backend transport. Visitor query strings cannot switch the production client into test mode. The temporary release loader has separate test and production-acceptance gates; its configuration must pin the actual candidate native/backend identity and immutable asset commit.

## Native release gates

The Original draft contains registered native templates and handler configurations. Registration, local fixtures and Git sync do not establish successful native execution. Before traffic or publication changes, verify on the exact compiled candidate:

1. Every final root/detail route and source-aware data-binding hook, with native reload, Back/Forward and desktop/mobile flows
2. Original content preservation, Terms contrast, failure states, maps, search and category loading
3. Exact backend fingerprint, immutable CDN assets, native build identity, canonical SEO and sitemap behavior
4. Legacy one-hop redirects, collisions, intentionally non-public records and raw punctuation/encoded-path representations
5. A checked recovery path and coordinated global redirect ordering

`indexAliasesActive:false` with `deploymentPhase:'transition'` preserves old index rendering while the 17 exact backward host rules remain. Do not activate forward index redirects into those rules. Final cleanup requires removing the reverse rules and proving direct root HTTP200 responses, clean canonicals and no loops. Client rendering alone is not host acceptance.

The scoped release preserves unrelated scheduled cinema updates. Do not run historical generic publishing commands, upload raw CMS/audit captures, or treat local test success as permission to publish.
