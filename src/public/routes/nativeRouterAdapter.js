import { resolveNativePath } from 'public/routes/nativeRouteResolver';
import { redirectFor } from 'public/routes/legacyRedirects';
import { SITE_ORIGIN } from 'public/routes/canonicalRoutes';
/** All Wix-specific methods are injected to keep policy tests real and deterministic. */
export function createNativeRouter({ context, manifest, readById, ok, notFound, redirect, sendStatus, resolveAlias }) {
  async function canonical(path) {
    const landing = context.landings?.[path];
    if (landing) {
      const endpoint = context.endpoints[landing.kind];
      if (!endpoint?.native || !endpoint?.renderer || !endpoint.evidence || !endpoint.revision || !landing.pageName || !(landing.preservedPageId || landing.preservedContentRef) || !landing.seo) return sendStatus(503);
      return ok(landing.pageName, { view: 'index', route: { kind: landing.kind, path }, metadata: landing.metadata || {} }, landing.seo);
    }
    const result = await resolveNativePath(path, context, readById);
    if (result.status === 404) {
      const alias = resolveAlias && await resolveAlias(path);
      if (alias?.ok && alias.method === 'server301') return redirect(SITE_ORIGIN + alias.to, '301');
      return alias?.inputMapped ? sendStatus(alias.status || 503) : notFound();
    }
    if (result.status !== 200) return sendStatus(result.status);
    const endpoint = context.endpoints[result.route.kind];
    if (!endpoint?.pageName) return sendStatus(503);
    return ok(endpoint.pageName, { view: 'detail', collection: result.collection, record: result.row, sourceRecords: result.sourceRecords, sourceGroup: result.sourceGroup, route: result.route }, {
      links: [{rel:'canonical',href:result.route.canonicalUrl}],
      title: result.row.seoTitle || result.row.title || '',
      description: result.row.seoDescription || result.row.shortDescription || '',
      noIndex: result.route.indexable === false || [result.row.directoryReady, result.row.pageReady, result.row.guideReady].includes(false)
    });
  }
  async function legacy(path) {
    const found = redirectFor(path, manifest);
    if (!found.ok) return notFound();
    // Query compatibility is frontend-only unless hosting supplies proven matching.
    if (found.method !== 'server301') return sendStatus(400);
    const resolved = await resolveNativePath(found.to, context, readById);
    if (resolved.status === 404) return notFound();
    if (resolved.status !== 200) return sendStatus(resolved.status);
    return redirect(SITE_ORIGIN + found.to, '301');
  }
  return { canonical, legacy };
}
