import { hubGuideArticle } from 'public/hub-guide-articles';
// Native text companion to the existing tourism renderer. This never changes
// CMS content, ratings, photographs, routes or the visitor-facing design.
const INDEX_PATHS = Object.freeze({ attraction: '/attractions', historicSite: '/historical-sites', tour: '/tours',
    agc: '/agc', arcade: '/arcade', arcadeBar: '/arcade-bars', bingo: '/bingo-halls', casino: '/casinos',
    fishing: '/fishing-lakes', holidayPark: '/holiday-parks', outdoors: '/outdoors', pier: '/piers',
    service: '/services', themePark: '/theme-parks', hotel: '/hotel', machine: '/classic-fruit-machines',
    daysOutIndex: '/days-out', staysIndex: '/places-to-stay', offersIndex: '/offers', familyFunIndex: '/family-fun',
    hiddenGemsIndex: '/hidden-gems', retroIndex: '/retro-video-games', tripIndex: '/plan-a-trip' });
// Collections whose own written guide may be shown, with the fields read in order.
const GUIDE_FIELDS = Object.freeze({
    Venues: ['detailedReview', 'fullDescription', 'guideContent', 'sourceFacts', 'description', 'overview', 'pageIntro'],
    NearbyAttractions: ['sourceFacts', 'fullDescription', 'detailedReview', 'guideContent', 'description'],
    HotelGuides: ['guideContent', 'guideDetails', 'description'],
    ClassicFruitMachines: ['description', 'history', 'gameplay_guide', 'lore_review'],
});
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function html(value) {
    if (/<(?:p|h[1-6]|ul|ol|div|blockquote)\b/i.test(value)) return value;
    return value.split(/\n\s*\n/).map(part => '<p>' + part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>').join('\n');
}
export function nativeGuideContent(result, path, kind) {
    if (!Object.hasOwn(INDEX_PATHS, kind) || result?.route?.kind !== kind || result.route.path !== path) return null;
    if (result.status !== undefined && result.status !== 200) return null;
    if (result.view === 'index') {
        const title = text(result.metadata?.sourceTitle), body = text(result.metadata?.articleHtml) || text(hubGuideArticle(path)?.html) || text(result.metadata?.introduction);
        return path === INDEX_PATHS[kind] && title && body ? { title, bodyHtml: html(body) } : null;
    }
    if (result.view !== undefined && result.view !== 'detail') return null;
    const row = result.record || result.row;
    if (!Object.hasOwn(GUIDE_FIELDS, result.collection) || !row?._id) return null;
    if (result.route.key !== result.collection + ':' + row._id) return null;
    const title = text(row.displayTitle) || text(row.title) || text(row.name);
    // Venues keep their article in detailedReview; sourceFacts may only be a
    // citation. NearbyAttractions uses sourceFacts for its full updated guide.
    const fields = GUIDE_FIELDS[result.collection];
    const body = fields.map(field => text(row[field])).find(Boolean);
    return title && body ? { title, bodyHtml: html(body) } : null;
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
export async function renderNativeGuide({ select, path, kind, routerData, load }) {
    try {
        const content = nativeGuideContent(routerData, path, kind) || nativeGuideContent(await load(path), path, kind);
        if (!content) { clearGuide(select); return false; }
        const title = select('#srNativeGuideTitle'), article = select('#srNativeGuideArticle');
        if (!title || !article) return false;
        title.text = content.title;
        article.html = content.bodyHtml;
        return true;
    } catch {
        clearGuide(select);
        return false;
    }
}

// Static hub pages (no router data): show the hub's own written guide, the same
// text the visitor-facing hub already displays.
export function renderHubGuide({ select, path }) {
    try {
        const article = hubGuideArticle(path);
        if (!article?.title || !article?.html) { clearGuide(select); return false; }
        select('#srNativeGuideTitle').text = article.title;
        select('#srNativeGuideArticle').html = article.html;
        return true;
    } catch {
        clearGuide(select);
        return false;
    }
}
