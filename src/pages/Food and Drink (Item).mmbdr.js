import wixLocation from 'wix-location-frontend';
import { getRouterData } from 'wix-window-frontend';
import { getCanonicalPage } from 'backend/canonicalPages.web';
import { renderFoodArticle } from 'public/food-article';

$w.onReady(async function () {
    let routerData;
    try { routerData = getRouterData(); } catch { /* Native CMS pages may omit router data. */ }
    const path = '/' + [wixLocation.prefix, ...(wixLocation.path || [])].filter(Boolean).join('/');
    return await renderFoodArticle({ select: $w, path, routerData, load: getCanonicalPage });
});
