import { parseCanonical } from 'public/routes/canonicalRoutes';
/** afterRouter prototype, because Wix explicitly documents ok() there.
 * Native invocation for dataset404 and actual page binding MUST be verified on
 * the candidate test build; these unit tests do not establish platform support.
 */
export function createDynamicDetailHook({ kind, prefix, pageName, resolve, resolveAlias, redirect, ok, notFound, sendStatus }) {
  return async function afterRouter(request, response) {
    const parts = Array.isArray(request.path) ? request.path : [];
    if (!parts.length) return response; // Preserve the current native list page.
    if (parts.some(part => typeof part !== 'string' || /[/?#\\%]/.test(part))) return notFound();
    const path = prefix + '/' + parts.join('/'), parsed = parseCanonical(path);
    if (!parsed.ok || parsed.kind !== kind) {
      // A retired address form under this prefix may still be an identity-bound legacy input.
      if (resolveAlias && redirect) {
        const alias = await resolveAlias(path);
        if (alias.ok && alias.method === 'server301' && parseCanonical(alias.to).ok) return redirect(alias.to, '301');
      }
      return notFound();
    }
    const result = await resolve(path);
    if (result.status === 404) {
      if (resolveAlias && redirect) {
        const alias = await resolveAlias(path);
        if (alias.ok && alias.method === 'server301' && parseCanonical(alias.to).ok) return redirect(alias.to, '301');
        if (alias.inputMapped && alias.status === 503) return sendStatus(503);
      }
      return notFound();
    }
    if (result.status !== 200) return sendStatus(result.status);
    // Never guess a page name from URL/title. Use configured proof or the native response page, required to
    // appear in this router's request.pages when supplied by the Wix runtime.
    const selectedPage = pageName || (Array.isArray(request.pages) && request.pages.includes(response?.page) ? response.page : null);
    if (!selectedPage || (Array.isArray(request.pages) && !request.pages.includes(selectedPage))) return sendStatus(503);
    return ok(selectedPage, { view: 'detail', collection: result.collection, record: result.row,
      sourceRecords: result.sourceRecords, sourceGroup: result.sourceGroup, route: result.route }, {
      links: [{rel:'canonical',href:result.route.canonicalUrl}],
      title: result.row.seoTitle || result.row.title || result.row.displayTitle || '',
      description: result.row.seoDescription || result.row.shortDescription || result.row.summary || '',
      noIndex: result.route.indexable === false || [result.row.directoryReady, result.row.pageReady, result.row.guideReady].includes(false)
    });
  };
}
