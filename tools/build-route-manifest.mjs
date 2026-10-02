/** Compile the one reviewed, versioned manifest input. Does not infer readiness. */
import fs from 'node:fs';
import { createRouteContext } from '../src/public/routes/canonicalRoutes.js';
const input=process.argv[2]||new URL('../config/routes/manifest.json',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(input));
const context=createRouteContext(manifest);
if(context.issues.length)throw Error('Invalid route manifest: '+JSON.stringify(context.issues));
function validateNoPrivate(value) {
 if(!value||typeof value!=='object')return;
 for(const [key,item] of Object.entries(value)){
  if(['sourceSnapshots','sourceRecords','_owner','auditNotes'].includes(key)||/backup/i.test(key))throw Error('Private source evidence must not enter public route manifest: '+key);
  validateNoPrivate(item);
 }
}
validateNoPrivate(manifest);
const output='// Generated from the reviewed route manifest. Edit its one versioned input, not this module.\nexport const routeManifest = Object.freeze('+JSON.stringify(manifest)+');\n';
fs.writeFileSync(new URL('../src/public/routes/routeManifest.generated.js',import.meta.url),output);
console.log('Compiled '+manifest.entries.length+' reviewed bindings; deploymentBlocked='+String(manifest.deploymentBlocked));
