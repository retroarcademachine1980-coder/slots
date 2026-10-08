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
