import { ok, serverError } from 'wix-http-functions';
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
