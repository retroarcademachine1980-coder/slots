import fs from 'node:fs';
import {register} from 'node:module';register('./wix-test-loader.mjs',import.meta.url);
const {EXACT_LEGACY_RECORD_ALIASES}=await import('../src/public/routes/legacyRedirects.js');
import { buildCanonical, parseCanonical, createRouteContext, ROUTES, resolveRecord } from '../src/public/routes/canonicalRoutes.js';
const dir='/workspace/shared/spin-raiders-business-export';
const overrides=new Map([...JSON.parse(fs.readFileSync(dir+'/core-record-review-overrides.json')),...JSON.parse(fs.readFileSync(dir+'/reviewed-exception-routes.json'))].map(row=>[row.key,row]));
const recordPolicies=JSON.parse(fs.readFileSync(dir+'/record-policies.json'));
const baseRows=JSON.parse(fs.readFileSync(dir+'/canonical-records.json')).map(row=>overrides.get(row.key)||row);
const curated=JSON.parse(fs.readFileSync(dir+'/curated-six-food-identities.json'));
const foodOwnership=new Map(JSON.parse(fs.readFileSync(dir+'/food-source-ownership.json')).map(row=>[row.sourceKey,row]));
const affiliateCandidates=JSON.parse(fs.readFileSync(dir+'/affiliate-business-candidates.json'));
const historicAliases=JSON.parse(fs.readFileSync(dir+'/historic-query-aliases.json'));
// Metadata review is separate from endpoint readiness. This local reconciliation
// never changes mapper evidence or CMS fields; readiness stays closed below.
const rows=[...baseRows,...affiliateCandidates].map(input=>{
 const row=structuredClone(overrides.get(input.key)||input), ownership=foodOwnership.get(row.key);
 if(recordPolicies[row.key]?.routeType==='operator')row.canonicalKind='bowlingOperator';
 if(ownership){row.routeFields=ownership.routeFields;row.metadataReviewed=true;row.blockingIssues=[];}
 if(row.identityReviewed===true&&row.addressTownReviewed===true&&row.blockingIssues.every(code=>code==='source_aware_native_renderer_required')){row.metadataReviewed=true;row.blockingIssues=[];}
 if(row.canonicalKind==='food'&&row.routeFields){const built=buildCanonical('food',row.routeFields);if(built.ok)row.canonicalPath=built.path;}
 return row;
});
const sourceGroups=JSON.parse(fs.readFileSync(dir+'/source-groups-reviewed.json'));
for(const group of sourceGroups){if(group.canonicalKind==='food'){
 const primary=rows.find(row=>row.key===group.primaryKey), built=primary&&buildCanonical('food',primary.routeFields);
 if(!built?.ok)throw Error('Food group lacks reviewed name/town fields: '+group.groupId);
 group.canonicalPath=built.path;
}}
const groupsBySource=new Map();for(const group of sourceGroups)for(const key of group.sourceKeys)groupsBySource.set(key,group);
const entries=[],aliases=[],unresolved=[],venueRouteKinds={},recordRoles=JSON.parse(fs.readFileSync(dir+'/affiliate-record-roles.json'));
for(const row of rows){
 const group=groupsBySource.get(row.key);
 if(group&&group.primaryKey!==row.key)continue;
 const parsed=group?parseCanonical(group.canonicalPath):buildCanonical(row.canonicalKind,row.routeFields);
 const kind=group?.canonicalKind||row.canonicalKind, fields=group?parsed.params:row.routeFields;
 if(!parsed.ok||(!group&&(row.blockingIssues.length||!row.metadataReviewed||parsed.path!==row.canonicalPath))){unresolved.push({key:row.key,title:row.title,path:row.canonicalPath,issues:row.blockingIssues.length?row.blockingIssues:[parsed.code||'unverified_metadata']});continue;}
 const sourceRouteFields=Object.fromEntries(ROUTES[kind].fields.map(field=>[field,row.sourceFields[field]??null]));
 entries.push({key:row.key,path:parsed.path,evidence:group?'Identity-proven source group; display review still blocked':'Complete read-only live business metadata 2026-10-02; original row retained',metadataReviewed:true,sourceRouteFields});
 if(['Venues','NearbyAttractions','AffiliateOffers'].includes(row.collection))venueRouteKinds[row.key]=kind;
}
const indexed=new Set(entries.map(entry=>entry.key));
for(const row of rows){
 const key=groupsBySource.get(row.key)?.primaryKey||row.key;if(!indexed.has(key)&&recordPolicies[row.key]?.publicServingAllowed!==false)continue;
 for(const old of row.oldPaths)if(old.verifiedSourceValue)aliases.push({from:old.path,key});
 aliases.push({from:'/?collection='+encodeURIComponent(row.collection)+'&place='+encodeURIComponent(row.id),key});
}
for(const alias of historicAliases){const key=groupsBySource.get(alias.targetKey)?.primaryKey||alias.targetKey;if(!indexed.has(key)||!alias.verifiedSourceValue)continue;aliases.push({from:alias.oldPath,key});if(alias.pathAgnosticQueryCompatibility)aliases.push({from:'/'+alias.queryOnlyAlias,key});}
const coveredInputs=new Set(rows.map(row=>row.key));
for(const row of affiliateCandidates)if(!coveredInputs.has(row.key))unresolved.push({key:row.key,title:row.title,path:row.canonicalPath,issues:row.blockingIssues,sourceRetained:true});
for(const alias of EXACT_LEGACY_RECORD_ALIASES)if(indexed.has(alias.key))aliases.push(alias);
const candidate={entries,aliases,venueRouteKinds,recordRoles,recordPolicies,sourceGroups,endpoints:{},deploymentBlocked:true,blockingReason:'Source groups require displayed-content preservation review; native endpoints/aliases not fully verified'};
const testContext=createRouteContext({...candidate,groupRecords:Object.fromEntries(rows.map(row=>[row.key,row.sourceFields])),endpoints:Object.fromEntries(Object.keys(ROUTES).map(kind=>[kind,{native:true,renderer:true,revision:'OFFLINE-TEST-ONLY',evidence:'fixture, not native readiness'}]))});
const covered=rows.filter(row=>indexed.has(row.key)||indexed.has(groupsBySource.get(row.key)?.primaryKey));
const outcomes=covered.map(row=>({key:row.key,...resolveRecord(row.collection,row.sourceFields,testContext)}));
const audit={total:rows.length,unreviewedAdditionalAffiliateBusinesses:affiliateCandidates.filter(row=>!coveredInputs.has(row.key)).length,sourceRecordsCovered:covered.length,indexed:entries.length,sourceGroups:sourceGroups.length,pendingGroupRendering:outcomes.filter(row=>row.code==='source_group_render_review_required').length,unresolved,aliases:aliases.length,collisions:testContext.issues,fixtureOnly:true,linked:outcomes.filter(row=>row.ok).length,blockedByPublicationFlags:outcomes.filter(row=>row.code==='record_not_public').length,otherIssues:outcomes.filter(row=>!row.ok&&!['record_not_public','source_group_render_review_required'].includes(row.code))};
const root=new URL('../',import.meta.url);fs.writeFileSync(new URL('generated/business-index-candidate.json',root),JSON.stringify(candidate,null,2)+'\n');fs.writeFileSync(new URL('generated/business-index-audit.json',root),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({...audit,unresolved:unresolved.length,collisions:audit.collisions.length,otherIssues:audit.otherIssues.length}));if(audit.otherIssues.length||audit.collisions.length)process.exitCode=1;
