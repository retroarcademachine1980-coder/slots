/** Computes a review identity only. Does not open deployment gates or publish. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const manifestPath=process.argv[2];
if(!manifestPath)throw Error('Pass the fully reconciled candidate manifest JSON path');
const manifest=JSON.parse(fs.readFileSync(manifestPath));
delete manifest.identity;
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));return value;}
const manifestFingerprint=hash(JSON.stringify(stable(manifest)));
const runtimeManifest=path.join(root,'src/runtime/manifest.json');
if(!fs.existsSync(runtimeManifest))throw Error('Maintained runtime source has not been frozen/extracted yet');
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(/\.(js|json|css)$/.test(entry.name)&&!entry.name.includes('routeManifest.generated')&&!entry.name.includes('routes-authority.generated')) { const body=fs.readFileSync(p,'utf8'); if(!body.includes('Generated from src/public/routes; do not hand-edit'))files.push(p); }}}
walk(path.join(root,'src')); // Includes public SEO, page master code and every maintained renderer/adapter.
for(const file of ['tools/split-bundle.py','tools/build-runtime.py','tools/build-browser-route-client.mjs','tools/build-test-runtime.py','tools/build-runtime-ownership.mjs','tools/build-loader-page-ownership.mjs','tools/build-route-manifest.mjs','tools/release/build-identity.mjs','tools/release/runtime-loader.mjs','tools/release/inline-boot.mjs','tools/release/compile-loader.mjs','tools/release/fixtures/preserved-loader.html','tools/release/package.json','tools/release/package-lock.json','dist/homepage-core.json','dist/inner-idle.json'])if(fs.existsSync(path.join(root,file)))files.push(path.join(root,file));
files.sort();
const sourceFingerprint=hash(files.map(file=>path.relative(root,file)+'\0'+hash(fs.readFileSync(file))).join('\n'));
const rendererFingerprint=hash(fs.readFileSync(runtimeManifest)+'\n'+sourceFingerprint);
const releaseFingerprint=hash('spin-raiders-canonical-v1\n'+manifestFingerprint+'\n'+rendererFingerprint);
const result={contractVersion:'spin-raiders-canonical-v1',releaseFingerprint,manifestFingerprint,rendererFingerprint,sourceFiles:files.length,deploymentBlocked:manifest.deploymentBlocked!==false};
fs.writeFileSync(path.join(root,'generated/release-identity.review.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
