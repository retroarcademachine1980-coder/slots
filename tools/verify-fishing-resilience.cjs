const {installRouteFixture}=require('./test-support/route-fixture.cjs');
const {JSDOM, VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const path=require('node:path');
const base=path.resolve(process.argv[2]||path.join(__dirname,'..'))+path.sep;
const src=fs.readFileSync(base+'dist/sr.js','utf8');
const blocks=src.split(/(?=\/\* \[\d+\])/).slice(1);
const block=n=>blocks.find(b=>b.startsWith('/* ['+n+']'));
const fixture=n=>{const x=JSON.parse(fs.readFileSync(base+'tests/fixtures/'+n)).dataItem;return {...x.data,_id:x.id,_collection:x.dataCollectionId}};
const tick=()=>new Promise(r=>setTimeout(r,15));
function make(path='/'){
 const vc=new VirtualConsole(); const errors=[];vc.on('jsdomError',e=>errors.push(e.message));
 const d=new JSDOM('<head></head><body><div id="SITE_CONTAINER"></div></body>',{url:'https://www.spin-raiders.com'+path,runScripts:'outside-only',virtualConsole:vc});
 const w=d.window;w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};const authority=installRouteFixture(w,blocks);w.eval(block(79));return {d,w,errors,authority};
}
const tests=[];function test(name,fn){tests.push([name,fn])}
function mockFetch(w,data){const calls=[];w.fetch=async(url,opts)=>{if(url.includes('/oauth2/'))return {ok:true,json:async()=>({access_token:'test',expires_in:5000})};const q=JSON.parse(opts.body);calls.push(q);const rows=data[q.dataCollectionId]||[];return {ok:true,json:async()=>({dataItems:rows.map(row=>({id:row._id,data:q.query.fields?Object.fromEntries(q.query.fields.filter(f=>f in row).map(f=>[f,row[f]])):row}))})}};return calls}
function mockGuide(w,guide,offers,more=[]){w.SR_PUBLIC_DIRECTORY.S.archiveQuery=async(q,a,b,c)=>({dataItems:(c==='HotelOffers'?offers:q.paging.limit===2?[guide]:more).map(row=>({id:row._id,data:row}))})}
async function fishingContext(failure){const ctx=make('/fishing');const{w}=ctx;w.eval(block(65));const host=w.document.createElement('div');w.document.body.append(host);const root=host.attachShadow({mode:'open'}),config={listings:[]};root.innerHTML='<div class="search-area"><form><input name="q"></form></div>'+w.SR_DIRECTORY_HTML(config);const calls=[];w.SR_PUBLIC_DIRECTORY.D.rows=async c=>{calls.push(c);if(failure==='all'||c==='NearbyAttractions')throw Error('offline');if(c==='AffiliateOffers')return [];const row={_collection:'Venues',_id:'lake',title:'Test Fishery',category:'Fishing',locationName:'York',slug:'test-fishery'};ctx.authority.bind(row,'/fishing-lakes/test-fishery/york');return ctx.authority.annotate([row])};w.SR_INIT_DIRECTORY(root,config);await tick();return{...ctx,root,calls};}
test('Fishing sources omit removed collection and retain partial warning after reset',async()=>{
 const {d,w,root,calls}=await fishingContext('partial');try{assert.deepEqual(calls,['Venues','NearbyAttractions','AffiliateOffers']);assert.match(root.querySelector('[data-results]').textContent,/Test Fishery/);assert.match(root.textContent,/Some golf or fishing places could not load/);root.querySelector('button[type=reset]').click();await tick();assert.match(root.textContent,/Some golf or fishing places could not load/,'Reset erases unresolved data-source warning')}finally{d.window.close()}
});
test('Fishing all-source failure persists after filtering interactions',async()=>{
 const {d,w,root}=await fishingContext('all');try{assert.match(root.querySelector('[data-results]').textContent,/Golf and fishing places could not load/);root.querySelector('[data-sort]').dispatchEvent(new w.Event('change'));assert.match(root.querySelector('[data-results]').textContent,/Golf and fishing places could not load/,'Sorting replaces failed load with misleading coming-soon state')}finally{d.window.close()}
});
(async()=>{let failed=0;for(const[name,fn]of tests){try{await fn();console.log('PASS',name)}catch(e){failed++;console.log('FAIL',name,'\n ',e.message)}}console.log(`${tests.length-failed}/${tests.length} review assertions passed`);process.exitCode=failed?1:0})();
