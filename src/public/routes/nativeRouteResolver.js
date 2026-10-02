/** Transport-injected native adapter. Wix wrapper supplies readById and calls
 * wix-router ok()/notFound()/redirect(). This module never imports server secrets.
 * An exact released index owns the path; no ambiguous slug query or limit(1).
 */
import { projectPublicDetail } from 'public/routes/publicDetailProjection';
import { blocked, parseCanonical, resolveRecord, isPublicRecord } from 'public/routes/canonicalRoutes';
export async function resolveNativePath(path, context, readById) {
  const parsed = parseCanonical(path);
  if (!parsed.ok) return { status: 404, issue: parsed.code };
  const owners = context.owners[path] || [];
  if (owners.length !== 1) return { status: owners.length ? 409 : 404, issue: owners.length ? 'canonical_collision' : 'unknown_native_path' };
  const key = owners[0], separator = key.indexOf(':');
  if (separator < 1) return { status: 500, issue: 'invalid_route_index' };
  const collection = key.slice(0, separator), id = key.slice(separator + 1);
  let row;
  try { row = await readById(collection, id); }
  catch { return { status: 503, issue: 'record_source_unavailable' }; }
  if (!row || row._id !== id) return { status: 404, issue: 'native_record_not_found' };
  const route = resolveRecord(collection, row, context, { surface: 'detail' });
  if (!route.ok) return { status: route.code === 'record_not_public' ? 404 : ['canonical_collision','route_identity_changed','source_group_route_mismatch'].includes(route.code) ? 409 : 503, issue: route.code };
  if (route.path !== path || route.kind !== parsed.kind) return { status: 409, issue: 'route_identity_changed' };
  const group = context.groupsBySource?.[key];
  const publicRow = projectPublicDetail(collection, row, context.recordPolicies?.[key]);
  const sourceRecords = [{ key, collection, row: publicRow }];
  if (group) {
    for (const sourceKey of group.sourceKeys.filter(sourceKey => sourceKey !== key)) {
      const split = sourceKey.indexOf(':'), sourceCollection = sourceKey.slice(0, split), sourceId = sourceKey.slice(split + 1);
      let sourceRow;
      try { sourceRow = await readById(sourceCollection, sourceId); } catch { return { status: 503, issue: 'preserved_source_unavailable' }; }
      if (!sourceRow || sourceRow._id !== sourceId) return { status: 503, issue: 'preserved_source_unavailable' };
      sourceRecords.push(context.recordPolicies?.[sourceKey]?.publicServingAllowed !== false && isPublicRecord(sourceRow, 'detail')
        ? { key: sourceKey, collection: sourceCollection, row: projectPublicDetail(sourceCollection, sourceRow, context.recordPolicies?.[sourceKey] || context.recordPolicies?.[key]) }
        : { key: sourceKey, collection: sourceCollection, retained: true, withheld: true });
    }
  }
  const sourceGroup = group ? { groupId: group.groupId, relation: group.relation, primaryKey: group.primaryKey, sourceKeys: group.sourceKeys, identityUnderReview: group.identityUnderReview === true, notice: group.identityUnderReview ? 'Identity details under review' : null } : null;
  return { status: 200, collection, row: publicRow, route, sourceRecords, sourceGroup };
}
export function nativeOutcome(result) {
  if (result.status === 200) return { action: 'render', collection: result.collection, row: result.row, route: result.route };
  if (result.status === 404) return { action: 'notFound', issue: result.issue };
  return blocked('native_resolution_blocked', { status: result.status, issue: result.issue });
}
