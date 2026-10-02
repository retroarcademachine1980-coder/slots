import { releaseIdentity } from 'public/routes/releaseIdentity';
import { routeManifest } from 'public/routes/routeManifest.generated';
import { resolveRouteRequests, resolveRoutePath, resolveLegacyAlias, resolveLinkRequests } from 'backend/canonicalRoutesApi';
import { ok, serverError, badRequest } from 'wix-http-functions';
import { fetch } from 'wix-fetch';
import { runUnifiedSearchInternal } from 'backend/searchCore';

export async function get_searchDebug() {
    try {
        const result = await runUnifiedSearchInternal('mr ps', { limit: 20 });
        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                total: result.total,
                titles: (result.results || []).map(item => item.title),
                groups: result.groups
            })
        });
    } catch (error) {
        return serverError({
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: String(error && error.message || error) })
        });
    }
}

let fuelCache;
let fuelCacheTime = 0;

export async function get_fuelAverage() {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=21600' };
    if (fuelCache && Date.now() - fuelCacheTime < 21600000) {
        return ok({ headers, body: JSON.stringify(fuelCache) });
    }
    try {
        const page = await fetch('https://www.gov.uk/government/statistics/weekly-road-fuel-prices');
        if (!page.ok) throw new Error('Fuel statistics page unavailable');
        const html = await page.text();
        const urls = [...html.matchAll(/https:\/\/assets\.publishing\.service\.gov\.uk\/media\/[^"'<>\s]+\.csv/gi)].map(match => match[0].replace(/&amp;/g, '&'));
        const csvUrl = urls.find(url => /2018/i.test(url));
        if (!csvUrl) throw new Error('Fuel statistics CSV missing');
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error('Fuel statistics CSV unavailable');
        const csv = await response.text();
        const rows = [...csv.matchAll(/^"?(\d{2}\/\d{2}\/\d{4})"?,"?(\d+(?:\.\d+)?)"?,"?(\d+(?:\.\d+)?)"?/gm)];
        const latest = rows.at(-1);
        if (!latest) throw new Error('Fuel statistics CSV has no prices');
        const petrolPence = Number(latest[2]);
        const dieselPence = Number(latest[3]);
        if (![petrolPence, dieselPence].every(price => price >= 80 && price <= 400)) throw new Error('Fuel statistics out of range');
        fuelCache = { date: latest[1], petrolPence, dieselPence, source: 'GOV.UK weekly road fuel prices' };
        fuelCacheTime = Date.now();
        return ok({ headers, body: JSON.stringify(fuelCache) });
    } catch (error) {
        if (fuelCache) return ok({ headers, body: JSON.stringify({ ...fuelCache, stale: true }) });
        return serverError({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Fuel prices temporarily unavailable' }) });
    }
}

// Read-only route service. Original CMS permissions remain in force; no suppressAuth.
export async function post_canonicalRoutes(request) {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
    try {
        const body = await request.body.json();
        const result = await resolveRouteRequests(body?.requests);
        return (result.ok ? ok : badRequest)({ headers, body: JSON.stringify({ ...result, fingerprint: releaseIdentity(routeManifest) }) });
    } catch { return serverError({ headers, body: JSON.stringify({ ok: false, code: 'route_service_unavailable' }) }); }
}
export async function get_canonicalRoute(request) {
    try { return ok({ headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ ...await resolveRoutePath(request.query.path), fingerprint: releaseIdentity(routeManifest) }) }); }
    catch { return serverError({ body: JSON.stringify({ status: 503, issue: 'route_service_unavailable' }) }); }
}
export async function get_canonicalAlias(request) {
    try { return ok({ headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ ...await resolveLegacyAlias(request.query.input), fingerprint: releaseIdentity(routeManifest) }) }); }
    catch { return serverError({ body: JSON.stringify({ ok: false, code: 'route_service_unavailable' }) }); }
}

// Immutable build identity for exact candidate/test-to-production verification.
// This observes code identity. It does not toggle routing or read/write a CMS flag.
export function get_canonicalFingerprint() {
    return ok({ headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify(releaseIdentity(routeManifest)) });
}

export async function post_canonicalLinks(request) {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
    try {
        const body = await request.body.json(), result = await resolveLinkRequests(body?.inputs);
        return (result.ok ? ok : badRequest)({ headers, body: JSON.stringify({ ...result, fingerprint: releaseIdentity(routeManifest) }) });
    } catch { return serverError({ headers, body: JSON.stringify({ ok: false, code: 'route_service_unavailable' }) }); }
}
