/* Generated from src/public/routes; do not hand-edit or append a second authority. */
(function(){'use strict';
/**
 * Sole canonical URL policy. Pure ESM: no Wix, DOM, network, storage or globals.
 * This local module is NOT mounted in production. Never append it after old
 * routers: replace URL producers with imports and retire the old writers first.
 */
const SITE_ORIGIN = 'https://www.spin-raiders.com';
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const place = (prefix) => ({ prefix, fields: ['slug', 'locationSlug'], collections: ['Venues', 'NearbyAttractions', 'AffiliateOffers'], proposed: true });
const ROUTES = freeze({
  arcade: { prefix: '/arcade', fields: ['slug', 'locationSlug'], collection: 'Venues', collections: ['Venues', 'NearbyAttractions', 'AffiliateOffers'] },
  hotel: { prefix: '/hotel', fields: ['slug', 'locationSlug'], collection: 'HotelGuides' },
  machine: { prefix: '/classic-fruit-machines', fields: ['manufacturerSlug', 'machineSlug'], collection: 'ClassicFruitMachines' },
  agc: place('/agc'),
  cinema: place('/cinemas'),
  bowling: place('/bowling'),
  bowlingOperator: { prefix:'/bowling', fields:['slug'], collections:['NearbyAttractions','Venues','AffiliateOffers'], routeType:'operator' },
  bingo: place('/bingo-halls'),
  casino: place('/casinos'),
  holidayPark: place('/holiday-parks'),
  arcadeBar: place('/arcade-bars'),
  fishing: place('/fishing-lakes'),
  themePark: place('/theme-parks'),
  zoo: place('/zoos'),
  seaLife: place('/sea-life'),
  museum: place('/museums'),
  historicSite: place('/historical-sites'),
  pier: place('/piers'),
  beach: place('/beaches'),
  tour: place('/tours'),
  outdoors: place('/outdoors'),
  service: place('/services'),
  attraction: place('/attractions'),
  destination: { prefix: '/destination', fields: ['nativeTitleSlug'], collection: 'Locations' },
  food: { prefix: '/food-and-drink', fields: ['urlName', 'townSlug'], joined: true, collection: 'FoodAndDrink', collections: ['FoodAndDrink', 'Venues', 'NearbyAttractions', 'AffiliateOffers'] },
  machineIndex: { prefix: '/classic-fruit-machines', fields: [], collection: null }
});
// Exact user-confirmed entity address (4 October 2026). All other food records use name-town.
const CONFIRMED_CANONICALS = freeze([freeze({
  kind: 'food',
  params: freeze({ urlName: 'masala-n-malt', townSlug: 'grimsby' }),
  path: '/food-and-drink/masala-malt-grimsby'
})]);
const REQUIRED_ROUTE_FIELDS = freeze({
  Venues: ['_id', 'slug', 'locationSlug', 'venueType', 'familyFEC', 'familyEntertainmentCentre', 'amusementArcade', 'adultGamingCentre'],
  NearbyAttractions: ['_id', 'slug', 'locationSlug', 'category'],
  HotelGuides: ['_id', 'slug', 'locationSlug', 'offerIds'],
  ClassicFruitMachines: ['_id', 'manufacturerSlug', 'machineSlug', 'canonicalMachineId'],
  Locations: ['_id', 'link-arcade-locations-title', 'link-destination-title'],
  FoodAndDrink: ['_id', 'townSlug', 'urlName'],
  HotelOffers: ['_id', 'hotelGuideId', 'validUntil', 'offerValidUntil'],
  AffiliateOffers: ['_id', 'hotelGuideId', 'validUntil', 'offerValidUntil']
});
const FORBIDDEN = /^\/(?:classic-fruit-machine-archive(?:-1)?|arcade-venues|arcade-locations|arcades-1|destination-recommendations|hotels)(?:\/|$)/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const OPAQUE_HEX = /(?:^[0-9a-f]{8,}$|-[0-9a-f]{8}$|-[0-9a-f]{12,}$)/;
const PLACEHOLDER = /^(?:undefined|null|unknown|not-known|tbc|tbd|n-a|none)$/;
const CANONICAL_SEGMENT_RULES = freeze({slug:SLUG.source,uuid:UUID.source,opaqueHex:OPAQUE_HEX.source,placeholder:PLACEHOLDER.source,maxLength:180});
function blocked(code, detail = {}, canonicalPath) {
  // Blocked outcomes deliberately do not contain href, route, url or an empty string fallback.
  return freeze({ ok: false, recordRole: 'unknown', code, ...detail, ...(canonicalPath ? { canonicalPath } : {}) });
}
function recordKey(collection, row) {
  return collection && row && typeof row._id === 'string' && row._id ? `${collection}:${row._id}` : null;
}
function isSemanticSlug(value) {
  return typeof value === 'string' && value.length <= 180 && SLUG.test(value) && !UUID.test(value) && !OPAQUE_HEX.test(value) && !PLACEHOLDER.test(value);
}
function isLegacyPath(path) { return typeof path === 'string' && FORBIDDEN.test(path); }
function buildCanonical(kind, fields = {}) {
  const spec = Object.hasOwn(ROUTES, kind) ? ROUTES[kind] : null;
  if (!spec) return blocked('unregistered_route_kind', { kind });
  if (spec.joined && fields.joinedSlug !== undefined) {
    // Reviewed inventory address. When the source row also carries its own name/town
    // fields they must still produce this exact address; otherwise the metadata changed.
    if (!isSemanticSlug(fields.joinedSlug)) return blocked('invalid_or_missing_route_field', { kind, field: 'joinedSlug' });
    const path = spec.prefix + '/' + fields.joinedSlug;
    if (spec.fields.every(field => fields[field] !== undefined)) {
      const own = buildCanonical(kind, Object.fromEntries(spec.fields.map(field => [field, fields[field]])));
      if (!own.ok || own.path !== path) return blocked('route_source_metadata_changed', { kind, field: 'joinedSlug' });
    }
    return freeze({ ok: true, kind, path });
  }
  for (const field of spec.fields) {
    if (!isSemanticSlug(fields[field])) return blocked('invalid_or_missing_route_field', { kind, field });
  }
  const confirmed = CONFIRMED_CANONICALS.find(entry => entry.kind === kind && spec.fields.every(field => entry.params[field] === fields[field]));
  const path = confirmed ? confirmed.path : spec.prefix + (spec.fields.length ? '/' + spec.fields.map(field => fields[field]).join(spec.joined ? '-' : '/') : '');
  return freeze({ ok: true, kind, path });
}
function parseCanonical(input) {
  if (typeof input !== 'string' || !input || input.trim() !== input || /[\\\s?#%]/.test(input)) return blocked('invalid_canonical_url');
  // Only explicit same-origin HTTPS or a single-rooted path; never protocol-relative.
  let path = input;
  if (input.startsWith(SITE_ORIGIN + '/')) path = input.slice(SITE_ORIGIN.length);
  if (!path.startsWith('/') || path.startsWith('//') || isLegacyPath(path)) return blocked('noncanonical_path');
  const confirmed = CONFIRMED_CANONICALS.find(entry => entry.path === path);
  if (confirmed) return freeze({ ...buildCanonical(confirmed.kind, confirmed.params), params: confirmed.params });
  for (const [kind, spec] of Object.entries(ROUTES)) {
    if (spec.joined) {
      // One-segment name-town address. The split is not structurally unique, so the
      // record is resolved through the reviewed inventory binding, never by guessing.
      const rest = path.startsWith(spec.prefix + '/') ? path.slice(spec.prefix.length + 1) : '';
      if (rest && !rest.includes('/') && isSemanticSlug(rest) && rest.includes('-')) return freeze({ ok: true, kind, path, params: { joinedSlug: rest } });
      continue;
    }
    const segments = path.slice(spec.prefix.length + 1).split('/');
    if (!spec.fields.length && path === spec.prefix) return buildCanonical(kind);
    if (!spec.fields.length || !path.startsWith(spec.prefix + '/') || segments.length !== spec.fields.length) continue;
    const result = buildCanonical(kind, Object.fromEntries(spec.fields.map((field, i) => [field, segments[i]])));
    if (result.ok && result.path === path) return freeze({ ...result, params: Object.fromEntries(spec.fields.map((field, i) => [field, segments[i]])) });
  }
  return blocked('unregistered_canonical_path');
}
/** Immutable evidence/configuration. Not a CMS URL preference or feature flag.
 * Each entry is a reviewed record→canonical-path binding from the inventory.
 * Endpoint evidence needs the native route AND actual renderer deep-link checks.
 */
function createRouteContext({ entries = [], endpoints = {}, venueRouteKinds = {}, guides = [], sourceIssues = [], landings = {}, sourceGroups = [], groupRecords = {}, recordRoles = {}, recordPolicies = {}, now = Date.now() } = {}) {
  const owners = Object.create(null);
  const bindings = Object.create(null);
  const issues = [];
  const indexedFields = Object.create(null);
  const sourceRouteFields = Object.create(null);
  const groupsBySource = Object.create(null);
  for (const group of sourceGroups) {
    const groupPath = parseCanonical(group.canonicalPath);
    const identityGroup = group.relation === 'same-entity' && group.provenSameEntity === true;
    const editorialGroup = group.relation === 'editorial-index' && group.editorialScopeApproved === true && group.identityUnderReview === true;
    if (!groupPath.ok || !ROUTES[groupPath.kind]?.fields.length || (!identityGroup && !editorialGroup) || group.approved !== true || !Array.isArray(group.sourceKeys) || !group.sourceKeys.includes(group.primaryKey) || ((group.conflicts || []).length && !(editorialGroup && group.conflictsDisclosed === true))) {
      issues.push({ code: 'unverified_source_group', groupId: group.groupId }); continue;
    }
    for (const key of group.sourceKeys) {
      if (groupsBySource[key]) { issues.push({ code: 'overlapping_source_groups', key }); groupsBySource[key] = { blocked: true }; }
      else groupsBySource[key] = group;
    }
  }
  for (const entry of entries) {
    const parsed = parseCanonical(entry.path);
    if (!parsed.ok || typeof entry.key !== 'string' || !/^[A-Za-z][A-Za-z0-9]*:.+/.test(entry.key) || !entry.evidence) { issues.push({ code: 'invalid_inventory_entry', key: entry.key }); continue; }
    const sourceCollection = entry.key.slice(0, entry.key.indexOf(':')), spec = ROUTES[parsed.kind];
    if (spec.fields.length && spec.collection !== sourceCollection && !spec.collections?.includes(sourceCollection)) { issues.push({ code: 'inventory_collection_kind_mismatch', key: entry.key, kind: parsed.kind }); continue; }
    (owners[entry.path] ||= []).push(entry.key);
    (bindings[entry.key] ||= []).push(entry.path);
    if (entry.metadataReviewed === true) {
      indexedFields[entry.key] = parsed.params || {};
      sourceRouteFields[entry.key] = entry.sourceRouteFields || {};
    }
  }
  const overlaps = new Set(issues.filter(issue => issue.code === 'overlapping_source_groups').map(issue => issue.key));
  for (const group of sourceGroups) {
    if (!Array.isArray(group.sourceKeys)) continue;
    if (group.sourceKeys.some(key => overlaps.has(key))) {
      for (const key of group.sourceKeys) groupsBySource[key] = { blocked: true };
    } else if (groupsBySource[group.primaryKey] === group && !bindings[group.primaryKey]?.includes(group.canonicalPath)) {
      issues.push({ code: 'source_group_missing_primary_binding', groupId: group.groupId });
      for (const key of group.sourceKeys) groupsBySource[key] = { blocked: true };
    }
  }
  for (const [path, keys] of Object.entries(owners)) {
    owners[path] = [...new Set(keys)];
    if (owners[path].length !== 1) issues.push({ code: 'canonical_collision', path, keys: owners[path] });
  }
  for (const [key, paths] of Object.entries(bindings)) {
    bindings[key] = [...new Set(paths)];
    if (bindings[key].length !== 1) issues.push({ code: 'record_has_multiple_canonicals', key, paths: bindings[key] });
  }
  for (const [key, policy] of Object.entries(recordPolicies)) {
    if (!['operator','historical','unverified'].includes(policy.routeType) || !policy.notice || !policy.evidence || !Array.isArray(policy.withheldFields)) issues.push({code:'unverified_record_policy',key});
  }
  // Clone inputs so a later CMS mutation cannot silently change route authority.
  return freeze(JSON.parse(JSON.stringify({ owners, bindings, issues, indexedFields, sourceRouteFields, endpoints, venueRouteKinds, guides, sourceIssues, landings, groupsBySource, groupRecords, recordRoles, recordPolicies, now })));
}
function gateCanonical(built, key, context = createRouteContext()) {
  if (!built.ok) return built;
  const { path, kind } = built;
  if (!key) return blocked('missing_record_identity', { kind }, path);
  const owners = context.owners[path] || [];
  if (owners.length > 1) return blocked('canonical_collision', { kind, keys: owners }, path);
  if (owners.length !== 1 || owners[0] !== key) return blocked('missing_verified_record_binding', { kind, key }, path);
  if (context.bindings[key]?.length !== 1) return blocked('record_has_multiple_canonicals', { key }, path);
  const endpoint = context.endpoints[kind];
  if (!endpoint || endpoint.native !== true || endpoint.renderer !== true || !endpoint.revision || !endpoint.evidence) {
    return blocked('native_endpoint_not_ready', { kind, key }, path);
  }
  return freeze({ ok: true, kind, key, path, href: path, canonicalUrl: SITE_ORIGIN + path });
}
function isPublicRecord(row, surface = 'detail') {
  if (!row || row.active === false || row.pageReady === false || row.canonicalMachineId) return false;
  if (surface === 'listing' && [row.directoryReady, row.cardReady, row.guideReady].includes(false)) return false;
  return ![row.status, row.locationStatus, row.currentVenueStatus, row.variantStatus, row.researchStatus]
    .some(value => /^(duplicate|merged|deleted|archived|quarantin|suppress|permanently closed|closed(?:[\s_-]|$)|rejected|not open to general public|research retained|not a separate venue|hold(?:[\s_-]|$)|research in progress)/i.test(String(value || '')));
}
function offerGuide(collection, row, context, surface) {
  if (context.sourceIssues?.includes('HotelGuides')) return blocked('offer_guide_source_unavailable');
  if (row.revenueReady === false) return blocked('offer_not_ready');
  const expiry = row.validUntil || row.offerValidUntil;
  const raw = expiry && typeof expiry === 'object' ? expiry.$date : expiry;
  if (raw) {
    const time = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + 'T23:59:59Z' : raw);
    if (!Number.isFinite(time) || time < context.now) return blocked('offer_expired_or_invalid_date');
  }
  const matches = context.guides.filter(guide => isPublicRecord(guide, surface) &&
    (guide._id === row.hotelGuideId || (Array.isArray(guide.offerIds) && guide.offerIds.includes(row._id))));
  if (matches.length !== 1 || (row.hotelGuideId && row.hotelGuideId !== matches[0]._id)) return blocked('offer_guide_unresolved', { collection, key: recordKey(collection, row) });
  if (context.recordPolicies?.[recordKey('HotelGuides',matches[0])]?.offerActionsAllowed === false) return blocked('offer_actions_not_allowed', {collection,key:recordKey(collection,row)});
  return resolveRecord('HotelGuides', matches[0], context, { surface });
}
function resolveRecordInternal(collection, row, context = createRouteContext(), { surface = 'listing' } = {}) {
  const key = recordKey(collection, row);
  if (!key) return blocked('missing_record_identity', { collection });
  const policy = context.recordPolicies?.[key];
  if (policy?.publicServingAllowed === false || (surface === 'listing' && policy?.promoteInCurrentDiscovery === false)) return blocked('record_not_public', {key});
  const group = context.groupsBySource?.[key];
  if (group) {
    if (group.blocked) return blocked('overlapping_source_groups', { key });
    if (group.renderPolicy?.contentVerified !== true) return blocked('source_group_render_review_required', { key, primaryKey: group.primaryKey }, group.canonicalPath);
    if (key !== group.primaryKey) {
      if (surface !== 'redirect' && !isPublicRecord(row, surface)) return blocked('record_not_public', { key });
      const primary = context.groupRecords?.[group.primaryKey];
      if (!primary) return blocked('canonical_group_source_not_loaded', { key, primaryKey: group.primaryKey });
      const collection = group.primaryKey.slice(0, group.primaryKey.indexOf(':'));
      return resolveRecord(collection, primary, context, { surface });
    }
  }
  if (!isPublicRecord(row, surface)) return blocked('record_not_public', { key });
  const reviewedKind = context.venueRouteKinds[key];
  const reviewedBusiness = collection === 'AffiliateOffers' && Object.hasOwn(ROUTES, reviewedKind) && ROUTES[reviewedKind].collections?.includes(collection);
  if (collection === 'HotelOffers' || (collection === 'AffiliateOffers' && !reviewedBusiness)) return offerGuide(collection, row, context, surface);
  let kind, fields = { ...(context.indexedFields?.[key] || {}), ...row };
  for (const [field, value] of Object.entries(context.indexedFields?.[key] || {})) {
    if (row[field] === undefined || row[field] === null || row[field] === '' || row[field] === value) fields[field] = value;
    else if (Object.hasOwn(context.sourceRouteFields?.[key] || {}, field) && context.sourceRouteFields[key][field] === row[field]) fields[field] = value;
    else return blocked('route_source_metadata_changed', { key, field });
  }
  if (collection === 'HotelGuides') kind = 'hotel';
  else if (collection === 'ClassicFruitMachines') kind = 'machine';
  else if (collection === 'FoodAndDrink') kind = 'food';
  else if (collection === 'Locations') {
    kind = 'destination';
    // Native page uses {title}, not {slug}. Trust its exact computed link only.
    const links = [row['link-arcade-locations-title'], row['link-destination-title']].filter(Boolean);
    const paths = [...new Set(links)];
    if (paths.length !== 1) return blocked('missing_or_conflicting_native_destination_link', { key });
    const parsed = parseCanonical(paths[0]);
    if (!parsed.ok || parsed.kind !== kind) return blocked('invalid_native_destination_link', { key });
    fields = parsed.params;
  } else if (collection === 'Venues' || collection === 'NearbyAttractions' || reviewedBusiness) {
    // Category ownership is reviewed per record; filter membership is not identity.
    kind = context.venueRouteKinds[key];
    const spec = Object.hasOwn(ROUTES, kind) ? ROUTES[kind] : null;
    if (!spec || !(spec.collection === collection || spec.collections?.includes(collection))) {
      return blocked('venue_category_endpoint_unverified', { key, category: row.venueType || row.category || '' });
    }
  } else return blocked('collection_endpoint_unverified', { key, collection });
  const built = buildCanonical(kind, fields);
  if (group && built.ok && built.path !== group.canonicalPath) return blocked('source_group_route_mismatch', { key });
  return gateCanonical(built, key, context);
}

function recordRole(collection, row, context = createRouteContext()) {
  const key = recordKey(collection, row);
  const explicit = key && context.recordRoles?.[key];
  if (['business','offer'].includes(explicit)) return explicit;
  if (key && (context.venueRouteKinds[key] || context.groupsBySource?.[key])) return 'business';
  if (['Venues','NearbyAttractions','FoodAndDrink','HotelGuides','Locations','ClassicFruitMachines'].includes(collection)) return 'business';
  if (['HotelOffers','WowcherOffers'].includes(collection)) return 'offer';
  return 'unknown';
}
function resolveRecord(collection, row, context = createRouteContext(), options = {}) {
  const result = resolveRecordInternal(collection, row, context, options);
  const role = recordRole(collection, row, context), policy = context.recordPolicies?.[result.key || recordKey(collection,row)];
  return freeze({ ...result, ...(policy ? {routeType:policy.routeType,contentNotice:policy.notice,offerActionsAllowed:policy.offerActionsAllowed!==false,discoveryAllowed:policy.promoteInCurrentDiscovery!==false,indexable:policy.indexable!==false} : {}), recordRole: role === 'unknown' && collection === 'AffiliateOffers' && result.ok ? 'offer' : role });
}

// Reviewed native capture: branch Original revision registered-binding-capture-2026-10-02, evidence SHA-256 5d3a2cdfeef115fa85f9f5a6b6fef75a44d0370154a73c617bab99328165b2eb.
// Metadata only. Release gate must verify every final native root before promotion/redirect retirement.
const NATIVE_STATIC_PATHS = Object.freeze({
  "/": "jrgbr",
  "/500-jackpot-slots": "zwn1e",
  "/about-us": "zpkmj",
  "/agc": "sl761",
  "/all-british-casino": "gek83",
  "/arcade": "mnd6h",
  "/arcade-bars": "b1loq",
  "/attractions": "zwesd",
  "/beaches": "gp4xp",
  "/bingo-halls": "lx74m",
  "/blackpool-arcades": "s65s6",
  "/blog": "l8fi0",
  "/bowling": "zll98",
  "/casino-casino": "l0gb4",
  "/casino-offers": "ill8c",
  "/casinos": "j0sv4",
  "/cinemas": "u20u0",
  "/classic-fruit-machines": "mlsbg",
  "/coin-pusher-arcades": "xu4lh",
  "/days-out": "x2c0z",
  "/dog-friendly-arcades": "e01ye",
  "/family-fun": "kuj5y",
  "/fishing-lakes": "z7v2b",
  "/food-and-drink": "lyxzf",
  "/food-and-drink-hub": "zsqi7",
  "/forum": "z73my",
  "/funcasino": "fdvpj",
  "/group": "hqyya",
  "/hidden-gems": "b95tj",
  "/historical-sites": "g1li4",
  "/holiday-parks": "p9cib",
  "/map": "ngnt4",
  "/members": "b4nxh",
  "/mrvegas-casino-review": "iz2ob",
  "/museums": "dn097",
  "/near-me": "z00kr",
  "/offers": "zrdiw",
  "/outdoors": "tirpm",
  "/piers": "nd4iq",
  "/places-to-stay": "d4i0i",
  "/plan-a-trip": "yxeq9",
  "/post": "s7ubj",
  "/privacy-policy": "brat7",
  "/reelfruits": "zbp7j",
  "/responsiblegambling": "m82yy",
  "/retro-arcades": "lnapm",
  "/retro-slots-blackpool": "cvyf6",
  "/retro-video-games": "dln8x",
  "/retropolis-amusement-arcade": "ernep",
  "/sea-life": "ornf4",
  "/search": "cfe9p",
  "/seaside": "x4wr0",
  "/seaside-arcades": "nsqbc",
  "/services": "vvje0",
  "/terms": "jm2fd",
  "/theme-parks": "qrhw8",
  "/ticket-arcades": "gl6j9",
  "/tours": "yqik8",
  "/video-slots": "gvmnt",
  "/wheelchair-friendly-arcades": "g7x73",
  "/william-hill-vegas": "fi3xo",
  "/zoos": "di2hv"
});

// Exact published Wix Blog paths captured read-only 2026-10-02. No wildcard acceptance.
const NATIVE_BLOG_PATHS = Object.freeze({
  "/post/blackpool-world-fireworks-10-october-final-arcades": "ecba3002-b13c-496e-980c-12ec9699b3d2",
  "/post/wicked-tickets-london-day-out": "bed6c971-4a92-43a1-935d-a61a2e12292b",
  "/post/blackpool-world-fireworks-26-september-arcades": "811fc1da-6f03-4b6b-91e4-118a226eb313",
  "/post/great-yarmouth-arcades-pleasure-beach-2026": "7a888886-0529-4a6b-9c58-474afbf282bd",
  "/post/agc-vs-fec-vs-ufec-uk-arcade-guide": "986f16ec-0a81-484b-b17c-ca999ec37077",
  "/post/skegness-ingoldmells-arcade-day-2026": "d61569e8-673a-4bde-a139-4c8358ad3ca1",
  "/post/category-d-arcade-machines-uk-stakes-prizes-review": "0e4e9f6d-8e36-4566-9c4e-b160d2068111",
  "/post/claw-machines-uk-arcades-category-d-guide": "aa485771-497a-4554-ae50-a22f6bddf2f0",
  "/post/great-yarmouth-halloween-havoc-29-october-arcades": "cf56d6f3-b3c3-4b73-adea-22149fd87c7a",
  "/post/britannia-pier-great-yarmouth-2026-arcade-upgrades": "8cf32e36-b45d-4d79-9b0a-4eca4914cfc8",
  "/post/uk-gaming-machine-removal-rules-july-2026-arcades": "dc8f10c9-d718-4d04-b734-ee69baa5903d",
  "/post/verify-classic-fruit-machine-sighting-before-travel": "193f7275-730f-485a-ab0b-eacf8a2a241e",
  "/post/gladiators-maygay-fruit-machine": "c6d3f248-c6ef-4408-956d-c56bc3e42f14",
  "/post/high-flyer-barcrest-fruit-machine": "aa3efd34-6e93-414a-af95-7d11e2037ed0",
  "/post/blackpool-illuminations-2026-arcades-guide": "0b2d0830-675f-41fa-add8-44f7e4181405",
  "/post/race-casino-review-uk-2026": "f6cc1d50-6aef-473e-8f9e-e2d5ccbbd915",
  "/post/video-slots-casino-review-uk-2026": "832cb892-190f-4593-90c5-fcd3599b4d7f",
  "/post/all-british-casino-review-uk-2026": "75e0aefb-2011-4605-b905-065d51d87044",
  "/post/funcasino-review-uk-2026": "6488939b-82d3-4f1e-aa28-5a5df989251d",
  "/post/mr-vegas-casino-review-uk-2026": "429181f0-714f-4f65-8537-fe82ee8a294e",
  "/post/best-uk-amusement-arcades": "f5e365c6-958e-48be-8fb0-315f8208ae3d",
  "/post/plan-uk-seaside-arcade-trip": "0356b999-6f67-43c5-bc05-38144892677a",
  "/post/family-friendly-uk-arcades": "227e9163-4877-4b58-8655-25e4cf031103",
  "/post/the-t8-takeover-winning-big-on-the-new-terminals": "41c47bbd-31f1-4036-8c31-fb1b39818040",
  "/post/huge-catch-land-200-free-spins-on-big-bass-splash-with-william-hill-vegas": "c738e366-db11-4f16-b815-c81bee8942e5",
  "/post/reviewing-all-british-casino-why-it-earns-a-top-raider-decryptor-score": "6cc6b346-5cb8-4e14-b0cc-196fdf9aede1",
  "/post/reviewing-all-british-casino": "df6397b9-0d3c-4164-bf5f-16fdbcf56293",
  "/post/choosing-the-best-uk-online-casinos": "43cbd212-d492-47f2-bdab-f653a1b64630",
  "/post/the-elements-of-a-great-casino-review": "f31ab61d-3697-4165-bb6e-d958f392a03e",
  "/post/unlocking-the-value-of-casino-bonuses": "3d21cc1f-c366-413e-829b-a1c1956c2f24",
  "/post/explore-the-best-retro-arcade-experiences": "ae27118f-0093-4d40-be47-157ec9868bb9",
  "/post/why-responsible-gambling-tools-matter": "9c509f32-dcec-4021-95ea-ea8c030b964a",
  "/post/the-hidden-gambling-world-behind-prize-competition-sites": "cc7b8d9f-8d6c-4126-a842-979b65c6f2d2",
  "/post/high-street-hit-hard-uk-gambling-commission-tightens-rules-as-operators-warn": "8befea0b-0887-41ee-9286-19be9ee2ade9",
  "/post/light-up-the-fun-jpms-fireworks-themed-1990s-sidewinder-fruit-machine": "ec09e4d5-a442-4870-8924-31281e2f1878",
  "/post/get-your-spin-on-jpms-eachway-nudger-the-ultimate-fruit-machine-fusion": "c974ff62-f42d-44e2-b36a-0dad067e73ea",
  "/post/enter-if-you-dare-empires-haunted-house-the-ghostbusting-fruit-machine-of-the": "97c716a3-1b5e-4639-b353-438c30661324",
  "/post/retro-amusement-frenzy-explodes-with-nostalgic-excitement": "94b25f97-45f4-4d1d-a799-5f0185a87b36",
  "/post/astras-double-cash": "7ec036a7-b90b-482a-b0a9-73190cabfc89",
  "/post/who-dares-wins-strike-it-lucky-with-b-f-m-s-only-fools-and-horses-fruit": "79b06354-b38a-4e7c-a4bc-f6f0d4c1bf1a",
  "/post/thrill-of-the-night-spin-with-the-living-dead-on-crystals-1990s-thriller-fruit": "68a43072-03f2-4b7b-8162-90b2489d193a",
  "/post/spin-into-adventure-with-jpms-indiana-jones-fruit-machine-from-the-1990s": "4ccdf7c8-a404-427d-a837-2452d47a1955",
  "/post/ride-the-thrills-jpms-club-roller-coaster-fruit-machine-from-the-90s": "2f66303c-69f8-4856-ba1d-a8cce1f0bee3",
  "/post/charge-to-big-wins-with-astras-1990s-stampede-fruit-machine": "166a0219-1701-42f6-a768-525d4b1f3115",
  "/post/experience-the-90s-excitement-with-jpms-iconic-big-wheel-fruit-machine": "f91204c0-a185-425c-b2f6-626cb2e2183e",
  "/post/a-c-e-s-caesars-palace-15-jackpot-fruit-machine-from-the-90s": "f87dc30f-3cde-4406-bd88-3d515e31e489",
  "/post/burrow-for-big-wins-unearth-the-25-jackpot-on-red-gamings-holy-moley-fruit": "dc877ff0-ae33-4d62-ac57-6acc062058b5",
  "/post/cash-in-on-fun-jpms-money-talks-fruit-machine-from-the-90s": "b0b70b32-9460-4f65-a3d2-fbc5bb4a5366",
  "/post/kick-it-to-win-it-chase-the-15-jackpot-on-a-c-e-s-1990s-kung-fu-fruit-machine": "9699882f-f56e-4640-b6e8-9d4c0f470910",
  "/post/turn-up-the-heat-jpms-sizzling-hot-shot-fruit-machine-from-the-2000s": "93877d19-92dc-4bf0-80c0-60735fd0d4c5",
  "/post/cash-in-big-spin-for-the-15-jackpot-on-jpms-cashbuster-fruit-machine": "678317e0-5ef5-407e-80b4-53b09a651a58",
  "/post/hang-on-tight-spin-for-big-wins-with-vivids-cliffhanger-fruit-machine-inspired": "5654be3e-e18d-413b-93ec-3ca6e9ac069d",
  "/post/gem-azing-wins-await-shine-bright-with-red-gamings-25-jackpot-crown-gems": "42ea49a3-0199-4aa8-8b8a-ea8cc07e0b13",
  "/post/spin-for-gold-with-barcrests-1990s-lucky-strike-10-fruit-machine": "288c0c75-bdc5-462d-8a94-aaa90769738d",
  "/post/announcing-a-blackpool-spin-blitz-slots-jackpot-frenzy-throughout-november": "bb1a6100-1ec5-4e9b-adbc-9ee16358162a",
  "/post/bacta-fights-to-save-reel-based-slot-machines-from-extinction": "6c3fe317-a6c6-44c9-8cd2-1cd9989e696c",
  "/post/retro-slots-blackpool-jackpot-frenzy": "7d649aec-1e70-41f7-bfcd-0cbbb9101212",
  "/post/alarm-bells-and-big-wins-jpms-red-alert-fruit-machine-from-the-2000s": "a78520ef-e846-4e7d-8372-059a17711fa8",
  "/post/an-almost-complete-guide-to-barcrests-spiker-the-biker": "072a1267-cd87-41a2-bca7-7ed96b2252c5",
  "/post/spooky-spins-and-creepy-wins-mastering-the-addams-famiy-fruit-machine": "f3ea5932-1ec8-4bae-8826-b4a069443be3",
  "/post/the-death-of-reel-based-machines-gambling-commissions-proposal-threatens": "a5f6c33c-fa35-48eb-8f18-de113ed9e205",
  "/post/club-3000-bingo-to-launch-exciting-new-venue-in-leeds-before-years-end": "f66e8ad5-eed1-45af-8f44-b9c27aaafff9",
  "/post/coral-island-weston-super-mare-exciting-plans-to-turn-former-m-and-s-into-epic": "ffd03857-1d92-4d9e-a3d0-7a290bda7cd2",
  "/post/the-true-scale-of-uk-black-market-gambling-a-growing-national-concern": "02198274-df28-4b13-9ffd-97260e73d115",
  "/post/hairy-slotters-premier-16-11-20": "e6d84767-85d9-424c-aac0-0b757cf4f101",
  "/post/easter-eggstravaganza-at-retropolis-classic-amusements-in-south-end-on-sea": "50b1f92d-0c52-4ee1-b830-01884da846a9",
  "/post/retropolis-the-best-arcade-in-southend-on-sea": "dcc2dbb7-fbbe-427a-976a-78c6b2256176",
  "/post/bishops-bash-betting-budgets": "d7da3d3c-34f9-4239-bc16-e294ecb49d4a",
  "/post/snowed-in-how-would-you-roll-with-it": "0df94db7-268a-4fab-b4ca-afa61f67838f",
  "/post/fancy-a-quickie-with-the-hairy-slotters": "f70e8606-81a1-49ba-b6e6-df6e931e192c",
  "/post/new-owners-to-put-the-um-pa-pa-back-into-barry-island": "588ebfcd-d213-4f8a-84d9-4227bfcb8844",
  "/post/colwyn-comes-to-play-have-your-say": "971e8040-ba41-4484-8d15-018db2fc32fa",
  "/post/yes-sir-we-can-boogy": "89d7fcbb-05c4-4fb0-b669-0444dc1dee3a",
  "/post/bye-bye-bridlington": "54d12f9f-7c7f-40cf-b967-016771939d36",
  "/post/fancy-owning-your-own-amusements": "c290b863-d547-4125-ada7-38db7ede7f94",
  "/post/hairy-slotters-are-off-to-bognor": "327fea78-b596-41a6-9e8c-a7e47644487f",
  "/post/its-almost-here-onetec-casino-lounge-birthday-bash": "ce647fdf-b646-434a-aeb6-f7a4539b0d2c",
  "/post/17-days-till-onetecs-birthday-bash": "bc8a13e6-efdf-4ca1-b9a3-446146fd0fdc",
  "/post/onetecs-classic-crazy-offer": "893b7219-84f0-497b-92c4-f47361e3e2ed",
  "/post/summer-of-freedom-or-summer-of-shortages": "2cba254e-4eb1-4a39-8b55-04fc92ed74dc",
  "/post/dont-you-wish-your-grandad-had-a-shed-like-this": "92abb6a7-9dfe-4702-9336-36a0be269351",
  "/post/onetecs-birthday-bonanza": "11c39258-dd4b-4fe3-9786-c163ea22c35a",
  "/post/happy-onetec-day": "3b8aa88a-3ce9-46ef-9d46-accc35dfe425",
  "/post/countdown-to-onetec-day-2-more-sleeps": "3dc6237b-7f4b-4269-bda7-c77717eefc48",
  "/post/countdown-to-onetec-day-6-more-sleeps": "e17e7e18-5605-451f-ba5b-554b4ca53cd1",
  "/post/count-down-to-onetec-day-11-more-sleeps": "257dab0f-fad9-4f4a-8aac-93bfe7b4c1ac",
  "/post/lord-loses-last-appeal-to-reopen-agcs-early": "d1cb2bb6-9427-4108-a1e1-f8ba0fd54c16",
  "/post/pinch-punch-its-the-start-of-onetec-month": "b9fc1b2e-602f-4331-948e-68aed5e79566",
  "/post/retro-hits-record-megaways-channel-win": "47e9826a-3ff8-46ee-95d0-05fda73aee05",
  "/post/if-sacha-lord-doesnt-win-weve-got-you-some-free-spins": "d1702b40-a78d-4a1d-86af-6a74eec489e5",
  "/post/bacta-calls-out-gambling-commission-to-stop-illegal-machine-sales": "14477cf0-e664-420f-b1de-166e69832c08",
  "/post/happy-easter": "e60ef81f-0b8f-48f3-8705-e0cdd64e5e3c",
  "/post/the-signs-are-good-for-onetec-casino-lounge": "a56bcd8f-4d7b-4ddc-b3e7-61dda865d776",
  "/post/plan-your-staycation-with-the-new-reel-world-slots-amusement-arcade-uk-section": "86a06173-f3c2-4965-856f-d98501e9b283",
  "/post/stay-shut-and-rot-government-send-clear-message-to-agcs": "bdb9d54e-3d20-4c7c-8500-b33b85429c80",
  "/post/whats-your-biggest-win": "8089bd73-34d1-4966-9914-3634b935f602",
  "/post/the-big-boys-ask-the-government-to-rethink-its-may-17th-stance": "57bbe486-db1a-423d-90f0-8eab54d8db31",
  "/post/why-do-we-have-to-wait-government-fail-to-back-agcs-coming-out-of-lockdown-2": "614d667c-1138-4eec-8e37-a5919de6d154",
  "/post/the-road-to-onetec-day-22nd-may-part-1": "d45b0792-779b-4102-9a37-4c8801c8a040",
  "/post/big-betting-business-to-get-the-boot-live-streaming-losses-to-be-limited": "15444044-df44-4c22-8e03-f58028ad3416",
  "/post/review-of-the-gambling-act-2005-have-your-say": "5420a8a2-080f-4f83-b9a9-a132590cbc6c",
  "/post/under-18s-national-lottery-ban-just-scratching-the-surface-of-whats-to-come": "225c79fd-1c4d-4723-9fd8-e40cd885737e",
  "/post/what-makes-you-watch-what-do-you-want-to-see-from-us": "09449a44-d102-429d-9c61-7dd5e439960e",
  "/post/carry-on-caesar": "a02d8b6a-68aa-4c16-8fbd-27f13b2556f2",
  "/post/the-positive-effects-of-gaming-being-ignored-during-safer-gambling-week": "9f3e578c-e4f6-4bdd-a6f6-53965b646f2b",
  "/post/hairy-slotters-making-the-pennies-fall": "650659d6-49fe-4e87-988f-f359ee20823a",
  "/post/lets-get-our-gaming-on-time-to-fight-back-against-a-nanny-state": "72ca9038-0c21-4af4-8096-5f9cbb469b4a",
  "/post/bookies-get-green-light-but-casinos-shown-the-red-card": "3b0d9b92-1436-4c86-b8d4-04fe764ffd13",
  "/post/gambling-pandemic-looks-like-they-found-a-vaccine-for-that": "77d1150e-5bb5-4576-9a26-77d1c7c7e321",
  "/post/hairy-slotters-get-evicted-for-unleashing-the-beast": "626306ca-bc46-4bc0-a35e-d04ee370a52b",
  "/post/hairy-slotters-unleash-a-psycho-beast-into-the-big-brother-house": "19ea042b-e3f3-4169-912e-87f11cfe34c6",
  "/post/are-we-ready-for-a-reboot": "d167bea4-b6b3-4271-817c-b12bc6c954af",
  "/post/massive-tax-rise-could-change-the-uk-arcade-forever": "b8d7046d-e7a9-4a6d-b549-8eca5197590b",
  "/post/will-you-have-a-staycation-to-save-your-favourite-arcade": "f3cdab37-f22d-4e73-8a90-2e457ea160ee",
  "/post/the-curse-of-the-internet-troll": "cc666dc6-15f5-466f-ab4f-d5b1a316adfd",
  "/post/between-3-and-5-in-every-slot-machine-onetec-amusements-part-2": "f4783614-f0ed-4354-a976-11baff6eb705",
  "/post/bacta-bans-under-18s-playing-5-and-under-jackpots": "b9051ea8-159d-41c4-9759-4b76d13a4858",
  "/blog/categories/arcade-guides": "1bc64d6e-0fba-4020-ae57-186ebffd0fdc",
  "/blog/categories/destinations-trip-planning": "215149b0-4987-4fb6-95a3-f8c3a341f0b4",
  "/blog/categories/uk-arcades": "d73295f2-10da-472e-9f0b-5be2792ec74a",
  "/blog/categories/fruit-machines-slots": "5d783295-ef86-4964-8fac-7b4eb21b88be",
  "/blog/categories/retro-classic-machines": "153180ff-d640-41d5-8141-c9d4396d9fcb",
  "/blog/categories/online-casinos-offers": "af26a7d9-8750-494a-bebe-6317f14b0a48",
  "/blog/categories/gambling-industry-news": "63f85900-717f-48cb-ad74-9d1b4f681a54",
  "/blog/categories/spin-raiders-updates": "3b2b779f-f8c9-4989-88b5-1635db03509b"
});

/** Static editorial navigation is separate from record resolution. Search/filter
 * query state is allowed only on known search/map pages, never record-ID params.
 */
function staticNavigation(value) {
  if (typeof value !== 'string' || !value || /[\\\s]/.test(value) || value.startsWith('//')) return blocked('invalid_static_link');
  let url;
  try { url = new URL(value, SITE_ORIGIN); } catch { return blocked('invalid_static_link'); }
  if (url.origin !== SITE_ORIGIN || !(Object.hasOwn(NATIVE_STATIC_PATHS, url.pathname) || Object.hasOwn(NATIVE_BLOG_PATHS, url.pathname)) || url.hash || /%(?:2f|5c|25|2e)/i.test(value)) return blocked('unverified_static_link');
  if (url.search) {
    const allowed = url.pathname === '/search' ? ['q','category','page','sort','view','favourites'] : url.pathname === '/map' ? ['q','town','category','type','saved'] : Object.values(CATEGORY_PATHS).some(path => path.split('?')[0] === url.pathname) ? ['q','town','category','type','sort','page'] : [];
    if ([...url.searchParams].some(([key, value]) => !allowed.includes(key) || (['saved','favourites'].includes(key) && value !== '1'))) return blocked('unverified_static_query');
  }
  const path=url.pathname+url.search;
  return {ok:true,kind:'static',path,href:path,canonicalUrl:SITE_ORIGIN+url.pathname,pageId:NATIVE_STATIC_PATHS[url.pathname],blogId:NATIVE_BLOG_PATHS[url.pathname]};
}

/** Existing current-design index views. Native bindings are verified separately. */
const INDEX_ROUTES = Object.freeze({
  staysIndex: Object.freeze({ prefix: '/places-to-stay', fields: [], viewKey: 'places-to-stay' }),
  offersIndex: Object.freeze({ prefix: '/offers', fields: [], viewKey: 'offers' }),
  familyFunIndex: Object.freeze({ prefix: '/family-fun', fields: [], viewKey: 'family-fun' }),
  hiddenGemsIndex: Object.freeze({ prefix: '/hidden-gems', fields: [], viewKey: 'hidden-gems' }),
  retroIndex: Object.freeze({ prefix: '/retro-video-games', fields: [], viewKey: 'retro-video-games' }),
  daysOutIndex: Object.freeze({ prefix: '/days-out', fields: [], viewKey: 'discover' }),
  tripIndex: Object.freeze({ prefix: '/plan-a-trip', fields: [], viewKey: 'trip' })
});
const CATEGORY_PATHS = Object.freeze({
  arcades: '/arcade', venues: '/arcade', 'family-arcades': '/arcade?type=family', 'classic-arcades': '/arcade?type=classic',
  cinema: '/cinemas', cinemas: '/cinemas', fishing: '/fishing-lakes', 'fishing-lakes': '/fishing-lakes',
  nature: '/outdoors', outdoors: '/outdoors', 'nature-outdoors': '/outdoors', bowling: '/bowling',
  bingo: '/bingo-halls', 'holiday-parks': '/holiday-parks', 'places-to-stay': '/places-to-stay', stays: '/places-to-stay',
  'food-drink': '/food-and-drink', food: '/food-and-drink', museums: '/museums',
  'historical-sites': '/historical-sites', 'theme-parks': '/theme-parks', zoos: '/zoos',
  'sea-life': '/sea-life', piers: '/piers', beaches: '/beaches', 'arcade-bars': '/arcade-bars',
  agc: '/agc', services: '/services', casinos: '/casinos', 'casino-venues': '/casinos',
  seaside: '/seaside', tours: '/tours', attractions: '/attractions', 'family-fun': '/family-fun',
  'hidden-gems': '/hidden-gems', 'retro-video-games': '/retro-video-games', discover: '/days-out',
  'days-out': '/days-out', offers: '/offers', 'fruit-machines': '/classic-fruit-machines',
  'plan-a-trip': '/plan-a-trip'
});
const VIEW_PATHS = Object.freeze({ trip: '/plan-a-trip', offers: '/offers', agc: '/agc' });

/** Legacy references are accepted ONLY here as one-way redirect inputs. */
const EXACT_LEGACY_RECORD_ALIASES = Object.freeze([
  Object.freeze({from:'/post/masala-n-malt-grimsby',key:'FoodAndDrink:fd-masala-n-malt-grimsby',evidence:'Full source parity verified: original review, eight photos, attribution and dated facts retained'})
]);
const LEGACY_ROUTING_INPUTS = Object.freeze({
 prefixes:Object.freeze(['/arcade-venues','/arcade-locations','/classic-fruit-machine-archive-1','/hotels','/nearby-attractions']),
 exactPaths:Object.freeze(EXACT_LEGACY_RECORD_ALIASES.map(alias=>alias.from)),
 collections:Object.freeze(['Venues','NearbyAttractions','Locations','FoodAndDrink','HotelGuides','HotelOffers','AffiliateOffers','ClassicFruitMachines','DestinationRecommendations'])
});
function isLegacyRecordInput(value) {
 const parsed=parseLegacyInput(value);if(!parsed.ok)return false;
 const url=new URL(parsed.input,SITE_ORIGIN),q=url.searchParams,path=url.pathname;
 return q.has('collection')&&LEGACY_ROUTING_INPUTS.collections.includes(q.get('collection'))&&Boolean(q.get('place')) || q.get('sr')==='classic'&&Boolean(q.get('machine')) || LEGACY_ROUTING_INPUTS.exactPaths.includes(path) || LEGACY_ROUTING_INPUTS.prefixes.some(prefix=>path.startsWith(prefix+'/')) || /^\/cinemas\/[^/]+$/.test(path);
}
// Exact exceptions from the captured production venue sitemap. Never infer or
// normalize another encoded-slash input into this allowlist.
const EXACT_ENCODED_LEGACY_PATHS = Object.freeze([
  "/arcade-venues/h.j's-%2F-henry-js-casino-slots---plymouth",
  "/arcade-venues/codona's-%2F-sunset-boulevard---aberdeen",
  "/arcade-venues/fortunes-%2F-quay-amusements---poole",
  "/arcade-venues/oasis-%2F-lings-amusements---high-street-skegness",
  "/arcade-venues/quicksilver---blackburn%2Fdarwen-services",
  "/arcade-venues/moto-game-zone-%2F-jackpot-lounge",
  "/arcade-venues/the-sands-%2F-golden-sands-arcade",
  "/arcade-venues/merkur-slots---rosehill-%2F-carshalton"
]);
function exactEncodedLegacyInput(value) {
  if (typeof value !== 'string') return null;
  const path = value.startsWith(SITE_ORIGIN + '/') ? value.slice(SITE_ORIGIN.length) : value;
  return EXACT_ENCODED_LEGACY_PATHS.includes(path) ? path : null;
}
const ID_PARAMS = new Set(['collection', 'place', 'machine', 'sr']);
function parseLegacyInput(value) {
  if (typeof value !== 'string' || /[\\\s]/.test(value) || value.startsWith('//')) return blocked('invalid_legacy_input');
  let url;
  try { url = new URL(value, SITE_ORIGIN); } catch { return blocked('invalid_legacy_input'); }
  if (url.origin !== SITE_ORIGIN || url.username || url.password || url.hash || (/%(?:2f|5c|25|2e)/i.test(value) && !exactEncodedLegacyInput(value))) return blocked('invalid_legacy_input');
  if (!value.startsWith('/') && !value.startsWith(SITE_ORIGIN + '/')) return blocked('invalid_legacy_input');
  if (url.pathname.split('/').some(segment => segment === '.' || segment === '..') || /(?:^|\/)\.\.?(?:\/|$)/.test(value)) return blocked('invalid_legacy_input');
  const params = [...url.searchParams];
  if (params.some(([key]) => !ID_PARAMS.has(key)) || new Set(params.map(([key]) => key)).size !== params.length) return blocked('unsupported_legacy_query');
  if (params.length && (params.length !== 2 || (!(url.searchParams.has('collection') && url.searchParams.has('place')) && !(url.searchParams.get('sr') === 'classic' && url.searchParams.has('machine'))))) return blocked('unsupported_legacy_query');
  let pathname;
  try { pathname = url.pathname.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment).normalize('NFC'))).join('/').replace(/\/+$/, '') || '/'; }
  catch { return blocked('invalid_legacy_encoding'); }
  params.sort(([a], [b]) => a.localeCompare(b));
  const query = new URLSearchParams(params).toString();
  return { ok: true, input: pathname + (query ? '?' + query : '') };
}
function buildRedirectManifest(mapping, resolveKey, { canonicalPaths } = {}) {
  const routes = new Map(), issues = [], unchanged = [], rejectedInputs = new Set();
  const current = canonicalPaths ? new Set(canonicalPaths) : null;
  for (const entry of mapping) {
    const from = parseLegacyInput(entry.from);
    if (!from.ok) { issues.push({ from: entry.from, code: from.code }); continue; }
    if (rejectedInputs.has(from.input)) continue;
    const reject = code => {
      issues.push({ from: entry.from, key: entry.key, code });
      routes.delete(from.input);
      rejectedInputs.add(from.input);
      for (let i = unchanged.length - 1; i >= 0; i--) if (unchanged[i].path === from.input) unchanged.splice(i, 1);
    };
    const target = resolveKey(entry.key);
    if (!target?.ok || !parseCanonical(target.href).ok) { reject(target?.code || 'unresolved_redirect_target'); continue; }
    if (from.input === target.href) { unchanged.push({ path: from.input, key: entry.key }); continue; }
    // Protect current canonical destinations. A retired semantic-looking name
    // may redirect only when a complete reviewed canonical set excludes it.
    if (parseCanonical(from.input).ok && (!current || current.has(from.input))) { reject('canonical_source_forbidden'); continue; }
    if (current && !current.has(target.href)) { reject('target_not_in_canonical_index'); continue; }
    const existing = routes.get(from.input);
    if (existing && existing.to !== target.href) { reject('ambiguous_legacy_source'); continue; }
    routes.set(from.input, { from: from.input, to: target.href, status: from.input.includes('?') ? null : 301, method: from.input.includes('?') ? 'clientReplace' : 'server301', key: entry.key });
  }
  return { entries: [...routes.values()], unchanged, issues, complete: issues.length === 0 };
}
/** Lookup only; deployment uses server/native 301s, not a DOM rewriter. */
function redirectFor(input, manifest) {
  const parsed = parseLegacyInput(input);
  if (!parsed.ok) return parsed;
  const matches = manifest.entries.filter(entry => entry.from === parsed.input);
  return matches.length === 1 ? { ok: true, ...matches[0] } : blocked('legacy_bookmark_unmapped');
}
/** Required migration acceptance: ALL known sources have exactly one target. */
function auditRedirectCoverage(knownInputs, manifest) {
  const missing = knownInputs.map(input => ({ input, result: redirectFor(input, manifest) })).filter(item => !item.result.ok && !(manifest.unchanged || []).some(entry => entry.path === parseLegacyInput(item.input).input));
  return { complete: manifest.complete && missing.length === 0, missing: missing.map(item => item.input), issues: manifest.issues };
}

const INDEX_ALIAS_PATHS = Object.freeze({
  '/classic-fruit-machine-archive':'/classic-fruit-machines',
  '/classic-fruit-machine-archive-1':'/classic-fruit-machines',
  '/amusement-arcades':'/arcade',
  '/hotels':'/places-to-stay',
  '/nearby-attractions':'/attractions'
});
/** Exact inbound index aliases only. Canonical producers use CATEGORY_PATHS.
 * Filters are retained as scoped UI state; no identity query is ever copied.
 */
function resolveIndexAlias(value) {
  let url;try{url=new URL(value,SITE_ORIGIN);}catch{return blocked('invalid_index_alias');}
  if(typeof value!=='string'||url.origin!==SITE_ORIGIN||url.username||url.password||url.hash||/[\\]/.test(value))return blocked('invalid_index_alias');
  const path=url.pathname.replace(/\/$/,'')||'/',q=url.searchParams;
  let target,selector;
  if(Object.hasOwn(INDEX_ALIAS_PATHS,path)){target=INDEX_ALIAS_PATHS[path];}
  else if(path==='/'&&q.has('explore')){selector='explore';target=CATEGORY_PATHS[q.get(selector)];}
  else if((path==='/'||path==='/destination-recommendations')&&q.has('view')){selector='view';target=VIEW_PATHS[q.get(selector)];}
  else if(path==='/'&&q.get('sr')==='classic'&&!q.has('machine')){selector='sr';target='/classic-fruit-machines';}
  if(!target)return blocked('not_index_alias');
  if(new Set([...q.keys()]).size!==[...q].length)return blocked('ambiguous_index_alias');
  const output=new URL(target,SITE_ORIGIN);
  for(const [key,value]of q){if(key===selector)continue;if(!['q','town','category','type','sort','page'].includes(key))return blocked('unsupported_index_alias_query');output.searchParams.set(key,value);}
  const navigation=staticNavigation(output.pathname+output.search);
  if(!navigation.ok)return navigation;
  return {ok:true,to:navigation.href,method:url.search?'clientReplace':'server301',status:url.search?null:301,kind:'static'};
}

/** Data client only. Never observes or rewrites links, and never mounts a skin. */
function createBrowserRouteClient({ fetch, origin = SITE_ORIGIN, apiMode = 'production', expectedReleaseFingerprint = null, indexAliasesActive = false, timeoutMs = 8000, now = Date.now, ttlMs = 30000, onIssue = () => {} }) {
  if (!['production', 'release-manager-test'].includes(apiMode)) throw new Error('Unsupported route API mode');
  const outcomes = new Map();
  const versions = new Map();
  const expires = new Map();
  const pending = new Map();
  const linkOutcomes = new Map(), linkExpires = new Map(), linkPending = new Map(), linkVersions = new Map();
  const recordSources = new Set(['Venues','NearbyAttractions','Locations','FoodAndDrink','HotelGuides','HotelOffers','AffiliateOffers','ClassicFruitMachines']);
  async function json(path, options) {
    // Mode is injected by the build/test harness, never inferred from visitor query strings.
    const endpoint = apiMode === 'release-manager-test' ? path + (path.includes('?') ? '&' : '?') + 'rc=test-site' : path;
    const controller = new AbortController();
    let timer;
    const request = (async () => {
      const response = await fetch(endpoint, { ...options, signal: controller.signal });
      if (!response.ok) throw new Error('Route service unavailable');
      const payload = await response.json();
      if (expectedReleaseFingerprint && payload.fingerprint?.releaseFingerprint !== expectedReleaseFingerprint) throw new Error('Route build identity mismatch');
      return payload;
    })();
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('Route service timed out')); }, Math.max(50, Math.min(timeoutMs, 15000)));
    });
    try { return await Promise.race([request, timeout]); }
    finally { clearTimeout(timer); }

  }
  function validOutcome(item, key) {
    if (!item || typeof key !== 'string' || !key || item.key !== key) return blocked('invalid_route_service_response', { key });
    const role = ['business','offer','unknown'].includes(item.recordRole) ? item.recordRole : 'unknown';
    if (!item.ok) return blocked(item.code || 'route_unavailable', { key, recordRole: role,discoveryAllowed:item.discoveryAllowed!==false,routeType:item.routeType,contentNotice:item.contentNotice,offerActionsAllowed:item.offerActionsAllowed!==false });
    const parsed = parseCanonical(item.href);
    if (!parsed.ok || parsed.path !== item.path || item.canonicalUrl !== origin + item.path || parsed.kind !== item.kind) {
      return blocked('invalid_route_service_response', { key });
    }
    return Object.freeze({ ok: true, key, targetKey: item.targetKey || key, recordRole: role, routeType: ['operator','historical','unverified'].includes(item.routeType)?item.routeType:'place', contentNotice:typeof item.contentNotice==='string'?item.contentNotice:null,offerActionsAllowed:item.offerActionsAllowed!==false,discoveryAllowed:item.discoveryAllowed!==false,indexable:item.indexable!==false, kind: parsed.kind, path: item.path, href: item.href, canonicalUrl: item.canonicalUrl });
  }
  async function annotate(rows, collection, { refresh = false } = {}) {
    const requests = rows.map(row => ({ collection: row._collection || collection, id: row._id || row.id }))
      .filter(item => recordSources.has(item.collection) && typeof item.id === 'string' && item.id);
    const unique = [...new Map(requests.map(item => [`${item.collection}:${item.id}`, item])).values()];
    const waiting = refresh ? [] : unique.map(item => pending.get(`${item.collection}:${item.id}`)).filter(Boolean);
    const missing = unique.filter(item => {
      const key = `${item.collection}:${item.id}`;
      return refresh || (!pending.has(key) && !(expires.get(key) > now()));
    });
    for (let offset = 0; offset < missing.length; offset += 1000) {
      const batch = missing.slice(offset, offset + 1000);
      const requestVersions = new Map();
      for (const item of batch) {
        const key = `${item.collection}:${item.id}`, version = (versions.get(key) || 0) + 1;
        versions.set(key, version); requestVersions.set(key, version); outcomes.set(key, blocked('route_pending', { key }));
      }
      const work = (async () => {
        let received;
        try {
          const payload = await json('/_functions/canonicalRoutes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requests: batch }) });
          if (!payload.ok || !Array.isArray(payload.results)) throw new Error('Invalid route response');
          received = new Map(payload.results.map(result => [result.key, result]));
        } catch { received = new Map(); }
        for (const item of batch) {
          const key = `${item.collection}:${item.id}`;
          const result = received.has(key) ? validOutcome(received.get(key), key) : blocked('route_service_unavailable', { key });
          if (versions.get(key) !== requestVersions.get(key)) continue;
          outcomes.set(key, result);
          expires.set(key, result.ok ? now() + Math.max(0, Math.min(ttlMs, 60000)) : 0);
          if (!result.ok) onIssue(result);
        }
      })();
      for (const item of batch) pending.set(`${item.collection}:${item.id}`, work);
      await work;
      for (const item of batch) {
        const key = `${item.collection}:${item.id}`;
        if (pending.get(key) === work) pending.delete(key);
      }
    }
    await Promise.all(waiting);
    // Bound session-local data; no persistent browser storage is used.
    for (const key of outcomes.keys()) {
      if (outcomes.size <= 10000) break;
      if (!pending.has(key)) { outcomes.delete(key); expires.delete(key); versions.delete(key); }
    }
    return rows.map(row => {
      const source = row._collection || collection, normalized = { ...row, _id: row._id || row.id, _collection: source };
      const key = recordKey(source, normalized);
      const routeOutcome = key && outcomes.get(key) || blocked('route_not_resolved', { key });
      return { ...normalized, routeOutcome };
    });
  }
  function outcome(row) {
    const key = recordKey(row?._collection, row);
    // Never trust a row's CMS href, canonicalUrl, shortUrl or routeOutcome property.
    return key && outcomes.get(key) || blocked('route_not_resolved', { key });
  }
  function href(row) {
    const result = outcome(row);
    if (!result.ok) throw new Error(`Canonical route unavailable: ${result.code}`);
    return result.href;
  }
  async function current(path) {
    if (!parseCanonical(path).ok) return { status: 404, issue: 'invalid_canonical_path' };
    const payload = await json('/_functions/canonicalRoute?path=' + encodeURIComponent(path));
    if (payload.status !== 200) return payload;
    const key = recordKey(payload.collection, payload.row), route = validOutcome(payload.route, key);
    if (!route.ok || route.path !== path) return { status: 503, issue: 'invalid_route_service_response' };
    outcomes.set(key, route);
    return { ...payload, row: { ...payload.row, _collection: payload.collection, routeOutcome: route }, route };
  }
  async function alias(input) {
    const indexAlias = resolveIndexAlias(input), parsed = parseLegacyInput(input);
    if (!parsed.ok && !indexAlias.ok) return parsed;
    const payload = await json('/_functions/canonicalAlias?input=' + encodeURIComponent(indexAlias.ok ? input : parsed.input));
    if (!payload.ok || !(parseCanonical(payload.to).ok || staticNavigation(payload.to).ok) || !['clientReplace','server301'].includes(payload.method)) return blocked(payload.code || 'invalid_alias_response');
    return { ok: true, to: payload.to, method: payload.method };
  }
  async function canonicalLinks(inputs, { refresh = false } = {}) {
    if (!Array.isArray(inputs) || inputs.length > 1000 || inputs.some(input => typeof input !== 'string' || input.length > 2000)) return { results: [], complete: false, code: 'invalid_link_requests' };
    const unique = [...new Set(inputs)], waiting = [], missing = [];
    for (const input of unique) {
      const internal = typeof input === 'string' && (input.startsWith('/') && !input.startsWith('//') || input.startsWith(origin + '/'));
      if (!internal) { linkOutcomes.set(input, blocked('external_or_invalid_link')); continue; }
      if (!refresh && linkPending.has(input)) waiting.push(linkPending.get(input));
      else if (refresh || !(linkExpires.get(input) > now())) missing.push(input);
    }
    for (let offset = 0; offset < missing.length; offset += 250) {
      const batch = missing.slice(offset, offset + 250), versions = new Map();
      for (const input of batch) { const version = (linkVersions.get(input) || 0) + 1; linkVersions.set(input, version); versions.set(input, version); }
      const work = (async () => {
        let returned;
        try { const result = await json('/_functions/canonicalLinks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: batch }) });
          if (!result.ok || !Array.isArray(result.results)) throw new Error('Invalid links response');
          returned = new Map(result.results.map(item => [item.input, item]));
        } catch { returned = new Map(); }
        for (const input of batch) {
          if (linkVersions.get(input) !== versions.get(input)) continue;
          const item = returned.get(input); let result;
          if (!item?.ok) result = blocked(item?.code || 'route_service_unavailable');
          else if (item.kind === 'static') {
            const nav = staticNavigation(item.href);
            const verifiedRoot = [...Object.values(ROUTES), ...Object.values(INDEX_ROUTES)].some(route => route.prefix === item.href) && item.href === item.path && item.canonicalUrl === origin + item.path;
            result = (nav.ok && nav.canonicalUrl === item.canonicalUrl) || verifiedRoot ? Object.freeze({ ok: true, kind: 'static', href: item.href, canonicalUrl: item.canonicalUrl }) : blocked('invalid_route_service_response');
          } else result = validOutcome(item, item.key);
          linkOutcomes.set(input, result); linkExpires.set(input, result.ok ? now() + Math.max(0, Math.min(ttlMs, 60000)) : 0);
        }
      })();
      for (const input of batch) linkPending.set(input, work);
      await work;
      for (const input of batch) if (linkPending.get(input) === work) linkPending.delete(input);
    }
    await Promise.all(waiting);
    for (const key of linkOutcomes.keys()) {
      if (linkOutcomes.size <= 10000) break;
      if (!unique.includes(key) && !linkPending.has(key)) { linkOutcomes.delete(key); linkExpires.delete(key); linkVersions.delete(key); }
    }
    const results = inputs.map(input => ({ input, ...(linkOutcomes.get(input) || blocked('unresolved_internal_link')) }));
    return { results, complete: results.every(result => result.ok) };
  }
  return Object.freeze({ annotate, outcome, href, current, alias, canonicalLinks, categoryPaths: CATEGORY_PATHS, viewPaths: VIEW_PATHS,
    category: key => Object.hasOwn(CATEGORY_PATHS, key) ? staticNavigation(CATEGORY_PATHS[key]) : blocked('unknown_category_key'),
    navigation: staticNavigation, parse: parseCanonical, isLegacyRecordInput,
    indexInput: value => {const result=resolveIndexAlias(value);return result.ok?{...result,mode:indexAliasesActive?'redirect':'render'}:result;} });
}

if(Object.prototype.hasOwnProperty.call(window,'SR_ROUTES'))throw new Error('Duplicate route authority');
Object.defineProperty(window,'SR_ROUTES',{value:createBrowserRouteClient({fetch:window.fetch.bind(window),origin:SITE_ORIGIN,apiMode:"production",indexAliasesActive:false,expectedReleaseFingerprint:"c6569fe524fcd74f5c3b0d317d457b5978a240d99e98091fa6e8bdcb0fc26443",onIssue:issue=>console.warn('Canonical route unavailable',issue.code)}),writable:false,configurable:false});
})();
