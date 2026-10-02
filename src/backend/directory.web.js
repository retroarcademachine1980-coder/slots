import { publicRouteModel, loadRouteContext, routeSummary } from 'backend/canonicalRouteService';
import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';
import { normalizeSearch } from 'backend/searchText';

function plain(value) {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function imageValue(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.url || '';
}

function pageSlice(rows, options = {}) {
    rows=rows.filter(row=>row.discoveryAllowed!==false);
    const offset = Math.max(0, Number(options.offset) || 0);
    const limit = Math.max(1, Math.min(200, Number(options.limit) || 60));
    return {
        total: rows.length,
        ...routeSummary(rows),
        offset,
        limit,
        hasMore: offset + limit < rows.length,
        results: rows.slice(offset, offset + limit)
    };
}

async function allRows(collection, max = 5000) {
    let page = await wixData.query(collection).limit(1000).find();
    const rows = [...(page.items || [])];

    while (page.hasNext && page.hasNext() && rows.length < max) {
        page = await page.next();
        rows.push(...(page.items || []));
    }

    return rows;
}

function matches(row, query) {
    const q = normalizeSearch(query);
    return !q || String(row.unifiedSearchText || '').includes(q);
}

function venuePublic(row) {
    const status = String(row.status || '').toLowerCase();
    return row.title && !/duplicate|closed - historical|not a separate venue/.test(status);
}

function locationPublic(row) {
    const status = String(row.locationStatus || '').toLowerCase();
    return row.title && !/archived|hold|research in progress/.test(status);
}

function attractionPublic(row) {
    const status = String(row.researchStatus || '').toLowerCase();
    return row.title && !/duplicate|not open to general public|research retained/.test(status);
}

function machinePublic(row) {
    const status = String(row.variantStatus || '').toLowerCase();
    return row.title && !/merged|duplicate|remove|rejected/.test(status);
}

function venueCard(row, routeContext) {
    return {
        _id: 'venue:' + row._id,
        title: row.title || '',
        subtitle: row.locationName || row.postcode || '',
        category: row.venueType || row.mapPrimaryCategory || 'Venue',
        description: plain(row.shortDescription || row.seoDescription || row.overview).slice(0, 280),
        image: imageValue(row.heroImage),
        alt: row.exteriorImageAlt || row.title || '',
        ...publicRouteModel('Venues', row, routeContext),
        location: row.locationName || ''
    };
}

function locationCard(row, routeContext) {
    return {
        _id: 'location:' + row._id,
        title: row.title || '',
        subtitle: [row.county, row.region].filter(Boolean).join(' · '),
        category: row.locationType || 'Destination',
        description: plain(row.shortDescription || row.raiderDestinationSummary || row.overview).slice(0, 280),
        image: imageValue(row.heroImage),
        alt: row.heroImageAlt || row.title || '',
        ...publicRouteModel('Locations', row, routeContext),
        location: row.title || ''
    };
}

function recommendationCard(row, routeContext) {
    return {
        _id: 'recommendation:' + row._id,
        title: row.displayTitle || row.name || row.offerTitle || '',
        subtitle: row.locationName || row.destination || '',
        category: row.category || 'Recommendation',
        description: plain(row.summary || row.offerText).slice(0, 280),
        image: imageValue(row.dealImage || row.image),
        alt: row.imageAlt || row.displayTitle || row.name || '',
        ...publicRouteModel('AffiliateOffers', row, routeContext),
        location: row.locationName || row.destination || ''
    };
}

function hotelCard(row, routeContext) {
    return {
        _id: 'hotel:' + row._id,
        title: row.title || '',
        subtitle: row.locationName || row.destination || '',
        category: 'Hotel',
        description: plain(row.guideDetails || row.guideContent).slice(0, 280),
        image: imageValue(row.image),
        alt: row.imageAlt || row.title || '',
        ...publicRouteModel('HotelGuides', row, routeContext),
        location: row.locationName || row.destination || ''
    };
}

function attractionCard(row, routeContext) {
    return {
        _id: 'attraction:' + row._id,
        title: row.title || '',
        subtitle: row.locationName || row.postcode || '',
        category: row.category || 'Thing to do',
        description: plain(row.shortDescription).slice(0, 280),
        image: imageValue(row.heroImage),
        alt: row.title || '',
        ...publicRouteModel('NearbyAttractions', row, routeContext),
        location: row.locationName || ''
    };
}

function machineCard(row, routeContext) {
    return {
        _id: 'machine:' + row._id,
        title: row.title || '',
        subtitle: [row.manufacturer, row.variantName].filter(Boolean).join(' · '),
        category: row.machineType || 'Classic fruit machine',
        description: plain(row.seoDescription || row.history).slice(0, 280),
        image: imageValue(row.cardImage || row.heroImage),
        alt: row.title || '',
        ...publicRouteModel('ClassicFruitMachines', row, routeContext),
        location: ''
    };
}

export const listVenues = webMethod(Permissions.Anyone, async (options = {}) => {
    const routeContext = await loadRouteContext({ offers: true });
    const query = String(options.query || '').trim();
    const location = normalizeSearch(options.location || '');
    const category = normalizeSearch(options.category || '');

    let rows = (await allRows('Venues'))
        .filter(venuePublic)
        .filter(row => matches(row, query));

    if (location) {
        rows = rows.filter(row => normalizeSearch(row.locationName).includes(location));
    }

    if (category) {
        rows = rows.filter(row =>
            normalizeSearch(row.venueType).includes(category) ||
            normalizeSearch(row.mapPrimaryCategory).includes(category)
        );
    }

    rows.sort((a, b) =>
        Number(b.featured === true) - Number(a.featured === true) ||
        String(a.title || '').localeCompare(String(b.title || ''))
    );

    return pageSlice(rows.map(row => venueCard(row, routeContext)), options);
});

export const listLocations = webMethod(Permissions.Anyone, async (options = {}) => {
    const routeContext = await loadRouteContext({ offers: true });
    const query = String(options.query || '').trim();

    const rows = (await allRows('Locations'))
        .filter(locationPublic)
        .filter(row => matches(row, query))
        .sort((a, b) =>
            Number(b.featured === true) - Number(a.featured === true) ||
            String(a.title || '').localeCompare(String(b.title || ''))
        )
        .map(row => locationCard(row, routeContext));

    return pageSlice(rows, options);
});

export const listRecommendations = webMethod(Permissions.Anyone, async (options = {}) => {
    const routeContext = await loadRouteContext({ offers: true });
    const query = String(options.query || '').trim();
    const category = normalizeSearch(options.category || '');

    let rows = (await allRows('AffiliateOffers', 3000))
        .filter(row => String(row.offerRecordType || '').toUpperCase() !== 'HOTEL_OFFER')
        .filter(row => row.displayTitle || row.name || row.offerTitle)
        .filter(row => matches(row, query));

    if (category) {
        rows = rows.filter(row => normalizeSearch(row.category).includes(category));
    }

    rows.sort((a, b) =>
        Number(b.featured === true) - Number(a.featured === true) ||
        String(a.displayTitle || a.name || '').localeCompare(String(b.displayTitle || b.name || ''))
    );

    return pageSlice(rows.map(row => recommendationCard(row, routeContext)), options);
});

export const listAttractions = webMethod(Permissions.Anyone, async (options = {}) => {
    const routeContext = await loadRouteContext({ offers: true });
    const query = String(options.query || '').trim();

    const rows = (await allRows('NearbyAttractions', 3000))
        .filter(attractionPublic)
        .filter(row => matches(row, query))
        .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
        .map(row => attractionCard(row, routeContext));

    return pageSlice(rows, options);
});

export const listMachines = webMethod(Permissions.Anyone, async (options = {}) => {
    const routeContext = await loadRouteContext({ offers: true });
    const query = String(options.query || '').trim();
    const manufacturer = normalizeSearch(options.manufacturer || '');

    let rows = (await allRows('ClassicFruitMachines', 5000))
        .filter(machinePublic)
        .filter(row => matches(row, query));

    if (manufacturer) {
        rows = rows.filter(row =>
            normalizeSearch(row.manufacturer).includes(manufacturer) ||
            (Array.isArray(row.manufacturers) &&
                row.manufacturers.some(value => normalizeSearch(value).includes(manufacturer)))
        );
    }

    rows.sort((a, b) =>
        Number(b.featured === true) - Number(a.featured === true) ||
        String(a.title || '').localeCompare(String(b.title || ''))
    );

    return pageSlice(rows.map(row => machineCard(row, routeContext)), options);
});

export const listPartners = webMethod(Permissions.Anyone, async (options = {}) => {
    const routeContext = await loadRouteContext({ offers: true });
    const query = String(options.query || '').trim();

    const rows = (await allRows('AffiliatePartners', 1000))
        .filter(row => row.active !== false && row.title)
        .filter(row => matches(row, query))
        .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
        .map(row => ({
            _id: 'partner:' + row._id,
            title: row.title || '',
            subtitle: '',
            category: 'Partner',
            description: plain(row.offerSummary).slice(0, 280),
            image: '',
            alt: row.title || '',
            ...publicRouteModel('AffiliatePartners', row, routeContext),
            location: ''
        }));

    return pageSlice(rows, options);
});

export const getMapPins = webMethod(Permissions.Anyone, async (options = {}) => {
    const routeContext = await loadRouteContext({ offers: true });
    const query = String(options.query || '').trim();

    const [venues, attractions] = await Promise.all([
        allRows('Venues'),
        allRows('NearbyAttractions', 3000)
    ]);

    const venuePins = venues
        .filter(venuePublic)
        .filter(row => Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)))
        .filter(row => matches(row, query))
        .map(row => ({
            _id: 'venue:' + row._id,
            kind: 'venue',
            title: row.title || '',
            location: row.locationName || '',
            category: row.mapPrimaryCategory || row.venueType || 'Venue',
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            ...publicRouteModel('Venues', row, routeContext),
            image: imageValue(row.heroImage),
            alt: row.exteriorImageAlt || row.title || ''
        }));

    const attractionPins = attractions
        .filter(attractionPublic)
        .filter(row => Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)))
        .filter(row => matches(row, query))
        .map(row => ({
            _id: 'attraction:' + row._id,
            kind: 'attraction',
            title: row.title || '',
            location: row.locationName || '',
            category: row.category || 'Thing to do',
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            ...publicRouteModel('NearbyAttractions', row, routeContext),
            image: imageValue(row.heroImage),
            alt: row.title || ''
        }));

    return {
        total: [...venuePins,...attractionPins].filter(row=>row.discoveryAllowed!==false).length,
        ...routeSummary([...venuePins, ...attractionPins]),
        pins: [...venuePins, ...attractionPins].filter(row=>row.discoveryAllowed!==false)
    };
});

export const listHotels = webMethod(Permissions.Anyone, async (options = {}) => {
    const routeContext = await loadRouteContext({ offers: true });
    const query = String(options.query || '').trim();
    const location = normalizeSearch(options.location || '');

    let rows = (await allRows('HotelGuides', 3000))
        .filter(row => row.active !== false && row.title)
        .filter(row => matches(row, query));

    if (location) {
        rows = rows.filter(row =>
            normalizeSearch(row.locationName).includes(location) ||
            normalizeSearch(row.destination).includes(location) ||
            normalizeSearch(row.locationSlug).includes(location)
        );
    }

    rows.sort((a, b) =>
        Number(b.offerCount || 0) - Number(a.offerCount || 0) ||
        String(a.title || '').localeCompare(String(b.title || ''))
    );

    return pageSlice(rows.map(row => hotelCard(row, routeContext)), options);
});
