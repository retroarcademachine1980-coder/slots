const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const script = fs.readFileSync(path.join(__dirname, '../dist/sr-days-out-experience-20261012.js'), 'utf8');
function page(route, hostId, html) {
  const dom = new JSDOM('<body></body>', { url: 'https://www.spin-raiders.com' + route, runScripts: 'outside-only', pretendToBeVisual: true });
  const host = dom.window.document.createElement('div'); host.id = hostId;
  dom.window.document.body.append(host); const root = host.attachShadow({ mode: 'open' }); root.innerHTML = html;
  return { dom, root };
}
test('Shared navigation has direct days-out categories and preserves search and trip controls', () => {
  const {dom,root} = page('/', 'sr-brand-header', '<header><nav class="menu" aria-label="Main"><div class="dd"><a href="/seaside">Days Out</a><div class="panel"><a href="/arcade">Arcades</a></div></div><details data-sr-browse><summary>Browse</summary></details></nav><button class="nav-search">Search</button><a class="button" href="/plan-a-trip">Plan</a><details class="burger"><summary>Menu</summary><nav aria-label="Mobile"><details><summary>Days out</summary></details></nav></details></header>');
  const search = root.querySelector('.nav-search'); let clicked = 0; search.onclick = () => clicked++;
  dom.window.eval(script);
  const nav = root.querySelector('nav[aria-label="Main"]');
  assert.equal(nav.querySelectorAll(':scope > a').length,6);
  assert.equal(nav.querySelector('a').getAttribute('href'),'/days-out');
  assert.equal(nav.querySelectorAll('.dd,details,.panel').length,0);
  assert.equal(root.querySelector('nav[aria-label="Mobile"] details'),null);
  search.click(); assert.equal(clicked,1); assert.equal(root.querySelector('.button').getAttribute('href'),'/plan-a-trip');
  dom.window.close();
});
test('Category discovery comes before the catalogue and keeps the existing form and filter events', () => {
  const {dom,root} = page('/days-out','sr-extended-pages','<main class="directory"><section class="hero"><h1>Days out</h1><form class="hero-search"><input><button>Search</button></form></section><nav class="topics"><button>All Attractions</button><button>Theme Parks</button></nav><div class="wrap"><div class="layout"><aside class="filters"><button>Apply</button></aside><section>Results</section></div></div></main>');
  const form=root.querySelector('form'); let submits=0; form.addEventListener('submit',e=>{e.preventDefault();submits++;});
  dom.window.eval(script);
  assert.equal(root.querySelector('main').children[1].className,'sr-experience');
  assert.equal(root.querySelectorAll('.sr-experience-card').length,3);
  assert.equal(root.querySelector('.topics a').getAttribute('href'),'/attractions');
  assert.equal(root.querySelector('#sr-catalog form'),form);
  form.dispatchEvent(new dom.window.Event('submit',{cancelable:true})); assert.equal(submits,1);
  assert.equal(root.querySelectorAll('.filters button').length,1);
  dom.window.eval(script); assert.equal(root.querySelectorAll('.sr-experience').length,1);
  dom.window.close();
});
test('Destination guide has an opening H1, visible prose and working chapter links', () => {
  const {dom,root} = page('/destination/york','sr-location-directory','<main><section class="search-hero"><h2>Explore York</h2></section><nav class="categories"><button>All Results</button><button>Arcades</button><button>Attractions &amp; Family Fun</button></nav><div class="content"><section class="sr-town-guide closed" aria-label="About York"><span class="kicker">YORK ARCADES</span><div class="wrapbox"><div class="body"><h2>The Minster</h2><p>Read this guide.</p><h2>The walls</h2><p>Keep exploring.</p></div></div><button class="more">Read more</button></section><h1>Results for York</h1></div></main>');
  dom.window.eval(script);
  assert.equal(root.querySelectorAll('h1').length,1);assert.equal(root.querySelector('h1').textContent,'Explore York');
  assert.ok(!root.querySelector('.sr-town-guide').classList.contains('closed'));
  for(const a of root.querySelectorAll('.sr-guide-index a'))assert.ok(root.querySelector(a.getAttribute('href')));
  assert.equal(Array.from(root.querySelectorAll('.categories button'))[1].textContent,'Attractions & Family Fun');
  dom.window.close();
});
test('Guide source blocks show unique useful prose once and retain citations without record labels', () => {
  const {dom,root} = page('/food-and-drink/a-place','sr-food-page','<section class="banner"><span>Personally recommended</span><span>Real reviews</span></section><div class="wrap"><main><h1>A place</h1><p class="tag">A food stop.</p><div class="about"><p>A food stop.</p></div><a href="https://www.tripadvisor.co.uk/example">Visit website →</a></main><section class="sr-source-records"><h2>Original source records</h2><article><h3>Original record 1</h3><section data-source-field="summary"><h4>Summary</h4><p>A food stop.</p></section><section data-source-field="review"><h4>Review</h4><p>Useful details about the visit.</p></section><a href="https://www.tripadvisor.co.uk/example">Original source</a></article><article><h3>Original record 2</h3><section data-source-field="review"><h4>Review</h4><p>Useful details about the visit.</p></section><a href="https://www.tripadvisor.co.uk/example">Original source</a></article></section></div>');
  dom.window.eval(script);
  const source=root.querySelector('.sr-source-records');
  assert.ok(!/Original record/.test(source.textContent));
  assert.equal(root.querySelector('.about').textContent,'Useful details about the visit.');
  assert.equal(root.textContent.match(/Useful details about the visit/g).length,1);
  assert.equal(source.querySelectorAll('a').length,1);
  assert.equal(root.querySelector('.banner').textContent,'');
  assert.ok(!root.querySelector('.tag').hidden, 'Keep the short introduction when the body has a distinct useful guide.');
  assert.equal(root.querySelector('main>a').textContent,'View customer reviews →');
  dom.window.close();
});
