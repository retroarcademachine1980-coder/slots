const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync(require('node:path').join(__dirname,'../dist/sr.js'),'utf8');
const blocks=src.split(/(?=\/\* \[\d+\])/).slice(1);
function setup(path){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('warn',(...a)=>errors.push(a.join(' ')));
 const dom=new JSDOM('<body><div id="sr-seaside-root"></div></body>',{url:'https://www.spin-raiders.com'+path,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};
 const run=n=>w.eval(blocks.find(b=>b.startsWith('/* ['+n+']')));
 run(89);run(79);return {dom,w,run,errors};
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pause=()=>new Promise(r=>setTimeout(r,20));
(async()=>{
 const search=setup('/search?q=York'),{w,run}=search;run(67);run(68);
 const host=w.document.createElement('div');w.document.body.append(host);const shadow=host.attachShadow({mode:'open'});
 const view=w.SR_SEARCH_VIEW(shadow,{S:{e:escape},q:'York',href:r=>'/search?q='+encodeURIComponent(r.title)});
 view.setRecords([{_collection:'Venues',_id:'a',title:'York Arcade',locationName:'York'},{_collection:'DestinationRecommendations',_id:'h',title:'York Hotel',category:'Hotel',locationName:'York'}]);
 assert.equal(shadow.querySelectorAll('.categories .sr-gicon').length,w.SR_PLACE_TYPES.length+3);
 shadow.querySelector('[data-cat="venues"]').click();assert.match(shadow.querySelector('[data-count]').textContent,/1 result/);assert.match(shadow.querySelector('[data-results]').textContent,/York Arcade/);
 shadow.querySelector('[data-cat="stays"]').click();assert.match(shadow.querySelector('[data-results]').textContent,/York Hotel/);
 assert.equal(search.errors.length,0,search.errors.join('\n'));search.dom.window.close();
 for(const failure of [false,true]){
  const ctx=setup('/map?q=York'),{w,run}=ctx;let calls=0;
  w.SR_SEASIDE={e:escape,archiveQuery:async(q,_,__,collection)=>{calls++;return {dataItems:collection==='Venues'?[{id:'a',data:{title:'York Arcade',locationName:'York',latitude:53.96,longitude:-1.08}}]:[]}}};
  w.SR_SEARCH_DATA={norm:x=>String(x).toLowerCase(),href:()=>'/arcade-venues/york-arcade'};
  run(69);run(70);await pause();
  const root=w.document.querySelector('#sr-approved-map').shadowRoot;
  assert(calls>=3,'Listings must start without waiting for Leaflet');assert.equal(root.querySelectorAll('.categories .sr-gicon').length,15);assert.match(root.querySelector('.map-results').textContent,/York Arcade/);
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
