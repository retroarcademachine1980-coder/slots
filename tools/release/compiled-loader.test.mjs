import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const nativeBindings=JSON.parse(fs.readFileSync(new URL('../../config/routes/native-bindings.json',import.meta.url),'utf8'));
const machinePageId=nativeBindings.customRouters.find(router=>router.kind==='machine').pageId;
const root=new URL('.',import.meta.url);
const outputDir=fs.mkdtempSync(path.join(os.tmpdir(),'sr-loader-test-'));
const target=name=>path.join(outputDir,name);
const fixture=name=>fileURLToPath(new URL('fixtures/'+name,root));
function read(name){return fs.readFileSync(name.includes('.fixture.')||name.startsWith('compiler-fixture')?target(name):new URL(name,root),'utf8');}
const pageObservers = new WeakMap();
function createPage(path='/') { const d=new JSDOM('<html><head></head><body><div id="SITE_CONTAINER"></div></body></html>',{url:'https://www.spin-raiders.com'+path,runScripts:'dangerously',pretendToBeVisual:true});d.window.TextEncoder=TextEncoder;d.window.TextDecoder=TextDecoder;Object.defineProperty(d.window.crypto,'subtle',{value:webcrypto.subtle});const observers=[];const Observer=d.window.MutationObserver;d.window.MutationObserver=class extends Observer { constructor(callback) {super(callback);observers.push(this);} };pageObservers.set(d,observers);return d; }
async function closePage(page) { await new Promise(resolve => page.window.requestAnimationFrame(() => page.window.requestAnimationFrame(resolve))); for(const observer of pageObservers.get(page)) observer.disconnect(); page.window.close(); }
function resources(w){return [...w.document.querySelectorAll('link,script[src]')].map(n=>({tag:n.tagName,attrs:Object.fromEntries([...n.attributes].map(a=>[a.name,a.value]).sort(([a],[b])=>a.localeCompare(b)))}));}
function baselineExpected(w){const html=read('fixtures/preserved-loader.html').replace(/<noscript>[\s\S]*?<\/noscript>/g,'');for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>|<link\b([^>]*)>/g)){if(match[2])w.eval(match[2]);else{const n=w.document.createElement(match[3]===undefined?'script':'link');for(const a of (match[3]??match[1]).matchAll(/([\w-]+)(?:="([^"]*)")?/g))n.setAttribute(a[1],a[2]??'');w.document.head.appendChild(n);}}}
function installPreservedInputs(w,capture='production-6300-projection.json'){const p=JSON.parse(read('fixtures/'+capture));const model={site:{metaSiteId:p.metaSiteId,siteId:p.siteId},siteFeaturesConfigs:{router:{pagesMap:p.pages,routes:p.routes,mainPageId:p.mainPageId,pageIdToPrefix:p.pageIdToPrefix},platform:{bootstrapData:{wixCodeBootstrapData:{wixCodeModel:{appData:{codeAppId:p.codeAppId}}},platformAPIData:{routersConfigMap:p.routerBindings}}}}};const essential={site:{externalBaseUrl:'https://www.spin-raiders.com'},commonConfig:capture.startsWith('production-2-')?{siteRevision:2,branchId:'2b33cc8e-4df1-4761-b1ca-b94bd9a3ff85'}:{siteRevision:6300}};for(const[id,value]of [['wix-essential-viewer-model',essential],['wix-viewer-model',model]]){const n=w.document.createElement('script');n.id=id;n.type='application/json';n.textContent=JSON.stringify(value);w.document.body.appendChild(n);}}

test('compiler produces one size-compliant inline guard and pinned candidate asset',()=>{
 execFileSync(process.execPath,[fileURLToPath(new URL('compile-loader.mjs',root)),fixture('compiler-config.json'),target('compiler-fixture.html'),target('compiler-fixture-asset.js')]);
 const html=read('compiler-fixture.html');assert.ok(html.length<=15000);assert.equal([...html.matchAll(/<script>/g)].length,1);assert.equal([...html.matchAll(/<\/script>/g)].length,1);assert.match(read('compiler-fixture-asset.js'),/SR_CANDIDATE_BOOT/);
 const crawler=new JSDOM('<!doctype html><html><head>'+html+'<title>Visitor guide</title><meta name="description" content="Plan a seaside day"><link rel="canonical" href="https://www.spin-raiders.com/"></head><body><main>Guide</main></body></html>');
 assert.equal(crawler.window.document.head.querySelector('meta[name="description"]')?.content,'Plan a seaside day','Loader markup must not close the head for non-JavaScript crawlers');
 assert.equal(crawler.window.document.head.querySelector('link[rel="canonical"]')?.href,'https://www.spin-raiders.com/');crawler.window.close();
});
for(const path of ['/','/search','/destination/blackpool'])test('compiled preserved replay matches original captured resources: '+path,async()=>{
 const actual=createPage(path),expected=createPage(path),w=actual.window;installPreservedInputs(w);w.fetch=()=>{throw Error('Preserved build must not request candidate fingerprint')};
 w.eval(read('compiler-fixture.html').match(/<script>([\s\S]*?)<\/script>/)[1]);const result=await w.__SR_RELEASE_BOOT__;assert.equal(result.runtime,'preserved');baselineExpected(expected.window);
 assert.deepEqual(resources(w),resources(expected.window));assert.equal(w.document.querySelectorAll('[src*="sr.release-loader"]').length,0);assert.equal(w.document.getElementById('sr-runtime-status'),null);assert.equal(w.document.getElementById('sr-hold')?.textContent,expected.window.document.getElementById('sr-hold')?.textContent);await Promise.all([closePage(actual),closePage(expected)]);
});

for(const capture of ['production-2-anonymous-projection.json','production-2-owner-projection.json','production-2-nov5-anonymous-projection.json','production-2-nov5-owner-projection.json']) test('current public build retains every captured helper without candidate reads: '+capture,async()=>{
 const actual=createPage('/destination/grimsby'),expected=createPage('/destination/grimsby'),w=actual.window;
 installPreservedInputs(w,capture);let reads=0;w.fetch=()=>{++reads;throw Error('Preserved build must not request candidate');};
 w.eval(read('compiler-fixture.html').match(/<script>([\s\S]*?)<\/script>/)[1]);
 assert.equal((await w.__SR_RELEASE_BOOT__).runtime,'preserved');assert.equal(reads,0);baselineExpected(expected.window);
 assert.deepEqual(resources(w),resources(expected.window));
 assert.equal(w.document.querySelectorAll('[src*="536bf2d32c7c5ec313603305b5cd02e5b02df1b4"]').length,1);
 assert.equal(w.document.querySelectorAll('[src*="preview-pair-guard"],[src*="sr.release-loader"]').length,0);
 await Promise.all([closePage(actual),closePage(expected)]);
});

test('compiled candidate guard hands over once to explicit test entry and owner readiness',async()=>{
 const { nativeBuildHash }=await import('./build-identity.mjs');
 const base=JSON.parse(read('fixtures/production-6300-projection.json'));
 const model={site:{metaSiteId:base.metaSiteId,siteId:base.siteId},siteFeaturesConfigs:{router:{pagesMap:{[machinePageId]:{pageId:machinePageId,pageJsonFileName:'candidate_fixture_99.json',title:'Machine'}},routes:{},mainPageId:machinePageId,pageIdToPrefix:{[machinePageId]:'classic-fruit-machines'}},platform:{bootstrapData:{wixCodeBootstrapData:{wixCodeModel:{appData:{codeAppId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}}},platformAPIData:{routersConfigMap:{}}}}}};
 const config=JSON.parse(read('fixtures/compiler-config.json'));config.nativeBuildHash=await nativeBuildHash(model,webcrypto.subtle);
 fs.writeFileSync(target('candidate-test-config.fixture.json'),JSON.stringify(config));
 execFileSync(process.execPath,[fileURLToPath(new URL('compile-loader.mjs',root)),target('candidate-test-config.fixture.json'),target('candidate-compiled.fixture.html'),target('candidate-compiled.fixture.js')]);
 const d=createPage('/classic-fruit-machines/maygay/donkey-kong'),w=d.window;
 w.document.getElementById('SITE_CONTAINER').innerHTML='<div id="SITE_PAGES"><div id="'+machinePageId+'"><div class="wixui-page"></div></div></div>';
 const essential={site:{externalBaseUrl:'https://www.spin-raiders.com'},commonConfig:{siteRevision:'99',branchId:config.testIdentity.branchId}};
 for(const[id,value]of [['wix-essential-viewer-model',essential],['wix-viewer-model',model]]){const n=w.document.createElement('script');n.id=id;n.type='application/json';n.textContent=JSON.stringify(value);w.document.body.appendChild(n);}
 const fetched=[];w.fetch=async path=>{fetched.push(path);return {ok:true,headers:new Headers({'content-type':'application/json'}),text:async()=>JSON.stringify({...config.expectedFingerprint,complete:true,deployable:true})}};
 const append=w.document.head.appendChild.bind(w.document.head);let candidateLoads=0;
 w.document.head.appendChild=node=>{const result=append(node);queueMicrotask(()=>{
  if(node.src?.endsWith('sr.release-loader.min.js')){candidateLoads++;w.eval(read('candidate-compiled.fixture.js'));node.onload?.();}
  else if(node.tagName==='LINK'&&node.href.endsWith('/sr.min.css'))node.onload?.();
  else if(node.src?.endsWith('sr.core.test.min.js')){w.dispatchEvent(new w.CustomEvent('sr:page-ready',{detail:{owner:'detail',navigationKey:w.location.pathname}}));node.onload?.();}
 });return result;};
 w.eval(read('candidate-compiled.fixture.html').match(/<script>([\s\S]*?)<\/script>/)[1]);const result=await w.__SR_RELEASE_BOOT__;
 assert.equal(result.runtime,'candidate-test');assert.equal(candidateLoads,1);assert.deepEqual(fetched,['/_functions/canonicalFingerprint?rc=test-site']);
 assert.equal(w.document.getElementById('sr-runtime-status'),null);assert.ok(w.document.getElementById('sr-hold'));assert.equal(w.document.querySelectorAll('#sr-site-fonts').length,1);
 const expected=createPage('/classic-fruit-machines/maygay/donkey-kong');baselineExpected(expected.window);
 const captured=resources(expected.window).filter(r=>!r.attrs.src?.includes('@ef3373799a9d721c6c5eb19647d856ff1a1252e5/'));
 for(const resource of captured)assert(resources(w).some(actual=>JSON.stringify(actual)===JSON.stringify(resource)),'Missing current supplement '+JSON.stringify(resource));
 assert.equal(w.document.querySelectorAll('[src*="ef3373799a9d721c6c5eb19647d856ff1a1252e5"],[src*="preview-pair-guard"]').length,0);
 assert.equal(w.document.querySelectorAll('[src*="536bf2d32c7c5ec313603305b5cd02e5b02df1b4"]').length,1);
 assert.equal(w.document.getElementById('sr-hold').getAttribute('data-sr-owner'),'release-loader');
 w.eval(read('candidate-compiled.fixture.html').match(/<script>([\s\S]*?)<\/script>/)[1]);await w.__SR_RELEASE_BOOT__;
 assert.equal(candidateLoads,1);assert.equal(w.document.querySelectorAll('[src*="536bf2d32c7c5ec313603305b5cd02e5b02df1b4"]').length,1);
 await Promise.all([closePage(d),closePage(expected)]);
});
