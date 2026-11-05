import wixData from 'wix-data';
import { next, ok, notFound, sendStatus, redirect } from 'wix-router';
import { createRouteContext, SITE_ORIGIN } from 'public/routes/canonicalRoutes';
import { createDynamicQueryHook } from 'public/routes/dynamicQueryAdapter';
import { createDynamicDetailHook } from 'public/routes/dynamicPageAdapter';
import { routeManifest } from 'public/routes/routeManifest.generated';
import { resolveRoutePath, resolveLegacyAlias } from 'backend/canonicalRoutesApi';
const context=createRouteContext(routeManifest);
// Temporary isolated-test server diagnostics. Native routing may omit the
// incoming query flag, so trace hook invocation independently of request query.
// No record values, credentials, visitor identity or exception messages are
// logged. Remove this diagnostic before production acceptance.
function traceFoodRouter(request,phase,response) {
 try {
  console.info('SR_FOOD_ROUTER_TRACE',JSON.stringify({phase,
   prefix:request.prefix==='food-and-drink'?'food-and-drink':'unexpected',
   pathParts:Array.isArray(request.path)?request.path.length:0,
   pages:Array.isArray(request.pages)?request.pages.map(String):null,
   status:response?.status??null,page:typeof response?.page==='string'?response.page:null,
   dataPresent:response?.data!=null,
   dataKeys:response?.data&&typeof response.data==='object'?Object.keys(response.data).slice(0,12):[],
   titlePresent:!!response?.head?.title,
   descriptionPresent:Array.isArray(response?.head?.metaTags)&&response.head.metaTags.some(tag=>tag.name==='description'&&tag.content),
   errorType:typeof response?.errorType==='string'?response.errorType:null}));
 } catch { /* Diagnostics must never interrupt a visitor's request. */ }
}
const foodQuery=createDynamicQueryHook({kind:'food',prefix:'/food-and-drink',context,queryFor:collection=>wixData.query(collection)});
export function foodCustomizeQuery(request,route,query) {
 traceFoodRouter(request,'query:enter');
 try {const result=foodQuery(request,route,query);traceFoodRouter(request,'query:return');return result;}
 catch(error){traceFoodRouter(request,'query:error',{errorType:error?.name});throw error;}
}
export async function foodBeforeRouter(request) {
 traceFoodRouter(request,'before:enter');
 const parts=(Array.isArray(request.path)?request.path:[]).filter(part=>part!=='');
 if(!parts.length)return next();
 if(parts.some(part=>typeof part!=='string'||/[/?#\\%]/.test(part)))return notFound();
 const path='/food-and-drink/'+parts.join('/');
 if(context.owners[path]?.length===1)return next();
 const alias=await resolveLegacyAlias(path);
 if(alias.ok&&alias.method==='server301')return redirect(SITE_ORIGIN+alias.to,'301');
 return alias.inputMapped?sendStatus(String(alias.status||503)):notFound();
}
export async function foodAfterRouter(request,response) {
 traceFoodRouter(request,'after:enter',response);
 try {
  const result=await createDynamicDetailHook({kind:'food',prefix:'/food-and-drink',pageName:routeManifest.endpoints?.food?.pageName,
   resolve:resolveRoutePath,resolveAlias:resolveLegacyAlias,redirect,ok,notFound,sendStatus:status=>sendStatus(String(status))})(request,response);
  traceFoodRouter(request,'after:return',result);return result;
 } catch(error){traceFoodRouter(request,'after:error',{errorType:error?.name});throw error;}
}
