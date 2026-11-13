import wixLocation from 'wix-location-frontend';
import { getRouterData } from 'wix-window-frontend';
import { getCanonicalPage } from 'backend/canonicalPages.web';

// Existing Original controls verified 12 November: visible H1 and normal
// paragraph #srNativeGuideBody. Each detail keeps its own complete source guide.
export function seaLifeTitleContent(result, path) {
    if (result?.status !== undefined && result.status !== 200) return null;
    if (result?.route?.kind !== 'seaLife' || result.route.path !== path) return null;
    if (result.view === 'index') {
        const title = result.metadata?.sourceTitle;
        return path === '/sea-life' && typeof title === 'string' && title.trim() ? title.trim() : null;
    }
    if (result.view !== undefined && result.view !== 'detail') return null;
    const row = result.record || result.row;
    if (!['NearbyAttractions', 'Venues'].includes(result.collection) || !row?._id) return null;
    if (result.route.key !== result.collection + ':' + row._id) return null;
    const title = row.displayTitle || row.title || row.name;
    return typeof title === 'string' && title.trim() ? title.trim() : null;
}
function html(value) {
    if (/<(?:p|h[1-6]|ul|ol|div|blockquote)\b/i.test(value)) return value;
    return value.split(/\n\s*\n/).map(part => '<p>' + part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>').join('\n');
}
export function seaLifeGuideContent(result, path) {
    const title = seaLifeTitleContent(result, path);
    if (!title) return null;
    const row = result.record || result.row;
    const values = result.view === 'index' ? [result.metadata?.articleHtml, result.metadata?.introduction]
        : ['sourceFacts', 'fullDescription', 'detailedReview', 'guideContent', 'description'].map(field => row[field]);
    const body = values.find(value => typeof value === 'string' && value.trim());
    return body ? { title, bodyHtml: html(body.trim()) } : null;
}
// With no guide text for this address, never leave editor placeholder copy on the page.
function clearGuide() {
    for (const id of ['#srNativeGuideTitle', '#srNativeGuideBody']) {
        try { const control = $w(id); control.text = ''; control.collapse(); } catch { /* control not on this template */ }
    }
}
$w.onReady(async function () {
    let routerData;
    try { routerData = getRouterData(); } catch { /* Editor views can omit router data. */ }
    const path = '/' + [wixLocation.prefix, ...(wixLocation.path || [])].filter(Boolean).join('/');
    try {
        const content = seaLifeGuideContent(routerData, path) || seaLifeGuideContent(await getCanonicalPage(path), path);
        if (!content) { clearGuide(); return false; }
        $w('#srNativeGuideTitle').text = content.title;
        $w('#srNativeGuideBody').html = content.bodyHtml;
        return true;
    } catch {
        clearGuide();
        return false;
    }
});
