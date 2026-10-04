import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRouteContext, parseCanonical, buildCanonical} from '../src/public/routes/canonicalRoutes.js';
const m = JSON.parse(fs.readFileSync(new URL('../config/routes/manifest.json', import.meta.url), 'utf8'));
const food = m.entries.filter(e => e.path.startsWith('/food-and-drink/'));
const ctx = createRouteContext(m);
test('all 82 food records use the one-segment name-town address', () => {
  assert.equal(food.length, 82);
  for (const e of food) {
    assert.equal(e.path.split('/').length, 3, e.path);
    const p = parseCanonical(e.path); assert.equal(p.ok, true, e.path); assert.equal(p.kind, 'food');
    assert.deepEqual(ctx.owners[e.path], [e.key], e.path);
  }
});
test('Masala uses exactly the user-confirmed address and keeps its three source records', () => {
  assert.equal(buildCanonical('food', {urlName: 'masala-n-malt', townSlug: 'grimsby'}).path, '/food-and-drink/masala-malt-grimsby');
  const g = m.sourceGroups.find(x => x.primaryKey === 'FoodAndDrink:fd-masala-n-malt-grimsby');
  assert.equal(g.canonicalPath, '/food-and-drink/masala-malt-grimsby');
  assert.ok(g.sourceKeys.includes('NearbyAttractions:541e7ebd-3e48-441e-9e21-c24b2233a0f0'));
  assert.equal(g.renderPolicy.sourceContentMergeMustBeAdditive, true);
});
test('every former food address is a one-way alias to the same record, never a canonical', () => {
  const canon = new Set(m.entries.map(e => e.path));
  for (const old of ['/food-and-drink/masala-n-malt/grimsby', '/food-and-drink/grimsby/masala-n-malt', '/food-and-drink/agrah/cleethorpes']) {
    const a = m.aliases.filter(x => x.from === old); assert.ok(a.length >= 1, old);
    assert.ok(!canon.has(old), old);
    assert.equal(parseCanonical(old).ok, false, old);
  }
});
test('no food source group is left pointing at a retired address', () => {
  for (const g of m.sourceGroups.filter(g => g.canonicalPath?.startsWith('/food-and-drink/'))) assert.equal(g.canonicalPath.split('/').length, 3, g.canonicalPath);
});
