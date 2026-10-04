import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function moduleAt(path, imports = {}) {
    const context = vm.createContext({ setTimeout, clearTimeout, console });
    const cache = new Map();
    async function load(file) {
        if (cache.has(file)) return cache.get(file);
        const source = await readFile(new URL('../' + file, import.meta.url), 'utf8');
        const mod = new vm.SourceTextModule(source, { context });
        cache.set(file, mod);
        await mod.link(async spec => {
            if (spec in imports) {
                const values = imports[spec];
                return new vm.SyntheticModule(Object.keys(values), function () {
                    for (const [key, value] of Object.entries(values)) this.setExport(key, value);
                }, { context });
            }
            return load('src/' + spec + '.js');
        });
        return mod;
    }
    const mod = await load(path);
    await mod.evaluate();
    return mod.namespace;
}

class Query {
    constructor(rows, predicate = () => true) { this.rows = rows; this.predicate = predicate; this.offset = 0; this.size = 50; }
    with(predicate) { return new Query(this.rows, row => this.predicate(row) && predicate(row)); }
    eq(field, value) { return this.with(row => row[field] === value); }
    contains(field, value) { return this.with(row => String(row[field] || '').toLowerCase().includes(value.toLowerCase())); }
    hasSome(field, values) { return this.with(row => (row[field] || []).some(value => values.includes(value))); }
    and(other) { return this.with(other.predicate); }
    or(other) { return new Query(this.rows, row => this.predicate(row) || other.predicate(row)); }
    ascending() { return this; }
    skip(value) { this.offset = value; return this; }
    limit(value) { this.size = value; return this; }
    async find() {
        const rows = this.rows.filter(this.predicate);
        return { items: rows.slice(this.offset, this.offset + this.size), totalCount: rows.length,
            hasNext: () => this.offset + this.size < rows.length };
    }
}
const live = { pageReady: true, directoryReady: true, cardReady: true, heroImage: 'wix:image://v1/exact-photo', slug: 'test' };
const fixture = [
    { ...live, _id: '1', title: 'Admiral Blackpool', locationName: 'Blackpool', adultGamingCentre: true },
    { ...live, _id: '2', title: 'Family Arcade', locationName: 'Blackpool', amusementArcade: true },
    { ...live, _id: '3', title: 'Hidden AGC', locationName: 'Blackpool', adultGamingCentre: true, cardReady: false },
    { ...live, _id: '4', title: 'Admiral Casino', locationName: 'Bromley', adultGamingCentre: true, venueType: 'Adult Gaming Centre' },
    { ...live, _id: '5', title: 'Pier', locationName: 'Skegness', venueType: 'Pier Arcade', directoryReady: false }
];
const data = rows => ({ query: collection => { assert.equal(collection, 'Venues'); return new Query(rows); } });

test('AGC membership and all live gates survive a town search', async () => {
    const api = await moduleAt('src/backend/category-query.js');
    const result = await api.queryCategoryVenues(data(fixture), { category: 'adult-gaming-centres', search: 'Blackpool' });
    assert.deepEqual(Array.from(result.items, x => x._id), ['1']);
    for (const field of ['pageReady', 'directoryReady', 'cardReady']) {
        const rows = [{ ...fixture[0], [field]: false }];
        assert.equal((await api.queryCategoryVenues(data(rows), { category: 'adult-gaming-centres' })).total, 0);
    }
});
test('casino names do not misclassify AGCs as casinos; OR rules cannot leak hidden venues', async () => {
    const api = await moduleAt('src/backend/category-query.js');
    assert.equal((await api.queryCategoryVenues(data(fixture), { category: 'casinos' })).total, 0);
    assert.equal((await api.queryCategoryVenues(data(fixture), { category: 'seaside-arcades' })).total, 0);
});
test('unknown category fails closed; town filter and pagination retain scope', async () => {
    const api = await moduleAt('src/backend/category-query.js');
    assert.throws(() => api.buildCategoryQuery(data(fixture), { category: 'anything' }), /Unknown/);
    const first = await api.queryCategoryVenues(data(fixture), { category: 'adult-gaming-centres', limit: 1 });
    const second = await api.queryCategoryVenues(data(fixture), { category: 'adult-gaming-centres', limit: 1, offset: 1 });
    assert.equal(first.hasMore, true);
    assert.deepEqual(Array.from(second.items, x => x._id), ['4']);
    assert.equal(second.hasMore, false);
    assert.equal((await api.queryCategoryVenues(data(fixture), { category: 'adult-gaming-centres', town: 'bromley' })).total, 1);
});
test('all 19 categories resolve only their own real page paths', async () => {
    const api = await moduleAt('src/public/category-config.js');
    assert.equal(api.categories.length, 19);
    assert.equal(new Set(api.categories.map(c => c.slug)).size, 19);
    for (const c of api.categories) assert.equal(api.categoryForPath('/' + c.slug).slug, c.slug);
    assert.equal(api.categoryForPath('/destination-recommendations?view=agc'), null);
    assert.equal(api.categoryForPath('/adult-gaming-centres/blackpool'), null);
});
test('cards preserve images and legacy routes and never invent ratings', async () => {
    const api = await moduleAt('src/backend/category-query.js');
    const card = api.venueCategoryCard({ ...fixture[0], publicRating: 4.7, publicRatingStatus: 'NEEDS_REVIEW' });
    assert.equal(card.image, fixture[0].heroImage);
    assert.equal(card.route, '/arcade-venues/test');
    assert.equal(card.ratingText, '');
});
test('an older search response cannot replace a newer result', async () => {
    const requests = [];
    const elements = new Map();
    const element = id => {
        if (!elements.has(id)) elements.set(id, { value: '', data: [], disable() {}, enable() {},
            onItemReady(fn) { this.render = fn; }, forEachItem() {},
            onInput(fn) { this.input = fn; }, onKeyPress(fn) { this.key = fn; },
            onChange(fn) { this.change = fn; }, onClick(fn) { this.click = fn; } });
        return elements.get(id);
    };
    const api = await moduleAt('src/public/category-page.js', {
        'wix-location-frontend': { default: { path: ['adult-gaming-centres'] } },
        'backend/categoryPages.web': { listCategoryVenues: options => new Promise(resolve => requests.push({ options, resolve })) }
    });
    const mounted = api.mountCategoryPage(element);
    element('#categorySearch').value = 'Bromley';
    const newer = mounted.refresh();
    requests[1].resolve({ items: [{ _id: 'new' }], total: 1, offset: 0, hasMore: false });
    await newer;
    requests[0].resolve({ items: [{ _id: 'old' }], total: 1, offset: 0, hasMore: false });
    await mounted.ready;
    assert.equal(element('#venueRepeater').data[0]._id, 'new');
    mounted.dispose();
});
