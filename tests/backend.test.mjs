import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';

async function runtime(data, owner = 'member-a') {
    const writes = [], reads = [];
    const context = vm.createContext({ URL, Date, Set, console });
    const modules = new Map();
    const wixData = {
        query(collection) {
            const filters = [];
            return {
                eq(k, v) { filters.push([k, v]); return this; },
                limit() { return this; },
                async find(options) {
                    reads.push({ collection, filters, options });
                    if (data[collection] instanceof Error) throw data[collection];
                    const rows = (data[collection] || []).filter(r => filters.every(([k, v]) => r[k] === v));
                    let offset = 0;
                    const page = () => ({ items: rows.slice(offset, offset + 2), hasNext: () => offset + 2 < rows.length, next: async () => { offset += 2; return page(); } });
                    return page();
                }
            };
        },
        async save(collection, item, options) { writes.push({ collection, item, options }); return item; }
    };
    const mocks = {
        'wix-data': { default: wixData },
        'wix-members-backend': { currentMember: { getMember: async () => ({ _id: owner }) } },
        'wix-web-module': { Permissions: { Anyone: 'public', SiteMember: 'member' }, webMethod: (permission, fn) => Object.assign(fn, { permission }) },
        crypto: { createHash: crypto.createHash }
    };
    async function moduleFor(name) {
        if (modules.has(name)) return modules.get(name);
        let mod;
        if (mocks[name]) {
            const mock = mocks[name];
            mod = new vm.SyntheticModule(Object.keys(mock), function () { for (const [k, v] of Object.entries(mock)) this.setExport(k, v); }, { context });
        } else {
            const filename = '../src/' + name + '.js';
            mod = new vm.SourceTextModule(await readFile(new URL(filename, import.meta.url), 'utf8'), { context, identifier: name });
        }
        modules.set(name, mod);
        await mod.link(moduleFor);
        return mod;
    }
    return { writes, reads, async load(name) { const mod = await moduleFor(name); await mod.evaluate(); return mod.namespace; } };
}

test('backend paginates and returns only ready public card data', async () => {
    const venues = Array.from({ length: 5 }, (_, i) => ({ _id: 'v-' + i, title: 'Venue ' + i, slug: 'v-' + i, directoryReady: true, cardReady: true, pageReady: true, heroImage: 'https://example.com/a.jpg', 'link-arcade-venues-title': '/arcade-venues/v-' + i, researchStatus: 'internal' }));
    const env = await runtime({ Venues: venues, Locations: [], DestinationRecommendations: [] });
    const api = await env.load('backend/discovery.web');
    const result = await api.searchPlaces('Venue');
    assert.equal(result.total, 5);
    assert.equal(result.results[0].researchStatus, undefined);
    assert.equal(env.reads[0].options.consistentRead, true);
});
test('a collection outage fails the request rather than returning partial search results', async () => {
    const env = await runtime({ Venues: new Error('offline'), Locations: [], DestinationRecommendations: [] });
    const api = await env.load('backend/discovery.web');
    await assert.rejects(() => api.searchPlaces('Blackpool'), /temporarily unavailable/);
});
test('member writes retain author permissions and cannot target another member', async () => {
    const env = await runtime({ MemberJourney: [{ _id: 'member-b', _owner: 'member-b', homeLocation: 'Leeds' }] });
    const api = await env.load('backend/member-discovery.web');
    assert.equal(api.saveMyPreferences.permission, 'member');
    await api.saveMyPreferences({ _id: 'member-b', _owner: 'member-b', homeLocation: 'Blackpool' });
    assert.equal(env.writes[0].item._id, 'member-a');
    assert.equal(env.writes[0].item._owner, undefined);
    assert.equal(env.writes[0].options, undefined);
    assert.equal(env.writes[0].item.emailOffersOptIn, undefined);
});
test('public endpoint cannot reveal member offer URLs and expired offers cannot be opened', async () => {
    const rows = [{ _id: 'a', name: 'Hotel', image: 'https://example.com/p.jpg', cardReady: true, active: true, affiliate: true, revenueReady: true, affiliateUrl: 'https://example.com/book' }, { _id: 'expired', name: 'Expired', image: 'https://example.com/p.jpg', cardReady: true, active: true, affiliate: true, revenueReady: true, affiliateUrl: 'https://example.com/book', validUntil: '2000-01-01' }];
    const env = await runtime({ DestinationRecommendations: rows });
    const api = await env.load('backend/discovery.web');
    assert.equal(api.getMemberOffer.permission, 'member');
    await assert.rejects(() => api.getPublicRecommendationLink('a'), /no longer available/);
    await assert.rejects(() => api.getMemberOffer('expired'), /no longer available/);
    assert.equal((await api.getMemberOffer('a')).url, 'https://example.com/book');
});
