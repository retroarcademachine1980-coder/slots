// Wix deployment sync: clean rebuild 2026-09-22
import wixData from 'wix-data';
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
        route: ['affiliateUrl','outboundUrl','bookingUrl','offerUrl','website'],
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
