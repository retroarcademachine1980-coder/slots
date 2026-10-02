import { resolveIndexAlias } from 'public/routes/indexAliases';
import { staticNavigation } from 'public/routes/navigationRoutes';
import wixData from 'wix-data';
import { resolveRecord, recordKey, recordRole, parseCanonical, SITE_ORIGIN } from 'public/routes/canonicalRoutes';
import { resolveNativePath } from 'public/routes/nativeRouteResolver';
import { buildRedirectManifest, redirectFor, parseLegacyInput } from 'public/routes/legacyRedirects';
import { routeManifest } from 'public/routes/routeManifest.generated';
import { loadRouteContext } from 'backend/canonicalRouteService';
const SOURCES = new Set(['Venues','NearbyAttractions','Locations','FoodAndDrink','HotelGuides','HotelOffers','AffiliateOffers','ClassicFruitMachines']);
const aliasIndex = new Map();
for (const alias of routeManifest.aliases || []) {
  const parsed = parseLegacyInput(alias.from);
  if (parsed.ok) (aliasIndex.get(parsed.input) || (aliasIndex.set(parsed.input, []), aliasIndex.get(parsed.input))).push(alias);
}
// Identity collisions are decided before reading current availability. A closed
// alternative is still a distinct historical owner, never a first-match fallback.
function legacyIdentity(keys, context) {
  if (keys.length === 1) return keys[0];
  if (!keys.length) return null;
  const group = context.groupsBySource[keys[0]];
  if (!group || !group.groupId || group.blocked || group.relation !== 'same-entity' || group.approved !== true || group.provenSameEntity !== true || group.renderPolicy?.contentVerified !== true) return null;
  return keys.every(key => group.sourceKeys.includes(key) && context.groupsBySource[key]?.groupId === group.groupId && context.groupsBySource[key]?.primaryKey === group.primaryKey && context.groupsBySource[key]?.canonicalPath === group.canonicalPath)
    ? group.primaryKey : null;
}
export async function resolveRouteRequests(input, suppliedContext, { surface = 'listing' } = {}) {
  if (!Array.isArray(input) || input.length > 1000 || input.some(item => !item || typeof item !== 'object' || !SOURCES.has(item.collection) || typeof item.id !== 'string' || !item.id || item.id.length > 200)) {
    return { ok: false, code: 'invalid_route_requests' };
  }
  const context = suppliedContext || await loadRouteContext({ offers: input.some(item => /Offers$/.test(item.collection)) });
  const groups = new Map();
  for (const item of input) (groups.get(item.collection) || (groups.set(item.collection, []), groups.get(item.collection))).push(item.id);
  const byKey = new Map(), failed = new Set();
  await Promise.all([...groups].map(async ([collection, ids]) => {
    try {
      const result = await wixData.query(collection).hasSome('_id', [...new Set(ids)]).limit(1000).find();
      for (const row of result.items || []) byKey.set(recordKey(collection, row), row);
    } catch { failed.add(collection); }
  }));
  const results = input.map(({ collection, id }) => {
    const key = `${collection}:${id}`, row = byKey.get(key);
    const outcome = failed.has(collection) ? { ok: false, code: 'record_source_unavailable', key, recordRole: recordRole(collection, {_id:id}, context) }
      : row ? resolveRecord(collection, row, context, { surface }) : { ok: false, code: 'record_not_found', key, recordRole: recordRole(collection, {_id:id}, context) };
    return { ...outcome, key, targetKey: outcome.key || key };
  });
  return { ok: true, results, complete: results.every(result => result.ok) };
}
export async function resolveRoutePath(path) {
  const context = await loadRouteContext();
  if (!parseCanonical(path).ok) return { status: 404, issue: 'invalid_canonical_path' };
  return resolveNativePath(path, context, (collection, id) => wixData.get(collection, id));
}
export async function resolveLegacyAlias(input) {
  const indexAlias = resolveIndexAlias(input);
  if (indexAlias.ok) {
    if (routeManifest.indexAliasesActive !== true) return {ok:false,code:'transitional_index_rendering',inputMapped:true,renderIndex:indexAlias.to};
    const landing = routeManifest.landings?.[indexAlias.to.split('?')[0]], endpoint = routeManifest.endpoints?.[landing?.kind];
    if (landing && (!endpoint?.native || !endpoint?.renderer || !endpoint.evidence || !endpoint.revision)) return {ok:false,code:'native_endpoint_not_ready',inputMapped:true,status:503};
    return indexAlias;
  }
  const context = await loadRouteContext({ offers: true });
  const routes = new Map();
  // Resolve only the requested alias target, not every legacy record on each visit.
  const parsed = parseLegacyInput(input);
  if (!parsed.ok) return parsed;
  const candidates = aliasIndex.get(parsed.input) || [];
  const keys = [...new Set(candidates.map(alias => alias.key))];
  if (keys.length > 1 && !legacyIdentity(keys, context)) return { ok: false, code: 'ambiguous_legacy_source', inputMapped: true, status: 503 };
  for (const key of keys) {
    const separator = key.indexOf(':'), collection = key.slice(0, separator), id = key.slice(separator + 1);
    if (!SOURCES.has(collection)) continue;
    try { const row = await wixData.get(collection, id); routes.set(key, resolveRecord(collection, row, context, { surface: 'redirect' })); }
    catch { routes.set(key, { ok: false, code: 'record_source_unavailable' }); }
  }
  if (candidates.length && routes.size === 1) {
    const result = [...routes.values()][0];
    if (!result?.ok) return { ...result, inputMapped: true, status: result.code === 'record_not_public' ? 404 : 503 };
  }
  const manifest = buildRedirectManifest(candidates, key => routes.get(key), { canonicalPaths: Object.keys(context.owners) });
  if (!manifest.complete) return { ok: false, code: manifest.issues.some(issue => issue.code === 'ambiguous_legacy_source') ? 'ambiguous_legacy_source' : 'legacy_target_not_ready', inputMapped: candidates.length > 0, status: 503 };
  return redirectFor(input, manifest);
}

export async function resolveLinkRequests(inputs) {
  if (!Array.isArray(inputs) || inputs.length > 250 || inputs.some(value => typeof value !== 'string' || !value || value.length > 2000)) return { ok: false, code: 'invalid_link_requests' };
  const context = await loadRouteContext({ offers: true }), requests = new Map(), planned = [];
  for (const input of inputs) {
    const indexAlias = resolveIndexAlias(input);
    const navigation = staticNavigation(indexAlias.ok ? indexAlias.to : input);
    if (navigation.ok) { planned.push({ input, result: navigation }); continue; }
    let url; try { url = new URL(input, SITE_ORIGIN); } catch {}
    const landing = url?.origin === SITE_ORIGIN && !url.search && !url.hash ? context.landings[url.pathname] : null;
    if (landing) {
      const endpoint = context.endpoints[landing.kind];
      const result = endpoint?.native && endpoint?.renderer && endpoint.evidence && endpoint.revision
        ? { ok: true, kind: 'static', path: url.pathname, href: url.pathname, canonicalUrl: SITE_ORIGIN + url.pathname }
        : { ok: false, code: 'native_endpoint_not_ready' };
      planned.push({ input, result }); continue;
    }
    const parsed = parseCanonical(input), legacy = parseLegacyInput(input);
    const keys = parsed.ok && context.owners[parsed.path]?.length ? context.owners[parsed.path]
      : legacy.ok ? [...new Set((aliasIndex.get(legacy.input) || []).map(alias => alias.key))] : [];
    if (!legacyIdentity(keys, context)) { planned.push({ input, result: { ok: false, code: keys.length ? 'ambiguous_internal_link' : 'unresolved_internal_link' } }); continue; }
    const key = keys[0], split = key.indexOf(':'), collection = key.slice(0, split), id = key.slice(split + 1);
    if (!SOURCES.has(collection)) { planned.push({ input, result: { ok: false, code: 'unverified_internal_link_source' } }); continue; }
    requests.set(key, { collection, id }); planned.push({ input, key });
  }
  const resolved = await resolveRouteRequests([...requests.values()], context, { surface: 'redirect' });
  const byKey = new Map((resolved.results || []).map(result => [result.key, result]));
  const results = planned.map(item => ({ input: item.input, ...(item.result || byKey.get(item.key) || { ok: false, code: 'route_service_unavailable' }) }));
  return { ok: true, results, complete: results.every(result => result.ok) };
}
