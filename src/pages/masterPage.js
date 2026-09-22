import wixLocation from 'wix-location';
import { getSearchSuggestions } from 'backend/search.web';

let suggestionRequest = 0;
let suggestionTimer;

function goToSearch(value) {
    const query = String(value || '').trim();
    if (!query) {
        wixLocation.to('/search');
        return;
    }
    wixLocation.to('/search?q=' + encodeURIComponent(query));
}

function hideSuggestions() {
    $w('#globalSuggestionsRepeater').data = [];
    $w('#globalSuggestionsRepeater').collapse();
}

async function loadSuggestions(value) {
    const query = String(value || '').trim();
    const request = ++suggestionRequest;

    if (query.length < 2) {
        hideSuggestions();
        return;
    }

    try {
        const items = await getSearchSuggestions(query, 10);
        if (request !== suggestionRequest) return;

        $w('#globalSuggestionsRepeater').data = items || [];
        if (items && items.length) {
            $w('#globalSuggestionsRepeater').expand();
        } else {
            $w('#globalSuggestionsRepeater').collapse();
        }
    } catch (_) {
        if (request === suggestionRequest) hideSuggestions();
    }
}

$w.onReady(function () {
    const input = $w('#globalSearchInput');
    const button = $w('#globalSearchButton');
    const suggestions = $w('#globalSuggestionsRepeater');

    suggestions.onItemReady(($item, itemData) => {
        $item('#suggestionButton').label = itemData.label || '';
        $item('#suggestionMeta').text = itemData.subtitle || '';

        $item('#suggestionButton').onClick(() => {
            if (itemData.route) {
                wixLocation.to(itemData.route);
            } else {
                goToSearch(itemData.searchValue || itemData.label);
            }
        });
    });

    hideSuggestions();

    button.onClick(() => goToSearch(input.value));

    input.onKeyPress(event => {
        if (event.key === 'Enter') {
            goToSearch(input.value);
        }
    });

    input.onInput(() => {
        if (suggestionTimer) clearTimeout(suggestionTimer);
        suggestionTimer = setTimeout(() => loadSuggestions(input.value), 250);
    });
});
