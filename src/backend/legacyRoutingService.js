import { staticNavigation } from 'public/routes/navigationRoutes';
import { routeManifest } from 'public/routes/routeManifest.generated';
import { next, notFound, sendStatus, redirect } from 'wix-router';
import { SITE_ORIGIN, parseCanonical } from 'public/routes/canonicalRoutes';
import { resolveLegacyAlias } from 'backend/canonicalRoutesApi';
/** Ready for exact native beforeRouter binding after the handler name/invocation
 * is proven on the isolated test build. No next() fallback to old content exists.
 */
export async function legacyPathRouter(prefix, request) {
    const parts = Array.isArray(request.path) ? request.path : [];
    if (!prefix.startsWith('/') || parts.some(part => typeof part !== 'string' || /[/?#\\]/.test(part))) return notFound();
    // Temporary preserved native index shell; final renderer owns the content.
    // Cleanup build removes this branch after captured backward rules are retired.
    if (!parts.length && routeManifest.deploymentPhase === 'transition' && ['/classic-fruit-machine-archive','/classic-fruit-machine-archive-1'].includes(prefix)) return next();
    const path = prefix + (parts.length ? '/' + parts.map(encodeURIComponent).join('/') : '');
    const result = await resolveLegacyAlias(path);
    if (!result.ok) return result.status === 503 || result.inputMapped ? sendStatus(String(result.status || 503)) : notFound();
    if (result.method !== 'server301' || !(parseCanonical(result.to).ok || staticNavigation(result.to).ok)) return sendStatus('503');
    return redirect(SITE_ORIGIN + result.to, '301');
}
