import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

async function page(routerData, path, load) {
    let ready;
    const element = { text: 'Sea Life Centres & Aquariums' };
    const select = id => { assert.equal(id, '#srNativeGuideTitle'); return element; };
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
    return { ready, element, content: mod.namespace.seaLifeTitleContent };
}
function detail() {
    return { status: 200, view: 'detail', collection: 'Venues', row: { _id: 'aquarium1', title: 'Fixture Aquarium' }, route: { kind: 'seaLife', path: '/sea-life/fixture/town', key: 'Venues:aquarium1' } };
}
test('aquarium detail heading uses its own canonical record instead of the category placeholder', async () => {
    const p = await page(detail(), '/sea-life/fixture/town', async () => { throw Error('Unexpected fallback'); });
    assert.equal(await p.ready(), true);
    assert.equal(p.element.text, 'Fixture Aquarium');
});
test('aquarium index heading comes from the exact index metadata', async () => {
    const data = { status: 200, view: 'index', route: { kind: 'seaLife', path: '/sea-life' }, metadata: { sourceTitle: 'Explore UK aquariums' } };
    const p = await page(data, '/sea-life', async () => { throw Error('Unexpected fallback'); });
    assert.equal(await p.ready(), true);
    assert.equal(p.element.text, 'Explore UK aquariums');
});
test('wrong aquarium identity, route, kind and failed responses cannot supply a native heading', async () => {
    const p = await page(null, '/sea-life/fixture/town', async () => null);
    for (const change of [d => { d.route.key = 'Venues:other'; }, d => { d.route.path += '-other'; }, d => { d.route.kind = 'zoo'; }, d => { d.status = 404; }, d => { d.collection = 'FoodAndDrink'; }]) {
        const data = detail(); change(data);
        assert.equal(p.content(data, '/sea-life/fixture/town'), null);
    }
    assert.equal(await p.ready(), false);
    assert.equal(p.element.text, 'Sea Life Centres & Aquariums');
});
