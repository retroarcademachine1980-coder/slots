import { LEGACY_ROUTING_INPUTS } from 'public/routes/legacyRedirects';
import { SITE_ORIGIN, ROUTES, CANONICAL_SEGMENT_RULES } from 'public/routes/canonicalRoutes';
import { CATEGORY_PATHS, VIEW_PATHS, INDEX_ROUTES } from 'public/routes/indexRoutes';
import { NATIVE_BLOG_PATHS } from 'public/routes/nativeBlogPaths';
// Loader classification only. This never builds a record URL, redirects, or
// establishes release readiness. It shares exact route definitions with the API.
export const RUNTIME_OWNERSHIP = Object.freeze({
  origin:SITE_ORIGIN, segmentRules:CANONICAL_SEGMENT_RULES, categoryKeys:Object.freeze(Object.keys(CATEGORY_PATHS)), viewKeys:Object.freeze(Object.keys(VIEW_PATHS)),
  legacyCollections:LEGACY_ROUTING_INPUTS.collections,
  staticPaths: Object.freeze([...new Set(['/', '/search', '/map', '/blog', ...Object.values(CATEGORY_PATHS).map(path=>path.split('?')[0]), ...Object.values(VIEW_PATHS), ...Object.values(INDEX_ROUTES).map(route=>route.prefix), '/classic-fruit-machines'])]),
  nativeBlogPaths: Object.freeze(Object.keys(NATIVE_BLOG_PATHS)),
  canonicalPatterns: Object.freeze(Object.entries(ROUTES).filter(([,route])=>route.fields.length).map(([kind,route])=>Object.freeze({kind,prefix:route.prefix,fields:route.fields,segments:route.joined?1:route.fields.length}))),
  legacyPrefixes: LEGACY_ROUTING_INPUTS.prefixes,
  exactLegacyRecordPaths:LEGACY_ROUTING_INPUTS.exactPaths,
  legacyIndexPaths: Object.freeze(['/classic-fruit-machine-archive','/classic-fruit-machine-archive-1']),
  transitionalIndexInputs: true,
  excludedSearchView: 'articles'
});
export function classifyRuntimeOwnership(value, registry, { transitionalIndexInputs = true } = {}) {
  let url; try { url = new URL(value, registry.origin); } catch { return false; }
  if(url.origin!==registry.origin||url.username||url.password||/[\\]/.test(value))return false;
  const path=url.pathname.replace(/\/$/,'')||'/', q=url.searchParams;
  if(path==='/search')return q.get('view')!=='articles';
  if(q.has('collection')||q.has('place'))return registry.legacyCollections.includes(q.get('collection'))&&Boolean(q.get('place'));
  if(q.get('sr')==='classic'&&q.get('machine'))return true;
  if(path==='/'){
    if(transitionalIndexInputs&&q.has('explore'))return registry.categoryKeys.includes(q.get('explore'));
    if(transitionalIndexInputs&&q.has('view'))return registry.viewKeys.includes(q.get('view'));
    if(transitionalIndexInputs&&q.get('sr')==='classic')return true;
    return !['raidertube','sr','report','explore','view','place'].some(key=>q.has(key));
  }
  if(transitionalIndexInputs&&path==='/destination-recommendations'&&q.get('view')==='offers')return true;
  if(registry.staticPaths.includes(path)||registry.nativeBlogPaths.includes(path))return true;
  const rules=registry.segmentRules, semantic=segment=>segment.length<=rules.maxLength&&new RegExp(rules.slug).test(segment)&&![rules.uuid,rules.opaqueHex,rules.placeholder].some(pattern=>new RegExp(pattern).test(segment));
  if(registry.canonicalPatterns.some(route=>path.startsWith(route.prefix+'/')&&path.slice(route.prefix.length+1).split('/').length===(route.segments||route.fields.length)&&path.slice(route.prefix.length+1).split('/').every(semantic)))return true;
  if(registry.exactLegacyRecordPaths.includes(path))return true;
  if(registry.legacyIndexPaths.includes(path))return true;
  if(registry.legacyPrefixes.some(prefix=>path.startsWith(prefix+'/')))return true;
  return /^\/cinemas\/[^/]+$/.test(path);
}

export function runtimeOwns(value, options) { return classifyRuntimeOwnership(value, RUNTIME_OWNERSHIP, options); }
