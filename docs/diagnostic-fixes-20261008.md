# Website diagnostic fixes — 8 October 2026

This change recovers the prepared fixes after the temporary workspace was cleared. It is a testable candidate, not evidence of a published or accepted production build.

## Changes

- FoodAndDrink participates in backend search, including records without an existing search index. Coffee/café and burger queries keep their intent.
- Near-me search requests location once, retains the requested activity when adding nearby records, and keeps town search available when location is refused.
- Identical provider offers are deduplicated by deal identity; distinct offers at the same price remain.
- Video Vault uses the recovered cinematic shelf design, loads the entire catalogue, searches beyond the first page, and offers retry after load failures. Background loading preserves the current player.
- Machine detail pages use the shared venue page shell and styles. The assigned full card appears at full content width. Listing cards and logos are excluded from detail artwork and source-photo supplements. Full history and gameplay text remain visible.
- Fixed the malformed fishing-category declaration, filter scope error, unnecessary search delay, and late map-library recovery.

## URL preservation

Compared the complete route manifest with `dd074d262f77d1b790e2e3bfcc695c8beb4f0282`: every value is identical except `identity`. Native bindings, backend routers and canonical URL policy are byte-identical. Transition mode and existing index alias policy are retained.

The earlier Filey redirect is already live: `/agc/true-amusements/filey` to `/agc/superslots-true-amusements/filey`. No page slug was changed by that repair.

## Verification

- All 17 maintained UI suites pass on one immutable source and bundle snapshot, including 44 canonical detail checks.
- Unit/backend suite and eight new diagnostic regression checks pass.
- Syntax, lint, lint policy and structural release checks pass.
- Candidate fingerprint: `ef9c4ec4ec9aea2a659adf1a31d3e4ac89e257fe0e86ca8142114174bfccf93f`.

Native Wix test-site acceptance, exact frontend/backend pairing, desktop/mobile review and production promotion remain separate gates. The disabled historical CI publish workflow must not be run: it is documented as publishing a stale Wix revision.

## Still unresolved

The approved newer card artwork on Expansion F: has not been provided and is not accessible in this environment. Existing assigned full-card artwork is preserved; no substitute artwork was selected. Missing venue coordinates still limit proximity coverage. Third-party video playback, transactions, authentication and all external links have not been exhaustively verified. No search traffic or advertising approval outcome is promised.

## Native browser follow-up

The first Wix Test Site check exposed the shared frame re-inserting an inline-important header and footer over pages that already own their shell. The shared frame now yields to machine and Vault owners and releases its global class. The cinematic Vault selectors also outrank the retained legacy stylesheet. Search area maps now start with the UK and use a named town only after matching the town catalogue or returned venue records.

The release also retains eight published additions in the maintained runtime: expanded food/activity search with its offer strip, town guide prose, category guides, extra venue prose, related-place sections, the complete arcade directory, the approved rotating homepage arcade selection, and search phrase/spelling assistance. Town prose comes from the canonical record's explicitly public fields. Old URL-rewriting fallback scripts remain retired in favour of the existing shared route authority.

All route-manifest content outside identity is unchanged. The follow-up passed 234 unit/backend tests, 17 maintained UI suites including 44 canonical detail checks, lint, syntax and lint-policy checks. Release-loader identity and compiled-loader coverage are recorded separately. Current candidate fingerprint: `c6569fe524fcd74f5c3b0d317d457b5978a240d99e98091fa6e8bdcb0fc26443`.

YouTube thumbnail retrieval in this test environment returned HTTP 200 with an HTML “Site Unavailable” response instead of an image. The actual browser consequently showed missing thumbnails. This is a verification limitation, not evidence that the site is fully working or proof of a production CDN outage. Native acceptance and public promotion remain outstanding.
