import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createRouteContext} from '../src/public/routes/canonicalRoutes.js';
import {resolveNativePath} from '../src/public/routes/nativeRouteResolver.js';
const {records}=JSON.parse(fs.readFileSync(new URL('./fixtures/each-way-nudge-public.json',import.meta.url)));
test('real Each Way Nudge public text/photos and contradictory source facts survive the route adapter',async()=>{
 const path='/classic-fruit-machines/barcrest/each-way-nudge',primaryKey='ClassicFruitMachines:classic-each-way-nudge';
 const ctx=createRouteContext({entries:[{key:primaryKey,path,evidence:'reviewed editorial routing scope',metadataReviewed:true}],sourceGroups:[{groupId:'barcrest-each-way-nudge',relation:'editorial-index',approved:true,editorialScopeApproved:true,identityUnderReview:true,conflictsDisclosed:true,conflicts:['Original manufacturer/variant facts remain under review'],primaryKey,sourceKeys:records.map(row=>'ClassicFruitMachines:'+row._id),canonicalPath:path,renderPolicy:{contentVerified:true}}],endpoints:{machine:{native:true,renderer:true,revision:'FIXTURE-ONLY',evidence:'not native proof'}}});
 const original=JSON.stringify(records);
 const result=await resolveNativePath(path,ctx,async(_collection,id)=>records.find(row=>row._id===id));
 assert.equal(result.status,200);assert.equal(result.sourceRecords.length,2);assert.equal(result.sourceGroup.identityUnderReview,true);
 for(const source of result.sourceRecords)assert.deepEqual(source.row,projectPublicDetail('ClassicFruitMachines',records.find(row=>row._id===source.row._id)));
 assert.equal(JSON.stringify(records),original);assert.equal(result.sourceRecords[0].row.manufacturer,'Barcrest');assert.ok(result.sourceRecords[0].row.manufacturers.includes('JPM'));
 assert.ok(result.sourceRecords.every(source=>source.row.history&&source.row.heroImage));
});
const { projectPublicDetail } = await import('../src/public/routes/publicDetailProjection.js');
test('detail API projection default-denies internal fields at every nesting level',()=>{
 const row={_id:'x',title:'Public title',history:'All original public history',_owner:'private-owner',auditNotes:'private-audit',contentRepairBackup20260920:'private-backup',heroImage:{url:'public.jpg',token:'private-token'},gallery:[{src:'photo.jpg',credit:'Public author',privateContact:'private-email'}],sourceAttributions:[{title:'Public source',url:'https://example.com',internalNotes:'private'}],venuePhotoEvidence:{items:[{url:'photo.jpg',license:'Public license',_owner:'private'}],auditNotes:'private'},guideDetails:{kind:'Hotel',facts:['Public fact',{secret:'private'}],photos:[{src:'hotel.jpg',secret:'private'}],privateNotes:'private'}};
 const out=projectPublicDetail('ClassicFruitMachines',row),serialized=JSON.stringify(out);
 assert.equal(out.history,row.history);assert.equal(out.heroImage.url,'public.jpg');assert.equal(out.gallery[0].credit,'Public author');
 assert.equal(serialized.includes('private'),false);assert.equal(row._owner,'private-owner');
 assert.deepEqual(projectPublicDetail('Locations',{_id:'loc',title:'York',_owner:'private',unreviewedBlob:{x:1}}),{_id:'loc',title:'York'});
});
test('historical/unverified policy retains public narrative but removes current visit and booking claims',()=>{
 const row={_id:'old',title:'Original business name',description:'Original historical account',bookingUrl:'https://booking.test',affiliateUrl:'https://offers.test',address:'unverified address',openingHours:'9 to 5',sourceUrl:'https://evidence.test'};
 const out=projectPublicDetail('AffiliateOffers',row,{offerActionsAllowed:false,withheldFields:['address','openingHours']});
 assert.equal(out.description,row.description);assert.equal(out.sourceUrl,row.sourceUrl);assert.equal(out.bookingUrl,undefined);assert.equal(out.affiliateUrl,undefined);assert.equal(out.address,undefined);assert.equal(out.openingHours,undefined);
});
