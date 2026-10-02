/** Local deterministic reconciliation. Never writes the active routeManifest. */
import fs from 'node:fs';
import { createRouteContext, ROUTES, SITE_ORIGIN } from '../src/public/routes/canonicalRoutes.js';
import { CATEGORY_PATHS, INDEX_ROUTES } from '../src/public/routes/indexRoutes.js';
const root=new URL('../',import.meta.url),read=file=>JSON.parse(fs.readFileSync(new URL(file,root)));
const machine=read('generated/machine-index-candidate.json'),business=read('generated/business-index-candidate.json');
const captured=read('docs/captured-native-handlers.json'),content=read('generated/current-index-content.json');
const preflight='/workspace/shared/spin-raiders-release-preflight-20261002/';
const preserved=JSON.parse(fs.readFileSync(preflight+'landing-replacement-manifest.json'));
const entries=[...machine.entries,...business.entries], aliases=[...machine.aliases,...business.aliases];
// Evidence snapshots stay outside runtime. Keep only reviewed routing/group facts.
const groupFields=['groupId','relation','approved','provenSameEntity','editorialScopeApproved','identityUnderReview','conflictsDisclosed','canonicalPath','canonicalKind','primaryKey','sourceKeys','renderPolicy'];
const sourceGroups=[...machine.sourceGroups,...business.sourceGroups].map(group=>Object.fromEntries(groupFields.filter(field=>Object.hasOwn(group,field)).map(field=>[field,group[field]])));
const endpoints={},landings={},legacyEndpoints={};
for(const binding of captured){
 if(binding.routeRole==='legacy-alias'){legacyEndpoints[binding.prefix]=binding;continue;}
 const view=content.entries.find(entry=>entry.path==='/'+binding.prefix);
 if(!view)throw Error('Current design root missing: '+binding.prefix);
 endpoints[binding.kind]={native:false,renderer:false,configured:true,pageName:binding.pageName,pageId:binding.pageId,routerId:binding.routerId,revision:'isolated-f37020b8-ui18',evidence:'Exact saved native handler configuration; actual runtime not yet verified'};
 const kind=binding.kind==='machine'?'machineIndex':binding.kind;
 const old=preserved.landings.find(landing=>landing.path===view.path);
 landings[view.path]=old?old.contextLanding:{kind,pageName:binding.pageName,preservedContentRef:view.source,seo:{title:view.title,description:view.description,noIndex:false,links:[{rel:'canonical',href:SITE_ORIGIN+view.path}]},metadata:{sourceTitle:view.title,viewKey:view.key}};
}
endpoints.machineIndex={...endpoints.machine};
endpoints.bowlingOperator={...endpoints.bowling};
for(const [kind,pageId]of [['hotel','psc8e'],['destination','aa2s4'],['food','mmbdr']])endpoints[kind]={native:false,renderer:false,configured:true,pageId,revision:'isolated-f37020b8-ui18',evidence:kind==='food'?'Existing town/name dynamic binding; new name/town multisource hook not yet tested':'Native dynamic configuration captured; actual final renderer runtime not yet verified'};
const manifest={schemaVersion:1,entries,aliases,venueRouteKinds:business.venueRouteKinds,recordRoles:business.recordRoles,recordPolicies:business.recordPolicies||{},sourceGroups,endpoints,legacyEndpoints,landings,requiredCanonicalRoots:[...new Set([...Object.values(CATEGORY_PATHS).map(path=>path.split('?')[0]),...Object.values(INDEX_ROUTES).map(route=>route.prefix)])].sort(),indexAliasesActive:false,deploymentPhase:'transition',deploymentBlocked:true,blockingReason:'Pending full business metadata resolution, group content preservation, native handler/deep-link proof, full runtime and host redirect acceptance'};
const context=createRouteContext(manifest);
const pathKinds=new Set(entries.map(entry=>entry.path.split('/')[1]));
const issues=[...context.issues];
for(const kind of Object.keys(ROUTES))if(pathKinds.has(ROUTES[kind].prefix.slice(1))&&!endpoints[kind])issues.push({code:'missing_endpoint_contract',kind});
fs.writeFileSync(new URL('generated/unified-route-manifest.candidate.json',root),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(new URL('generated/unified-route-manifest.audit.json',root),JSON.stringify({entries:entries.length,aliases:aliases.length,sourceGroups:sourceGroups.length,landings:Object.keys(landings).length,endpoints:Object.keys(endpoints).length,requiredCanonicalRoots:manifest.requiredCanonicalRoots,issues,deployable:false},null,2)+'\n');
console.log(JSON.stringify({entries:entries.length,aliases:aliases.length,sourceGroups:sourceGroups.length,landings:Object.keys(landings).length,issues,deployable:false}));if(issues.length)process.exitCode=1;
