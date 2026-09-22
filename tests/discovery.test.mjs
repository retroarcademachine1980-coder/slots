import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const load = async name => import('data:text/javascript;base64,' + Buffer.from(await readFile(new URL('../src/public/' + name + '.js', import.meta.url))).toString('base64'));
const core = await load('discovery-core');
const controls = await load('discovery-controller');
const prefs = await load('member-preferences');
const venue = (id, title, extra = {}) => ({ _id: id, title, slug: id, directoryReady: true, cardReady: true, pageReady: true, heroImage: 'https://static.wixstatic.com/media/example.jpg', 'link-arcade-venues-title': '/arcade-venues/' + id, ...extra });
const location = (id, title, extra = {}) => ({ ...venue(id, title), imageVerified: true, contentVerified: true, 'link-arcade-locations-title': '/arcade-locations/' + id, ...extra });
const offer = (id, extra = {}) => ({ _id: id, name: id, image: 'https://example.com/photo.jpg', cardReady: true, active: true, affiliate: true, revenueReady: true, affiliateUrl: 'https://example.com/book', ...extra });

test('538 suppressed records remain absent even with complete images and routes', () => {
    const hidden = Array.from({ length: 538 }, (_, i) => venue('held-' + i, 'Hidden ' + i, { directoryReady: false }));
    const entries = core.makeCatalogue([...hidden, venue('ready', 'Ready')], [], []);
    assert.equal(entries.length, 1);
    assert.equal(core.searchCatalogue(entries, 'Hidden').total, 0);
    assert.equal(core.recommend(entries).length, 1);
});
test('each venue readiness flag is mandatory; flags expressed as strings are rejected', () => {
    for (const key of ['directoryReady', 'cardReady', 'pageReady']) for (const v of [false, undefined, 'true']) assert.equal(core.isPublic(venue('a', 'A', { [key]: v }), 'venue'), false);
});
test('wrong canonical paths and unsafe URLs are rejected', () => {
    for (const route of ['//evil.example/a', '/arcade-venues/another', 'javascript:alert(1)', 'https://evil.example/arcade-venues/a']) assert.equal(core.isPublic(venue('a', 'A', { 'link-arcade-venues-title': route }), 'venue'), false);
    assert.equal(core.httpsUrl('https://user:pass@example.com'), '');
});
test('duplicates, bookmaker records and quarantined destinations stay excluded', () => {
    assert.equal(core.isPublic(venue('a', 'A', { duplicateOf: 'b' }), 'venue'), false);
    assert.equal(core.isPublic(venue('a', 'A', { venueType: 'Bookmaker' }), 'venue'), false);
    assert.equal(core.isPublic(location('b', 'B', { imageVerified: false }), 'location'), false);
    assert.equal(core.isPublic(venue('a', 'A', { directoryReady: false, researchStatus: 'Written, awaiting completion — temporarily removed from public discovery' }), 'venue'), false);
});
test('exact destination wins over venue aliases; ambiguous names never redirect', () => {
    const entries = core.makeCatalogue([venue('coral', 'Coral Island', { searchTerms: ['Blackpool'] }), venue('fun-one', 'Funland'), venue('fun-two', 'Funland')], [location('blackpool', 'Blackpool')], []);
    assert.equal(core.searchCatalogue(entries, 'Blackpool').exact.route, '/arcade-locations/blackpool');
    assert.equal(core.searchCatalogue(entries, 'Funland').exact, null);
});
test('British aliases and transposed town names return relevant suggestions', () => {
    const entries = core.makeCatalogue([venue('mint', 'The Mint', { locationName: 'Cleethorpes', searchTerms: ['Cleethorpes arcades'] })], [location('blackpool', 'Blackpool')], []);
    assert.equal(core.searchCatalogue(entries, 'Blakcpool').suggestions[0].title, 'Blackpool');
    assert.equal(core.searchCatalogue(entries, 'find the amusement arcade in Cleethorpes').results[0].title, 'The Mint');
});
test('expired, malformed and inactive offers are excluded; date-only expiry lasts that day', () => {
    const now = Date.parse('2026-09-22T12:00:00Z');
    assert.equal(core.isOfferPublic(offer('a', { validUntil: '2026-09-21' }), now), false);
    assert.equal(core.isOfferPublic(offer('a', { validUntil: '2026-09-22' }), now), true);
    assert.equal(core.isOfferPublic(offer('a', { validUntil: 'bad date' }), now), false);
    assert.equal(core.isOfferPublic(offer('a', { active: false }), now), false);
    assert.equal(core.isOfferPublic(offer('a', { revenueReady: false }), now), false);
});
test('public cards omit affiliate URLs and research notes', () => {
    const card = core.toCard(offer('a', { researchStatus: 'private notes' }), 'offer');
    assert.equal(card.affiliateUrl, undefined);
    assert.equal(card.researchStatus, undefined);
    assert.equal(card.memberOffer, true);
});
test('recommendations keep exact request then saves then local revenue; seen cards are deprioritised', () => {
    const entries = core.makeCatalogue([venue('exact', 'Z exact', { locationName: 'Blackpool' }), venue('saved', 'Saved'), venue('new', 'New', { locationName: 'Blackpool' }), venue('seen', 'A seen', { locationName: 'Blackpool' })], [], [offer('hotel', { locationName: 'Blackpool' })]);
    assert.deepEqual(core.recommend(entries, { exactId: 'venue-exact', savedIds: ['saved'], seenIds: ['seen'] }).map(c => c.id), ['exact', 'saved', 'hotel', 'new', 'seen']);
});
test('geolocation requires valid coordinates and a nearby canonical destination', () => {
    const entries = core.makeCatalogue([], [location('blackpool', 'Blackpool', { latitude: 53.817, longitude: -3.035 }), location('missing', 'Missing')], []);
    assert.equal(core.nearestLocation(entries, { lat: 53.82, lng: -3.03 }).card.id, 'blackpool');
    assert.equal(core.nearestLocation(entries, { lat: 100, lng: 0 }), null);
    assert.equal(core.nearestLocation(entries, { lat: 0, lng: 0 }), null);
});
test('stale search responses cannot overwrite a newer query', async () => {
    const pending = {}, rendered = [];
    const controller = controls.createSearchController({ search: q => new Promise(resolve => { pending[q] = resolve; }), render: r => rendered.push(r.query), setStatus() {}, navigate() {} });
    const first = controller.run('old'), second = controller.run('new');
    pending.new({ query: 'new', total: 1 }); await second;
    pending.old({ query: 'old', total: 1 }); await first;
    assert.deepEqual(rendered, ['new']);
});
test('login completes without opening affiliate offer; a second click is required', async () => {
    let member = false, resolved = 0; const navigations = [];
    const open = controls.createOfferController({ isMember: async () => member, login: async () => { member = true; }, resolve: async () => { resolved++; return { url: 'https://example.com/book' }; }, navigate: u => navigations.push(u), setStatus() {} });
    await open({ memberOffer: true });
    assert.equal(resolved, 0); assert.equal(navigations.length, 0);
    await open({ memberOffer: true });
    assert.equal(navigations.length, 1);
});
test('cancelled login never resolves or opens an offer', async () => {
    let called = false;
    const open = controls.createOfferController({ isMember: async () => false, login: async () => { throw new Error('cancelled'); }, resolve: async () => { called = true; }, navigate: () => { called = true; }, setStatus() {} });
    await open({ memberOffer: true }); assert.equal(called, false);
});
test('preference changes cannot inject identities, consent timestamps or readiness flags', () => {
    const patch = prefs.preferencePatch({ _id: 'another-user', _owner: 'another-user', directoryReady: true, homeLocation: 'Blackpool', emailConsentAt: 'fake' });
    assert.equal(patch._id, undefined); assert.equal(patch._owner, undefined); assert.equal(patch.directoryReady, undefined); assert.equal(patch.emailOffersOptIn, undefined); assert.equal(patch.emailConsentAt, undefined);
});
test('consent is opt-in only with server timestamp, and malformed inputs fail', () => {
    const now = new Date('2026-09-22T12:00:00Z');
    assert.equal(prefs.preferencePatch({ emailOffersOptIn: true }, now).emailConsentAt, now);
    assert.throws(() => prefs.preferencePatch({ emailOffersOptIn: 'true' }));
    assert.throws(() => prefs.preferencePatch({ preferredRadiusMiles: Infinity }));
});


test('restored current flags are not overridden by historical research notes', () => {
    assert.equal(core.isPublic(venue('restored', 'Restored', { researchStatus: 'Restored today. History: temporarily removed from public discovery' }), 'venue'), true);
});
test('Bognor returns destination and local matches across location fields', () => {
    const entries = core.makeCatalogue([
        venue('neptune', "Neptune's", { town: 'Bognor Regis' }),
        venue('mrp', "Mr P’s", { locationSlug: 'bognor-regis' }),
        venue('other', 'Elsewhere', { town: 'York' })
    ], [location('bognor-regis', 'Bognor Regis')], [offer('hotel', { destination: 'Bognor Regis' })]);
    assert.deepEqual(new Set(core.searchCatalogue(entries, 'Bognor').results.map(c => c.id)), new Set(['neptune', 'mrp', 'bognor-regis', 'hotel']));
});
test('Mr P brand queries return all branches despite punctuation and spacing', () => {
    const entries = core.makeCatalogue(['Bognor Regis', 'Chatham', 'Fareham', 'Portsmouth'].map((town, i) => venue('mrp-' + i, "Mr. P’s Classic Amusements - " + town)), [], []);
    for (const query of ["Mr P's", 'Mr. P’s', 'Mr Ps', 'MrPs', 'Mister Ps']) assert.equal(core.searchCatalogue(entries, query).total, 4, query);
});
test('submitting an exact town keeps all results visible instead of redirecting', async () => {
    let navigated = false, rendered;
    const controller = controls.createSearchController({ search: async () => ({ total: 4, exact: {route: '/arcade-locations/bognor-regis'} }), render: r => { rendered = r; }, setStatus() {}, navigate() { navigated = true; } });
    await controller.run('Bognor Regis', true);
    assert.equal(rendered.total, 4);
    assert.equal(navigated, false);
});
