import { parseCanonical, ROUTES } from 'public/routes/canonicalRoutes';
/** Synchronous Wix customizeQuery prototype. Wix documents returning a fresh
 * WixDataQuery; accepting a different backing collection still requires native
 * verification. Exact index lookup replaces old positional URL-field binding.
 */
export function createDynamicQueryHook({kind,prefix,context,queryFor}) {
 return function customizeQuery(request,_route,originalQuery) {
  const parts=Array.isArray(request.path)?request.path:[];
  if(!parts.length)return originalQuery;
  const path=prefix+'/'+parts.join('/'),parsed=parseCanonical(path);
  if(parts.some(part=>typeof part!=='string'||/[/?#\\%]/.test(part))||!parsed.ok||parsed.kind!==kind)return originalQuery.eq('_id','');
  const owners=context.owners[path]||[];
  if(owners.length!==1)return originalQuery.eq('_id','');
  const key=owners[0],split=key.indexOf(':'),collection=key.slice(0,split),id=key.slice(split+1),spec=ROUTES[kind];
  if(spec.collection!==collection&&!spec.collections?.includes(collection))return originalQuery.eq('_id','');
  if(['Venues','NearbyAttractions','AffiliateOffers'].includes(collection)&&context.venueRouteKinds[key]!==kind)return originalQuery.eq('_id','');
  return queryFor(collection).eq('_id',id).limit(1);
 };
}
