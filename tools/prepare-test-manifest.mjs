/** Assemble a testable immutable candidate, never production acceptance. */
import fs from 'node:fs';import crypto from 'node:crypto';
import {createRouteContext} from '../src/public/routes/canonicalRoutes.js';
const input=process.argv[2],proof=process.argv[3];
if(!input||!proof)throw Error('Pass reconciled manifest JSON and completed local preservation/UI evidence log');
const manifest=JSON.parse(fs.readFileSync(input)),evidence=fs.readFileSync(proof),digest=crypto.createHash('sha256').update(evidence).digest('hex');
for(const [kind,endpoint]of Object.entries(manifest.endpoints)){
 if(endpoint.configured!==true||!endpoint.pageId||!endpoint.revision||!endpoint.evidence)throw Error('Missing captured endpoint contract '+kind);
 Object.assign(endpoint,{native:true,renderer:true,verificationStage:'configured-and-locally-tested',nativeAcceptance:false,rendererEvidenceSha256:digest});
}
for(const group of manifest.sourceGroups)group.renderPolicy={...group.renderPolicy,contentVerified:true,contentVerificationStage:'local-source-preservation-tests',contentEvidenceSha256:digest,nativePreservationAccepted:false};
manifest.stage='testable';manifest.productionAccepted=false;manifest.deploymentBlocked=false;
manifest.blockingReason='Production promotion remains blocked until actual native HTTP, SEO, hooks, browser, alias and host acceptance';
manifest.localValidation={evidenceSha256:digest,meaning:'Reviewed source metadata, captured native bindings and local renderer preservation tests. Does not assert native E2E acceptance.'};
const context=createRouteContext(manifest);if(context.issues.length)throw Error(JSON.stringify(context.issues));
const root=new URL('../',import.meta.url);fs.mkdirSync(new URL('config/routes/',root),{recursive:true});
fs.writeFileSync(new URL('config/routes/manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log('TESTABLE candidate prepared, productionAccepted=false. '+manifest.entries.length+' entity bindings, '+manifest.sourceGroups.length+' preserved groups.');
