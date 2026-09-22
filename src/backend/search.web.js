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

async function loadAliases() {
    try {
        const result = await wixData.query('SearchAliases')
            .eq('active', true)
            .limit(1000)
            .find();

        return (result.items || []).map(row => ({
            title: String(row.title || '').trim(),
            aliases: Array.isArray(row.aliases) ? row.aliases : []
        }));
    } catch (_) {
        return [];
    }
}

async function queryForms(input) {
    const raw = String(input || '').trim();
    const clean = normalize(raw);
    const forms = [raw, clean, titleCase(clean)];
    const aliases = await loadAliases();

    for (const entry of aliases) {
        const canonical = normalize(entry.title);
        const alternatives = entry.aliases.map(normalize).filter(Boolean);
        const family = unique([canonical, ...alternatives]);

        if (family.some(term => term === clean || clean.includes(term))) {
            forms.push(entry.title, ...entry.aliases);
            forms.push(...family, ...family.map(titleCase));
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

function scoreRow(row, source, input, forms) {
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

    for (const alias of forms) {
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

async function searchSource(source, input, forms) {
    let query = wixData.query(source.collection);

    for (const [field, value] of Object.entries(source.required || {})) {
        query = query.eq(field, value);
    }

    const match = buildMatch(source, forms);
    if (!match) return [];

    try {
        let page = await query.and(match).limit(1000).find();
        const rows = [...(page.items || [])];

        while (page.hasNext && page.hasNext() && rows.length < 5000) {
            page = await page.next();
            rows.push(...(page.items || []));
        }

        return rows
            .map(row => ({ row, score: scoreRow(row, source, input, forms) }))
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

export async function runUnifiedSearchInternal(input, options = {}) {
    const query = String(input || '').trim().slice(0, 120);
    if (!query) {
        return {
            query: '',
            total: 0,
            results: [],
            groups: {}
        };
    }

    const forms = await queryForms(query);

    const jobs = await Promise.allSettled(
        SOURCES.map(source => searchSource(source, query, forms))
    );

    const cards = jobs.flatMap(result =>
        result.status === 'fulfilled' ? result.value : []
    );

    const results = dedupe(cards)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
        .slice(0, Math.max(1, Math.min(2000, Number(options.limit) || 500)));

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
}

export const searchEverything = webMethod(Permissions.Anyone, async (input, options = {}) =>
    runUnifiedSearchInternal(input, options)
);

export const getSearchSuggestions = webMethod(Permissions.Anyone, async (input, limit = 12) => {
    const query = String(input || '').trim().slice(0, 80);
    if (query.length < 2) return [];

    const result = await runUnifiedSearchInternal(query, {
        limit: Math.max(12, Math.min(100, Number(limit) || 12))
    });

    const seen = new Set();
    const suggestions = [];

    for (const card of result.results) {
        const label = card.title;
        const key = normalize(label);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        suggestions.push({
            _id: 'suggestion:' + card._id,
            label,
            kind: card.kind,
            subtitle: card.subtitle || card.location || '',
            route: card.route || '',
            searchValue: label
        });
        if (suggestions.length >= Math.max(1, Math.min(20, Number(limit) || 12))) break;
    }

    return suggestions;
});

export const getLocationBundle = webMethod(Permissions.Anyone, async (locationName, options = {}) => {
    const result = await runUnifiedSearchInternal(locationName, {
        limit: Math.max(50, Math.min(500, Number(options.limit) || 300))
    });

    const q = normalize(locationName);
    const destination = result.results.find(card =>
        card.kind === 'location' && normalize(card.title) === q
    ) || null;

    const sections = {
        venues: [],
        attractions: [],
        hotelsAndFood: [],
        offers: [],
        videos: [],
        machines: [],
        guides: [],
        other: []
    };

    for (const card of result.results) {
        if (destination && card._id === destination._id) continue;

        if (card.kind === 'venue') sections.venues.push(card);
        else if (card.kind === 'attraction') sections.attractions.push(card);
        else if (card.kind === 'recommendation') sections.hotelsAndFood.push(card);
        else if (card.kind === 'offer' || card.kind === 'partner') sections.offers.push(card);
        else if (card.kind === 'video') sections.videos.push(card);
        else if (['machine', 'machine-family', 'machine-directory', 'sighting', 'manufacturer'].includes(card.kind)) sections.machines.push(card);
        else if (card.kind === 'guide') sections.guides.push(card);
        else sections.other.push(card);
    }

    return {
        query: result.query,
        destination,
        total: result.total,
        groups: result.groups,
        sections
    };
});

export const publicSearchSources = webMethod(Permissions.Anyone, async () =>
    SOURCES.map(source => ({
        collection: source.collection,
        kind: source.kind
    }))
);
