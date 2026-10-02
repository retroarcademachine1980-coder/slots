import { INDEX_ROUTES } from 'public/routes/indexRoutes';
import { getCanonicalPage } from 'backend/canonicalPages.web';
import { parseCanonical, ROUTES } from 'public/routes/canonicalRoutes';
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
// Wix documents reading links before onReady and preserving unrelated link tags.
const existingLinks = (wixSeoFrontend.links || []).filter(link => link.rel !== 'canonical');

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
    if (url) {
        tags.push({ property: 'og:url', content: url });
        tasks.push(wixSeoFrontend.setLinks([...existingLinks, { rel: 'canonical', href: url }]));
    }
    tags.push({ property: 'og:site_name', content: BRAND });
    tags.push({ property: 'og:type', content: 'website' });
    tags.push({ property: 'og:locale', content: 'en_GB' });
    if (noindex) tags.push({ name: 'robots', content: 'noindex, follow' });
    tasks.push(wixSeoFrontend.setMetaTags(tags));
    if (schema && schema.length) tasks.push(wixSeoFrontend.setStructuredData(schema.map(strip)));
    await Promise.all(tasks);
}

async function venuePage(resolved) {
    const item = resolved.row, path = resolved.route.path;
    if (!item) return;
    const name = first(item.displayTitle, item.title);
    const town = first(item.town, item.city, item.locationName);
    const nameHasTown = town && name.toLowerCase().includes(town.toLowerCase());
    const title = first(item.seoTitle, `${name}${town && !nameHasTown ? `, ${town}` : ''} | Arcade Guide | ${BRAND}`);
    const description = first(item.seoDescription, item.shortDescription, item.overview, item.pageIntro, item.detailedReview);
    const image = wixImageUrl(item.mainImage || item.heroImage);
    const url = SITE + path;
    const live = resolved.route.indexable !== false && item.directoryReady !== false && item.pageReady !== false;
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
    // Related destination crumbs require an independently resolved native path.
    crumbs.push({ name, path });
    await apply({ title, description, image, url, noindex: !live, schema: [place, breadcrumbs(crumbs)] });
}

async function townPage(resolved) {
    const item = resolved.row, slug = resolved.route.path.split('/').pop();
    if (!item) return;
    const name = first(item.title);
    const title = first(item.seoTitle, `${name} Days Out: Arcades, Bowling & Things to Do | ${BRAND}`);
    const description = first(item.seoDescription, item.shortDescription, item.pageIntro);
    const image = wixImageUrl(item.heroImage || item.mainImage);
    const url = `${SITE}/destination/${slug}`;
    const intro = clean(item.pageIntro);
    // Towns with no real write-up yet are kept out of Google until they have one.
    // A shorter intro is enough when the town also has several places listed (Blackpool, Leeds, Glasgow...).
    const words = intro ? intro.split(' ').length : 0;
    let thin = words < 40;
    if (thin && words >= 25) {
        try {
            const [venues, places] = await Promise.all([
                wixData.query('Venues').eq('locationSlug', slug).ne('directoryReady', false).count(),
                wixData.query('NearbyAttractions').eq('locationSlug', slug).ne('directoryReady', false).count(),
            ]);
            thin = venues + places < 3;
        } catch (e) { /* keep the page out if the counts can't be read */ }
    }
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

async function foodPage(resolved) {
    const item = resolved.row, path = resolved.route.path;
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
    // Never synthesize a destination link from a potentially different CMS slug.
    crumbs.push({ name, path });
    await apply({ title, description, image, url, noindex: resolved.route.indexable === false || item.directoryReady === false, schema: [place, breadcrumbs(crumbs)] });
}

const HOME_TITLE = 'UK Days Out, Road Trips & Family Adventures | Spin Raiders';
const HOME_DESC = 'Your next big day out starts here. Plan UK road trips, family days out, beaches, museums, zoos and attractions, with food, places to stay and arcades nearby.';

// General (non-arcade) pages: days-out wording. Arcade and AGC pages keep their own arcade titles.
export const GENERAL_PAGE_SEO = {
    seaside: ['UK Seaside Days Out: Towns, Beaches & Piers | Spin Raiders', 'Plan a UK seaside day out: resort towns, beaches, piers, fish and chips and family fun, with places to eat and stay nearby. Your next big day out starts here.'],
    beaches: ['Best UK Beaches for a Family Day Out | Spin Raiders', 'Find UK beaches for a family day out, with what is nearby: food, attractions, places to stay and seaside fun. Your next big day out starts here.'],
    piers: ['UK Piers & Promenades: Seaside Days Out | Spin Raiders', 'Plan a seaside day out around the UK\'s piers and promenades, with food, attractions and family fun nearby. Your next big day out starts here.'],
    outdoors: ['UK Outdoor Days Out: Parks, Walks & Nature | Spin Raiders', 'Outdoor days out across the UK: country parks, walks, nature spots and adventure parks for the whole family. Your next big day out starts here.'],
    cinemas: ['UK Cinemas for a Family Day or Night Out | Spin Raiders', 'Find cinemas for a family day or night out across the UK, with food and other things to do nearby. Your next big day out starts here.'],
    bowling: ['Bowling Alleys for a Family Day Out in the UK | Spin Raiders', 'Find UK bowling alleys for a family day out, with arcades, food and other things to do nearby. Your next big day out starts here.'],
    'food-and-drink': ['Where to Eat on a UK Day Out | Spin Raiders', 'Places to eat on your day out: cafes, pubs, fish and chips and family-friendly restaurants near UK attractions and seaside towns.'],
    'food-and-drink-hub': ['Where to Eat on a UK Day Out | Spin Raiders', 'Places to eat on your day out: cafes, pubs, fish and chips and family-friendly restaurants near UK attractions and seaside towns.'],
    map: ['UK Days Out Map: Attractions, Beaches & Arcades | Spin Raiders', 'Plan your next big day out on the map: attractions, beaches, museums, food, places to stay and arcades across the UK.'],
    'about-us': ['About Spin Raiders | UK Days Out, Road Trips & Arcades', 'Spin Raiders plans real UK days out and road trips: family attractions, seaside towns, food and places to stay, plus arcades and classic fruit machines.'],
    blog: ['Spin Raiders Blog | UK Days Out, Road Trips & Arcade Guides', 'Ideas for your next big day out: UK road trips, family days out, seaside towns and attractions, plus arcade and fruit machine guides.'],
};

async function generalPage(key) {
    const seo = GENERAL_PAGE_SEO[key];
    if (!seo) return;
    await apply({ title: seo[0], description: seo[1], url: `${SITE}/${key}` });
}

async function homePage() {
    await apply({
        title: HOME_TITLE,
        description: HOME_DESC,
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

async function canonicalDetailPage(resolved) {
    const item = resolved.row, route = resolved.route;
    if (route.routeType === 'historical' || route.routeType === 'unverified') {
        const name=first(item.displayTitle,item.displayName,item.title,item.name);
        return apply({title:first(item.seoTitle,name+' | '+BRAND),description:route.contentNotice,url:route.canonicalUrl,noindex:true,schema:[{'@context':'https://schema.org','@type':'Article',headline:name,url:route.canonicalUrl,description:route.contentNotice}]});
    }
    if (route.kind === 'destination') return townPage(resolved);
    if (route.kind === 'food') return foodPage(resolved);
    if (route.kind === 'arcade') return venuePage(resolved);
    const name = first(item.displayTitle, item.displayName, item.title, item.name);
    const description = first(item.seoDescription, item.shortDescription, item.summary, item.overview);
    const image = wixImageUrl(item.mainImage || item.heroImage || item.cardImage || item.image);
    const type = route.routeType === 'operator' ? 'Organization' : route.kind === 'hotel' ? 'Hotel' : route.kind === 'machine' ? 'Thing' : venueSchemaType(item);
    await apply({ title: first(item.seoTitle, name + ' | ' + BRAND), description, image,
        url: route.canonicalUrl, noindex: route.indexable === false || item.pageReady === false || item.directoryReady === false,
        schema: [{ '@context': 'https://schema.org', '@type': type, name, url: route.canonicalUrl,
            description: clip(description, 300), image: image || undefined },
            breadcrumbs([{ name: 'Home', path: '/' }, { name, path: route.path }])] });
}
export async function applyPageSeo(pathParts, routerData) {
    try {
        if (routerData?.view === 'index' && [...Object.values(ROUTES), ...Object.values(INDEX_ROUTES)].some(route => route.prefix === routerData.route?.path)) {
            await wixSeoFrontend.setLinks([...existingLinks, { rel: 'canonical', href: SITE + routerData.route.path }]);
            return; // Preserve exact native/router landing title, description and artwork.
        }
        if (routerData?.view === 'detail' && routerData.record && parseCanonical(routerData.route?.path).ok) {
            return canonicalDetailPage({ row: routerData.record, route: routerData.route });
        }
        const parts = (pathParts || []).map(String);
        if (!parts.length || (parts.length === 1 && parts[0] === 'home')) return await homePage();
        const path = '/' + parts.join('/'), canonical = parseCanonical(path);
        if (canonical.ok && canonical.kind !== 'machineIndex') {
            const result = await getCanonicalPage(path);
            if (result.status === 200) return await canonicalDetailPage(result);
            await wixSeoFrontend.setLinks(existingLinks);
            return await apply({ noindex: true });
        }
        if (parts.length === 1 && GENERAL_PAGE_SEO[parts[0]]) return await generalPage(parts[0]);
    } catch (err) { console.warn('Spin Raiders SEO unavailable', err); }
}
