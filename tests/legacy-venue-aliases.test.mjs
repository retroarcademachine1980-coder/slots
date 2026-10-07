import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadBackend} from '../tools/test-support/wix-backend-harness.mjs';
import {createRouteContext,resolveRecord,SITE_ORIGIN} from '../src/public/routes/canonicalRoutes.js';
import {parseLegacyInput,EXACT_ENCODED_LEGACY_PATHS,exactEncodedLegacyInput,buildRedirectManifest,redirectFor} from '../src/public/routes/legacyRedirects.js';
const read=file=>JSON.parse(fs.readFileSync(new URL(file,import.meta.url)));
const manifest=read('../config/routes/manifest.json');
const records=read('./fixtures/legacy-venue-routing-public.json').records;
const proof=read('./fixtures/legacy-venue-alias-inputs.json');
const aliases=manifest.aliases.filter(alias=>alias.from.startsWith('/arcade-venues/'));
const nativeInputs=new Set(proof.nativePaths);
const keyIndex=new Map();for(const alias of aliases)(keyIndex.get(alias.from)||(keyIndex.set(alias.from,new Set()),keyIndex.get(alias.from))).add(alias.key);
const data={};for(const [key,row]of Object.entries(records)){const collection=key.split(':')[0];(data[collection]||=[]).push(row);}
const context=createRouteContext({...manifest,groupRecords:records});
const counts={ready:0,record_not_public:0};for(const [key,row]of Object.entries(records))if(key.startsWith('Venues:')){const result=resolveRecord('Venues',row,context,{surface:'redirect'});assert.ok(result.ok||result.code==='record_not_public',key+' '+result.code);counts[result.ok?'ready':result.code]++;}
const golden='/arcade-venues/golden-sands-amusements',coast='/arcade-venues/coastfields-holiday-village';
const clone=value=>JSON.parse(JSON.stringify(value));
function request(from,raw=true){const suffix=from.slice('/arcade-venues/'.length);return{path:[decodeURIComponent(suffix)],...(raw?{url:SITE_ORIGIN+from}:{})};}

test('finite observed native and exact runtime-slug inputs retain every original source identity',()=>{
 assert.equal(nativeInputs.size,2107);assert.equal(aliases.length,3806);assert.equal(keyIndex.size,3804);
 assert.equal([...keyIndex].filter(([,keys])=>keys.size>1).length,2);
 let unique=0,collision=0;for(const from of nativeInputs){const matching=Object.entries(records).filter(([key,row])=>key.startsWith('Venues:')&&row.title.toLowerCase().replaceAll(' ','-')===decodeURIComponent(from.slice('/arcade-venues/'.length))).map(([key])=>key).sort();assert.deepEqual([...keyIndex.get(from)].sort(),matching,from);matching.length===1?unique++:collision++;}
 assert.equal(unique,2105);assert.equal(collision,2);
 let overlap=0,extra=0;for(const [key,row]of Object.entries(records)){if(!key.startsWith('Venues:'))continue;const from='/arcade-venues/'+row.slug;assert.ok(keyIndex.get(from)?.has(key),from);if(nativeInputs.has(from)){overlap++;assert.ok([...keyIndex.get(from)].every(source=>records[source].title.toLowerCase().replaceAll(' ','-')===decodeURIComponent(from.slice('/arcade-venues/'.length))));}else extra++;}
 assert.equal(overlap,412);assert.equal(extra,1697);
 assert.ok(manifest.entries.every(entry=>!entry.path.startsWith('/arcade-venues/')),'aliases must never become canonical output inventory');
});
test('all 521 readiness blocks remain unchanged across 2109 venue source rows',()=>{
 assert.deepEqual(counts,{ready:1588,record_not_public:521});
 for(const [key,row]of Object.entries(records)){if(!key.startsWith('Venues:'))continue;const result=resolveRecord('Venues',row,context,{surface:'redirect'});if(result.ok)assert.ok(!result.href.startsWith('/arcade-venues/'));else assert.equal(result.href,undefined);}
});
test('all 3804 known inputs parse while only eight exact encoded-slash exceptions are admitted',()=>{
 assert.equal(EXACT_ENCODED_LEGACY_PATHS.length,8);for(const from of keyIndex.keys())assert.equal(parseLegacyInput(from).ok,true,from);
 for(const from of EXACT_ENCODED_LEGACY_PATHS){assert.equal(parseLegacyInput(SITE_ORIGIN+from).ok,true);assert.equal(exactEncodedLegacyInput(from),from);for(const bad of [from.toLowerCase(),from.replace('%2F','%252F'),from.replace('%2F','%5C'),from.replace('%2F','%2E%2E'),from+'x',from+'/',from+'?rc=test-site',from+'#x',from.replace('/arcade-venues/','/hotels/'),'https://other.test'+from,'//www.spin-raiders.com'+from,'https://x@www.spin-raiders.com'+from])assert.equal(parseLegacyInput(bad).ok,false,bad);}
 for(const bad of ['/arcade-venues/new%2Fslash','/arcade-venues/../funland','/arcade-venues/%2e%2e/funland','/arcade-venues/%252F','/arcade-venues/a\\b'])assert.equal(parseLegacyInput(bad).ok,false,bad);
});
test('registered native hook and link resolver map title and exact retired-runtime slug to one canonical owner',async()=>{
 const router=await loadBackend('backend/routers',data,{},manifest),api=await loadBackend('backend/canonicalRoutesApi',data,{},manifest);
 for(const from of ['/arcade-venues/las-vegas-amusements','/arcade-venues/las-vegas-amusement-park-southend-on-sea']){const result=await router.arcade_venues_beforeRouter(request(from));assert.equal(result.status,301);assert.equal(result.url,SITE_ORIGIN+'/arcade/las-vegas-amusements/southend-on-sea');assert.equal((await api.resolveLinkRequests([from])).results[0].href,'/arcade/las-vegas-amusements/southend-on-sea');}
 assert.equal((await router.arcade_venues_beforeRouter(request('/arcade-venues/las-vegas-amusements-invented'))).status,404);
});
test('Golden Sands identity collision remains503 before any availability or record read, in both orders',async()=>{
 const keys=[...keyIndex.get(golden)];
 for(const mode of ['ready','first-inactive','second-inactive','both-inactive','first-missing','second-missing','all-unavailable'])for(const reverse of [false,true]){
  const copy=clone(data),config=clone(manifest);for(const row of copy.Venues)if(keys.includes('Venues:'+row._id)){row.pageReady=true;row.active=true;row.status='Open';}
  if(mode.includes('inactive'))for(const row of copy.Venues)if((mode==='both-inactive'&&keys.includes('Venues:'+row._id))||keys[mode.startsWith('first')?0:1]==='Venues:'+row._id)row.active=false;
  if(mode.includes('missing'))copy.Venues=copy.Venues.filter(row=>'Venues:'+row._id!==keys[mode.startsWith('first')?0:1]);
  if(mode==='all-unavailable')copy.Venues=new Error('unavailable');if(reverse)config.aliases.reverse();
  const capture={},api=await loadBackend('backend/canonicalRoutesApi',copy,capture,config),result=await api.resolveLegacyAlias(golden);
  assert.equal(result.code,'ambiguous_legacy_source',mode);assert.equal(result.status,503);assert.equal(result.to,undefined);assert.equal(result.href,undefined);assert.equal(capture.gets,undefined,'ambiguous identities must not be picked by lookup availability');
  const links=await api.resolveLinkRequests([golden]);assert.equal(links.results[0].code,'ambiguous_internal_link');
 }
 const router=await loadBackend('backend/routers',data,{},manifest);assert.equal((await router.arcade_venues_beforeRouter(request(golden))).status,503);
});
test('Coastfields may converge only through the approved proven and preserved same-entity group',async()=>{
 for(const reverse of [false,true]){const config=clone(manifest);if(reverse)config.aliases.reverse();const api=await loadBackend('backend/canonicalRoutesApi',data,{},config),result=await api.resolveLegacyAlias(coast);assert.equal(result.ok,true);assert.equal(result.to,'/holiday-parks/coastfields-holiday-village/ingoldmells');assert.equal((await api.resolveLinkRequests([coast])).results[0].href,result.to);}
 for(const flag of ['approved','provenSameEntity','contentVerified']){const config=clone(manifest),group=config.sourceGroups.find(g=>g.sourceKeys.includes([...keyIndex.get(coast)][0]));if(flag==='contentVerified')group.renderPolicy.contentVerified=false;else group[flag]=false;const api=await loadBackend('backend/canonicalRoutesApi',data,{},config),result=await api.resolveLegacyAlias(coast);assert.equal(result.code,'ambiguous_legacy_source');assert.equal(result.status,503);}
 const copy=clone(data),primary=manifest.sourceGroups.find(g=>g.sourceKeys.includes([...keyIndex.get(coast)][0])).primaryKey.split(':')[1];copy.Venues.find(row=>row._id===primary).pageReady=false;
 const api=await loadBackend('backend/canonicalRoutesApi',copy,{},manifest);assert.equal((await api.resolveLegacyAlias(coast)).ok,false);
});
test('all eight encoded-slash inputs use actual hook with exact raw URL and one matching path segment',async()=>{
 const router=await loadBackend('backend/routers',data,{},manifest),api=await loadBackend('backend/canonicalRoutesApi',data,{},manifest);let ready=0,blocked=0;
 for(const from of EXACT_ENCODED_LEGACY_PATHS){const alias=await api.resolveLegacyAlias(from);const expected=alias.ok?301:404;alias.ok?ready++:blocked++;
  for(const token of [from.slice('/arcade-venues/'.length),decodeURIComponent(from.slice('/arcade-venues/'.length))]){const result=await router.arcade_venues_beforeRouter({path:[token],url:SITE_ORIGIN+from});assert.equal(result.status,expected,from);if(alias.ok)assert.equal(result.url,SITE_ORIGIN+alias.to);else assert.equal(result.url,undefined);}
  for(const raw of [undefined,SITE_ORIGIN+from.replace('%2F','%252F'),SITE_ORIGIN+from.replace('%2F','%2f'),SITE_ORIGIN+from+'?rc=test-site',SITE_ORIGIN+from+'#x','https://other.test'+from])assert.equal((await router.arcade_venues_beforeRouter({...request(from,false),url:raw})).status,404,String(raw));
  assert.equal((await router.arcade_venues_beforeRouter({path:['funland'],url:SITE_ORIGIN+from})).status,404);
  assert.equal((await router.arcade_venues_beforeRouter({path:decodeURIComponent(from.slice('/arcade-venues/'.length)).split('/'),url:SITE_ORIGIN+from})).status,404);
 }
 // Hidden venues now send their old address to their town page when it exists (7 Oct 2026).
 assert.equal(ready+blocked,8);assert.ok(ready>=4);
});

test('pure per-input manifest never resurrects a partly blocked alias in any ordering',()=>{
 const href='/arcade/test/york',good={ok:true,href},blocked={ok:false,code:'record_not_public'};
 for(const keys of [['good','blocked'],['blocked','good'],['good','blocked','good']]){
  const entries=keys.map(key=>({from:'/arcade-venues/mixed',key})).concat({from:'/arcade-venues/independent',key:'good'});
  const built=buildRedirectManifest(entries,key=>key==='good'?good:blocked,{canonicalPaths:[href]});
  assert.equal(built.complete,false);assert.equal(redirectFor('/arcade-venues/mixed',built).ok,false);assert.equal(redirectFor('/arcade-venues/independent',built).to,href);
 }
});
test('record readiness, source outages and metadata drift cannot fall back to stored URLs',async()=>{
 const from='/arcade-venues/las-vegas-amusements',id='0029b177-77f4-4a39-930e-3a59684421fd';
 for(const mode of ['not-public','missing','unavailable','metadata-drift','stale-link']){
  const copy=clone(data),row=copy.Venues.find(row=>row._id===id);row.shortUrl='/arcade/invented/town';
  if(mode==='not-public')row.pageReady=false;if(mode==='missing')copy.Venues=copy.Venues.filter(row=>row._id!==id);if(mode==='unavailable')copy.Venues=new Error('offline');if(mode==='metadata-drift')row.slug='unexpected-new-slug';
  const api=await loadBackend('backend/canonicalRoutesApi',copy,{},manifest),result=await api.resolveLegacyAlias(from);
  if(mode==='stale-link'){assert.equal(result.to,'/arcade/las-vegas-amusements/southend-on-sea');continue;}
  if(mode==='not-public'){assert.ok(result.ok?result.to.startsWith('/destination/'):result.status===404,mode);continue;}
  assert.equal(result.ok,false,mode);assert.equal(result.status,mode==='not-public'?404:503,mode);assert.equal(result.to,undefined);
 }
});
