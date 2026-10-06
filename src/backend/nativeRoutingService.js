import { resolveLegacyAlias } from 'backend/canonicalRoutesApi';
import { INDEX_ROUTES } from 'public/routes/indexRoutes';
import wixData from 'wix-data';
import { ok, notFound, sendStatus, redirect, WixRouterSitemapEntry } from 'wix-router';
import { createNativeRouter } from 'public/routes/nativeRouterAdapter';
import { resolveRecord, ROUTES, parseCanonical } from 'public/routes/canonicalRoutes';
import { routeManifest } from 'public/routes/routeManifest.generated';
import { loadRouteContext } from 'backend/canonicalRouteService';
export async function canonicalRouter(kind, request) {
    const spec = Object.hasOwn(ROUTES, kind) ? ROUTES[kind] : Object.hasOwn(INDEX_ROUTES, kind) ? INDEX_ROUTES[kind] : null;
    if (!spec) return notFound();
    const context = await loadRouteContext(), parts = (Array.isArray(request.path) ? request.path : []).filter(part => part !== '');
    if (parts.some(part => typeof part !== 'string' || /[/?#\\%]/.test(part))) return notFound();
    const path = spec.prefix + (parts.length ? '/' + parts.join('/') : '');
    return createNativeRouter({ context, manifest: { entries: [], issues: [], complete: false },
        resolveAlias:resolveLegacyAlias, readById: (collection, id) => wixData.get(collection, id), ok, notFound, sendStatus:status=>sendStatus(String(status)), redirect }).canonical(path);
}
export async function canonicalSitemap(kind) {
    const context = await loadRouteContext(), endpoint = context.endpoints[kind];
    if (!endpoint?.native || !endpoint?.renderer || !endpoint.evidence || !endpoint.revision || !endpoint.pageName) throw new Error('Canonical endpoint not verified: ' + kind);
    const groups = new Map(), output = [];
    for (const entry of routeManifest.entries || []) {
        if (parseCanonical(entry.path).kind !== kind) continue;
        const split = entry.key.indexOf(':'), collection = entry.key.slice(0, split), id = entry.key.slice(split + 1);
        (groups.get(collection) || (groups.set(collection, []), groups.get(collection))).push(id);
    }
    for (const [collection, ids] of groups) {
        for (let offset = 0; offset < ids.length; offset += 1000) {
            const result = await wixData.query(collection).hasSome('_id', ids.slice(offset, offset + 1000)).limit(1000).find();
            for (const row of result.items || []) {
                const route = resolveRecord(collection, row, context);
                if (!route.ok || route.kind !== kind) continue;
                const entry = new WixRouterSitemapEntry(collection + ':' + row._id);
                entry.pageName = endpoint.pageName; entry.url = route.path; entry.title = row.seoTitle || row.title || '';
                output.push(entry);
            }
        }
    }
    const path = (ROUTES[kind] || INDEX_ROUTES[kind]).prefix, landing = context.landings[path];
    const indexEndpoint = context.endpoints[landing?.kind];
    if (landing && landing.seo?.noIndex !== true && !(landing.seo?.metaTags || []).some(tag => tag.name === 'robots' && /noindex/i.test(tag.content || '')) && indexEndpoint?.native && indexEndpoint?.renderer && indexEndpoint.evidence && indexEndpoint.revision) {
        const entry = new WixRouterSitemapEntry(kind + '-index');
        entry.pageName = landing.pageName; entry.url = path; entry.title = landing.seo.title; output.push(entry);
    }
    return output;
}
