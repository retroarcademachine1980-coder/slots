import { getMapPins } from 'backend/directory.web';

async function refreshMap() {
    const query = String($w('#mapSearchInput').value || '').trim();
    const response = await getMapPins({ query });

    $w('#mapCount').text = response.total === 1
        ? '1 mapped place'
        : response.total + ' mapped places';

    $w('#mapHtml').postMessage({
        type: 'spin-raiders-map-data',
        pins: response.pins || []
    });
}

$w.onReady(async function () {
    $w('#mapSearchButton').onClick(refreshMap);
    $w('#mapSearchInput').onKeyPress(event => {
        if (event.key === 'Enter') refreshMap();
    });
    await refreshMap();
});
