import wixLocation from 'wix-location-frontend';
import { getRouterData } from 'wix-window-frontend';
import { getCanonicalPage } from 'backend/canonicalPages.web';
import { renderNativeGuide } from 'public/native-guide-article';

// Fills the page's two guide text controls (srNativeGuideTitle, srNativeGuideArticle)
// during server rendering; does nothing until the template has both.
$w.onReady(async function () {
    let routerData;
    try { routerData = getRouterData(); } catch { /* Editor views can omit router data. */ }
    const path = '/' + [wixLocation.prefix, ...(wixLocation.path || [])].filter(Boolean).join('/');
    return await renderNativeGuide({ select: $w, path, kind: 'daysOutIndex', routerData, load: getCanonicalPage });
});
