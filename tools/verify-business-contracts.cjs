const {installRouteFixture}=require('./test-support/route-fixture.cjs');
const {JSDOM, VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const path=require('node:path');
const base=path.resolve(process.argv[2]||path.join(__dirname,'..'))+path.sep;
const src=fs.readFileSync(base+'dist/sr.js','utf8');
const blocks=src.split(/(?=\/\* \[\d+\])/).slice(1);
const block=n=>blocks.find(b=>b.startsWith('/* ['+n+']'));
const fixture=n=>{const x=JSON.parse(fs.readFileSync(base+'tests/fixtures/'+n)).dataItem;return {...x.data,_id:x.id,_collection:x.dataCollectionId}};
const imperial=fixture('HotelGuides-hotel-the-imperial-hotel-blackpool.json');
const laurels=fixture('HotelGuides-hotel-the-laurels.json');
const imperialOffer=fixture('HotelOffers-wowcher_blackpool_imperial_2026.json');
const laurelsOffer=fixture('HotelOffers-1bdf5d7a-5a87-4995-be48-2d9c41eab750.json');
const tick=()=>new Promise(r=>setTimeout(r,15));
function make(path='/'){
 const vc=new VirtualConsole(); const errors=[];vc.on('jsdomError',e=>errors.push(e.message));
 const d=new JSDOM('<head></head><body><div id="SITE_CONTAINER"></div></body>',{url:'https://www.spin-raiders.com'+path,runScripts:'outside-only',virtualConsole:vc});
 const w=d.window;w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};const authority=installRouteFixture(w,blocks);w.__routeFixture=authority;authority.bind(imperial,'/hotel/the-imperial-hotel-blackpool/blackpool');authority.bind(laurels,'/hotel/the-laurels/blackpool');authority.bind(imperialOffer,'/hotel/the-imperial-hotel-blackpool/blackpool',{targetKey:'HotelGuides:'+imperial._id,recordRole:'offer'});authority.bind(laurelsOffer,'/hotel/the-laurels/blackpool',{targetKey:'HotelGuides:'+laurels._id,recordRole:'offer'});w.eval(block(79));w.eval(block(138));w.eval(block(141));w.eval(block(142));return {d,w,errors,authority};
}
const tests=[];function test(name,fn){tests.push([name,fn])}
function mockFetch(w,data){const calls=[],prior=w.fetch;w.fetch=async(url,opts)=>{if(url.startsWith('/_functions/'))return prior(url,opts);if(url.includes('/oauth2/'))return {ok:true,json:async()=>({access_token:'test',expires_in:5000})};const q=JSON.parse(opts.body);calls.push(q);const rows=data[q.dataCollectionId]||[];return {ok:true,json:async()=>({dataItems:rows.map(row=>({id:row._id,data:q.query.fields?Object.fromEntries(q.query.fields.filter(f=>f in row).map(f=>[f,row[f]])):row}))})}};return calls}
function mockGuide(w,guide,offers,more=[]){w.SR_PUBLIC_DIRECTORY.S.archiveQuery=async(q,a,b,c)=>({dataItems:(c==='HotelOffers'?offers:q.paging.limit===2?[guide]:more).map(row=>({id:row._id,data:row}))})}
test('Offer discovery preserves readiness fields under actual CMS projection',async()=>{
 const {d,w}=make();try{mockFetch(w,{HotelGuides:[imperial],HotelOffers:[{...imperialOffer,guideReady:false}],AffiliateOffers:[]});const outcomes=await w.SR_CANONICAL.offerOutcomes(w.SR_PUBLIC_DIRECTORY.D);assert.equal(outcomes[1].value.length,0,'guideReady=false offer remains visible because field is not projected');}finally{d.window.close()}
});
test('Offer discovery preserves canonicalMachineId suppression under actual CMS projection',async()=>{
 const {d,w}=make();try{mockFetch(w,{HotelGuides:[imperial],HotelOffers:[{...imperialOffer,canonicalMachineId:'duplicate-parent'}],AffiliateOffers:[]});const outcomes=await w.SR_CANONICAL.offerOutcomes(w.SR_PUBLIC_DIRECTORY.D);assert.equal(outcomes[1].value.length,0,'canonicalMachineId offer remains visible because field is not projected');}finally{d.window.close()}
});
test('Laurels real fixture removes stale generated affiliate section',async()=>{
 const {d,w}=make('/hotel/the-laurels/blackpool');try{mockGuide(w,laurels,[laurelsOffer]);w.eval(block(132));await tick();const root=w.document.querySelector('#sr-place-page').shadowRoot;assert.equal(root.querySelectorAll('article a').length,0,'8 obsolete affiliate links survived because source has END but missing START marker');}finally{d.window.close()}
});
test('Guide rejects explicit conflicting offer association',async()=>{
 const {d,w}=make('/hotel/the-imperial-hotel-blackpool/blackpool');try{mockGuide(w,imperial,[{...imperialOffer,hotelGuideId:'hotel-other-property',affiliateUrl:'https://example.com/wrong-property'}]);w.eval(block(132));await tick();const root=w.document.querySelector('#sr-place-page').shadowRoot;assert.equal(root.querySelectorAll('#booking-options a').length,0,'offer whose explicit hotelGuideId is another property is rendered due to stale offerIds membership');}finally{d.window.close()}
});
function route(w,path){w.history.pushState({},'',path);w.dispatchEvent(new w.PopStateEvent('popstate'));}
function dynamicGuideMock(w,delay){w.SR_PUBLIC_DIRECTORY.S.archiveQuery=async(q,a,b,c)=>{
 if(delay){const result=delay(q,c);if(result)return await result;}
 const guide=(q.filter?.$and||[]).some(f=>f.slug?.$eq===laurels.slug)?laurels:imperial;
 return {dataItems:(c==='HotelOffers'?[]:q.paging.limit===2?[guide]:[]).map(row=>({id:row._id,data:row}))};
};}
test('Town offer strip projects pricing, keeps town scope, and routes every card through a guide',async()=>{
 const {d,w}=make('/destination/blackpool');try{
 const londonGuide={...imperial,_id:'london-guide',slug:'london-hotel',locationSlug:'london',locationName:'London',offerIds:['london-offer']};
 const londonOffer={...imperialOffer,_id:'london-offer',hotelGuideId:'london-guide',locationSlug:'london',locationName:'London',destination:'London',destinationSlug:'london'};
 w.__routeFixture.bind(londonGuide,'/hotel/london-hotel/london');w.__routeFixture.bind(londonOffer,'/hotel/london-hotel/london',{targetKey:'HotelGuides:london-guide',recordRole:'offer'});
 const calls=mockFetch(w,{HotelGuides:[imperial,londonGuide],HotelOffers:[{...imperialOffer,wasPrice:'£200',dealPrice:'£100',dealBoughtCount:50},londonOffer],AffiliateOffers:[]});
 const host=w.document.createElement('div');host.id='sr-location-directory';w.document.body.append(host);const root=host.attachShadow({mode:'open'});root.innerHTML='<div class="results-heading"></div>';w.eval(block(122));await tick();
 assert.deepEqual(calls.map(c=>c.dataCollectionId).sort(),['AffiliateOffers','HotelGuides','HotelOffers']);const cards=[...root.querySelectorAll('.srtd-card')];assert.equal(cards.length,1);assert.equal(cards[0].getAttribute('href'),'/hotel/the-imperial-hotel-blackpool/blackpool');assert.equal(cards[0].querySelector('s')?.textContent,'£200');assert.equal(cards[0].getAttribute('target'),null);assert(!root.textContent.includes('London'));
 }finally{d.window.close()}
});
test('Town offer strip surfaces source failure instead of quietly disappearing',async()=>{
 const {d,w}=make('/destination/blackpool');try{w.SR_PUBLIC_DIRECTORY.D.rows=async()=>{throw Error('offline')};const host=w.document.createElement('div');host.id='sr-location-directory';w.document.body.append(host);const root=host.attachShadow({mode:'open'});root.innerHTML='<div class="results-heading"></div>';w.eval(block(122));await tick();assert.match(root.querySelector('[role=status]')?.textContent||'',/could not load/);assert.equal(root.querySelectorAll('.srtd-card').length,0)}finally{d.window.close()}
});
test('Actual provider eligibility rejects every suppression flag, invalid date and unsafe URL',async()=>{
 const {d,w}=make();try{const api=w.SR_CANONICAL;assert(api.offerLive(imperialOffer));
 for(const field of ['active','directoryReady','guideReady','cardReady','revenueReady'])assert.equal(api.offerLive({...imperialOffer,[field]:false}),false,field);
 for(const status of ['duplicate','merged','deleted','archived','quarantined','suppressed','permanently closed','closed'])assert.equal(api.offerLive({...imperialOffer,status}),false,status);
 for(const validUntil of ['2001-01-01',{$date:'2001-01-01T00:00:00Z'},'not-a-date'])assert.equal(api.offerLive({...imperialOffer,validUntil}),false,JSON.stringify(validUntil));
 assert.equal(api.outbound({...imperialOffer,affiliateUrl:'javascript:alert(1)',offerUrl:'https://example.com/approved'}),'https://example.com/approved');
 assert.equal(api.outbound({affiliateUrl:'https://user:password@example.com/',offerUrl:'javascript:bad()',bookingUrl:'data:text/html,secret'}),'');
 }finally{d.window.close()}
});
test('Final hotel renderer strips active nested markup while preserving readable guide prose',async()=>{
 const {d,w,authority}=make('/hotel/the-imperial-hotel-blackpool/blackpool');try{
 const dirty={...imperial,guideContent:'<p>Retained property prose.</p><script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)"><svg onload="alert(4)"><script>alert(5)</script></svg><strong onclick="alert(6)">Visible text</strong></a><iframe src="https://example.com"></iframe>'};
 authority.bind(dirty,'/hotel/the-imperial-hotel-blackpool/blackpool');mockGuide(w,dirty,[imperialOffer]);w.eval(block(132));await tick();const article=w.document.querySelector('#sr-place-page').shadowRoot.querySelector('article');
 assert.match(article.textContent,/Retained property prose/);assert.match(article.textContent,/Visible text/);assert.equal(article.querySelector('script,img,svg,iframe,[onclick],[onerror],[onload],a[href^="javascript:"]'),null);
 }finally{d.window.close()}
});
(async()=>{let failed=0;for(const[name,fn]of tests){try{await fn();console.log('PASS',name)}catch(e){failed++;console.log('FAIL',name,'\n ',e.message)}}console.log(`${tests.length-failed}/${tests.length} review assertions passed`);process.exitCode=failed?1:0})();
