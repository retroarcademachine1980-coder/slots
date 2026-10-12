const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync(require('node:path').join(__dirname,'../dist/sr-current-offers-20261012.js'),'utf8');
function setup(path,rows){
 const dom=new JSDOM('<body></body>',{url:'https://www.spin-raiders.com'+path,runScripts:'outside-only',pretendToBeVisual:true});
 const el=dom.window.document.createElement('div');el.id=path.startsWith('/destination/')?'sr-location-directory':'sr-extended-pages';dom.window.document.body.append(el);const root=el.attachShadow({mode:'open'});root.innerHTML='<main><section class="hero"></section><div class="results-heading"><h1>Explore York</h1></div></main>';
 dom.window.SR_CANONICAL={offerLive:r=>r.active!==false,normalizeOffer:r=>r,outbound:r=>r.affiliateUrl||'',hotelHref:r=>r._collection==='HotelOffers'?'/hotel/'+r._id+'/york':''};
 dom.window.SR_PUBLIC_DIRECTORY={D:{rows:async name=>rows.filter(r=>r._collection===name)}};
 dom.window.eval(script);return {dom,root};
}
test('Town offer section retains food and attraction offers, keeps guide links and hides expired records',async()=>{
 const row=(id,type,extra={})=>({_id:id,_collection:type,title:id,locationSlug:'york',locationName:'York',affiliate:true,active:true,affiliateUrl:'https://www.awin1.com/'+id,...extra});
 const {dom,root}=setup('/destination/york',[row('hotel','HotelOffers'),row('food','AffiliateOffers',{category:'Food & Drink Offer'}),row('show','AffiliateOffers',{category:'Attraction Offer'}),row('expired','AffiliateOffers',{offerValidUntil:{$date:'2020-01-01'}}),row('disabled','AffiliateOffers',{active:false}),row('not-a-partner','AffiliateOffers',{affiliate:false,affiliateUrl:'https://example.com'})]);
 await new Promise(r=>setTimeout(r,25));
 assert.equal(root.querySelectorAll('.sr-current-card').length,3);
 assert.ok(root.querySelector('a[href="/hotel/hotel/york"]'));
 assert.ok(root.querySelector('a[href="/offers?offer=food"]'));
 root.querySelector('[data-offer-category="food"]').click();assert.equal(root.querySelectorAll('.sr-current-card').length,1);assert.equal(root.querySelector('.sr-current-card h3').textContent,'food');
 dom.window.close();
});
test('An offer card opens its own details with the original affiliate link and disclosure',async()=>{
 const row={_id:'winter-fair',_collection:'AffiliateOffers',title:'Winter fair',category:'Christmas Fair',affiliate:true,active:true,affiliateUrl:'https://www.awin1.com/cread.php?awinaffid=3089397',summary:'Venue and date details.'};
 const {dom,root}=setup('/offers?offer=winter-fair',[row]);await new Promise(r=>setTimeout(r,25));
 const article=root.querySelector('[data-sr-current-offer-detail]');assert.ok(article);const a=article.querySelector('.booking');assert.equal(a.getAttribute('href'),row.affiliateUrl);assert.equal(a.getAttribute('rel'),'sponsored noopener');assert.ok(article.textContent.includes('Spin Raiders may earn a commission'));
 dom.window.close();
});
