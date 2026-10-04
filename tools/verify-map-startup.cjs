/** Full /map startup QA, local-only JSDOM with exact read-only API fixtures.
 * Runs real authority, full source or the core bootstrap -> rest bundle, and
 * [102]'s actual inline source loader. Leaflet is a narrow in-memory test double.
 * No renderer, route authority, canonical href, or transport hydration is stubbed.
 * Usage: NODE_PATH=<jsdom install> node tools/verify-map-startup.cjs [source|bundles] [state]
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const repo = path.resolve(__dirname, '..');
const artifactNames = ['sr.js', 'sr.core.min.js', 'sr.rest.min.js', 'sr.page.min.js', 'sr.idle.min.js', 'sr.discovery.min.js'];
const artifacts = Object.fromEntries(artifactNames.map(name => [name, fs.readFileSync(path.join(repo, 'dist', name), 'utf8')]));
const verbose = process.env.SR_QA_VERBOSE === '1';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const fixtures = {
  Venues: [{ id: 'arcade', data: { title: 'York Arcade', locationName: 'York', latitude: 53.96, longitude: -1.08, shortUrl: '/arcade-venues/wrong', active: true } }],
  NearbyAttractions: [{ id: 'cinema', data: { title: 'York Cinema', locationName: 'York', category: 'Cinema', latitude: 53.965, longitude: -1.08 } }],
  HotelGuides: [{ id: 'hotel', data: { title: 'York Hotel', locationName: 'York', latitude: 53.97, longitude: -1.08 } }],
  FoodAndDrink: [{ id: 'food', data: { title: 'York Cafe', locationName: 'York', category: 'Cafe', latitude: 53.97, longitude: -1.09 } }],
  AffiliateOffers: [{ id: 'business', data: { title: 'York Business Arcade', locationName: 'York', category: 'Arcade', latitude: 53.98, longitude: -1.09, affiliateUrl: 'https://merchant.invalid/offer' } }, { id: 'offer', data: { title: 'York Deal', locationName: 'York', category: 'Offer', latitude: 53.98, longitude: -1.09 } }],
};
const routes = {
  'Venues:arcade': ['arcade', '/arcade/york-arcade/york', 'business'],
  'NearbyAttractions:cinema': ['cinema', '/cinemas/york-cinema/york', 'business'],
  'HotelGuides:hotel': ['hotel', '/hotel/york-hotel/york', 'business'],
  'FoodAndDrink:food': ['food', '/food-and-drink/york-cafe-york', 'business'],
  'AffiliateOffers:business': ['arcade', '/arcade/york-business/york', 'business'],
  'AffiliateOffers:offer': ['hotel', '/hotel/york-hotel/york', 'offer', 'HotelGuides:hotel'],
};

function setup(mode, state = 'ready', initial = '/map?q=York', storage = {}) {
  const errors = [], warnings = [], calls = [], bundles = [], scripts = [], oldRenders = [], authorityRequests = [], observers = new Set();
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message));
  vc.on('warn', (...args) => warnings.push(args.map(String).join(' ')));
  vc.on('error', (...args) => errors.push(args.map(String).join(' ')));
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="SITE_CONTAINER"></div></body></html>', { url: 'https://www.spin-raiders.com' + initial, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  for (const [key, value] of Object.entries(storage)) w.localStorage.setItem(key, value);
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  w.ResizeObserver = class { observe() {} disconnect() {} };
  const Observer = w.MutationObserver;
  w.MutationObserver = class extends Observer { constructor(callback) { super(callback); observers.add(this); } };
  const html = Object.getOwnPropertyDescriptor(w.Element.prototype, 'innerHTML');
  Object.defineProperty(w.Element.prototype, 'innerHTML', { ...html, set(value) { if (this.id === 'sr-seaside-root' && String(value).trim()) oldRenders.push(String(value)); html.set.call(this, value); } });
  const executed = new WeakSet();
  function executeScript(node) {
    if (node?.tagName !== 'SCRIPT' || executed.has(node)) return;
    executed.add(node); scripts.push(node.src || 'inline');
    if (node.src) {
      const name = path.basename(new URL(node.src).pathname);
      if (/^sr\.(?:core|rest|page|idle|discovery)\.min\.js$/.test(name)) {
        bundles.push(name);
        w.setTimeout(() => loadBundle(name), 0);
      }
    } else if (node.textContent) {
      try { w.eval(node.textContent); } catch (error) { errors.push('Inline script: ' + error.stack); }
    }
  }
  const append = w.Element.prototype.append;
  w.Element.prototype.append = function (...nodes) { const result = append.apply(this, nodes); nodes.forEach(executeScript); return result; };
  const appendChild = w.Node.prototype.appendChild;
  w.Node.prototype.appendChild = function (node) { const result = appendChild.call(this, node); executeScript(node); return result; };
  function loadBundle(name) {
    Object.defineProperty(w.document, 'currentScript', { configurable: true, value: { src: 'https://fixture.invalid/dist/' + name } });
    try { w.eval(artifacts[name]); } catch (error) { errors.push(name + ': ' + error.stack); }
    Object.defineProperty(w.document, 'currentScript', { configurable: true, value: null });
  }
  w.fetch = async (url, options = {}) => {
    url = String(url); const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ url, body });
    if (url.includes('/oauth2/token')) return { ok: true, status: 200, json: async () => ({ access_token: 'fixture', expires_in: 3600 }) };
    if (url === '/_functions/canonicalRoutes') {
      assert.equal(options.method, 'POST');
      authorityRequests.push(...body.requests.map(r => r.collection + ':' + r.id));
      if (state === 'route-error') return { ok: false, status: 503, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ ok: true, results: body.requests.map(r => {
        const key = r.collection + ':' + r.id, route = routes[key];
        assert(route, 'Unexpected canonical identity ' + key);
        if (state === 'route-unavailable') return { key, ok: false, code: 'endpoint_unavailable', recordRole: route[2] };
        return { key, ok: true, kind: route[0], path: route[1], href: route[1], canonicalUrl: 'https://www.spin-raiders.com' + route[1], recordRole: route[2], targetKey: route[3] || key };
      }) }) };
    }
    if (url.includes('/items/query')) {
      assert(Object.hasOwn(fixtures, body.dataCollectionId), 'Unexpected collection ' + body.dataCollectionId);
      if (state === 'data-error' || (state === 'partial-error' && body.dataCollectionId === 'NearbyAttractions')) return { ok: false, status: 404, json: async () => ({}) };
      const id = body.query.filter?._id?.$eq;
      const rows = fixtures[body.dataCollectionId].filter(r => !id || r.id === id);
      await delay(10);
      return { ok: true, status: 200, json: async () => ({ dataItems: rows, pagingMetadata: { count: rows.length } }) };
    }
    throw new Error('Unexpected fetch ' + url);
  };
  require('./test-support/release-fingerprint-fixture.cjs').installFingerprintFixture(w,artifacts['sr.js']);
  function start() {
    if (mode === 'source') w.eval(artifacts['sr.js']);
    else loadBundle('sr.core.min.js');
  }
  let mapMounts = 0; const pins = [];
  function leaflet(ok = true) {
    const script = [...w.document.scripts].find(s => /leaflet.*\.js/.test(s.src));
    assert(script, 'Leaflet request missing');
    if (!ok) { script.onerror(); return; }
    w.L = { map: () => { mapMounts++; return { setView() { return this; }, fitBounds() {}, invalidateSize() {}, remove() {} }; }, tileLayer: () => ({ addTo() {} }), layerGroup: () => ({ addTo() { return this; }, clearLayers() { pins.length = 0; } }), divIcon: x => x, marker: (coords, options) => ({ addTo() { pins.push({ coords, options }); return this; }, getElement() { return null; }, on() {} }), latLngBounds: x => x };
    script.onload();
  }
  function repeat() {
    if (mode === 'source') w.eval(artifacts['sr.js'].split(/(?=\/\* \[\d+\])/).find(s => s.startsWith('/* [70]')));
    else { loadBundle('sr.core.min.js'); loadBundle('sr.rest.min.js'); }
  }
  return { w, start, repeat, leaflet, calls, scripts, bundles, oldRenders, errors, warnings, authorityRequests, pins, get mapMounts() { return mapMounts; }, get root() { return w.document.querySelector('#sr-approved-map')?.shadowRoot; }, close() { for (const observer of observers) observer.disconnect(); w.close(); } };
}

async function run(mode, state) {
  const c = setup(mode, state);
  try {
    c.start(); await delay(450);
    const observed = () => ({ mode, state, bundles: c.bundles, oldRenders: c.oldRenders.length, roots: c.w.document.querySelectorAll('#sr-approved-map').length, queries: c.calls.filter(c => c.url.includes('/items/query')).map(c => ({ collection: c.body.dataCollectionId, detail: !!c.body.query.filter?._id, limit: c.body.query.paging?.limit })), authorityRequests: c.authorityRequests, warnings: c.warnings, errors: c.errors, status: c.root?.querySelector('.map-status')?.textContent, results: c.root?.querySelector('.map-results')?.textContent });
    if (verbose) console.log(JSON.stringify(observed(), null, 2));
    assert(c.root, 'Final map must mount');
    assert.equal(c.oldRenders.length, 0, 'Legacy skin must never render behind final map');
    assert.equal(c.w.document.querySelectorAll('#sr-approved-map').length, 1);
    assert.equal(c.w.document.querySelector('#sr-seaside-root .maplayout,#sr-seaside-root #sr-map'), null, 'No legacy map content');
    const listing = c.calls.filter(c => c.url.includes('/items/query') && !c.body.query.filter?._id);
    assert.deepEqual(listing.map(c => c.body.dataCollectionId).sort(), Object.keys(fixtures).sort(), 'Exactly one listing query per source; no legacy loadDirectoryData query');
    if (state === 'ready' || state === 'back') {
      assert.equal(c.mapMounts, 0, 'Places load before Leaflet finishes');
      assert.equal(c.root.querySelectorAll('.map-results button').length, 5);
      assert.equal(c.root.querySelector('.place .visit').getAttribute('href'), routes['Venues:arcade'][1]);
      c.leaflet(); await delay(35);
      assert.equal(c.mapMounts, 1); assert.equal(c.pins.length, 5);
      c.repeat();
      await delay(30); assert.equal(c.mapMounts, 1, 'Repeated final owner does not create a second map');
      const cat = c.root.querySelector('input[value=cinema]');
      c.root.querySelectorAll('.categories input').forEach(el => { el.checked = false; }); cat.checked = true;
      c.root.querySelector('[data-update]').click(); assert.equal(c.pins.length, 1);
      assert.match(c.root.querySelector('.map-results').textContent, /York Cinema/);
      assert.equal(c.w.localStorage.getItem('sr-map-design-preferences'), '["cinema"]');
      if (state === 'back') {
        c.root.querySelector('.search input').value = 'York Cinema';
        c.root.querySelector('form.search').dispatchEvent(new c.w.Event('submit', { bubbles: true, cancelable: true }));
        c.root.querySelector('.map-results button').click();
        await delay(35);
        c.root.querySelector('.place [data-save]').click();
        const savedOnly = c.root.querySelector('[data-saved-only]'); savedOnly.checked = true; savedOnly.dispatchEvent(new c.w.Event('change', { bubbles: true }));
        const link = c.root.querySelector('.place a.visit');
        assert.equal(link.getAttribute('href'), routes['NearbyAttractions:cinema'][1]);
        link.addEventListener('click', event => event.preventDefault());
        link.click();
        const saved = JSON.parse(c.w.sessionStorage.getItem('sr-return-to-results'));
        if (verbose) console.log('BACK STATE', JSON.stringify({ current: c.w.location.pathname + c.w.location.search, saved, filter: c.root.querySelector('.search input').value }));
        assert(saved, 'Back to results URL saved');
        assert.equal(new URL(saved.url, c.w.location.origin).searchParams.get('q'), 'York Cinema', 'Back to results must restore submitted search');
        assert.equal(new URL(saved.url, c.w.location.origin).searchParams.get('saved'), '1', 'Back URL preserves saved-only preference');
        const returned = setup(mode, 'ready', saved.url, { 'sr-map-design-preferences': '["hotel"]', 'sr-directory-favourites-v1': c.w.localStorage.getItem('sr-directory-favourites-v1') });
        try {
          returned.start(); await delay(450);
          assert.equal(returned.root.querySelector('.search input').value, 'York Cinema');
          assert.deepEqual([...returned.root.querySelectorAll('.categories input:checked')].map(el => el.value), ['cinema']);
          assert.equal(returned.root.querySelector('[data-saved-only]').checked, true);
          assert.equal(returned.root.querySelectorAll('.map-results button').length, 1);
          assert.match(returned.root.querySelector('.map-results').textContent, /York Cinema/);
          returned.root.querySelector('[data-reset]').click();
          assert.equal(returned.root.querySelectorAll('.map-results button').length, 5);
          assert.equal(returned.w.location.pathname + returned.w.location.search, '/map');
          assert.equal(returned.oldRenders.length, 0);
          assert.equal(returned.errors.length, 0, returned.errors.join('\n'));
        } finally { returned.close(); }
      }
    } else {
      c.leaflet(false); await delay(35);
      assert.match(c.root.querySelector('.map-count').textContent, /Map unavailable/);
      if (['data-error', 'partial-error', 'route-error'].includes(state)) assert.match(c.root.querySelector('.map-status').textContent, /could not load/, 'Source failure must remain visible after Leaflet fails');
      c.root.querySelector('[data-update]').click();
      if (['data-error', 'partial-error', 'route-error'].includes(state)) assert.match(c.root.querySelector('.map-status').textContent, /could not load/, 'Source failure must survive filter update');
      if (state === 'data-error') { assert.match(c.root.querySelector('.map-results').textContent, /Places could not load/); assert.doesNotMatch(c.root.querySelector('.map-results').textContent, /No matching places/); }
      if (state.startsWith('route')) {
        assert.equal(c.root.querySelectorAll('.place a.visit').length, 0);
        assert.match(c.root.querySelector('.place').textContent, /temporarily unavailable/);
      }
    }
    assert.equal(c.errors.length, 0, c.errors.join('\n'));
    if (state.startsWith('route')) {
      const expected = state === 'route-error' ? 'route_service_unavailable' : 'endpoint_unavailable';
      assert(c.warnings.length > 0, 'Injected route failure must be reported');
      assert(c.warnings.every(w => w === 'Canonical route unavailable ' + expected), c.warnings.join('\n'));
    } else assert.equal(c.warnings.length, 0, c.warnings.join('\n'));
    console.log('PASS ' + mode + ' full startup ' + state);
  } finally { c.close(); }
}
(async () => {
  const modes = process.argv[2] ? [process.argv[2]] : ['source', 'bundles'];
  const states = process.argv[3] ? [process.argv[3]] : ['ready', 'back', 'data-error', 'partial-error', 'route-error', 'route-unavailable'];
  assert(modes.every(mode => ['source', 'bundles'].includes(mode)), 'Unknown startup mode');
  assert(states.every(state => ['ready', 'back', 'data-error', 'partial-error', 'route-error', 'route-unavailable'].includes(state)), 'Unknown fixture state');
  for (const mode of modes) for (const state of states) await run(mode, state);
  for (const name of artifactNames) assert.equal(fs.readFileSync(path.join(repo, 'dist', name), 'utf8'), artifacts[name], 'Runtime inputs changed during QA; rerun ' + name);
  const crypto = require('node:crypto');
  console.log('INPUT SHA256 ' + JSON.stringify(Object.fromEntries(['sr.js','sr.core.min.js','sr.rest.min.js'].map(name => [name, crypto.createHash('sha256').update(artifacts[name]).digest('hex')]))));
})().catch(error => { console.error(error); process.exitCode = 1; });
