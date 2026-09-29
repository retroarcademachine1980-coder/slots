const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs'),assert=require('node:assert/strict');
const src=fs.readFileSync(require('path').join(__dirname,'../dist/sr.js'),'utf8');
const blocks=src.split(/(?=\/\* \[\d+\])/).slice(1);
const pause=()=>new Promise(r=>setTimeout(r,60));
function setup(route){
 const errors=[],vc=new VirtualConsole();vc.on('warn',(...v)=>errors.push(v.join(' ')));vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<body><div id="SITE_CONTAINER"></div></body>',{url:'https://www.spin-raiders.com'+route,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};
 w.fetch=async url=>({ok:true,json:async()=>String(url).includes('stations.json')?[]:{petrolPence:172.01,dieselPence:195.53,date:'2026-09-21'}});
 const run=n=>w.eval(blocks.find(b=>b.startsWith('/* ['+n+']')));
 for(const n of [36,52,55,56,57,58,59,60,61,62,63,64,65,66,76,77,79,87,88,89,90,91,92])run(n);
 return {dom,w,run,errors};
}
(async()=>{
 const ctx=setup('/?explore=holiday-parks'),{w,run}=ctx;
 for(const [q,key] of [['cinemas in York','cinemas'],['nature reserves near York','outdoors'],['fishing lakes in Lincolnshire','fishing'],['beach','beaches']])assert.equal(w.SR_PARSE_PLACE_SEARCH(q).category,key);
 assert.equal(w.SR_CLASSIFY_PLACE({_collection:'Venues',title:'Barrow Arcade'}),'venues');
 assert.equal(w.SR_PLACE_HREF({_collection:'Locations','link-arcade-locations-title':'/arcade-locations/york'}),'/destination/york');
 assert(!w.SR_PLACE_HREF({_collection:'Venues',_id:'x'}).includes('undefined'));
 w.SR_PUBLIC_DIRECTORY.D.rows=async coll=>['York','Whitby'].map(t=>({_collection:coll,_id:t,title:t+' Holiday Park',category:'Holiday Park',locationName:t}));run(78);await pause();
 const root=w.document.querySelector('#sr-extended-pages').shadowRoot,inputs=[...root.querySelectorAll('input')].filter(e=>e.placeholder?.includes('Search a venue')||e.placeholder?.includes('Filter these'));
 assert.equal(inputs.length,2);
 for(const input of inputs){input.value='York';input.dispatchEvent(new w.Event('input',{bubbles:true}));assert(inputs.every(i=>i.value==='York'));assert(!root.querySelector('[data-results]').textContent.includes('Whitby'));}
 assert.equal(ctx.errors.length,0,ctx.errors.join('\n'));ctx.dom.window.close();
 for(const route of ['/?view=trip','/destination-recommendations?view=trip','/?explore=plan-a-trip']){
  const c=setup(route),{w,run}=c;
  w.SR_PUBLIC_DIRECTORY.D.rows=async coll=>[['Cinema','York Cinema'],['Nature Reserve','York Nature Reserve'],['Fishing Lake','York Fishing Lake']].map(([category,title])=>({_collection:coll,_id:title,category,title,locationName:'York'}));
  for(const n of [80,81,82,83,100])run(n);await pause();
  const r=w.document.querySelector('#sr-trip-pages')?.shadowRoot;assert(r,route+' full planner');
  const input=r.querySelector('.add-search input');input.value='York';
  for(const key of ['cinemas','outdoors','fishing']){
   r.querySelector('[data-category="type:'+key+'"]').click();await pause();
   assert.equal(r.querySelectorAll('.add-results article').length,1,key);
   r.querySelector('[data-add]').click();
  }
  assert.equal(r.querySelectorAll('.stop').length,3);
  assert(r.querySelector('[data-fuel-source]'),'fuel controls');
  await pause();assert.equal(r.querySelector('[name=fuelPence]').value,'172.01');
  const saved=JSON.parse(w.localStorage.getItem('sr-trip-v1'));assert(saved.stops.every(s=>s.url&&!s.url.includes('undefined')));
  assert.equal(c.errors.length,0,c.errors.join('\n'));c.dom.window.close();
 }
 console.log('PASS synchronized directory searches, category aliases, safe links, all planner routes, cinema/nature/fishing stops and live fuel integration');
})().catch(e=>{console.error(e);process.exitCode=1});
