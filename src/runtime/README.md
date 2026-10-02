# Maintained runtime

Edit the owning module in this directory. `manifest.json` gives stable unique identities and the proven execution order. The `seaside/` directory contains readable shared JavaScript and CSS needed by remaining native/hybrid pages; generated JSON strings are no longer the authoring format.

The route authority is authored only in `src/public/routes`. Manifest module 1 references its generated browser client. Do not append another URL policy, navigation click rewriter, CDN patch, or second visual page owner.

Build with `python tools/build-runtime.py`. This compiles the authority, assembles `dist/sr.js` and global CSS, splits route-family delivery bundles, and builds the explicit test entry. Production and test entries differ only in the compiled authority transport selector. For an approved frozen identity, pass `--fingerprint=<sha256>`; never infer test mode from visitor query parameters.

Run `NODE_PATH=<jsdom installation> node tools/verify-ui.cjs` and the backend `npm test` / lint commands before proposing a release. The runtime source, policy, CSS, generated assets and loader must use the same approved release. Native route bindings, redirect retirement, fallback and real browser proof remain separate release gates.

Detail-only lifecycle/rich-source helpers are delivered with page/rest bundles, not on the homepage. Homepage and tracking-query homepage load the core plus one stylesheet. No historical addon loader is active in this build. Archived intermediates are outside the maintained candidate.

Current-design artwork is unchanged. Same-entity supplemental records preserve unique public content and identify exact prose already shown above. Editorial-index machine groups keep their original labelled records distinct and do not assert reconciled identity.
