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
test('Desktop mega menus open on hover, retain every category and close correctly from the keyboard', () => {
  const {dom,root} = page('/', 'sr-brand-header', '<header><nav class="menu" aria-label="Main"><div class="dd"><a href="/seaside">Days Out</a><div class="panel"><a href="/arcade">Arcades</a></div></div><details data-sr-browse><summary>Browse</summary></details></nav><button class="nav-search">Search</button><a class="button" href="/plan-a-trip">Plan</a><details class="burger"><summary>Menu</summary><nav aria-label="Mobile"><details><summary>Days out</summary></details></nav></details></header>');
  const search = root.querySelector('.nav-search'); let clicked = 0; search.onclick = () => clicked++;
  dom.window.eval(script);
  const nav = root.querySelector('nav[aria-label="Main"]');
  assert.equal(nav.querySelectorAll(':scope > .sr-nav-group').length,7);
  assert.equal(nav.querySelector('a').getAttribute('href'),'/days-out');
  assert.equal(nav.querySelectorAll('.sr-nav-panel').length,7);
  assert.equal(nav.querySelector('.sr-nav-parent[href="/classic-fruit-machines"]').textContent,'Fruit machines');
  assert.equal(nav.querySelector('.sr-nav-panel a[href="/classic-fruit-machines"]').textContent,'Fruit Machine Archive');
  for(const href of ['/bingo-halls','/arcade-bars','/sea-life','/classic-arcades','/?raidertube=1','/casino-offers'])assert.ok(nav.querySelector('a[href="'+href+'"]'),href);
  assert.equal(nav.querySelector('button'),null,'Desktop categories use hover links without separate dropdown buttons');
  assert.equal(nav.dataset.srMegaMenu,'1');
  const groups=nav.querySelectorAll('.sr-nav-group'),parent=groups[0].querySelector('.sr-nav-parent'),panel=groups[0].querySelector('.sr-nav-panel');
  groups[0].dispatchEvent(new dom.window.MouseEvent('mouseenter'));assert.equal(parent.getAttribute('aria-expanded'),'true');assert.equal(panel.hidden,false);assert.equal(panel.querySelectorAll('.sr-mega-column').length,3);
  groups[1].dispatchEvent(new dom.window.MouseEvent('mouseenter'));assert.equal(panel.hidden,true);assert.equal(nav.querySelectorAll('.sr-menu-open').length,1);
  groups[1].dispatchEvent(new dom.window.MouseEvent('mouseleave'));assert.equal(nav.querySelectorAll('.sr-menu-open').length,0);
  parent.focus();parent.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));assert.equal(root.activeElement,panel.querySelector('a'));
  panel.querySelector('a').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(panel.hidden,true);assert.equal(parent.getAttribute('aria-expanded'),'false');assert.equal(root.activeElement,parent);
  assert.equal(root.querySelectorAll('nav[aria-label="Mobile"] details').length,7);
  search.click(); assert.equal(clicked,1); assert.equal(root.querySelector('.button').getAttribute('href'),'/plan-a-trip');
  dom.window.close();
});
test('AGC has a clear entrance photograph on the right and machine choices open the archive', () => {
  const {dom,root}=page('/agc','sr-extended-pages','<main><section class="hero"><div class="hero-image" style="background-image:url(roadworks.jpg)"></div><div class="hero-copy"><h1>AGC</h1></div><form class="hero-search"></form></section><nav class="topics"><button data-topic="Classic Machines"><span>777</span>Classic Machines</button><button data-topic="Modern Slots">Modern Slots</button></nav><aside class="filters"><label><input name="topic" value="Classic Machines" type="checkbox">Classic Machines</label></aside></main>');
  dom.window.eval(script);
  assert.equal(root.querySelector('main').dataset.srAgcEntrance,'1');
  assert.ok(root.querySelector('[data-sr-agc-photo]').src.includes('d1cb49916ad44bb18041dc2bbc3680f3'));
  assert.equal(root.querySelector('.topics a').getAttribute('href'),'/classic-fruit-machines');
  assert.equal(root.querySelector('[data-topic="Modern Slots"]').tagName,'BUTTON');
  dom.window.close();
});
test('Archive banner uses one real machine-row photo and leaves each machine card linked to its own guide', () => {
  const {dom,root}=page('/classic-fruit-machines','sr-approved-archive','<main><section class="hero"><div class="hero-photos" data-hero-photos><img src="one.jpg"></div></section><section><a class="card" href="/classic-fruit-machines/barcrest/andy-capp-1991-blue-edition"><img src="andy.jpg"><h3>Andy Capp</h3></a></section></main>');
  dom.window.eval(script);
  assert.equal(root.querySelectorAll('[data-hero-photos] img').length,1);
  assert.ok(root.querySelector('[data-sr-classic-row-photo]').src.includes('36eefd9f515b4f9183c46d4ef64eff48'));
  assert.equal(root.querySelector('[data-hero-photos] a'),null);
  assert.equal(root.querySelector('a.card').getAttribute('href'),'/classic-fruit-machines/barcrest/andy-capp-1991-blue-edition');
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
test('The existing public source renderer receives rich review text without changing its source records', async () => {
  const {dom,root}=page('/food-and-drink/a-place','sr-food-page','<main>Food guide</main>');
  let received;
  dom.window.SR_RENDER_SOURCE_RECORDS=async (_root,result)=>{received=result;return true;};
  const result={sourceRecords:[{key:'FoodAndDrink:food',row:{shortDescription:'A food stop',review:'<h2>A useful visit guide</h2><p>Details.</p>'}}]};
  dom.window.eval(script);
  await dom.window.SR_RENDER_SOURCE_RECORDS(root,result,{});
  assert.equal(received.sourceRecords[0].row.fullDescription,result.sourceRecords[0].row.review);
  assert.equal(result.sourceRecords[0].row.fullDescription,undefined,'Do not mutate the canonical source record');
  dom.window.close();
});
test('The approved food guide is visible when the published route omits its CMS review field', () => {
  const {dom,root}=page('/food-and-drink/reel-plaice-ayr','sr-food-page','<div class="wrap"><main><h1>Reel Plaice, Ayr</h1><p class="tag">A food stop.</p><div class="about"><p>A food stop.</p></div></main></div>');
  dom.window.eval(script);
  const about=root.querySelector('.about');
  assert.ok(about.textContent.trim().split(/\s+/).length>400);
  assert.ok(about.querySelector('a[href="/destination/ayr"]'));
  assert.equal(root.querySelectorAll('.sr-guide-index').length,1);
  dom.window.close();
});
