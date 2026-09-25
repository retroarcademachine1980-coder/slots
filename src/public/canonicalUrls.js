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
    '/general-1-1': '/bookmakers-with-fruit-machines',
    '/general-6-1': '/arcade/great-yarmouth',
    '/general-8-1': '/arcade/bridlington',
    '/general-1-2': '/arcade/blackpool',
    '/destination-recommendations': '/'
});

export const VIEW_PARAM_REDIRECTS = Object.freeze({
    'agc': '/adult-gaming-centres',
    'seaside': '/seaside-arcades',
    'retro': '/retro-arcades',
    'casino': '/casinos',
    'bookmaker': '/bookmakers-with-fruit-machines'
});

export function canonicalInternalUrl(value) {
    if (typeof value !== 'string' || !value) return value;
    // Never rewrite external affiliate URLs or their query parameters.
    const match = value.match(/^(https?:\/\/(?:www\.)?spin-raiders\.com)?(\/[^?#]*)([?#].*)?$/i);
    if (!match || match[2].startsWith('//')) return value;
    
    const [, origin = '', path, suffix = ''] = match;
    const lookup = path.replace(/\/$/, '');
    
    let replacement = STATIC_URL_CHANGES[lookup];

    if (!replacement) {
        if (/^\/arcade-locations\/([^/]+)\/?$/.test(lookup)) {
            replacement = lookup.replace(/^\/arcade-locations\//, '/arcade/');
        } else if (/^\/arcade-venues\/([^/]+)\/?$/.test(lookup)) {
            const slug = lookup.replace(/^\/arcade-venues\//, '');
            // Note: needs venue lookup to find town
            replacement = `/arcade/<town>/${slug}`;
        } else if (/^\/classic-fruit-machine-archive(-1)?\/([^/]+)\/?$/.test(lookup)) {
            const slug = lookup.replace(/^\/classic-fruit-machine-archive(-1)?\//, '');
            replacement = `/arcade/classic-machines/<brand>/${slug}`;
        }
    }

    return replacement ? origin + replacement + suffix : value;
}
