const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const fragment = fs.readFileSync(path.join(root, 'dist/sr-home-native-20261012.html'), 'utf8');
const bridge = fs.readFileSync(path.join(root, 'dist/sr-home-native-20261012.js'), 'utf8');

function fixture(url = 'https://www.spin-raiders.com/') {
  return new JSDOM('<!doctype html><html><body>' + fragment + '</body></html>', { url, runScripts: 'outside-only', pretendToBeVisual: true });
}

function runtime(dom) {
  const d = dom.window.document;
  const host = d.createElement('div');
  host.id = 'sr-seaside-root';
  const outer = host.attachShadow({ mode: 'open' });
  const home = d.createElement('div');
  home.id = 'sr-home-approved-20260921';
  outer.append(home);
  const inner = home.attachShadow({ mode: 'open' });
  inner.innerHTML = '<main><section class="hero"><h1 class="sr-only">Big days out. Brilliant discoveries.</h1></section><section class="home-guide">' + Array.from(d.querySelectorAll('.home-picks')).map((_, i) => '<div class="home-picks"><a href="/destination/blackpool" data-identity="' + i + '">Real card ' + i + '</a></div>').join('') + '</section><section><section class="home-value">Original value text</section></section></main>';
  d.body.prepend(host);
  return { host, outer, home, inner };
}

test('Initial response has useful visible prose, one H1 and clean category/destination links', () => {
  const dom = fixture();
  const d = dom.window.document;
  assert.equal(d.querySelectorAll('h1').length, 1);
  assert.equal(d.querySelector('h1').textContent, 'UK days out. All under one roof.');
  assert.ok(d.querySelector('#sr-home-native-source').textContent.trim().split(/\s+/).length > 1000);
  assert.equal(d.querySelectorAll('h2').length, 2);
  assert.ok(d.querySelectorAll('h3').length >= 9);
  for (const a of d.querySelectorAll('a')) assert.match(a.getAttribute('href'), /^\/[a-z0-9/-]+$/);
  assert.ok(d.querySelector('a[href="/destination/skegness"]'));
  assert.equal(d.querySelector('.home-search').getAttribute('action'), '/search');
  dom.window.close();
});

test('After route hydration the same light-DOM prose is projected into its existing positions once', async () => {
  const dom = fixture();
  const d = dom.window.document;
  const { host, outer, home, inner } = runtime(dom);
  const guide = d.querySelector('#sr-home-native-guide');
  const value = d.querySelector('#sr-home-native-value');
  const prose = guide.textContent;
  let ready;
  dom.window.SR_HOME_ROUTES_READY = new Promise(resolve => { ready = resolve; });
  const realCard = inner.querySelector('[data-identity="0"]');
  let clicked = 0;
  realCard.addEventListener('click', e => { e.preventDefault(); clicked++; });
  dom.window.eval(bridge);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(inner.querySelector('.home-guide'), 'Do not take loading cards before canonical routes finish.');
  ready();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(guide.parentNode, host);
  assert.equal(value.parentNode, host);
  assert.equal(d.querySelector('#sr-home-native-source'), null);
  assert.equal(d.querySelectorAll('h1').length, 1);
  assert.equal(inner.querySelector('h1'), null);
  assert.equal(inner.querySelector('.home-guide'), null);
  assert.equal(inner.querySelector('.home-value'), null);
  assert.equal(guide.querySelector('[data-identity="0"]'), realCard);
  realCard.click();
  assert.equal(clicked, 1, 'Reuse live card nodes and their existing event listeners.');
  assert.ok(guide.textContent.includes('Whatever sort of day you have in mind'));
  assert.ok(prose.includes('Whatever sort of day you have in mind'));
  const forwarding = home.querySelector('slot[name="sr-home-guide"]');
  assert.equal(forwarding.assignedElements()[0], guide);
  assert.equal(inner.querySelector('slot[name="sr-home-guide"]').assignedElements()[0], forwarding);
  assert.equal(inner.querySelector('slot[name="sr-home-guide"]').assignedElements({ flatten: true })[0], guide);
  dom.window.eval(bridge);
  assert.equal(host.querySelectorAll('#sr-home-native-guide').length, 1);
  assert.equal(outer.querySelectorAll('#sr-home-approved-20260921').length, 1);
  dom.window.close();
});

test('Missing runtime retains the readable fallback; unrelated homepage modes remove it', async () => {
  const missing = fixture();
  missing.window.eval(bridge);
  assert.ok(missing.window.document.querySelector('#sr-home-native-source'));
  await new Promise(resolve => setImmediate(resolve));
  missing.window.close();
  for (const url of ['https://www.spin-raiders.com/attractions', 'https://www.spin-raiders.com/?report=change', 'https://www.spin-raiders.com/?raidertube=1']) {
    const dom = fixture(url);
    dom.window.eval(bridge);
    assert.equal(dom.window.document.querySelector('#sr-home-native-source'), null);
    dom.window.close();
  }
});
