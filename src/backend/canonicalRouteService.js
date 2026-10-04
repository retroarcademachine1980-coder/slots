import { staticNavigation } from 'public/routes/navigationRoutes';
import wixData from 'wix-data';
import { createRouteContext, resolveRecord, parseCanonical, gateCanonical } from 'public/routes/canonicalRoutes';
import { routeManifest } from 'public/routes/routeManifest.generated';
const baseContext = createRouteContext(routeManifest);
/** Per-request guide join. No mutable cross-request global route context. */
export async function loadRouteContext({ offers = false } = {}) {
  const approvedGroups = (routeManifest.sourceGroups || []).filter(group => group.approved === true && (group.relation === 'same-entity' || (group.relation === 'editorial-index' && group.editorialScopeApproved === true)) && group.renderPolicy?.contentVerified === true);
  if (!offers && !approvedGroups.length) return baseContext;
  const guides = [], groupRecords = {}, sourceIssues = [];
  if (offers) {
    try {
      let page = await wixData.query('HotelGuides').limit(1000).find();
      for (;;) {
        guides.push(...(page.items || []));
        if (!page.hasNext?.()) break;
        page = await page.next();
      }
    } catch { sourceIssues.push('HotelGuides'); }
  }
  const groups = new Map();
  for (const group of approvedGroups) {
    const split = group.primaryKey.indexOf(':'), collection = group.primaryKey.slice(0, split), id = group.primaryKey.slice(split + 1);
    (groups.get(collection) || (groups.set(collection, []), groups.get(collection))).push(id);
  }
  await Promise.all([...groups].map(async ([collection, ids]) => {
    try {
      const uniqueIds = [...new Set(ids)];
      for (let offset = 0; offset < uniqueIds.length; offset += 1000) {
        const result = await wixData.query(collection).hasSome('_id', uniqueIds.slice(offset, offset + 1000)).limit(1000).find();
        for (const row of result.items || []) groupRecords[collection + ':' + row._id] = row;
      }
    } catch { sourceIssues.push(collection); }
  }));
  return createRouteContext({ ...routeManifest, guides, groupRecords, sourceIssues });
}

export function publicRouteModel(collection, row, context = baseContext, surface = 'listing') {
  const result = resolveRecord(collection, row, context, { surface });
  const key = collection + ':' + (row?._id || '');
  const role = result.recordRole;
  const editorial={routeType:result.routeType||'place',routeNotice:result.contentNotice||null,offerActionsAllowed:result.offerActionsAllowed!==false,discoveryAllowed:result.discoveryAllowed!==false};
  return result.ok ? { ...editorial, routeKind: result.kind, recordRole: role, route: result.href, canonicalUrl: result.canonicalUrl, routeStatus: 'ready', routeIssue: null }
    : { ...editorial, routeKind: context.venueRouteKinds[key] || null, recordRole: role, route: null, canonicalUrl: null, routeStatus: 'unavailable', routeIssue: result.code };
}
export function storedLinkModel(value, context = baseContext) {
  const staticRoute = staticNavigation(value);
  if (staticRoute.ok) return { route: staticRoute.href, canonicalUrl: staticRoute.canonicalUrl, routeStatus: 'ready', routeIssue: null };
  const parsed = parseCanonical(value);
  const owners = parsed.ok ? context.owners[parsed.path] || [] : [];
  const result = owners.length === 1 ? gateCanonical(parsed, owners[0], context) : { ok: false, code: 'unverified_stored_link' };
  return result.ok ? { route: result.href, canonicalUrl: result.canonicalUrl, routeStatus: 'ready', routeIssue: null }
    : { route: null, canonicalUrl: null, routeStatus: 'unavailable', routeIssue: result.code };
}
export function routeSummary(cards) {
  const unavailable = cards.filter(card => card.routeStatus !== 'ready');
  return { complete: unavailable.length === 0, unavailableRoutes: unavailable.map(card => ({ id: card._id, issue: card.routeIssue })) };
}
