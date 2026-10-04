# Repository lint and package reconciliation

## Supported platform contract

Wix's Git repository documentation says that `velo.dependencies.json` is created after the first site npm package is installed and must not be edited manually. It also documents public/backend aliases and `.web.js` modules:
https://dev.wix.com/docs/develop-websites-sdk/code-your-site/developer-environments/ides/git-integration/git-repository-file-structure

Velo built-in modules are imported directly. Examples and module naming are documented at:
https://dev.wix.com/docs/develop-websites/articles/databases/wix-data/data-api/working-with-the-data-api
https://dev.wix.com/docs/velo/articles/api-overview/api-versions
https://dev.wix.com/docs/velo/apis/wix-web-module/web-method

No site dependency file was fabricated, and no platform module was installed as an npm site dependency.

## Plugin findings

The official npm package `@wix/eslint-plugin-cli` was inspected at 1.0.0 and 1.0.2 (the version inspected for this candidate). Version 1.0.2 correctly allows frontend imports of `.web.js` methods and rejects ordinary private backend imports. Its dependency rule still treats every bare `wix-*` module as an external npm package: its built-in classification contains only the `backend` and `public` aliases. Thus it incorrectly asks to install existing Velo runtime modules when no generated site npm manifest exists.

The replacement rule in `tools/eslint-plugin-spin-raiders/index.cjs` delegates to that official dependency rule for every import except an exact list of eight platform modules already used by this site. It does not exempt arbitrary `wix-*` names or subpaths. All other official guards remain enabled on every backend, public and page source file. A separate rule rejects unsupported relative site imports. These source files also receive no-undef and no-unused-vars checks.

Node tools and tests are governed by root development dependencies, not by the site's generated npm manifest. Browser bundles/runtime files and all Node tooling still receive full JavaScript parsing. Browser behavior is covered by the UI and split-bundle suites.

## Release package

The repository package preserves `postinstall: wix sync-types`, `dev: wix dev`, `wix: wix`, the Wix CLI dependency and React version. It pins the tested ESLint/plugin/jsdom versions and adds the local lint plugin as a file-based development dependency. Test/UI/lint-policy/release commands are added without replacing the Wix project with an isolated harness.

The checked-in `.eslintrc.cjs` is the active configuration. The superseded JSON configuration was retired in the same reviewed migration.

## Verification performed

- Full current project lint passed using official plugin 1.0.2 and ESLint 8.57.1, including every src/backend, src/public and src/pages file
- Exact eight documented runtime imports passed policy tests
- Unknown packages, invented Wix modules and unapproved module subpaths still failed
- Frontend `.web` imports passed; private backend imports and repository-relative site imports still failed
- No site dependency file existed or was created during those tests

Development toolchain was installed in an isolated temporary directory with install scripts disabled. This checks lint/package policy; it is not a claim that authenticated Wix sync-types or native site compilation has run. After merging the release package, repeat the actual package commands in the release checkout and run the exact native candidate tests.
