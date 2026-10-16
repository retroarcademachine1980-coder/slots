(function(){'use strict';// Temporary release tooling. Remove after the verified candidate is promoted.
// Never select a release using location.search or caller-supplied CMS fields.
const SITE_ID = '517c2402-3182-4b3f-a2f1-be5611e7e22f';
const CONTRACT_VERSION = 'spin-raiders-canonical-v1';

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!plain(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}
function stableJson(value) { return JSON.stringify(stable(value)); }
function pick(source, keys) {
  return Object.fromEntries(keys.filter(key => source?.[key] !== undefined).map(key => [key, source[key]]));
}
function requireObject(value, label) {
  if (!plain(value)) throw new Error('Missing native identity: ' + label);
  return value;
}

// This projection includes only public build identifiers and route metadata.
// It deliberately excludes signed render information, sessions, tokens and users.
function nativeBuildProjection(model) {
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
async function nativeBuildHash(model, subtle = globalThis.crypto?.subtle) {
  if (!subtle) throw new Error('SHA-256 unavailable');
  const bytes = new TextEncoder().encode(stableJson(nativeBuildProjection(model)));
  const result = await subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
}
function earlyIdentity(essential) {
  if (essential?.site?.externalBaseUrl !== 'https://www.spin-raiders.com') return null;
  const common = essential?.commonConfig;
  if (!plain(common) || !/^\d+$/.test(String(common.siteRevision ?? ''))) return null;
  const branchId = common.branchId || null;
  if (branchId !== null && !/^[a-f0-9-]{36}$/.test(branchId)) return null;
  return { revision: String(common.siteRevision), branchId };
}
function sameTuple(a, b) {
  return !!a && !!b && a.revision === String(b.revision) && a.branchId === (b.branchId || null);
}
const PRESERVED_BUILDS = Object.freeze([
  { revision: '6329', branchId: null, codeAppId: '679b5e55-a136-42ba-b835-f056bbcc45dd', nativeBuildHash: 'cb4b088047e089eb9e4e09ec69a8d4c820e2d621c1be1614e552682c079acbbe' },
  { revision: '6300', branchId: null, codeAppId: '64c3a2dd-5a54-43c5-8bfe-58a9e809b4eb', nativeBuildHash: '04891fbc3eeb173cc984fed4ab64716503bd8f9dc531ac2a4f1dbddab00effca' },
  { revision: '50', branchId: '1a171085-b7f9-4143-b1c5-27fc5b67fd9d', codeAppId: 'e61b26d6-27b9-4d14-a276-2ee4a3875db0', nativeBuildHash: 'a4bea53cf3903428ab0e15856ce378de9c4cc7039e2643a68d9bd2fcd5b082c1' }
]);
// An early tuple is a preload hint only. It cannot authorize runtime execution.
function knownPreservedTuple(essential) {
  return PRESERVED_BUILDS.some(tuple => sameTuple(earlyIdentity(essential), tuple));
}
function hash(value) { return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value); }
function validateCandidateConfig(config) {
  return config?.testApproved === true && config.localTestEvidence &&
    config.expectedFingerprint?.contractVersion === CONTRACT_VERSION &&
    ['releaseFingerprint', 'manifestFingerprint', 'rendererFingerprint'].every(key => hash(config.expectedFingerprint[key])) &&
    hash(config.nativeBuildHash) && /^[a-f0-9-]{36}$/.test(config.codeAppId || '') &&
    /^\d+$/.test(String(config.testIdentity?.revision || '')) &&
    (config.testIdentity?.branchId === null || /^[a-f0-9-]{36}$/.test(config.testIdentity?.branchId || ''));
}
function fingerprintMatches(actual, expected) {
  return actual?.complete === true && actual.deployable === true && expected?.contractVersion === CONTRACT_VERSION &&
    ['contractVersion', 'releaseFingerprint', 'manifestFingerprint', 'rendererFingerprint'].every(key => actual[key] === expected[key]);
}

// readFingerprint receives a fixed path constructed here, never a browser query.
// Its implementation must be a bounded, read-only fetch with no CMS writes.
async function selectRuntime({ essential, model, config, readFingerprint, subtle, onCandidateNative }) {
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

// Maintained temporary cutover tooling, bundled inline only after release approval.
// The final single-runtime loader uses the same status/hold protocol without dispatch.

const FONT_ID = 'sr-site-fonts';
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,800&family=Bree+Serif&family=Caveat:wght@600;700&family=Inter:wght@500;600;700;800;900&family=Permanent+Marker&family=Roboto+Condensed:wght@400;500;600;700;800;900&display=swap';
const OWNER = 'release-loader';
const ROOT = 'https://cdn.jsdelivr.net/gh/retroarcademachine1980-coder/slots@';
function navigationKey(location) {
  return (location.pathname.replace(/\/+$/, '') || '/') + (location.search || '');
}
function candidateAssets(config, runtime) {
  if (!/^[a-f0-9]{40}$/.test(config?.assetCommit || '')) throw new Error('Unpinned candidate assets');
  if (!['candidate-test', 'candidate-production'].includes(runtime)) throw new Error('Invalid candidate mode');
  const base = ROOT + config.assetCommit + '/dist/';
  return { css: base + 'sr.min.css', entry: base + (runtime === 'candidate-test' ? 'sr.core.test.min.js' : 'sr.core.min.js') };
}
function createFingerprintReader(fetchImpl, { timeoutMs = 3500, AbortControllerImpl = AbortController } = {}) {
  return async path => {
    if (!['/_functions/canonicalFingerprint', '/_functions/canonicalFingerprint?rc=test-site'].includes(path)) throw new Error('Invalid fingerprint endpoint');
    const controller = new AbortControllerImpl();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(path, { method: 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok || !/application\/json/i.test(response.headers.get('content-type') || '')) throw new Error('Invalid fingerprint response');
      const text = await response.text();
      if (text.length > 2048) throw new Error('Oversize fingerprint');
      return JSON.parse(text);
    } finally { clearTimeout(timer); }
  };
}

// Pure lifecycle logic: ownership comes from the contract-generated registry.
function createLifecycle({ view, schedule = setTimeout, cancel = clearTimeout, deadlineMs = 20000 }) {
  let active = null, deadline = null;
  function clearDeadline() { if (deadline !== null) cancel(deadline); deadline = null; }
  return {
    begin(key, owned) {
      if (owned && active === key) return;
      clearDeadline();
      active = owned ? key : null;
      if (!owned) { view.release(); return; }
      view.loading(key); // Meaningful visible fallback must precede native hiding.
      view.hold(key);
      deadline = schedule(() => { if (active === key) view.failure(key, 'load_timeout'); }, deadlineMs);
    },
    terminal(detail) {
      if (!active || !detail?.owner || detail.navigationKey !== active) return false;
      clearDeadline(); view.clearStatus(active); return true;
    },
    failure(key, cause) {
      if (active !== key) return false;
      clearDeadline(); view.failure(key, cause); return true;
    },
    dispose() { clearDeadline(); active = null; view.release(); }
  };
}

function createStatusView(document, location) {
  const owned = id => { const el = document.getElementById(id); return el?.getAttribute('data-sr-owner') === OWNER ? el : null; };
  function status(key, failed) {
    if (!document.body) throw new Error('Body not available');
    const existing = document.getElementById('sr-runtime-status');
    if (existing && !owned('sr-runtime-status')) throw new Error('Status ownership conflict');
    let node = owned('sr-runtime-status');
    if (!node) {
      node = document.createElement('section'); node.id = 'sr-runtime-status';
      node.setAttribute('data-sr-owner', OWNER); node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite');
      node.style.cssText = 'position:relative;z-index:2147483000;min-height:65vh;padding:48px 24px;background:#0d1928;color:#fff;font:18px/1.5 system-ui';
      const brand = document.createElement('strong'); brand.textContent = 'SPIN RAIDERS'; brand.style.cssText = 'display:block;color:#f7c948;font-size:30px';
      const message = document.createElement('p'); message.setAttribute('data-sr-message', '');
      const links = document.createElement('nav'); links.setAttribute('aria-label', 'Page recovery');
      for (const [label, href] of [['Retry', location.pathname + location.search], ['Home', '/'], ['Search', '/search']]) {
        const a = document.createElement('a'); a.textContent = label; a.href = href;
        a.style.cssText = 'display:inline-block;color:#f7c948;margin:0 24px 8px 0'; links.appendChild(a);
      }
      node.append(brand, message, links); document.body.insertBefore(node, document.body.firstChild);
    }
    node.querySelector('nav a').href = location.pathname + location.search;
    node.setAttribute('data-path', key);
    node.setAttribute('data-state', failed ? 'failed' : 'loading');
    node.querySelector('[data-sr-message]').textContent = failed ? 'This page could not load. Please retry, or use Home or Search.' : 'Loading your Spin Raiders page…';
    node.querySelector('nav').hidden = !failed;
  }
  return {
    loading: key => status(key, false),
    failure: key => status(key, true),
    hold() {
      let style = document.getElementById('sr-hold');
      if (style && !owned('sr-hold')) throw new Error('Hold ownership conflict');
      if (!style) { style = document.createElement('style'); style.id = 'sr-hold'; style.setAttribute('data-sr-owner', OWNER); style.textContent = 'html[data-sr-runtime-owned="1"],html[data-sr-runtime-owned="1"] body{background:#0d1928}html[data-sr-runtime-owned="1"] #SITE_CONTAINER{visibility:hidden!important}'; document.head.appendChild(style); }
      document.documentElement.setAttribute('data-sr-runtime-owned', '1');
    },
    clearStatus(key) { const node = owned('sr-runtime-status'); if (node?.getAttribute('data-path') === key) node.remove(); },
    release() { owned('sr-runtime-status')?.remove(); owned('sr-hold')?.remove(); document.documentElement.removeAttribute('data-sr-runtime-owned'); }
  };
}

function loadResource(document, tag, attrs, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const node = document.createElement(tag); let settled = false;
    const finish = error => { if (settled) return; settled = true; clearTimeout(timer); node.onload = node.onerror = null; error ? reject(error) : resolve(node); };
    const timer = setTimeout(() => finish(new Error('Asset timeout')), timeoutMs);
    node.onload = () => finish(); node.onerror = () => finish(new Error('Asset load failed'));
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    document.head.appendChild(node);
  });
}

// The observer is only for initial Wix script/body parser availability; never a
// heuristic for whether a page renderer has completed.
function waitForNativeInputs(document, { MutationObserverImpl = globalThis.MutationObserver, timeoutMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    let observer, timer;
    const check = () => {
      const essential = document.getElementById('wix-essential-viewer-model');
      const full = document.getElementById('wix-viewer-model');
      if (!document.body || !essential?.textContent || !full?.textContent) return false;
      try {
        const result = { essential: JSON.parse(essential.textContent), model: JSON.parse(full.textContent) };
        observer?.disconnect(); clearTimeout(timer); resolve(result); return true;
      } catch { return false; }
    };
    if (check()) return;
    observer = new MutationObserverImpl(check); observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    timer = setTimeout(() => { observer.disconnect(); reject(new Error('Native identity unavailable')); }, timeoutMs);
    check();
  });
}

async function startReleaseLoader({ window, document, config, ownsRoute, preservedBootstrap, readInputs = waitForNativeInputs, select = selectRuntime }) {
  if (window.__SR_RELEASE_LOADER__) return window.__SR_RELEASE_LOADER__;
  const boot = (async () => {
    let identity;
    try { identity = await readInputs(document); } catch { return { runtime: 'blocked', reason: 'native_identity_unavailable' }; }
    let candidateView, candidateLifecycle;
    const navigate = () => candidateLifecycle?.begin(navigationKey(window.location), ownsRoute(window.location));
    const prepareCandidate = () => {
      if (candidateLifecycle) return;
      candidateView = createStatusView(document, window.location);
      candidateLifecycle = createLifecycle({ view: candidateView });
      const terminal = event => candidateLifecycle.terminal(event.detail);
      const failure = event => { if (event.detail?.navigationKey === navigationKey(window.location)) candidateLifecycle.failure(event.detail.navigationKey, event.detail.cause || 'runtime_failure'); };
      window.addEventListener('sr:page-ready', terminal); window.addEventListener('sr:page-failed', terminal);
      window.addEventListener('sr:navigation', navigate); window.addEventListener('popstate', navigate);
      window.addEventListener('sr:runtime-failure', failure);
      navigate();
    };
    const selection = await select({ ...identity, config, readFingerprint: createFingerprintReader(window.fetch.bind(window)), subtle: window.crypto?.subtle, onCandidateNative: prepareCandidate });
    // Wix can change URL while the read-only fingerprint request is pending.
    // Synchronize the actual current view even if no runtime has booted yet.
    navigate();
    if (selection.runtime === 'preserved') { await preservedBootstrap(); return selection; }
    if (selection.runtime === 'blocked') {
      if (selection.reason === 'candidate_backend_not_ready') {
        if (!candidateLifecycle) prepareCandidate();
        candidateLifecycle.failure(navigationKey(window.location), selection.reason);
      }
      return selection;
    }
    if (!candidateLifecycle) prepareCandidate();
    const lifecycle = candidateLifecycle;
    try {
      const assets = candidateAssets(config, selection.runtime);
      if (!document.getElementById(FONT_ID)) { const font = document.createElement('link'); font.id = FONT_ID; font.rel = 'stylesheet'; font.href = FONT_HREF; document.head.appendChild(font); }
      await loadResource(document, 'link', { rel: 'stylesheet', href: assets.css, 'data-sr-owner': OWNER });
      navigate();
      await loadResource(document, 'script', { src: assets.entry, async: '', fetchpriority: 'high', 'data-sr-owner': OWNER });
    } catch {
      navigate();
      const key = navigationKey(window.location); lifecycle.failure(key, 'asset_failure');
      window.dispatchEvent(new window.CustomEvent('sr:runtime-failure', { detail: { path: window.location.pathname, navigationKey: key, cause: 'asset_failure' } }));
    }
    return { ...selection, lifecycle };
  })();
  window.__SR_RELEASE_LOADER__ = boot;
  return boot;
}

 const config={"testApproved":true,"localTestEvidence":true,"promotionApproved":false,"expectedFingerprint":{"contractVersion":"spin-raiders-canonical-v1","releaseFingerprint":"0c1bb4280bafa267916c819a1f554561425cebecfa449b7099073e360479f38a","manifestFingerprint":"d4581aafc597e0ab2e45e7debcd3388daefebb69ca5753626d480158928640f9","rendererFingerprint":"f0af07cc7c1533562de482f69a8197e88d9d4cbb48116687a64b908e1ab85a5f","sourceFiles":299,"deploymentBlocked":false},"nativeBuildHash":"5a4ced4499545fd06616698ece18f6608d3207da5c509ff64b3381075ef3a92f","codeAppId":"dcf06533-0fb5-422b-b8d2-49bb76ee2591","testIdentity":{"revision":"2","branchId":"52ba962a-157c-48b1-8e2e-9d4ba0a57e4a"},"assetCommit":"3fdd7ca532a6d5c49510e356cfbb02e31a434af1"};
 function load(src){const script=document.createElement('script');script.src=src;script.async=true;script.fetchPriority='high';document.head.append(script);}
 const hint=new URLSearchParams(location.search);
 if(hint.get('branchId')!==config.testIdentity.branchId||hint.get('siteRevision')!==config.testIdentity.revision){load("https://cdn.jsdelivr.net/gh/retroarcademachine1980-coder/slots@ef3373799a9d721c6c5eb19647d856ff1a1252e5/dist/sr.core-20261014-crown.min.js");return;}
 (async()=>{const inputs=await waitForNativeInputs(document);const selection=await selectRuntime({...inputs,config,subtle:window.crypto.subtle,readFingerprint:async path=>{
 const u=new URL(path,'https://www.spin-raiders.com');u.searchParams.delete('rc');u.searchParams.set('siteRevision',config.testIdentity.revision);u.searchParams.set('branchId',config.testIdentity.branchId);
 return createFingerprintReader((_,options)=>window.fetch(u.pathname+u.search,options))('/_functions/canonicalFingerprint');
 }});if(selection.runtime!=='candidate-test')throw Error('candidate_selection:'+selection.reason);
 load('https://cdn.jsdelivr.net/gh/retroarcademachine1980-coder/slots@'+config.assetCommit+'/dist/filter-0c1/sr.core.test.js');
 })().catch(error=>{console.warn('Spin Raiders preview pair check:',error.message);const view=createStatusView(document,location);view.failure(navigationKey(location),'candidate_pair_not_verified');});
})();