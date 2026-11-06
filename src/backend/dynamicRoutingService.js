import { next, notFound, sendStatus, redirect } from 'wix-router';
import { createRouteContext, SITE_ORIGIN } from 'public/routes/canonicalRoutes';
import { routeManifest } from 'public/routes/routeManifest.generated';
import { resolveLegacyAlias } from 'backend/canonicalRoutesApi';
const context=createRouteContext(routeManifest);
// The published Food dynamic page already owns its routeSlug query, dataset
// payload and configured item SEO. Preserve those native contracts. The full
// linked review is assigned separately by the existing Food Item page code.
export function foodCustomizeQuery(request,route,query) {
 return query;
}
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
 return response;
}
