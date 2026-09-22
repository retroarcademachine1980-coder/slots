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

export async function loadCatalogue() {
    const queries = [
        wixData.query('Venues').eq('directoryReady', true).eq('cardReady', true).eq('pageReady', true),
        wixData.query('Locations').eq('directoryReady', true).eq('cardReady', true),
        wixData.query('DestinationRecommendations').eq('cardReady', true).eq('active', true),
        wixData.query('NearbyAttractions').eq('directoryReady', true)
    ];
    const outcomes = await Promise.allSettled(queries.map(readAll));
    // Never turn a failed collection read into a misleading empty/partial search.
    if (outcomes.some(r => r.status !== 'fulfilled')) throw new Error('Discovery is temporarily unavailable. Please try again.');
    return makeCatalogue(...outcomes.map(r => r.value));
}
