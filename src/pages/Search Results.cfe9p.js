import wixLocation from 'wix-location';
import { searchEverything } from 'backend/search.web';

let requestId = 0;

function groupLabel(kind) {
    const labels = {
        location: 'Destinations',
        venue: 'Venues',
        attraction: 'Things to do',
        recommendation: 'Hotels, food & recommendations',
        offer: 'Offers',
        guide: 'Guides',
        video: 'Videos',
        machine: 'Classic fruit machines',
        'machine-family': 'Machine families',
        sighting: 'Machine sightings',
        manufacturer: 'Manufacturers',
        'machine-directory': 'Machines',
        partner: 'Partners'
    };
    return labels[kind] || 'Results';
}

function setStatus(message) {
    $w('#resultsStatus').text = message;
}

function setCount(total) {
    $w('#resultsCount').text = total === 1 ? '1 result' : total + ' results';
}

function bindCard($item, itemData) {
    $item('#resultTitle').text = itemData.title || '';
    $item('#resultMeta').text = [itemData.subtitle, groupLabel(itemData.kind)]
        .filter(Boolean)
        .join(' · ');
    $item('#resultDescription').text = itemData.description || '';

    if (itemData.image) {
        $item('#resultImage').src = itemData.image;
        $item('#resultImage').alt = itemData.alt || itemData.title || '';
        $item('#resultImage').show();
    } else {
        $item('#resultImage').hide();
    }

    $item('#resultButton').label =
        itemData.kind === 'offer' || itemData.kind === 'recommendation'
            ? 'View'
            : 'Explore';

    if (itemData.route) {
        $item('#resultButton').link = itemData.route;
        $item('#resultButton').enable();
    } else {
        $item('#resultButton').disable();
    }
}

async function runSearch(value) {
    const query = String(value || '').trim();
    const myRequest = ++requestId;

    if (!query) {
        $w('#resultsRepeater').data = [];
        setCount(0);
        setStatus('Search destinations, venues, hotels, attractions, arcades, machines and more.');
        return;
    }

    setStatus('Searching everything…');

    try {
        const response = await searchEverything(query, { limit: 200 });
        if (myRequest !== requestId) return;

        $w('#resultsRepeater').data = response.results || [];
        setCount(response.total || 0);

        if (response.total) {
            const groups = Object.entries(response.groups || {})
                .map(([kind, count]) => count + ' ' + groupLabel(kind).toLowerCase())
                .join(' · ');
            setStatus(groups || 'Results found.');
        } else {
            setStatus('No results found. Try a town, venue, hotel, attraction, arcade or machine name.');
        }
    } catch (_) {
        if (myRequest !== requestId) return;
        $w('#resultsRepeater').data = [];
        setCount(0);
        setStatus('Search is temporarily unavailable.');
    }
}

$w.onReady(function () {
    $w('#resultsRepeater').onItemReady(($item, itemData) => bindCard($item, itemData));

    $w('#searchButton').onClick(() => runSearch($w('#searchInput').value));
    $w('#searchInput').onKeyPress(event => {
        if (event.key === 'Enter') runSearch($w('#searchInput').value);
    });

    const initial = String(
        (wixLocation.query && (wixLocation.query.q || wixLocation.query.search)) || ''
    ).trim();

    if (initial) {
        $w('#searchInput').value = initial;
        runSearch(initial);
    } else {
        setCount(0);
        setStatus('Search destinations, venues, hotels, attractions, arcades, machines and more.');
    }
});
