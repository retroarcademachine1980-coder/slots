import { listVenues } from 'backend/directory.web';
import { bindCardRepeater } from 'public/cardBinder';

const PAGE_SIZE = 60;
let activeQuery = '';
let loaded = 0;
let total = 0;

async function load(reset = false) {
    if (reset) loaded = 0;

    const response = await listVenues({
        query: activeQuery,
        offset: loaded,
        limit: PAGE_SIZE
    });

    const incoming = response.results || [];
    const current = reset ? [] : ($w('#arcadeRepeater').data || []);
    $w('#arcadeRepeater').data = [...current, ...incoming];

    loaded += incoming.length;
    total = response.total || 0;
    $w('#arcadeCount').text = total === 1 ? '1 place' : total + ' places';

    if (response.hasMore) {
        $w('#arcadeLoadMore').show();
        $w('#arcadeLoadMore').enable();
    } else {
        $w('#arcadeLoadMore').hide();
    }
}

$w.onReady(async function () {
    bindCardRepeater($w('#arcadeRepeater'), []);
    $w('#arcadeLoadMore').hide();

    $w('#arcadeSearchButton').onClick(async () => {
        activeQuery = String($w('#arcadeSearchInput').value || '').trim();
        await load(true);
    });

    $w('#arcadeSearchInput').onKeyPress(async event => {
        if (event.key === 'Enter') {
            activeQuery = String($w('#arcadeSearchInput').value || '').trim();
            await load(true);
        }
    });

    $w('#arcadeLoadMore').onClick(() => load(false));
    await load(true);
});
