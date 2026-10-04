import fs from 'node:fs';
import { buildCanonical, createRouteContext } from '../src/public/routes/canonicalRoutes.js';
const source='/workspace/shared/spin-raiders-canonical-map-20261002/machine-canonical-map.json';
const rows=JSON.parse(fs.readFileSync(source,'utf8'));
const proposals=JSON.parse(fs.readFileSync('/workspace/shared/spin-raiders-canonical-map-20261002/canonical-source-grouping-proposals.json'));
const proposal=proposals.find(group=>group.groupKey==='barcrest-each-way-nudge');
if(!proposal)throw Error('Required original Each Way Nudge source group missing');
const sourceGroup={groupId:proposal.groupKey,relation:'editorial-index',approved:true,editorialScopeApproved:true,identityUnderReview:true,provenSameEntity:false,conflictsDisclosed:true,conflicts:proposal.attributionConflicts||[],canonicalPath:proposal.canonicalPath,canonicalKind:'machine',primaryKey:'ClassicFruitMachines:'+proposal.proposedCanonicalRecordId,sourceKeys:proposal.sourceRecordIds.map(id=>'ClassicFruitMachines:'+id),renderPolicy:{contentVerified:false,uniqueContentReviewRequired:true,preserveSourceRecords:true},sourceSnapshots:proposal.sourceRecords};
const entries=[],aliases=[],unresolved=[];
for(const row of rows){
 const groupMember=sourceGroup.sourceKeys.includes('ClassicFruitMachines:'+row.machineId);
 if(groupMember&&sourceGroup.primaryKey!=='ClassicFruitMachines:'+row.machineId)continue;
 const built=buildCanonical('machine',{manufacturerSlug:row.proposedManufacturerSlug||row.manufacturerSlug,machineSlug:row.proposedMachineSlug||row.machineSlug});
 if((!groupMember&&(row.safeCandidateForFieldPopulation!==true||row.blockingIssues?.length||row.canonicalSourceGroup))||!built.ok){unresolved.push({id:row.machineId,issues:row.blockingIssues||[built.code||'source_group_review_required']});continue;}
 if(built.path!==row.proposedCanonicalPath){unresolved.push({id:row.machineId,issues:['map_path_disagreement']});continue;}
 const key='ClassicFruitMachines:'+row.machineId;
 entries.push({key,path:built.path,evidence:'read-only machine canonical map 2026-10-02; source record retained',metadataReviewed:true});
 for(const sourceRow of (groupMember?rows.filter(sourceRow=>sourceGroup.sourceKeys.includes('ClassicFruitMachines:'+sourceRow.machineId)):[row])) {
 for(const old of sourceRow.oldUrls||[])aliases.push({from:old.path,key});
 aliases.push({from:'/?sr=classic&machine='+encodeURIComponent(sourceRow.machineId),key});
 aliases.push({from:'/?collection=ClassicFruitMachines&place='+encodeURIComponent(sourceRow.machineId),key});
 }
}
// Known bookmarks for retained nonpublic rows still get an explicit current
// publication decision; absence from the canonical index never invents a URL.
const indexedIds=new Set(entries.map(entry=>entry.key.slice('ClassicFruitMachines:'.length)));
for(const row of rows)if(!indexedIds.has(row.machineId)&&!sourceGroup.sourceKeys.includes('ClassicFruitMachines:'+row.machineId)){
 const key='ClassicFruitMachines:'+row.machineId;
 for(const old of row.oldUrls||[])aliases.push({from:old.path,key});
 aliases.push({from:'/?sr=classic&machine='+encodeURIComponent(row.machineId),key});
 aliases.push({from:'/?collection=ClassicFruitMachines&place='+encodeURIComponent(row.machineId),key});
}
const context=createRouteContext({entries});
const candidate={entries,sourceGroups:[sourceGroup],endpoints:{machine:{native:false,renderer:false,pageName:'classic-fruit-machines-page',draftPageId:'zcvbk',draftRouterId:'routers-muqq3e4v',evidence:'isolated shell only; handlers/renderer not verified'},machineIndex:{native:false,renderer:false,pageName:'classic-fruit-machines-page'}},venueRouteKinds:{},aliases,deploymentBlocked:true,blockingReason:'Machine-only candidate inventory; remaining business inventory, source groups, native runtime and aliases unverified'};
const root=new URL('../',import.meta.url);fs.mkdirSync(new URL('generated/',root),{recursive:true});
fs.writeFileSync(new URL('generated/machine-index-candidate.json',root),JSON.stringify(candidate,null,2)+'\n');
fs.writeFileSync(new URL('generated/machine-index-audit.json',root),JSON.stringify({records:rows.length,entries:entries.length,aliases:aliases.length,unresolved,contractIssues:context.issues,publicationReady:false},null,2)+'\n');
console.log(JSON.stringify({records:rows.length,entries:entries.length,aliases:aliases.length,unresolved:unresolved.length,pendingEditorialSources:sourceGroup.sourceKeys.length,collisions:context.issues.length,publicationReady:false}));
