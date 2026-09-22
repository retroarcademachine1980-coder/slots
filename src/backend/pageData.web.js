import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';
import { runUnifiedSearchInternal } from 'backend/search.web';

function plain(value) {
    return String(value || '').replace(/<[^>]*>/g, '').trim();
}

function first(row, fields) {
    for (const field of fields) {
        const value = row && row[field];
        if (Array.isArray(value) && value.length) return value.join(', ');
        if (value !== undefined && value !== null && String(value).trim()) return value;
    }
    return '';
}

async function oneBySlug(collection, slug) {
    const value = String(slug || '').trim();
    if (!value) return null;
    const result = await wixData.query(collection).eq('slug', value).limit(1).find();
    return (result.items || [])[0] || null;
}

function venueModel(row) {
    if (!row) return null;
    return {
        _id: row._id,
        title: row.title || '',
        slug: row.slug || '',
        locationName: row.locationName || '',
        locationSlug: row.locationSlug || '',
        postcode: row.postcode || '',
        address: row.address || '',
        venueType: row.venueType || '',
        operator: row.operator || '',
        brand: row.brand || '',
        heroImage: row.heroImage || '',
        heroImageAlt: row.exteriorImageAlt || row.title || '',
        intro: plain(row.pageIntro || row.shortDescription || row.seoDescription),
        overview: plain(row.overview || row.detailedReview || row.shortDescription),
        visitorInfo: plain(row.visitorInfo),
        facilities: Array.isArray(row.facilities) ? row.facilities : [],
        features: Array.isArray(row.features) ? row.features : [],
        machineTypes: Array.isArray(row.machineTypes) ? row.machineTypes : [],
        openingHours: row.openingHours || row.openingHoursSummary || '',
        phone: row.phone || '',
        website: row.website || '',
        googleMapsUrl: row.googleMapsUrl || '',
        googleDirectionsUrl: row.googleDirectionsUrl || '',
        publicRating: row.publicRating ?? null,
        publicReviewCount: row.publicReviewCount ?? null,
        publicRatingSource: row.publicRatingSource || '',
        raiderRating: row.raiderRating ?? row.raiderScore ?? null,
        raiderRatingStatus: row.raiderRatingStatus || row.raiderScoreStatus || '',
        spinRaidersVisited: row.spinRaidersVisited === true,
        spinRaidersVideo: row.spinRaidersVideo || '',
        youtubePlaylist: row.youtubePlaylist || '',
        gallery: [
            row.galleryImage1,row.galleryImage2,row.galleryImage3,
            row.galleryImage4,row.galleryImage5,row.galleryImage6
        ].filter(Boolean),
        seoTitle: row.seoTitle || '',
        seoDescription: row.seoDescription || '',
        route: row['link-arcade-venues-title'] || ''
    };
}

function locationModel(row) {
    if (!row) return null;
    return {
        _id: row._id,
        title: row.title || '',
        slug: row.slug || '',
        county: row.county || '',
        region: row.region || '',
        country: row.country || '',
        locationType: row.locationType || '',
        seaside: row.seaside === true,
        heroImage: row.heroImage || '',
        heroImageAlt: row.heroImageAlt || row.title || '',
        heroKicker: row.heroKicker || '',
        intro: plain(row.pageIntro || row.shortDescription || row.raiderDestinationSummary),
        overview: plain(row.overview || row.raiderDestinationSummary || row.shortDescription),
        visitorInfo: plain(row.visitorInfo),
        parkingOverview: plain(row.parkingOverview),
        transportOverview: plain(row.transportOverview),
        accessibilityOverview: plain(row.accessibilityOverview),
        knownFor: Array.isArray(row.knownFor) ? row.knownFor : [],
        bestFor: Array.isArray(row.bestFor) ? row.bestFor : [],
        featuredVenueNames: Array.isArray(row.featuredVenueNames) ? row.featuredVenueNames : [],
        venueTypes: Array.isArray(row.venueTypes) ? row.venueTypes : [],
        venueCount: row.venueCount ?? null,
        heroGallery: [
            row.galleryImage1,row.galleryImage2,row.galleryImage3,
            row.galleryImage4,row.galleryImage5,row.galleryImage6
        ].filter(Boolean),
        seoTitle: row.seoTitle || '',
        seoDescription: row.seoDescription || '',
        route: row['link-arcade-locations-title'] || ''
    };
}

function machineModel(row) {
    if (!row) return null;
    return {
        _id: row._id,
        title: row.title || '',
        slug: row.slug || '',
        manufacturer: row.manufacturer || '',
        manufacturers: Array.isArray(row.manufacturers) ? row.manufacturers : [],
        familyName: row.familyName || '',
        variantName: row.variantName || '',
        machineType: row.machineType || '',
        yearReleased: row.yearReleased || row.releaseYear || null,
        era: row.era || row.releaseDecade || '',
        cabinet: row.cabinet || row.cabinetFamily || '',
        platformTechnology: row.platformTechnology || row.boardFamily || '',
        stakes: Array.isArray(row.stakes) ? row.stakes : [],
        jackpots: Array.isArray(row.jackpots) ? row.jackpots : [],
        features: Array.isArray(row.features) ? row.features : [],
        aliases: Array.isArray(row.aliases) ? row.aliases : [],
        history: plain(row.history || row.photoEvidenceSummary),
        technicalNotes: plain(row.technicalNotes),
        heroImage: row.heroImage || row.cardImage || '',
        cardImage: row.cardImage || row.heroImage || '',
        seoTitle: row.seoTitle || '',
        seoDescription: row.seoDescription || '',
        route: row['link-classic-fruit-machine-archive-1-title'] || row['link-classic-fruit-machine-archive-all'] || ''
    };
}

export const getLocationPage = webMethod(Permissions.Anyone, async slug => {
    const row = await oneBySlug('Locations', slug);
    if (!row) return null;
    const status = String(row.locationStatus || '').toLowerCase();
    if (/archived|hold|research in progress/.test(status)) return null;

    const page = locationModel(row);
    const related = await runUnifiedSearchInternal(row.title, { limit: 1000 });

    const sections = {
        venues: [],
        attractions: [],
        hotelsAndFood: [],
        offers: [],
        videos: [],
        guides: [],
        machines: []
    };

    for (const card of related.results || []) {
        if (card.kind === 'location' && card.sourceId === row._id) continue;
        if (card.kind === 'venue') sections.venues.push(card);
        else if (card.kind === 'attraction') sections.attractions.push(card);
        else if (card.kind === 'recommendation') sections.hotelsAndFood.push(card);
        else if (card.kind === 'offer' || card.kind === 'partner') sections.offers.push(card);
        else if (card.kind === 'video') sections.videos.push(card);
        else if (card.kind === 'guide') sections.guides.push(card);
        else if (['machine','machine-family','machine-directory','sighting','manufacturer'].includes(card.kind)) sections.machines.push(card);
    }

    return { page, sections, totalRelated: related.total || 0 };
});

export const getVenuePage = webMethod(Permissions.Anyone, async slug => {
    const row = await oneBySlug('Venues', slug);
    if (!row) return null;
    const status = String(row.status || '').toLowerCase();
    if (/duplicate|closed - historical|not a separate venue/.test(status)) return null;

    const page = venueModel(row);
    const searchTerms = [row.title, row.locationName, row.brand, row.operator]
        .filter(Boolean)
        .join(' ');

    const related = await runUnifiedSearchInternal(searchTerms, { limit: 400 });

    return {
        page,
        related: (related.results || []).filter(card =>
            !(card.kind === 'venue' && card.sourceId === row._id)
        )
    };
});

export const getMachinePage = webMethod(Permissions.Anyone, async slug => {
    const row = await oneBySlug('ClassicFruitMachines', slug);
    if (!row) return null;
    const status = String(row.variantStatus || '').toLowerCase();
    if (/merged|duplicate|remove|rejected/.test(status)) return null;

    const page = machineModel(row);
    const searchTerms = [row.title, row.manufacturer, row.familyName, row.variantName]
        .filter(Boolean)
        .join(' ');

    const related = await runUnifiedSearchInternal(searchTerms, { limit: 300 });

    return {
        page,
        related: (related.results || []).filter(card =>
            !(card.kind === 'machine' && card.sourceId === row._id)
        )
    };
});

export const resolveBySlug = webMethod(Permissions.Anyone, async (kind, slug) => {
    if (kind === 'location') return getLocationPage(slug);
    if (kind === 'venue') return getVenuePage(slug);
    if (kind === 'machine') return getMachinePage(slug);
    return null;
});
