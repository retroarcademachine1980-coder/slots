import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

async function page(routerData, path, load) {
    let ready;
    const element = { text: 'Sea Life Centres & Aquariums' };
    const body = { html: '<p>Preserved introduction</p>' };
    const select = id => {
        assert(['#srNativeGuideTitle', '#srNativeGuideBody'].includes(id));
        return id === '#srNativeGuideTitle' ? element : body;
    };
    select.onReady = callback => { ready = callback; };
    const context = vm.createContext({ $w: select });
    const deps = {
        'wix-location-frontend': { default: { prefix: 'sea-life', path: path.split('/').slice(2) } },
        'wix-window-frontend': { getRouterData: () => routerData },
        'backend/canonicalPages.web': { getCanonicalPage: load }
    };
    const source = await fs.readFile(new URL('../src/pages/sea-life-page.ornf4.js', import.meta.url), 'utf8');
    const mod = new vm.SourceTextModule(source, { context });
    await mod.link(spec => new vm.SyntheticModule(Object.keys(deps[spec]), function () {
        for (const [key, value] of Object.entries(deps[spec])) this.setExport(key, value);
    }, { context }));
    await mod.evaluate();
    return { ready, element, body, content: mod.namespace.seaLifeTitleContent };
}
function detail() {
    return { status: 200, view: 'detail', collection: 'Venues', row: { _id: 'aquarium1', title: 'Fixture Aquarium', sourceFacts: '<h2>Inside the aquarium</h2><p>The complete source guide.</p>', fullDescription: 'Shorter listing copy' }, route: { kind: 'seaLife', path: '/sea-life/fixture/town', key: 'Venues:aquarium1' } };
}
test('aquarium detail heading uses its own canonical record instead of the category placeholder', async () => {
    const p = await page(detail(), '/sea-life/fixture/town', async () => { throw Error('Unexpected fallback'); });
    assert.equal(await p.ready(), true);
    assert.equal(p.element.text, 'Fixture Aquarium');
    assert.equal(p.body.html, detail().row.sourceFacts);
});
test('aquarium index heading comes from the exact index metadata', async () => {
    const data = { status: 200, view: 'index', route: { kind: 'seaLife', path: '/sea-life' }, metadata: { sourceTitle: 'Explore UK aquariums', introduction: 'Marine life & family days.\n\nChoose an aquarium.' } };
    const p = await page(data, '/sea-life', async () => { throw Error('Unexpected fallback'); });
    assert.equal(await p.ready(), true);
    assert.equal(p.element.text, 'Explore UK aquariums');
    assert.equal(p.body.html, '<p>Marine life &amp; family days.</p>\n<p>Choose an aquarium.</p>');
});
test('wrong aquarium identity, route, kind and failed responses cannot supply a native heading', async () => {
    const p = await page(null, '/sea-life/fixture/town', async () => null);
    for (const change of [d => { d.route.key = 'Venues:other'; }, d => { d.route.path += '-other'; }, d => { d.route.kind = 'zoo'; }, d => { d.status = 404; }, d => { d.collection = 'FoodAndDrink'; }]) {
        const data = detail(); change(data);
        assert.equal(p.content(data, '/sea-life/fixture/town'), null);
    }
    assert.equal(await p.ready(), false);
    assert.equal(p.element.text, 'Sea Life Centres & Aquariums');
    assert.equal(p.body.html, '<p>Preserved introduction</p>');
});

test('native aquarium lifecycle awaits the complete canonical article before assigning controls', async () => {
    let complete;
    const pending = new Promise(resolve => { complete = resolve; });
    const p = await page(null, '/sea-life/fixture/town', () => pending);
    const rendering = p.ready();
    assert.equal(typeof rendering.then, 'function');
    assert.equal(p.body.html, '<p>Preserved introduction</p>');
    complete(detail());
    assert.equal(await rendering, true);
    assert.equal(p.body.html, detail().row.sourceFacts);
});

test('an aquarium without its own article does not borrow another record or clear the existing introduction', async () => {
    const data = detail(); delete data.row.sourceFacts; delete data.row.fullDescription;
    data.sourceRecords = [{ collection: 'NearbyAttractions', row: { _id: 'other', fullDescription: 'Another place' } }];
    const p = await page(data, '/sea-life/fixture/town', async () => data);
    assert.equal(await p.ready(), false);
    assert.equal(p.element.text, 'Sea Life Centres & Aquariums');
    assert.equal(p.body.html, '<p>Preserved introduction</p>');
});

test('native aquarium article accepts the exact NearbyAttractions identity and preserves plain-text paragraphs', async () => {
    const data = detail(); data.collection = 'NearbyAttractions'; data.route.key = 'NearbyAttractions:aquarium1';
    data.record = { _id: 'aquarium1', displayTitle: 'Another Aquarium', fullDescription: 'Sharks & rays.\n\nA <special> visit.' }; delete data.row;
    const p = await page(data, '/sea-life/fixture/town', async () => null);
    assert.equal(await p.ready(), true);
    assert.equal(p.element.text, 'Another Aquarium');
    assert.equal(p.body.html, '<p>Sharks &amp; rays.</p>\n<p>A &lt;special&gt; visit.</p>');
});

test('index metadata from another route or without an introduction cannot replace native guide content', async () => {
    for (const path of ['/sea-life', '/sea-life/fixture/town']) {
        const data = { status: 200, view: 'index', route: { kind: 'seaLife', path: '/sea-life' }, metadata: { sourceTitle: 'Category only' } };
        const p = await page(data, path, async () => null);
        assert.equal(await p.ready(), false);
        assert.equal(p.body.html, '<p>Preserved introduction</p>');
    }
});
