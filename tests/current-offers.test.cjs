const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync(require('node:path').join(__dirname,'../dist/sr-current-offers-20261012.js'),'utf8');
function setup(path,rows,now,routeRoles=false){
 const dom=new JSDOM('<body></body>',{url:'https://www.spin-raiders.com'+path,runScripts:'outside-only',pretendToBeVisual:true});
 const el=dom.window.document.createElement('div');el.id=path.startsWith('/destination/')?'sr-location-directory':'sr-extended-pages';dom.window.document.body.append(el);const root=el.attachShadow({mode:'open'});root.innerHTML=path.startsWith('/destination/')?'<main><section class="search-hero"><h1>Explore York</h1></section><nav class="categories"></nav><div class="content"><article id="town-story">The full town guide</article><div class="results-heading"><h2>Results for York</h2></div></div></main>':'<main><section class="hero"></section><div class="results-heading"><h1>Explore York</h1></div></main>';
 dom.window.SR_CANONICAL={offerLive:r=>r.active!==false,normalizeOffer:r=>r,outbound:r=>r.affiliateUrl||'',hotelHref:r=>r._collection==='HotelOffers'?'/hotel/'+r._id+'/york':''};
 dom.window.SR_PUBLIC_DIRECTORY={D:{rows:async name=>rows.filter(r=>r._collection===name)}};
 if(now)dom.window.Date.now=()=>Date.parse(now);
 if(routeRoles){dom.window.SR_ROUTES={outcome:r=>({recordRole:r.role||'unknown'})};dom.window.SR_ROUTE_UI={businessRows:(rows,col)=>{if(col!=='AffiliateOffers')return rows;if(rows.some(r=>!['business','offer'].includes(r.role)))throw Error('Business source classification unavailable');return rows.filter(r=>r.role==='business');}};}
 dom.window.eval(script);return {dom,root};
}
test('Town offer section retains food and attraction offers, keeps guide links and hides expired records',async()=>{
 const row=(id,type,extra={})=>({_id:id,_collection:type,title:id,locationSlug:'york',locationName:'York',affiliate:true,active:true,affiliateUrl:'https://www.awin1.com/'+id,...extra});
 const {dom,root}=setup('/destination/york',[row('hotel','HotelOffers'),row('food','AffiliateOffers',{category:'Food & Drink Offer'}),row('show','AffiliateOffers',{category:'Attraction Offer'}),row('expired','AffiliateOffers',{offerValidUntil:{$date:'2020-01-01'}}),row('disabled','AffiliateOffers',{active:false}),row('not-a-partner','AffiliateOffers',{affiliate:false,affiliateUrl:'https://example.com'})]);
 await new Promise(r=>setTimeout(r,25));
 assert.equal(root.querySelectorAll('.sr-current-card').length,3);
 const offers=root.querySelector('[data-sr-current-town-offers]');assert.equal(offers.previousElementSibling.className,'categories');assert.equal(offers.nextElementSibling.className,'content');assert.ok(root.querySelector('#town-story'));
 assert.ok(root.querySelector('a[href="/hotel/hotel/york"]'));
 assert.ok(root.querySelector('a[href="/offers#offer=food"]'));
 root.querySelector('[data-offer-category="food"]').click();assert.equal(root.querySelectorAll('.sr-current-card').length,1);assert.equal(root.querySelector('.sr-current-card h3').textContent,'food');
 dom.window.close();
});
test('An unclassified promotion does not discard verified partner businesses or become a venue result',async()=>{
 const {dom}=setup('/destination/york',[],'2026-10-12T00:00:00Z',true);await new Promise(r=>setTimeout(r,25));
 const records=[{_id:'verified-venue',role:'business'},{_id:'ticket-offer',role:'offer'},{_id:'new-unclassified-promotion'}];
 const result=dom.window.SR_ROUTE_UI.businessRows(records,'AffiliateOffers');assert.equal(result.length,1);assert.equal(result[0]._id,'verified-venue');assert.equal(dom.window.SR_ROUTE_UI.businessRows(records,'Venues'),records);
 dom.window.close();
});
test('Christmas-market planning filters the town inventory without mislabelling stays or activity packages as food',async()=>{
 const row=(id,extra)=>({_id:id,_collection:'AffiliateOffers',title:id,locationSlug:'york',locationName:'York',affiliate:true,active:true,affiliateUrl:'https://www.awin1.com/'+id,...extra});
 const rows=[row('pavilion',{category:'THINGS TO DO OFFER • STAY',offerTitle:'Overnight stay for 2 with breakfast & a welcome drink'}),row('hotel-tea',{title:'Hotel afternoon tea',category:'Food & Drink Offer',offerTitle:'Afternoon tea for 2'}),row('darts',{category:'THINGS TO DO OFFER • ACTIVITY',offerTitle:'Darts with a drink each'})];
 const {dom,root}=setup('/destination/york',rows,'2026-10-12T00:00:00Z');
 await new Promise(r=>setTimeout(r,25));
 const market=root.querySelector('.sr-festive-plan');assert.ok(market.textContent.includes('closed every Tuesday'));assert.ok(market.querySelector('a[href="https://visityork.org/christmas/york-christmas-market"]'));
 market.querySelector('[data-offer-category="stays"]').click();assert.equal(root.querySelectorAll('.sr-current-card').length,1);assert.equal(root.querySelector('.sr-current-card h3').textContent,'pavilion');assert.ok(root.querySelector('.sr-current-card strong').textContent.includes('offer details'));
 root.querySelector('.sr-current-category-filters [data-offer-category="food"]').click();assert.equal(root.querySelectorAll('.sr-current-card').length,1);assert.equal(root.querySelector('.sr-current-card h3').textContent,'Hotel afternoon tea');assert.equal(root.querySelector('.sr-festive-plan'),market);
 root.querySelector('.sr-current-category-filters [data-offer-category="attractions"]').click();assert.equal(root.querySelector('.sr-current-card h3').textContent,'darts');
 dom.window.close();
 const ended=setup('/destination/york',rows,'2027-01-10T00:00:00Z');await new Promise(r=>setTimeout(r,25));assert.equal(ended.root.querySelector('.sr-festive-plan'),null);assert.equal(ended.root.querySelectorAll('.sr-current-card').length,3);ended.dom.window.close();
});
test('An offer card opens its own details with the original affiliate link and disclosure',async()=>{
 const row={_id:'winter-fair',_collection:'AffiliateOffers',title:'Winter fair',category:'Christmas Fair',affiliate:true,active:true,affiliateUrl:'https://www.awin1.com/cread.php?awinaffid=3089397',summary:'Venue and date details.'};
 const {dom,root}=setup('/offers?offer=winter-fair',[row]);await new Promise(r=>setTimeout(r,25));
 const article=root.querySelector('[data-sr-current-offer-detail]');assert.ok(article);const a=article.querySelector('.booking');assert.equal(a.getAttribute('href'),row.affiliateUrl);assert.equal(a.getAttribute('rel'),'sponsored noopener');assert.ok(article.textContent.includes('Spin Raiders may earn a commission'));
 dom.window.close();
});
test('Copied offer fragments and changing categories keep the selected detail and original commission URL',async()=>{
 const row=id=>({_id:id,_collection:'AffiliateOffers',title:id,category:id==='meal'?'Food & Drink Offer':'Christmas Fair',affiliate:true,active:true,affiliateUrl:'https://www.awin1.com/cread.php?awinaffid=3089397&ued=https%3A%2F%2Fmerchant.example%2F'+id,summary:'Current booking details.'});
 const {dom,root}=setup('/offers#offer=meal',[row('meal'),row('fair')]);await new Promise(r=>setTimeout(r,25));let article=root.querySelector('[data-sr-current-offer-detail]');assert.equal(article.dataset.srOfferId,'meal');assert.ok(article.compareDocumentPosition(root.querySelector('.hero'))&dom.window.Node.DOCUMENT_POSITION_FOLLOWING);assert.equal(article.querySelector('.booking').getAttribute('href'),row('meal').affiliateUrl);
 dom.window.location.hash='#offer=fair';await new Promise(r=>setTimeout(r,25));assert.equal(root.querySelectorAll('[data-sr-current-offer-detail]').length,1);assert.equal(root.querySelector('[data-sr-current-offer-detail]').dataset.srOfferId,'fair');
 dom.window.location.hash='#category=food';await new Promise(r=>setTimeout(r,25));assert.equal(root.querySelector('[data-sr-current-offer-detail]'),null);assert.equal(root.querySelectorAll('.sr-current-card').length,1);assert.equal(root.querySelector('.sr-current-card h3').textContent,'meal');dom.window.close();
});
test('Offers near a town exclude other towns and a copied town fragment restores the right inventory',async()=>{
 const row=(id,town)=>({_id:id,_collection:'AffiliateOffers',title:id,locationName:town,category:'Food & Drink Offer',affiliate:true,active:true,affiliateUrl:'https://www.awin1.com/'+id});const {dom,root}=setup('/offers#town=York',[row('York meal','York'),row('London meal','London')]);await new Promise(r=>setTimeout(r,25));assert.equal(root.querySelectorAll('.sr-current-card').length,1);assert.equal(root.querySelector('.sr-current-card h3').textContent,'York meal');assert.ok(root.querySelector('[data-sr-current-town-offers] h2').textContent.endsWith('in York'));dom.window.location.hash='#town=London';await new Promise(r=>setTimeout(r,25));assert.equal(root.querySelector('.sr-current-card h3').textContent,'London meal');dom.window.close();
});
