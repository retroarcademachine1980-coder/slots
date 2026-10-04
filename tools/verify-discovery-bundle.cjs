const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs');const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../dist'))+path.sep;
const routeFixture=process.env.SR_ROUTE_FIXTURE||'unavailable';
assert(['unavailable','offline'].includes(routeFixture),'Unknown route fixture mode');
(async()=>{
for(const route of ['/arcade','/arcade?type=family','/arcade?type=classic','/casinos','/seaside','/tours','/attractions','/zoos','/theme-parks','/food-and-drink','/hidden-gems','/places-to-stay','/outdoors','/holiday-parks','/arcade-bars','/agc','/offers','/cinemas','/fishing-lakes','/bowling','/bingo-halls','/museums','/historical-sites','/sea-life','/piers','/beaches','/services','/family-fun','/retro-video-games','/days-out','/?explore=zoos','/?explore=theme-parks','/?explore=food-drink','/?explore=hidden-gems','/?explore=places-to-stay','/?explore=nature-outdoors','/?explore=holiday-parks','/?explore=arcade-bars','/?view=agc','/destination-recommendations?view=offers']){
 const errors=[],expectedIssues=[];const vc=new VirtualConsole();vc.on('warn',(...a)=>{const message=a.join(' '),expected='Canonical route unavailable '+(routeFixture==='offline'?'route_service_unavailable':'fixture_intentionally_unavailable');if(message===expected)expectedIssues.push(message);else errors.push(message);});vc.on('error',(...a)=>errors.push(a.join(' ')));vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<!doctype html><html><head></head><body><div id="SITE_CONTAINER"></div></body></html>',{url:'https://www.spin-raiders.com'+route,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;
 // Track only resources created in this JSDOM window. Disconnect observers before
 // close() mutates the document, then cancel their outstanding animation frames.
 // Callbacks run normally during the test; no runtime errors are swallowed.
 const observers=new Set(),frames=new Set();
 const NativeMutationObserver=w.MutationObserver;
 w.MutationObserver=class extends NativeMutationObserver{
  constructor(callback){super(callback);observers.add(this)}
 };
 const requestFrame=w.requestAnimationFrame.bind(w),cancelFrame=w.cancelAnimationFrame.bind(w);
 w.requestAnimationFrame=callback=>{const id=requestFrame(time=>{frames.delete(id);callback(time)});frames.add(id);return id};
 w.cancelAnimationFrame=id=>{frames.delete(id);cancelFrame(id)};
 try{
 w.matchMedia=()=>({matches:false,addEventListener(){}});
 // Model the single current route authority. Explicit blocked/offline outcomes must
 // keep artwork/readable cards while exposing no dead route. Positive canonical
 // payloads and preserved data are covered by frontend-authority/curated-home.
 const requests=[];
 w.fetch=async(url,options={})=>{
  try{
   assert.equal(url,'/_functions/canonicalRoutes');assert.equal(options.method,'POST');
   assert.equal(options.headers?.['Content-Type'],'application/json');const body=JSON.parse(options.body);
   assert(Array.isArray(body.requests));assert(body.requests.length>0);requests.push(...body.requests);
   if(routeFixture==='offline')return {ok:false,status:503,json:async()=>({ok:false})};
   return {ok:true,status:200,json:async()=>({ok:true,results:body.requests.map(item=>({key:item.collection+':'+item.id,ok:false,code:'fixture_intentionally_unavailable',recordRole:'business'}))})};
  }catch(error){errors.push('Unexpected fetch contract: '+error.message);throw error;}
 };
 require('./test-support/release-fingerprint-fixture.cjs').installFingerprintFixture(w,fs.readFileSync(root+'sr.core.min.js','utf8'));
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 w.eval(fs.readFileSync(root+'sr.core.min.js','utf8'));
 w.SR_PUBLIC_DIRECTORY.D.rows=async()=>[];
 w.eval(fs.readFileSync(root+'sr.discovery.min.js','utf8'));
 await new Promise(r=>setTimeout(r,450));
 const extended=w.document.querySelector('#sr-extended-pages');
 const cat=w.document.querySelector('#sr-seaside-root')?.shadowRoot?.querySelector('#sr-home-approved-20260921')?.shadowRoot;
 assert(extended||cat,'missing page '+route);
 if(requests.length)assert(expectedIssues.length>0,'authority failure must remain observable');
 const surface=extended?.shadowRoot||cat;
 for(const card of surface.querySelectorAll('[data-route-unavailable]')){assert.equal(card.tagName,'ARTICLE');assert.equal(card.querySelector('a[href]'),null);assert.match(card.textContent,/temporarily unavailable/);}
 assert.equal(surface.querySelectorAll('a[href*="?collection="],a[href^="/arcade-venues/"],a[href^="/classic-fruit-machine-archive"]').length,0,'no retired detail link may survive');
 assert.equal(errors.length,0,route+' '+errors.join('\n'));
 if(extended){assert(w.document.querySelector('#sr-brand-header'),'missing header '+route);assert(w.document.querySelector('#sr-brand-footer'),'missing footer '+route)}
 }finally{
  for(const observer of observers)observer.disconnect();
  observers.clear();
  for(const id of frames)cancelFrame(id);
  frames.clear();
  dom.window.close();
 }
 // Surface any teardown-time errors rather than hiding them after the last check.
 await new Promise(resolve=>setTimeout(resolve,25));
 assert.equal(errors.length,0,route+' '+errors.join('\n'));
 console.log('PASS '+route+' [route authority '+routeFixture+']');
}
})().catch(e=>{console.error(e);process.exitCode=1});
