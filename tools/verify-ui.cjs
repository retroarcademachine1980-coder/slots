// Each maintained suite runs once; old command aliases deliberately are not repeated.
// The aggregate cannot certify a mix of concurrently edited source/bundle revisions.
const {execFileSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
function snapshot(){const files=[];const walk=dir=>{for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else if(item.isFile())files.push(file)}};for(const dir of ['src','dist'])walk(path.join(root,dir));return Object.fromEntries(files.sort().map(file=>[path.relative(root,file),crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));}
const before=snapshot();
for(const suite of ['frontend-authority','runtime-readiness','incoming-alias','return-navigation','curated-home','business-contracts','rich-content','source-preservation','canonical-details','visitor-journey','search-map','map-startup','navigation-fishing','discovery','fishing-resilience','discovery-bundle']){
 console.log('\n=== '+suite+' ===');
 execFileSync(process.execPath,['--import',path.join(__dirname,'register-wix-test-loader.mjs'),path.join(__dirname,'verify-'+suite+'.cjs'),...(suite==='runtime-readiness'?['--with-dom']:[])],{stdio:'inherit',cwd:root});
}
assert.deepEqual(snapshot(),before,'Candidate source/bundles changed during aggregate; rerun on one frozen candidate');
console.log('PASS immutable aggregate input SHA256 '+JSON.stringify(Object.fromEntries(Object.entries(before).filter(([name])=>['dist/sr.js','dist/sr.core.min.js','dist/sr.rest.min.js','dist/sr.page.min.js','dist/sr.discovery.min.js','dist/sr.idle.min.js'].includes(name)))));
