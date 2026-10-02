const {installRouteFixture}=require('./test-support/route-fixture.cjs');
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('dist/sr.js','utf8');
const blocks=src.split(/(?=\/\* \[\d+\])/).slice(1);
const definitions=new Set([36,52,55,56,57,58,59,60,61,62,63,64,65,66,67,68,76,77,79,87,88,89,90,91,92]);
const pause=()=>new Promise(resolve=>setTimeout(resolve,25));
function setup(path){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('warn',(...a)=>errors.push(a.join(' ')));
 const dom=new JSDOM('<body><div id="SITE_CONTAINER"></div></body>',{url:'https://www.spin-raiders.com'+path,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};w.fetch=async()=>{throw Error('Unexpected network in fixture test')};
 const authority=installRouteFixture(w,blocks);for(const b of blocks)if(definitions.has(+b.match(/\[(\d+)\]/)[1]))w.eval(b);
 return {dom,w,errors,authority,run:n=>w.eval(blocks.find(b=>b.startsWith('/* ['+n+']')))};
}
(async()=>{
 const ctx=setup('/search?q=Southport'),{w}=ctx;
 const family={_collection:'Venues',_id:'funland',title:'Funland Southport',locationName:'Southport',venueType:'Family Amusement Centre / Adult Gaming Centre',familyFEC:true,familyEntertainmentCentre:true,amusementArcade:true,adultGamingCentre:true,familyFriendly:true,ageRestriction:'18+ in adult gaming area'};
 const adult={_collection:'Venues',_id:'adult',title:'Adult-only AGC',venueType:'Adult Gaming Centre',adultGamingCentre:true,familyFriendly:false,ageRestriction:'18+ only'};
 const cafe={_collection:'Venues',_id:'cafe',title:'Family cafe',venueType:'Cafe',familyFriendly:true};
 assert.deepEqual(Array.from(w.SR_PLACE_CATEGORIES(family)).sort(),['agc','venues']);
 assert.deepEqual(Array.from(w.SR_PLACE_CATEGORIES(adult)),['agc']);
 assert(!w.SR_PLACE_CATEGORIES(cafe).includes('venues'));
 const host=w.document.createElement('div');w.document.body.append(host);const shadow=host.attachShadow({mode:'open'});
 const view=w.SR_SEARCH_VIEW(shadow,{S:w.SR_PUBLIC_DIRECTORY.S,q:'Southport',href:w.SR_PLACE_HREF});ctx.authority.bind(family,'/arcade/funland/southport');ctx.authority.bind(adult,'/agc/adult-only/southport');ctx.authority.bind(cafe,'/food-and-drink/family-cafe/southport');await ctx.authority.annotate([family,adult,cafe]);view.setRecords([family,adult,cafe]);
 shadow.querySelector('[data-cat="venues"]').click();assert.equal(shadow.querySelectorAll('.result-card').length,1);assert.match(shadow.querySelector('[data-results]').textContent,/Funland/);assert.match(shadow.querySelector('[data-results]').textContent,/18\+ in adult gaming area/);
 shadow.querySelector('[data-cat="agc"]').click();assert.equal(shadow.querySelectorAll('.result-card').length,2);assert.match(shadow.querySelector('[data-results]').textContent,/Adult-only/);
 // Both frontend data readers must actually request the flags used above.
 for(const n of [48,79]){const b=blocks.find(b=>b.startsWith('/* ['+n+']'));for(const key of ['familyFEC','familyEntertainmentCentre','amusementArcade','adultGamingCentre'])assert(b.includes('"'+key+'"'),n+' missing projection '+key)}
 assert.equal(ctx.errors.length,0,ctx.errors.join('\n'));ctx.dom.window.close();
 const guides=['Blackpool','York'].map(town=>({_id:town+'-guide',_collection:'HotelGuides',slug:town.toLowerCase()+'-hotel',locationSlug:town.toLowerCase(),locationName:town,title:town+' Hotel',active:true}));
 const rows=['Blackpool','York'].flatMap(town=>[
 {_id:town+'-deal',_collection:'HotelOffers',hotelGuideId:town+'-guide',title:town+' attraction',locationName:town,category:'Attractions',offerTitle:'Two tickets',affiliateUrl:'https://example.com/'+town+'/deal'},
 {_id:town+'-stay',_collection:'HotelOffers',hotelGuideId:town+'-guide',title:town+' stay',locationName:town,category:'Hotel',affiliateUrl:'https://example.com/'+town+'/stay'}
 ]);
 for(const path of ['/offers?town=Blackpool','/?view=offers&town=Blackpool','/destination-recommendations?view=offers&town=Blackpool']){
  const ctx=setup(path);for(const guide of guides)ctx.authority.bind(guide,'/hotel/'+guide.slug+'/'+guide.locationSlug);for(const row of rows)ctx.authority.bind(row,'/hotel/'+row.locationName.toLowerCase()+'-hotel/'+row.locationName.toLowerCase(),{targetKey:'HotelGuides:'+row.hotelGuideId,recordRole:'offer'});ctx.w.SR_PUBLIC_DIRECTORY.D.rows=async collection=>ctx.authority.annotate(collection==='HotelGuides'?guides:collection==='HotelOffers'?rows:[]);ctx.run(78);await pause();const root=ctx.w.document.getElementById('sr-extended-pages').shadowRoot;
  assert.equal(root.querySelector('.hero-search input').value,'Blackpool');
  assert.match(root.querySelector('[data-results]').textContent,/Blackpool attraction/);assert.doesNotMatch(root.querySelector('[data-results]').textContent,/York/);
  assert.match(root.querySelector('[data-affiliate-cards]').textContent,/Blackpool stay/);assert.doesNotMatch(root.querySelector('[data-affiliate-cards]').textContent,/York/);
  const input=root.querySelector('.hero-search input');input.value='York';input.dispatchEvent(new ctx.w.Event('input',{bubbles:true}));
  assert.match(root.querySelector('[data-results]').textContent,/York attraction/);assert.match(root.querySelector('[data-affiliate-cards]').textContent,/York stay/);assert.doesNotMatch(root.querySelector('[data-affiliate-cards]').textContent,/Blackpool/);
  assert.equal(root.querySelectorAll('.affiliate-section').length,1);assert.equal(root.querySelector('[data-status]').textContent,'');assert.equal(ctx.errors.length,0,ctx.errors.join('\n'));ctx.dom.window.close();
 }
 const failed=setup('/offers?town=Blackpool');failed.w.SR_PUBLIC_DIRECTORY.D.rows=async()=>{throw Error('WDE0025')};failed.run(78);await pause();assert.match(failed.w.document.getElementById('sr-extended-pages').shadowRoot.querySelector('[data-status]').textContent,/Some categories could not load/);failed.dom.window.close();
 const venue=blocks.find(b=>b.startsWith('/* [117]'));assert(/SR_ROUTES\.viewPaths(?:\.offers|\["offers"\])/.test(venue));assert(!venue.includes('"/?view=offers"')); // The actual emitted CTA path and town query are verified in canonical-details.
 assert(!venue.includes('href="/destination-recommendations?view=offers">🏷️ View offers near here'));
 console.log('PASS mixed family/AGC filters and age text; required CMS projection; scoped offers/deals/accommodation filtering; redirected and root URL inputs; actual failure warning; location-preserving venue CTA');
})().catch(e=>{console.error(e);process.exitCode=1});
