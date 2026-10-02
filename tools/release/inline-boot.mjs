import { selectRuntime } from './build-identity.mjs';
import { navigationKey, createFingerprintReader, createStatusView, loadResource, waitForNativeInputs } from './runtime-loader.mjs';

// This is a projection of the one contract onto actual Wix-rendered page IDs.
// It only scopes the emergency view before the full classifier asset arrives.
export function ownsNativePage(pageId, location, registry, { transitionalIndexInputs = true } = {}) {
  if (!registry.pageIds.includes(pageId)) return false;
  const q = new URLSearchParams(location.search);
  if (pageId === registry.searchPageId) return q.get('view') !== registry.excludedSearchView;
  if (q.has('collection') || q.has('place')) return registry.legacyRecordCollections.includes(q.get('collection')) && Boolean(q.get('place'));
  if (pageId !== registry.homePageId) return true;
  if (q.get('sr') === 'classic' && q.get('machine')) return true;
  if (transitionalIndexInputs && q.has('explore')) return registry.allowedHomeExplore.includes(q.get('explore'));
  if (transitionalIndexInputs && q.has('view')) return registry.allowedHomeViews.includes(q.get('view'));
  if (transitionalIndexInputs && q.get('sr') === 'classic') return true;
  return !registry.homeExcludedKeys.some(key => q.has(key));
}

export function createEmergencyView(window, document, registry, options = {}, nativeRouter) {
  const view = createStatusView(document, window.location);
  let failed = false, previous = null, observer;
  const sync = () => {
    if (!window.location) return;
    const ids = [...document.querySelectorAll('#SITE_PAGES .wixui-page')].map(node => node.parentElement.id);
    const id = ids.length === 1 ? ids[0] : null;
    const key = navigationKey(window.location), stamp = id + '|' + key + '|' + failed;
    if (stamp === previous) return; previous = stamp;
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const routes = nativeRouter?.routes;
    const compatible = !nativeRouter || (path === '/' ? id === nativeRouter.mainPageId : Object.entries(routes || {}).some(([key,route]) => route.type === 'Static' ? key === '.' + path && route.pageId === id : (path === key.slice(1) || path.startsWith(key.slice(1) + '/')) && route.pageIds?.includes(id)));
    if (!id || !compatible || !ownsNativePage(id, window.location, registry, options)) { view.release(); return; }
    failed ? view.failure(key, 'boot_failed') : view.loading(key); view.hold();
  };
  const listen = () => {
    // Native page identity, not render-readiness detection. This short-lived
    // observer hands over to explicit owner events once the candidate loads.
    const target = document.body;
    observer = new window.MutationObserver(sync); observer.observe(target, { childList: true, subtree: true });
    window.addEventListener('popstate', sync); window.addEventListener('sr:navigation', sync); sync();
  };
  const stop = () => { observer?.disconnect(); window.removeEventListener('popstate', sync); window.removeEventListener('sr:navigation', sync); };
  listen();
  return { sync, failure() { failed = true; sync(); }, takeover: stop, release() { stop(); view.release(); } };
}

export async function bootInline({ window, document, config, pageRegistry, preservedBootstrap, select = selectRuntime, readInputs = waitForNativeInputs }) {
  if (window.__SR_RELEASE_BOOT__) return window.__SR_RELEASE_BOOT__;
  const boot = (async () => {
    let inputs, emergency;
    try { inputs = await readInputs(document); } catch { return { runtime: 'blocked', reason: 'native_identity_unavailable' }; }
    const selection = await select({ ...inputs, config, subtle: window.crypto?.subtle,
      readFingerprint: createFingerprintReader(window.fetch.bind(window)),
      onCandidateNative: () => { emergency = createEmergencyView(window, document, pageRegistry, { transitionalIndexInputs: config.transitionalIndexInputs !== false }, inputs.model?.siteFeaturesConfigs?.router); } });
    emergency?.sync();
    if (selection.runtime === 'preserved') { emergency?.release(); await preservedBootstrap(); return selection; }
    if (selection.runtime === 'blocked') { emergency?.failure(); return selection; }
    try {
      await loadResource(document, 'script', { src: 'https://cdn.jsdelivr.net/gh/retroarcademachine1980-coder/slots@' + config.assetCommit + '/dist/sr.release-loader.min.js', async: '', fetchpriority: 'high' });
      emergency?.sync();
      if (typeof window.SR_CANDIDATE_BOOT !== 'function') throw new Error('Candidate loader did not initialize');
      return await window.SR_CANDIDATE_BOOT({ config, selection, onTakeover: () => emergency?.takeover() });
    } catch { emergency?.failure(); return { runtime: 'blocked', reason: 'candidate_loader_failed' }; }
  })();
  window.__SR_RELEASE_BOOT__ = boot;
  return boot;
}
