import fs from 'node:fs';
import { createRouteContext, resolveRecord } from '../src/public/routes/canonicalRoutes.js';
const root=new URL('../',import.meta.url);
const input=JSON.parse(fs.readFileSync(new URL('generated/machine-index-candidate.json',root)));
const dir='/workspace/shared/spin-raiders-canonical-map-20261002';
const records=new Map();for(const file of fs.readdirSync(dir).filter(name=>/^page-\d+\.json$/.test(name))){for(const item of JSON.parse(fs.readFileSync(dir+'/'+file)).dataItems||[])records.set(item.id,{...item.data,_id:item.id});}
const context=createRouteContext({...input,endpoints:{machine:{native:true,renderer:true,revision:'OFFLINE-TEST-ONLY',evidence:'test harness fixture; no native proof'}}});
const outcomes=[];for(const entry of input.entries){const row=records.get(entry.key.split(':')[1]);outcomes.push({key:entry.key,...resolveRecord('ClassicFruitMachines',row,context)});}
const report={fixtureOnly:true,totalRecords:records.size,indexed:input.entries.length,linked:outcomes.filter(x=>x.ok).length,blockedByPublicationFlags:outcomes.filter(x=>x.code==='record_not_public').length,pendingEditorialRendering:outcomes.filter(x=>x.code==='source_group_render_review_required').length,otherIssues:outcomes.filter(x=>!x.ok&&!['record_not_public','source_group_render_review_required'].includes(x.code)),nativeVerified:false};
fs.writeFileSync(new URL('generated/machine-index-test.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,otherIssues:report.otherIssues.length}));if(report.otherIssues.length)process.exitCode=1;
