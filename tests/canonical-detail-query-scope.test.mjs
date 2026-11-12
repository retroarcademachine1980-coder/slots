import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { loadBackend } from '../tools/test-support/wix-backend-harness.mjs';

const manifest = JSON.parse(await fs.readFile(new URL('../config/routes/manifest.json', import.meta.url)));
const foodPath = '/food-and-drink/masala-malt-grimsby';
const plain = value => JSON.parse(JSON.stringify(value));

test('one restaurant detail loads only its approved primary group while retaining the entire identity registry', async () => {
    const capture = {};
    const service = await loadBackend('backend/canonicalRouteService', {}, capture, manifest);
    const scoped = await service.loadRouteContext({ path: foodPath });
    const full = await service.loadRouteContext();
    const targetKeys = new Set(manifest.entries.filter(entry => entry.path === foodPath).map(entry => entry.key));
    assert.ok(targetKeys.size > 0);
    const expected = manifest.sourceGroups.filter(group => group.approved && group.renderPolicy?.contentVerified && group.sourceKeys.some(key => targetKeys.has(key)));
    assert.ok(expected.length > 0);
    const scopedCapture = {};
    const scopedService = await loadBackend('backend/canonicalRouteService', {}, scopedCapture, manifest);
    await scopedService.loadRouteContext({ path: foodPath });
    assert.deepEqual(scopedCapture.queries, [...new Set(expected.map(group => group.primaryKey.split(':')[0]))]);
    const requestedKeys = scopedCapture.querySelections.flatMap(selection => selection.values.map(id => selection.collection + ':' + id)).sort();
    assert.deepEqual(requestedKeys, [...new Set(expected.map(group => group.primaryKey))].sort());
    assert.deepEqual(plain(scoped.owners), plain(full.owners));
    assert.deepEqual(plain(scoped.bindings), plain(full.bindings));
    assert.deepEqual(plain(scoped.groupsBySource), plain(full.groupsBySource));
    assert.deepEqual(plain(scoped.recordPolicies), plain(full.recordPolicies));
    assert.deepEqual(plain(scoped.issues), plain(full.issues));
});

test('scoping preserves current primary records and blocks ambiguous owners rather than selecting a different venue', async () => {
    const food = manifest.sourceGroups.find(group => group.canonicalPath === foodPath);
    assert.ok(food);
    const split = food.primaryKey.indexOf(':');
    const collection = food.primaryKey.slice(0, split), id = food.primaryKey.slice(split + 1);
    const row = { _id: id, title: 'Protected fixture review', sourceFacts: '<p>Complete original review</p>', rating: 4.9, images: ['own-photo.jpg'], directoryReady: false };
    const data = { [collection]: [row] };
    const service = await loadBackend('backend/canonicalRouteService', data, {}, manifest);
    const context = await service.loadRouteContext({ path: foodPath });
    assert.deepEqual(plain(context.groupRecords[food.primaryKey]), row);
    const duplicateManifest = plain(manifest);
    duplicateManifest.entries.push({ key: 'FoodAndDrink:second-owner', path: foodPath, evidence: 'collision fixture' });
    const api = await loadBackend('backend/canonicalRoutesApi', data, {}, duplicateManifest);
    const result = await api.resolveRoutePath(foodPath);
    assert.equal(result.status, 409);
    assert.equal(result.issue, 'canonical_collision');
    assert.deepEqual(data[collection][0], row);
});

test('a missing required primary record stays missing and cannot be replaced with an unrelated group record', async () => {
    const food = manifest.sourceGroups.find(group => group.canonicalPath === foodPath);
    const service = await loadBackend('backend/canonicalRouteService', { Venues: [{ _id: 'unrelated', title: 'Wrong venue' }] }, {}, manifest);
    const context = await service.loadRouteContext({ path: foodPath });
    assert.equal(context.groupRecords[food.primaryKey], undefined);
    assert.deepEqual(plain(context.groupRecords), {});
    assert.deepEqual(plain(context.groupsBySource[food.primaryKey]), food);
});

test('a detail without a joined source group does not query unrelated group collections', async () => {
    const grouped = new Set(manifest.sourceGroups.flatMap(group => group.sourceKeys));
    const entry = manifest.entries.find(candidate => !grouped.has(candidate.key));
    assert.ok(entry);
    const capture = {};
    const service = await loadBackend('backend/canonicalRouteService', {}, capture, manifest);
    const context = await service.loadRouteContext({ path: entry.path });
    assert.deepEqual(capture.queries || [], []);
    assert.ok(context.owners[entry.path].includes(entry.key));
});

test('invalid canonical paths are rejected before any database lookup', async () => {
    const capture = {};
    const service = await loadBackend('backend/canonicalRoutesApi', {}, capture, manifest);
    const result = await service.resolveRoutePath('/food-and-drink/invalid?wrong=1');
    assert.equal(result.status, 404);
    assert.deepEqual(capture.queries || [], []);
    assert.deepEqual(capture.gets || [], []);
});

test('unscoped listing and offer contexts retain their existing complete group reads', async () => {
    const capture = {};
    const service = await loadBackend('backend/canonicalRouteService', {}, capture, manifest);
    await service.loadRouteContext({ offers: true });
    const approved = manifest.sourceGroups.filter(group => group.approved && (group.relation === 'same-entity' || group.relation === 'editorial-index' && group.editorialScopeApproved) && group.renderPolicy?.contentVerified);
    const expected = ['HotelGuides', ...new Set(approved.map(group => group.primaryKey.split(':')[0]))];
    assert.deepEqual(capture.queries, expected);
});

test('the native router also avoids unrelated group reads for a detail, while malformed requests do no reads', async () => {
    const grouped = new Set(manifest.sourceGroups.flatMap(group => group.sourceKeys));
    const entry = manifest.entries.find(candidate => candidate.path.startsWith('/cinemas/') && !grouped.has(candidate.key));
    assert.ok(entry);
    const capture = {};
    const [collection, id] = entry.key.split(':');
    const segments = entry.path.split('/');
    const row = { _id: id, title: 'Fixture cinema', slug: segments[2], locationSlug: segments[3], fullDescription: '<p>Original cinema guide.</p>' };
    const service = await loadBackend('backend/nativeRoutingService', { [collection]: [row] }, capture, manifest);
    const response = await service.canonicalRouter('cinema', { path: entry.path.split('/').slice(2) });
    assert.equal(response.status, 200);
    assert.deepEqual(capture.queries || [], []);
    const malformedCapture = {};
    const malformedService = await loadBackend('backend/nativeRoutingService', {}, malformedCapture, manifest);
    assert.equal((await malformedService.canonicalRouter('cinema', { path: ['invalid%2Fpath'] })).status, 404);
    assert.deepEqual(malformedCapture.queries || [], []);
    assert.deepEqual(malformedCapture.gets || [], []);
});
