// Only include routes whose Wix URL settings have been prepared.
// Publish together with the matching page settings and redirects.
export const STATIC_URL_CHANGES = Object.freeze({
    '/about-1-1': '/near-me',
    '/about-5-1': '/retro-arcades',
    '/about-5': '/500-jackpot-slots',
    '/general-clean': '/ticket-arcades',
    '/general-9': '/coin-pusher-arcades',
    '/general-9-1': '/dog-friendly-arcades',
    '/general-6': '/wheelchair-friendly-arcades',
    '/general-1': '/seaside-arcades',
    '/general-8': '/casinos',
    '/adult-gaming-centres': '/agc'
});

export function canonicalInternalUrl(value) {
    if (typeof value !== 'string' || !value) return value;
    // Never rewrite external affiliate URLs or their query parameters.
    const match = value.match(/^(https?:\/\/(?:www\.)?spin-raiders\.com)?(\/[^?#]*)([?#].*)?$/i);
    if (!match || match[2].startsWith('//')) return value;
    const [, origin = '', path, suffix = ''] = match;
    const lookup = path.replace(/\/$/, '');
    let replacement = STATIC_URL_CHANGES[lookup];
    if (!replacement && /^\/arcade-locations\/[^/]+\/?$/.test(path)) {
        replacement = path.replace(/^\/arcade-locations\//, '/destination/');
    }
    return replacement ? origin + replacement + suffix : value;
}
