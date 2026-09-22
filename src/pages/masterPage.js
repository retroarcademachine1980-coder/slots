import wixLocation from 'wix-location-frontend';
import { wireSearchEntryPoints } from 'public/discovery-ui';

$w.onReady(function () {
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
