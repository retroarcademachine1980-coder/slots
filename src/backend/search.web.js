import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';

function clean(value) {
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

function tokens(value) {
    return clean(value).split(' ').filter(Boolean);
}

function queryForms(value) {
    const raw = String(value || '').trim();
    const normalized = clean(raw);
    const titled = normalized.replace(/\b[a-z0-9]/g, char => char.toUpperCase());
    return [...new Set([raw, normalized, titled])].filter(Boolean);
}

function startsWithAny(collection, field, forms) {
    let query = null;
    for (const form of forms) {
        const part = wixData.query(collection).startsWith(field, form);
        query = query ? query.or(part) : part;
    }
    return query;
}

function containsAny(collection, field, forms) {
    let query = null;
    for (const form of forms) {
        const part = wixData.query(collection).contains(field, form);
        query = query ? query.or(part) : part;
    }
    return query;
}

function fieldText(row, fields) {
    const values = [];
    for (const field of fields) {
        const value = row[field];
        if (Array.isArray(value)) values.push(...value);
        else if (value !== undefined && value !== null) values.push(value);
    }
    return clean(values.join(' '));
}

function rank(row, query, fields) {
    const q = clean(query);
    if (!q) return 0;
    const qTokens = tokens(q);
    const title = clean(row.title || row.displayTitle || row.name || row.offerTitle);
    const haystack = fieldText(row, fields);

    if (title === q) return 1000;
    if (Array.isArray(row.searchTerms) && row.searchTerms.some(v => clean(v) === q)) return 950;
    if (Array.isArray(row.searchAliases) && row.searchAliases.some(v => clean(v) === q)) return 950;
    if (title.startsWith(q)) return 800;

    if (qTokens.length && qTokens.every(token => haystack.split(' ').includes(token))) return 600;
    if (q.length >= 4 && haystack.includes(q)) return 400;

    return 0;
}

function safeRoute(row, kind) {
    if (kind === 'venue') return row['link-arcade-venues-title'] || '';
    if (kind === 'location') return row['link-arcade-locations-title'] || '';
    if (kind === 'machine') return row['link-classic-fruit-machine-archive-1-title'] || row['link-classic-fruit-machine-archive-all'] || '';
    if (kind === 'attraction') return row.locationSlug ? '/arcade-locations/' + row.locationSlug : '';
    if (kind === 'offer') return row.affiliateUrl || row.outboundUrl || row.offerUrl || row.bookingUrl || row.website || '';
    return '';
}

function card(row, kind) {
    return {
        _id: kind + '-' + row._id,
        id: row._id,
        kind,
        title: row.title || row.displayTitle || row.name || row.offerTitle || '',
        subtitle: row.locationName || row.destination || row.location || row.manufacturer || '',
        category: row.category || row.venueType || row.machineType || kind,
        description: String(row.shortDescription || row.summary || row.seoDescription || '').replace(/<[^>]*>/g, '').slice(0, 240),
        image: row.heroImage || row.dealImage || row.image || row.cardImage || '',
        alt: row.heroImageAlt || row.exteriorImageAlt || row.imageAlt || row.imageAltText || row.dealImageAlt || row.title || row.displayTitle || row.name || row.offerTitle || '',
        route: safeRoute(row, kind)
    };
}

async function findVenues(q) {
    let query = wixData.query('Venues')
        .eq('directoryReady', true)
        .eq('cardReady', true)
        .eq('pageReady', true);

    const forms = queryForms(q);
    const short = clean(q).length <= 3;
    let match = startsWithAny('Venues', 'title', forms)
        .or(wixData.query('Venues').hasSome('searchTerms', forms));
    if (!short) {
        match = match
            .or(containsAny('Venues', 'title', forms))
            .or(containsAny('Venues', 'locationName', forms))
            .or(containsAny('Venues', 'postcode', forms));
    }
    return (await query.and(match).limit(80).find()).items;
}

async function findLocations(q) {
    let query = wixData.query('Locations').eq('directoryReady', true);
    const forms = queryForms(q);
    const short = clean(q).length <= 3;
    let match = startsWithAny('Locations', 'title', forms)
        .or(wixData.query('Locations').hasSome('searchTerms', forms));
    if (!short) {
        match = match
            .or(containsAny('Locations', 'title', forms))
            .or(containsAny('Locations', 'county', forms))
            .or(containsAny('Locations', 'region', forms))
            .or(containsAny('Locations', 'archiveSearchText', forms))
            .or(containsAny('Locations', 'shortDescription', forms))
            .or(containsAny('Locations', 'discoveryHeading', forms));
    }
    return (await query.and(match).limit(60).find()).items;
}

async function findAttractions(q) {
    let query = wixData.query('NearbyAttractions').eq('directoryReady', true);
    const forms = queryForms(q);
    const short = clean(q).length <= 3;
    let match = startsWithAny('NearbyAttractions', 'title', forms)
        .or(wixData.query('NearbyAttractions').hasSome('searchTerms', forms));
    if (!short) {
        match = match
            .or(containsAny('NearbyAttractions', 'title', forms))
            .or(containsAny('NearbyAttractions', 'locationName', forms))
            .or(containsAny('NearbyAttractions', 'category', forms));
    }
    return (await query.and(match).limit(60).find()).items;
}

async function findOffers(q) {
    let query = wixData.query('DestinationRecommendations').eq('cardReady', true);
    const forms = queryForms(q);
    const short = clean(q).length <= 3;
    let match = startsWithAny('DestinationRecommendations', 'name', forms)
        .or(startsWithAny('DestinationRecommendations', 'displayTitle', forms));
    if (!short) {
        match = match
            .or(containsAny('DestinationRecommendations', 'name', forms))
            .or(containsAny('DestinationRecommendations', 'displayTitle', forms))
            .or(containsAny('DestinationRecommendations', 'destination', forms))
            .or(containsAny('DestinationRecommendations', 'locationName', forms))
            .or(containsAny('DestinationRecommendations', 'category', forms));
    }
    return (await query.and(match).limit(60).find()).items;
}

async function findMachines(q) {
    let query = wixData.query('ClassicFruitMachines').eq('active', true);
    const forms = queryForms(q);
    const short = clean(q).length <= 3;
    let match = startsWithAny('ClassicFruitMachines', 'title', forms)
        .or(wixData.query('ClassicFruitMachines').hasSome('searchAliases', forms))
        .or(wixData.query('ClassicFruitMachines').hasSome('aliases', forms));
    if (!short) {
        match = match
            .or(containsAny('ClassicFruitMachines', 'title', forms))
            .or(containsAny('ClassicFruitMachines', 'manufacturer', forms))
            .or(containsAny('ClassicFruitMachines', 'searchText', forms));
    }
    return (await query.and(match).limit(60).find()).items;
}

export const searchDirectory = webMethod(Permissions.Anyone, async (input, limit = 40) => {
    const query = String(input || '').trim().slice(0, 120);
    if (!query) return { query: '', results: [], total: 0 };

    const jobs = await Promise.allSettled([
        findVenues(query),
        findLocations(query),
        findAttractions(query),
        findOffers(query),
        findMachines(query)
    ]);

    const sets = jobs.map(result => result.status === 'fulfilled' ? result.value : []);
    const kinds = ['venue', 'location', 'attraction', 'offer', 'machine'];
    const fields = {
        venue: ['title', 'searchTerms', 'locationName', 'brand', 'operator', 'postcode', 'venueType'],
        location: ['title', 'searchTerms', 'archiveSearchText', 'county', 'region', 'locationType', 'shortDescription', 'seoTitle', 'seoDescription', 'discoveryHeading', 'knownFor', 'bestFor', 'featuredVenueNames'],
        attraction: ['title', 'searchTerms', 'locationName', 'category', 'parentVenue', 'tags'],
        offer: ['name', 'displayTitle', 'destination', 'locationName', 'category'],
        machine: ['title', 'searchAliases', 'aliases', 'manufacturer', 'searchText', 'machineType']
    };

    const ranked = [];
    sets.forEach((rows, index) => {
        const kind = kinds[index];
        rows.forEach(row => {
            const score = rank(row, query, fields[kind]);
            if (score > 0) ranked.push({ score, card: card(row, kind) });
        });
    });

    const unique = new Map();
    ranked
        .sort((a, b) => b.score - a.score || a.card.title.localeCompare(b.card.title))
        .forEach(item => {
            const key = item.card.kind + ':' + item.card.id;
            if (!unique.has(key)) unique.set(key, item.card);
        });

    const max = Math.max(1, Math.min(60, Number(limit) || 40));
    const results = [...unique.values()].slice(0, max);
    return { query, results, total: results.length };
});
