import { SITE_ORIGIN, blocked } from 'public/routes/canonicalRoutes';
import { CATEGORY_PATHS, VIEW_PATHS } from 'public/routes/indexRoutes';
import { staticNavigation } from 'public/routes/navigationRoutes';
export const INDEX_ALIAS_PATHS = Object.freeze({
  '/classic-fruit-machine-archive':'/classic-fruit-machines',
  '/classic-fruit-machine-archive-1':'/classic-fruit-machines',
  '/amusement-arcades':'/arcade',
  '/hotels':'/places-to-stay',
  '/nearby-attractions':'/attractions'
});
/** Exact inbound index aliases only. Canonical producers use CATEGORY_PATHS.
 * Filters are retained as scoped UI state; no identity query is ever copied.
 */
export function resolveIndexAlias(value) {
  let url;try{url=new URL(value,SITE_ORIGIN);}catch{return blocked('invalid_index_alias');}
  if(typeof value!=='string'||url.origin!==SITE_ORIGIN||url.username||url.password||url.hash||/[\\]/.test(value))return blocked('invalid_index_alias');
  const path=url.pathname.replace(/\/$/,'')||'/',q=url.searchParams;
  let target,selector;
  if(Object.hasOwn(INDEX_ALIAS_PATHS,path)){target=INDEX_ALIAS_PATHS[path];}
  else if(path==='/'&&q.has('explore')){selector='explore';target=CATEGORY_PATHS[q.get(selector)];}
  else if((path==='/'||path==='/destination-recommendations')&&q.has('view')){selector='view';target=VIEW_PATHS[q.get(selector)];}
  else if(path==='/'&&q.get('sr')==='classic'&&!q.has('machine')){selector='sr';target='/classic-fruit-machines';}
  if(!target)return blocked('not_index_alias');
  if(new Set([...q.keys()]).size!==[...q].length)return blocked('ambiguous_index_alias');
  const output=new URL(target,SITE_ORIGIN);
  for(const [key,value]of q){if(key===selector)continue;if(!['q','town','category','type','sort','page'].includes(key))return blocked('unsupported_index_alias_query');output.searchParams.set(key,value);}
  const navigation=staticNavigation(output.pathname+output.search);
  if(!navigation.ok)return navigation;
  return {ok:true,to:navigation.href,method:url.search?'clientReplace':'server301',status:url.search?null:301,kind:'static'};
}
