import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';

function sortByOrder(a, b) {
    return Number(a.displayOrder || 9999) - Number(b.displayOrder || 9999);
}

function cleanText(value) {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function imageValue(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.url || '';
}

function standardCard({
    id,
    title,
    subtitle,
    category,
    description,
    image,
    alt,
    route,
    location,
    displayOrder
}) {
    return {
        _id: String(id || title || ''),
        title: String(title || ''),
        subtitle: String(subtitle || ''),
        category: String(category || ''),
        description: cleanText(description || '').slice(0, 280),
        image: imageValue(image),
        alt: String(alt || title || ''),
        route: String(route || ''),
        location: String(location || ''),
        displayOrder: Number(displayOrder || 9999)
    };
}

function feedCard(row) {
    return standardCard({
        id: row._id,
        title: row.title,
        subtitle: row.subtitle,
        category: row.badge || row.sectionType,
        description: row.summary,
        image: row.image,
        alt: row.altText || row.title,
        route: row.link,
        location: row.town,
        displayOrder: row.displayOrder
    });
}

function venueCard(row) {
    return standardCard({
        id: 'venue:' + row._id,
        title: row.title,
        subtitle: row.locationName,
        category: row.venueType || 'Venue',
        description: row.shortDescription || row.seoDescription || row.overview,
        image: row.heroImage,
        alt: row.exteriorImageAlt || row.title,
        route: row['link-arcade-venues-title'] || (row.slug ? '/arcade-venues/' + row.slug : ''),
        location: row.locationName
    });
}

function recommendationCard(row) {
    return standardCard({
        id: 'recommendation:' + row._id,
        title: row.displayTitle || row.name || row.offerTitle,
        subtitle: row.locationName || row.destination,
        category: row.category || 'Recommendation',
        description: row.summary || row.offerText,
        image: row.dealImage || row.image,
        alt: row.imageAlt || row.displayTitle || row.name,
        route: row.guideReady === true || String(row.linkType || '').toUpperCase().startsWith('SPIN RAIDERS')
            ? '/destination-recommendations?collection=DestinationRecommendations&place=' + encodeURIComponent(row._id)
            : (row.affiliateUrl || row.outboundUrl || row.bookingUrl || row.offerUrl || row.website),
        location: row.locationName || row.destination
    });
}

function hotelCard(row) {
    return standardCard({
        id: 'hotel:' + row._id,
        title: row.title,
        subtitle: row.locationName || row.destination,
        category: 'Hotel',
        description: row.guideDetails || row.guideContent,
        image: row.image,
        alt: row.imageAlt || row.title,
        route: row.canonicalUrl || (row.slug ? '/hotels/' + row.slug : ''),
        location: row.locationName || row.destination
    });
}

function attractionCard(row) {
    return standardCard({
        id: 'attraction:' + row._id,
        title: row.title,
        subtitle: row.locationName,
        category: row.category || 'Thing to do',
        description: row.shortDescription,
        image: row.heroImage,
        alt: row.title,
        route: row.website || row.googleMapsUrl || (
            row.locationSlug && row.slug
                ? '/arcade-locations/' + row.locationSlug + '#' + row.slug
                : ''
        ),
        location: row.locationName
    });
}

function publicVenue(row) {
    const status = String(row.status || '').toLowerCase();
    return row.title && row.heroImage &&
        !/duplicate|closed - historical|not a separate venue/.test(status);
}

function publicAttraction(row) {
    const status = String(row.researchStatus || '').toLowerCase();
    return row.title && row.heroImage &&
        !/duplicate|not open to general public|research retained/.test(status);
}

export const getHomepageData = webMethod(Permissions.Anyone, async () => {
    const [
        sectionsResult,
        feedResult,
        venueResult,
        recommendationResult,
        hotelResult,
        attractionResult
    ] = await Promise.all([
        wixData.query('HomepageSections')
            .eq('enabled', true)
            .ascending('displayOrder')
            .limit(100)
            .find(),
        wixData.query('HomepageArcadeFeed')
            .eq('active', true)
            .ascending('displayOrder')
            .limit(500)
            .find(),
        wixData.query('Venues')
            .eq('featured', true)
            .limit(100)
            .find(),
        wixData.query('AffiliateOffers')
            .limit(1000)
            .find(),
        wixData.query('HotelGuides')
            .eq('active', true)
            .limit(1000)
            .find(),
        wixData.query('NearbyAttractions')
            .limit(1000)
            .find()
    ]);

    const sections = (sectionsResult.items || [])
        .sort(sortByOrder)
        .map(row => ({
            _id: String(row._id || ''),
            key: row.sectionKey || '',
            eyebrow: row.eyebrow || '',
            heading: row.heading || '',
            body: cleanText(row.body || ''),
            primaryCtaLabel: row.primaryCtaLabel || '',
            primaryCtaUrl: row.primaryCtaUrl || '',
            secondaryCtaLabel: row.secondaryCtaLabel || '',
            secondaryCtaUrl: row.secondaryCtaUrl || '',
            displayOrder: Number(row.displayOrder || 9999)
        }));

    const feed = (feedResult.items || []).map(feedCard).sort(sortByOrder);
    const groups = {};

    for (const item of feed) {
        const original = (feedResult.items || []).find(row => String(row._id) === item._id);
        const key = original?.sectionKey || 'other';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    }

    const featuredVenues = (venueResult.items || [])
        .filter(publicVenue)
        .map(venueCard)
        .slice(0, 6);

    const recommendations = recommendationResult.items || [];

    const hotels = (hotelResult.items || [])
        .filter(row => row.title && row.image && row.canonicalUrl)
        .sort((a, b) =>
            Number(b.offerCount || 0) - Number(a.offerCount || 0) ||
            String(a.title || '').localeCompare(String(b.title || ''))
        )
        .map(hotelCard)
        .slice(0, 6);

    const food = recommendations
        .filter(row =>
            /food/i.test(String(row.category || '')) &&
            (row.dealImage || row.image)
        )
        .map(recommendationCard)
        .slice(0, 6);

    const thingsToDo = (attractionResult.items || [])
        .filter(publicAttraction)
        .map(attractionCard)
        .slice(0, 6);

    return {
        sections,
        hero: (groups.hero || [])[0] || null,
        destinations: (groups['top-destinations'] || []).slice(0, 6),
        browseByType: (groups['browse-by-type'] || []).slice(0, 6),
        monthlyPicks: (groups['monthly-picks'] || []).slice(0, 4),
        featuredPlaces: featuredVenues,
        featuredVenues,
        hotels,
        food,
        thingsToDo,
        groups
    };
});
