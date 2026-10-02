import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { ownsNativePage, createEmergencyView, bootInline } from './inline-boot.mjs';
import { startReleaseLoader } from './runtime-loader.mjs';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const registry=JSON.parse(fs.readFileSync(new URL('../../generated/loader-page-ownership.json',import.meta.url),'utf8'));
const fullSource=fs.readFileSync(new URL('../../generated/runtime-ownership.js',import.meta.url),'utf8');
function fixture(path='/',id='jrgbr') {const d=new JSDOM('<head></head><body><div id="SITE_CONTAINER"><div id="SITE_PAGES"><div id="'+id+'"><div class="wixui-page"></div></div></div></div></body>',{url:'https://www.spin-raiders.com'+path,runScripts:'outside-only'});d.window.eval(fullSource);d.window.fetch=async()=>{};return d;}
test('emergency classifier preserves query precedence and transition modes',()=>{
 const d=fixture();
 for(const [id,path]of [['zcvbk','/classic-fruit-machines?collection=Bogus&place=x'],['jrgbr','/?sr=classic&explore=not-a-category'],['jrgbr','/?explore=places-to-stay'],['jrgbr','/?report=1'],['jrgbr','/?view=trip'],['jrgbr','/?collection=Venues&place=abc'],['cfe9p','/search?view=articles'],['cfe9p','/search?q=abc'],['m1m88','/profile']])for(const transitionalIndexInputs of [true,false]){
  const url=new URL(path,'https://www.spin-raiders.com'),options={transitionalIndexInputs};
  assert.equal(ownsNativePage(id,url,registry,options),d.window.SR_RUNTIME_OWNERSHIP.owns(url.href,options),id+' '+path+' '+JSON.stringify(options));
 }
 d.window.close();
});
test('same emergency node changes loading to error; unowned navigation releases only owned hide',async()=>{
 const d=fixture('/classic-fruit-machines','zcvbk'),{window:w}=d,v=createEmergencyView(w,w.document,registry);
 const node=w.document.getElementById('sr-runtime-status');assert.ok(node);assert.equal(node.getAttribute('data-state'),'loading');v.failure();assert.equal(w.document.getElementById('sr-runtime-status'),node);assert.equal(node.getAttribute('data-state'),'failed');
 w.history.pushState({},'','/privacy-policy');w.document.querySelector('#SITE_PAGES > div').id='brat7';v.sync();assert.equal(w.document.getElementById('sr-hold'),null);assert.equal(w.document.getElementById('sr-runtime-status'),null);v.release();w.close();
});
test('pending fingerprint race cannot retain native hold on privacy',async()=>{
 const d=fixture(),w=d.window;
 const result=await startReleaseLoader({window:w,document:w.document,config:{},ownsRoute:l=>w.SR_RUNTIME_OWNERSHIP.owns(l.href),preservedBootstrap:()=>{},readInputs:async()=>({}),select:async({onCandidateNative})=>{onCandidateNative();w.history.pushState({},'','/privacy-policy');return {runtime:'blocked',reason:'candidate_backend_not_ready'}}});
 assert.equal(result.runtime,'blocked');assert.equal(w.document.getElementById('sr-hold'),null);assert.equal(w.document.getElementById('sr-runtime-status'),null);
 w.history.pushState({},'','/search');w.dispatchEvent(new w.PopStateEvent('popstate'));assert.ok(w.document.getElementById('sr-runtime-status'));
 w.history.pushState({},'','/privacy-policy');w.dispatchEvent(new w.PopStateEvent('popstate'));assert.equal(w.document.getElementById('sr-hold'),null);w.close();
});
test('candidate-loader asset failure keeps accessible recovery without injecting either core',async()=>{
 const d=fixture('/classic-fruit-machines','zcvbk'),w=d.window,append=w.document.head.appendChild.bind(w.document.head);w.document.head.appendChild=n=>{const r=append(n);if(n.tagName==='SCRIPT')queueMicrotask(()=>n.onerror());return r};
 const result=await bootInline({window:w,document:w.document,config:{assetCommit:'a'.repeat(40)},pageRegistry:registry,preservedBootstrap:()=>{throw Error('Wrong runtime')},readInputs:async()=>({}),select:async({onCandidateNative})=>{onCandidateNative();return {runtime:'candidate-test'}}});
 assert.equal(result.reason,'candidate_loader_failed');assert.equal(w.document.getElementById('sr-runtime-status').getAttribute('data-state'),'failed');assert.match(w.document.getElementById('sr-runtime-status').textContent,/RetryHomeSearch/);assert.equal([...w.document.scripts].some(s=>s.src.includes('/sr.core')),false);w.close();
});

test('native route transition releases stale page hold before old DOM is replaced',async()=>{
 const d=fixture(),w=d.window,nativeRouter={mainPageId:'jrgbr',routes:{'./privacy-policy':{type:'Static',pageId:'brat7'},'./classic-fruit-machines':{type:'Dynamic',pageIds:['zcvbk']}}};
 const v=createEmergencyView(w,w.document,registry,{},nativeRouter);assert.ok(w.document.getElementById('sr-hold'));
 w.history.pushState({},'','/privacy-policy');w.dispatchEvent(new w.PopStateEvent('popstate'));assert.equal(w.document.getElementById('sr-hold'),null);assert.equal(w.document.getElementById('sr-runtime-status'),null);
 const old=w.document.getElementById('SITE_PAGES'),replacement=w.document.createElement('div');replacement.id='SITE_PAGES';replacement.innerHTML='<div id="brat7"><div class="wixui-page"></div></div>';old.replaceWith(replacement);await new Promise(r=>setImmediate(r));assert.equal(w.document.getElementById('sr-hold'),null);
 w.history.pushState({},'','/classic-fruit-machines/maygay/donkey-kong');replacement.innerHTML='<div id="zcvbk"><div class="wixui-page"></div></div>';await new Promise(r=>setImmediate(r));assert.ok(w.document.getElementById('sr-hold'));v.release();w.close();
});
