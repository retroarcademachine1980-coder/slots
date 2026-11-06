import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

async function load({ rejectMetadata = false } = {}) {
  const warnings = [], titles = [], error = new Error('Fixture metadata service unavailable');
  const path = '/food-and-drink/fixture-cafe-york';
  const row = { title: 'Fixture Cafe', seoTitle: 'Fixture Cafe, York | Spin Raiders', seoDescription: 'Fixture cafe visitor information.' };
  const route = { kind: 'food', path, canonicalUrl: 'https://www.spin-raiders.com' + path };
  const seo = { links: [], metaTags: [],
    setTitle: async title => { titles.push(title); if (rejectMetadata) throw error; },
    setLinks: async () => {}, setMetaTags: async () => {}, setStructuredData: async () => {} };
  const context = vm.createContext({ console: { warn: (...args) => warnings.push(args) }, URL, Set, Map, Promise });
  const dependencies = {
    'public/routes/indexRoutes': { INDEX_ROUTES: {} },
    'backend/canonicalPages.web': { getCanonicalPage: async () => ({ status: 200, row, route }) },
    'public/routes/canonicalRoutes': { ROUTES: {}, parseCanonical: value => ({ ok: value === path, kind: 'food' }) },
    'wix-data': { default: {} }, 'wix-seo-frontend': { default: seo }
  };
  const source = await fs.readFile(new URL('../src/public/seo.js', import.meta.url), 'utf8');
  const mod = new vm.SourceTextModule(source, { context });
  await mod.link(spec => {
    const values = dependencies[spec]; assert(values, spec);
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await mod.evaluate();
  return { apply: mod.namespace.applyPageSeo, warnings, titles, error, row, route };
}

for (const direct of [true, false]) {
  test(`asynchronous metadata failure is contained for ${direct ? 'router-provided' : 'looked-up'} detail data`, async () => {
    const m = await load({ rejectMetadata: true });
    const input = direct ? { view: 'detail', record: m.row, route: m.route } : undefined;
    const before = JSON.stringify(input);
    await assert.doesNotReject(() => m.apply(['food-and-drink', 'fixture-cafe-york'], input));
    assert.equal(m.warnings.length, 1);
    assert.equal(m.warnings[0][0], 'Spin Raiders SEO unavailable');
    assert.equal(m.warnings[0][1], m.error);
    assert.equal(JSON.stringify(input), before);
  });
}

test('successful detail metadata remains awaited and retains its exact title', async () => {
  const m = await load();
  await m.apply(['food-and-drink', 'fixture-cafe-york']);
  assert.deepEqual(m.titles, [m.row.seoTitle]);
  assert.equal(m.warnings.length, 0);
});
