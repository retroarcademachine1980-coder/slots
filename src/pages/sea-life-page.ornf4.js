import wixLocation from 'wix-location-frontend';
import { getRouterData } from 'wix-window-frontend';
import { getCanonicalPage } from 'backend/canonicalPages.web';

// Existing Original editor H1 #srNativeGuideTitle, verified 12 November.
// An aquarium detail must receive its own name, never the index placeholder.
// The separate native article control remains a pending template requirement.
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
$w.onReady(async function () {
    let routerData;
    try { routerData = getRouterData(); } catch { /* Editor views can omit router data. */ }
    const path = '/' + [wixLocation.prefix, ...(wixLocation.path || [])].filter(Boolean).join('/');
    try {
        const title = seaLifeTitleContent(routerData, path) || seaLifeTitleContent(await getCanonicalPage(path), path);
        if (title) $w('#srNativeGuideTitle').text = title;
        return Boolean(title);
    } catch {
        return false;
    }
});
