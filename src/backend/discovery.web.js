import { Permissions, webMethod } from 'wix-web-module';
import { loadCatalogue } from 'backend/discovery-service';
import { searchCatalogue, recommend, nearestLocation, offerUrl } from 'public/discovery-core';

export const searchPlaces = webMethod(Permissions.Anyone, async (query, limit = 24) => {
    if (typeof query !== 'string' || query.length > 240) throw new Error('Enter a search of up to 240 characters.');
    if (!query.trim()) return { query: '', results: [], suggestions: [], exact: null, total: 0 };
    return searchCatalogue(await loadCatalogue(), query, limit);
});

export const getRecommendations = webMethod(Permissions.Anyone, async (options = {}) => {
    return recommend(await loadCatalogue(), {
        area: typeof options.area === 'string' ? options.area.slice(0, 120) : '',
        exactId: typeof options.exactId === 'string' ? options.exactId.slice(0, 180) : '',
        limit: options.limit
    });
});

export const getNearestDestination = webMethod(Permissions.Anyone, async (point) => {
    return nearestLocation(await loadCatalogue(), point);
});

// Affiliate URLs are only disclosed after authenticated, deliberate second clicks.
export const getMemberOffer = webMethod(Permissions.SiteMember, async (id) => {
    if (typeof id !== 'string' || id.length > 120) throw new Error('Invalid offer.');
    const entry = (await loadCatalogue()).find(e => e.card.kind === 'offer' && e.card.id === id);
    if (!entry) throw new Error('This offer is no longer available.');
    return { url: offerUrl(entry.row) };
});

export const getPublicRecommendationLink = webMethod(Permissions.Anyone, async (id) => {
    if (typeof id !== 'string' || id.length > 120) throw new Error('Invalid recommendation.');
    const entry = (await loadCatalogue()).find(e => e.card.kind === 'offer' && e.card.id === id && !e.card.memberOffer);
    if (!entry) throw new Error('This recommendation is no longer available.');
    return { url: offerUrl(entry.row) };
});
