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

The 8 October capture preserves production6329 and loader revision104, including every approved supplemental script and the homepage arcade strip. The current Wix Original Test Site has an explicit null branch ID; its exact revision, native build hash and backend identity remain required. The inline guard is losslessly packed to fit the embed limit, verified byte-for-byte at compilation and inserted as an ordinary inline script without eval or another network dependency.

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
