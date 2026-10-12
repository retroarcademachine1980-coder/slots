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
  inner.innerHTML = '<main><section class="hero"><h1 class="sr-only">Big days out. Brilliant discoveries.</h1></section><section class="home-guide">' + Array.from(d.querySelectorAll('.home-picks')).map((_, i) => '<div class="home-picks"><a href="/destination/blackpool" data-identity="' + i + '">Real card ' + i + '</a></div>').join('') + '</section><section class="section wrap"><h2>This month’s highlights</h2><div class="highlights"><a class="card" data-offer href="/attractions/example/town">An offer</a><a class="card" data-monthly-arcade href="/arcade/example/town"><span class="badge">ARCADE OF THE MONTH</span>Arcade pick</a></div></section><section><section class="home-value">Original value text</section></section></main>';
  d.body.prepend(host);
  return { host, outer, home, inner };
}

test('Initial response has useful visible prose, one H1 and clean category/destination links', () => {
  const dom = fixture();
  const d = dom.window.document;
  assert.equal(d.querySelectorAll('h1').length, 1);
  assert.equal(d.querySelector('h1').textContent, 'UK days out. Find your kind of fun.');
  assert.equal(d.querySelectorAll('main').length, 1, 'The readable fallback should have a main content landmark.');
  assert.ok(d.querySelector('#sr-home-native-source').textContent.trim().split(/\s+/).length > 450);
  assert.deepEqual(Array.from(d.querySelectorAll('[data-sr-home-kind]')).map(e => e.dataset.srHomeKind), ['destinations', 'attractions', 'food', 'hotels', 'arcades']);
  assert.equal(d.querySelectorAll('.sr-discovery-grid > a').length, 6);
  assert.ok(d.querySelector('#sr-monthly-highlights').compareDocumentPosition(d.querySelector('.sr-discovery-grid')) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(d.querySelectorAll('#sr-monthly-highlights .card').length, 3);
  assert.ok(d.querySelector('#sr-home-native-value .sr-arcades-last [data-sr-picks="arcades"]'));
  for (const section of d.querySelectorAll('.home-about-grid > article')) {
    assert.ok(section.querySelector(':scope > h2'), 'Major homepage sections need an H2 before card H3s.');
  }
  let previousLevel = 0;
  for (const heading of d.querySelectorAll('h1,h2,h3')) {
    const level = Number(heading.tagName.slice(1));
    assert.ok(level <= previousLevel + 1, 'Initial HTML must not skip a heading level.');
    previousLevel = level;
  }
  for (const image of d.querySelectorAll('.dest img')) {
    assert.ok(Number(image.getAttribute('width')) > 0 && Number(image.getAttribute('height')) > 0);
    assert.ok(image.getAttribute('alt').includes('destination guide'));
  }
  for (const a of d.querySelectorAll('a')) assert.match(a.getAttribute('href'), /^\/[a-z0-9/-]+$/);
  assert.ok(d.querySelector('a[href="/destination/skegness"]'));
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
  const offerCard = inner.querySelector('[data-offer]');
  const monthlyArcade = inner.querySelector('[data-monthly-arcade]');
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
  assert.equal(value.querySelector('[data-identity="0"]'), realCard);
  realCard.click();
  assert.equal(clicked, 1, 'Reuse live card nodes and their existing event listeners.');
  assert.ok(guide.textContent.includes('what shall we do?'));
  assert.ok(prose.includes('what shall we do?'));
  assert.equal(value.querySelector('[data-sr-picks="arcades"] [data-identity="0"]'), realCard, 'Arcade cards must appear at the bottom after editorial reordering.');
  assert.ok(inner.querySelector('main > slot[name="sr-home-value"]'), 'The bottom guide and arcade section need a live slot even after removing the old destination block.');
  assert.equal(guide.querySelector('#sr-monthly-highlights [data-offer]'),offerCard);
  assert.equal(value.querySelector('[data-sr-picks="arcades"] [data-monthly-arcade]'),monthlyArcade);
  assert.equal(inner.querySelector('.highlights'),null,'Do not leave a second highlights section lower down.');
  assert.equal(guide.querySelector('[data-sr-picks="destinations"] [data-identity="1"]').textContent, 'Real card 1');
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
