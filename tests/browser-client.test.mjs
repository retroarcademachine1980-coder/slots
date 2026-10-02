import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserRouteClient } from '../src/public/routes/browserRouteClient.js';
const path='/hotel/imperial/blackpool',canonicalUrl='https://www.spin-raiders.com'+path;
const row={_id:'o',_collection:'HotelOffers',shortUrl:'/?place=bad',canonicalUrl:'/hotels/old'};
const outcome={ok:true,key:'HotelOffers:o',targetKey:'HotelGuides:h',kind:'hotel',path,href:path,canonicalUrl};
function client(payload,ok=true){return createBrowserRouteClient({fetch:async()=>({ok,json:async()=>payload})});}
test('browser consumes verified request identity and canonical guide destination',async()=>{
 const c=client({ok:true,results:[outcome]});const [annotated]=await c.annotate([row]);assert.equal(c.href(annotated),path);assert.equal(c.outcome(annotated).targetKey,'HotelGuides:h');assert.equal(row.routeOutcome,undefined);
});
test('browser ignores spoofed CMS routing properties and cacheless rows',()=>{
 const c=client({});assert.equal(c.outcome({...row,routeOutcome:outcome}).ok,false);assert.throws(()=>c.href(row));
});
for(const bad of [{...outcome,href:'/?place=id'},{...outcome,href:'/hotels/old'},{...outcome,canonicalUrl:'https://evil.test/x'},{...outcome,key:'HotelOffers:wrong'},{...outcome,path:'/hotel/other/blackpool'},{...outcome,kind:'arcade'}]){
 test('browser rejects inconsistent/legacy response '+JSON.stringify(bad),async()=>{const c=client({ok:true,results:[bad]});const [r]=await c.annotate([row]);assert.equal(c.outcome(r).ok,false);assert.throws(()=>c.href(r));});
}
test('service errors remain explicit, not fallback anchors',async()=>{
 const c=client({},false);const [r]=await c.annotate([row]);assert.equal(c.outcome(r).code,'route_service_unavailable');assert.throws(()=>c.href(r));
});
test('partial response does not erase unresolved rows',async()=>{
 const c=client({ok:true,results:[outcome]}),rows=await c.annotate([row,{_id:'missing',_collection:'HotelOffers'}]);assert.equal(rows.length,2);assert.equal(c.outcome(rows[1]).ok,false);
});
test('newer failed result invalidates stale cached success',async()=>{
 let call=0;const c=createBrowserRouteClient({fetch:async()=>({ok:true,json:async()=>({ok:true,results:call++?[]:[outcome]})})});
 await c.annotate([row]);assert.equal(c.href(row),path);await c.annotate([row],undefined,{refresh:true});assert.equal(c.outcome(row).ok,false);
});
test('late older hydration cannot overwrite newer unavailable result',async()=>{
 const pending=[];const c=createBrowserRouteClient({fetch:()=>new Promise(resolve=>pending.push(resolve))});
 const old=c.annotate([row]),latest=c.annotate([row],undefined,{refresh:true});
 pending[1]({ok:true,json:async()=>({ok:true,results:[{key:row._collection+':'+row._id,ok:false,code:'record_not_public'}]})});await latest;
 pending[0]({ok:true,json:async()=>({ok:true,results:[outcome]})});await old;
 assert.equal(c.outcome(row).code,'record_not_public');
});
test('explicit test build addresses test backend; production never inherits page query flags',async()=>{
 const urls=[];const c=createBrowserRouteClient({apiMode:'release-manager-test',fetch:async url=>{urls.push(url);return {ok:true,json:async()=>({ok:true,results:[outcome]})};}});
 await c.annotate([row]);assert.equal(urls[0],'/_functions/canonicalRoutes?rc=test-site');
 const prodUrls=[];await createBrowserRouteClient({fetch:async url=>{prodUrls.push(url);return {ok:true,json:async()=>({ok:true,results:[outcome]})};}}).annotate([row]);assert.equal(prodUrls[0],'/_functions/canonicalRoutes');
 assert.throws(()=>createBrowserRouteClient({apiMode:'arbitrary-host',fetch:()=>{}}));
});
test('bounded cache and in-flight coalescing avoid redundant route roundtrips',async()=>{
 let resolve,calls=0,time=100;const c=createBrowserRouteClient({now:()=>time,ttlMs:1000,fetch:()=>{calls++;return new Promise(r=>{resolve=r;});}});
 const a=c.annotate([row]),b=c.annotate([row]);assert.equal(calls,1);resolve({ok:true,json:async()=>({ok:true,results:[outcome]})});await Promise.all([a,b]);
 await c.annotate([row]);assert.equal(calls,1);time=1200;const next=c.annotate([row]);assert.equal(calls,2);resolve({ok:true,json:async()=>({ok:true,results:[outcome]})});await next;
});
test('an exact-build client refuses route data from a mismatched backend',async()=>{
 const c=createBrowserRouteClient({expectedReleaseFingerprint:'a'.repeat(64),fetch:async()=>({ok:true,json:async()=>({ok:true,results:[outcome],fingerprint:{releaseFingerprint:'b'.repeat(64)}})})});
 await c.annotate([row]);assert.equal(c.outcome(row).ok,false);
});
test('route fetch timeout is bounded even when the transport ignores abort',async()=>{
 const c=createBrowserRouteClient({timeoutMs:50,fetch:()=>new Promise(()=>{})});const started=Date.now();
 await c.annotate([row]);assert.equal(c.outcome(row).code,'route_service_unavailable');assert.ok(Date.now()-started<1000);
});
test('browser preserves authoritative role for unresolved business guides',async()=>{
 const c=client({ok:true,results:[{key:'HotelOffers:o',ok:false,code:'native_endpoint_not_ready',recordRole:'business'}]});
 const [r]=await c.annotate([row]);assert.equal(c.outcome(r).recordRole,'business');assert.equal(c.outcome(r).ok,false);
});
test('rich-text link batch preserves input identity, returns only clean ready hrefs and caches reads',async()=>{
 let calls=0;const c=createBrowserRouteClient({fetch:async()=>{calls++;return {ok:true,json:async()=>({ok:true,results:[{...outcome,input:'/hotels/legacy'},{input:'/cinemas',ok:true,kind:'static',href:'/cinemas',path:'/cinemas',canonicalUrl:'https://www.spin-raiders.com/cinemas'}]})};}});
 const result=await c.canonicalLinks(['/hotels/legacy','/cinemas','https://external.test/x']);assert.equal(result.results[0].href,path);assert.equal(result.results[1].href,'/cinemas');assert.equal(result.results[2].ok,false);
 await c.canonicalLinks(['/hotels/legacy','/cinemas']);assert.equal(calls,1);
});
test('index transition renders in place until immutable cleanup build activates redirects',()=>{
 const transition=createBrowserRouteClient({fetch:async()=>{throw Error('must not fetch for classification')}});
 assert.equal(transition.indexInput('/classic-fruit-machine-archive').to,'/classic-fruit-machines');assert.equal(transition.indexInput('/classic-fruit-machine-archive').mode,'render');
 const final=createBrowserRouteClient({fetch:async()=>{throw Error('must not fetch for classification')},indexAliasesActive:true});
 assert.equal(final.indexInput('/classic-fruit-machine-archive').mode,'redirect');assert.equal(final.isLegacyRecordInput('/post/masala-n-malt-grimsby'),true);
 assert.equal(final.indexInput('/classic-fruit-machines').ok,false);
});
