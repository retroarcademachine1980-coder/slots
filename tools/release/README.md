# Guarded Wix release tooling

This is temporary release tooling. The main runtime is maintained under `src/runtime`; route policy comes from the shared route contract. Remove the preserved-runtime branch after the coordinated release is accepted. It must not become the final site architecture.

## Build and test

```sh
npm ci --ignore-scripts --prefix tools/release
node --test tools/release/*.test.mjs
node tools/release/compile-loader.mjs --asset-only dist/sr.release-loader.min.js
```

After the actual candidate backend/native build, test tuple, fingerprints and uploaded asset commit are captured, compile a local release config:

```sh
node tools/release/compile-loader.mjs /path/to/verified-config.json /path/to/inline.html /path/to/candidate-loader.js
```

The compiler rejects inline HTML over Wix's 15,000-character limit. It checks the preserved loader capture's SHA256. Test and production authorization are distinct; test approval activates only the exact candidate test tuple. All native/backend/API identities must match. Promotion requires a separate acceptance record, then the same tested build is promoted.

The 4 November 09:12 capture preserves actual MAIN135 and its reviewed photo-proportion asset2dd8056. Its sole structural transformation replaces the exact preview-pair guard URL with the same preserved ef337 production core URL; the inverse reproduces current MAIN135 after established LF normalization. Compared with the prior MAIN134 fixture, ONLY that reviewed image-quality URL changes. Separate Context89 (reader appendix and continuation-row repairs, asset a5b3b1c3e79e4747a4cd55ad1d9c8f265a5a18d6)/Photo26/Fuel15/Home27/Visual71/AdSense2 and all other embeds MUST stay intact. The full34 hash capture is pub6890-live-preservation-backup.json; current lock is current-live-embed-integrity-20261104-context89-main135.json. These preservation updates do NOT grant test or production acceptance. The current Wix Original Test Site still requires its exact native build and backend identity. The inline guard remains losslessly packed, verified byte-for-byte and inserted as an ordinary inline script without eval.

Approval artifact paths/content stay in the local release record. The public embed contains only immutable approval booleans plus public build identifiers/hashes. The source config is still validated before compilation. Synthetic fixture configs in `fixtures` are for local tests only and must never be deployed.

`dist/sr.release-loader.min.js` is independent of the final inline config. Upload it with the same immutable commit as both runtime entries, their shared sibling chunks, and stylesheet. It receives the already-verified runtime selection and config from the inline guard. The inline guard contains enough verified identity logic and the original resource plan to preserve the current production build even if the candidate-loader asset fails.

## Runtime contract

- One accessible current-brand loading/failure node outside SITE_CONTAINER, with Retry/Home/Search
- Native hold only for confirmed owned views; native/member/legal pages are not globally hidden
- Same generated route ownership in the candidate loader; compact native page-ID projection for emergency pre-asset fallback
- Explicit `sr:navigation`, `sr:page-ready` and `sr:page-failed` events, scoped by captured pathname+search
- Async owners validate their original navigation and live host before reporting readiness
- Missing CSS/core/chunks or mismatched backend must show meaningful recovery, never old incompatible core
- Initial native-page identity observation is not a render-readiness heuristic and stops on candidate takeover

## Verification boundaries

Local tests cover exact preserved identity, test-only versus promotion gates, transport failure, lifecycle races, same-node emergency errors, query precedence, native-page replacement, compiled baseline resource replay and compiled candidate handoff. They do not prove Wix/CDN/CSP behavior, actual router hooks, mobile appearance, auth, HTTP redirects/sitemaps, or same-build promotion/recovery. Those are mandatory external acceptance gates before public promotion.

Do not include raw viewer HTML, session data, screenshots, local notes, node_modules or generated fixture outputs in the release tree. Fixtures here contain only public build/route identifiers, the existing public loader and deliberately synthetic candidate data.

## 4 November 12:59 preservation update and source hold

Preserve current Home28 and Context90, including Jamie's November Masala n Malt/Pizza Parlour/Retro Slots monthly selections. Their foundation and food-introduction assets are pinned at 2adb3c93bb06366b399801b33bb5c2fa0f94e3b7. Reader asset a5b3b1c3e79e4747a4cd55ad1d9c8f265a5a18d6, MAIN135, Photo26, Fuel15, Visual71, AdSense2 and all other embeds remain. Current full lock is work/current-live-embed-integrity-20261104-context90-home28-main135.json in the restoration workspace; the earlier Context89/Home27 paragraph is historical.

DO NOT deploy/promote the prepared3dc9 candidate yet. Its ageNotice helper incorrectly labels all bingo kinds18+, including the verified family Pat's10p Prize Bingo record. Correct that classifier and its tests, recompute a new exact immutable Git-source identity, then perform the paired Wix native/runtime acceptance. Do not change the family record to satisfy the classifier. See the restoration workspace's HOLD-NEARBY-AGE-CANDIDATE-20261104.md and OWNER-NOVEMBER-MONTHLY-FEATURES-LIVE-20261104.md. No live native/core change has been made by the monthly-content update.
