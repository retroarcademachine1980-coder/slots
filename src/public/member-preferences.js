const BOOLEANS = ['personalisationEnabled', 'emailOffersOptIn', 'partnerOffersOptIn', 'onboardingComplete', 'showClassicFruitMachines', 'showRetroVideoGames', 'showNearbyAttractions'];
const LISTS = ['preferredOfferTypes', 'preferredVenueTypes', 'preferredBrands', 'preferredFeatures'];
const TEXT = ['homeLocation', 'homePostcode'];

export function preferencePatch(input, now = new Date()) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid preferences.');
    const out = {};
    for (const key of BOOLEANS) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            if (typeof input[key] !== 'boolean') throw new Error('Invalid preference: ' + key);
            out[key] = input[key];
        }
    }
    for (const key of LISTS) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            if (!Array.isArray(input[key]) || input[key].length > 30 || input[key].some(v => typeof v !== 'string' || v.length > 100)) throw new Error('Invalid preference: ' + key);
            out[key] = [...new Set(input[key].map(s => s.trim()).filter(Boolean))];
        }
    }
    for (const key of TEXT) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            if (typeof input[key] !== 'string' || input[key].length > 120) throw new Error('Invalid preference: ' + key);
            out[key] = input[key].trim();
        }
    }
    if (Object.prototype.hasOwnProperty.call(input, 'preferredRadiusMiles')) {
        const n = input.preferredRadiusMiles;
        if (typeof n !== 'number' || !Number.isFinite(n) || n < 1 || n > 250) throw new Error('Choose a radius between 1 and 250 miles.');
        out.preferredRadiusMiles = n;
    }
    if ('emailOffersOptIn' in out || 'partnerOffersOptIn' in out) {
        out.emailConsentAt = now;
        out.emailConsentSource = 'member-preferences';
    }
    out.lastUpdated = now;
    return out;
}

export function publicPreferences(row = {}) {
    const allowed = [...BOOLEANS, ...LISTS, ...TEXT, 'preferredRadiusMiles', 'emailConsentAt', 'emailConsentSource'];
    return Object.fromEntries(allowed.filter(k => row[k] !== undefined).map(k => [k, row[k]]));
}
