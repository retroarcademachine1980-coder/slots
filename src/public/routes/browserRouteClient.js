import { resolveIndexAlias } from 'public/routes/indexAliases';
import { CATEGORY_PATHS, VIEW_PATHS, INDEX_ROUTES } from 'public/routes/indexRoutes';
import { staticNavigation } from 'public/routes/navigationRoutes';
import { parseCanonical, blocked, recordKey, SITE_ORIGIN, ROUTES } from 'public/routes/canonicalRoutes';
import { parseLegacyInput, isLegacyRecordInput } from 'public/routes/legacyRedirects';
/** Data client only. Never observes or rewrites links, and never mounts a skin. */
export function createBrowserRouteClient({ fetch, origin = SITE_ORIGIN, apiMode = 'production', expectedReleaseFingerprint = null, indexAliasesActive = false, timeoutMs = 8000, now = Date.now, ttlMs = 30000, onIssue = () => {} }) {
  if (!['production', 'release-manager-test'].includes(apiMode)) throw new Error('Unsupported route API mode');
  const outcomes = new Map();
  const versions = new Map();
  const expires = new Map();
  const pending = new Map();
  const linkOutcomes = new Map(), linkExpires = new Map(), linkPending = new Map(), linkVersions = new Map();
  const recordSources = new Set(['Venues','NearbyAttractions','Locations','FoodAndDrink','HotelGuides','HotelOffers','AffiliateOffers','ClassicFruitMachines']);
  async function json(path, options) {
    // Mode is injected by the build/test harness, never inferred from visitor query strings.
    const endpoint = apiMode === 'release-manager-test' ? path + (path.includes('?') ? '&' : '?') + 'rc=test-site' : path;
    const controller = new AbortController();
    let timer;
    const request = (async () => {
      const response = await fetch(endpoint, { ...options, signal: controller.signal });
      if (!response.ok) throw new Error('Route service unavailable');
      const payload = await response.json();
      if (expectedReleaseFingerprint && payload.fingerprint?.releaseFingerprint !== expectedReleaseFingerprint) throw new Error('Route build identity mismatch');
      return payload;
    })();
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('Route service timed out')); }, Math.max(50, Math.min(timeoutMs, 15000)));
    });
    try { return await Promise.race([request, timeout]); }
    finally { clearTimeout(timer); }

  }
  function validOutcome(item, key) {
    if (!item || typeof key !== 'string' || !key || item.key !== key) return blocked('invalid_route_service_response', { key });
    const role = ['business','offer','unknown'].includes(item.recordRole) ? item.recordRole : 'unknown';
    if (!item.ok) return blocked(item.code || 'route_unavailable', { key, recordRole: role,discoveryAllowed:item.discoveryAllowed!==false,routeType:item.routeType,contentNotice:item.contentNotice,offerActionsAllowed:item.offerActionsAllowed!==false });
    const parsed = parseCanonical(item.href);
    if (!parsed.ok || parsed.path !== item.path || item.canonicalUrl !== origin + item.path || parsed.kind !== item.kind) {
      return blocked('invalid_route_service_response', { key });
    }
    return Object.freeze({ ok: true, key, targetKey: item.targetKey || key, recordRole: role, routeType: ['operator','historical','unverified'].includes(item.routeType)?item.routeType:'place', contentNotice:typeof item.contentNotice==='string'?item.contentNotice:null,offerActionsAllowed:item.offerActionsAllowed!==false,discoveryAllowed:item.discoveryAllowed!==false,indexable:item.indexable!==false, kind: parsed.kind, path: item.path, href: item.href, canonicalUrl: item.canonicalUrl });
  }
  async function annotate(rows, collection, { refresh = false } = {}) {
    const requests = rows.map(row => ({ collection: row._collection || collection, id: row._id || row.id }))
      .filter(item => recordSources.has(item.collection) && typeof item.id === 'string' && item.id);
    const unique = [...new Map(requests.map(item => [`${item.collection}:${item.id}`, item])).values()];
    const waiting = refresh ? [] : unique.map(item => pending.get(`${item.collection}:${item.id}`)).filter(Boolean);
    const missing = unique.filter(item => {
      const key = `${item.collection}:${item.id}`;
      return refresh || (!pending.has(key) && !(expires.get(key) > now()));
    });
    for (let offset = 0; offset < missing.length; offset += 1000) {
      const batch = missing.slice(offset, offset + 1000);
      const requestVersions = new Map();
      for (const item of batch) {
        const key = `${item.collection}:${item.id}`, version = (versions.get(key) || 0) + 1;
        versions.set(key, version); requestVersions.set(key, version); outcomes.set(key, blocked('route_pending', { key }));
      }
      const work = (async () => {
        let received;
        try {
          const payload = await json('/_functions/canonicalRoutes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requests: batch }) });
          if (!payload.ok || !Array.isArray(payload.results)) throw new Error('Invalid route response');
          received = new Map(payload.results.map(result => [result.key, result]));
        } catch { received = new Map(); }
        for (const item of batch) {
          const key = `${item.collection}:${item.id}`;
          const result = received.has(key) ? validOutcome(received.get(key), key) : blocked('route_service_unavailable', { key });
          if (versions.get(key) !== requestVersions.get(key)) continue;
          outcomes.set(key, result);
          expires.set(key, result.ok ? now() + Math.max(0, Math.min(ttlMs, 60000)) : 0);
          if (!result.ok) onIssue(result);
        }
      })();
      for (const item of batch) pending.set(`${item.collection}:${item.id}`, work);
      await work;
      for (const item of batch) {
        const key = `${item.collection}:${item.id}`;
        if (pending.get(key) === work) pending.delete(key);
      }
    }
    await Promise.all(waiting);
    // Bound session-local data; no persistent browser storage is used.
    for (const key of outcomes.keys()) {
      if (outcomes.size <= 10000) break;
      if (!pending.has(key)) { outcomes.delete(key); expires.delete(key); versions.delete(key); }
    }
    return rows.map(row => {
      const source = row._collection || collection, normalized = { ...row, _id: row._id || row.id, _collection: source };
      const key = recordKey(source, normalized);
      const routeOutcome = key && outcomes.get(key) || blocked('route_not_resolved', { key });
      return { ...normalized, routeOutcome };
    });
  }
  function outcome(row) {
    const key = recordKey(row?._collection, row);
    // Never trust a row's CMS href, canonicalUrl, shortUrl or routeOutcome property.
    return key && outcomes.get(key) || blocked('route_not_resolved', { key });
  }
  function href(row) {
    const result = outcome(row);
    if (!result.ok) throw new Error(`Canonical route unavailable: ${result.code}`);
    return result.href;
  }
  async function current(path) {
    if (!parseCanonical(path).ok) return { status: 404, issue: 'invalid_canonical_path' };
    const payload = await json('/_functions/canonicalRoute?path=' + encodeURIComponent(path));
    if (payload.status !== 200) return payload;
    const key = recordKey(payload.collection, payload.row), route = validOutcome(payload.route, key);
    if (!route.ok || route.path !== path) return { status: 503, issue: 'invalid_route_service_response' };
    outcomes.set(key, route);
    return { ...payload, row: { ...payload.row, _collection: payload.collection, routeOutcome: route }, route };
  }
  async function alias(input) {
    const indexAlias = resolveIndexAlias(input), parsed = parseLegacyInput(input);
    if (!parsed.ok && !indexAlias.ok) return parsed;
    const payload = await json('/_functions/canonicalAlias?input=' + encodeURIComponent(indexAlias.ok ? input : parsed.input));
    if (!payload.ok || !(parseCanonical(payload.to).ok || staticNavigation(payload.to).ok) || !['clientReplace','server301'].includes(payload.method)) return blocked(payload.code || 'invalid_alias_response');
    return { ok: true, to: payload.to, method: payload.method };
  }
  async function canonicalLinks(inputs, { refresh = false } = {}) {
    if (!Array.isArray(inputs) || inputs.length > 1000 || inputs.some(input => typeof input !== 'string' || input.length > 2000)) return { results: [], complete: false, code: 'invalid_link_requests' };
    const unique = [...new Set(inputs)], waiting = [], missing = [];
    for (const input of unique) {
      const internal = typeof input === 'string' && (input.startsWith('/') && !input.startsWith('//') || input.startsWith(origin + '/'));
      if (!internal) { linkOutcomes.set(input, blocked('external_or_invalid_link')); continue; }
      if (!refresh && linkPending.has(input)) waiting.push(linkPending.get(input));
      else if (refresh || !(linkExpires.get(input) > now())) missing.push(input);
    }
    for (let offset = 0; offset < missing.length; offset += 250) {
      const batch = missing.slice(offset, offset + 250), versions = new Map();
      for (const input of batch) { const version = (linkVersions.get(input) || 0) + 1; linkVersions.set(input, version); versions.set(input, version); }
      const work = (async () => {
        let returned;
        try { const result = await json('/_functions/canonicalLinks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: batch }) });
          if (!result.ok || !Array.isArray(result.results)) throw new Error('Invalid links response');
          returned = new Map(result.results.map(item => [item.input, item]));
        } catch { returned = new Map(); }
        for (const input of batch) {
          if (linkVersions.get(input) !== versions.get(input)) continue;
          const item = returned.get(input); let result;
          if (!item?.ok) result = blocked(item?.code || 'route_service_unavailable');
          else if (item.kind === 'static') {
            const nav = staticNavigation(item.href);
            const verifiedRoot = [...Object.values(ROUTES), ...Object.values(INDEX_ROUTES)].some(route => route.prefix === item.href) && item.href === item.path && item.canonicalUrl === origin + item.path;
            result = (nav.ok && nav.canonicalUrl === item.canonicalUrl) || verifiedRoot ? Object.freeze({ ok: true, kind: 'static', href: item.href, canonicalUrl: item.canonicalUrl }) : blocked('invalid_route_service_response');
          } else result = validOutcome(item, item.key);
          linkOutcomes.set(input, result); linkExpires.set(input, result.ok ? now() + Math.max(0, Math.min(ttlMs, 60000)) : 0);
        }
      })();
      for (const input of batch) linkPending.set(input, work);
      await work;
      for (const input of batch) if (linkPending.get(input) === work) linkPending.delete(input);
    }
    await Promise.all(waiting);
    for (const key of linkOutcomes.keys()) {
      if (linkOutcomes.size <= 10000) break;
      if (!unique.includes(key) && !linkPending.has(key)) { linkOutcomes.delete(key); linkExpires.delete(key); linkVersions.delete(key); }
    }
    const results = inputs.map(input => ({ input, ...(linkOutcomes.get(input) || blocked('unresolved_internal_link')) }));
    return { results, complete: results.every(result => result.ok) };
  }
  return Object.freeze({ annotate, outcome, href, current, alias, canonicalLinks, categoryPaths: CATEGORY_PATHS, viewPaths: VIEW_PATHS,
    category: key => Object.hasOwn(CATEGORY_PATHS, key) ? staticNavigation(CATEGORY_PATHS[key]) : blocked('unknown_category_key'),
    navigation: staticNavigation, parse: parseCanonical, isLegacyRecordInput,
    indexInput: value => {const result=resolveIndexAlias(value);return result.ok?{...result,mode:indexAliasesActive?'redirect':'render'}:result;} });
}
