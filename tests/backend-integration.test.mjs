import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(new URL('../src',import.meta.url).pathname);
const hotel={_id:'h',title:'Imperial Blackpool',slug:'imperial',locationSlug:'blackpool',locationName:'Blackpool',active:true,offerIds:['o'],image:'hotel.jpg',canonicalUrl:'/hotels/old',unifiedSearchText:'imperial blackpool'};
const venue={_id:'v',title:'Arcade Club Blackpool',slug:'arcade-club',locationSlug:'blackpool',locationName:'Blackpool',venueType:'Arcade',heroImage:'v.jpg',shortUrl:'/?place=v',unifiedSearchText:'arcade club blackpool',latitude:53,longitude:-3};
const attraction={_id:'a',title:'Cinema Blackpool',slug:'cinema',locationSlug:'blackpool',locationName:'Blackpool',category:'Cinema',heroImage:'a.jpg',website:'https://external.test',unifiedSearchText:'cinema blackpool',latitude:53,longitude:-3};
const offer={_id:'o',title:'Imperial offer',displayTitle:'Imperial offer',locationName:'Blackpool',hotelGuideId:'h',affiliateUrl:'https://merchant.test',unifiedSearchText:'imperial blackpool'};
const ready={native:true,renderer:true,revision:'TEST',evidence:'fixture only'};
const manifest={entries:[['Venues:v','/arcade/arcade-club/blackpool'],['HotelGuides:h','/hotel/imperial/blackpool'],['NearbyAttractions:a','/cinemas/cinema/blackpool']].map(([key,path])=>({key,path,evidence:'fixture'})),venueRouteKinds:{'Venues:v':'arcade','NearbyAttractions:a':'cinema'},endpoints:{arcade:{...ready,pageName:'arcade-page'},hotel:{...ready,pageName:'hotel-page'},cinema:{...ready,pageName:'cinemas-page'}}};
async function load(file,override={},capture={},manifestInput=manifest){
 const data={Venues:[venue],HotelGuides:[hotel],NearbyAttractions:[attraction],AffiliateOffers:[offer],...override};
 function query(collection){const filters=[];const q={};for(const method of ['limit','ascending','descending','contains','ne','or'])q[method]=()=>q;
  q.eq=(field,value)=>{if(field!=='featured')filters.push(row=>row[field]===value);return q;};
  q.hasSome=(field,values)=>{filters.push(row=>values.includes(row[field]));return q;};
  q.find=async()=>{if(data[collection] instanceof Error)throw data[collection];return {items:(data[collection]||[]).filter(row=>filters.every(f=>f(row))),hasNext:()=>false};};q.count=async()=>data[collection]?.length||0;return q;
 }
 const context=vm.createContext({console,URL,URLSearchParams,Date,Set,Map,Promise});const cache=new Map();
 const synthetic=(id,values)=>{const m=new vm.SyntheticModule(Object.keys(values),function(){for(const [key,value]of Object.entries(values))this.setExport(key,value);},{context,identifier:id});cache.set(id,m);return m;};
 synthetic('wix-data',{default:{query,get:async(c,id)=>(data[c]||[]).find(r=>r._id===id)}});
 const seoCalls={links:[],title:[],metaTags:[],structuredData:[]};capture.seo=seoCalls;
 synthetic('wix-seo-frontend',{default:{links:[{rel:'author',href:'https://www.spin-raiders.com/about-us'}],setLinks:async value=>seoCalls.links.push(value),setTitle:async value=>seoCalls.title.push(value),setMetaTags:async value=>seoCalls.metaTags.push(value),setStructuredData:async value=>seoCalls.structuredData.push(value)}});
 synthetic('wix-router',{next:()=>({status:'next'}),ok:(page,data,head)=>({status:200,page,data,head}),notFound:()=>({status:404}),sendStatus:status=>({status:Number(status)}),redirect:(url,status)=>({status:Number(status),url}),WixRouterSitemapEntry:class {constructor(name){this.name=name;}}});
 synthetic('wix-web-module',{Permissions:{Anyone:'Anyone'},webMethod:(_permission,fn)=>fn});
 synthetic('public/routes/routeManifest.generated',{routeManifest:manifestInput});
 async function get(spec,ref){if(cache.has(spec))return cache.get(spec);let filename;
  if(spec.startsWith('backend/')||spec.startsWith('public/'))filename=path.join(ROOT,spec+'.js');
  else filename=path.resolve(path.dirname(ref),spec);
  if(cache.has(filename))return cache.get(filename);
  const pending=fs.readFile(filename,'utf8').then(source=>new vm.SourceTextModule(source,{context,identifier:filename}));cache.set(filename,pending);return pending;
 }
 const mod=await get(file,ROOT);await mod.link((s,r)=>get(s,r.identifier));await mod.evaluate();return mod.namespace;
}
test('backend search retains all 15 sources after retiring inline route builders',async()=>{
 const m=await load('backend/searchCore');const sources=m.listPublicSearchSources();assert.equal(sources.length,15);assert.ok(sources.some(s=>s.collection==='HotelGuides'));assert.ok(sources.some(s=>s.collection==='FoodAndDrink'));
 const result=await m.runUnifiedSearchInternal('Blackpool');assert.equal(result.results.find(c=>c.sourceCollection==='HotelGuides').route,'/hotel/imperial/blackpool');
 assert.equal(result.results.find(c=>c.sourceCollection==='Venues').route,'/arcade/arcade-club/blackpool');
 assert.equal(result.results.find(c=>c.sourceCollection==='NearbyAttractions').route,'/cinemas/cinema/blackpool');
 assert.ok(result.results.every(c=>!c.route||(!c.route.includes('?')&&!c.route.startsWith('http'))));
 // Search de-duplicates offers pointing at the same hotel guide; directory tests cover the join.
});
test('directory cards/map use same canonical service and live guide join',async()=>{
 const m=await load('backend/directory.web');
 assert.equal((await m.listHotels()).results[0].route,'/hotel/imperial/blackpool');
 assert.equal((await m.listVenues()).results[0].route,'/arcade/arcade-club/blackpool');
 assert.equal((await m.listAttractions()).results[0].route,'/cinemas/cinema/blackpool');
 assert.equal((await m.listRecommendations()).results[0].route,'/hotel/imperial/blackpool');
 const pins=(await m.getMapPins()).pins;assert.ok(pins.every(p=>p.routeStatus==='ready'&&!p.route.includes('?')));
});
test('homepage models preserve content and never link raw shortUrl/affiliate fallback',async()=>{
 const m=await load('backend/homepage.web');const result=await m.getHomepageData();
 assert.equal(result.featuredVenues[0].route,'/arcade/arcade-club/blackpool');
 assert.equal(result.hotels[0].route,'/hotel/imperial/blackpool');assert.equal(result.hotels[0].image,'hotel.jpg');
 assert.equal(result.thingsToDo[0].route,'/cinemas/cinema/blackpool');
});
test('pageData hotel metadata and native search agree on canonical URL',async()=>{
 const m=await load('backend/pageData.web');const result=await m.getHotelPage('imperial');
 assert.equal(result.page.route,'/hotel/imperial/blackpool');assert.equal(result.page.canonicalUrl,'https://www.spin-raiders.com/hotel/imperial/blackpool');
});
test('backend duplicate slug lookup no longer picks first record',async()=>{
 const m=await load('backend/pageData.web',{HotelGuides:[hotel,{...hotel,_id:'collision'}]});
 assert.equal(await m.getHotelPage('imperial'),null);
});
test('discovery recommendation cards use internal route instead of external bypass',async()=>{
 const m=await load('backend/discovery.web');const result=await m.getRecommendations();
 assert.ok(result.length>=3);assert.ok(result.every(c=>c.routeStatus==='ready'));assert.ok(result.every(c=>c.route.startsWith('/')&&!c.route.includes('?')));
});
test('batch routing preserves requested offer identity while linking its guide',async()=>{
 const m=await load('backend/canonicalRoutesApi');const result=await m.resolveRouteRequests([{collection:'AffiliateOffers',id:'o'},{collection:'Venues',id:'v'}]);
 assert.equal(result.results[0].key,'AffiliateOffers:o');assert.equal(result.results[0].targetKey,'HotelGuides:h');assert.equal(result.results[0].href,'/hotel/imperial/blackpool');
 assert.equal(result.results[1].key,'Venues:v');assert.equal(result.complete,true);
 assert.equal((await m.resolveRouteRequests([{collection:'PrivateCollection',id:'secret'}])).ok,false);
 assert.equal((await m.resolveRouteRequests([{collection:'Venues',id:'missing'}])).results[0].code,'record_not_found');
});
test('native SEO sets same canonical URL and preserves unrelated link tags',async()=>{
 const capture={},m=await load('public/seo',{},capture);await m.applyPageSeo(['hotel','imperial','blackpool']);
 assert.equal(capture.seo.links[0].find(link=>link.rel==='canonical').href,'https://www.spin-raiders.com/hotel/imperial/blackpool');
 assert.equal(capture.seo.links[0].find(link=>link.rel==='author').href,'https://www.spin-raiders.com/about-us');
 assert.ok(capture.seo.structuredData[0].some(item=>item.url==='https://www.spin-raiders.com/hotel/imperial/blackpool'));
});
test('failed data sources are disclosed while independent results remain',async()=>{
 const m=await load('backend/searchCore',{NearbyAttractions:new Error('offline')});const result=await m.runUnifiedSearchInternal('Blackpool');
 assert.equal(result.complete,false);assert.ok(result.sourceFailures.some(item=>item.collection==='NearbyAttractions'));assert.ok(result.results.some(item=>item.sourceCollection==='Venues'));
});
test('malformed route request entries fail validation instead of throwing',async()=>{
 const m=await load('backend/canonicalRoutesApi');for(const requests of [[null],[undefined],[123],[{}],null])assert.equal((await m.resolveRouteRequests(requests)).code,'invalid_route_requests');
});
test('custom-router landing keeps captured native SEO and adds only its canonical link',async()=>{
 const capture={},m=await load('public/seo',{},capture);
 await m.applyPageSeo(['cinemas'],{view:'index',route:{kind:'cinema',path:'/cinemas'},metadata:{title:'Captured native title'}});
 assert.equal(capture.seo.title.length,0);assert.equal(capture.seo.links[0].find(link=>link.rel==='canonical').href,'https://www.spin-raiders.com/cinemas');
});
test('batched article links resolve canonical records/static roots and reject external or unknown URLs',async()=>{
 const m=await load('backend/canonicalRoutesApi');const result=await m.resolveLinkRequests(['/hotel/imperial/blackpool','https://www.spin-raiders.com/arcade/arcade-club/blackpool','/cinemas','https://external.test/x','/hotels/unmapped']);
 assert.equal(result.results[0].href,'/hotel/imperial/blackpool');assert.equal(result.results[1].href,'/arcade/arcade-club/blackpool');assert.equal(result.results[2].href,'/cinemas');assert.equal(result.results[3].ok,false);assert.equal(result.results[4].ok,false);assert.equal(result.complete,false);
});
test('captured native arcade handler renders exact original record and sitemap emits only canonical path',async()=>{
 const m=await load('backend/routers');const response=await m.arcade_Router({path:['arcade-club','blackpool']});
 assert.equal(response.status,200);assert.equal(response.page,'arcade-page');assert.equal(response.data.record._id,'v');assert.equal(response.data.route.path,'/arcade/arcade-club/blackpool');
 const sitemap=await m.arcade_SiteMap();assert.equal(sitemap.length,1);assert.equal(sitemap[0].url,'/arcade/arcade-club/blackpool');
 assert.equal((await m.arcade_Router({path:['unknown','blackpool']})).status,404);
});
test('actual legacy API redirects an inactive grouped source while batch listing keeps it suppressed',async()=>{
 const source={_id:'secondary',title:'Old Imperial source',active:false};
 const group={groupId:'imperial-group',relation:'same-entity',approved:true,provenSameEntity:true,primaryKey:'HotelGuides:h',sourceKeys:['HotelGuides:h','NearbyAttractions:secondary'],canonicalPath:'/hotel/imperial/blackpool',renderPolicy:{contentVerified:true}};
 const config={...manifest,sourceGroups:[group],aliases:[{from:'/arcade-venues/old-imperial',key:'NearbyAttractions:secondary'}]};
 const m=await load('backend/canonicalRoutesApi',{NearbyAttractions:[source]}, {}, config);
 const alias=await m.resolveLegacyAlias('/arcade-venues/old-imperial');assert.equal(alias.ok,true);assert.equal(alias.method,'server301');assert.equal(alias.to,'/hotel/imperial/blackpool');
 const links=await m.resolveLinkRequests(['/arcade-venues/old-imperial']);assert.equal(links.results[0].href,'/hotel/imperial/blackpool');
 const batch=await m.resolveRouteRequests([{collection:'NearbyAttractions',id:'secondary'}]);assert.equal(batch.results[0].code,'record_not_public');
});
test('transitional index alias API cannot loop into active backward host redirects',async()=>{
 const api=await load('backend/canonicalRoutesApi',{}, {}, {...manifest,indexAliasesActive:false});
 const result=await api.resolveLegacyAlias('/classic-fruit-machine-archive');
 assert.equal(result.ok,false);assert.equal(result.code,'transitional_index_rendering');assert.equal(result.renderIndex,'/classic-fruit-machines');assert.equal(result.to,undefined);
});
test('cleanup index alias API emits one-way301 only after immutable activation',async()=>{
 const api=await load('backend/canonicalRoutesApi',{}, {}, {...manifest,indexAliasesActive:true});
 const result=await api.resolveLegacyAlias('/classic-fruit-machine-archive');
 assert.equal(result.ok,true);assert.equal(result.to,'/classic-fruit-machines');assert.equal(result.method,'server301');
});
test('legacy native index hooks preserve transition shell and only cleanup build redirects it',async()=>{
 const transition=await load('backend/routers',{}, {}, {...manifest,deploymentPhase:'transition',indexAliasesActive:false});
 assert.equal((await transition.classic_fruit_machine_archive_beforeRouter({path:[]})).status,'next');
 const cleanup=await load('backend/routers',{}, {}, {...manifest,deploymentPhase:'final',indexAliasesActive:true});
 const result=await cleanup.classic_fruit_machine_archive_beforeRouter({path:[]});assert.equal(result.status,301);assert.equal(result.url,'https://www.spin-raiders.com/classic-fruit-machines');
});
test('food actual exported before/query/after wrappers retain native list and reject unknown detail',async()=>{
 const m=await load('backend/routers');
 assert.equal((await m.food_and_drink_beforeRouter({path:[]})).status,'next');
 assert.equal((await m.food_and_drink_beforeRouter({path:['missing','town']})).status,404);
 const original={name:'original'};assert.equal(m.food_and_drink_customizeQuery({path:[]},'/',original),original);
 const response={status:200,data:'list'};assert.equal(await m.food_and_drink_afterRouter({path:[]},response),response);
});
test('historical policy preserves deep link but excludes current discovery/map/offer promotion',async()=>{
 const policy={routeType:'historical',notice:'Closed; historical guide retained.',offerActionsAllowed:false,withheldFields:['openingHours'],publicServingAllowed:true,promoteInCurrentDiscovery:false,indexable:false,evidence:'fixture'};
 const config={...manifest,recordPolicies:{'NearbyAttractions:a':policy}};
 const api=await load('backend/canonicalRoutesApi',{}, {},config);
 const batch=await api.resolveRouteRequests([{collection:'NearbyAttractions',id:'a'}]);assert.equal(batch.results[0].ok,false);assert.equal(batch.results[0].discoveryAllowed,false);
 const detail=await api.resolveRoutePath('/cinemas/cinema/blackpool');assert.equal(detail.status,200);assert.equal(detail.route.contentNotice,policy.notice);assert.equal(detail.route.indexable,false);
 const directory=await load('backend/directory.web',{}, {},config);assert.ok(!(await directory.getMapPins()).pins.some(pin=>pin.title===attraction.title));
});
test('explicit nonpublic legacy source is accounted as404, not an invented canonical route',async()=>{
 const policy={routeType:'unverified',notice:'Details unverified',offerActionsAllowed:false,withheldFields:['address'],publicServingAllowed:false,promoteInCurrentDiscovery:false,indexable:false,evidence:'fixture'};
 const config={...manifest,entries:manifest.entries.filter(entry=>entry.key!=='NearbyAttractions:a'),aliases:[{from:'/?collection=NearbyAttractions&place=a',key:'NearbyAttractions:a'}],recordPolicies:{'NearbyAttractions:a':policy}};
 const api=await load('backend/canonicalRoutesApi',{}, {},config),result=await api.resolveLegacyAlias('/?collection=NearbyAttractions&place=a');
 assert.equal(result.ok,false);assert.equal(result.inputMapped,true);assert.equal(result.status,404);
});
test('historical route SEO cannot be reindexed by the master page or imply a live business',async()=>{
 const capture={},m=await load('public/seo',{},capture);
 await m.applyPageSeo(['arcade','old','town'],{view:'detail',record:{_id:'x',title:'Former Arcade',directoryReady:true},route:{kind:'arcade',path:'/arcade/old/town',canonicalUrl:'https://www.spin-raiders.com/arcade/old/town',routeType:'historical',indexable:false,contentNotice:'Closed. Historical information retained.'}});
 assert.ok(capture.seo.metaTags.flat().some(tag=>tag.name==='robots'&&tag.content.includes('noindex')));assert.equal(capture.seo.structuredData[0][0]['@type'],'Article');
});

test('Food records without a prebuilt search index appear for coffee and burger queries',async()=>{
 const cafe={_id:'cafe',title:'Harbour Café',town:'York',locationName:'York',slug:'harbour-cafe',townSlug:'york',category:'Café',active:true,heroImage:'cafe.jpg'},burger={...cafe,_id:'burger',title:'Burger Kitchen',slug:'burger-kitchen',category:'Restaurant'};
 const foodManifest={...manifest,entries:[...manifest.entries,{key:'FoodAndDrink:cafe',path:'/food-and-drink/harbour-cafe-york',evidence:'fixture'},{key:'FoodAndDrink:burger',path:'/food-and-drink/burger-kitchen-york',evidence:'fixture'}],endpoints:{...manifest.endpoints,food:{...ready,pageName:'food-page'}}};
 const m=await load('backend/searchCore',{FoodAndDrink:[cafe,burger]}, {},foodManifest);
 const coffee=await m.runUnifiedSearchInternal('coffee'),burgers=await m.runUnifiedSearchInternal('burgers');
 assert(coffee.results.some(row=>row.sourceCollection==='FoodAndDrink'&&row.sourceId==='cafe'));assert(burgers.results.some(row=>row.sourceCollection==='FoodAndDrink'&&row.sourceId==='burger'));
});
