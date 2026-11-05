import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

async function load(initial){
 const calls=[];let ready=false,readsBeforeReady=0;
 const seo={links:[],get metaTags(){assert.equal(ready,false,'Read initial metadata outside onReady');readsBeforeReady++;return initial;},setTitle:async()=>{},setLinks:async()=>{},setStructuredData:async()=>{},setMetaTags:async tags=>calls.push(tags)};
 const context=vm.createContext({console,URL,Set,Map,Promise});
 const exports={
  'public/routes/indexRoutes':{INDEX_ROUTES:{}},
  'backend/canonicalPages.web':{getCanonicalPage:async()=>({status:404})},
  'public/routes/canonicalRoutes':{ROUTES:{},parseCanonical:path=>({ok:path.startsWith('/food-and-drink/')})},
  'wix-data':{default:{}},'wix-seo-frontend':{default:seo}
 };
 const source=await fs.readFile(new URL('../src/public/seo.js',import.meta.url),'utf8');
 const mod=new vm.SourceTextModule(source,{context});
 await mod.link(spec=>{const value=exports[spec];assert(value,spec);return new vm.SyntheticModule(Object.keys(value),function(){for(const [k,v]of Object.entries(value))this.setExport(k,v);},{context});});
 await mod.evaluate();ready=true;
 return {apply:mod.namespace.applyPageSeo,calls,reads:()=>readsBeforeReady};
}

test('general SEO preserves configured sharing image, dimensions, alt and verification while updating description',async()=>{
 const initial=[{property:'og:image',content:'https://example.com/beach.webp'},{property:'og:image:width',content:'2172'},{property:'og:image:alt',content:'Beach artwork'},{name:'twitter:image',content:'https://example.com/beach.webp'},{name:'google-site-verification',content:'fixture-verification'},{name:'description',content:'Old fixture description'}];
 const before=structuredClone(initial),m=await load(initial);await m.apply(['beaches']);
 const tags=m.calls[0];
 for(const tag of initial.slice(0,-1))assert(tags.some(t=>JSON.stringify(t)===JSON.stringify(tag)),tag.property||tag.name);
 assert.equal(tags.filter(t=>t.name==='description').length,1);assert.notEqual(tags.find(t=>t.name==='description').content,'Old fixture description');
 assert.equal(tags.find(t=>t.name==='twitter:card').content,'summary_large_image');assert.equal(m.reads(),1);assert.deepEqual(initial,before);
});

test('configured noindex survives a general-page metadata refresh',async()=>{
 const m=await load([{name:'robots',content:'noindex, follow'}]);await m.apply(['beaches']);
 assert.equal(m.calls[0].find(t=>t.name==='robots')?.content,'noindex, follow');
});

test('explicit record image replaces inherited image without stale dimensions or captions',async()=>{
 const m=await load([{property:'og:image',content:'https://example.com/old.jpg'},{property:'og:image:width',content:'2500'},{property:'og:image:alt',content:'An unrelated tram'},{name:'twitter:image:alt',content:'An unrelated tram'}]);
 const path='/food-and-drink/fixture-cafe-york';
 await m.apply(['food-and-drink','fixture-cafe-york'],{view:'detail',record:{title:'Fixture Cafe',mainImage:'https://example.com/cafe.jpg',seoDescription:'Fixture cafe details'},route:{kind:'food',path,canonicalUrl:'https://www.spin-raiders.com'+path}});
 const tags=m.calls[0];assert.equal(tags.find(t=>t.property==='og:image').content,'https://example.com/cafe.jpg');
 assert(!tags.some(t=>t.content==='An unrelated tram'));assert(!tags.some(t=>t.property==='og:image:width'));assert.equal(tags.filter(t=>t.property==='og:image').length,1);
});

test('adding a route indexing hold retains existing nofollow and archive restrictions',async()=>{
 const m=await load([{name:'robots',content:'index, nofollow, noarchive'}]);
 const path='/food-and-drink/fixture-cafe-york';
 await m.apply(['food-and-drink','fixture-cafe-york'],{view:'detail',record:{title:'Fixture Cafe'},route:{kind:'food',path,canonicalUrl:'https://www.spin-raiders.com'+path,indexable:false}});
 const tokens=m.calls[0].find(t=>t.name==='robots').content.split(',').map(x=>x.trim());
 assert(tokens.includes('noindex'));assert(tokens.includes('nofollow'));assert(tokens.includes('noarchive'));assert(!tokens.includes('index'));assert(!tokens.includes('follow'));
});
