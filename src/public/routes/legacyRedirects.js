/** Legacy references are accepted ONLY here as one-way redirect inputs. */
import { SITE_ORIGIN, blocked, parseCanonical } from 'public/routes/canonicalRoutes';
export const EXACT_LEGACY_RECORD_ALIASES = Object.freeze([
  Object.freeze({from:'/post/masala-n-malt-grimsby',key:'FoodAndDrink:fd-masala-n-malt-grimsby',evidence:'Full source parity verified: original review, eight photos, attribution and dated facts retained'})
]);
export const LEGACY_ROUTING_INPUTS = Object.freeze({
 prefixes:Object.freeze(['/arcade-venues','/arcade-locations','/classic-fruit-machine-archive-1','/hotels','/nearby-attractions']),
 exactPaths:Object.freeze(EXACT_LEGACY_RECORD_ALIASES.map(alias=>alias.from)),
 collections:Object.freeze(['Venues','NearbyAttractions','Locations','FoodAndDrink','HotelGuides','HotelOffers','AffiliateOffers','ClassicFruitMachines','DestinationRecommendations'])
});
export function isLegacyRecordInput(value) {
 const parsed=parseLegacyInput(value);if(!parsed.ok)return false;
 const url=new URL(parsed.input,SITE_ORIGIN),q=url.searchParams,path=url.pathname;
 return q.has('collection')&&LEGACY_ROUTING_INPUTS.collections.includes(q.get('collection'))&&Boolean(q.get('place')) || q.get('sr')==='classic'&&Boolean(q.get('machine')) || LEGACY_ROUTING_INPUTS.exactPaths.includes(path) || LEGACY_ROUTING_INPUTS.prefixes.some(prefix=>path.startsWith(prefix+'/')) || /^\/cinemas\/[^/]+$/.test(path);
}
const ID_PARAMS = new Set(['collection', 'place', 'machine', 'sr']);
export function parseLegacyInput(value) {
  if (typeof value !== 'string' || /[\\\s]/.test(value) || value.startsWith('//')) return blocked('invalid_legacy_input');
  let url;
  try { url = new URL(value, SITE_ORIGIN); } catch { return blocked('invalid_legacy_input'); }
  if (url.origin !== SITE_ORIGIN || url.username || url.password || url.hash || /%(?:2f|5c|25|2e)/i.test(value)) return blocked('invalid_legacy_input');
  if (!value.startsWith('/') && !value.startsWith(SITE_ORIGIN + '/')) return blocked('invalid_legacy_input');
  if (url.pathname.split('/').some(segment => segment === '.' || segment === '..') || /(?:^|\/)\.\.?(?:\/|$)/.test(value)) return blocked('invalid_legacy_input');
  const params = [...url.searchParams];
  if (params.some(([key]) => !ID_PARAMS.has(key)) || new Set(params.map(([key]) => key)).size !== params.length) return blocked('unsupported_legacy_query');
  if (params.length && (params.length !== 2 || (!(url.searchParams.has('collection') && url.searchParams.has('place')) && !(url.searchParams.get('sr') === 'classic' && url.searchParams.has('machine'))))) return blocked('unsupported_legacy_query');
  let pathname;
  try { pathname = url.pathname.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment).normalize('NFC'))).join('/').replace(/\/+$/, '') || '/'; }
  catch { return blocked('invalid_legacy_encoding'); }
  params.sort(([a], [b]) => a.localeCompare(b));
  const query = new URLSearchParams(params).toString();
  return { ok: true, input: pathname + (query ? '?' + query : '') };
}
export function buildRedirectManifest(mapping, resolveKey, { canonicalPaths } = {}) {
  const routes = new Map(), issues = [], unchanged = [];
  const current = canonicalPaths ? new Set(canonicalPaths) : null;
  for (const entry of mapping) {
    const from = parseLegacyInput(entry.from);
    if (!from.ok) { issues.push({ from: entry.from, code: from.code }); continue; }
    const target = resolveKey(entry.key);
    if (!target?.ok || !parseCanonical(target.href).ok) { issues.push({ from: entry.from, key: entry.key, code: target?.code || 'unresolved_redirect_target' }); continue; }
    if (from.input === target.href) { unchanged.push({ path: from.input, key: entry.key }); continue; }
    // Protect current canonical destinations. A retired semantic-looking name
    // may redirect only when a complete reviewed canonical set excludes it.
    if (parseCanonical(from.input).ok && (!current || current.has(from.input))) { issues.push({ from: entry.from, code: 'canonical_source_forbidden' }); continue; }
    if (current && !current.has(target.href)) { issues.push({ from: entry.from, code: 'target_not_in_canonical_index' }); continue; }
    const existing = routes.get(from.input);
    if (existing && existing.to !== target.href) { issues.push({ from: entry.from, code: 'ambiguous_legacy_source' }); routes.delete(from.input); continue; }
    if (issues.some(issue => issue.code === 'ambiguous_legacy_source' && parseLegacyInput(issue.from).input === from.input)) continue;
    routes.set(from.input, { from: from.input, to: target.href, status: from.input.includes('?') ? null : 301, method: from.input.includes('?') ? 'clientReplace' : 'server301', key: entry.key });
  }
  return { entries: [...routes.values()], unchanged, issues, complete: issues.length === 0 };
}
/** Lookup only; deployment uses server/native 301s, not a DOM rewriter. */
export function redirectFor(input, manifest) {
  const parsed = parseLegacyInput(input);
  if (!parsed.ok) return parsed;
  const matches = manifest.entries.filter(entry => entry.from === parsed.input);
  return matches.length === 1 ? { ok: true, ...matches[0] } : blocked('legacy_bookmark_unmapped');
}
/** Required migration acceptance: ALL known sources have exactly one target. */
export function auditRedirectCoverage(knownInputs, manifest) {
  const missing = knownInputs.map(input => ({ input, result: redirectFor(input, manifest) })).filter(item => !item.result.ok && !(manifest.unchanged || []).some(entry => entry.path === parseLegacyInput(item.input).input));
  return { complete: manifest.complete && missing.length === 0, missing: missing.map(item => item.input), issues: manifest.issues };
}
