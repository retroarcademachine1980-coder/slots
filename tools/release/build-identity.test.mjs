import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import { CONTRACT_VERSION, SITE_ID, nativeBuildProjection, nativeBuildHash, earlyIdentity, knownPreservedTuple,
  stableJson, validateCandidateConfig, fingerprintMatches, selectRuntime } from './build-identity.mjs';

let passed = 0;
async function test(name, fn) { await fn(); ++passed; console.log('PASS', name); }
const branch = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const codeAppId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const essential = { site: { externalBaseUrl: 'https://www.spin-raiders.com' }, commonConfig: { siteRevision: '99', branchId: branch } };
const model = { site: { metaSiteId: SITE_ID, siteId: 'native-document' }, siteFeaturesConfigs: {
  router: { mainPageId: 'home', pagesMap: { home: { pageId: 'home', pageJsonFileName: 'content-hash_99', title: 'Home' } }, routes: { './': { type: 'Static', pageId: 'home' } }, pageIdToPrefix: {} },
  platform: { bootstrapData: { platformAPIData: { routersConfigMap: { machine: { routerPrefix: '/classic-fruit-machines', config: '{"routerFunctionName":"classic_fruit_machines_Router"}', pageRoles: { role: { id: 'machine', title: 'Machine' } } } } },
    wixCodeBootstrapData: { wixCodeModel: { appData: { codeAppId }, signedAppRenderInfo: 'DO_NOT_INCLUDE_SECRET' } } } }
} };
const fingerprint = { contractVersion: CONTRACT_VERSION, releaseFingerprint: 'a'.repeat(64), manifestFingerprint: 'b'.repeat(64), rendererFingerprint: 'c'.repeat(64), complete: true, deployable: true };
const config = { testApproved: true, localTestEvidence: 'local-checks-and-captured-bindings', promotionApproved: true, acceptanceEvidence: 'candidate-acceptance-artifact', codeAppId, nativeBuildHash: await nativeBuildHash(model, webcrypto.subtle), testIdentity: { revision: '99', branchId: branch }, expectedFingerprint: fingerprint };
const choose = (extra = {}) => selectRuntime({ essential, model, config, subtle: webcrypto.subtle, readFingerprint: async () => fingerprint, ...extra });

await test('known live6300 requires exact native and backend identity', async () => {
  const e = structuredClone(essential); e.commonConfig = { siteRevision: '6300' };
  assert.equal(knownPreservedTuple(e), true);
  const p = JSON.parse(fs.readFileSync(new URL('fixtures/production-6300-projection.json', import.meta.url), 'utf8'));
  const captured = {site:{metaSiteId:p.metaSiteId,siteId:p.siteId},siteFeaturesConfigs:{router:{mainPageId:p.mainPageId,pagesMap:p.pages,routes:p.routes,pageIdToPrefix:p.pageIdToPrefix},platform:{bootstrapData:{wixCodeBootstrapData:{wixCodeModel:{appData:{codeAppId:p.codeAppId}}},platformAPIData:{routersConfigMap:p.routerBindings}}}}};
  assert.equal((await choose({ essential: e, model: captured, readFingerprint: () => { throw new Error('must not fetch'); } })).runtime, 'preserved');
});
await test('preserved6300 tuple with changed backend never selects old runtime', async () => {
  const e = structuredClone(essential); e.commonConfig = { siteRevision: '6300' };
  assert.notEqual((await choose({ essential: e })).runtime, 'preserved');
  const changed = structuredClone(model);
  changed.siteFeaturesConfigs.platform.bootstrapData.wixCodeBootstrapData.wixCodeModel.appData.codeAppId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  assert.equal((await choose({ essential: e, model: changed })).runtime, 'blocked');
});
await test('unrelated test50 is preserved', () => {
  const e = structuredClone(essential); e.commonConfig = { siteRevision: '50', branchId: '1a171085-b7f9-4143-b1c5-27fc5b67fd9d' };
  assert(knownPreservedTuple(e));
});
await test('wrong origin rejected by early identity', () => {
  assert.equal(earlyIdentity({ ...essential, site: { externalBaseUrl: 'https://example.com' } }), null);
});
await test('native projection omits secrets and request fields', () => {
  const copy = structuredClone(model); copy.requestUrl = '/?branchId=' + branch; copy.site.sessionId = 'private-session';
  assert(!stableJson(nativeBuildProjection(copy)).includes('DO_NOT_INCLUDE_SECRET'));
  assert(!stableJson(nativeBuildProjection(copy)).includes('private-session'));
});
await test('stable hash ignores JSON key order, sessions and revision wrapper', async () => {
  const copy = JSON.parse(JSON.stringify(model)); copy.site.sessionId = 'another'; copy.site.siteRevision = 1234;
  copy.siteFeaturesConfigs.router.pagesMap.home = { title: 'Home', pageJsonFileName: 'content-hash_99', pageId: 'home' };
  assert.equal(await nativeBuildHash(copy, webcrypto.subtle), config.nativeBuildHash);
});
await test('native page content change changes identity', async () => {
  const copy = structuredClone(model); copy.siteFeaturesConfigs.router.pagesMap.home.pageJsonFileName = 'different-content';
  assert.notEqual(await nativeBuildHash(copy, webcrypto.subtle), config.nativeBuildHash);
  assert.equal((await choose({ model: copy })).runtime, 'blocked');
});
await test('unknown UI with candidate backend blocked even after wrapper changes', async () => {
  const e = structuredClone(essential); e.commonConfig = { siteRevision: '100' };
  const copy = structuredClone(model); copy.siteFeaturesConfigs.router.routes['./extra'] = { pageId: 'home', type: 'Static' };
  assert.equal((await choose({ essential: e, model: copy })).runtime, 'blocked');
});
await test('wrong site model cannot select candidate', async () => {
  const copy = structuredClone(model); copy.site.metaSiteId = 'foreign';
  assert.equal((await choose({ model: copy })).runtime, 'blocked');
});
await test('unapproved or incomplete config cannot select candidate', async () => {
  assert(!validateCandidateConfig({ ...config, testApproved: false }));
  assert.equal((await choose({ config: { ...config, testApproved: false } })).runtime, 'blocked');
  assert(!validateCandidateConfig({ ...config, nativeBuildHash: null }));
});
await test('all hash/version and immutable deployable checks required', () => {
  for (const key of ['releaseFingerprint', 'manifestFingerprint', 'rendererFingerprint', 'contractVersion']) {
    assert(!fingerprintMatches({ ...fingerprint, [key]: 'wrong' }, fingerprint));
  }
  assert(!fingerprintMatches({ ...fingerprint, complete: false }, fingerprint));
  assert(!fingerprintMatches({ ...fingerprint, deployable: false }, fingerprint));
});
await test('verified native build with production fingerprint chooses production', async () => {
  assert.equal((await choose()).runtime, 'candidate-production');
});
await test('test transport only for exact server-generated candidate tuple', async () => {
  const paths = []; const result = await choose({ readFingerprint: async path => { paths.push(path); return path.endsWith('rc=test-site') ? fingerprint : { ...fingerprint, releaseFingerprint: null }; } });
  assert.equal(result.runtime, 'candidate-test');
  assert.deepEqual(paths, ['/_functions/canonicalFingerprint', '/_functions/canonicalFingerprint?rc=test-site']);
});
await test('promotion wrapper can change only with same exact native+backend build', async () => {
  const e = structuredClone(essential); e.commonConfig = { siteRevision: '100', renderingFlow: 'NONE' };
  assert.equal((await choose({ essential: e })).runtime, 'candidate-production');
});
await test('URL query spoof cannot authorize test transport', async () => {
  const e = structuredClone(essential); e.commonConfig = { siteRevision: '100' }; e.requestUrl = '/?siteRevision=99&branchId=' + branch;
  const paths = []; const result = await choose({ essential: e, readFingerprint: async path => { paths.push(path); return null; } });
  assert.equal(result.runtime, 'blocked');
  assert.deepEqual(paths, ['/_functions/canonicalFingerprint']);
});
await test('backend errors cannot switch candidate to incompatible old runtime', async () => {
  assert.equal((await choose({ readFingerprint: async () => { throw new Error('offline'); } })).runtime, 'blocked');
});
await test('partial full model is blocked for exact candidate test', async () => {
  assert.equal((await choose({ model: {} })).runtime, 'blocked');
});
await test('unknown unrelated build blocks rather than mixing runtimes', async () => {
  const e = structuredClone(essential); e.commonConfig = { siteRevision: '101' };
  const copy = structuredClone(model); copy.siteFeaturesConfigs.platform.bootstrapData.wixCodeBootstrapData.wixCodeModel.appData.codeAppId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  assert.equal((await choose({ essential: e, model: copy })).runtime, 'blocked');
});
await test('captured production identity is complete and token-free', async () => {
  const p = JSON.parse(fs.readFileSync(new URL('fixtures/production-6300-projection.json', import.meta.url), 'utf8'));
  assert.equal(p.codeAppId, '64c3a2dd-5a54-43c5-8bfe-58a9e809b4eb');
  assert.equal(Object.keys(p.pages).length, 69);
  assert.equal(Object.keys(p.routerBindings).length, 17);
  assert(!JSON.stringify(p).includes('signedAppRenderInfo'));
});
await test('test-only approval cannot activate production even on matching fingerprints', async () => {
  const testConfig = { ...config, promotionApproved: false, acceptanceEvidence: null };
  const paths = [];
  const result = await choose({ config: testConfig, readFingerprint: async path => { paths.push(path); return fingerprint; } });
  assert.equal(result.runtime, 'candidate-test');
  assert.deepEqual(paths, ['/_functions/canonicalFingerprint?rc=test-site']);
  const e = structuredClone(essential); e.commonConfig = { siteRevision: '100' };
  const outsideTest = await choose({ config: testConfig, essential: e });
  assert.equal(outsideTest.runtime, 'blocked');
});
console.log(`${passed} release identity tests passed. Browser injection/promotion remain UNTESTED.`);
