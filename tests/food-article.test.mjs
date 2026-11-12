import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { foodArticleContent, renderFoodArticle } from '../src/public/food-article.js';

const path = '/food-and-drink/fixture-cafe';
function fixture() {
    return { status: 200, collection: 'FoodAndDrink', row: { _id: 'food1', title: 'Fixture Cafe', shortDescription: 'A short listing.', linkedAttractionId: 'review1' },
        route: { kind: 'food', path, key: 'FoodAndDrink:food1' },
        sourceGroup: { relation: 'same-entity', primaryKey: 'FoodAndDrink:food1', sourceKeys: ['FoodAndDrink:food1', 'NearbyAttractions:review1'] },
        sourceRecords: [{ key: 'NearbyAttractions:review1', collection: 'NearbyAttractions', row: { _id: 'review1', sourceFacts: '<p>Our complete meal review.</p><h2>What we ordered</h2><p>All the original details.</p>' } }] };
}
test('native food article retains the complete linked review verbatim without modifying source records', () => {
    const data = fixture(), before = JSON.stringify(data);
    const content = foodArticleContent(data, path);
    assert.equal(content.bodyHtml, data.sourceRecords[0].row.sourceFacts);
    assert.equal(content.title, 'Fixture Cafe');
    assert.equal(JSON.stringify(data), before);
});
test('nearby/unapproved/identity-under-review sources cannot become the food article', () => {
    for (const change of [d => { d.sourceGroup.sourceKeys = []; }, d => { d.sourceGroup.identityUnderReview = true; }, d => { d.sourceRecords[0].row._id = 'other'; }, d => { d.row.linkedAttractionId = 'other'; }, d => { d.sourceGroup.relation = 'nearby'; }]) {
        const data = fixture(); change(data);
        assert.equal(foodArticleContent(data, path).bodyHtml, '');
    }
});
test('wrong route, kind, collection, record identity and error responses cannot overwrite this page', () => {
    for (const change of [d => { d.route.path += '-other'; }, d => { d.route.kind = 'cinema'; }, d => { d.collection = 'Venues'; }, d => { d.route.key = 'FoodAndDrink:other'; }, d => { d.status = 404; }]) {
        const data = fixture(); change(data); assert.equal(foodArticleContent(data, path), null);
    }
});
test('plain original article is escaped rather than interpreted as markup', () => {
    const data = fixture(); data.row.fullDescription = 'Fish & chips < £10\nStill good.\n\nSecond paragraph.';
    assert.equal(foodArticleContent(data, path).bodyHtml, '<p>Fish &amp; chips &lt; £10<br>Still good.</p>\n<p>Second paragraph.</p>');
});
test('CMS readiness and canonical retrieval are awaited before writing the full native article', async () => {
    const events = [], elements = { '#title': {}, '#description': {}, '#text1': { html: 'Existing native body' } };
    let release;
    const ready = new Promise(resolve => { release = resolve; });
    const result = renderFoodArticle({ select: id => id === '#dynamicDataset' ? { onReadyAsync: () => ready } : elements[id], path,
        load: async actual => { events.push(actual); return fixture(); } });
    await Promise.resolve(); assert.equal(events.length, 0); assert.equal(elements['#text1'].html, 'Existing native body');
    release(); assert.equal(await result, true);
    assert.deepEqual(events, [path]); assert.equal(elements['#text1'].html, fixture().sourceRecords[0].row.sourceFacts);
});

test('server rendering can return the identity-bound review without waiting on a client dataset', async () => {
    const elements = { '#title': {}, '#description': {}, '#text1': { html: 'Existing article' } };
    let datasetReads = 0;
    const result = await renderFoodArticle({
        environment: 'backend',
        select: id => {
            if (id === '#dynamicDataset') { datasetReads++; throw Error('Client dataset is not available in this server cycle'); }
            return elements[id];
        },
        path,
        load: async actual => { assert.equal(actual, path); return fixture(); }
    });
    assert.equal(result, true);
    assert.equal(datasetReads, 0);
    assert.equal(elements['#text1'].html, fixture().sourceRecords[0].row.sourceFacts);
});

test('server rendering still refuses a review belonging to a different food page', async () => {
    const data = fixture(); data.route.path += '-other';
    const elements = { '#text1': { html: 'Existing article' } };
    let datasetReads = 0;
    const result = await renderFoodArticle({
        environment: 'backend',
        select: id => {
            if (id === '#dynamicDataset') { datasetReads++; throw Error('No client dataset during server rendering'); }
            return elements[id];
        },
        path,
        routerData: data,
        load: async () => data
    });
    assert.equal(result, false);
    assert.equal(datasetReads, 0);
    assert.equal(elements['#text1'].html, 'Existing article');
});
test('valid router data avoids an extra fetch; missing body preserves the existing native text', async () => {
    const data = fixture(); data.sourceRecords = [];
    const elements = { '#title': {}, '#description': {}, '#text1': { html: 'Existing article' } };
    assert.equal(await renderFoodArticle({ select: id => id === '#dynamicDataset' ? { onReadyAsync: async () => {} } : elements[id], path, routerData: data,
        load: async () => { throw Error('Unexpected second fetch'); } }), true);
    assert.equal(elements['#text1'].html, 'Existing article');
});
test('dataset and retrieval failures remain contained without clearing the existing page', async () => {
    for (const failDataset of [true, false]) {
        const elements = { '#text1': { html: 'Existing article' } };
        assert.equal(await renderFoodArticle({ select: id => id === '#dynamicDataset' ? { onReadyAsync: async () => { if (failDataset) throw Error('Dataset unavailable'); } } : elements[id], path,
            load: async () => { throw Error('Canonical lookup unavailable'); } }), false);
        assert.equal(elements['#text1'].html, 'Existing article');
    }
});
test('the real Food Item page returns the article promise to the Wix server-rendering lifecycle', async () => {
    const context = vm.createContext({}), calls = [];
    let handler, release;
    const pending = new Promise(resolve => { release = resolve; });
    const select = () => {};
    select.onReady = callback => { handler = callback; };
    context.$w = select;
    const deps = {
        'wix-location-frontend': { default: { prefix: 'food-and-drink', path: ['fixture-cafe'] } },
        'wix-window-frontend': { getRouterData: () => { throw Error('No native router data'); }, rendering: { env: 'backend' } },
        'backend/canonicalPages.web': { getCanonicalPage: async () => fixture() },
        'public/food-article': { renderFoodArticle: async options => { calls.push(options); return await pending; } }
    };
    const source = await fs.readFile(new URL('../src/pages/Food and Drink (Item).mmbdr.js', import.meta.url), 'utf8');
    const mod = new vm.SourceTextModule(source, { context });
    await mod.link(spec => new vm.SyntheticModule(Object.keys(deps[spec]), function () {
        for (const [key, value] of Object.entries(deps[spec])) this.setExport(key, value);
    }, { context }));
    await mod.evaluate();
    assert.equal(typeof handler, 'function');
    let finished = false;
    const rendering = handler().then(value => { finished = true; return value; });
    await Promise.resolve();
    assert.equal(finished, false); assert.equal(calls[0].path, path); assert.equal(calls[0].select, select);
    assert.equal(calls[0].environment, 'backend');
    release(true); assert.equal(await rendering, true); assert.equal(finished, true);
});
