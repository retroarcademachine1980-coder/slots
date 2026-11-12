// Existing Original Food Item controls, observed in the editor 6 November 2026:
// #title, #description, #text1; #dynamicDataset remains connected and read-only.
// No layout, image, rating, booking action or collection write belongs here.
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function article(row) {
    for (const field of ['sourceFacts', 'fullDescription', 'detailedReview', 'guideContent', 'description']) {
        const value = text(row?.[field]);
        if (value) return value;
    }
    return '';
}
function html(value) {
    if (/<(?:p|h[1-6]|ul|ol|div|blockquote)\b/i.test(value)) return value;
    return value.split(/\n\s*\n/).map(part => '<p>' + part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>').join('\n');
}
export function foodArticleContent(result, path) {
    const row = result?.row || result?.record;
    if (result?.status !== undefined && result.status !== 200) return null;
    if (result?.collection !== 'FoodAndDrink' || result.route?.kind !== 'food' || result.route.path !== path || !row?._id) return null;
    const primaryKey = 'FoodAndDrink:' + row._id;
    if (result.route.key !== primaryKey) return null;
    let body = article(row);
    const group = result.sourceGroup;
    // Related reviews are accepted only from the canonical resolver's explicit
    // same-entity group. Never borrow an article from a nearby/similarly named venue.
    if (!body && group?.relation === 'same-entity' && group.primaryKey === primaryKey && group.identityUnderReview !== true) {
        const allowed = new Set(group.sourceKeys || []);
        const sources = (result.sourceRecords || []).filter(source => allowed.has(source.key) && source.key === source.collection + ':' + source.row?._id);
        const linked = sources.find(source => source.collection === 'NearbyAttractions' && source.row._id === row.linkedAttractionId);
        const venue = sources.find(source => source.collection === 'Venues' && source.row.linkedAttractionId === row.linkedAttractionId && row.linkedAttractionId);
        body = article(linked?.row) || article(venue?.row);
    }
    return {
        title: text(row.title) || text(row.displayName),
        summary: text(row.shortDescription),
        bodyHtml: body ? html(body) : ''
    };
}
export async function renderFoodArticle({ select, path, routerData, load, environment = 'browser' }) {
    try {
        // Browser connections must finish before assigning the full review, so
        // their shorter listing fields cannot subsequently replace it. The
        // server already has an identity-bound router/canonical source and must
        // not depend on a client dataset completing its readiness cycle.
        if (environment !== 'backend') await select('#dynamicDataset').onReadyAsync();
        const direct = foodArticleContent(routerData, path);
        const content = direct || foodArticleContent(await load(path), path);
        if (!content) return false;
        if (content.title) select('#title').text = content.title;
        if (content.summary) select('#description').text = content.summary;
        if (content.bodyHtml) select('#text1').html = content.bodyHtml;
        return true;
    } catch {
        // Leave the existing CMS page intact if retrieval or rendering fails.
        return false;
    }
}
