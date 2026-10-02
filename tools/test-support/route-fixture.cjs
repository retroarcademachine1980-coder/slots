const assert=require('node:assert/strict');
/** Exact test-only server outcomes. No guessed, CMS-derived or fallback routes. */
function installRouteFixture(w,blocks){
 const bindings=new Map(),records=new Map(),requests=[];
 const priorFetch=w.fetch;
 w.fetch=async(url,options={})=>{
  if(url==='/_functions/canonicalRoutes'){
   const body=JSON.parse(options.body);assert(Array.isArray(body.requests));requests.push(...body.requests);
   return {ok:true,json:async()=>({ok:true,results:body.requests.map(({collection,id})=>{const key=collection+':'+id;return bindings.get(key)||{key,ok:false,recordRole:'unknown',code:'fixture_identity_unavailable'};})})};
  }
  if(typeof url==='string'&&url.startsWith('/_functions/canonicalRoute?path=')){
   const routePath=new URL(url,w.location.origin).searchParams.get('path');const matches=[...bindings.values()].filter(r=>r.ok&&r.path===routePath&&r.key===r.targetKey);assert(matches.length<=1,'ambiguous test-native fixture');
   const route=matches[0],row=route&&records.get(route.key);return {ok:true,json:async()=>row?{status:200,collection:row._collection,row,route}:{status:404,issue:'fixture_unknown_path'}};
  }
  if(typeof priorFetch==='function')return priorFetch(url,options);
  throw Error('Unexpected fixture request '+url);
 };
 const run=n=>{const block=blocks.find(b=>b.startsWith('/* ['+n+']'));assert(block,'missing authority block '+n);w.eval(block);};
 require('./release-fingerprint-fixture.cjs').installFingerprintFixture(w,blocks);
 run(1);run(2);
 function bind(row,path,{targetKey,recordRole='business'}={}){
  assert(row._collection&&row._id,'fixture needs original collection and id');
  const key=row._collection+':'+row._id,parsed=w.SR_ROUTES.parse(path);assert(parsed.ok,'fixture path must follow actual contract: '+path);
  bindings.set(key,{key,targetKey:targetKey||key,ok:true,kind:parsed.kind,path,href:path,canonicalUrl:w.location.origin+path,recordRole});records.set(key,row);return row;
 }
 function block(row,code='fixture_unavailable',recordRole='business'){const key=row._collection+':'+row._id;bindings.set(key,{key,ok:false,code,recordRole});records.set(key,row);return row;}
 const annotate=rows=>w.SR_ROUTES.annotate(rows,undefined,{refresh:true});
 return {bind,block,annotate,requests,bindings,records};
}
module.exports={installRouteFixture};
