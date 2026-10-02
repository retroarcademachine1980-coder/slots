import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES, buildCanonical, parseCanonical, createRouteContext, resolveRecord, isLegacyPath } from '../src/public/routes/canonicalRoutes.js';
import { cardRoute, routeBatch, seoRoute, sitemapRoutes, requireHref, selectUniqueRecord } from '../src/public/routes/routeAdapters.js';
import { buildRedirectManifest, redirectFor, auditRedirectCoverage, parseLegacyInput } from '../src/public/routes/legacyRedirects.js';
const ready = { native: true, renderer: true, revision: 'TEST-ONLY', evidence: 'fixture deep-link test, not production proof' };
const hotel = { _id: 'imperial', title: 'Imperial', slug: 'the-imperial-hotel-blackpool', locationSlug: 'blackpool', canonicalUrl: '/hotels/imperial', shortUrl: '/?place=old', active: true, offerIds: ['offer-a'] };
const machine = { _id: 'dk', title: 'Donkey Kong', manufacturerSlug: 'maygay', machineSlug: 'donkey-kong', shortUrl: '/classic-fruit-machines/donkey-kong', active: true };
const arcade = { _id: 'arcade-club', slug: 'arcade-club', locationSlug: 'blackpool', venueType: 'Family arcade', shortUrl: '/arcade-venues/old-title' };
const food = { _id: 'cafe', townSlug: 'grimsby', urlName: 'masala-n-malt' };
const destination = { _id: 'town', title: 'Blackpool', slug: 'wrong-slug', 'link-arcade-locations-title': '/destination/blackpool' };
const records = [ ['HotelGuides', hotel, 'hotel'], ['ClassicFruitMachines', machine, 'machine'], ['Venues', arcade, 'arcade'], ['FoodAndDrink', food, 'food'], ['Locations', destination, 'destination'] ];
const pathFor = (kind, row) => buildCanonical(kind, kind === 'destination' ? { nativeTitleSlug: 'blackpool' } : row).path;
function context(extra = {}) {
  return createRouteContext({
    entries: records.map(([collection, row, kind]) => ({ key: `${collection}:${row._id}`, path: pathFor(kind, row), evidence: 'fixture record inventory' })),
    endpoints: Object.fromEntries(Object.keys(ROUTES).map(kind => [kind, ready])),
    venueRouteKinds: { 'Venues:arcade-club': 'arcade' }, guides: [hotel], now: Date.parse('2026-10-02T08:00:00Z'), ...extra
  });
}
for (const [collection, row, kind] of records) {
  test(`${collection}: same canonical route in card, SEO, sitemap and native selection`, () => {
    const ctx = context(), route = resolveRecord(collection, row, ctx), expected = pathFor(kind, row);
    assert.equal(route.href, expected); assert.equal(isLegacyPath(route.href), false);
    assert.equal(cardRoute(collection, row, ctx).href, expected);
    assert.equal(seoRoute(collection, row, ctx).canonicalUrl, route.canonicalUrl);
    assert.equal(sitemapRoutes([{ collection, row }], ctx).entries[0].url, route.canonicalUrl);
    assert.equal(selectUniqueRecord(collection, [row], expected, ctx).row, row);
  });
}
for (const [kind, spec] of Object.entries(ROUTES)) {
  test(`${kind}: round trip, semantic path and readiness gate`, () => {
    const fields = Object.fromEntries(spec.fields.map(field => [field, field === 'locationSlug' ? 'blackpool' : 'semantic-name']));
    const result = buildCanonical(kind, fields);
    assert.equal(result.ok, true); assert.equal(result.path.includes('?'), false); assert.equal(isLegacyPath(result.path), false);
    assert.equal(parseCanonical(result.path).kind, kind); assert.equal(parseCanonical('https://www.spin-raiders.com' + result.path).path, result.path);
  });
}
for (const value of ['', undefined, null, 'Unknown', 'unknown', 'n-a', 'null', 'a/b', 'a\\b', 'a%2fb', 'a%252fb', '..', '../x', 'bad slug', 'Uppercase', '-leading', 'trailing-', 'a--b', '0b128744-a529-439c-b199-933d74699777']) {
  test(`invalid semantic segment ${String(value)}`, () => assert.equal(buildCanonical('machine', { manufacturerSlug: value, machineSlug: 'dk' }).ok, false));
}
for (const input of ['/arcade-venues/arcade-club', '/classic-fruit-machine-archive-1/donkey-kong', '/hotels/imperial', '/hotel/name/town?place=123', '/hotel/name/town#x', '/hotel/name/town/', '//evil.test/hotel/name/town', 'https://evil.test/hotel/name/town', 'http://www.spin-raiders.com/hotel/name/town', '/hotel/a%2fb/town', '/hotel/../town', '/hotel/name\\x/town', '/hotel/NAME/town', '/cinemas/not-a-detail', '/machines/foo']) {
  test(`reject noncanonical input ${input}`, () => assert.equal(parseCanonical(input).ok, false));
}
test('unknown/prototype kind cannot bypass registry', () => { for (const kind of ['missing','toString','__proto__']) assert.equal(buildCanonical(kind).ok, false); });
test('missing endpoint never exposes a dead link or blank href', () => {
  const ctx = context({ endpoints: {} }), route = resolveRecord('HotelGuides', hotel, ctx);
  assert.equal(route.code, 'native_endpoint_not_ready'); assert.equal(Object.hasOwn(route, 'href'), false);
  assert.equal(route.canonicalPath, '/hotel/the-imperial-hotel-blackpool/blackpool');
  assert.throws(() => requireHref(route));
  const card = cardRoute('HotelGuides', hotel, ctx); assert.equal(card.kind, 'unavailable'); assert.equal(Object.hasOwn(card, 'href'), false);
  assert.equal(seoRoute('HotelGuides', hotel, ctx).robots, 'noindex,follow');
  const sitemap = sitemapRoutes([{ collection: 'HotelGuides', row: hotel }], ctx); assert.equal(sitemap.entries.length, 0); assert.equal(sitemap.complete, false);
});
test('native-only endpoint or missing evidence is not publication proof', () => {
  for (const endpoint of [{native:true}, {...ready, renderer:false}, {...ready,evidence:''}, {...ready,revision:''}]) {
    assert.equal(resolveRecord('HotelGuides', hotel, context({ endpoints: {hotel:endpoint} })).ok, false);
  }
});
test('missing metadata never falls back to legacy, ID, guessed manufacturer or title', () => {
  const row = {...machine, manufacturerSlug: undefined, manufacturer: 'Maygay', slug: 'donkey-kong'};
  assert.equal(resolveRecord('ClassicFruitMachines', row, context()).code, 'invalid_or_missing_route_field');
  assert.equal(resolveRecord('HotelGuides', {...hotel, locationSlug: undefined}, context()).ok, false);
});
test('destination uses exact native title link, not a conflicting slug', () => {
  assert.equal(resolveRecord('Locations', destination, context()).href, '/destination/blackpool');
  assert.equal(resolveRecord('Locations', {...destination,'link-destination-title':'/destination/london'},context()).code, 'missing_or_conflicting_native_destination_link');
});
test('all non-arcade business categories require one explicit reviewed route identity', () => {
  const row = {...arcade, _id:'bowl', venueType:'Bowling'};
  assert.equal(resolveRecord('Venues', row, context()).code, 'venue_category_endpoint_unverified');
  const path = '/bowling/arcade-club/blackpool';
  const ctx = context({entries:[{key:'Venues:bowl',path,evidence:'reviewed'}],venueRouteKinds:{'Venues:bowl':'bowling'}});
  assert.equal(resolveRecord('Venues', row, ctx).href,path);
});
test('pending category routes remain blocked until native renderer is tested', () => {
  const row = {_id:'cinema',slug:'odeon',locationSlug:'blackpool'}, path='/cinemas/odeon/blackpool';
  const ctx=context({entries:[{key:'NearbyAttractions:cinema',path,evidence:'reviewed'}],venueRouteKinds:{'NearbyAttractions:cinema':'cinema'},endpoints:{}});
  assert.equal(resolveRecord('NearbyAttractions',row,ctx).code,'native_endpoint_not_ready');
});
test('mixed family/AGC filter membership cannot change one canonical identity', () => {
  const row={...arcade,familyFEC:true,adultGamingCentre:true};
  assert.equal(resolveRecord('Venues',row,context()).href,resolveRecord('Venues',arcade,context()).href);
});
test('canonical collisions block both records across source collections', () => {
  const path='/cinemas/odeon/blackpool', entries=['Venues:a','NearbyAttractions:b'].map(key=>({key,path,evidence:'fixture'}));
  const ctx=context({entries,venueRouteKinds:{'Venues:a':'cinema','NearbyAttractions:b':'cinema'}});
  for(const [collection,_id] of [['Venues','a'],['NearbyAttractions','b']]) assert.equal(resolveRecord(collection,{_id,slug:'odeon',locationSlug:'blackpool'},ctx).code,'canonical_collision');
});
test('one record cannot have two canonical destinations', () => {
  const entries=['/hotel/the-imperial-hotel-blackpool/blackpool','/hotel/imperial/blackpool'].map(path=>({key:'HotelGuides:imperial',path,evidence:'fixture'}));
  assert.equal(resolveRecord('HotelGuides',hotel,context({entries})).code,'record_has_multiple_canonicals');
});
test('missing binding prevents plausible but unattested deep link', () => assert.equal(resolveRecord('HotelGuides',hotel,context({entries:[]})).code,'missing_verified_record_binding'));
test('public readiness is preserved without deleting records', () => {
  for (const flags of [{active:false},{directoryReady:false},{pageReady:false},{cardReady:false},{canonicalMachineId:'other'},{status:'Duplicate'},{variantStatus:'Rejected'}]) {
    assert.equal(resolveRecord('ClassicFruitMachines',{...machine,...flags},context()).code,'record_not_public');
  }
  assert.equal(machine.active,true);
});
test('hotel offers link to exactly one guide and never outbound merchant', () => {
  const offer={_id:'offer-a',affiliateUrl:'https://merchant.test/deal',hotelGuideId:'imperial'};
  assert.equal(resolveRecord('HotelOffers',offer,context()).href,resolveRecord('HotelGuides',hotel,context()).href);
  assert.equal(resolveRecord('AffiliateOffers',{...offer,hotelGuideId:'other'},context()).code,'offer_guide_unresolved');
  assert.equal(resolveRecord('HotelOffers',offer,context({guides:[hotel,{...hotel,_id:'other'}]})).code,'offer_guide_unresolved');
  assert.equal(resolveRecord('HotelOffers',{...offer,validUntil:'2020-01-01'},context()).code,'offer_expired_or_invalid_date');
  assert.equal(resolveRecord('HotelOffers',{...offer,validUntil:'garbage'},context()).code,'offer_expired_or_invalid_date');
});
test('unsupported records are explicit unresolved outcomes, not external bypasses', () => {
  for(const collection of ['Guides','SpinRaidersVideos','WowcherOffers','DestinationRecommendations','Machines','Manufacturers','AffiliatePartners','ClassicFruitMachineFamilies']) {
    assert.equal(resolveRecord(collection,{_id:'x',slug:'x',affiliateUrl:'https://example.com'},context()).code,'collection_endpoint_unverified');
  }
});
test('route batches preserve unresolved rows and disclose partial results', () => {
  const batch=routeBatch([{collection:'HotelGuides',row:hotel},{collection:'Guides',row:{_id:'x'}}],context());
  assert.equal(batch.total,2);assert.equal(batch.linked.length,1);assert.equal(batch.unavailable.length,1);assert.equal(batch.complete,false);
});
test('context snapshot is immutable and independent of caller mutations', () => {
  const endpoints={hotel:{...ready}},ctx=context({endpoints}); endpoints.hotel.native=false;
  assert.equal(resolveRecord('HotelGuides',hotel,ctx).ok,true);assert.throws(()=>{ctx.endpoints.hotel.native=false;});
});
test('duplicate native rows do not silently select the first', () => assert.equal(selectUniqueRecord('HotelGuides',[hotel,{...hotel}],pathFor('hotel',hotel),context()).code,'ambiguous_native_record'));
const legacy = ['/classic-fruit-machine-archive-1/donkey-kong','/classic-fruit-machine-archive/donkey-kong','/classic-fruit-machines/donkey-kong','/?sr=classic&machine=dk'];
function redirects(mapping=legacy.map(from=>({from,key:'ClassicFruitMachines:dk'}))) { return buildRedirectManifest(mapping,key=>key==='ClassicFruitMachines:dk'?resolveRecord('ClassicFruitMachines',machine,context()):resolveRecord('HotelGuides',hotel,context())); }
test('every known legacy bookmark maps one way to ready canonical destination', () => {
  const manifest=redirects();assert.equal(manifest.complete,true);assert.equal(auditRedirectCoverage(legacy,manifest).complete,true);
  for(const source of legacy){const result=redirectFor(source,manifest);assert.equal(result.status,source.includes('?')?null:301);assert.equal(result.method,source.includes('?')?'clientReplace':'server301');assert.equal(result.to,'/classic-fruit-machines/maygay/donkey-kong');assert.equal(parseCanonical(result.to).ok,true);}
});
test('canonical routes can never become reverse redirects or loops', () => {
  const manifest=redirects([{from:'/classic-fruit-machines/maygay/donkey-kong',key:'HotelGuides:imperial'},{from:'/classic-fruit-machines',key:'HotelGuides:imperial'}]);
  assert.equal(manifest.entries.length,0);assert.equal(manifest.complete,false);assert.ok(manifest.issues.every(issue=>issue.code==='canonical_source_forbidden'));
});
test('query order and trailing slash input normalize without changing canonical output', () => {
  const manifest=redirects();assert.equal(redirectFor('/?machine=dk&sr=classic',manifest).to,'/classic-fruit-machines/maygay/donkey-kong');
  assert.equal(redirectFor('/classic-fruit-machine-archive-1/donkey-kong/',manifest).ok,true);
});
test('ambiguous legacy source has no arbitrary winning redirect', () => {
  const manifest=redirects([{from:legacy[0],key:'ClassicFruitMachines:dk'},{from:legacy[0],key:'HotelGuides:imperial'},{from:legacy[0],key:'ClassicFruitMachines:dk'}]);
  assert.equal(manifest.entries.length,0);assert.equal(manifest.complete,false);
});
test('unready targets and unaccounted bookmarks block migration acceptance', () => {
  const manifest=buildRedirectManifest([{from:legacy[0],key:'x'}],()=>resolveRecord('ClassicFruitMachines',machine,context({endpoints:{}})));
  assert.equal(manifest.entries.length,0);assert.equal(manifest.complete,false);
  const partial=redirects(legacy.slice(1).map(from=>({from,key:'ClassicFruitMachines:dk'})));
  assert.equal(auditRedirectCoverage(legacy,partial).complete,false);
});
for(const input of ['https://evil.test/?collection=Venues&place=x','//evil.test/x','/x/../y','/x%2fy','/?collection=Venues&place=x&place=y','/?collection=Venues&place=x&machine=y','/?place=x','/?utm_source=x','javascript:alert(1)']){
  test(`unsafe legacy source rejected ${input}`,()=>assert.equal(parseLegacyInput(input).ok,false));
}
test('requireHref cannot accept legacy/external forged result',()=>{ for(const href of ['/classic-fruit-machine-archive-1/x','https://evil.test/x','']) assert.throws(()=>requireHref({ok:true,href})); });
const { resolveNativePath, nativeOutcome } = await import('../src/public/routes/nativeRouteResolver.js');
test('native resolver reads exactly indexed ID without ambiguous slug fallback', async()=>{
  const calls=[], result=await resolveNativePath(pathFor('hotel',hotel),context(),async(collection,id)=>{calls.push([collection,id]);return hotel;});
  assert.deepEqual(calls,[['HotelGuides','imperial']]);assert.equal(result.status,200);assert.equal(nativeOutcome(result).action,'render');
});
test('native resolver fails closed on wrong ID, stale identity, missing row and source failure',async()=>{
  const path=pathFor('hotel',hotel),ctx=context();
  for(const value of [null,{...hotel,_id:'other'},{...hotel,slug:'renamed'}]) assert.notEqual((await resolveNativePath(path,ctx,async()=>value)).status,200);
  assert.equal((await resolveNativePath(path,ctx,async()=>{throw Error('offline')})).status,503);
  assert.equal((await resolveNativePath('/arcade-venues/old',ctx,async()=>{throw Error('must not fetch')})).status,404);
});
test('native category request cannot serve wrong collection or routeKind',async()=>{
  const row={_id:'mixed',slug:'fun',locationSlug:'blackpool'},path='/bowling/fun/blackpool';
  const ctx=context({entries:[{key:'NearbyAttractions:mixed',path,evidence:'fixture'}],venueRouteKinds:{'NearbyAttractions:mixed':'cinema'}});
  assert.notEqual((await resolveNativePath(path,ctx,async()=>row)).status,200);
});
const { createNativeRouter }=await import('../src/public/routes/nativeRouterAdapter.js');
const { queryAliasReplacement }=await import('../src/public/routes/queryAliasAdapter.js');
test('Wix adapter preserves original content/ID and chooses exactly registered page',async()=>{
  const rich={...hotel,guideContent:'<h2>Original content</h2>'},ctx=context({endpoints:{hotel:{...ready,pageName:'hotelGuide'}}});
  const deps={context:ctx,manifest:redirects(),readById:async()=>rich,ok:(page,data)=>({page,data}),notFound:()=>404,sendStatus:status=>status,redirect:(url,status)=>({url,status})};
  const result=await createNativeRouter(deps).canonical(pathFor('hotel',hotel));
  assert.equal(result.page,'hotelGuide');assert.equal(result.data.record._id,rich._id);assert.equal(result.data.record.shortUrl,undefined);assert.equal(result.data.record.canonicalUrl,undefined);assert.equal(result.data.record.guideContent,rich.guideContent);
});
test('Wix legacy hook returns real301 only for path aliases with working destination',async()=>{
  const router=createNativeRouter({context:context(),manifest:redirects(),readById:async()=>machine,ok:()=>200,notFound:()=>404,sendStatus:status=>status,redirect:(url,status)=>({url,status})});
  assert.deepEqual(await router.legacy(legacy[0]),{url:'https://www.spin-raiders.com/classic-fruit-machines/maygay/donkey-kong',status:'301'});
  assert.equal(await router.legacy(legacy[3]),400);
});
test('one-way query replacement cannot intercept search or canonical URLs',()=>{
  const manifest=redirects();assert.equal(queryAliasReplacement(legacy[3],manifest).replaceWith,'/classic-fruit-machines/maygay/donkey-kong');
  for(const path of ['/search?q=arcade&category=stays','/','/hotel/the-imperial-hotel-blackpool/blackpool',legacy[0]]) assert.equal(queryAliasReplacement(path,manifest).ok,false);
});
test('custom prefix preserves an explicitly mapped existing landing at empty path',async()=>{
 const ctx=context({endpoints:{cinema:{...ready,pageName:'cinemas-page'}},landings:{'/cinemas':{kind:'cinema',pageName:'cinemas-page',preservedPageId:'pyonq',seo:{title:'Existing Cinemas title'},metadata:{art:'unchanged'}}}});
 const router=createNativeRouter({context:ctx,manifest:redirects(),readById:async()=>{throw Error('no detail fetch')},ok:(page,data,seo)=>({page,data,seo}),notFound:()=>404,sendStatus:s=>s,redirect:()=>{}});
 const result=await router.canonical('/cinemas');assert.equal(result.page,'cinemas-page');assert.equal(result.data.view,'index');assert.equal(result.seo.title,'Existing Cinemas title');assert.equal(result.data.metadata.art,'unchanged');
});
test('reviewed indexed metadata supplies additive fields without mutating CMS record',()=>{
 const row={_id:'dk',title:'Donkey Kong',manufacturer:'Maygay'},ctx=context({entries:[{key:'ClassicFruitMachines:dk',path:'/classic-fruit-machines/maygay/donkey-kong',evidence:'reviewed source',metadataReviewed:true}]});
 assert.equal(resolveRecord('ClassicFruitMachines',row,ctx).href,'/classic-fruit-machines/maygay/donkey-kong');assert.equal(row.manufacturerSlug,undefined);
 assert.equal(resolveRecord('ClassicFruitMachines',{...row,manufacturerSlug:'wrong-brand'},ctx).ok,false);
});
const { staticNavigation }=await import('../src/public/routes/navigationRoutes.js');
test('verified native static navigation preserves working hubs and filter state',()=>{
 for(const path of ['/cinemas','/bowling','/agc','/food-and-drink','/search?q=blackpool&category=stays','/map?q=blackpool'])assert.equal(staticNavigation(path).href,path);
 for(const path of ['/?collection=Venues&place=x','/cinemas?place=x','/general-1-1','//evil.test','/classic-fruit-machine-archive'])assert.equal(staticNavigation(path).ok,false);
});
const { releaseIdentity }=await import('../src/public/routes/releaseIdentity.js');
test('unbuilt identity never claims a completed release fingerprint',()=>{
 assert.equal(releaseIdentity({}).complete,false);assert.equal(releaseIdentity({}).deployable,false);assert.equal(releaseIdentity({}).releaseFingerprint,null);
 const identity={releaseFingerprint:'a'.repeat(64),manifestFingerprint:'b'.repeat(64),rendererFingerprint:'c'.repeat(64)};
 assert.equal(releaseIdentity({identity}).complete,true);assert.equal(releaseIdentity({identity}).deployable,false);assert.equal(releaseIdentity({identity,deploymentBlocked:false}).deployable,true);assert.equal(releaseIdentity({identity}).contractVersion,'spin-raiders-canonical-v1');
});
test('reviewed old source slug cannot override the new canonical route identity',()=>{
 const row={...arcade,slug:'arcade-club-blackpool'},ctx=context({entries:[{key:'Venues:arcade-club',path:'/arcade/arcade-club/blackpool',evidence:'reviewed old slug',metadataReviewed:true,sourceRouteFields:{slug:'arcade-club-blackpool'}}]});
 assert.equal(resolveRecord('Venues',row,ctx).href,'/arcade/arcade-club/blackpool');assert.equal(row.slug,'arcade-club-blackpool');
 assert.equal(resolveRecord('Venues',{...row,slug:'different-place'},ctx).code,'route_source_metadata_changed');
});
test('retired semantic names redirect only with full canonical-index evidence',()=>{
 const target=resolveRecord('Venues',arcade,context()),from='/arcade/arcade-club-blackpool/blackpool';
 const mapping=[{from,key:'Venues:arcade-club'}];assert.equal(buildRedirectManifest(mapping,()=>target).complete,false);
 const manifest=buildRedirectManifest(mapping,()=>target,{canonicalPaths:[target.href]});assert.equal(manifest.entries[0].to,target.href);
 assert.equal(buildRedirectManifest(mapping,()=>target,{canonicalPaths:[from,target.href]}).complete,false);
 const unchanged=buildRedirectManifest([{from:target.href,key:'Venues:arcade-club'}],()=>target,{canonicalPaths:[target.href]});assert.equal(unchanged.entries.length,0);assert.equal(auditRedirectCoverage([target.href],unchanged).complete,true);
});
test('approved identity groups still block until complete content rendering is verified',()=>{
 const sourceGroups=[{groupId:'g',relation:'same-entity',approved:true,provenSameEntity:true,primaryKey:'HotelGuides:imperial',sourceKeys:['HotelGuides:imperial','NearbyAttractions:duplicate'],canonicalPath:pathFor('hotel',hotel),renderPolicy:{contentVerified:false}}];
 assert.equal(resolveRecord('HotelGuides',hotel,context({sourceGroups})).code,'source_group_render_review_required');
});
test('source-group aliases resolve to one primary and preserve every original record in native data',async()=>{
 const extra={_id:'duplicate',title:'Imperial',sourceFacts:'Unique original history'};
 const sourceGroups=[{groupId:'g',relation:'same-entity',approved:true,provenSameEntity:true,primaryKey:'HotelGuides:imperial',sourceKeys:['HotelGuides:imperial','NearbyAttractions:duplicate'],canonicalPath:pathFor('hotel',hotel),renderPolicy:{contentVerified:true}}];
 const ctx=context({sourceGroups,groupRecords:{'HotelGuides:imperial':hotel}});
 assert.equal(resolveRecord('NearbyAttractions',extra,ctx).href,pathFor('hotel',hotel));
 const result=await resolveNativePath(pathFor('hotel',hotel),ctx,async collection=>collection==='HotelGuides'?hotel:extra);
 assert.equal(result.sourceRecords.length,2);assert.equal(result.sourceRecords[1].row.sourceFacts,'Unique original history');
 const failed=await resolveNativePath(pathFor('hotel',hotel),ctx,async collection=>collection==='HotelGuides'?hotel:null);assert.equal(failed.status,503);
});
test('containment/related references never collapse distinct entity routes',()=>{
 const sourceGroups=[{groupId:'g',relation:'contains',approved:true,provenSameEntity:false,primaryKey:'HotelGuides:imperial',sourceKeys:['HotelGuides:imperial','NearbyAttractions:duplicate']}];
 const ctx=context({sourceGroups});assert.ok(ctx.issues.some(issue=>issue.code==='unverified_source_group'));assert.equal(resolveRecord('NearbyAttractions',{_id:'duplicate'},ctx).ok,false);
});
test('retained inactive source records are never newly exposed by an identity group',async()=>{
 const sourceGroups=[{groupId:'g',relation:'same-entity',approved:true,provenSameEntity:true,primaryKey:'HotelGuides:imperial',sourceKeys:['HotelGuides:imperial','NearbyAttractions:duplicate'],canonicalPath:pathFor('hotel',hotel),renderPolicy:{contentVerified:true}}];
 const result=await resolveNativePath(pathFor('hotel',hotel),context({sourceGroups}),async collection=>collection==='HotelGuides'?hotel:{_id:'duplicate',active:false,sourceFacts:'unpublished'});
 assert.equal(result.sourceRecords[1].withheld,true);assert.equal(Object.hasOwn(result.sourceRecords[1],'row'),false);
});
const { createDynamicDetailHook }=await import('../src/public/routes/dynamicPageAdapter.js');
test('reviewed organic business in AffiliateOffers uses its business route, never hotel guessing',()=>{
 const row={_id:'restaurant',category:'Food',affiliate:false,sponsored:false,monetizationStatus:'ORGANIC'};
 const ctx=context({entries:[{key:'AffiliateOffers:restaurant',path:'/food-and-drink/reel-plaice/blackpool',metadataReviewed:true,evidence:'verified original restaurant identity'}],venueRouteKinds:{'AffiliateOffers:restaurant':'food'}});
 assert.equal(resolveRecord('AffiliateOffers',row,ctx).href,'/food-and-drink/reel-plaice/blackpool');
 assert.equal(resolveRecord('AffiliateOffers',row,context()).code,'offer_guide_unresolved');
});
test('dynamic afterRouter prototype can replace dataset404 using exact indexed original source',async()=>{
 const row={_id:'food',title:'Reel Plaice',summary:'Original restaurant details'},route={path:'/food-and-drink/reel-plaice/blackpool'};
 const hook=createDynamicDetailHook({kind:'food',prefix:'/food-and-drink',pageName:'verified-food-item',resolve:async()=>({status:200,collection:'AffiliateOffers',row,route}),ok:(page,data)=>({status:200,page,data}),notFound:()=>404,sendStatus:s=>s});
 const result=await hook({path:['reel-plaice','blackpool'],pages:['verified-food-item']},{status:404});assert.equal(result.status,200);assert.equal(result.data.record,row);assert.equal(result.data.collection,'AffiliateOffers');
 assert.equal(await hook({path:['reel-plaice','blackpool'],pages:['different-page']},{status:404}),503);
 const listResponse={status:200,page:'native-food-list'};assert.equal(await hook({path:[]},listResponse),listResponse);
});
test('editorial variant index retains uncertainty without claiming same physical identity',async()=>{
 const row={...machine,_id:'primary'},secondary={...machine,_id:'other',technicalNotes:'Different board evidence'};
 const path='/classic-fruit-machines/barcrest/each-way-nudge';
 const group={groupId:'each-way-nudge',relation:'editorial-index',approved:true,editorialScopeApproved:true,identityUnderReview:true,provenSameEntity:false,conflictsDisclosed:true,conflicts:['Manufacturer metadata differs between original sources'],canonicalPath:path,primaryKey:'ClassicFruitMachines:primary',sourceKeys:['ClassicFruitMachines:primary','ClassicFruitMachines:other'],renderPolicy:{contentVerified:true}};
 const ctx=context({entries:[{key:group.primaryKey,path,metadataReviewed:true,sourceRouteFields:{manufacturerSlug:'maygay',machineSlug:'donkey-kong'},evidence:'approved name-based editorial index'}],sourceGroups:[group],groupRecords:{[group.primaryKey]:row}});
 const result=await resolveNativePath(path,ctx,async(_collection,id)=>id==='primary'?row:secondary);assert.equal(result.status,200);assert.equal(result.sourceGroup.identityUnderReview,true);assert.equal(result.sourceGroup.relation,'editorial-index');assert.equal(result.sourceRecords[1].row.technicalNotes,'Different board evidence');
});
test('detail-ready but directory-disabled records stay out of sitemap and SEO index',()=>{
 const row={...hotel,directoryReady:false};assert.equal(resolveRecord('HotelGuides',row,context(),{surface:'detail'}).ok,true);
 assert.equal(seoRoute('HotelGuides',row,context()).robots,'noindex,follow');assert.equal(sitemapRoutes([{collection:'HotelGuides',row}],context()).entries.length,0);
});
test('authoritative business/offer roles survive blocked routes without collection-name guessing',()=>{
 const row={_id:'real-restaurant'},key='AffiliateOffers:real-restaurant';
 assert.equal(resolveRecord('AffiliateOffers',row,context({recordRoles:{[key]:'business'}})).recordRole,'business');
 assert.equal(resolveRecord('AffiliateOffers',row,context({recordRoles:{[key]:'offer'}})).recordRole,'offer');
 assert.equal(resolveRecord('AffiliateOffers',row,context()).recordRole,'unknown');
 assert.equal(resolveRecord('HotelOffers',{_id:'offer-a'},context()).recordRole,'offer');
});
test('equivalent percent-encoded legacy title segments resolve to the same alias identity',()=>{
 assert.equal(parseLegacyInput('/classic-fruit-machine-archive-1/it%27s-magic').input,parseLegacyInput("/classic-fruit-machine-archive-1/it's-magic").input);
 assert.equal(parseLegacyInput('/classic-fruit-machine-archive-1/caf%C3%A9').input,parseLegacyInput('/classic-fruit-machine-archive-1/café').input);
 assert.equal(parseLegacyInput('/classic-fruit-machine-archive-1/%ZZ').ok,false);
});
test('explicit research-only and nonpublic attraction statuses cannot become native public guides',()=>{
 for(const researchStatus of ['NOT OPEN TO GENERAL PUBLIC','RESEARCH RETAINED','DUPLICATE']){
  assert.equal(resolveRecord('NearbyAttractions',{_id:'x',researchStatus},context()).code,'record_not_public');
 }
 assert.equal(resolveRecord('Venues',{...arcade,status:'NOT A SEPARATE VENUE'},context()).code,'record_not_public');
});
test('route inventory rejects malformed identities and cross-collection endpoint substitution',()=>{
 const ctx=context({entries:[{key:'PrivateCollection:x',path:'/hotel/imperial/blackpool',evidence:'bad'}, {key:123,path:'/hotel/imperial/blackpool',evidence:'bad'}]});
 assert.ok(ctx.issues.some(issue=>issue.code==='inventory_collection_kind_mismatch'));assert.ok(ctx.issues.some(issue=>issue.code==='invalid_inventory_entry'));assert.equal(Object.keys(ctx.owners).length,0);
});
test('suppressed secondary source cannot become a listed business through a public primary',()=>{
 const group={groupId:'g',relation:'same-entity',approved:true,provenSameEntity:true,primaryKey:'HotelGuides:imperial',sourceKeys:['HotelGuides:imperial','NearbyAttractions:duplicate'],canonicalPath:pathFor('hotel',hotel),renderPolicy:{contentVerified:true}};
 const ctx=context({sourceGroups:[group],groupRecords:{[group.primaryKey]:hotel}});
 assert.equal(resolveRecord('NearbyAttractions',{_id:'duplicate',active:false},ctx).code,'record_not_public');
 assert.equal(resolveRecord('NearbyAttractions',{_id:'duplicate',pageReady:false},ctx).code,'record_not_public');
 assert.equal(resolveRecord('NearbyAttractions',{_id:'duplicate',active:false},ctx,{surface:'redirect'}).href,pathFor('hotel',hotel));
});
test('saved map and favourite search filter state is preserved with bounded flag values',()=>{
 assert.equal(staticNavigation('/map?q=blackpool&saved=1').ok,true);assert.equal(staticNavigation('/search?q=blackpool&favourites=1').ok,true);
 assert.equal(staticNavigation('/map?saved=record-id').ok,false);assert.equal(staticNavigation('/search?favourites=unknown').ok,false);
});
test('overlapping identity groups block every affected source, not an arbitrary first group',()=>{
 const base={relation:'same-entity',approved:true,provenSameEntity:true,canonicalPath:pathFor('hotel',hotel),primaryKey:'HotelGuides:imperial',renderPolicy:{contentVerified:true}};
 const groups=[{...base,groupId:'a',sourceKeys:['HotelGuides:imperial','NearbyAttractions:a']},{...base,groupId:'b',sourceKeys:['HotelGuides:imperial','NearbyAttractions:b']}];
 const ctx=context({sourceGroups:groups,groupRecords:{'HotelGuides:imperial':hotel}});
 assert.ok(ctx.issues.some(issue=>issue.code==='overlapping_source_groups'));
 for(const _id of ['a','b'])assert.equal(resolveRecord('NearbyAttractions',{_id},ctx).code,'overlapping_source_groups');
});
test('opaque hexadecimal record tails cannot become semantic route segments',()=>{
 for(const machineSlug of ['a1a4b487','each-way-nudge-a1a4b487','machine-0123456789abcdef'])assert.equal(buildCanonical('machine',{manufacturerSlug:'barcrest',machineSlug}).ok,false);
 assert.equal(buildCanonical('machine',{manufacturerSlug:'barcrest',machineSlug:'club-500-1988'}).ok,true);
});
const { CATEGORY_PATHS, VIEW_PATHS, INDEX_ROUTES }=await import('../src/public/routes/indexRoutes.js');
test('one static view registry maps existing category/page identity to semantic roots',()=>{
 for(const key of ['arcades','cinema','fishing','nature-outdoors','bowling','bingo','holiday-parks','places-to-stay','food-drink','museums','historical-sites','theme-parks','zoos','sea-life','piers','beaches','arcade-bars','agc','services'])assert.ok(CATEGORY_PATHS[key].startsWith('/')&&!CATEGORY_PATHS[key].includes('?'));
 assert.equal(VIEW_PATHS.trip,'/plan-a-trip');assert.equal(INDEX_ROUTES.hiddenGemsIndex.prefix,'/hidden-gems');assert.equal(CATEGORY_PATHS['family-arcades'],'/arcade?type=family');
});
test('food emits category/name/town and old clean town/name is a one-way alias only',()=>{
 const built=buildCanonical('food',{townSlug:'grimsby',urlName:'masala-n-malt'});assert.equal(built.path,'/food-and-drink/masala-n-malt/grimsby');
 const ctx=context(),target=resolveRecord('FoodAndDrink',food,ctx);
 const manifest=buildRedirectManifest([{from:'/food-and-drink/grimsby/masala-n-malt',key:'FoodAndDrink:cafe'}],()=>target,{canonicalPaths:Object.keys(ctx.owners)});
 assert.equal(manifest.entries[0].to,built.path);assert.equal(manifest.entries[0].status,301);
});
test('food afterRouter prototype redirects old native order instead of serving a duplicate',async()=>{
 const old='/food-and-drink/grimsby/masala-n-malt',to='/food-and-drink/masala-n-malt/grimsby';
 const hook=createDynamicDetailHook({kind:'food',prefix:'/food-and-drink',pageName:'verified-food-item',resolve:async()=>({status:404}),resolveAlias:async path=>({ok:path===old,to,method:'server301'}),redirect:(path,status)=>({path,status}),ok:()=>200,notFound:()=>404,sendStatus:s=>s});
 const result=await hook({path:['grimsby','masala-n-malt']},{status:200,page:'verified-food-item'});assert.deepEqual(result,{path:to,status:'301'});
});
test('registered category roots preserve filter state but reject record identities',()=>{
 assert.equal(staticNavigation('/fishing-lakes?q=trout&type=coarse&town=york').ok,true);
 assert.equal(staticNavigation('/arcade?type=classic').ok,true);
 for(const path of ['/arcade?place=abc','/fishing-lakes?collection=Venues','/offers?explore=food'])assert.equal(staticNavigation(path).ok,false);
});
test('registered native blog paths remain valid, arbitrary article-shaped links do not',()=>{
 assert.equal(staticNavigation('/post/blackpool-world-fireworks-10-october-final-arcades').ok,true);
 assert.equal(staticNavigation('/blog/categories/arcade-guides').ok,true);
 assert.equal(staticNavigation('/post/nonexistent-article').ok,false);
});
test('food hook learns the platform-selected item page only from matching runtime pages',async()=>{
 const result={status:200,collection:'FoodAndDrink',row:food,route:{path:'/food-and-drink/masala-n-malt/grimsby',canonicalUrl:'https://www.spin-raiders.com/food-and-drink/masala-n-malt/grimsby'}};
 const hook=createDynamicDetailHook({kind:'food',prefix:'/food-and-drink',resolve:async()=>result,ok:page=>page,notFound:()=>404,sendStatus:s=>s});
 assert.equal(await hook({path:['masala-n-malt','grimsby'],pages:['Actual Item','Actual List']},{page:'Actual Item'}),'Actual Item');
 assert.equal(await hook({path:['masala-n-malt','grimsby'],pages:['Actual List']},{page:'Guessed Item'}),503);
 assert.equal(await hook({path:['masala-n-malt','grimsby']},{page:'Actual Item'}),503);
});
test('nationwide operator guide has a deliberate non-town contract and stays directory-disabled',()=>{
 const row={_id:'operator',slug:'hollywood-bowl',directoryReady:false},path='/bowling/hollywood-bowl';
 const ctx=context({entries:[{key:'NearbyAttractions:operator',path,evidence:'verified nationwide guide',metadataReviewed:true}],venueRouteKinds:{'NearbyAttractions:operator':'bowlingOperator'},endpoints:{bowlingOperator:ready},recordPolicies:{'NearbyAttractions:operator':{routeType:'operator',notice:'Nationwide operator guide, not an individual branch.',evidence:'verified existing record',withheldFields:[],offerActionsAllowed:false}}});
 assert.equal(resolveRecord('NearbyAttractions',row,ctx).code,'record_not_public');
 const detail=resolveRecord('NearbyAttractions',row,ctx,{surface:'detail'});assert.equal(detail.href,path);assert.equal(detail.routeType,'operator');assert.equal(detail.offerActionsAllowed,false);
});
test('current offer cannot join a historical guide whose actions are disabled',()=>{
 const ctx=context({guides:[hotel],recordPolicies:{'HotelGuides:imperial':{routeType:'historical',notice:'Historical guide',evidence:'reviewed closure',withheldFields:[],offerActionsAllowed:false}}});
 assert.equal(resolveRecord('HotelOffers',{_id:'o',hotelGuideId:'imperial'},ctx).code,'offer_actions_not_allowed');
});
