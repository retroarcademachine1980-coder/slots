#!/usr/bin/env node
// Read-only, browser-independent readiness regression. Run from any directory.
// Add --with-dom to exercise maintained search modules (requires jsdom on NODE_PATH).
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/runtime/002-01-spin-raiders-route-hydration-and-unavailable-states.js'), 'utf8');

function harness(initial = '/search?q=a') {
  const origin = 'https://www.spin-raiders.com';
  const location = { origin };
  const events = [];
  let status;
  function setLocation(value) {
    const url = new URL(value, origin);
    Object.assign(location, { href: url.href, pathname: url.pathname, search: url.search });
  }
  function key() { return (location.pathname.replace(/\/$/, '') || '/') + location.search; }
  function mountStatus() {
    const node = { dataset: { srOwner: 'release-loader', path: key() }, remove() { if (status === node) status = null; } };
    status = node;
  }
  setLocation(initial);
  const context = {
    window: {}, location, URL, Map,
    CustomEvent: class { constructor(type, { detail }) { Object.assign(this, { type, detail }); } },
    dispatchEvent(event) { events.push(event); if (event.type === 'sr:navigation') mountStatus(); },
    document: { getElementById(id) { return id === 'sr-site-fonts' ? {} : id === 'sr-runtime-status' ? status : null; } }
  };
  vm.runInNewContext(source, context, { filename: 'runtime-readiness.js' });
  mountStatus();
  return {
    events, runtime: context.window.SR_RUNTIME,
    get status() { return status; },
    key,
    navigate(value) { setLocation(value); context.window.SR_RUNTIME.navigation(); }
  };
}

let passed = 0;
function test(name, run) { run(); passed++; console.log('PASS ' + name); }
test('unscoped terminal signals cannot clear the current loader status',()=>{const h=harness();const status=h.status;assert.equal(h.runtime.ready('old-owner'),false);assert.equal(h.runtime.failed('old-owner'),false);assert.equal(h.status,status);});
for (const state of ['ready', 'failed']) {
  test(`A to B to A emits ${state} and clears each fresh loader status`, () => {
    const h = harness();
    for (const query of ['a', 'b', 'a']) {
      h.navigate('/search?q=' + query);
      assert.ok(h.status, 'each new visit has a loader status');
      assert.equal(h.runtime[state]('search', h.key()), true);
      assert.equal(h.status, null, 'terminal signal removes current status');
    }
    const terminals = h.events.filter(e => e.type === 'sr:page-' + state);
    assert.deepEqual(terminals.map(e => e.detail.navigationKey), ['/search?q=a', '/search?q=b', '/search?q=a']);
  });
  test(`stale path and query ${state} signals cannot clear current status`, () => {
    const h = harness();
    h.runtime[state]('search', h.key());
    h.navigate('/search?q=b');
    const currentStatus = h.status;
    assert.equal(h.runtime[state]('search', '/search?q=a'), false);
    assert.equal(h.runtime[state]('detail', '/destination/blackpool'), false);
    assert.equal(h.status, currentStatus);
    assert.equal(h.runtime[state]('search', h.key()), true);
    assert.equal(h.status, null);
  });
  test(`duplicate ${state} within one navigation remains idempotent`, () => {
    const h = harness();
    h.runtime[state]('search', h.key());
    h.runtime[state]('search', h.key());
    assert.equal(h.events.filter(e => e.type === 'sr:page-' + state).length, 1);
  });
}
test('ready then failed is emitted as a real state change', () => {
  const h = harness();
  h.runtime.ready('search', h.key());
  h.runtime.failed('search', h.key());
  assert.deepEqual(h.events.map(e => e.type), ['sr:page-ready', 'sr:page-failed']);
});
test('foreign-origin and fragment terminal inputs cannot clear current status', () => {
  const h = harness();
  assert.equal(h.runtime.ready('search', 'https://example.com/search?q=a'), false);
  assert.equal(h.runtime.failed('search', '/search?q=a#stale'), false);
  assert.ok(h.status);
  assert.equal(h.events.length, 0);
});
async function verifySearchProtocol() {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const root = path.join(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/runtime/manifest.json'), 'utf8'));
  function setup(route, pending = false) {
    const errors = [], events = [], requests = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('warn', (...args) => errors.push(args.join(' ')));
    virtualConsole.on('jsdomError', error => errors.push(error.message));
    const dom = new JSDOM('<head></head><body><div id="SITE_CONTAINER"></div></body>', {
      url: 'https://www.spin-raiders.com' + route, runScripts: 'outside-only', virtualConsole
    });
    const w = dom.window;
    w.matchMedia = () => ({ matches: false });
    w.fetch = async () => { throw Error('Unexpected network request'); };
    w.HTMLElement.prototype.scrollIntoView = function () {};
    w.addEventListener('sr:page-ready', event => events.push(event.detail));
    w.SR_SEASIDE = {
      e: value => String(value ?? ''), pages: { destination: () => '' }, styles: [''],
      archiveQuery: () => {
        assert.ok(pending, 'Empty-query search must not issue data queries');
        return new Promise(resolve => requests.push(resolve));
      }
    };
    function mountStatus() {
      w.document.getElementById('sr-runtime-status')?.remove();
      const status = w.document.createElement('section');
      status.id = 'sr-runtime-status'; status.dataset.srOwner = 'release-loader';
      status.dataset.path = w.location.pathname + w.location.search;
      w.document.body.prepend(status);
    }
    mountStatus();
    // Execute the actual maintained modules, not a substituted renderer or bundle.
    for (const number of [1, 2, 89, 79, 67, 68, 48]) {
      const module = manifest.modules.find(item => item.number === number);
      assert.ok(module, 'Maintained module ' + number + ' is present');
      w.eval(fs.readFileSync(path.join(root, module.generated || 'src/runtime/' + module.file), 'utf8'));
    }
    return { w, dom, errors, events, requests, mountStatus };
  }
  for (const route of ['/search', '/search?q=']) {
    const h = setup(route);
    try {
      const host = h.w.document.getElementById('sr-directory-search');
      assert.ok(host?.shadowRoot?.querySelector('form'), 'Meaningful search form is mounted');
      assert.equal(h.w.document.getElementById('sr-runtime-status'), null);
      assert.equal(h.events.length, 1);
      assert.equal(h.events[0].owner, 'search');
      assert.equal(h.events[0].navigationKey, route);
      assert.deepEqual(h.errors, []);
      passed++; console.log('PASS mounted empty search releases loader status: ' + route);
    } finally { h.dom.window.close(); }
  }
  const stale = setup('/search?q=a', true);
  try {
    assert.ok(stale.requests.length > 0, 'Search data requests are pending');
    stale.w.history.pushState({}, '', '/hotel/test-hotel/york');
    stale.w.SR_RUNTIME.navigation(); stale.mountStatus();
    stale.requests.forEach(resolve => resolve({ dataItems: [] }));
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.ok(stale.w.document.getElementById('sr-runtime-status'), 'Old search completion must not clear the hotel loader status');
    assert.equal(stale.events.length, 0, 'Old search cannot announce the new hotel is ready');
    assert.deepEqual(stale.errors, []);
    passed++; console.log('PASS stale search data cannot announce a different route is ready');
  } finally { stale.dom.window.close(); }
  for(const staleFailure of [false,true]){const h=setup('/classic-fruit-machines');try{const w=h.w,failures=[];w.addEventListener('sr:page-failed',event=>failures.push(event.detail));const native=w.document.createElement('div');native.id='sr-seaside-root';w.document.body.append(native);let rejectQuery;w.SR_SEASIDE.archiveQuery=()=>new Promise((resolve,reject)=>rejectQuery=reject);Object.assign(w.SR_SEASIDE,{makerBadge:()=>'',img:x=>x,fit:x=>x,archiveQuality:{fields:[],photo:()=>'',cardPhoto:()=>'',text:x=>String(x||''),year:()=>'',exactYear:()=>0,key:x=>String(x).toLowerCase(),makers:()=>[],val:x=>String(x||''),usable:()=>true,group:x=>x}});w.SR_ARCHIVE_DESIGN_CSS=':host{display:block}';w.SR_ARCHIVE_DETAIL={};w.SR_ICON=()=>'';const item=manifest.modules.find(item=>item.number===73);w.eval(fs.readFileSync(path.join(root,'src/runtime/'+item.file),'utf8'));assert.equal(typeof rejectQuery,'function','actual machine-index query is pending');const host=w.document.getElementById('sr-approved-archive');assert(host?.shadowRoot);if(staleFailure){w.history.pushState({},'','/hotel/test-hotel/york');w.SR_RUNTIME.navigation();h.mountStatus();}rejectQuery(Error('fixture source offline'));await new Promise(resolve=>setTimeout(resolve,30));if(staleFailure){assert(w.document.getElementById('sr-runtime-status'));assert.equal(failures.length,0);assert(!host.shadowRoot.textContent.includes('Some records could not load'));}else{assert.equal(w.document.getElementById('sr-runtime-status'),null);assert.equal(failures.length,1);assert.equal(failures[0].navigationKey,'/classic-fruit-machines');assert.match(host.shadowRoot.textContent,/Some records could not load/);}assert.deepEqual(h.errors,[]);passed++;console.log('PASS '+(staleFailure?'stale machine-index rejection preserves new-page status':'current machine-index rejection shows explicit failure and releases status'));}finally{h.dom.window.close();}}

}
Promise.resolve(process.argv.includes('--with-dom') ? verifySearchProtocol() : undefined)
  .then(() => console.log(`${passed} runtime readiness regressions passed. This is not browser or release acceptance.`))
  .catch(error => { console.error(error); process.exitCode = 1; });
