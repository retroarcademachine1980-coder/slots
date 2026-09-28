// Server-rendered SEO for Spin Raiders dynamic pages (venues, towns, food and drink).
// Runs from masterPage.js inside $w.onReady, so Wix renders these tags into the HTML
// that Google downloads (no JavaScript needed on Google's side).
//
// What it sets, from the CMS record:
//   <title>              seoTitle, or "<name>, <town> | Spin Raiders"
//   meta description     seoDescription / shortDescription / overview / pageIntro
//   og:title/og:description/og:image, twitter card
//   robots noindex       when the record isn't finished (directoryReady / pageReady false)
//   JSON-LD              the place (with address, map point, phone, photo) + breadcrumbs
// Everything is wrapped so an SEO failure can never break a page.

import wixData from 'wix-data';
import wixSeoFrontend from 'wix-seo-frontend';

const SITE = 'https://www.spin-raiders.com';
const BRAND = 'Spin Raiders';

function clean(value) {
    return String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

function clip(text, max) {
    const t = clean(text);
    if (t.length <= max) return t;
    const cut = t.slice(0, max - 1);
    const at = cut.lastIndexOf(' ');
    return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[,;:.\-–\s]+$/, '') + '…';
}

function first(...values) {
    for (const v of values) {
        const t = clean(v);
        if (t) return t;
    }
    return '';
}

function wixImageUrl(src) {
    const s = String(src || '');
    if (!s) return '';
    if (/^https?:\/\//.test(s)) return s;
    // wix:image://v1/<id>/<name>#... -> static URL
    const m = s.match(/^wix:image:\/\/v1\/([^/]+)\//);
    return m ? `https://static.wixstatic.com/media/${m[1]}` : '';
}

async function findOne(collection, field, value) {
    const res = await wixData.query(collection).eq(field, value).limit(1).find({ suppressAuth: false });
    return res.items[0] || null;
}

function venueSchemaType(item) {
    const t = `${item.venueType || ''} ${item.officialVenueLabel || ''} ${item.title || ''}`.toLowerCase();
    if (/bowl/.test(t)) return 'BowlingAlley';
    if (/cinema|odeon|vue |cineworld/.test(t)) return 'MovieTheater';
    if (/casino/.test(t)) return 'Casino';
    if (/theme park|pleasure beach|fun park|funfair/.test(t)) return 'AmusementPark';
    return 'EntertainmentBusiness';
}

function address(item) {
    const a = {
        '@type': 'PostalAddress',
        streetAddress: clean(item.address) || undefined,
        addressLocality: clean(item.town || item.city || item.locationName) || undefined,
        postalCode: clean(item.postcode) || undefined,
        addressCountry: 'GB',
    };
    return a.streetAddress || a.addressLocality ? a : undefined;
}

function geo(item) {
    const lat = Number(item.latitude), lng = Number(item.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat && lng
        ? { '@type': 'GeoCoordinates', latitude: lat, longitude: lng }
        : undefined;
}

function breadcrumbs(list) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: list.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: SITE + b.path })),
    };
}

function strip(obj) {
    return JSON.parse(JSON.stringify(obj));
}

async function apply({ title, description, image, url, noindex, schema }) {
    const tasks = [];
    if (title) tasks.push(wixSeoFrontend.setTitle(clip(title, 70)));
    const desc = clip(description, 158);
    const tags = [];
    if (desc) {
        tags.push({ name: 'description', content: desc });
        tags.push({ property: 'og:description', content: desc });
        tags.push({ name: 'twitter:description', content: desc });
    }
    if (title) {
        tags.push({ property: 'og:title', content: clip(title, 90) });
        tags.push({ name: 'twitter:title', content: clip(title, 70) });
    }
    if (image) {
        tags.push({ property: 'og:image', content: image });
        tags.push({ name: 'twitter:image', content: image });
    }
    tags.push({ name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' });
    if (url) tags.push({ property: 'og:url', content: url });
    tags.push({ property: 'og:site_name', content: BRAND });
    tags.push({ property: 'og:type', content: 'website' });
    tags.push({ property: 'og:locale', content: 'en_GB' });
    if (noindex) tags.push({ name: 'robots', content: 'noindex, follow' });
    tasks.push(wixSeoFrontend.setMetaTags(tags));
    if (schema && schema.length) tasks.push(wixSeoFrontend.setStructuredData(schema.map(strip)));
    await Promise.all(tasks);
}

async function venuePage(slug) {
    const path = `/arcade-venues/${slug}`;
    const item = (await findOne('Venues', 'link-arcade-venues-title', path)) || (await findOne('Venues', 'slug', slug));
    if (!item) return;
    const name = first(item.displayTitle, item.title);
    const town = first(item.town, item.city, item.locationName);
    const nameHasTown = town && name.toLowerCase().includes(town.toLowerCase());
    const title = first(item.seoTitle, `${name}${town && !nameHasTown ? `, ${town}` : ''} | Arcade Guide | ${BRAND}`);
    const description = first(item.seoDescription, item.shortDescription, item.overview, item.pageIntro, item.detailedReview);
    const image = wixImageUrl(item.mainImage || item.heroImage);
    const url = SITE + path;
    const live = item.directoryReady !== false && item.pageReady !== false;
    const place = {
        '@context': 'https://schema.org',
        '@type': venueSchemaType(item),
        name,
        description: clip(first(item.overview, item.shortDescription, item.seoDescription), 300) || undefined,
        url,
        image: image || undefined,
        telephone: clean(item.phone) || undefined,
        address: address(item),
        geo: geo(item),
        openingHours: undefined,
        sameAs: /^https?:\/\//.test(item.website || '') ? [item.website] : undefined,
    };
    const crumbs = [{ name: 'Home', path: '/' }];
    if (item.locationSlug && town) crumbs.push({ name: town, path: `/destination/${item.locationSlug}` });
    crumbs.push({ name, path });
    await apply({ title, description, image, url, noindex: !live, schema: [place, breadcrumbs(crumbs)] });
}

async function townPage(slug) {
    const item = await findOne('Locations', 'slug', slug);
    if (!item) return;
    const name = first(item.title);
    const title = first(item.seoTitle, `${name} Days Out: Arcades, Bowling & Things to Do | ${BRAND}`);
    const description = first(item.seoDescription, item.shortDescription, item.pageIntro);
    const image = wixImageUrl(item.heroImage || item.mainImage);
    const url = `${SITE}/destination/${slug}`;
    const intro = clean(item.pageIntro);
    // Towns with no real write-up yet are kept out of Google until they have one.
    const thin = intro.split(' ').length < 40;
    const live = item.directoryReady !== false && item.pageReady !== false && !thin;
    const place = {
        '@context': 'https://schema.org',
        '@type': 'TouristDestination',
        name,
        description: clip(first(item.shortDescription, item.seoDescription, intro), 300) || undefined,
        url,
        image: image || undefined,
        geo: geo(item),
        containedInPlace: item.county ? { '@type': 'AdministrativeArea', name: clean(item.county) } : undefined,
    };
    await apply({
        title, description, image, url, noindex: !live,
        schema: [place, breadcrumbs([{ name: 'Home', path: '/' }, { name, path: `/destination/${slug}` }])],
    });
}

async function foodPage(townSlug, urlName) {
    const path = `/food-and-drink/${townSlug}/${urlName}`;
    let item = null;
    const res = await wixData.query('FoodAndDrink').eq('townSlug', townSlug).eq('urlName', urlName).limit(1).find();
    item = res.items[0] || null;
    if (!item) return;
    const name = first(item.displayName, item.title);
    const town = first(item.town);
    const title = first(item.seoTitle, `${name}${town && !name.includes(town) ? `, ${town}` : ''} | Food & Drink | ${BRAND}`);
    const description = first(item.seoDescription, item.shortDescription, item.overview, item.detailedReview);
    const image = wixImageUrl(item.heroImage || item.mainImage);
    const url = SITE + path;
    const place = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name,
        description: clip(first(item.shortDescription, item.seoDescription), 300) || undefined,
        url,
        image: image || undefined,
        telephone: clean(item.phone) || undefined,
        address: address(item),
        geo: geo(item),
    };
    const crumbs = [{ name: 'Home', path: '/' }, { name: 'Food & Drink', path: '/food-and-drink' }];
    if (town) crumbs.push({ name: town, path: `/destination/${townSlug}` });
    crumbs.push({ name, path });
    await apply({ title, description, image, url, noindex: item.directoryReady === false, schema: [place, breadcrumbs(crumbs)] });
}

async function homePage() {
    await apply({
        title: 'UK Days Out with Arcades at the Heart | Spin Raiders',
        description: 'Plan a proper UK day out: seaside arcades, 2p pushers, bowling, cinemas, piers, food and places to stay, from real visits and real reviews.',
        url: SITE + '/',
        schema: [{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: BRAND,
            url: SITE + '/',
            potentialAction: {
                '@type': 'SearchAction',
                target: SITE + '/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
            },
        }, {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: BRAND,
            url: SITE + '/',
        }],
    });
}

export async function applyPageSeo(pathParts) {
    try {
        const parts = (pathParts || []).map((p) => decodeURIComponent(String(p)).toLowerCase());
        if (!parts.length || (parts.length === 1 && parts[0] === 'home')) return await homePage();
        if (parts[0] === 'arcade-venues' && parts[1]) return await venuePage(parts[1]);
        if (parts[0] === 'destination' && parts[1]) return await townPage(parts[1]);
        if (parts[0] === 'food-and-drink' && parts[1] && parts[2]) return await foodPage(parts[1], parts[2]);
    } catch (err) {
        console.warn('Spin Raiders SEO skipped', err);
    }
}
