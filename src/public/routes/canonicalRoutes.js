/**
 * Sole canonical URL policy. Pure ESM: no Wix, DOM, network, storage or globals.
 * This local module is NOT mounted in production. Never append it after old
 * routers: replace URL producers with imports and retire the old writers first.
 */
export const SITE_ORIGIN = 'https://www.spin-raiders.com';
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const place = (prefix) => ({ prefix, fields: ['slug', 'locationSlug'], collections: ['Venues', 'NearbyAttractions', 'AffiliateOffers'], proposed: true });
export const ROUTES = freeze({
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
export const REQUIRED_ROUTE_FIELDS = freeze({
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
export const CANONICAL_SEGMENT_RULES = freeze({slug:SLUG.source,uuid:UUID.source,opaqueHex:OPAQUE_HEX.source,placeholder:PLACEHOLDER.source,maxLength:180});
export function blocked(code, detail = {}, canonicalPath) {
  // Blocked outcomes deliberately do not contain href, route, url or an empty string fallback.
  return freeze({ ok: false, recordRole: 'unknown', code, ...detail, ...(canonicalPath ? { canonicalPath } : {}) });
}
export function recordKey(collection, row) {
  return collection && row && typeof row._id === 'string' && row._id ? `${collection}:${row._id}` : null;
}
export function isSemanticSlug(value) {
  return typeof value === 'string' && value.length <= 180 && SLUG.test(value) && !UUID.test(value) && !OPAQUE_HEX.test(value) && !PLACEHOLDER.test(value);
}
export function isLegacyPath(path) { return typeof path === 'string' && FORBIDDEN.test(path); }
export function buildCanonical(kind, fields = {}) {
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
export function parseCanonical(input) {
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
export function createRouteContext({ entries = [], endpoints = {}, venueRouteKinds = {}, guides = [], sourceIssues = [], landings = {}, sourceGroups = [], groupRecords = {}, recordRoles = {}, recordPolicies = {}, now = Date.now() } = {}) {
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
export function gateCanonical(built, key, context = createRouteContext()) {
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
export function isPublicRecord(row, surface = 'detail') {
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

export function recordRole(collection, row, context = createRouteContext()) {
  const key = recordKey(collection, row);
  const explicit = key && context.recordRoles?.[key];
  if (['business','offer'].includes(explicit)) return explicit;
  if (key && (context.venueRouteKinds[key] || context.groupsBySource?.[key])) return 'business';
  if (['Venues','NearbyAttractions','FoodAndDrink','HotelGuides','Locations','ClassicFruitMachines'].includes(collection)) return 'business';
  if (['HotelOffers','WowcherOffers'].includes(collection)) return 'offer';
  return 'unknown';
}
export function resolveRecord(collection, row, context = createRouteContext(), options = {}) {
  const result = resolveRecordInternal(collection, row, context, options);
  const role = recordRole(collection, row, context), policy = context.recordPolicies?.[result.key || recordKey(collection,row)];
  return freeze({ ...result, ...(policy ? {routeType:policy.routeType,contentNotice:policy.notice,offerActionsAllowed:policy.offerActionsAllowed!==false,discoveryAllowed:policy.promoteInCurrentDiscovery!==false,indexable:policy.indexable!==false} : {}), recordRole: role === 'unknown' && collection === 'AffiliateOffers' && result.ok ? 'offer' : role });
}
