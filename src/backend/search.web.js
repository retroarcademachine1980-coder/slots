import { Permissions, webMethod } from 'wix-web-module';
import { normalizeSearch } from 'backend/searchText';
import { runUnifiedSearchInternal, listPublicSearchSources } from 'backend/searchCore';

// Preserve the existing backend export for current callers.
export { runUnifiedSearchInternal };

export const searchEverything = webMethod(
    Permissions.Anyone,
    async (input, options = {}) => runUnifiedSearchInternal(input, options)
);

export const getSearchSuggestions = webMethod(Permissions.Anyone, async (input, limit = 12) => {
    const query = String(input || '').trim().slice(0, 80);
    if (query.length < 2) return [];

    const result = await runUnifiedSearchInternal(query, {
        limit: Math.max(20, Math.min(100, Number(limit) || 12))
    });

    const seen = new Set();
    const suggestions = [];

    for (const card of result.results) {
        const key = normalizeSearch(card.title);
        if (!key || seen.has(key)) continue;
        seen.add(key);

        suggestions.push({
            _id: 'suggestion:' + card._id,
            label: card.title,
            kind: card.kind,
            subtitle: card.subtitle || card.location || '',
            route: card.route, routeStatus: card.routeStatus, routeIssue: card.routeIssue,
            searchValue: card.title
        });

        if (suggestions.length >= Math.max(1, Math.min(20, Number(limit) || 12))) break;
    }

    return suggestions;
});

export const getLocationBundle = webMethod(Permissions.Anyone, async (locationName, options = {}) => {
    const result = await runUnifiedSearchInternal(locationName, {
        limit: Math.max(100, Math.min(1500, Number(options.limit) || 750))
    });

    const q = normalizeSearch(locationName);
    const destination = result.results.find(card =>
        card.kind === 'location' && normalizeSearch(card.title) === q
    ) || null;

    const sections = {
        venues: [],
        attractions: [],
        hotelsAndFood: [],
        offers: [],
        videos: [],
        machines: [],
        guides: [],
        other: []
    };

    for (const card of result.results) {
        if (destination && card._id === destination._id) continue;

        if (card.kind === 'venue') sections.venues.push(card);
        else if (card.kind === 'attraction') sections.attractions.push(card);
        else if (card.kind === 'hotel') sections.hotelsAndFood.push(card);
        else if (card.kind === 'offer' || card.kind === 'partner') sections.offers.push(card);
        else if (card.kind === 'video') sections.videos.push(card);
        else if (card.kind === 'guide') sections.guides.push(card);
        else if (['machine','machine-family','machine-directory','sighting','manufacturer'].includes(card.kind)) {
            sections.machines.push(card);
        } else {
            sections.other.push(card);
        }
    }

    return {
        query: result.query,
        destination,
        total: result.total,
        groups: result.groups,
        sections
    };
});

export const browseDirectory = webMethod(Permissions.Anyone, async (filters = {}) => {
    const query = String(filters.query || filters.location || filters.category || '').trim();
    const limit = Math.max(1, Math.min(500, Number(filters.limit) || 100));
    const offset = Math.max(0, Number(filters.offset) || 0);
    const kinds = Array.isArray(filters.kinds) ? filters.kinds.map(String) : [];
    const location = normalizeSearch(filters.location || '');
    const category = normalizeSearch(filters.category || '');

    const result = query
        ? await runUnifiedSearchInternal(query, { limit: 3000 })
        : { results: [] };

    let rows = result.results || [];

    if (kinds.length) {
        const allowed = new Set(kinds);
        rows = rows.filter(card => allowed.has(card.kind));
    }

    if (location) {
        rows = rows.filter(card =>
            normalizeSearch(card.location).includes(location) ||
            normalizeSearch(card.subtitle).includes(location) ||
            normalizeSearch(card.title).includes(location)
        );
    }

    if (category) {
        rows = rows.filter(card =>
            normalizeSearch(card.category).includes(category) ||
            normalizeSearch(card.title).includes(category) ||
            normalizeSearch(card.description).includes(category)
        );
    }

    return {
        total: rows.length,
        offset,
        limit,
        results: rows.slice(offset, offset + limit)
    };
});

export const publicSearchSources = webMethod(Permissions.Anyone, async () =>
    listPublicSearchSources()
);
