// Temporary release tooling. Remove after the verified candidate is promoted.
// Never select a release using location.search or caller-supplied CMS fields.
export const SITE_ID = '517c2402-3182-4b3f-a2f1-be5611e7e22f';
export const CONTRACT_VERSION = 'spin-raiders-canonical-v1';

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!plain(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}
export function stableJson(value) { return JSON.stringify(stable(value)); }
function pick(source, keys) {
  return Object.fromEntries(keys.filter(key => source?.[key] !== undefined).map(key => [key, source[key]]));
}
function requireObject(value, label) {
  if (!plain(value)) throw new Error('Missing native identity: ' + label);
  return value;
}

// This projection includes only public build identifiers and route metadata.
// It deliberately excludes signed render information, sessions, tokens and users.
export function nativeBuildProjection(model) {
  if (model?.site?.metaSiteId !== SITE_ID) throw new Error('Wrong site identity');
  const features = requireObject(model.siteFeaturesConfigs, 'features');
  const router = requireObject(features.router, 'router');
  const bootstrap = requireObject(features.platform?.bootstrapData, 'bootstrap');
  const codeAppId = bootstrap.wixCodeBootstrapData?.wixCodeModel?.appData?.codeAppId;
  if (typeof codeAppId !== 'string' || !/^[a-f0-9-]{36}$/.test(codeAppId)) throw new Error('Missing backend build identity');
  const pages = requireObject(router.pagesMap, 'pagesMap');
  if (!Object.keys(pages).length) throw new Error('Empty native page inventory');
  const routes = requireObject(router.routes, 'routes');
  const dynamic = requireObject(bootstrap.platformAPIData?.routersConfigMap, 'routersConfigMap');
  const routerBindings = {};
  for (const [key, entry] of Object.entries(dynamic)) {
    const selected = pick(entry, ['routerPrefix', 'config', 'roleVariations']);
    if (typeof selected.config === 'string') selected.config = JSON.parse(selected.config);
    selected.pageRoles = Object.fromEntries(Object.entries(entry.pageRoles || {}).map(([role, page]) => [role,
      pick(page, ['id', 'title', 'pageUriSEO'])]));
    routerBindings[key] = selected;
  }
  return {
    metaSiteId: SITE_ID,
    siteId: model.site.siteId,
    codeAppId,
    mainPageId: router.mainPageId,
    pages: Object.fromEntries(Object.entries(pages).map(([id, page]) => [id,
      pick(page, ['pageId', 'pageJsonFileName', 'pageUriSEO', 'title'])])),
    routes,
    pageIdToPrefix: router.pageIdToPrefix || {},
    routerBindings
  };
}
export async function nativeBuildHash(model, subtle = globalThis.crypto?.subtle) {
  if (!subtle) throw new Error('SHA-256 unavailable');
  const bytes = new TextEncoder().encode(stableJson(nativeBuildProjection(model)));
  const result = await subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function earlyIdentity(essential) {
  if (essential?.site?.externalBaseUrl !== 'https://www.spin-raiders.com') return null;
  const common = essential?.commonConfig;
  if (!plain(common) || !/^\d+$/.test(String(common.siteRevision ?? ''))) return null;
  const branchId = common.branchId || null;
  if (branchId !== null && !/^[a-f0-9-]{36}$/.test(branchId)) return null;
  return { revision: String(common.siteRevision), branchId };
}
export function sameTuple(a, b) {
  return !!a && !!b && a.revision === String(b.revision) && a.branchId === (b.branchId || null);
}
export const PRESERVED_BUILDS = Object.freeze([
  { revision: '6329', branchId: null, codeAppId: '679b5e55-a136-42ba-b835-f056bbcc45dd', nativeBuildHash: 'cb4b088047e089eb9e4e09ec69a8d4c820e2d621c1be1614e552682c079acbbe' },
  { revision: '6300', branchId: null, codeAppId: '64c3a2dd-5a54-43c5-8bfe-58a9e809b4eb', nativeBuildHash: '04891fbc3eeb173cc984fed4ab64716503bd8f9dc531ac2a4f1dbddab00effca' },
  { revision: '50', branchId: '1a171085-b7f9-4143-b1c5-27fc5b67fd9d', codeAppId: 'e61b26d6-27b9-4d14-a276-2ee4a3875db0', nativeBuildHash: 'a4bea53cf3903428ab0e15856ce378de9c4cc7039e2643a68d9bd2fcd5b082c1' }
]);
// An early tuple is a preload hint only. It cannot authorize runtime execution.
export function knownPreservedTuple(essential) {
  return PRESERVED_BUILDS.some(tuple => sameTuple(earlyIdentity(essential), tuple));
}
function hash(value) { return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value); }
export function validateCandidateConfig(config) {
  return config?.testApproved === true && config.localTestEvidence &&
    config.expectedFingerprint?.contractVersion === CONTRACT_VERSION &&
    ['releaseFingerprint', 'manifestFingerprint', 'rendererFingerprint'].every(key => hash(config.expectedFingerprint[key])) &&
    hash(config.nativeBuildHash) && /^[a-f0-9-]{36}$/.test(config.codeAppId || '') &&
    /^\d+$/.test(String(config.testIdentity?.revision || '')) &&
    (config.testIdentity?.branchId === null || /^[a-f0-9-]{36}$/.test(config.testIdentity?.branchId || ''));
}
export function fingerprintMatches(actual, expected) {
  return actual?.complete === true && actual.deployable === true && expected?.contractVersion === CONTRACT_VERSION &&
    ['contractVersion', 'releaseFingerprint', 'manifestFingerprint', 'rendererFingerprint'].every(key => actual[key] === expected[key]);
}

// readFingerprint receives a fixed path constructed here, never a browser query.
// Its implementation must be a bounded, read-only fetch with no CMS writes.
export async function selectRuntime({ essential, model, config, readFingerprint, subtle, onCandidateNative }) {
  const tuple = earlyIdentity(essential);
  const testTuple = sameTuple(tuple, config?.testIdentity);
  let projection, nativeHash;
  try {
    projection = nativeBuildProjection(model);
    nativeHash = await nativeBuildHash(model, subtle);
  } catch {
    return { runtime: 'blocked', reason: 'invalid_native_identity' };
  }
  if (PRESERVED_BUILDS.some(build => build.codeAppId === projection.codeAppId && build.nativeBuildHash === nativeHash)) {
    return { runtime: 'preserved', reason: 'exact_preserved_native_and_backend' };
  }
  if (!validateCandidateConfig(config)) return { runtime: 'blocked', reason: 'unapproved_candidate_config' };
  if (projection.codeAppId !== config.codeAppId || nativeHash !== config.nativeBuildHash) {
    return { runtime: 'blocked', reason: 'native_build_mismatch' };
  }
  onCandidateNative?.();
  // Production takes precedence after promotion, independently of renderingFlow.
  try {
    if (config.promotionApproved === true && config.acceptanceEvidence &&
        fingerprintMatches(await readFingerprint('/_functions/canonicalFingerprint'), config.expectedFingerprint)) {
      return { runtime: 'candidate-production', reason: 'same_verified_build_promoted' };
    }
  } catch { /* A failed readiness read must never authorize the candidate. */ }
  if (testTuple) {
    try {
      if (fingerprintMatches(await readFingerprint('/_functions/canonicalFingerprint?rc=test-site'), config.expectedFingerprint)) {
        return { runtime: 'candidate-test', reason: 'exact_verified_test_build' };
      }
    } catch { /* Preserve blocked state, do not silently use production HTTP. */ }
  }
  return { runtime: 'blocked', reason: 'candidate_backend_not_ready' };
}
