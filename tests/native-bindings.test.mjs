import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readNativeBindings, validateNativeBindings, writeNativeOutputs } from '../tools/native-bindings.mjs';
import { generateNativeHandlers, buildNativeHandlers } from '../tools/generate-native-handlers.mjs';
import { generateNativeNavigation, buildNativeNavigation } from '../tools/generate-native-navigation.mjs';
import { generateLoaderPageOwnership, buildLoaderPageOwnership } from '../tools/build-loader-page-ownership.mjs';

const { RUNTIME_OWNERSHIP } = await import('../src/public/routes/runtimeOwnership.js');
const root = fileURLToPath(new URL('../', import.meta.url));
const generators = [generateNativeHandlers, generateNativeNavigation, generateLoaderPageOwnership];
const builders = [buildNativeHandlers, buildNativeNavigation, buildLoaderPageOwnership];
const outputNames = ['src/backend/routers.js', 'docs/captured-native-handlers.json', 'src/public/routes/nativeStaticPaths.js', 'generated/loader-page-ownership.json'];
const toolNames = ['native-bindings.mjs', 'generate-native-handlers.mjs', 'generate-native-navigation.mjs', 'build-loader-page-ownership.mjs', 'wix-test-loader.mjs'];
const cliNames = ['generate-native-handlers.mjs', 'generate-native-navigation.mjs', 'build-loader-page-ownership.mjs'];
const clone = value => JSON.parse(JSON.stringify(value));
const reverseEntries = object => Object.fromEntries(Object.entries(object).reverse());

function fixture() {
  const input = {
    schemaVersion: 1,
    capture: { branch: 'Original', revision: 'synthetic-reviewed-capture', evidenceSha256: 'a'.repeat(64), nativeAcceptance: false },
    pages: {}, customRouters: [], staticPaths: {}, dynamicPages: {}
  };
  const addPage = (pageId, title, pageUriSEO) => { input.pages[pageId] = { pageId, title, pageUriSEO }; };
  for (const [kind, prefix, routeRole] of [['arcade', 'arcade', 'canonical'], ['staysIndex', 'places-to-stay', 'canonical'], [null, 'hotels', 'legacy-alias'], [null, 'nearby-attractions', 'legacy-alias']]) {
    const pageId = 'native-' + prefix, pageName = prefix + '-page', name = prefix.replace(/-/g, '_');
    addPage(pageId, pageName, 'editor-' + prefix);
    input.customRouters.push({ kind, routeRole, routerId: 'router-' + prefix, prefix, pageId, pageName, routerFunctionName: name + '_Router', siteMapFunctionName: name + '_SiteMap' });
  }
  let index = 0;
  for (const routePath of [...RUNTIME_OWNERSHIP.staticPaths, '/terms']) {
    if (input.customRouters.some(router => router.routeRole === 'canonical' && '/' + router.prefix === routePath)) continue;
    const pageId = 'static-' + index++;
    addPage(pageId, 'Static ' + routePath, routePath === '/' ? 'home' : routePath.slice(1));
    input.staticPaths[routePath] = pageId;
  }
  for (const role of ['destination', 'food', 'hotel', 'blogPost', 'legacyArcade', 'legacyMachine', 'legacyMachineIndex', 'legacyMachineList']) {
    const pageId = 'dynamic-' + role;
    addPage(pageId, 'Dynamic ' + role, 'editor-dynamic-' + role.toLowerCase());
    input.dynamicPages[role] = pageId;
  }
  return input;
}
function temporary(t) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'native-bindings-'));
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  return folder;
}
function put(folder, name, value) {
  const file = path.join(folder, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
  return file;
}
function outputs(folder) {
  return Object.fromEntries(outputNames.map(name => [name, fs.readFileSync(path.join(folder, name), 'utf8')]));
}
function rejectsEvery(input, pattern) {
  for (const generate of generators) assert.throws(() => generate(input), pattern, generate.name);
}
function portableCheckout(folder, input) {
  put(folder, 'package.json', '{"type":"module"}\n');
  for (const name of toolNames) put(folder, 'tools/' + name, fs.readFileSync(path.join(root, 'tools', name)));
  for (const name of ['canonicalRoutes.js', 'indexRoutes.js', 'runtimeOwnership.js', 'legacyRedirects.js', 'nativeBlogPaths.js']) {
    put(folder, 'src/public/routes/' + name, fs.readFileSync(path.join(root, 'src/public/routes', name)));
  }
  put(folder, 'config/routes/native-bindings.json', JSON.stringify(input));
}
function runCli(checkout, name, cwd, args = []) {
  const result = spawnSync(process.execPath, [path.join(checkout, 'tools', name), ...args], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, name + ': ' + result.stderr);
  return result;
}

test('synthetic portable capture generates exact handlers, navigation and registry-scoped fallback IDs', () => {
  const input = fixture(), before = clone(input);
  const handlers = generateNativeHandlers(input), navigation = generateNativeNavigation(input), ownership = generateLoaderPageOwnership(input);
  assert.deepEqual(input, before, 'generation does not mutate reviewed input');
  assert.equal(handlers.summaries.length, 4);
  assert.match(handlers.source, /function arcade_Router\(request\) \{ return canonicalRouter\('arcade', request\); \}/);
  assert.match(handlers.source, /function places_to_stay_Router\(request\) \{ return canonicalRouter\('staysIndex', request\); \}/);
  assert.match(handlers.source, /function hotels_Router\(request\) \{ return legacyPathRouter\('\/hotels', request\); \}/);
  assert.match(handlers.source, /function hotels_SiteMap\(\) \{ return \[\]; \}/);
  for (const hook of ['food_and_drink_beforeRouter', 'food_and_drink_customizeQuery', 'food_and_drink_afterRouter', 'arcade_venues_beforeRouter', 'classic_fruit_machine_archive_beforeRouter', 'classic_fruit_machine_archive_1_beforeRouter']) assert.ok(handlers.source.includes('function ' + hook + '('), hook);
  assert.equal(navigation.paths['/arcade'], 'native-arcade');
  assert.equal(navigation.paths['/places-to-stay'], 'native-places-to-stay');
  assert.equal(navigation.paths['/hotels'], undefined);
  assert.equal(ownership.homePageId, input.staticPaths['/']);
  assert.equal(ownership.searchPageId, input.staticPaths['/search']);
  assert.equal(ownership.pageIds.includes(input.staticPaths['/terms']), false, 'non-owned navigation pages stay out of loader fallback');
  assert.equal(ownership.pageIds.includes('native-hotels'), false, 'legacy router shells are not additional loader-owned IDs');
  for (const id of Object.values(input.dynamicPages)) assert.ok(ownership.pageIds.includes(id));
  for (const id of [...Object.values(navigation.paths), ...ownership.pageIds, ...handlers.summaries.map(router => router.pageId)]) assert.ok(input.pages[id], id);
  assert.deepEqual(ownership.allowedHomeExplore, RUNTIME_OWNERSHIP.categoryKeys);
  assert.deepEqual(ownership.allowedHomeViews, RUNTIME_OWNERSHIP.viewKeys);
  assert.deepEqual(ownership.legacyRecordCollections, RUNTIME_OWNERSHIP.legacyCollections);
  assert.equal(ownership.excludedSearchView, RUNTIME_OWNERSHIP.excludedSearchView);
  assert.ok(handlers.summaries.every(router => router.status === 'captured-shell-only'));
  assert.match(ownership.basis, /native runtime acceptance pending/);
  assert.doesNotMatch(JSON.stringify([handlers, navigation, ownership]), /isolated|psc8e|native["']?\s*:\s*true/);
});

test('generation is deterministic across input ordering and repeated temporary writes', t => {
  const input = fixture(), reordered = reverseEntries(clone(input));
  reordered.pages = reverseEntries(reordered.pages);
  reordered.staticPaths = reverseEntries(reordered.staticPaths);
  reordered.dynamicPages = reverseEntries(reordered.dynamicPages);
  reordered.customRouters.reverse();
  reordered.customRouters = reordered.customRouters.map(reverseEntries);
  for (const generate of generators) assert.deepEqual(generate(input), generate(reordered), generate.name);
  const folder = temporary(t), inputPath = put(folder, 'reviewed.json', JSON.stringify(input)), outputRoot = path.join(folder, 'out');
  for (const build of builders) build({ input: inputPath, outputRoot });
  const first = outputs(outputRoot);
  fs.writeFileSync(inputPath, JSON.stringify(reordered));
  for (const build of builders) build({ input: inputPath, outputRoot });
  assert.deepEqual(outputs(outputRoot), first);
  for (const content of Object.values(first)) assert.ok(content.endsWith('\n'));
});

test('missing or stale IDs in custom, static and dynamic bindings fail every generator', () => {
  for (const mutate of [
    input => { input.customRouters[0].pageId = 'stale-isolated-page'; },
    input => { input.staticPaths['/search'] = 'stale-isolated-page'; },
    input => { input.dynamicPages.hotel = 'psc8e'; },
    input => { delete input.pages[input.dynamicPages.hotel]; }
  ]) {
    const input = fixture(); mutate(input);
    rejectsEvery(input, /absent\/stale page ID/);
  }
  const input = fixture(); input.pages[input.dynamicPages.hotel].pageId = 'other-id';
  rejectsEvery(input, /key\/pageId mismatch/);
});

test('coherent isolated capture is rejected and capture provenance cannot claim acceptance', () => {
  for (const branch of ['f37020b8', 'isolated-f37020b8', 'original', '']) {
    const input = fixture(); input.capture.branch = branch;
    rejectsEvery(input, /capture.branch/);
  }
  for (const [field, value, pattern] of [
    ['revision', '', /capture.revision/], ['revision', -1, /capture.revision/],
    ['evidenceSha256', 'not-a-hash', /SHA-256/], ['nativeAcceptance', true, /nativeAcceptance must remain false/]
  ]) {
    const input = fixture(); input.capture[field] = value;
    rejectsEvery(input, pattern);
  }
  const input = fixture(); input.capture.revision = 0;
  assert.equal(validateNativeBindings(input).capture.revision, 0);
});

test('mismatched page names, prefixes, kinds, roles and handler spellings are rejected', () => {
  const cases = [
    ['pageName', 'wrong-page', /pageName\/title mismatch/],
    ['prefix', '/arcade', /invalid prefix/],
    ['prefix', 'cinemas', /kind\/prefix mismatch/],
    ['kind', 'unregisteredKind', /kind\/prefix mismatch/],
    ['kind', 'bowlingOperator', /kind\/prefix mismatch/],
    ['routeRole', 'custom', /invalid routeRole/],
    ['routerFunctionName', 'cinemas_Router', /handler\/prefix mismatch/],
    ['siteMapFunctionName', 'arcade_Sitemap', /handler\/prefix mismatch/],
    ['routerFunctionName', 'arcade_Router(){}', /handler\/prefix mismatch/]
  ];
  for (const [key, value, pattern] of cases) {
    const input = fixture(); input.customRouters[0][key] = value;
    rejectsEvery(input, pattern);
  }
  const invalidAlias = fixture(); invalidAlias.customRouters[2].kind = 'hotel';
  rejectsEvery(invalidAlias, /legacy kind\/prefix mismatch/);
  const unknownAlias = fixture(); unknownAlias.customRouters[2].prefix = 'unregistered-legacy';
  rejectsEvery(unknownAlias, /legacy kind\/prefix mismatch/);
});

test('duplicate native identities and conflicting static bindings are rejected', () => {
  const duplicateRouter = fixture(); duplicateRouter.customRouters[1].routerId = duplicateRouter.customRouters[0].routerId;
  rejectsEvery(duplicateRouter, /duplicate routerId/);
  const duplicatePage = fixture(); duplicatePage.customRouters[1].pageId = duplicatePage.customRouters[0].pageId; duplicatePage.customRouters[1].pageName = duplicatePage.customRouters[0].pageName;
  rejectsEvery(duplicatePage, /duplicate pageId/);
  const duplicatePrefix = fixture(); duplicatePrefix.customRouters.push(clone(duplicatePrefix.customRouters[2]));
  rejectsEvery(duplicatePrefix, /duplicate/);
  const duplicateKind = fixture(); duplicateKind.customRouters.push(clone(duplicateKind.customRouters[0]));
  rejectsEvery(duplicateKind, /duplicate canonical kind/);
  const duplicateDynamic = fixture(); duplicateDynamic.dynamicPages.hotel = duplicateDynamic.dynamicPages.food;
  rejectsEvery(duplicateDynamic, /duplicate dynamic page ID/);
  const crossType = fixture(); crossType.dynamicPages.hotel = crossType.customRouters[0].pageId;
  rejectsEvery(crossType, /dynamic\/custom page ID conflict/);
  const conflict = fixture(); conflict.staticPaths['/arcade'] = conflict.staticPaths['/search'];
  rejectsEvery(conflict, /static\/custom page ID conflict/);
});

test('incomplete ownership, undeclared dynamic roles and invalid navigation paths fail closed', () => {
  const missingStatic = fixture(); delete missingStatic.staticPaths['/search'];
  rejectsEvery(missingStatic, /missing runtime static path: \/search/);
  const missingDynamic = fixture(); delete missingDynamic.dynamicPages.hotel;
  rejectsEvery(missingDynamic, /dynamicPages missing hotel/);
  const extraDynamic = fixture(); extraDynamic.dynamicPages.unreviewed = extraDynamic.dynamicPages.hotel;
  rejectsEvery(extraDynamic, /unsupported field unreviewed/);
  for (const routePath of ['https://other.test', '//search', '/search?q=test', '/a/../search', '/search/']) {
    const input = fixture(); input.staticPaths[routePath] = input.staticPaths['/search'];
    rejectsEvery(input, /invalid static path/);
  }
  const aliasNavigation = fixture(); aliasNavigation.staticPaths['/hotels'] = aliasNavigation.customRouters[2].pageId;
  rejectsEvery(aliasNavigation, /legacy alias must not be a navigation destination/);
});

test('only compact reviewed provenance is accepted and raw UI payloads are not carried into outputs', () => {
  const input = fixture();
  input.capture.sourceSnapshots = { 'native-pages.json': 'b'.repeat(64) };
  input.capture.capturedPageCount = Object.keys(input.pages).length + 10;
  input.capture.note = 'Reviewed capture only';
  const validated = validateNativeBindings(input);
  assert.deepEqual(Object.keys(validated.capture), ['branch', 'revision', 'evidenceSha256']);
  for (const generate of generators) assert.doesNotMatch(JSON.stringify(generate(input)), /sourceSnapshots|native-pages\.json|Reviewed capture only/);
  const rawPage = fixture(); rawPage.pages[rawPage.dynamicPages.hotel].pageJsonFileName = 'private-page-content.json';
  rejectsEvery(rawPage, /unsupported field pageJsonFileName/);
  const rawInput = fixture(); rawInput.rawPages = { content: 'not-reviewed' };
  rejectsEvery(rawInput, /unsupported field rawPages/);
  const rawSnapshot = fixture(); rawSnapshot.capture.sourceSnapshots = { 'native-pages.json': { content: 'not-reviewed' } };
  rejectsEvery(rawSnapshot, /only snapshot basenames and SHA-256 digests/);
});

test('CLIs work in a relocated checkout from unrelated cwd and never consume prior generated files', t => {
  const folder = temporary(t), checkout = path.join(folder, 'portable checkout'), cwd = path.join(folder, 'elsewhere');
  fs.mkdirSync(cwd);
  portableCheckout(checkout, fixture());
  // These stale prior outputs deliberately throw if imported or fail JSON parsing.
  put(checkout, 'src/public/routes/nativeStaticPaths.js', 'throw Error("read stale generated navigation");');
  put(checkout, 'docs/captured-native-handlers.json', 'not JSON');
  put(checkout, 'generated/loader-page-ownership.json', 'not JSON');
  for (const name of cliNames) runCli(checkout, name, cwd);
  const first = outputs(checkout);
  for (const name of cliNames) runCli(checkout, name, path.join(checkout, 'src'));
  assert.deepEqual(outputs(checkout), first);
  assert.equal(fs.existsSync(path.join(cwd, 'src')), false);
  assert.doesNotMatch(Object.values(first).join('\n'), /read stale|not JSON|f37020b8|psc8e/);
});

test('CLIs honor explicit relative input and output paths without embedding machine paths', t => {
  const folder = temporary(t), checkout = path.join(folder, 'portable'), cwd = path.join(folder, 'caller');
  fs.mkdirSync(cwd);
  const input = fixture(); portableCheckout(checkout, input);
  put(cwd, 'reviewed/capture.json', JSON.stringify(input));
  // No usable default input: every command must use the explicit relative file.
  fs.writeFileSync(path.join(checkout, 'config/routes/native-bindings.json'), '{}');
  for (const name of cliNames) runCli(checkout, name, cwd, ['--input', 'reviewed/capture.json', '--output-root', 'result']);
  const result = outputs(path.join(cwd, 'result'));
  assert.equal(result['src/backend/routers.js'], generateNativeHandlers(input).source);
  assert.equal(result['src/public/routes/nativeStaticPaths.js'], generateNativeNavigation(input).source);
  assert.deepEqual(JSON.parse(result['generated/loader-page-ownership.json']), generateLoaderPageOwnership(input));
  assert.doesNotMatch(Object.values(result).join('\n'), new RegExp(folder));
});

test('invalid captures fail before any existing generated output is replaced', t => {
  const folder = temporary(t), outputRoot = path.join(folder, 'output'), input = fixture();
  input.dynamicPages.hotel = 'psc8e';
  const inputPath = put(folder, 'bad.json', JSON.stringify(input));
  for (const name of outputNames) put(outputRoot, name, 'prior ' + name);
  const before = outputs(outputRoot);
  for (const build of builders) assert.throws(() => build({ input: inputPath, outputRoot }), /absent\/stale page ID/);
  assert.deepEqual(outputs(outputRoot), before);
});

test('output writes reject traversal, symlinks and non-regular files before replacing anything', t => {
  const folder = temporary(t), outputRoot = path.join(folder, 'output');
  put(outputRoot, 'src/backend/routers.js', 'prior routers');
  const target = put(folder, 'outside.txt', 'untouched');
  fs.mkdirSync(path.join(outputRoot, 'docs'));
  fs.symlinkSync(target, path.join(outputRoot, 'docs/captured-native-handlers.json'));
  const input = put(folder, 'reviewed.json', JSON.stringify(fixture()));
  assert.throws(() => buildNativeHandlers({ input, outputRoot }), /non-regular native output/);
  assert.equal(fs.readFileSync(path.join(outputRoot, 'src/backend/routers.js'), 'utf8'), 'prior routers');
  assert.equal(fs.readFileSync(target, 'utf8'), 'untouched');
  assert.throws(() => writeNativeOutputs(new Map([['../escape.js', 'no']]), { outputRoot }), /Unexpected native output/);
  const linked = path.join(folder, 'linked'); fs.symlinkSync(outputRoot, linked);
  assert.throws(() => buildNativeNavigation({ input, outputRoot: linked }), /symlink native output/);
});

test('the reviewed checkout input validates without changing generated artifacts', () => {
  const before = outputNames.map(name => fs.readFileSync(path.join(root, name), 'utf8'));
  const reviewed = readNativeBindings();
  for (const generate of generators) generate(reviewed);
  assert.equal(reviewed.capture.branch, 'Original');
  assert.equal(generateLoaderPageOwnership(reviewed).pageIds.includes(reviewed.dynamicPages.hotel), true);
  assert.deepEqual(outputNames.map(name => fs.readFileSync(path.join(root, name), 'utf8')), before);
});
