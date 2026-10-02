/** The frontend, backend, metadata and sitemap use the SAME outcome contract. */
import { SITE_ORIGIN, resolveRecord, blocked, parseCanonical } from 'public/routes/canonicalRoutes';
export function cardRoute(collection, row, context) {
  const result = resolveRecord(collection, row, context);
  return result.ok
    ? { kind: 'link', href: result.href, canonicalUrl: result.canonicalUrl }
    : { kind: 'unavailable', issue: result.code, recordKey: result.key, label: 'Guide unavailable', canonicalCandidate: result.canonicalPath || null };
}
export function routeBatch(records, context) {
  const linked = [], unavailable = [];
  for (const { collection, row } of records) {
    const result = resolveRecord(collection, row, context);
    if (result.ok) linked.push({ collection, row, route: result });
    else unavailable.push({ collection, row, issue: result });
  }
  return { linked, unavailable, complete: unavailable.length === 0, total: records.length };
}
export function seoRoute(collection, row, context) {
  const result = resolveRecord(collection, row, context, { surface: 'detail' });
  return result.ok ? { canonicalUrl: result.canonicalUrl, robots: result.indexable === false || [row.directoryReady, row.pageReady, row.guideReady].includes(false) ? 'noindex,follow' : 'index,follow' }
    : { robots: 'noindex,follow', issue: result.code };
}
export function sitemapRoutes(records, context) {
  const batch = routeBatch(records, context);
  return { entries: [...new Set(batch.linked.map(item => item.route.path))].map(path => ({ url: SITE_ORIGIN + path })),
    withheld: batch.unavailable.map(item => ({ key: item.issue.key, reason: item.issue.code })), complete: batch.complete };
}
/** For callers requiring an href, throw rather than silently produce href=""/#. */
export function requireHref(result) {
  if (!result.ok || !result.href || !parseCanonical(result.href).ok) throw new Error(`Canonical route unavailable: ${result.code || 'invalid_result'}`);
  return result.href;
}
/** A deep-link lookup must return exactly the indexed record, never limit(1). */
export function selectUniqueRecord(collection, rows, expectedPath, context) {
  const results = rows.map(row => ({ row, route: resolveRecord(collection, row, context, { surface: 'detail' }) }))
    .filter(result => result.route.ok && result.route.path === expectedPath);
  return results.length === 1 ? { ok: true, ...results[0] }
    : blocked(results.length ? 'ambiguous_native_record' : 'native_record_not_found');
}
