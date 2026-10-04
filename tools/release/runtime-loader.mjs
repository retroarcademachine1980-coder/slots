// Maintained temporary cutover tooling, bundled inline only after release approval.
// The final single-runtime loader uses the same status/hold protocol without dispatch.
import { selectRuntime } from './build-identity.mjs';

export const FONT_ID = 'sr-site-fonts';
export const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,800&family=Bree+Serif&family=Caveat:wght@600;700&family=Inter:wght@500;600;700;800;900&family=Permanent+Marker&family=Roboto+Condensed:wght@400;500;600;700;800;900&display=swap';
const OWNER = 'release-loader';
const ROOT = 'https://cdn.jsdelivr.net/gh/retroarcademachine1980-coder/slots@';
export function navigationKey(location) {
  return (location.pathname.replace(/\/+$/, '') || '/') + (location.search || '');
}
export function candidateAssets(config, runtime) {
  if (!/^[a-f0-9]{40}$/.test(config?.assetCommit || '')) throw new Error('Unpinned candidate assets');
  if (!['candidate-test', 'candidate-production'].includes(runtime)) throw new Error('Invalid candidate mode');
  const base = ROOT + config.assetCommit + '/dist/';
  return { css: base + 'sr.min.css', entry: base + (runtime === 'candidate-test' ? 'sr.core.test.min.js' : 'sr.core.min.js') };
}
export function createFingerprintReader(fetchImpl, { timeoutMs = 3500, AbortControllerImpl = AbortController } = {}) {
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
export function createLifecycle({ view, schedule = setTimeout, cancel = clearTimeout, deadlineMs = 20000 }) {
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

export function createStatusView(document, location) {
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

export function loadResource(document, tag, attrs, timeoutMs = 15000) {
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
export function waitForNativeInputs(document, { MutationObserverImpl = globalThis.MutationObserver, timeoutMs = 10000 } = {}) {
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

export async function startReleaseLoader({ window, document, config, ownsRoute, preservedBootstrap, readInputs = waitForNativeInputs, select = selectRuntime }) {
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
