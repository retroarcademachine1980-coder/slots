import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {installRouteFixture}=require('../tools/test-support/route-fixture.cjs');
const source=fs.readFileSync(new URL('../src/runtime/079-01-spin-raiders-public-directory-adapter.js',import.meta.url),'utf8');
function setup(){const dom=new JSDOM('<body></body>',{url:'https://www.spin-raiders.com/destination/hull',runScripts:'outside-only'});dom.window.eval(source);return dom;}
test('the broad attraction choice includes specialist days out while retaining their own categories',()=>{
 const dom=setup(),w=dom.window;
 try{for(const [category,primary] of [['Aquarium','sealife'],['Zoo','zoos'],['Museum','museums'],['Castle','history'],['Theme Park','theme'],['Pier','piers'],['Beach','beaches'],['Walking Tour','tours'],['Country Park','outdoors'],['Bowling','bowling'],['Cinema','cinemas']]){
  const row={_collection:'NearbyAttractions',title:'A local visitor choice',category},before=JSON.stringify(row);
  assert.equal(w.SR_CLASSIFY_PLACE(row),primary,category+' keeps its precise category');
  assert(w.SR_PLACE_CATEGORIES(row).includes('attractions'),category+' belongs in the broad visitor choice');
  assert(w.SR_PLACE_CATEGORIES(row).includes(primary));assert.equal(JSON.stringify(row),before);
 }}finally{w.close();}
});
test('family arcade membership uses existing evidence and does not add adult gambling or hospitality to attractions',()=>{
 const dom=setup(),w=dom.window;
 try{
  const fec={_collection:'Venues',title:'Seaside games',category:'Arcade',familyFEC:true};
  assert(w.SR_PLACE_CATEGORIES(fec).includes('attractions'));
  for(const row of [{_collection:'Venues',category:'Adult Gaming Centre',familyFEC:true,adultGamingCentre:true},{_collection:'Venues',category:'Casino'},{_collection:'Venues',category:'Arcade'},{_collection:'FoodAndDrink',title:'Museum Cafe'},{_collection:'HotelGuides',title:'Castle Hotel'},{_collection:'Venues',category:'Motorway Services',familyFEC:true}])assert(!w.SR_PLACE_CATEGORIES(row).includes('attractions'),JSON.stringify(row));
 }finally{w.close();}
});
test('destination priority puts attractions, meals and stays ahead of adult gambling while keeping its category',()=>{
 const dom=setup(),w=dom.window;
 try{
  const rows=[{_collection:'Venues',title:'Slots',category:'Adult Gaming Centre'},{_collection:'Venues',title:'Family arcade',category:'Arcade',familyFEC:true},{_collection:'HotelGuides',title:'Hotel'},{_collection:'FoodAndDrink',title:'Lunch'},{_collection:'NearbyAttractions',title:'Aquarium',category:'Aquarium'}];
  assert.equal(typeof w.SR_TOURISM_RESULT_RANK,'function');
  assert.deepEqual(rows.slice().sort((a,b)=>w.SR_TOURISM_RESULT_RANK(a)-w.SR_TOURISM_RESULT_RANK(b)).map(x=>x.title),['Aquarium','Lunch','Hotel','Family arcade','Slots']);
  assert(w.SR_PLACE_CATEGORIES(rows[0]).includes('agc'));
 }finally{w.close();}
});
test('real search controls broaden the attraction tab and limit tourism ordering to the destination default',async()=>{
 const blocks=fs.readFileSync(new URL('../dist/sr.js',import.meta.url),'utf8').split(/(?=\/\* \[\d+\])/).slice(1);
 const renderer=fs.readFileSync(new URL('../src/runtime/068-01-spin-raiders-approved-search-layout-renderer-20260922.js',import.meta.url),'utf8');
 for(const destination of [true,false]){
  const dom=new JSDOM('<body><div id="root"></div></body>',{url:'https://www.spin-raiders.com'+(destination?'/destination/hull':'/search?q=Hull'),runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
  try{
   w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};
   const fixture=installRouteFixture(w,blocks);w.eval(blocks.find(b=>b.startsWith('/* [89]')));w.eval(source);w.eval(blocks.find(b=>b.startsWith('/* [67]')));w.eval(renderer);
   const root=w.document.querySelector('#root').attachShadow({mode:'open'}),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
   const view=w.SR_SEARCH_VIEW(root,{S:{e:escape},q:'Hull',locationMode:destination,href:w.SR_PLACE_HREF});
   const rows=[
    fixture.bind({_collection:'Venues',_id:'slots',title:'Slots',category:'Adult Gaming Centre',locationName:'Hull'},'/agc/slots/hull'),
    fixture.bind({_collection:'HotelGuides',_id:'hotel',title:'Hotel',category:'Hotel',locationName:'Hull'},'/hotel/hotel/hull'),
    fixture.bind({_collection:'FoodAndDrink',_id:'lunch',title:'Lunch',category:'Restaurant',locationName:'Hull'},'/food-and-drink/lunch-hull'),
    fixture.bind({_collection:'NearbyAttractions',_id:'aquarium',title:'Aquarium',category:'Aquarium',locationName:'Hull'},'/sea-life/aquarium/hull')
   ];
   view.setRecords(await fixture.annotate(rows));
   const names=()=>Array.from(root.querySelectorAll('[data-results] h2')).map(n=>n.textContent.replace('→','').trim());
   assert.deepEqual(names(),destination?['Aquarium','Lunch','Hotel','Slots']:['Slots','Hotel','Lunch','Aquarium']);
   root.querySelector('[data-cat="attractions"]').click();assert.deepEqual(names(),['Aquarium']);
   root.querySelector('[data-cat="agc"]').click();assert.deepEqual(names(),['Slots']);
   root.querySelector('[data-cat=""]').click();const sort=root.querySelector('[data-sort]');sort.value='name';sort.dispatchEvent(new w.Event('change'));assert.deepEqual(names(),['Aquarium','Hotel','Lunch','Slots']);
  }finally{w.close();}
 }
});
