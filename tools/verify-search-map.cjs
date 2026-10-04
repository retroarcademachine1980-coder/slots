const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {installRouteFixture}=require('./test-support/route-fixture.cjs');
const src=fs.readFileSync(require('node:path').join(__dirname,'../dist/sr.js'),'utf8');
const blocks=src.split(/(?=\/\* \[\d+\])/).slice(1);
function setup(path){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('warn',(...a)=>errors.push(a.join(' ')));
 const dom=new JSDOM('<body><div id="sr-seaside-root"></div></body>',{url:'https://www.spin-raiders.com'+path,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};
 const run=n=>w.eval(blocks.find(b=>b.startsWith('/* ['+n+']')));
 const fixture=installRouteFixture(w,blocks);run(89);run(79);return {dom,w,run,errors,fixture};
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pause=()=>new Promise(r=>setTimeout(r,20));
(async()=>{
 const search=setup('/search?q=York'),{w,run}=search;run(67);run(68);
 const host=w.document.createElement('div');w.document.body.append(host);const shadow=host.attachShadow({mode:'open'});
 const view=w.SR_SEARCH_VIEW(shadow,{S:{e:escape},q:'York',href:w.SR_PLACE_HREF});
 const rows=[search.fixture.bind({_collection:'Venues',_id:'a',title:'York Arcade',locationName:'York'},'/arcade/york-arcade/york'),search.fixture.bind({_collection:'HotelGuides',_id:'h',title:'York Hotel',category:'Hotel',locationName:'York'},'/hotel/york-hotel/york')];
 view.setRecords(await search.fixture.annotate(rows));
 assert.equal(shadow.querySelectorAll('.categories .sr-gicon').length,w.SR_PLACE_TYPES.length+3);
 shadow.querySelector('[data-cat="venues"]').click();assert.match(shadow.querySelector('[data-count]').textContent,/1 result/);assert.match(shadow.querySelector('[data-results]').textContent,/York Arcade/);
 shadow.querySelector('[data-cat="stays"]').click();assert.match(shadow.querySelector('[data-results]').textContent,/York Hotel/);assert.equal(shadow.querySelector('.result-card a').getAttribute('href'),'/hotel/york-hotel/york');assert.equal(search.fixture.requests.length,2);
 assert.equal(search.errors.length,0,search.errors.join('\n'));search.dom.window.close();
 for(const failure of [false,true]){
  const ctx=setup('/map?q=York'),{w,run}=ctx;const calls=[];
  const row=ctx.fixture.bind({_id:'a',_collection:'Venues',title:'York Arcade',locationName:'York',latitude:53.96,longitude:-1.08},'/arcade/york-arcade/york');
  w.SR_SEASIDE={e:escape,archiveQuery:async(q,_,__,collection)=>{calls.push({q,collection});return w.SR_ROUTE_UI.hydrateResult({dataItems:collection==='Venues'?[{id:'a',data:row}]:[]},collection)}};
  w.SR_SEARCH_DATA={norm:x=>String(x).toLowerCase(),href:w.SR_PLACE_HREF};
  run(69);run(70);await pause();
  const root=w.document.querySelector('#sr-approved-map').shadowRoot;
  assert.deepEqual(calls.filter(c=>c.q.paging.limit===500).map(c=>c.collection).sort(),['AffiliateOffers','FoodAndDrink','HotelGuides','NearbyAttractions','Venues'],'Each source listing starts once without waiting for Leaflet');assert.equal(root.querySelector('.place a.visit').getAttribute('href'),'/arcade/york-arcade/york');assert(ctx.fixture.requests.length>=1,'Map hydrates through real authority');assert.equal(root.querySelectorAll('.categories .sr-gicon').length,15);assert.match(root.querySelector('.map-results').textContent,/York Arcade/);
  const script=w.document.querySelector('script[src*="leaflet"]');assert(script);
  if(failure){script.onerror();await pause();assert.match(root.querySelector('.map-count').textContent,/Map unavailable/);root.querySelector('[data-update]').click();assert.match(root.querySelector('.map-count').textContent,/Map unavailable/)}
  else{
   const pins=[];const map={setView(){return this},fitBounds(){},invalidateSize(){}};
   w.ResizeObserver=class{observe(){}};
   w.L={map:()=>map,tileLayer:()=>({addTo(){}}),layerGroup:()=>({addTo(){return this},clearLayers(){pins.length=0}}),divIcon:x=>x,marker:(coords,opts)=>({addTo(){pins.push(opts.icon.html);return this},getElement(){return null},on(){}}),latLngBounds:x=>x};
   script.onload();await pause();assert.equal(pins.length,1);assert(pins[0].includes('sr-gicon'));assert.match(root.querySelector('.map-count').textContent,/Showing 1 places/);
  }
  assert.equal(ctx.errors.length,0,ctx.errors.join('\n'));ctx.dom.window.close();
 }
 console.log('PASS search category filtering; map data before Leaflet; SVG markers; map failure fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
