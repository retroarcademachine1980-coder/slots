import test from 'node:test';
import assert from 'node:assert/strict';
import { createDynamicDetailHook } from '../src/public/routes/dynamicPageAdapter.js';
import { createNativeRouter } from '../src/public/routes/nativeRouterAdapter.js';
import { createRouteContext } from '../src/public/routes/canonicalRoutes.js';

// Wix ok() documents descriptions as a metaTags entry in its HeadOptions.
// These are isolated fixture records, not visitor claims or published venues.
const path = '/food-and-drink/harbour-cafe-york';
const endpoint = { native: true, renderer: true, pageName: 'food-item', revision: 'fixture', evidence: 'unit fixture only' };
const base = { _id: 'cafe', title: 'Harbour Cafe', urlName: 'harbour-cafe', townSlug: 'york', seoTitle: 'Harbour Cafe, York', seoDescription: 'Read the cafe guide before choosing your food stop.', active: true };
const ok = (page, data, head) => ({ status: 200, page, data, head });

for (const field of ['seoDescription', 'shortDescription', 'summary']) test('food afterRouter sends the '+field+' fallback through documented standard metadata', async () => {
  const row = { ...base, seoDescription: undefined, [field]: base.seoDescription };
  const original = structuredClone(row), route = { path, canonicalUrl: 'https://www.spin-raiders.com'+path, indexable: true };
  const hook = createDynamicDetailHook({ kind: 'food', prefix: '/food-and-drink', pageName: 'food-item', resolve: async () => ({ status: 200, collection: 'FoodAndDrink', row, route }), ok, notFound: () => 404, sendStatus: s => s });
  const response = await hook({ path: ['harbour-cafe-york'], pages: ['food-item'] }, { status: 200, page: 'food-item' });
  assert.deepEqual(response.head.metaTags?.filter(t => t.name === 'description'), [{ name: 'description', content: base.seoDescription }]);
  assert.equal(response.head.title, base.seoTitle);assert.deepEqual(response.head.links, [{ rel: 'canonical', href: route.canonicalUrl }]);
  assert.equal(response.data.record, row);assert.deepEqual(row, original);assert.equal(response.head.noIndex, false);
});

test('native food detail carries its selected description without changing source identity or index policy', async () => {
  const row = { ...base, directoryReady: false };
  const context = createRouteContext({ entries: [{ key: 'FoodAndDrink:cafe', path, evidence: 'fixture' }], endpoints: { food: endpoint } });
  const router = createNativeRouter({ context, manifest: {}, readById: async () => row, ok, notFound: () => 404, sendStatus: s => s });
  const response = await router.canonical(path);
  assert.equal(response.status, 200);
  assert.deepEqual(response.head.metaTags?.filter(t => t.name === 'description'), [{ name: 'description', content: base.seoDescription }]);
  assert.equal(response.head.title, base.seoTitle);assert.equal(response.head.noIndex, true);assert.equal(response.data.record._id, row._id);assert.equal(response.data.record.seoDescription, row.seoDescription);
});

test('an unavailable description is omitted rather than fabricated or sent as a blank meta tag', async () => {
  const row = { ...base, seoDescription: undefined },route = { path, canonicalUrl: 'https://www.spin-raiders.com'+path, indexable: false };
  const hook = createDynamicDetailHook({ kind: 'food', prefix: '/food-and-drink', pageName: 'food-item', resolve: async () => ({ status: 200, collection: 'FoodAndDrink', row, route }), ok, notFound: () => 404, sendStatus: s => s });
  const response = await hook({ path: ['harbour-cafe-york'], pages: ['food-item'] }, { status: 200, page: 'food-item' });
  assert.deepEqual(response.head.metaTags, []);assert.equal(response.head.noIndex, true);
});
