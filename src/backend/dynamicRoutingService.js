import wixData from 'wix-data';
import { next, ok, notFound, sendStatus, redirect } from 'wix-router';
import { createRouteContext, SITE_ORIGIN } from 'public/routes/canonicalRoutes';
import { createDynamicQueryHook } from 'public/routes/dynamicQueryAdapter';
import { createDynamicDetailHook } from 'public/routes/dynamicPageAdapter';
import { routeManifest } from 'public/routes/routeManifest.generated';
import { resolveRoutePath, resolveLegacyAlias } from 'backend/canonicalRoutesApi';
const context=createRouteContext(routeManifest);
export const foodCustomizeQuery=createDynamicQueryHook({kind:'food',prefix:'/food-and-drink',context,queryFor:collection=>wixData.query(collection)});
export async function foodBeforeRouter(request) {
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
 return createDynamicDetailHook({kind:'food',prefix:'/food-and-drink',pageName:routeManifest.endpoints?.food?.pageName,
  resolve:resolveRoutePath,resolveAlias:resolveLegacyAlias,redirect,ok,notFound,sendStatus:status=>sendStatus(String(status))})(request,response);
}
