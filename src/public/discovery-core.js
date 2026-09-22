// Shared, side-effect-free rules. Never infer publication from available content.
const SITE = 'https://www.spin-raiders.com';
const ROUTES = {
    venue: ['link-arcade-venues-title', '/arcade-venues/'],
    location: ['link-arcade-locations-title', '/arcade-locations/']
};

export function normalise(value) {
    return String(value || '').slice(0, 240).normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[’']/g, '').replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export function httpsUrl(value) {
    if (typeof value !== 'string') return '';
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch (_) { return ''; }
}

export function canonicalRoute(row, kind) {
    const spec = ROUTES[kind];
    if (!spec || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug || '')) return '';
    const expected = spec[1] + row.slug;
    const actual = row[spec[0]];
    if (actual === expected || actual === SITE + expected) return expected;
    return '';
}

function imageUrl(value) {
    return typeof value === 'string' &&
        (value.startsWith('wix:image://v1/') || httpsUrl(value)) ? value : '';
}

function retired(row) {
    return !!(row.duplicateOf || row.duplicateReason || row.canonicalVenueId && row.canonicalVenueId !== row._id) ||
        /\b(closed|retired|duplicate|suppressed|quarantined)\b/i.test([row.status, row.currentVenueStatus, row.locationStatus].join(' ')) ||
        /temporarily removed from public discovery|removed for AdSense quality remediation/i.test(row.researchStatus || '');
}

export function isPublic(row, kind) {
    if (!row || retired(row) || row.directoryReady !== true || row.cardReady !== true) return false;
    if (kind === 'venue' && (row.pageReady !== true || /\b(bookmaker|betting shop)\b/i.test(row.venueType || ''))) return false;
    if (kind === 'location' && (row.imageVerified !== true || row.contentVerified !== true)) return false;
    return !!(row._id && row.title && imageUrl(row.heroImage) && canonicalRoute(row, kind));
}

function deadline(value) {
    const raw = value && typeof value === 'object' && !(value instanceof Date) ? value.$date : value;
    // Date-only offers remain valid through the end of that UTC date.
    const text = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + 'T23:59:59.999Z' : raw;
    return new Date(text).getTime();
}

export function isOfferPublic(row, now = Date.now()) {
    if (!row || row.cardReady !== true || row.active !== true || retired(row)) return false;
    if (!(row.displayTitle || row.offerTitle || row.name) || !imageUrl(row.dealImage || row.image)) return false;
    for (const value of [row.offerValidUntil, row.validUntil]) {
        if (value && (!Number.isFinite(deadline(value)) || deadline(value) < now)) return false;
    }
    return !!offerUrl(row);
}

export function offerUrl(row) {
    if (row.affiliate === true) return row.revenueReady === true ? httpsUrl(row.affiliateUrl) : '';
    return httpsUrl(row.outboundUrl || row.website || row.bookingUrl);
}

export function toCard(row, kind) {
    const offer = kind === 'offer';
    return {
        _id: kind + '-' + row._id,
        id: row._id,
        kind,
        title: offer ? row.displayTitle || row.offerTitle || row.name : row.title,
        description: String(row.shortDescription || row.cardSummary || row.summary || row.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
        image: offer ? row.dealImage || row.image : row.heroImage,
        alt: String(offer ? row.imageAlt || row.imageAltText || row.name : row.heroImageAlt || row.exteriorImageAlt || row.imageAltText || row.title),
        route: offer ? '' : canonicalRoute(row, kind),
        location: String(row.locationName || row.destination || row.town || ''),
        locationSlug: row.locationSlug || row.destinationSlug || (kind === 'location' ? row.slug : ''),
        category: row.category || row.venueType || kind,
        memberOffer: offer && row.affiliate === true,
        featured: row.featured === true,
        // Private notes, member data and affiliate URLs never enter public cards.
        monetised: offer && row.affiliate === true && row.revenueReady === true
    };
}

export function makeCatalogue(venues, locations, offers, now = Date.now()) {
    const entries = [];
    for (const [kind, rows] of [['venue', venues], ['location', locations], ['offer', offers]]) {
        for (const row of rows) {
            if (!(kind === 'offer' ? isOfferPublic(row, now) : isPublic(row, kind))) continue;
            const card = toCard(row, kind);
            const aliases = [card.title, ...(Array.isArray(row.searchTerms) ? row.searchTerms : [])]
                .filter(v => typeof v === 'string').map(normalise).filter(Boolean);
            const tokens = normalise([card.title, card.location, row.brand, row.category, row.venueType, ...aliases].join(' ')).split(' ');
            entries.push({ card, aliases: [...new Set(aliases)], tokens: [...new Set(tokens)], row });
        }
    }
    return entries;
}

const FILLER = new Set(['find', 'the', 'in', 'at', 'near', 'me', 'please', 'a', 'an', 'for', 'to', 'of', 'and', 'show']);
const WORDS = { amusements: 'arcade', amusement: 'arcade', arcades: 'arcade', casinos: 'casino', hotels: 'hotel', chippy: 'chips', maccies: 'mcdonalds', caff: 'cafe' };
function words(value) {
    return normalise(value).split(' ').filter(t => t && !FILLER.has(t)).map(t => WORDS[t] || t);
}

// Optimal-string-alignment distance includes adjacent transpositions (Blackpol/Blakcpool).
export function editDistance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
    }
    return d[a.length][b.length];
}

export function searchCatalogue(entries, input, requestedLimit = 24) {
    const query = normalise(input);
    const limit = Math.min(48, Math.max(1, Number(requestedLimit) || 24));
    if (!query) return { query, results: [], suggestions: [], exact: null, total: 0 };
    const qWords = [...new Set(words(query))];
    const ranked = entries.map(entry => {
        const titleExact = normalise(entry.card.title) === query;
        const aliasExact = entry.aliases.includes(query);
        const tokens = [...new Set(entry.tokens.flatMap(words))];
        let fuzzy = false;
        const scores = qWords.map(word => {
            if (tokens.includes(word)) return 10;
            if (word.length >= 3 && tokens.some(t => t.startsWith(word))) return 7;
            const tolerance = word.length >= 8 ? 2 : word.length >= 4 ? 1 : 0;
            if (tolerance && tokens.some(t => Math.abs(t.length - word.length) <= tolerance && editDistance(word, t) <= tolerance)) {
                fuzzy = true;
                return 4;
            }
            return 0;
        });
        const score = titleExact ? 1000 : aliasExact ? 900 : scores.length && scores.every(Boolean) ? scores.reduce((a, b) => a + b, 0) : 0;
        return { entry, score, titleExact, aliasExact, fuzzy };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score || a.entry.card.title.localeCompare(b.entry.card.title));
    const exactTitles = ranked.filter(r => r.titleExact);
    const exactAliases = ranked.filter(r => r.aliasExact);
    const direct = exactTitles.length === 1 ? exactTitles[0] : exactTitles.length === 0 && exactAliases.length === 1 ? exactAliases[0] : null;
    // Exact offers are returned as a selected card; never bypass the member offer click.
    const exact = direct ? direct.entry.card : null;
    return {
        query,
        results: ranked.slice(0, limit).map(r => r.entry.card),
        suggestions: ranked.filter(r => r.fuzzy && !r.aliasExact).slice(0, 3).map(r => ({ title: r.entry.card.title, id: r.entry.card._id })),
        exact,
        total: ranked.length
    };
}

function coordinates(row) {
    if (row.latitude === null || row.longitude === null || row.latitude === '' || row.longitude === '') return null;
    const lat = Number(row.latitude), lng = Number(row.longitude);
    return Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lng) && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export function distanceMiles(a, b) {
    const radians = n => n * Math.PI / 180;
    const x = Math.sin(radians(b.lat - a.lat) / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(radians(b.lng - a.lng) / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(Math.min(1, x)));
}

export function nearestLocation(entries, point) {
    const valid = point && coordinates({ latitude: point.lat, longitude: point.lng });
    if (!valid) return null;
    const nearby = entries.filter(e => e.card.kind === 'location' && coordinates(e.row))
        .map(e => ({ card: e.card, miles: distanceMiles(valid, coordinates(e.row)) }))
        .sort((a, b) => a.miles - b.miles);
    return nearby[0] && nearby[0].miles <= 100 ? nearby[0] : null;
}

export function recommend(entries, options = {}) {
    const saved = new Set(options.savedIds || []), seen = new Set(options.seenIds || []);
    const area = normalise(options.area);
    const selected = entries.find(e => e.card._id === options.exactId);
    const localArea = area || normalise(selected && (selected.card.locationSlug || selected.card.location));
    const group = e => {
        if (e === selected) return 0;
        if (saved.has(e.card.id)) return 1;
        const local = localArea && [e.card.location, e.card.locationSlug].some(v => normalise(v) === localArea);
        if (local && e.card.monetised) return 2;
        if (local && !seen.has(e.card.id)) return 3;
        if (local) return 4;
        return 5;
    };
    const sorted = [...entries].sort((a, b) => group(a) - group(b) ||
        Number(seen.has(a.card.id) && !saved.has(a.card.id)) - Number(seen.has(b.card.id) && !saved.has(b.card.id)) ||
        Number(b.card.featured) - Number(a.card.featured) ||
        a.card.title.localeCompare(b.card.title));
    const seenCards = new Set();
    return sorted.filter(e => { if (seenCards.has(e.card._id)) return false; seenCards.add(e.card._id); return true; })
        .slice(0, Math.min(48, Math.max(1, Number(options.limit) || 24))).map(e => e.card);
}
