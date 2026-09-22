import wixData from 'wix-data';
import { makeCatalogue } from 'public/discovery-core';

// No process/session catalogue cache: suppression changes must apply on the next request.
export async function readAll(query) {
    let result = await query.limit(1000).find({ suppressAuth: true, consistentRead: true });
    const items = [...result.items];
    while (result.hasNext()) {
        result = await result.next();
        items.push(...result.items);
    }
    return items;
}

function wowcherAsOffers(rows) {
    return rows.map(row => ({
        ...row,
        // Normalise the existing Wowcher CMS records into the same private offer
        // shape used by DestinationRecommendations. Affiliate URLs still never
        // enter a public card and are resolved only after member authentication.
        cardReady: true,
        active: row.active === true,
        affiliate: true,
        revenueReady: true,
        displayTitle: row.offerTitle || row.title,
        dealImage: row.dealImage || row.image,
        imageAltText: row.imageAlt,
        locationName: row.destination,
        destination: row.destination,
        category: row.offerType || 'Offer',
        sourceCollection: 'WowcherOffers'
    }));
}

export async function loadCatalogue() {
    const queries = [
        wixData.query('Venues').eq('directoryReady', true).eq('cardReady', true).eq('pageReady', true),
        wixData.query('Locations').eq('directoryReady', true).eq('cardReady', true),
        wixData.query('DestinationRecommendations').eq('cardReady', true).eq('active', true),
        wixData.query('NearbyAttractions').eq('directoryReady', true),
        wixData.query('WowcherOffers').eq('active', true)
    ];
    const outcomes = await Promise.allSettled(queries.map(readAll));
    // Never turn a failed collection read into a misleading empty/partial search.
    if (outcomes.some(r => r.status !== 'fulfilled')) throw new Error('Discovery is temporarily unavailable. Please try again.');

    const [venues, locations, recommendations, attractions, wowcher] = outcomes.map(r => r.value);
    return makeCatalogue(venues, locations, [...recommendations, ...wowcherAsOffers(wowcher)], attractions);
}
