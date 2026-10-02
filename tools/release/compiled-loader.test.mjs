import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const root=new URL('.',import.meta.url);
const outputDir=fs.mkdtempSync(path.join(os.tmpdir(),'sr-loader-test-'));
const target=name=>path.join(outputDir,name);
const fixture=name=>new URL('fixtures/'+name,root).pathname;
function read(name){return fs.readFileSync(name.includes('.fixture.')||name.startsWith('compiler-fixture')?target(name):new URL(name,root),'utf8');}
function createPage(path='/') { const d=new JSDOM('<html><head></head><body><div id="SITE_CONTAINER"></div></body></html>',{url:'https://www.spin-raiders.com'+path,runScripts:'outside-only'});d.window.TextEncoder=TextEncoder;Object.defineProperty(d.window.crypto,'subtle',{value:webcrypto.subtle});return d; }
function resources(w){return [...w.document.querySelectorAll('link,script[src]')].map(n=>({tag:n.tagName,attrs:Object.fromEntries([...n.attributes].map(a=>[a.name,a.value]).sort(([a],[b])=>a.localeCompare(b)))}));}
function baselineExpected(w){const html=read('fixtures/preserved-loader.html').replace(/<noscript>[\s\S]*?<\/noscript>/g,'');for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>|<link\b([^>]*)>/g)){if(match[2])w.eval(match[2]);else{const n=w.document.createElement(match[3]===undefined?'script':'link');for(const a of (match[3]??match[1]).matchAll(/([\w-]+)(?:="([^"]*)")?/g))n.setAttribute(a[1],a[2]??'');w.document.head.appendChild(n);}}}
function installPreservedInputs(w){const p=JSON.parse(read('fixtures/production-6300-projection.json'));const model={site:{metaSiteId:p.metaSiteId,siteId:p.siteId},siteFeaturesConfigs:{router:{pagesMap:p.pages,routes:p.routes,mainPageId:p.mainPageId,pageIdToPrefix:p.pageIdToPrefix},platform:{bootstrapData:{wixCodeBootstrapData:{wixCodeModel:{appData:{codeAppId:p.codeAppId}}},platformAPIData:{routersConfigMap:p.routerBindings}}}}};const essential={site:{externalBaseUrl:'https://www.spin-raiders.com'},commonConfig:{siteRevision:6300}};for(const[id,value]of [['wix-essential-viewer-model',essential],['wix-viewer-model',model]]){const n=w.document.createElement('script');n.id=id;n.type='application/json';n.textContent=JSON.stringify(value);w.document.body.appendChild(n);}}

test('compiler produces one size-compliant inline guard and pinned candidate asset',()=>{
 execFileSync(process.execPath,[new URL('compile-loader.mjs',root).pathname,fixture('compiler-config.json'),target('compiler-fixture.html'),target('compiler-fixture-asset.js')]);
 const html=read('compiler-fixture.html');assert.ok(html.length<=15000);assert.equal([...html.matchAll(/<script>/g)].length,1);assert.equal([...html.matchAll(/<\/script>/g)].length,1);assert.match(read('compiler-fixture-asset.js'),/SR_CANDIDATE_BOOT/);
});
for(const path of ['/','/search','/destination/blackpool'])test('compiled preserved replay matches original captured resources: '+path,async()=>{
 const actual=createPage(path),expected=createPage(path),w=actual.window;installPreservedInputs(w);w.fetch=()=>{throw Error('Preserved build must not request candidate fingerprint')};
 w.eval(read('compiler-fixture.html').match(/<script>([\s\S]*?)<\/script>/)[1]);const result=await w.__SR_RELEASE_BOOT__;assert.equal(result.runtime,'preserved');baselineExpected(expected.window);
 assert.deepEqual(resources(w),resources(expected.window));assert.equal(w.document.querySelectorAll('[src*="sr.release-loader"]').length,0);assert.equal(w.document.getElementById('sr-runtime-status'),null);assert.equal(w.document.getElementById('sr-hold')?.textContent,expected.window.document.getElementById('sr-hold')?.textContent);actual.window.close();expected.window.close();
});

test('compiled candidate guard hands over once to explicit test entry and owner readiness',async()=>{
 const { nativeBuildHash }=await import('./build-identity.mjs');
 const base=JSON.parse(read('fixtures/production-6300-projection.json'));
 const model={site:{metaSiteId:base.metaSiteId,siteId:base.siteId},siteFeaturesConfigs:{router:{pagesMap:{zcvbk:{pageId:'zcvbk',pageJsonFileName:'candidate_fixture_99.json',title:'Machine'}},routes:{},mainPageId:'zcvbk',pageIdToPrefix:{zcvbk:'classic-fruit-machines'}},platform:{bootstrapData:{wixCodeBootstrapData:{wixCodeModel:{appData:{codeAppId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}}},platformAPIData:{routersConfigMap:{}}}}}};
 const config=JSON.parse(read('fixtures/compiler-config.json'));config.nativeBuildHash=await nativeBuildHash(model,webcrypto.subtle);
 fs.writeFileSync(target('candidate-test-config.fixture.json'),JSON.stringify(config));
 execFileSync(process.execPath,[new URL('compile-loader.mjs',root).pathname,target('candidate-test-config.fixture.json'),target('candidate-compiled.fixture.html'),target('candidate-compiled.fixture.js')]);
 const d=createPage('/classic-fruit-machines/maygay/donkey-kong'),w=d.window;
 w.document.getElementById('SITE_CONTAINER').innerHTML='<div id="SITE_PAGES"><div id="zcvbk"><div class="wixui-page"></div></div></div>';
 const essential={site:{externalBaseUrl:'https://www.spin-raiders.com'},commonConfig:{siteRevision:'99',branchId:config.testIdentity.branchId}};
 for(const[id,value]of [['wix-essential-viewer-model',essential],['wix-viewer-model',model]]){const n=w.document.createElement('script');n.id=id;n.type='application/json';n.textContent=JSON.stringify(value);w.document.body.appendChild(n);}
 const fetched=[];w.fetch=async path=>{fetched.push(path);return {ok:true,headers:new Headers({'content-type':'application/json'}),text:async()=>JSON.stringify({...config.expectedFingerprint,complete:true,deployable:true})}};
 const append=w.document.head.appendChild.bind(w.document.head);let candidateLoads=0;
 w.document.head.appendChild=node=>{const result=append(node);queueMicrotask(()=>{
  if(node.src?.endsWith('sr.release-loader.min.js')){candidateLoads++;w.eval(read('candidate-compiled.fixture.js'));node.onload();}
  else if(node.tagName==='LINK'&&node.href.endsWith('/sr.min.css'))node.onload();
  else if(node.src?.endsWith('sr.core.test.min.js')){w.dispatchEvent(new w.CustomEvent('sr:page-ready',{detail:{owner:'detail',navigationKey:w.location.pathname}}));node.onload();}
 });return result;};
 w.eval(read('candidate-compiled.fixture.html').match(/<script>([\s\S]*?)<\/script>/)[1]);const result=await w.__SR_RELEASE_BOOT__;
 assert.equal(result.runtime,'candidate-test');assert.equal(candidateLoads,1);assert.deepEqual(fetched,['/_functions/canonicalFingerprint?rc=test-site']);
 assert.equal(w.document.getElementById('sr-runtime-status'),null);assert.ok(w.document.getElementById('sr-hold'));assert.equal(w.document.querySelectorAll('#sr-site-fonts').length,1);
 assert.equal([...w.document.scripts].some(s=>s.src.includes('4d086208')),false);w.close();
});
