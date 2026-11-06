import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const path = '/cinemas/fixture-cinema/fixture-town';
function fixture() {
    return { view: 'detail', collection: 'NearbyAttractions', record: {
        _id: 'cinema1', title: 'Fixture Cinema', fullDescription: '<p>Original guide.</p>',
        sourceFacts: '<h2>Original guide</h2><p>Original visit details.</p><h2>Visitor update</h2><p>Seasonal opening information.</p>'
    }, route: { kind: 'cinema', path, key: 'NearbyAttractions:cinema1' } };
}
async function moduleFor({ routerData, load = async () => fixture(), select = () => {} } = {}) {
    const context = vm.createContext({});
    let handler;
    select.onReady = callback => { handler = callback; };
    context.$w = select;
    const deps = {
        'wix-location-frontend': { default: { prefix: 'cinemas', path: ['fixture-cinema', 'fixture-town'] } },
        'wix-window-frontend': { getRouterData: () => routerData },
        'backend/canonicalPages.web': { getCanonicalPage: load }
    };
    const source = await fs.readFile(new URL('../src/pages/cinemas-page.u20u0.js', import.meta.url), 'utf8');
    const mod = new vm.SourceTextModule(source, { context });
    await mod.link(spec => new vm.SyntheticModule(Object.keys(deps[spec]), function () {
        for (const [key, value] of Object.entries(deps[spec])) this.setExport(key, value);
    }, { context }));
    await mod.evaluate();
    return { content: mod.namespace.cinemaArticleContent, indexContent: mod.namespace.cinemaIndexContent, render: mod.namespace.renderCinemaArticle, handler };
}
test('native cinema keeps the full updated guide and original record intact', async () => {
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
    assert.equal(elements['#srNativeGuideTitle'].text, 'Fixture Cinema');
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

test('cinemas index renders its original landing heading and introduction without a detail lookup', async () => {
    const elements = { '#srNativeGuideTitle': {text:'Heading 1'}, '#srNativeGuideArticle': {html:'Template paragraph'} };
    const m = await moduleFor();
    const index = { view:'index', route:{kind:'cinema',path:'/cinemas'}, metadata:{sourceTitle:'Original category heading',introduction:'Original introduction & visitor choices.'} };
    const before = JSON.stringify(index);
    assert.equal(await m.render({select:id=>elements[id],path:'/cinemas',routerData:index,load:async()=>{throw Error('Index must not call detail-only API');}}),true);
    assert.equal(elements['#srNativeGuideTitle'].text,index.metadata.sourceTitle);
    assert.equal(elements['#srNativeGuideArticle'].html,'<p>Original introduction &amp; visitor choices.</p>');
    assert.equal(JSON.stringify(index),before);
});
test('cinemas index rejects wrong kind, path, view, error and missing introduction', async () => {
    const {indexContent} = await moduleFor();
    for(const change of [d=>d.route.kind='unrelated',d=>d.route.path+='-other',d=>d.view='detail',d=>d.status=503,d=>delete d.metadata.introduction]){
        const d={view:'index',route:{kind:'cinema',path:'/cinemas'},metadata:{sourceTitle:'Original category',introduction:'Original introduction.'}};
        change(d);assert.equal(indexContent(d,'/cinemas'),null);
    }
});
