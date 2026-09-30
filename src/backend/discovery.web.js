import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';
import { runUnifiedSearchInternal } from 'backend/searchCore';

function plain(value) {
    return String(value || '').trim();
}

function distanceMiles(a, b) {
    const radians = n => n * Math.PI / 180;
    const x =
        Math.sin(radians(b.lat - a.lat) / 2) ** 2 +
        Math.cos(radians(a.lat)) *
        Math.cos(radians(b.lat)) *
        Math.sin(radians(b.lng - a.lng) / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(Math.min(1, x)));
}

function safeHttps(value) {
    try {
        const url = new URL(String(value || ''));
        return url.protocol === 'https:' ? url.href : '';
    } catch (_) {
        return '';
    }
}

export const searchPlaces = webMethod(Permissions.Anyone, async (query, limit = 100) => {
    const input = String(query || '').trim().slice(0, 120);
    if (!input) {
        return {
            query: '',
            results: [],
            suggestions: [],
            exact: null,
            total: 0,
            matchType: 'none'
        };
    }

    const result = await runUnifiedSearchInternal(input, {
        limit: Math.max(1, Math.min(500, Number(limit) || 100))
    });

    const exactMatches = (result.results || []).filter(card =>
        String(card.title || '').toLowerCase() === input.toLowerCase()
    );

    return {
        ...result,
        suggestions: [],
        exact: exactMatches.length === 1 ? exactMatches[0] : null,
        matchType: result.total ? 'matched' : 'none'
    };
});

export const getRecommendations = webMethod(Permissions.Anyone, async (options = {}) => {
    const area = plain(options.area).slice(0, 120);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 24));

    if (area) {
        const result = await runUnifiedSearchInternal(area, { limit });
        return result.results || [];
    }

    const [venues, recommendations, attractions] = await Promise.all([
        wixData.query('Venues').eq('featured', true).limit(limit).find(),
        wixData.query('AffiliateOffers').eq('featured', true).limit(limit).find(),
        wixData.query('NearbyAttractions').limit(limit).find()
    ]);

    const cards = [];

    for (const row of venues.items || []) {
        if (!row.title) continue;
        cards.push({
            _id: 'venue:' + row._id,
            id: row._id,
            kind: 'venue',
            title: row.title,
            description: String(row.shortDescription || row.seoDescription || '').replace(/<[^>]*>/g, '').slice(0, 300),
            image: row.heroImage || '',
            alt: row.exteriorImageAlt || row.title,
            route: row['link-arcade-venues-title'] || (row.slug ? '/arcade-venues/' + row.slug : ''),
            location: row.locationName || '',
            category: row.venueType || 'Venue'
        });
    }

    for (const row of recommendations.items || []) {
        const title = row.displayTitle || row.name || row.offerTitle;
        if (!title) continue;
        cards.push({
            _id: 'recommendation:' + row._id,
            id: row._id,
            kind: 'recommendation',
            title,
            description: String(row.summary || row.offerText || '').replace(/<[^>]*>/g, '').slice(0, 300),
            image: row.dealImage || row.image || '',
            alt: row.imageAlt || title,
            route: safeHttps(row.affiliateUrl || row.outboundUrl || row.bookingUrl || row.offerUrl || row.website),
            location: row.locationName || row.destination || '',
            category: row.category || 'Recommendation'
        });
    }

    for (const row of attractions.items || []) {
        if (!row.title) continue;
        cards.push({
            _id: 'attraction:' + row._id,
            id: row._id,
            kind: 'attraction',
            title: row.title,
            description: String(row.shortDescription || '').replace(/<[^>]*>/g, '').slice(0, 300),
            image: row.heroImage || '',
            alt: row.title,
            route: safeHttps(row.website || row.googleMapsUrl),
            location: row.locationName || '',
            category: row.category || 'Thing to do'
        });
    }

    return cards.slice(0, limit);
});

export const getNearestDestination = webMethod(Permissions.Anyone, async point => {
    const lat = Number(point && point.lat);
    const lng = Number(point && point.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    let page = await wixData.query('Locations').limit(1000).find();
    const rows = [...(page.items || [])];

    while (page.hasNext && page.hasNext() && rows.length < 5000) {
        page = await page.next();
        rows.push(...(page.items || []));
    }

    const ranked = rows
        .map(row => ({
            row,
            lat: Number(row.latitude),
            lng: Number(row.longitude)
        }))
        .filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng))
        .map(item => ({
            title: item.row.title || '',
            slug: item.row.slug || '',
            route: item.row['link-arcade-locations-title'] || (item.row.slug ? '/arcade-locations/' + item.row.slug : ''),
            miles: distanceMiles({ lat, lng }, { lat: item.lat, lng: item.lng })
        }))
        .sort((a, b) => a.miles - b.miles);

    return ranked[0] && ranked[0].miles <= 100 ? ranked[0] : null;
});

async function resolveOffer(id) {
    const value = String(id || '').trim().slice(0, 120);
    if (!value) throw new Error('Invalid offer.');

    const [recommendation, wowcher] = await Promise.all([
        wixData.query('AffiliateOffers').eq('_id', value).limit(1).find(),
        wixData.query('WowcherOffers').eq('_id', value).limit(1).find()
    ]);

    const row = (recommendation.items || [])[0] || (wowcher.items || [])[0];
    if (!row) throw new Error('This offer is no longer available.');

    const url = safeHttps(
        row.affiliateUrl ||
        row.outboundUrl ||
        row.bookingUrl ||
        row.offerUrl ||
        row.website
    );

    if (!url) throw new Error('This offer has no valid destination.');
    return { url };
}

export const getMemberOffer = webMethod(Permissions.SiteMember, resolveOffer);
export const getPublicRecommendationLink = webMethod(Permissions.Anyone, resolveOffer);
