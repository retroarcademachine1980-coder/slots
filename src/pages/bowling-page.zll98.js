import wixLocation from 'wix-location-frontend';
import { getRouterData } from 'wix-window-frontend';
import { getCanonicalPage } from 'backend/canonicalPages.web';

// Existing Original bowling controls saved and reloaded 12 November 2026:
// visible H1 srNativeGuideTitle and normal paragraph srNativeGuideArticle.
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function html(value) {
    if (/<(?:p|h[1-6]|ul|ol|div|blockquote)\b/i.test(value)) return value;
    return value.split(/\n\s*\n/).map(part => '<p>' + part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>').join('\n');
}
export function bowlingArticleContent(result, path) {
    if (result?.status !== undefined && result.status !== 200) return null;
    if (result?.route?.kind !== 'bowling' || result.route.path !== path) return null;
    if (result.view === 'index') {
        const title = text(result.metadata?.sourceTitle), body = text(result.metadata?.introduction);
        return path === '/bowling' && title && body ? { title, bodyHtml: html(body) } : null;
    }
    if (result.view !== undefined && result.view !== 'detail') return null;
    const row = result.record || result.row;
    if (!['Venues', 'NearbyAttractions'].includes(result.collection) || !row?._id) return null;
    if (result.route.key !== result.collection + ':' + row._id) return null;
    const title = text(row.displayTitle) || text(row.title) || text(row.name);
    // Venue sourceFacts often contains only a source-check note. Keep the actual
    // full review ahead of that note; attraction guides use their full sourceFacts.
    const fields = result.collection === 'Venues'
        ? ['detailedReview', 'fullDescription', 'guideContent', 'sourceFacts', 'description']
        : ['sourceFacts', 'fullDescription', 'detailedReview', 'guideContent', 'description'];
    const body = fields.map(field => text(row[field])).find(Boolean);
    return title && body ? { title, bodyHtml: html(body) } : null;
}
export async function renderBowlingArticle({ select, path, routerData, load }) {
    try {
        const content = bowlingArticleContent(routerData, path) || bowlingArticleContent(await load(path), path);
        if (!content) return false;
        // Resolve both controls before assigning either, preserving the existing
        // page if its native template has not yet received both text elements.
        const title = select('#srNativeGuideTitle'), article = select('#srNativeGuideArticle');
        if (!title || !article) return false;
        title.text = content.title;
        article.html = content.bodyHtml;
        return true;
    } catch {
        return false;
    }
}
$w.onReady(async function () {
    let routerData;
    try { routerData = getRouterData(); } catch { /* Editor views can omit router data. */ }
    const path = '/' + [wixLocation.prefix, ...(wixLocation.path || [])].filter(Boolean).join('/');
    return await renderBowlingArticle({ select: $w, path, routerData, load: getCanonicalPage });
});
