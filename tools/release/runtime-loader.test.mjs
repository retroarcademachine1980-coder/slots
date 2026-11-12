import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { selectRuntime } from './build-identity.mjs';
import { navigationKey, candidateAssets, createFingerprintReader, createLifecycle, loadResource, waitForNativeInputs, startReleaseLoader, FONT_HREF } from './runtime-loader.mjs';

test('navigation key includes query and normalizes trailing slash',()=>{
 assert.equal(navigationKey({pathname:'/search/',search:'?q=foo'}),'/search?q=foo');
 assert.notEqual(navigationKey({pathname:'/',search:'?explore=food'}),navigationKey({pathname:'/',search:'?explore=arcades'}));
});
test('candidate assets are one immutable commit with explicit test entry',()=>{
 const config={assetCommit:'a'.repeat(40)};
 assert.match(candidateAssets(config,'candidate-test').entry,/@a{40}\/dist\/sr.core.test.min.js$/);
 assert.equal(candidateAssets(config,'candidate-test').css,candidateAssets(config,'candidate-production').css);
 for(const bad of ['main','APPROVED_COMMIT','a'.repeat(39)])assert.throws(()=>candidateAssets({assetCommit:bad},'candidate-test'));
 assert.throws(()=>candidateAssets(config,'preserved'));
});
test('fingerprint reader uses fixed endpoints and read-only no-cache no-redirect transport',async()=>{
 let call; const read=createFingerprintReader(async(...args)=>{call=args;return {ok:true,headers:new Headers({'content-type':'application/json'}),text:async()=>'{"complete":true}'}});
 assert.deepEqual(await read('/_functions/canonicalFingerprint?rc=test-site'),{complete:true});
 assert.equal(call[1].method,'GET');assert.equal(call[1].cache,'no-store');assert.equal(call[1].redirect,'error');
 await assert.rejects(read('https://other.example/?x=1'));
});
test('fingerprint rejects wrong MIME, bad status, oversized or malformed body',async()=>{
 for(const override of [{ok:false},{headers:new Headers({'content-type':'text/html'})},{text:async()=>'x'.repeat(2049)},{text:async()=>'{no'}]){
  const read=createFingerprintReader(async()=>({ok:true,headers:new Headers({'content-type':'application/json'}),text:async()=>'{}',...override}));
  await assert.rejects(read('/_functions/canonicalFingerprint'));
 }
});
test('fingerprint fetch aborts at bounded deadline',async()=>{
 const read=createFingerprintReader((url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')))),{timeoutMs:5});
 await assert.rejects(read('/_functions/canonicalFingerprint'),/aborted/);
});
function harness(){const calls=[],timers=new Map();let seq=0;const view=Object.fromEntries(['loading','hold','failure','clearStatus','release'].map(n=>[n,(...a)=>calls.push([n,...a])]));const lifecycle=createLifecycle({view,schedule:f=>{timers.set(++seq,f);return seq},cancel:id=>timers.delete(id)});return {calls,timers,lifecycle};}
test('visible status precedes native hold, duplicate navigation does not flash spinner',()=>{
 const h=harness();h.lifecycle.begin('/search?q=a',true);h.lifecycle.begin('/search?q=a',true);
 assert.deepEqual(h.calls,[['loading','/search?q=a'],['hold','/search?q=a']]);assert.equal(h.timers.size,1);
});
test('ready and meaningful failed both clear deadline/status but preserve owned hide',()=>{
 for(const owner of ['detail','search']){const h=harness();h.lifecycle.begin('/a',true);assert.equal(h.lifecycle.terminal({owner,navigationKey:'/a'}),true);assert.equal(h.timers.size,0);assert.deepEqual(h.calls.at(-1),['clearStatus','/a']);assert.equal(h.calls.some(c=>c[0]==='release'),false);}
});
test('stale query ready or malformed ready cannot clear current view',()=>{
 const h=harness();h.lifecycle.begin('/?explore=food',true);h.lifecycle.begin('/?explore=arcade',true);
 assert.equal(h.lifecycle.terminal({owner:'detail',navigationKey:'/?explore=food'}),false);
 assert.equal(h.lifecycle.terminal({navigationKey:'/?explore=arcade'}),false);assert.equal(h.timers.size,1);
});
test('native-only navigation releases only view-owned resources and ignores late failure',()=>{
 const h=harness();h.lifecycle.begin('/a',true);h.lifecycle.begin('/privacy-policy',false);
 assert.deepEqual(h.calls.at(-1),['release']);assert.equal(h.timers.size,0);assert.equal(h.lifecycle.failure('/a','late'),false);
});
test('timeout and asset failure keep accessible error with no old native reveal',()=>{
 const h=harness();h.lifecycle.begin('/a',true);[...h.timers.values()][0]();assert.deepEqual(h.calls.at(-1),['failure','/a','load_timeout']);
 h.lifecycle.failure('/a','asset_failure');assert.deepEqual(h.calls.at(-1),['failure','/a','asset_failure']);assert.equal(h.calls.some(c=>c[0]==='release'),false);
});
test('resource load errors and timeout reject rather than pretending ready',async()=>{
 const doc={createElement:()=>({setAttribute(){}}),head:{appendChild:n=>queueMicrotask(()=>n.onerror())}};
 await assert.rejects(loadResource(doc,'script',{src:'x'},20),/failed/);
 doc.head.appendChild=()=>{};await assert.rejects(loadResource(doc,'script',{src:'x'},5),/timeout/);
});
test('initial native scripts are parsed from DOM and observer stops',async()=>{
 const nodes={'wix-essential-viewer-model':{textContent:'{"a":1}'},'wix-viewer-model':{textContent:'{"b":2}'}};
 assert.deepEqual(await waitForNativeInputs({body:{},getElementById:id=>nodes[id]}),{essential:{a:1},model:{b:2}});
});

function fullNativeFixture() {
 const p=JSON.parse(fs.readFileSync(new URL('./fixtures/production-2-nov5-anonymous-projection.json',import.meta.url),'utf8'));
 return {site:{metaSiteId:p.metaSiteId,siteId:p.siteId,externalBaseUrl:'https://www.spin-raiders.com',siteRevision:2},commonConfig:{siteRevision:'2',branchId:'599d9d7c-96cb-46dc-b284-5e0b18c72d5e'},siteFeaturesConfigs:{router:{pagesMap:p.pages,routes:p.routes,mainPageId:p.mainPageId,pageIdToPrefix:p.pageIdToPrefix},platform:{bootstrapData:{wixCodeBootstrapData:{wixCodeModel:{appData:{codeAppId:p.codeAppId}}},platformAPIData:{routersConfigMap:p.routerBindings}}}}};
}
function fullOnlyDocument(model, essential) {
 const nodes={'wix-viewer-model':{textContent:JSON.stringify(model)}};
 if(essential!==undefined)nodes['wix-essential-viewer-model']={textContent:essential};
 return {body:{},documentElement:{},getElementById:id=>nodes[id]};
}
class IdleObserver { observe(){} disconnect(){} }

test('missing essential script can use the complete same-site model without weakening build identity',async()=>{
 const model=fullNativeFixture();
 const inputs=await waitForNativeInputs(fullOnlyDocument(model),{MutationObserverImpl:IdleObserver,timeoutMs:10});
 assert.deepEqual(inputs.model,model);
 assert.deepEqual(inputs.essential,{site:{externalBaseUrl:'https://www.spin-raiders.com'},commonConfig:{siteRevision:'2',branchId:'599d9d7c-96cb-46dc-b284-5e0b18c72d5e'}});
 const args={...inputs,config:{},subtle:crypto.webcrypto.subtle,readFingerprint:async()=>{throw Error('Preserved input must not read candidate endpoint');}};
 assert.equal((await selectRuntime(args)).runtime,'preserved');
 const unknown=structuredClone(inputs);unknown.model.siteFeaturesConfigs.router.pagesMap.brat7.pageJsonFileName+='-UNKNOWN';
 assert.equal((await selectRuntime({...args,...unknown})).runtime,'blocked');
});

test('missing essential script rejects partial, foreign or conflicting model identity',async()=>{
 const invalid=[{},fullNativeFixture(),fullNativeFixture(),fullNativeFixture(),fullNativeFixture(),fullNativeFixture()];
 invalid[1].site.externalBaseUrl='https://other.example';invalid[2].site.metaSiteId='00000000-0000-0000-0000-000000000000';invalid[3].commonConfig.siteRevision='6376';invalid[4].commonConfig.branchId='unverified';delete invalid[5].commonConfig;
 await Promise.all(invalid.map(model=>assert.rejects(waitForNativeInputs(fullOnlyDocument(model),{MutationObserverImpl:IdleObserver,timeoutMs:5}),/Native identity unavailable/)));
 await assert.rejects(waitForNativeInputs(fullOnlyDocument(fullNativeFixture(),'{broken'),{MutationObserverImpl:IdleObserver,timeoutMs:5}),/Native identity unavailable/);
});
test('unknown builds do not inject either runtime or hide native content',async()=>{
 let legacy=0;const window={fetch:async()=>{},crypto:{}};
 const result=await startReleaseLoader({window,document:{},config:{},ownsRoute:()=>true,preservedBootstrap:async()=>legacy++,readInputs:async()=>({}),select:async()=>({runtime:'blocked',reason:'native_build_mismatch'})});
 assert.equal(result.runtime,'blocked');assert.equal(legacy,0);
});
test('duplicate bootstrap executes exact preserved assets only once',async()=>{
 let legacy=0;const window={fetch:async()=>{},crypto:{}};const args={window,document:{},config:{},ownsRoute:()=>true,preservedBootstrap:async()=>legacy++,readInputs:async()=>({}),select:async()=>({runtime:'preserved'})};
 await Promise.all([startReleaseLoader(args),startReleaseLoader(args)]);assert.equal(legacy,1);
});
test('font union preserves established design variants',()=>{for(const f of ['Bree+Serif','Permanent+Marker','Barlow+Condensed:ital','Caveat','Inter','Roboto+Condensed'])assert.ok(FONT_HREF.includes(f));});
