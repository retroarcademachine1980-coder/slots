import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const path = '/museums/fixture-museum/fixture-town';
function fixture() {
    return { view: 'detail', collection: 'NearbyAttractions', record: {
        _id: 'museum1', title: 'Fixture Museum', fullDescription: '<p>Original guide.</p>',
        sourceFacts: '<h2>Original guide</h2><p>Original visit details.</p><h2>Visitor update</h2><p>Seasonal opening information.</p>'
    }, route: { kind: 'museum', path, key: 'NearbyAttractions:museum1' } };
}
async function moduleFor({ routerData, load = async () => fixture(), select = () => {} } = {}) {
    const context = vm.createContext({});
    let handler;
    select.onReady = callback => { handler = callback; };
    context.$w = select;
    const deps = {
        'wix-location-frontend': { default: { prefix: 'museums', path: ['fixture-museum', 'fixture-town'] } },
        'wix-window-frontend': { getRouterData: () => routerData },
        'backend/canonicalPages.web': { getCanonicalPage: load }
    };
    const source = await fs.readFile(new URL('../src/pages/museums-page.dn097.js', import.meta.url), 'utf8');
    const mod = new vm.SourceTextModule(source, { context });
    await mod.link(spec => new vm.SyntheticModule(Object.keys(deps[spec]), function () {
        for (const [key, value] of Object.entries(deps[spec])) this.setExport(key, value);
    }, { context }));
    await mod.evaluate();
    return { content: mod.namespace.museumArticleContent, handler };
}
test('native museum keeps the full updated guide and original record intact', async () => {
    const { content } = await moduleFor(), data = fixture(), before = JSON.stringify(data);
    assert.equal(content(data, path).title, data.record.title);
    assert.equal(content(data, path).bodyHtml, data.record.sourceFacts);
    assert.equal(JSON.stringify(data), before);
});
test('wrong venue, route, kind, collection, index and error payloads are rejected', async () => {
    const { content } = await moduleFor();
    for (const change of [d => { d.route.key = 'NearbyAttractions:other'; }, d => { d.record._id = 'other'; }, d => { d.route.path += '-other'; }, d => { d.route.kind = 'zoo'; }, d => { d.collection = 'Venues'; }, d => { d.view = 'index'; }, d => { d.status = 404; }]) {
        const data = fixture(); change(data); assert.equal(content(data, path), null);
    }
});
test('plain original text is escaped; missing articles are rejected', async () => {
    const { content } = await moduleFor(), data = fixture();
    delete data.record.sourceFacts;
    data.record.fullDescription = 'Fish & chips < £10\nStill good.\n\nSecond paragraph.';
    assert.equal(content(data, path).bodyHtml, '<p>Fish &amp; chips &lt; £10<br>Still good.</p>\n<p>Second paragraph.</p>');
    delete data.record.fullDescription;
    assert.equal(content(data, path), null);
});
test('valid router data avoids a second lookup and assigns the observed controls', async () => {
    const elements = { '#srNativeGuideTitle': {}, '#srNativeGuideArticle': {} };
    const { handler } = await moduleFor({ routerData: fixture(), select: id => elements[id], load: async () => { throw Error('Unexpected fetch'); } });
    assert.equal(await handler(), true);
    assert.equal(elements['#srNativeGuideTitle'].text, 'Fixture Museum');
    assert.equal(elements['#srNativeGuideArticle'].html, fixture().record.sourceFacts);
});
test('initial rendering awaits the identity-checked fallback article', async () => {
    const elements = { '#srNativeGuideTitle': {}, '#srNativeGuideArticle': {} };
    let release, actualPath;
    const pending = new Promise(resolve => { release = resolve; });
    const { handler } = await moduleFor({ select: id => elements[id], load: async value => { actualPath = value; return await pending; } });
    let finished = false;
    const rendering = handler().then(value => { finished = true; return value; });
    await Promise.resolve(); assert.equal(finished, false); assert.equal(actualPath, path);
    release(fixture()); assert.equal(await rendering, true); assert.equal(finished, true);
});
test('failed lookup and wrong fallback preserve existing visible content', async () => {
    for (const load of [async () => { throw Error('Unavailable'); }, async () => { const d = fixture(); d.route.key = 'NearbyAttractions:other'; return d; }]) {
        const elements = { '#srNativeGuideTitle': { text: 'Existing heading' }, '#srNativeGuideArticle': { html: 'Existing guide' } };
        const { handler } = await moduleFor({ select: id => elements[id], load });
        assert.equal(await handler(), false);
        assert.equal(elements['#srNativeGuideTitle'].text, 'Existing heading');
        assert.equal(elements['#srNativeGuideArticle'].html, 'Existing guide');
    }
});
