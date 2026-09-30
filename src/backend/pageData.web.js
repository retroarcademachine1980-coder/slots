import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';
import { runUnifiedSearchInternal } from 'backend/searchCore';

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
        else if (card.kind === 'hotel') sections.hotelsAndFood.push(card);
        else if (card.kind === 'offer' || card.kind === 'partner') sections.offers.push(card);
        else if (card.kind === 'video') sections.videos.push(card);
        else if (card.kind === 'guide') sections.guides.push(card);
        else if (['machine','machine-family','machine-directory','sighting','manufacturer'].includes(card.kind)) sections.machines.push(card);
    }

    return { page, sections, totalRelated: related.total || 0 };
});

function mergeRelated(...resultSets) {
    const seen = new Map();

    for (const set of resultSets) {
        for (const card of set || []) {
            const key = card.route || (card.kind + ':' + card.sourceId) || card._id;
            const existing = seen.get(key);
            if (!existing || Number(card.score || 0) > Number(existing.score || 0)) {
                seen.set(key, card);
            }
        }
    }

    return [...seen.values()]
        .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

export const getVenuePage = webMethod(Permissions.Anyone, async slug => {
    const row = await oneBySlug('Venues', slug);
    if (!row) return null;
    const status = String(row.status || '').toLowerCase();
    if (/duplicate|closed - historical|not a separate venue/.test(status)) return null;

    const page = venueModel(row);
    const searches = await Promise.all([
        row.title ? runUnifiedSearchInternal(row.title, { limit: 250 }) : Promise.resolve({ results: [] }),
        row.locationName ? runUnifiedSearchInternal(row.locationName, { limit: 500 }) : Promise.resolve({ results: [] }),
        row.brand ? runUnifiedSearchInternal(row.brand, { limit: 150 }) : Promise.resolve({ results: [] }),
        row.operator ? runUnifiedSearchInternal(row.operator, { limit: 150 }) : Promise.resolve({ results: [] })
    ]);

    const related = mergeRelated(...searches.map(result => result.results))
        .filter(card => !(card.kind === 'venue' && card.sourceId === row._id))
        .slice(0, 500);

    return { page, related };
});

export const getMachinePage = webMethod(Permissions.Anyone, async slug => {
    const row = await oneBySlug('ClassicFruitMachines', slug);
    if (!row) return null;
    const status = String(row.variantStatus || '').toLowerCase();
    if (/merged|duplicate|remove|rejected/.test(status)) return null;

    const page = machineModel(row);
    const searches = await Promise.all([
        row.title ? runUnifiedSearchInternal(row.title, { limit: 250 }) : Promise.resolve({ results: [] }),
        row.manufacturer ? runUnifiedSearchInternal(row.manufacturer, { limit: 250 }) : Promise.resolve({ results: [] }),
        row.familyName ? runUnifiedSearchInternal(row.familyName, { limit: 150 }) : Promise.resolve({ results: [] }),
        row.variantName ? runUnifiedSearchInternal(row.variantName, { limit: 150 }) : Promise.resolve({ results: [] })
    ]);

    const related = mergeRelated(...searches.map(result => result.results))
        .filter(card => !(card.kind === 'machine' && card.sourceId === row._id))
        .slice(0, 400);

    return { page, related };
});



function hotelModel(row) {
    if (!row) return null;
    return {
        _id: row._id,
        title: row.title || '',
        slug: row.slug || '',
        locationName: row.locationName || '',
        locationSlug: row.locationSlug || '',
        destination: row.destination || '',
        address: row.address || '',
        phone: row.phone || '',
        website: row.website || '',
        guideContent: row.guideContent || '',
        guideDetails: row.guideDetails || '',
        image: row.image || '',
        imageAlt: row.imageAlt || row.title || '',
        publicRating: row.publicRating ?? null,
        publicReviewCount: row.publicReviewCount ?? null,
        publicRatingSource: row.publicRatingSource || '',
        publicRatingSourceUrl: row.publicRatingSourceUrl || '',
        offerCount: row.offerCount ?? 0,
        canonicalUrl: row.canonicalUrl || (row.slug ? '/hotels/' + row.slug : ''),
        nearbyAffiliateLocation: row.nearbyAffiliateLocation || row.locationSlug || '',
        active: row.active !== false
    };
}

function affiliateUrl(row) {
    return String(
        row.affiliateUrl ||
        row.offerUrl ||
        row.bookingUrl ||
        row.outboundUrl ||
        ''
    ).trim();
}

function offerModel(row) {
    if (!row) return null;
    return {
        _id: row._id,
        title: row.offerTitle || row.displayTitle || row.name || 'View deal',
        provider: row.provider || row.dealSource || '',
        summary: plain(row.offerText || row.offerSummary || row.summary),
        ctaLabel: row.ctaLabel || 'VIEW DEAL',
        affiliateUrl: affiliateUrl(row),
        featured: row.featured === true,
        revenueReady: row.revenueReady === true,
        category: row.category || ''
    };
}

function nearbyAffiliateModel(row) {
    if (!row) return null;
    return {
        _id: row._id,
        title: row.displayTitle || row.name || row.offerTitle || '',
        category: row.category || '',
        summary: plain(row.summary || row.offerText || row.offerSummary),
        image: row.dealImage || row.image || '',
        imageAlt: row.imageAlt || row.displayTitle || row.name || '',
        ctaLabel: row.ctaLabel || 'VIEW OFFER',
        affiliateUrl: affiliateUrl(row),
        featured: row.featured === true,
        revenueReady: row.revenueReady === true
    };
}

export const getHotelPage = webMethod(Permissions.Anyone, async slug => {
    const row = await oneBySlug('HotelGuides', slug);
    if (!row || row.active === false) return null;

    const page = hotelModel(row);

    const offersResult = await wixData.query('HotelOffers')
        .eq('hotelGuideId', row._id)
        .limit(1000)
        .find();

    const offers = (offersResult.items || [])
        .filter(item => affiliateUrl(item))
        .map(offerModel)
        .sort((a, b) =>
            Number(b.featured) - Number(a.featured) ||
            Number(b.revenueReady) - Number(a.revenueReady) ||
            a.title.localeCompare(b.title)
        );

    const nearbyLocation = row.nearbyAffiliateLocation || row.locationSlug || '';
    let nearbyAffiliates = [];

    if (nearbyLocation) {
        const nearbyResult = await wixData.query('AffiliateOffers')
            .eq('locationSlug', nearbyLocation)
            .limit(1000)
            .find();

        nearbyAffiliates = (nearbyResult.items || [])
            .filter(item => {
                if (String(item.offerRecordType || '').toUpperCase() === 'HOTEL_OFFER') return false;
                const category = String(item.category || '').toLowerCase();
                if (category.includes('hotel') || category.includes('accommodation')) return false;
                if (item.cardReady === false || item.active === false) return false;
                return !!affiliateUrl(item);
            })
            .map(nearbyAffiliateModel)
            .sort((a, b) =>
                Number(b.featured) - Number(a.featured) ||
                Number(b.revenueReady) - Number(a.revenueReady) ||
                a.title.localeCompare(b.title)
            )
            .slice(0, 12);
    }

    const locationSearch = row.locationName || row.destination || row.locationSlug || '';
    const related = locationSearch
        ? await runUnifiedSearchInternal(locationSearch, { limit: 500 })
        : { results: [] };

    const localDirectory = (related.results || [])
        .filter(card =>
            ['venue', 'attraction'].includes(card.kind) &&
            !(card.kind === 'hotel' && card.sourceId === row._id)
        )
        .slice(0, 30);

    return {
        page,
        offers,
        nearbyAffiliates,
        localDirectory
    };
});
