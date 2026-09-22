import wixLocation from 'wix-location-frontend';
import { mountAutoSearchResults, wireSearchEntryPoints } from 'public/discovery-ui';

$w.onReady(function () {
    // No automatic rating calculations or database saves.
    // Ratings must only change after a deliberate submission.

    const path = '/' + (wixLocation.path || []).join('/');

    if (path === '/search') {
        mountAutoSearchResults($w);
        return;
    }

    // Connect every existing search-like input/button on the site to the
    // unified Velo discovery search without hard-coding unsynced Editor IDs.
    wireSearchEntryPoints($w, '/search');
});
