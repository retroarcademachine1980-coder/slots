import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
const root=fileURLToPath(new URL('../',import.meta.url));
const blocks=fs.readFileSync(path.join(root,'dist/sr.js'),'utf8').split(/(?=\/\* \[\d+\])/).slice(1);
const block=number=>{const source=blocks.find(value=>value.startsWith('/* ['+number+']'));assert(source,'Missing compiled module '+number);return source;};
const after=block(81),adapter=block(79),routes=block(83);
const href=routes.match(/u = (\(e,params=\{\}\) => \{[^\n]+\}),/)[1];
const rows={Locations:[{_id:'ashby',title:'Ashby',image:'https://example.com/ashby.jpg',publicRating:5},{_id:'cleethorpes',title:'Cleethorpes',image:'https://example.com/cleethorpes.jpg',publicRating:5},{_id:'grimsby',title:'Grimsby',publicRating:4}],FoodAndDrink:[{_id:'pizza',title:'Pizza Parlour',locationName:'Grimsby',category:'Restaurant'},{_id:'masala',title:'The Masala n Malt',locationName:'Grimsby',category:'Restaurant'}],NearbyAttractions:[{_id:'heritage',title:'Grimsby Fishing Heritage Centre',category:'Museum'}]};
function setup(source,url='https://www.spin-raiders.com/plan-a-trip',options={}){const d=new JSDOM('<body><div id="host"></div></body>',{url,runScripts:'outside-only'}),w=d.window;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.structuredClone=structuredClone;w.HTMLElement.prototype.scrollIntoView=function(){};w.SR_ROUTES={viewPaths:{trip:'/plan-a-trip'},href:r=>'/destination/'+r._id};w.SR_ROUTE_UI={businessRows:r=>r,key:r=>r._collection+':'+r._id,ready:()=>true};w.eval(adapter);w.eval(source);const r=w.document.getElementById('host').attachShadow({mode:'open'}),content=w.document.createElement('div');r.append(content);let copied='',writes=[];Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async value=>{copied=value;}}});const trip={stops:[{id:'preserved',name:'A family day – Grimsby & Cleethorpes',day:1,time:'10:00',url:'/destination/grimsby',image:'https://example.com/own.jpg'}],people:3,days:1,nights:0,rooms:1,mpg:40,fuelPence:190.7,fuelType:'diesel',fuelAuto:false,tripTitle:'The boys’ day & tea'};w.SR_TRIP_BUILDER({root:r,content,S:{e:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),safePhoto:r=>r.image||'',fit:s=>s},D:{rows:async coll=>(rows[coll]||[]).map(x=>({...x,_collection:coll}))},e:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),get:(k,f)=>f,put:(k,v)=>writes.push([k,structuredClone(v)]),href:w.eval('('+href+')'),photo:t=>t.image||'',params:new w.URLSearchParams(new w.URL(url).search),trip:options.empty?null:structuredClone(trip),allTrips:[]});return {d,w,r,copied:()=>copied,writes,trip};}
async function search(c,q){c.r.querySelector('.add-search input').value=q;c.r.querySelector('.add-search').dispatchEvent(new c.w.Event('submit',{bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,20));return [...c.r.querySelectorAll('.add-results article h3')].map(n=>n.textContent);}

await test('compiled planner keeps an exact named town visible alongside food and attraction choices',async()=>{
 const c=setup(after);
 try{
  const results=await search(c,'Grimsby');
  assert.equal(results[0],'Grimsby');
  assert(!results.includes('Ashby'));
  for(const name of ['Pizza Parlour','The Masala n Malt','Grimsby Fishing Heritage Centre'])assert(results.includes(name));
  assert.equal(results.length,4);
  assert.equal((await search(c,'  GRIMSBY  '))[0],'Grimsby');
  assert.deepEqual((await search(c,'coast')).slice(0,2),['Ashby','Cleethorpes']);
  assert.equal(c.r.querySelectorAll('.stop').length,1);
  assert.equal(c.writes.length,0);
 }finally{c.d.window.close();}
});
await test('compiled planner shares the native route and round-trips Unicode without overwriting the current trip',async()=>{
 const c=setup(after);let restored;
 try{
  c.r.querySelector('[data-share]').click();
  await new Promise(resolve=>setTimeout(resolve,20));
  const shared=new URL(c.copied());
  assert.equal(shared.pathname,'/plan-a-trip');
  assert.deepEqual([...shared.searchParams.keys()],['shared']);
  const payload=JSON.parse(Buffer.from(shared.searchParams.get('shared'),'base64').toString('utf8'));
  assert.equal(payload.title,c.trip.tripTitle);
  assert.equal(payload.plan.stops[0].name,c.trip.stops[0].name);
  assert.equal(payload.plan.stops[0].image,undefined);
  assert.equal(c.r.querySelectorAll('.stop').length,1);
  assert.equal(c.writes.length,0);
  restored=setup(after,shared.href);
  assert.equal(restored.r.querySelector('.stop strong').textContent,c.trip.stops[0].name);
  assert.equal(restored.r.querySelector('[name=title]').value,c.trip.tripTitle);
  assert.equal(restored.r.querySelector('[name=people]').value,'3');
  assert.equal(restored.writes.length,0);
 }finally{c.d.window.close();restored?.d.window.close();}
});
