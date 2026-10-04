/** Reviewed native metadata only; route policy remains in the public registries. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';
import { ROUTES } from '../src/public/routes/canonicalRoutes.js';
import { INDEX_ROUTES } from '../src/public/routes/indexRoutes.js';

register('./wix-test-loader.mjs', import.meta.url);
const { RUNTIME_OWNERSHIP } = await import('../src/public/routes/runtimeOwnership.js');

export const DEFAULT_NATIVE_INPUT = new URL('../config/routes/native-bindings.json', import.meta.url);
export const DEFAULT_NATIVE_OUTPUT_ROOT = new URL('../', import.meta.url);
const DYNAMIC_ROLES = ['destination', 'food', 'hotel', 'blogPost', 'legacyArcade', 'legacyMachine', 'legacyMachineIndex', 'legacyMachineList'];
const OUTPUT_PATHS = new Set(['src/backend/routers.js', 'docs/captured-native-handlers.json', 'src/public/routes/nativeStaticPaths.js', 'generated/loader-page-ownership.json']);
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const PREFIX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATIC_PATH = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/;
const SHA256 = /^[a-f0-9]{64}$/i;
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const sortedEntries = value => Object.entries(value).sort(([a], [b]) => compare(a, b));
const fail = message => { throw Error('Invalid native bindings: ' + message); };
function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(label + ' must be an object');
}
function fields(value, required, optional, label) {
  record(value, label);
  for (const key of required) if (!Object.hasOwn(value, key)) fail(label + ' missing ' + key);
  for (const key of Object.keys(value)) if (!required.includes(key) && !optional.includes(key)) fail(label + ' has unsupported field ' + key);
}
function text(value, label) {
  if (typeof value !== 'string' || !value || value.trim() !== value || /[\u0000-\u001f\u007f\u2028\u2029]/u.test(value)) fail(label + ' must be a nonempty single-line string');
}
function id(value, label) { if (typeof value !== 'string' || !ID.test(value)) fail(label + ' has an invalid ID'); }
function unique(seen, value, label) { if (seen.has(value)) fail('duplicate ' + label + ': ' + value); seen.add(value); }
function pageReference(pages, value, label) {
  id(value, label);
  if (!Object.hasOwn(pages, value)) fail(label + ' references absent/stale page ID ' + value);
}

/** Validate the complete portable capture before any generator can write. */
export function validateNativeBindings(input) {
  fields(input, ['schemaVersion', 'capture', 'pages', 'customRouters', 'staticPaths', 'dynamicPages'], [], 'input');
  if (input.schemaVersion !== 1) fail('schemaVersion must be 1');
  const capture = input.capture;
  fields(capture, ['branch', 'revision', 'evidenceSha256'], ['sourceSnapshots', 'capturedPageCount', 'nativeAcceptance', 'note'], 'capture');
  text(capture.branch, 'capture.branch');
  // This release ports Original. A coherent capture of another branch is still
  // stale for this pipeline; changing branches requires a reviewed code change.
  if (capture.branch !== 'Original') fail('capture.branch must be Original; stale/isolated branch captures are not accepted');
  if (typeof capture.revision === 'number') {
    if (!Number.isSafeInteger(capture.revision) || capture.revision < 0) fail('capture.revision must be a nonnegative safe integer or revision string');
  } else text(capture.revision, 'capture.revision');
  if (typeof capture.evidenceSha256 !== 'string' || !SHA256.test(capture.evidenceSha256)) fail('capture.evidenceSha256 must be a SHA-256 digest');
  if (Object.hasOwn(capture, 'nativeAcceptance') && capture.nativeAcceptance !== false) fail('capture.nativeAcceptance must remain false; metadata is not runtime proof');
  if (Object.hasOwn(capture, 'note')) text(capture.note, 'capture.note');
  if (Object.hasOwn(capture, 'sourceSnapshots')) {
    record(capture.sourceSnapshots, 'capture.sourceSnapshots');
    for (const [name, digest] of Object.entries(capture.sourceSnapshots)) {
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(name) || typeof digest !== 'string' || !SHA256.test(digest)) fail('capture.sourceSnapshots must contain only snapshot basenames and SHA-256 digests');
    }
  }
  record(input.pages, 'pages');
  if (!Object.keys(input.pages).length) fail('pages must not be empty');
  if (Object.hasOwn(capture, 'capturedPageCount') && (!Number.isSafeInteger(capture.capturedPageCount) || capture.capturedPageCount < Object.keys(input.pages).length)) fail('capture.capturedPageCount must cover all reviewed pages');
  const pages = Object.fromEntries(sortedEntries(input.pages).map(([key, page]) => {
    id(key, 'pages key');
    fields(page, ['pageId', 'title', 'pageUriSEO'], [], 'pages.' + key);
    if (page.pageId !== key) fail('pages key/pageId mismatch: ' + key);
    text(page.title, 'pages.' + key + '.title');
    // SEO page names are capture metadata, not the authority for a router URL.
    if (typeof page.pageUriSEO !== 'string' || (page.pageUriSEO !== '' && !PREFIX.test(page.pageUriSEO))) fail('invalid pageUriSEO for ' + key);
    return [key, { pageId: key, title: page.title, pageUriSEO: page.pageUriSEO }];
  }));
  if (!Array.isArray(input.customRouters) || !input.customRouters.length) fail('customRouters must be a nonempty array');
  // The first registered detail kind owns a shared prefix (e.g. bowling), as in
  // canonical parsing. Index routes extend that same registry, never replace it.
  const canonicalKinds = new Map();
  for (const [kind, route] of [...Object.entries(ROUTES), ...Object.entries(INDEX_ROUTES)]) {
    if ((route.fields.length || Object.hasOwn(INDEX_ROUTES, kind)) && !canonicalKinds.has(route.prefix)) canonicalKinds.set(route.prefix, kind);
  }
  const legacyPrefixes = new Set([...RUNTIME_OWNERSHIP.legacyPrefixes, ...RUNTIME_OWNERSHIP.legacyIndexPaths]);
  const seen = { routerId: new Set(), prefix: new Set(), pageId: new Set(), handler: new Set(), kind: new Set() };
  const customRouters = input.customRouters.map((router, index) => {
    const label = 'customRouters[' + index + ']';
    fields(router, ['kind', 'routeRole', 'routerId', 'prefix', 'pageId', 'pageName', 'routerFunctionName', 'siteMapFunctionName'], [], label);
    id(router.routerId, label + '.routerId');
    if (typeof router.prefix !== 'string' || !PREFIX.test(router.prefix)) fail(label + ' has invalid prefix');
    pageReference(pages, router.pageId, label);
    if (router.pageName !== pages[router.pageId].title) fail(label + ' pageName/title mismatch for ' + router.pageId);
    const routePath = '/' + router.prefix;
    if (router.routeRole === 'canonical') {
      if (typeof router.kind !== 'string' || !canonicalKinds.has(routePath) || canonicalKinds.get(routePath) !== router.kind) fail(label + ' canonical kind/prefix mismatch: ' + String(router.kind) + '/' + router.prefix);
      unique(seen.kind, router.kind, 'canonical kind');
    } else if (router.routeRole === 'legacy-alias') {
      if (router.kind !== null || !legacyPrefixes.has(routePath) || canonicalKinds.has(routePath)) fail(label + ' legacy kind/prefix mismatch');
    } else fail(label + ' has invalid routeRole');
    const name = router.prefix.replace(/-/g, '_');
    if (router.routerFunctionName !== name + '_Router' || router.siteMapFunctionName !== name + '_SiteMap') fail(label + ' handler/prefix mismatch');
    for (const key of ['routerId', 'prefix', 'pageId']) unique(seen[key], router[key], key);
    for (const key of ['routerFunctionName', 'siteMapFunctionName']) unique(seen.handler, router[key], 'handler');
    return { kind: router.kind, routeRole: router.routeRole, routerId: router.routerId, prefix: router.prefix, pageId: router.pageId, pageName: router.pageName, routerFunctionName: router.routerFunctionName, siteMapFunctionName: router.siteMapFunctionName };
  }).sort((a, b) => compare(a.prefix, b.prefix));
  record(input.staticPaths, 'staticPaths');
  const paths = new Map();
  for (const [routePath, pageId] of sortedEntries(input.staticPaths)) {
    if (!STATIC_PATH.test(routePath)) fail('invalid static path: ' + routePath);
    if (legacyPrefixes.has(routePath)) fail('legacy alias must not be a navigation destination: ' + routePath);
    pageReference(pages, pageId, 'staticPaths.' + routePath);
    paths.set(routePath, pageId);
  }
  for (const router of customRouters) {
    if (router.routeRole !== 'canonical') continue;
    const routePath = '/' + router.prefix;
    if (paths.has(routePath) && paths.get(routePath) !== router.pageId) fail('static/custom page ID conflict for ' + routePath);
    paths.set(routePath, router.pageId);
  }
  // Never silently drop a required fallback page because a capture is incomplete.
  for (const routePath of RUNTIME_OWNERSHIP.staticPaths) if (!paths.has(routePath)) fail('missing runtime static path: ' + routePath);
  fields(input.dynamicPages, DYNAMIC_ROLES, [], 'dynamicPages');
  const dynamicIds = new Set();
  const dynamicPages = Object.fromEntries(DYNAMIC_ROLES.map(role => {
    const pageId = input.dynamicPages[role];
    pageReference(pages, pageId, 'dynamicPages.' + role);
    unique(dynamicIds, pageId, 'dynamic page ID');
    if (seen.pageId.has(pageId)) fail('dynamic/custom page ID conflict for ' + role);
    return [role, pageId];
  }));
  return {
    schemaVersion: 1,
    capture: { branch: capture.branch, revision: capture.revision, evidenceSha256: capture.evidenceSha256.toLowerCase() },
    pages,
    customRouters,
    staticPaths: Object.fromEntries([...paths].sort(([a], [b]) => compare(a, b))),
    dynamicPages
  };
}

export function readNativeBindings(input = DEFAULT_NATIVE_INPUT) {
  return validateNativeBindings(JSON.parse(fs.readFileSync(input, 'utf8')));
}
export function nativeCaptureLabel(capture) {
  return 'branch ' + capture.branch + ' revision ' + capture.revision + ', evidence SHA-256 ' + capture.evidenceSha256;
}
export function projectLoaderPageOwnership(reviewed) {
  const bindings = validateNativeBindings(reviewed), paths = bindings.staticPaths;
  return {
    schemaVersion: 1,
    basis: nativeCaptureLabel(bindings.capture) + '; same runtime ownership registry; native runtime acceptance pending',
    pageIds: [...new Set([...RUNTIME_OWNERSHIP.staticPaths.map(routePath => paths[routePath]), ...Object.values(bindings.dynamicPages)])].sort(compare),
    homePageId: paths['/'], searchPageId: paths['/search'],
    excludedSearchView: RUNTIME_OWNERSHIP.excludedSearchView,
    homeExcludedKeys: ['raidertube', 'sr', 'report', 'explore', 'view', 'place'],
    allowedHomeExplore: [...RUNTIME_OWNERSHIP.categoryKeys], allowedHomeViews: [...RUNTIME_OWNERSHIP.viewKeys],
    legacyRecordCollections: [...RUNTIME_OWNERSHIP.legacyCollections]
  };
}
export function legacyDynamicHookPrefixes() {
  // Existing Velo hook exports. Verify them against the registry; do not infer
  // routes from pageUriSEO, whose value may be an editor-only blank-page slug.
  const prefixes = ['/arcade-venues', ...RUNTIME_OWNERSHIP.legacyIndexPaths];
  for (const prefix of prefixes) if (![...RUNTIME_OWNERSHIP.legacyPrefixes, ...RUNTIME_OWNERSHIP.legacyIndexPaths].includes(prefix)) fail('unregistered legacy dynamic hook: ' + prefix);
  return prefixes;
}

/** Defaults are checkout-relative; explicit CLI paths follow the caller's cwd. */
export function nativeGeneratorOptions(argv = process.argv.slice(2)) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i];
    if (argument === '--input' || argument === '--output-root') {
      const key = argument === '--input' ? 'input' : 'outputRoot';
      if (Object.hasOwn(options, key) || !argv[i + 1] || argv[i + 1].startsWith('--')) throw Error('Missing or repeated ' + argument);
      options[key] = path.resolve(argv[++i]);
    } else if (!argument.startsWith('-') && !Object.hasOwn(options, 'input')) options.input = path.resolve(argument);
    else throw Error('Unknown native generator argument: ' + argument);
  }
  return options;
}
export function isNativeGeneratorMain(moduleUrl) {
  return Boolean(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(moduleUrl));
}
export function writeNativeOutputs(files, { outputRoot = DEFAULT_NATIVE_OUTPUT_ROOT } = {}) {
  const root = outputRoot instanceof URL ? fileURLToPath(outputRoot) : path.resolve(outputRoot);
  // Check every destination before writing anything. Restrict this helper to the
  // existing generated outputs and reject symlink/non-regular replacements.
  for (const [name, source] of files) {
    if (!OUTPUT_PATHS.has(name) || typeof source !== 'string') throw Error('Unexpected native output: ' + name);
    const directories = [root];
    for (const segment of name.split('/').slice(0, -1)) directories.push(path.join(directories.at(-1), segment));
    for (const directory of directories) {
      const stat = fs.lstatSync(directory, { throwIfNoEntry: false });
      if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) throw Error('Refusing non-directory or symlink native output: ' + directory);
    }
    const target = path.join(root, name), stat = fs.lstatSync(target, { throwIfNoEntry: false });
    if (stat && !stat.isFile()) throw Error('Refusing non-regular native output: ' + target);
  }
  for (const [name, source] of files) {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source);
  }
}
