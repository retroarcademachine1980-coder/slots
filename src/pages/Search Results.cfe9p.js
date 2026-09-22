import wixLocation from 'wix-location';
import { searchEverything } from 'backend/search.web';

const PAGE_SIZE = 100;
let requestId = 0;
let activeQuery = '';
let loaded = 0;
let total = 0;

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

function setCount(value) {
    $w('#resultsCount').text = value === 1 ? '1 result' : value + ' results';
}

function updateLoadMore(hasMore) {
    if (hasMore) {
        $w('#loadMoreButton').show();
        $w('#loadMoreButton').enable();
    } else {
        $w('#loadMoreButton').hide();
    }
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

async function fetchPage(query, offset, append) {
    const myRequest = ++requestId;

    if (!append) {
        setStatus('Searching everything…');
        $w('#resultsRepeater').data = [];
        loaded = 0;
        total = 0;
        updateLoadMore(false);
    } else {
        $w('#loadMoreButton').disable();
    }

    try {
        const response = await searchEverything(query, {
            limit: PAGE_SIZE,
            offset
        });

        if (myRequest !== requestId) return;

        const incoming = response.results || [];
        const current = append ? ($w('#resultsRepeater').data || []) : [];
        $w('#resultsRepeater').data = [...current, ...incoming];

        loaded = offset + incoming.length;
        total = response.total || 0;
        setCount(total);
        updateLoadMore(Boolean(response.hasMore));

        if (total) {
            const groups = Object.entries(response.groups || {})
                .map(([kind, count]) => count + ' ' + groupLabel(kind).toLowerCase())
                .join(' · ');
            setStatus(groups || 'Results found.');
        } else {
            setStatus('No results found. Try a town, venue, hotel, attraction, arcade or machine name.');
        }
    } catch (_) {
        if (myRequest !== requestId) return;
        if (!append) $w('#resultsRepeater').data = [];
        updateLoadMore(false);
        setStatus('Search is temporarily unavailable.');
    }
}

async function runSearch(value) {
    const query = String(value || '').trim();

    if (!query) {
        activeQuery = '';
        loaded = 0;
        total = 0;
        $w('#resultsRepeater').data = [];
        setCount(0);
        updateLoadMore(false);
        setStatus('Search destinations, venues, hotels, attractions, arcades, machines and more.');
        return;
    }

    activeQuery = query;
    await fetchPage(query, 0, false);
}

$w.onReady(function () {
    $w('#resultsRepeater').onItemReady(($item, itemData) => bindCard($item, itemData));

    $w('#searchButton').onClick(() => runSearch($w('#searchInput').value));

    $w('#searchInput').onKeyPress(event => {
        if (event.key === 'Enter') runSearch($w('#searchInput').value);
    });

    $w('#loadMoreButton').onClick(() => {
        if (activeQuery && loaded < total) {
            fetchPage(activeQuery, loaded, true);
        }
    });

    const initial = String(
        (wixLocation.query && (wixLocation.query.q || wixLocation.query.search)) || ''
    ).trim();

    if (initial) {
        $w('#searchInput').value = initial;
        runSearch(initial);
    } else {
        setCount(0);
        updateLoadMore(false);
        setStatus('Search destinations, venues, hotels, attractions, arcades, machines and more.');
    }
});
