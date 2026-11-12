// Native text companion to the existing tourism renderer. This never changes
// CMS content, ratings, photographs, routes or the visitor-facing design.
const INDEX_PATHS = Object.freeze({ attraction: '/attractions', historicSite: '/historical-sites', tour: '/tours' });
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function html(value) {
    if (/<(?:p|h[1-6]|ul|ol|div|blockquote)\b/i.test(value)) return value;
    return value.split(/\n\s*\n/).map(part => '<p>' + part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>').join('\n');
}
export function nativeGuideContent(result, path, kind) {
    if (!Object.hasOwn(INDEX_PATHS, kind) || result?.route?.kind !== kind || result.route.path !== path) return null;
    if (result.status !== undefined && result.status !== 200) return null;
    if (result.view === 'index') {
        const title = text(result.metadata?.sourceTitle), body = text(result.metadata?.introduction);
        return path === INDEX_PATHS[kind] && title && body ? { title, bodyHtml: html(body) } : null;
    }
    if (result.view !== undefined && result.view !== 'detail') return null;
    const row = result.record || result.row;
    if (!['Venues', 'NearbyAttractions'].includes(result.collection) || !row?._id) return null;
    if (result.route.key !== result.collection + ':' + row._id) return null;
    const title = text(row.displayTitle) || text(row.title) || text(row.name);
    // Venues keep their article in detailedReview; sourceFacts may only be a
    // citation. NearbyAttractions uses sourceFacts for its full updated guide.
    const fields = result.collection === 'Venues'
        ? ['detailedReview', 'fullDescription', 'guideContent', 'sourceFacts', 'description']
        : ['sourceFacts', 'fullDescription', 'detailedReview', 'guideContent', 'description'];
    const body = fields.map(field => text(row[field])).find(Boolean);
    return title && body ? { title, bodyHtml: html(body) } : null;
}
export async function renderNativeGuide({ select, path, kind, routerData, load }) {
    try {
        const content = nativeGuideContent(routerData, path, kind) || nativeGuideContent(await load(path), path, kind);
        if (!content) return false;
        const title = select('#srNativeGuideTitle'), article = select('#srNativeGuideArticle');
        if (!title || !article) return false;
        title.text = content.title;
        article.html = content.bodyHtml;
        return true;
    } catch {
        return false;
    }
}
