import wixLocation from 'wix-location';

function goToSearch(value) {
    const query = String(value || '').trim();
    if (!query) {
        wixLocation.to('/search');
        return;
    }
    wixLocation.to('/search?q=' + encodeURIComponent(query));
}

$w.onReady(function () {
    const input = $w('#globalSearchInput');
    const button = $w('#globalSearchButton');

    button.onClick(() => goToSearch(input.value));
    input.onKeyPress(event => {
        if (event.key === 'Enter') goToSearch(input.value);
    });
});
