import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';

/*
 * Spin Raiders clean unified discovery engine.
 *
 * Principles:
 * - One public search contract for every page/card.
 * - CMS is the source of truth.
 * - New CMS records become searchable automatically.
 * - Search is location-aware and category-aware across collections.
 * - Internal/member/audit collections are never searched.
 * - Results are normalized into one card shape and deduplicated.
 */

const SOURCES = [
    {
        collection: 'Locations',
        kind: 'location',
        text: ['title', 'slug', 'county', 'region', 'locationType', 'shortDescription', 'seoTitle', 'seoDescription', 'archiveSearchText', 'discoveryHeading', 'raiderDestinationSummary', 'knownFor', 'bestFor', 'featuredVenueNames', 'venueTypes'],
        arrays: ['searchTerms', 'knownFor', 'bestFor', 'featuredVenueNames', 'venueTypes'],
        required: { directoryReady: true },
        title: ['title'],
        subtitle: ['county', 'region'],
        category: ['locationType'],
        description: ['shortDescription', 'raiderDestinationSummary', 'seoDescription'],
        image: ['heroImage'],
        alt: ['heroImageAlt'],
        route: ['link-arcade-locations-title'],
        location: ['title']
    },
    {
        collection: 'Venues',
        kind: 'venue',
        text: ['title', 'slug', 'operator', 'brand', 'locationName', 'locationSlug', 'postcode', 'venueType', 'shortDescription', 'seoTitle', 'seoDescription', 'mapSearchText', 'mapPrimaryCategory', 'machineTypesSummary', 'amenitiesSummary', 'formerNames', 'historySummary'],
        arrays: ['searchTerms', 'mapTags', 'machineTypes', 'formerNames'],
        required: { directoryReady: true, pageReady: true },
        title: ['title'],
        subtitle: ['locationName', 'postcode'],
        category: ['venueType', 'mapPrimaryCategory'],
        description: ['shortDescription', 'seoDescription'],
        image: ['heroImage'],
        alt: ['exteriorImageAlt'],
        route: ['link-arcade-venues-title'],
        location: ['locationName']
    },
    {
        collection: 'NearbyAttractions',
        kind: 'attraction',
        text: ['title', 'slug', 'locationName', 'locationSlug', 'category', 'postcode', 'shortDescription', 'sourceName'],
        arrays: ['searchTerms', 'tags', 'facilities'],
        required: { directoryReady: true },
        title: ['title'],
        subtitle: ['locationName', 'postcode'],
        category: ['category'],
        description: ['shortDescription'],
        image: ['heroImage'],
        alt: ['title'],
        routeBuilder: row => row.locationSlug && row.slug ? '/arcade-locations/' + row.locationSlug + '#' + row.slug : '',
        location: ['locationName']
    },
    {
        collection: 'DestinationRecommendations',
        kind: 'recommendation',
        text: ['name', 'displayTitle', 'displaySubtitle', 'destination', 'destinationSlug', 'locationName', 'locationSlug', 'category', 'summary', 'offerTitle', 'offerText'],
        arrays: [],
        required: { cardReady: true },
        title: ['displayTitle', 'name', 'offerTitle'],
        subtitle: ['displaySubtitle', 'locationName', 'destination'],
        category: ['category'],
        description: ['summary', 'offerText'],
        image: ['dealImage', 'image'],
        alt: ['imageAlt'],
        route: ['affiliateUrl', 'outboundUrl', 'bookingUrl', 'offerUrl', 'website'],
        location: ['locationName', 'destination']
    },
    {
        collection: 'WowcherOffers',
        kind: 'offer',
        text: ['title', 'slug', 'offerType', 'destination', 'description'],
        arrays: [],
        required: { active: true },
        title: ['title'],
        subtitle: ['destination'],
        category: ['offerType'],
        description: ['description'],
        image: ['image'],
        alt: ['imageAlt'],
        route: ['affiliateUrl'],
        location: ['destination']
    },
    {
        collection: 'Guides',
        kind: 'guide',
        text: ['title', 'slug', 'guideType', 'summary', 'seoTitle', 'seoDescription'],
        arrays: [],
        required: { ready: true },
        title: ['title'],
        subtitle: ['guideType'],
        category: ['guideType'],
        description: ['summary', 'seoDescription'],
        image: [],
        alt: [],
        routeBuilder: row => row.slug ? '/guides/' + row.slug : '',
        location: []
    },
    {
        collection: 'SpinRaidersVideos',
        kind: 'video',
        text: ['title', 'slug', 'channelName', 'locationName', 'venueName', 'seoSearchText', 'seoTitle', 'seoDescription', 'seoSummary', 'searchText'],
        arrays: ['contentTags', 'categories', 'machines'],
        required: { active: true },
        title: ['title'],
        subtitle: ['venueName', 'locationName', 'channelName'],
        category: ['channelName'],
        description: ['seoSummary', 'seoDescription'],
        image: ['thumbnail'],
        alt: ['title'],
        routeBuilder: row => row.slug ? '/raidertube/' + row.slug : row.youtubeUrl || '',
        location: ['locationName']
    },
    {
        collection: 'ClassicFruitMachines',
        kind: 'machine',
        text: ['title', 'slug', 'familyName', 'manufacturer', 'variantName', 'machineType', 'archiveSearchText', 'searchText', 'seoTitle', 'seoDescription'],
        arrays: ['searchAliases', 'aliases', 'manufacturerAliases', 'manufacturers', 'searchFacets', 'marketRegions', 'features', 'relatedMachines'],
        required: { active: true },
        title: ['title'],
        subtitle: ['manufacturer', 'variantName'],
        category: ['machineType'],
        description: ['seoDescription'],
        image: ['cardImage', 'heroImage'],
        alt: ['title'],
        route: ['link-classic-fruit-machine-archive-1-title', 'link-classic-fruit-machine-archive-all'],
        location: []
    },
    {
        collection: 'ClassicFruitMachineFamilies',
        kind: 'machine-family',
        text: ['title', 'slug', 'seoTitle', 'seoDescription', 'searchText'],
        arrays: ['knownManufacturers', 'knownVariants', 'knownCabinetFamilies', 'knownBoardFamilies'],
        required: { active: true },
        title: ['title'],
        subtitle: [],
        category: [],
        description: ['seoDescription'],
        image: [],
        alt: [],
        route: ['link-classic-fruit-machine-families-all'],
        location: []
    },
    {
        collection: 'ClassicMachineSightings',
        kind: 'sighting',
        text: ['machineName', 'manufacturer', 'venueName', 'town', 'countyRegion', 'postcode', 'searchTerms', 'availabilityStatus'],
        arrays: [],
        required: { publicDisplay: true },
        title: ['machineName'],
        subtitle: ['venueName', 'town'],
        category: ['availabilityStatus'],
        description: ['sourcePostText', 'notes'],
        image: ['sourceImageUrl'],
        alt: ['machineName'],
        routeBuilder: row => row.venuePageSlug ? '/arcade-venues/' + row.venuePageSlug : '',
        location: ['town', 'countyRegion']
    },
    {
        collection: 'Manufacturers',
        kind: 'manufacturer',
        text: ['title', 'slug', 'shortDescription', 'seoTitle', 'seoDescription'],
        arrays: [],
        required: {},
        title: ['title'],
        subtitle: [],
        category: [],
        description: ['shortDescription', 'seoDescription'],
        image: [],
        alt: [],
        route: ['link-fruit-machine-manufacturers-all'],
        location: []
    },
    {
        collection: 'Machines',
        kind: 'machine-directory',
        text: ['title', 'slug', 'manufacturer', 'machineType', 'seoTitle', 'seoDescription'],
        arrays: ['knownLocations'],
        required: { directoryReady: true },
        title: ['title'],
        subtitle: ['manufacturer'],
        category: ['machineType'],
        description: ['seoDescription'],
        image: [],
        alt: [],
        routeBuilder: row => row.slug ? '/machines/' + row.slug : '',
        location: ['knownLocations']
    },
    {
        collection: 'AffiliatePartners',
        kind: 'partner',
        text: ['title', 'slug', 'offerSummary', 'termsSummary'],
        arrays: [],
        required: { active: true },
        title: ['title'],
        subtitle: [],
        category: [],
        description: ['offerSummary'],
        image: [],
        alt: [],
        route: ['reviewPath', 'affiliateUrl', 'link-affiliate-partners-all'],
        location: []
    }
];

const WORD_ALIASES = {
    'mr ps': ['mr p', 'mr p s', "mr p's"],
    'mr p': ['mr ps', "mr p's"],
    'womtech': ['onetec', 'one tec'],
    'onetec': ['womtech', 'one tec'],
    'arcade': ['arcades', 'amusement', 'amusements', 'family entertainment centre', 'adult gaming centre', 'retro arcade', 'redemption arcade'],
    'arcades': ['arcade', 'amusement', 'amusements'],
    'hotel': ['hotels', 'accommodation', 'stay'],
    'hotels': ['hotel', 'accommodation', 'stay'],
    'food': ['restaurant', 'restaurants', 'cafe', 'cafes', 'dining'],
    'restaurant': ['restaurants', 'food', 'dining'],
    'bowling': ['bowl', 'tenpin'],
    'fruit machine': ['fruit machines', 'bandit', 'bandits'],
    'fruit machines': ['fruit machine', 'bandit', 'bandits']
};

function normalize(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[’']/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function titleCase(value) {
    return String(value || '').replace(/\b[a-z0-9]/g, c => c.toUpperCase());
}

function queryForms(input) {
    const raw = String(input || '').trim();
    const clean = normalize(raw);
    const forms = [raw, clean, titleCase(clean)];
    for (const [key, values] of Object.entries(WORD_ALIASES)) {
        if (clean === key || clean.includes(key)) {
            forms.push(...values, ...values.map(titleCase));
        }
    }
    return unique(forms);
}

function first(row, fields) {
    for (const field of fields || []) {
        const value = row[field];
        if (Array.isArray(value) && value.length) return value.join(', ');
        if (value !== undefined && value !== null && String(value).trim()) return value;
    }
    return '';
}

function allText(row, source) {
    const parts = [];
    for (const field of [...(source.text || []), ...(source.arrays || [])]) {
        const value = row[field];
        if (Array.isArray(value)) parts.push(...value);
        else if (value !== undefined && value !== null) parts.push(value);
    }
    return normalize(parts.join(' '));
}

function routeFor(row, source) {
    if (source.routeBuilder) return source.routeBuilder(row) || '';
    return first(row, source.route || []);
}

function scoreRow(row, source, input) {
    const q = normalize(input);
    if (!q) return 0;
    const terms = q.split(' ').filter(Boolean);
    const title = normalize(first(row, source.title));
    const location = normalize(first(row, source.location));
    const category = normalize(first(row, source.category));
    const haystack = allText(row, source);

    let score = 0;
    if (title === q) score += 1200;
    else if (title.startsWith(q)) score += 900;
    else if (title.includes(q)) score += 700;

    if (location === q) score += 850;
    else if (location.includes(q)) score += 500;

    if (category === q) score += 800;
    else if (category.includes(q)) score += 450;

    if (haystack.includes(q)) score += 400;
    if (terms.length && terms.every(t => haystack.split(' ').includes(t))) score += 300;

    for (const alias of queryForms(input)) {
        const a = normalize(alias);
        if (a && a !== q && haystack.includes(a)) score += 220;
    }

    if (row.featured === true) score += 20;
    return score;
}

function makeCard(row, source, score) {
    const title = String(first(row, source.title) || '');
    return {
        _id: source.kind + ':' + String(row._id || row.id || title),
        sourceId: String(row._id || row.id || ''),
        sourceCollection: source.collection,
        kind: source.kind,
        title,
        subtitle: String(first(row, source.subtitle) || ''),
        category: String(first(row, source.category) || source.kind),
        description: String(first(row, source.description) || '').replace(/<[^>]*>/g, '').slice(0, 260),
        image: first(row, source.image) || '',
        alt: String(first(row, source.alt) || title),
        route: String(routeFor(row, source) || ''),
        location: String(first(row, source.location) || ''),
        score
    };
}

function buildMatch(source, forms) {
    let match = null;

    const add = part => {
        match = match ? match.or(part) : part;
    };

    for (const field of source.text || []) {
        for (const form of forms) {
            if (String(form).length >= 2) add(wixData.query(source.collection).contains(field, form));
        }
    }

    for (const field of source.arrays || []) {
        add(wixData.query(source.collection).hasSome(field, forms));
    }

    return match;
}

async function searchSource(source, input) {
    const forms = queryForms(input);
    let query = wixData.query(source.collection);

    for (const [field, value] of Object.entries(source.required || {})) {
        query = query.eq(field, value);
    }

    const match = buildMatch(source, forms);
    if (!match) return [];

    try {
        const result = await query.and(match).limit(100).find();
        return (result.items || [])
            .map(row => ({ row, score: scoreRow(row, source, input) }))
            .filter(item => item.score > 0)
            .map(item => makeCard(item.row, source, item.score));
    } catch (_) {
        return [];
    }
}

function dedupe(cards) {
    const seen = new Map();
    for (const card of cards) {
        const routeKey = normalize(card.route);
        const titleKey = normalize(card.title + ' ' + card.location);
        const key = routeKey || titleKey || card._id;
        const existing = seen.get(key);
        if (!existing || card.score > existing.score) seen.set(key, card);
    }
    return [...seen.values()];
}

export const searchEverything = webMethod(Permissions.Anyone, async (input, options = {}) => {
    const query = String(input || '').trim().slice(0, 120);
    if (!query) {
        return {
            query: '',
            total: 0,
            results: [],
            groups: {}
        };
    }

    const jobs = await Promise.allSettled(
        SOURCES.map(source => searchSource(source, query))
    );

    const cards = jobs.flatMap(result =>
        result.status === 'fulfilled' ? result.value : []
    );

    const results = dedupe(cards)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
        .slice(0, Math.max(1, Math.min(200, Number(options.limit) || 100)));

    const groups = {};
    for (const card of results) {
        groups[card.kind] = (groups[card.kind] || 0) + 1;
    }

    return {
        query,
        total: results.length,
        results,
        groups
    };
});

export const publicSearchSources = webMethod(Permissions.Anyone, async () =>
    SOURCES.map(source => ({
        collection: source.collection,
        kind: source.kind
    }))
);
