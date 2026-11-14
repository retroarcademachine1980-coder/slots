import wixLocation from 'wix-location-frontend';
import { getRouterData } from 'wix-window-frontend';
import { getCanonicalPage } from 'backend/canonicalPages.web';
import { applyPageSeo } from 'public/seo';
import { renderNativeGuide } from 'public/native-guide-article';

$w.onReady(async function () {
    // The planner is a static tool page, without router data or a detail record.
    await applyPageSeo(['plan-a-trip']);
    // Fills the page's two guide text controls during server rendering; does
    // nothing until the template has both.
    let routerData;
    try { routerData = getRouterData(); } catch { /* Editor views can omit router data. */ }
    const path = '/' + [wixLocation.prefix, ...(wixLocation.path || [])].filter(Boolean).join('/');
    return await renderNativeGuide({ select: $w, path, kind: 'tripIndex', routerData, load: getCanonicalPage });
});
