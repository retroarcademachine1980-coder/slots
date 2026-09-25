import { ok, notFound, redirect } from 'wix-router';
import wixData from 'wix-data';

function plain(value) {
    return String(value || '').replace(/<[^>]*>/g, '').trim();
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

function slugify(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Handles all routes under the /arcade/ prefix.
 */
export async function arcade_Router(request) {
    const path = request.path; // array of URL segments after /arcade/

    // 1. /arcade/<town> OR /arcade/classic-machines
    if (path.length === 1) {
        if (path[0] === 'classic-machines') {
            return ok('arcade-classic-machines', {});
        }
        
        // Town page logic
        const townSlug = path[0];
        const location = await oneBySlug('Locations', townSlug);
        
        if (!location) return notFound();
        
        const status = String(location.locationStatus || '').toLowerCase();
        if (/archived|hold|research in progress/.test(status)) return notFound();

        // Query venues in that town
        const venues = [];
        let page = await wixData.query('Venues')
            .eq('locationSlug', townSlug)
            .eq('pageReady', true)
            .eq('directoryReady', true)
            .eq('cardReady', true)
            .limit(1000)
            .find();
            
        while (page) {
            for (const v of page.items) {
                const vStatus = String(v.status || '').toLowerCase();
                if (!/duplicate|closed historical|not a separate venue/.test(vStatus)) {
                    venues.push(venueModel(v));
                }
            }
            if (page.hasNext()) {
                page = await page.next();
            } else {
                page = null;
            }
        }

        return ok('arcade-town', {
            location: locationModel(location),
            venues
        });
    }

    // 2. /arcade/<town>/<venue> OR /arcade/classic-machines/<brand>
    if (path.length === 2) {
        if (path[0] === 'classic-machines') {
            // Brand page
            const brandSlug = path[1];
            return ok('arcade-brand', { brandSlug });
        }
        
        // Venue page logic
        const townSlug = path[0];
        const venueSlug = path[1];
        
        const venue = await oneBySlug('Venues', venueSlug);
        if (!venue || venue.locationSlug !== townSlug) return notFound();
        
        const status = String(venue.status || '').toLowerCase();
        if (/duplicate|closed historical|not a separate venue/.test(status)) return notFound();

        return ok('arcade-venue', {
            venue: venueModel(venue)
        });
    }

    // 3. /arcade/classic-machines/<brand>/<machine>
    if (path.length === 3 && path[0] === 'classic-machines') {
        const machineSlug = path[2];
        const machine = await oneBySlug('ClassicFruitMachines', machineSlug);
        
        if (!machine) return notFound();
        
        return ok('arcade-machine', {
            machine: machineModel(machine)
        });
    }

    return notFound();
}

export function arcade_SiteMap(sitemapRequest) {
    return [];
}


// --- 301 Redirects for OLD URLs ---

// /arcade-venues/<slug> -> /arcade/<locationSlug>/<slug>
export async function arcade_venues_Router(request) {
    if (request.path.length === 1) {
        const slug = request.path[0];
        const venue = await oneBySlug('Venues', slug);
        
        if (venue && venue.locationSlug) {
            return redirect(`/arcade/${venue.locationSlug}/${slug}`, 301);
        }
    }
    return notFound();
}

export function arcade_venues_SiteMap(sitemapRequest) { return []; }


// /arcade-locations/<slug> -> /arcade/<slug>
export async function arcade_locations_Router(request) {
    if (request.path.length === 1) {
        const slug = request.path[0];
        return redirect(`/arcade/${slug}`, 301);
    }
    return notFound();
}

export function arcade_locations_SiteMap(sitemapRequest) { return []; }


// /classic-fruit-machine-archive/<slug> -> /arcade/classic-machines/<brand>/<slug>
export async function classic_fruit_machine_archive_Router(request) {
    if (request.path.length === 1) {
        const slug = request.path[0];
        const machine = await oneBySlug('ClassicFruitMachines', slug);
        
        if (machine) {
            const brandSlug = slugify(machine.manufacturer || 'unknown');
            return redirect(`/arcade/classic-machines/${brandSlug}/${slug}`, 301);
        }
    }
    return notFound();
}

export function classic_fruit_machine_archive_SiteMap(sitemapRequest) { return []; }


// /classic-fruit-machine-archive-1/<slug> -> same as above
export async function classic_fruit_machine_archive_1_Router(request) {
    return classic_fruit_machine_archive_Router(request);
}

export function classic_fruit_machine_archive_1_SiteMap(sitemapRequest) { return []; }
