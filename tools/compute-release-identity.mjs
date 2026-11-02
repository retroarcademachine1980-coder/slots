/** Computes a review identity only. Does not open deployment gates or publish. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const manifestPath=process.argv[2];
if(!manifestPath)throw Error('Pass the fully reconciled candidate manifest JSON path');
const gitTreeArgument=process.argv[3];
if(process.argv.length>4||gitTreeArgument&&!/^--git-tree=[a-f0-9]{40}$/.test(gitTreeArgument))throw Error('Only an exact --git-tree=<tree SHA> may follow the manifest path');
const gitTree=gitTreeArgument?.slice('--git-tree='.length);
const manifest=JSON.parse(fs.readFileSync(manifestPath));
delete manifest.identity;
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));return value;}
const manifestFingerprint=hash(JSON.stringify(stable(manifest)));
const runtimeManifest=path.join(root,'src/runtime/manifest.json');
if(!fs.existsSync(runtimeManifest))throw Error('Maintained runtime source has not been frozen/extracted yet');
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(/\.(js|json|css)$/.test(entry.name)&&!entry.name.includes('routeManifest.generated')&&!entry.name.includes('routes-authority.generated')) { const body=fs.readFileSync(p,'utf8'); if(!body.includes('Generated from src/public/routes; do not hand-edit'))files.push(p); }}}
walk(path.join(root,'src')); // Includes public SEO, page master code and every maintained renderer/adapter.
for(const file of ['config/routes/native-bindings.json','tools/native-bindings.mjs','tools/generate-native-handlers.mjs','tools/generate-native-navigation.mjs','tools/split-bundle.py','tools/build-runtime.py','tools/build-browser-route-client.mjs','tools/build-test-runtime.py','tools/build-runtime-ownership.mjs','tools/build-loader-page-ownership.mjs','tools/build-route-manifest.mjs','tools/release/build-identity.mjs','tools/release/runtime-loader.mjs','tools/release/inline-boot.mjs','tools/release/compile-loader.mjs','tools/release/fixtures/preserved-loader.html','tools/release/package.json','tools/release/package-lock.json','dist/homepage-core.json','dist/inner-idle.json'])if(fs.existsSync(path.join(root,file)))files.push(path.join(root,file));
let sourceEntries, runtimeManifestBytes;
if(gitTree){
 // Hash the actual Git blobs and POSIX paths, exactly as the existing algorithm
 // sees them in a Linux checkout. Windows checkout filters must not silently
 // redefine the source identity of a repository deployment.
 if(execFileSync('git',['cat-file','-t',gitTree],{cwd:root}).toString('ascii').trim()!=='tree')throw Error('The immutable source reference must be a Git tree');
 const names=execFileSync('git',['ls-tree','-r','-z','--name-only',gitTree],{cwd:root}).toString('utf8').split('\0').filter(Boolean);
 const wanted=new Set(files.map(file=>path.relative(root,file).split(path.sep).join('/')));
 const selected=names.filter(name=>wanted.has(name)).sort();
 if(selected.length!==files.length)throw Error('Git tree does not contain the complete reconciled source inventory');
 const batch=execFileSync('git',['cat-file','--batch'],{cwd:root,input:selected.map(name=>gitTree+':'+name).join('\n')+'\n',maxBuffer:32*1024*1024});
 let cursor=0;const blobs=new Map();
 for(const name of selected){
  const end=batch.indexOf(10,cursor);if(end<0)throw Error('Incomplete Git blob header');
  const header=batch.subarray(cursor,end).toString('ascii');
  const match=/^[a-f0-9]{40} blob (\d+)$/.exec(header);if(!match)throw Error('Missing Git source blob: '+name);
  const size=Number(match[1]);cursor=end+1;
  const body=batch.subarray(cursor,cursor+size);if(body.length!==size||batch[cursor+size]!==10)throw Error('Incomplete Git source blob');
  blobs.set(name,body);cursor+=size+1;
 }
 if(cursor!==batch.length)throw Error('Unexpected Git source data');
 sourceEntries=selected.map(name=>name+'\0'+hash(blobs.get(name)));
 runtimeManifestBytes=blobs.get('src/runtime/manifest.json');
 if(!runtimeManifestBytes)throw Error('Missing Git runtime manifest');
}else{
 files.sort();
 sourceEntries=files.map(file=>path.relative(root,file)+'\0'+hash(fs.readFileSync(file)));
 runtimeManifestBytes=fs.readFileSync(runtimeManifest);
}
const sourceFingerprint=hash(sourceEntries.join('\n'));
const rendererFingerprint=hash(runtimeManifestBytes+'\n'+sourceFingerprint);
const releaseFingerprint=hash('spin-raiders-canonical-v1\n'+manifestFingerprint+'\n'+rendererFingerprint);
const result={contractVersion:'spin-raiders-canonical-v1',releaseFingerprint,manifestFingerprint,rendererFingerprint,sourceFiles:files.length,deploymentBlocked:manifest.deploymentBlocked!==false};
if(gitTree)fs.writeFileSync(path.join(root,'generated/release-source-digests.review.json'),JSON.stringify({gitTree,manifestFingerprint,sourceFingerprint,runtimeManifestSHA256:hash(runtimeManifestBytes),entries:sourceEntries.map(entry=>{const [name,sha256]=entry.split('\0');return {name,sha256};})},null,2)+'\n');
fs.writeFileSync(path.join(root,'generated/release-identity.review.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
