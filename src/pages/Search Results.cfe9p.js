import wixLocation from 'wix-location';
import { searchDirectory } from 'backend/search.web';

let requestId = 0;

function list(selector) {
    try {
        const value = $w(selector);
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value.forEach === 'function') {
            const items = [];
            value.forEach(item => items.push(item));
            return items;
        }
        return [value];
    } catch (_) {
        return [];
    }
}

function read(element, key) {
    try { return String(element && element[key] || ''); } catch (_) { return ''; }
}

function identity(element) {
    return [
        read(element, 'id'),
        read(element, 'placeholder'),
        read(element, 'label'),
        read(element, 'text')
    ].join(' ').toLowerCase();
}

function searchInputs() {
    return list('TextInput').filter(input => {
        const value = identity(input);
        return !/email|password|phone/.test(value) &&
            /search|venue|town|machine|place|destination|postcode/.test(value);
    });
}

function searchButtons() {
    return list('Button').filter(button =>
        /search|find|go|explore/.test(identity(button))
    );
}

function resultRepeater() {
    const repeaters = list('Repeater');
    if (!repeaters.length) return null;
    const ranked = repeaters
        .map((repeater, index) => ({
            repeater,
            index,
            score: /search|result|directory|venue/.test(identity(repeater)) ? 10 : 0
        }))
        .sort((a, b) => b.score - a.score || a.index - b.index);
    return ranked[0].repeater;
}

function statusText() {
    const texts = list('Text');
    return texts.find(text =>
        /matching directory|couldn.?t find|search status|no close match|results/.test(read(text, 'text').toLowerCase())
    ) || null;
}

function setStatus(message) {
    const element = statusText();
    if (!element) return;
    try { element.text = message; } catch (_) {}
}

function asArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value.forEach === 'function') {
        const items = [];
        value.forEach(item => items.push(item));
        return items;
    }
    return [value];
}

function itemElements($item, selector) {
    try { return asArray($item(selector)); } catch (_) { return []; }
}

function renderItem($item, itemData) {
    const texts = itemElements($item, 'Text');
    const images = itemElements($item, 'Image');
    const buttons = itemElements($item, 'Button');

    if (texts[0]) {
        try { texts[0].text = itemData.title || ''; } catch (_) {}
    }
    if (texts[1]) {
        try { texts[1].text = [itemData.subtitle, itemData.category].filter(Boolean).join(' · '); } catch (_) {}
    }
    if (texts[2]) {
        try { texts[2].text = itemData.description || ''; } catch (_) {}
    }

    if (images[0] && itemData.image) {
        try { images[0].src = itemData.image; } catch (_) {}
        try { images[0].alt = itemData.title || ''; } catch (_) {}
    }

    if (buttons[0]) {
        try {
            buttons[0].label = itemData.kind === 'offer' ? 'View offer' : 'Find out more';
            buttons[0].link = itemData.route || '';
        } catch (_) {}
    }
}

function clearOldRepeaters(primary) {
    for (const repeater of list('Repeater')) {
        if (repeater === primary) continue;
        try { repeater.data = []; } catch (_) {}
        try { repeater.collapse(); } catch (_) {}
    }
}

async function runSearch(value) {
    const query = String(value || '').trim();
    const myRequest = ++requestId;
    const repeater = resultRepeater();

    if (!query) {
        if (repeater) {
            try { repeater.data = []; } catch (_) {}
        }
        setStatus('Search venues, towns, attractions, hotels and fruit machines.');
        return;
    }

    setStatus('Searching…');

    try {
        const result = await searchDirectory(query, 40);
        if (myRequest !== requestId) return;

        if (!repeater) {
            setStatus(result.total ? result.total + ' matching results.' : 'No matching results found.');
            return;
        }

        clearOldRepeaters(repeater);
        try { repeater.data = result.results || []; } catch (_) {}

        setStatus(result.total
            ? result.total + ' matching results.'
            : 'No matching results found. Try a venue, town, attraction or machine name.');
    } catch (_) {
        if (myRequest === requestId) {
            setStatus('Search is temporarily unavailable. Please try again.');
        }
    }
}

function currentValue(inputs) {
    const used = inputs.find(input => String(input.value || '').trim());
    return used ? used.value : '';
}

$w.onReady(function () {
    const inputs = searchInputs();
    const buttons = searchButtons();
    const repeater = resultRepeater();

    if (repeater) {
        repeater.onItemReady(($item, itemData) => renderItem($item, itemData));
        clearOldRepeaters(repeater);
        try { repeater.data = []; } catch (_) {}
    }

    for (const input of inputs) {
        input.onKeyPress(event => {
            if (event.key === 'Enter') runSearch(input.value);
        });
    }

    for (const button of buttons) {
        button.onClick(() => runSearch(currentValue(inputs)));
    }

    const query = String((wixLocation.query && (wixLocation.query.q || wixLocation.query.search)) || '').trim();
    if (query) {
        for (const input of inputs) {
            try { input.value = query; } catch (_) {}
        }
        runSearch(query);
    } else {
        setStatus('Search venues, towns, attractions, hotels and fruit machines.');
    }
});
