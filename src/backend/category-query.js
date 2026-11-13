import { categories } from 'public/category-config';

const text = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const bounded = (value, fallback, max) => Number.isFinite(Number(value))
    ? Math.min(max, Math.max(0, Math.floor(Number(value)))) : fallback;

export function buildCategoryQuery(wixData, options = {}) {
    const category = categories.find(item => item.slug === options.category);
    if (!category) throw new Error('Unknown venue category');
    const query = () => wixData.query('Venues');
    const alternatives = category.rules.map(rule => query()[rule.op](rule.field, rule.value));
    let result = query().eq('pageReady', true).eq('directoryReady', true).eq('cardReady', true)
        .and(alternatives.reduce((left, right) => left.or(right)));
    if (category.slug === 'bookmakers-with-fruit-machines') result = result.eq('fruitMachines', true);
    const town = text(options.town).slice(0, 120);
    if (town) result = result.contains('locationName', town);
    // AND the words, OR the searchable fields; membership remains mandatory.
    const words = text(options.search).slice(0, 160).split(/\s+/).filter(Boolean).slice(0, 12);
    for (const word of words) {
        const fields = ['unifiedSearchText', 'title', 'locationName', 'operator', 'brand'];
        result = result.and(fields.map(field => query().contains(field, word))
            .reduce((left, right) => left.or(right)));
    }
    const offset = bounded(options.offset, 0, 10000);
    const limit = Math.max(1, bounded(options.limit, 24, 48));
    return { query: result.ascending('title', '_id').skip(offset).limit(limit), offset, limit };
}

export function venueCategoryCard(row) {
    // Retain working legacy links until the new venue routes have passed live QA.
    const slug = String(row.slug || '');
    const route = slug ? '/arcade-venues/' + encodeURIComponent(slug) : '';
    const image = typeof row.heroImage === 'string' ? row.heroImage : row.heroImage?.url || '';
    const rating = Number(row.publicRating);
    const verifiedRating = String(row.publicRatingStatus || '').toLowerCase() === 'verified';
    return {
        _id: String(row._id),
        title: text(row.title),
        town: text(row.locationName),
        description: text(row.shortDescription || row.pageIntro).slice(0, 320),
        image,
        alt: text(row.exteriorImageAlt || [row.title, row.locationName].filter(Boolean).join(' ')),
        route,
        ratingText: verifiedRating && rating > 0 && rating <= 5 ? 'Public rating: ' + rating + '/5' : ''
    };
}

export async function queryCategoryVenues(wixData, options = {}) {
    const { query, offset, limit } = buildCategoryQuery(wixData, options);
    const page = await query.find();
    return {
        items: page.items.map(venueCategoryCard),
        total: page.totalCount,
        offset,
        limit,
        hasMore: page.hasNext()
    };
}
