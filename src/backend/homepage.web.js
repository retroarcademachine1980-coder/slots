import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';

function sortByOrder(a, b) {
    return Number(a.displayOrder || 9999) - Number(b.displayOrder || 9999);
}

function cleanText(value) {
    return String(value || '').replace(/<[^>]*>/g, '').trim();
}

function card(row) {
    return {
        _id: String(row._id || ''),
        title: row.title || '',
        subtitle: row.subtitle || '',
        summary: cleanText(row.summary || ''),
        image: row.image || '',
        alt: row.altText || row.title || '',
        link: row.link || '',
        badge: row.badge || '',
        town: row.town || '',
        sectionKey: row.sectionKey || '',
        sectionType: row.sectionType || '',
        displayOrder: Number(row.displayOrder || 9999)
    };
}

export const getHomepageData = webMethod(Permissions.Anyone, async () => {
    const [sectionsResult, feedResult] = await Promise.all([
        wixData.query('HomepageSections')
            .eq('enabled', true)
            .ascending('displayOrder')
            .limit(100)
            .find(),
        wixData.query('HomepageArcadeFeed')
            .eq('active', true)
            .ascending('displayOrder')
            .limit(500)
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

    const feed = (feedResult.items || []).map(card).sort(sortByOrder);
    const groups = {};

    for (const item of feed) {
        const key = item.sectionKey || 'other';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    }

    return {
        sections,
        hero: (groups.hero || [])[0] || null,
        destinations: groups['top-destinations'] || [],
        browseByType: groups['browse-by-type'] || [],
        featuredPlaces: groups['featured-venues'] || [],
        groups
    };
});
