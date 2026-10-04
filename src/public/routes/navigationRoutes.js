import { SITE_ORIGIN, blocked } from 'public/routes/canonicalRoutes';
import { CATEGORY_PATHS } from 'public/routes/indexRoutes';
import { NATIVE_BLOG_PATHS } from 'public/routes/nativeBlogPaths';
import { NATIVE_STATIC_PATHS } from 'public/routes/nativeStaticPaths';
/** Static editorial navigation is separate from record resolution. Search/filter
 * query state is allowed only on known search/map pages, never record-ID params.
 */
export function staticNavigation(value) {
  if (typeof value !== 'string' || !value || /[\\\s]/.test(value) || value.startsWith('//')) return blocked('invalid_static_link');
  let url;
  try { url = new URL(value, SITE_ORIGIN); } catch { return blocked('invalid_static_link'); }
  if (url.origin !== SITE_ORIGIN || !(Object.hasOwn(NATIVE_STATIC_PATHS, url.pathname) || Object.hasOwn(NATIVE_BLOG_PATHS, url.pathname)) || url.hash || /%(?:2f|5c|25|2e)/i.test(value)) return blocked('unverified_static_link');
  if (url.search) {
    const allowed = url.pathname === '/search' ? ['q','category','page','sort','view','favourites'] : url.pathname === '/map' ? ['q','town','category','type','saved'] : Object.values(CATEGORY_PATHS).some(path => path.split('?')[0] === url.pathname) ? ['q','town','category','type','sort','page'] : [];
    if ([...url.searchParams].some(([key, value]) => !allowed.includes(key) || (['saved','favourites'].includes(key) && value !== '1'))) return blocked('unverified_static_query');
  }
  const path=url.pathname+url.search;
  return {ok:true,kind:'static',path,href:path,canonicalUrl:SITE_ORIGIN+url.pathname,pageId:NATIVE_STATIC_PATHS[url.pathname],blogId:NATIVE_BLOG_PATHS[url.pathname]};
}
