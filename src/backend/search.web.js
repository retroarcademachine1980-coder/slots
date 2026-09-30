import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';
import { normalizeSearch } from 'backend/searchText';

const SOURCES = [
    {
        collection: 'Locations', kind: 'location',
        title: ['title'], subtitle: ['county','region'], category: ['locationType'],
        description: ['shortDescription','raiderDestinationSummary','seoDescription'],
        image: ['heroImage'], alt: ['heroImageAlt'], route: ['link-arcade-locations-title'],
        location: ['title']
    },
    {
        collection: 'Venues', kind: 'venue',
        title: ['title'], subtitle: ['locationName','postcode'], category: ['venueType','mapPrimaryCategory'],
        description: ['shortDescription','seoDescription','overview'],
        image: ['heroImage'], alt: ['exteriorImageAlt'], route: ['link-arcade-venues-title'],
        location: ['locationName']
    },
    {
        collection: 'NearbyAttractions', kind: 'attraction',
        title: ['title'], subtitle: ['locationName','postcode'], category: ['category'],
        description: ['shortDescription'], image: ['heroImage'], alt: ['title'],
        location: ['locationName'],
        routeBuilder: row => row.locationSlug && row.slug
            ? '/arcade-locations/' + row.locationSlug + '#' + row.slug
            : (row.website || row.googleMapsUrl || '')
    },
    {
        collection: 'DestinationRecommendations', kind: 'recommendation',
        title: ['displayTitle','name','offerTitle'],
        subtitle: ['displaySubtitle','locationName','destination'], category: ['category'],
        description: ['summary','offerText'], image: ['dealImage','image'], alt: ['imageAlt'],
        routeBuilder: recommendationRoute,
        location: ['locationName','destination']
    },
    {
        collection: 'WowcherOffers', kind: 'offer',
        title: ['title'], subtitle: ['destination'], category: ['offerType'],
        description: ['description'], image: ['image'], alt: ['imageAlt'],
        route: ['affiliateUrl'], location: ['destination']
    },
    {
        collection: 'Guides', kind: 'guide',
        title: ['title'], subtitle: ['guideType'], category: ['guideType'],
        description: ['summary','seoDescription'], image: [], alt: [],
        routeBuilder: row => row.slug ? '/guides/' + row.slug : '', location: []
    },
    {
        collection: 'SpinRaidersVideos', kind: 'video',
        title: ['title'], subtitle: ['venueName','locationName','channelName'], category: ['channelName'],
        description: ['seoSummary','seoDescription'], image: ['thumbnail'], alt: ['title'],
        routeBuilder: row => row.slug ? '/raidertube/' + row.slug : (row.youtubeUrl || ''),
        location: ['locationName']
    },
    {
        collection: 'ClassicFruitMachines', kind: 'machine',
        title: ['title'], subtitle: ['manufacturer','variantName'], category: ['machineType'],
        description: ['seoDescription','history'], image: ['cardImage','heroImage'], alt: ['title'],
        route: ['link-classic-fruit-machine-archive-1-title','link-classic-fruit-machine-archive-all'],
        location: []
    },
    {
        collection: 'ClassicFruitMachineFamilies', kind: 'machine-family',
        title: ['title'], subtitle: [], category: [], description: ['seoDescription'],
        image: [], alt: [], route: ['link-classic-fruit-machine-families-all'], location: []
    },
    {
        collection: 'ClassicMachineSightings', kind: 'sighting',
        title: ['machineName'], subtitle: ['venueName','town'], category: ['availabilityStatus'],
        description: ['sourcePostText','notes'], image: ['sourceImageUrl'], alt: ['machineName'],
        routeBuilder: row => row.venuePageSlug ? '/arcade-venues/' + row.venuePageSlug : '',
        location: ['town','countyRegion']
    },
    {
        collection: 'Manufacturers', kind: 'manufacturer',
        title: ['title'], subtitle: [], category: [], description: ['shortDescription','seoDescription'],
        image: [], alt: [], route: ['link-fruit-machine-manufacturers-all'], location: []
    },
    {
        collection: 'Machines', kind: 'machine-directory',
        title: ['title'], subtitle: ['manufacturer'], category: ['machineType'],
        description: ['seoDescription'], image: [], alt: [],
        routeBuilder: row => row.slug ? '/machines/' + row.slug : '', location: ['knownLocations']
    },
    {
        collection: 'AffiliatePartners', kind: 'partner',
        title: ['title'], subtitle: [], category: [], description: ['offerSummary'],
        image: [], alt: [], route: ['reviewPath','affiliateUrl','link-affiliate-partners-all'], location: []
    }
];

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function first(row, fields) {
    for (const field of fields || []) {
        const value = row && row[field];
        if (Array.isArray(value) && value.length) return value.join(', ');
        if (value !== undefined && value !== null && String(value).trim()) return value;
    }
    return '';
}

function imageValue(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.url || '';
}

function plain(value) {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function recommendationRoute(row) {
    const id = String(row && row._id || '').trim();
    const linkType = String(row && row.linkType || '').toUpperCase();
    if (id && (row.guideReady === true || linkType.startsWith('SPIN RAIDERS'))) {
        return '/destination-recommendations?collection=DestinationRecommendations&place=' + encodeURIComponent(id);
    }
    return String(
        row.affiliateUrl ||
        row.outboundUrl ||
        row.bookingUrl ||
        row.offerUrl ||
        row.website ||
        ''
    );
}

function routeFor(row, source) {
    if (source.routeBuilder) return source.routeBuilder(row) || '';
    return first(row, source.route || []);
}

function statusText(row) {
    return normalizeSearch(
        row.status || row.locationStatus || row.researchStatus || row.variantStatus || ''
    );
}

function isPublicRow(source, row) {
    if (!row) return false;
    const status = statusText(row);

    if (source.collection === 'Venues') {
        return !!row.title && !/duplicate|closed historical|not a separate venue/.test(status);
    }
    if (source.collection === 'Locations') {
        return !!row.title && !/archived|hold|research in progress/.test(status);
    }
    if (source.collection === 'NearbyAttractions') {
        return !!row.title && !/duplicate|not open to general public|research retained/.test(status);
    }
    if (source.collection === 'WowcherOffers') return row.active !== false;
    if (source.collection === 'SpinRaidersVideos') return row.active !== false;
    if (source.collection === 'ClassicFruitMachines') {
        return !!row.title && !/merged|duplicate|remove|rejected/.test(status);
    }
    if (source.collection === 'ClassicMachineSightings') return row.publicDisplay !== false;
    if (source.collection === 'AffiliatePartners') return row.active !== false;

    return !!first(row, source.title);
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
    const clean = normalizeSearch(input);
    const forms = [clean];
    const aliases = await loadAliases();

    for (const entry of aliases) {
        const family = unique([
            normalizeSearch(entry.title),
            ...entry.aliases.map(normalizeSearch)
        ]);

        if (family.some(term => term && (term === clean || clean.includes(term)))) {
            forms.push(...family);
        }
    }

    return unique(forms);
}

function makeMatch(collection, forms) {
    let match = null;
    for (const form of forms) {
        if (!form || form.length < 2) continue;
        const part = wixData.query(collection).contains('unifiedSearchText', form);
        match = match ? match.or(part) : part;
    }
    return match;
}

function scoreRow(row, source, input, forms) {
    const q = normalizeSearch(input);
    const title = normalizeSearch(first(row, source.title));
    const location = normalizeSearch(first(row, source.location));
    const category = normalizeSearch(first(row, source.category));
    const haystack = String(row.unifiedSearchText || '');
    const terms = q.split(' ').filter(Boolean);

    let score = 0;

    if (title === q) score += 1500;
    else if (title.startsWith(q)) score += 1050;
    else if (title.includes(q)) score += 850;

    if (location === q) score += 1000;
    else if (location.includes(q)) score += 650;

    if (category === q) score += 850;
    else if (category.includes(q)) score += 450;

    if (haystack.includes(q)) score += 500;
    if (terms.length && terms.every(term => haystack.includes(term))) score += 300;

    for (const form of forms) {
        if (form && form !== q && haystack.includes(form)) score += 180;
    }

    if (row.featured === true) score += 30;
    return score;
}

function makeCard(row, source, score) {
    const title = String(first(row, source.title) || '');

    return {
        _id: source.kind + ':' + String(row._id || title),
        sourceId: String(row._id || ''),
        sourceCollection: source.collection,
        kind: source.kind,
        title,
        subtitle: String(first(row, source.subtitle) || ''),
        category: String(first(row, source.category) || source.kind),
        description: plain(first(row, source.description)).slice(0, 280),
        image: imageValue(first(row, source.image)),
        alt: String(first(row, source.alt) || title),
        route: String(routeFor(row, source) || ''),
        location: String(first(row, source.location) || ''),
        score
    };
}

async function searchSource(source, input, forms) {
    const match = makeMatch(source.collection, forms);
    if (!match) return [];

    try {
        let page = await match.limit(1000).find();
        const rows = [...(page.items || [])];

        while (page.hasNext && page.hasNext() && rows.length < 5000) {
            page = await page.next();
            rows.push(...(page.items || []));
        }

        return rows
            .filter(row => isPublicRow(source, row))
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
        const routeKey = normalizeSearch(card.route);
        const titleKey = normalizeSearch(card.title + ' ' + card.location);
        const key = routeKey || titleKey || card._id;
        const existing = seen.get(key);

        if (!existing || card.score > existing.score) {
            seen.set(key, card);
        }
    }

    return [...seen.values()];
}

export async function runUnifiedSearchInternal(input, options = {}) {
    const query = String(input || '').trim().slice(0, 120);

    if (!query) {
        return { query: '', total: 0, results: [], groups: {} };
    }

    const forms = await queryForms(query);
    const jobs = await Promise.allSettled(
        SOURCES.map(source => searchSource(source, query, forms))
    );

    const cards = jobs.flatMap(result =>
        result.status === 'fulfilled' ? result.value : []
    );

    const allResults = dedupe(cards)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

    const total = allResults.length;
    const offset = Math.max(0, Number(options.offset) || 0);
    const limit = Math.max(1, Math.min(3000, Number(options.limit) || 100));
    const results = allResults.slice(offset, offset + limit);

    const groups = {};
    for (const card of allResults) {
        groups[card.kind] = (groups[card.kind] || 0) + 1;
    }

    return {
        query,
        total,
        offset,
        limit,
        hasMore: offset + results.length < total,
        results,
        groups
    };
}

export const searchEverything = webMethod(
    Permissions.Anyone,
    async (input, options = {}) => runUnifiedSearchInternal(input, options)
);

export const getSearchSuggestions = webMethod(Permissions.Anyone, async (input, limit = 12) => {
    const query = String(input || '').trim().slice(0, 80);
    if (query.length < 2) return [];

    const result = await runUnifiedSearchInternal(query, {
        limit: Math.max(20, Math.min(100, Number(limit) || 12))
    });

    const seen = new Set();
    const suggestions = [];

    for (const card of result.results) {
        const key = normalizeSearch(card.title);
        if (!key || seen.has(key)) continue;
        seen.add(key);

        suggestions.push({
            _id: 'suggestion:' + card._id,
            label: card.title,
            kind: card.kind,
            subtitle: card.subtitle || card.location || '',
            route: card.route || '',
            searchValue: card.title
        });

        if (suggestions.length >= Math.max(1, Math.min(20, Number(limit) || 12))) break;
    }

    return suggestions;
});

export const getLocationBundle = webMethod(Permissions.Anyone, async (locationName, options = {}) => {
    const result = await runUnifiedSearchInternal(locationName, {
        limit: Math.max(100, Math.min(1500, Number(options.limit) || 750))
    });

    const q = normalizeSearch(locationName);
    const destination = result.results.find(card =>
        card.kind === 'location' && normalizeSearch(card.title) === q
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
        else if (card.kind === 'guide') sections.guides.push(card);
        else if (['machine','machine-family','machine-directory','sighting','manufacturer'].includes(card.kind)) {
            sections.machines.push(card);
        } else {
            sections.other.push(card);
        }
    }

    return {
        query: result.query,
        destination,
        total: result.total,
        groups: result.groups,
        sections
    };
});

export const browseDirectory = webMethod(Permissions.Anyone, async (filters = {}) => {
    const query = String(filters.query || filters.location || filters.category || '').trim();
    const limit = Math.max(1, Math.min(500, Number(filters.limit) || 100));
    const offset = Math.max(0, Number(filters.offset) || 0);
    const kinds = Array.isArray(filters.kinds) ? filters.kinds.map(String) : [];
    const location = normalizeSearch(filters.location || '');
    const category = normalizeSearch(filters.category || '');

    const result = query
        ? await runUnifiedSearchInternal(query, { limit: 3000 })
        : { results: [] };

    let rows = result.results || [];

    if (kinds.length) {
        const allowed = new Set(kinds);
        rows = rows.filter(card => allowed.has(card.kind));
    }

    if (location) {
        rows = rows.filter(card =>
            normalizeSearch(card.location).includes(location) ||
            normalizeSearch(card.subtitle).includes(location) ||
            normalizeSearch(card.title).includes(location)
        );
    }

    if (category) {
        rows = rows.filter(card =>
            normalizeSearch(card.category).includes(category) ||
            normalizeSearch(card.title).includes(category) ||
            normalizeSearch(card.description).includes(category)
        );
    }

    return {
        total: rows.length,
        offset,
        limit,
        results: rows.slice(offset, offset + limit)
    };
});

export const publicSearchSources = webMethod(Permissions.Anyone, async () =>
    SOURCES.map(source => ({ collection: source.collection, kind: source.kind }))
);
