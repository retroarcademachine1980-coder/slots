import { listMachines } from 'backend/directory.web';
import { bindCardRepeater } from 'public/cardBinder';

const PAGE_SIZE = 80;
let activeQuery = '';
let loaded = 0;
let total = 0;

async function load(reset = false) {
    if (reset) loaded = 0;

    const response = await listMachines({
        query: activeQuery,
        offset: loaded,
        limit: PAGE_SIZE
    });

    const incoming = response.results || [];
    const current = reset ? [] : ($w('#archiveRepeater').data || []);
    $w('#archiveRepeater').data = [...current, ...incoming];

    loaded += incoming.length;
    total = response.total || 0;
    $w('#archiveCount').text = total === 1 ? '1 machine' : total + ' machines';

    if (response.hasMore) {
        $w('#archiveLoadMore').show();
        $w('#archiveLoadMore').enable();
    } else {
        $w('#archiveLoadMore').hide();
    }
}

$w.onReady(async function () {
    bindCardRepeater($w('#archiveRepeater'), []);
    $w('#archiveLoadMore').hide();

    $w('#archiveSearchButton').onClick(async () => {
        activeQuery = String($w('#archiveSearchInput').value || '').trim();
        await load(true);
    });

    $w('#archiveSearchInput').onKeyPress(async event => {
        if (event.key === 'Enter') {
            activeQuery = String($w('#archiveSearchInput').value || '').trim();
            await load(true);
        }
    });

    $w('#archiveLoadMore').onClick(() => load(false));
    await load(true);
});
