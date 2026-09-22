import wixLocation from 'wix-location-frontend';
import { wireSearchEntryPoints, mountAutoSearchResults } from 'public/discovery-ui';

$w.onReady(function () {
    // No automatic rating calculations or database saves.
    // Ratings must only change after a deliberate submission.

    const path = Array.isArray(wixLocation.path) ? wixLocation.path.join('/') : '';

    // Keep the dedicated map page's own place-search behaviour intact.
    if (path === 'map') return;

    if (path === 'search' || path === 'search-suggestions') {
        mountAutoSearchResults($w);
        return;
    }

    // Header/home/directory search controls now feed the same Velo discovery engine.
    wireSearchEntryPoints($w);
});
