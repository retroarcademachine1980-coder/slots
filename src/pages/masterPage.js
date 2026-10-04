import { getRouterData } from 'wix-window-frontend';
import wixLocation from 'wix-location-frontend';
import { wireSearchEntryPoints } from 'public/discovery-ui';
import { applyPageSeo } from 'public/seo';

$w.onReady(async function () {
    // Server-rendered title, description, robots and structured data for venue,
    // town, food and home pages. Awaited so it lands in the HTML Google downloads.
    // Dynamic pages report their router prefix separately (e.g. prefix 'arcade-venues',
    // path ['the-mint-great-yarmouth']), so put it back on the front.
    let routerData;
    try { routerData = getRouterData(); } catch { /* Regular pages do not carry router data. */ }
    await applyPageSeo([wixLocation.prefix, ...(wixLocation.path || [])].filter(Boolean), routerData);

    // No automatic rating calculations or database saves.
    // Ratings must only change after a deliberate submission.

    const path = '/' + (wixLocation.path || []).join('/');

    // Dedicated search pages are mounted in their own page-code files.
    if (path === '/search' || path === '/search-suggestions') return;

    // Keep the map's existing map/filter behaviour intact until its real
    // Editor controls are synced and can be bound without guessing.
    if (path === '/map') return;

    // Header/home/directory search controls all feed the same Velo engine.
    wireSearchEntryPoints($w, '/search');
});
