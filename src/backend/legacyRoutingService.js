import { staticNavigation } from 'public/routes/navigationRoutes';
import { routeManifest } from 'public/routes/routeManifest.generated';
import { next, notFound, sendStatus, redirect } from 'wix-router';
import { SITE_ORIGIN, parseCanonical } from 'public/routes/canonicalRoutes';
import { exactEncodedLegacyInput } from 'public/routes/legacyRedirects';
import { resolveLegacyAlias } from 'backend/canonicalRoutesApi';
/** Ready for exact native beforeRouter binding after the handler name/invocation
 * is proven on the isolated test build. No next() fallback to old content exists.
 */
export async function legacyPathRouter(prefix, request) {
    const parts = Array.isArray(request.path) ? request.path : [];
    // Wix documents request.url as the full original URL. The eight historical
    // slash-in-title inputs require that exact raw URL plus one matching segment.
    // Missing/raw-mismatched URL, split segments and double encoding stay closed.
    const exceptional = prefix === '/arcade-venues' && typeof request.url === 'string' &&
      request.url.startsWith(SITE_ORIGIN + '/') && exactEncodedLegacyInput(request.url);
    const exceptionalToken = exceptional && exceptional.slice(prefix.length + 1);
    const exactExceptionalRequest = exceptional && parts.length === 1 &&
      (parts[0] === exceptionalToken || parts[0] === decodeURIComponent(exceptionalToken));
    if (exceptional && !exactExceptionalRequest) return notFound();
    if (!prefix.startsWith('/') || (!exactExceptionalRequest && parts.some(part => typeof part !== 'string' || /[/?#\\]/.test(part)))) return notFound();
    // Temporary preserved native index shell; final renderer owns the content.
    // Cleanup build removes this branch after captured backward rules are retired.
    if (!parts.length && routeManifest.deploymentPhase === 'transition' && ['/classic-fruit-machine-archive','/classic-fruit-machine-archive-1'].includes(prefix)) return next();
    // Wix may hand the segment over raw (earl's) or still percent-encoded (%E2%80%93). Try the
    // decoded-then-encoded form, the strict form (apostrophes as %27) and the raw form.
    const decode = part => { try { return decodeURIComponent(part); } catch { return part; } };
    const strict = part => encodeURIComponent(decode(part)).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    const forms = exactExceptionalRequest ? [exceptional] : [...new Set([
      prefix + (parts.length ? '/' + parts.map(part => encodeURIComponent(decode(part))).join('/') : ''),
      prefix + (parts.length ? '/' + parts.map(strict).join('/') : ''),
      prefix + (parts.length ? '/' + parts.map(encodeURIComponent).join('/') : '')
    ])];
    let result = { ok: false };
    for (const path of forms) { result = await resolveLegacyAlias(path); if (result.ok || result.inputMapped) break; }
    if (!result.ok) return result.status === 503 || result.inputMapped ? sendStatus(String(result.status || 503)) : notFound();
    if (result.method !== 'server301' || !(parseCanonical(result.to).ok || staticNavigation(result.to).ok)) return sendStatus('503');
    return redirect(SITE_ORIGIN + result.to, '301');
}
