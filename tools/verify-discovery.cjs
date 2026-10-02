const {installRouteFixture}=require('./test-support/route-fixture.cjs');
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs');
const assert=require('node:assert/strict');
const root=require('node:path').join(__dirname,'../dist/');
const src=fs.readFileSync(root+'sr.js','utf8');
const blocks=src.split(/(?=\/\* \[\d+\])/).slice(1);
const defNumbers=new Set([140,52,55,56,57,58,59,60,61,62,63,64,65,66,76,77,79,87,88,89,90,91,92]);
function make(route){
 const errors=[],routeIssues=[];
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('warn',(...a)=>{const warning=a.join(' ');if(warning==='Canonical route unavailable fixture_identity_unavailable')routeIssues.push(warning);else errors.push(warning);});
 const dom=new JSDOM('<!doctype html><html><head></head><body><div id="SITE_CONTAINER"></div></body></html>',{url:'https://www.spin-raiders.com'+route,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.matchMedia=()=>({matches:false,addEventListener(){}});w.fetch=async()=>{throw Error('Unexpected network in isolated render test')};
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 const authority=installRouteFixture(w,blocks);for(const b of blocks)if(defNumbers.has(+b.match(/\[(\d+)\]/)[1]))w.eval(b);
 w.SR_PUBLIC_DIRECTORY.D.rows=async()=>[];return {dom,w,errors,authority,routeIssues};
}
(async()=>{
 const {dom,w,errors,routeIssues}=make('/?explore=zoos');
 const keys=Object.keys(w.SR_CATEGORY_PAGES);
 let cropCount=0,links=0;
 for(const key of keys){
  const host=w.document.createElement('div');w.document.body.append(host);const shadow=host.attachShadow({mode:'open'});
  w.SR_RENDER_CATEGORY(shadow,w.SR_CATEGORY_PAGES[key]);await w.SR_STATIC_CARDS.hydrate(w.SR_CATEGORY_PAGES[key].cards||[]);await new Promise(r=>setTimeout(r,0));
  assert(shadow.querySelector('main'),key+' main missing');for(const card of shadow.querySelectorAll('[data-route-unavailable]')){assert.equal(card.tagName,'ARTICLE');assert.equal(card.querySelector('a[href]'),null);assert.match(card.textContent,/temporarily unavailable/);}
  assert(shadow.querySelector('.footer-live'),key+' footer missing');
  assert(shadow.querySelector('.nav-search'),key+' search missing');
  shadow.querySelector('.nav-search').click();assert(shadow.querySelector('#sd').open,key+' search dialog');
  for(const a of shadow.querySelectorAll('a[href]')){assert(!/undefined|javascript:/.test(a.href),key+' invalid link');links++}
  for(const el of shadow.querySelectorAll('[style]')){
   for(const match of el.getAttribute('style').matchAll(/https[^)]+\/crop\/[^)]+/g)){
    assert.equal((match[0].match(/\/v1\//g)||[]).length,1,key+' nested transform');cropCount++;
   }
  }
  host.remove();
 }
 assert.equal(errors.length,0,errors.join('\n'));dom.window.close();
 assert(routeIssues.length>0,'explicit fixture-unavailable routes should be reported');console.log(JSON.stringify({categoryPages:keys.length,cropUrls:cropCount,linksChecked:links,expectedUnavailableRouteIssues:routeIssues.length}));
 const routes=['/?view=agc','/?explore=agc','/destination-recommendations?view=agc','/agc','/?explore=nature-outdoors','/?explore=holiday-parks','/?explore=arcade-bars','/?view=offers','/?explore=cinema','/?explore=bingo','/?explore=services','/?explore=bowling'];
 for(const route of routes){
  const {dom,w,errors,authority}=make(route);
  const sample={_collection:'Venues',_id:'test1',title:'Sample Venue',locationName:'York',category:'Arcade Bar',heroImage:'https://static.wixstatic.com/media/photo.jpg'};authority.bind(sample,'/arcade-bars/sample-venue/york');w.SR_PUBLIC_DIRECTORY.D.rows=async coll=>authority.annotate(coll==='Venues'?[sample]:[]);
  w.eval(blocks.find(b=>b.startsWith('/* [78]')));
  await new Promise(r=>setTimeout(r,10));
  const s=w.document.querySelector('#sr-extended-pages')?.shadowRoot;
  assert(s,route+' failed to mount');
  const buttons=[...s.querySelectorAll('.topics button')];assert(buttons.length>0,route+' topics');
  assert(buttons.every(b=>b.querySelector('svg.sr-gicon')),route+' non-SVG topic');
  assert(!s.querySelector('[data-count]').textContent.includes('Finding'),route+' stuck loading');
  assert.equal(errors.length,0,route+errors.join('\n'));dom.window.close();
 }
 console.log('Directory routes: '+routes.length+' passed');
 // Shared header and footer have separate shadow roots on directory pages.
 const separate=make('/?explore=nature-outdoors');
 const header=separate.w.document.createElement('div'),footer=separate.w.document.createElement('div');footer.id='sr-brand-footer';
 separate.w.document.body.append(header,footer);
 const hs=header.attachShadow({mode:'open'}),fsr=footer.attachShadow({mode:'open'});
 hs.innerHTML=separate.w.SR_SHELL.head(0);fsr.innerHTML=separate.w.SR_SHELL.foot();
 separate.w.SR_SHELL.wire(hs);separate.w.SR_SHELL.wire(fsr);hs.querySelector('.nav-search').click();assert(fsr.querySelector('#sd').open);separate.dom.window.close();
 console.log('Separate header/footer search: passed');
})().catch(e=>{console.error(e);process.exitCode=1});
