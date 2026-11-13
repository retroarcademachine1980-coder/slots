import wixLocation from 'wix-location-frontend';
import { getRouterData } from 'wix-window-frontend';
import { getCanonicalPage } from 'backend/canonicalPages.web';

// Visible Text controls created in the existing Original editor, 6 November.
// The title is an H1; the normal paragraph is 16px. Neither is hidden/collapsed.
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function plainHtml(value) {
    if (/<(?:p|h[1-6]|ul|ol|div|blockquote)\b/i.test(value)) return value;
    return value.split(/\n\s*\n/).map(part => '<p>' + part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>').join('\n');
}
export function destinationArticleContent(result, path) {
    const row = result?.record || result?.row;
    if (result?.status !== undefined && result.status !== 200) return null;
    if (result?.view !== undefined && result.view !== 'detail') return null;
    if (result?.collection !== 'Locations' || result.route?.kind !== 'destination' || result.route.path !== path || !row?._id) return null;
    if (result.route.key !== 'Locations:' + row._id) return null;
    const title = text(row.title) || text(row.name);
    const article = ['overview', 'sourceFacts', 'fullDescription', 'guideContent', 'description'].map(field => text(row[field])).find(Boolean);
    if (!title || !article) return null;
    return { title, bodyHtml: plainHtml(article) };
}
// With no guide text for this address, never leave editor placeholder copy on the page.
function clearGuide(select) {
    for (const id of ['#srNativeGuideTitle', '#srNativeGuideArticle']) {
        let control;
        try { control = select(id); } catch { continue; }
        try { control.collapse(); } catch { /* not collapsible here */ }
        try { control.html = '<p> </p>'; } catch { /* keep going */ }
        try { control.text = ' '; } catch { /* control not on this template */ }
    }
}
export async function renderDestinationArticle({ select, path, routerData, load }) {
    try {
        // Both payloads must pass the same collection/key/path/kind checks.
        const content = destinationArticleContent(routerData, path) || destinationArticleContent(await load(path), path);
        if (!content) { clearGuide(select); return false; }
        const title = select('#srNativeGuideTitle');
        const article = select('#srNativeGuideArticle');
        title.text = content.title;
        article.html = content.bodyHtml;
        return true;
    } catch {
        clearGuide(select);
        return false;
    }
}
$w.onReady(async function () {
    let routerData;
    try { routerData = getRouterData(); } catch { /* Editor views can omit router data. */ }
    const path = '/' + [wixLocation.prefix, ...(wixLocation.path || [])].filter(Boolean).join('/');
    // Return the full promise to Wix's initial server-rendering lifecycle.
    return await renderDestinationArticle({ select: $w, path, routerData, load: getCanonicalPage });
});
