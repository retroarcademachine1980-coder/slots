import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const path = '/bowling/tenpin/leeds';
function fixture() {
    return { status: 200, view: 'detail', collection: 'Venues', route: { kind: 'bowling', path, key: 'Venues:leeds' }, record: { _id: 'leeds', title: 'Tenpin Leeds', detailedReview: '<h2>Bowling in Leeds city centre</h2><p>Complete existing visitor guide.</p>', sourceFacts: '<p>Source checked.</p>' } };
}
async function moduleFor({ routerData, select = () => ({}), load = async () => null } = {}) {
    let handler;
    const context = vm.createContext({ $w: Object.assign(select, { onReady: fn => { handler = fn; } }) });
    const deps = {
        'wix-location-frontend': { default: { prefix: 'bowling', path: ['tenpin', 'leeds'] } },
        'wix-window-frontend': { getRouterData: () => routerData },
        'backend/canonicalPages.web': { getCanonicalPage: load }
    };
    const source = await fs.readFile(new URL('../src/pages/bowling-page.zll98.js', import.meta.url), 'utf8');
    const mod = new vm.SourceTextModule(source, { context });
    await mod.link(spec => new vm.SyntheticModule(Object.keys(deps[spec]), function () {
        for (const [key, value] of Object.entries(deps[spec])) this.setExport(key, value);
    }, { context }));
    await mod.evaluate();
    return { content: mod.namespace.bowlingArticleContent, render: mod.namespace.renderBowlingArticle, handler };
}
test('bowling renders the whole venue review ahead of a short source note without changing it', async () => {
    const { content } = await moduleFor(), data = fixture(), before = JSON.stringify(data);
    assert.equal(content(data, path).bodyHtml, data.record.detailedReview);
    assert.equal(content(data, path).title, data.record.title);
    assert.equal(JSON.stringify(data), before);
});
test('bowling rejects a different identity, path, kind, collection, view or failure', async () => {
    const { content } = await moduleFor();
    for (const change of [d => { d.route.key = 'Venues:other'; }, d => { d.record._id = 'other'; }, d => { d.route.path += '-other'; }, d => { d.route.kind = 'cinema'; }, d => { d.collection = 'FoodAndDrink'; }, d => { d.view = 'index'; }, d => { d.status = 503; }]) {
        const data = fixture(); change(data); assert.equal(content(data, path), null);
    }
});
test('attraction bowling keeps the complete sourceFacts guide; plain text is escaped', async () => {
    const { content } = await moduleFor(), data = fixture();
    data.collection = 'NearbyAttractions'; data.route.key = 'NearbyAttractions:leeds';
    data.record.sourceFacts = 'Fish & chips < £10\nNext line.\n\nNext paragraph.';
    assert.equal(content(data, path).bodyHtml, '<p>Fish &amp; chips &lt; £10<br>Next line.</p>\n<p>Next paragraph.</p>');
});
test('bowling index uses its original introduction and never borrows a venue', async () => {
    const { content, render } = await moduleFor();
    const data = { status: 200, view: 'index', route: { kind: 'bowling', path: '/bowling' }, metadata: { sourceTitle: 'Bowling days out', introduction: 'Original category & choices.' } };
    assert.equal(content(data, '/bowling').bodyHtml, '<p>Original category &amp; choices.</p>');
    assert.equal(await render({ select: () => ({}), path: '/bowling', routerData: data, load: async () => { throw Error('Unexpected detail lookup'); } }), true);
});
test('initial bowling rendering awaits fallback and assigns both native controls', async () => {
    const elements = { '#srNativeGuideTitle': {}, '#srNativeGuideArticle': {} };
    let release, requested;
    const pending = new Promise(resolve => { release = resolve; });
    const { handler } = await moduleFor({ select: id => elements[id], load: async p => { requested = p; return await pending; } });
    let finished = false;
    const result = handler().then(value => { finished = true; return value; });
    await Promise.resolve(); assert.equal(finished, false); assert.equal(requested, path);
    release(fixture()); assert.equal(await result, true);
    assert.equal(elements['#srNativeGuideTitle'].text, 'Tenpin Leeds');
    assert.equal(elements['#srNativeGuideArticle'].html, fixture().record.detailedReview);
});
test('valid router data avoids another request; missing control leaves original title unchanged', async () => {
    const title = { text: 'Original heading' };
    const { render } = await moduleFor();
    assert.equal(await render({ select: id => id === '#srNativeGuideTitle' ? title : undefined, path, routerData: fixture(), load: async () => { throw Error('Unexpected fetch'); } }), false);
    assert.equal(title.text, 'Original heading');
});
