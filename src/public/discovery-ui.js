import wixLocation from 'wix-location-frontend';
import { searchPlaces } from 'backend/discovery.web';

const wiredInputs = new WeakSet();
const wiredButtons = new WeakSet();

function asArray(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
}

function read(element, key) {
    try {
        return String(element && element[key] || '');
    } catch (_) {
        return '';
    }
}

function score(element, words) {
    const haystack = [
        read(element, 'id'),
        read(element, 'label'),
        read(element, 'placeholder'),
        read(element, 'text')
    ].join(' ').toLowerCase();

    return words.reduce((total, word, index) =>
        total + (haystack.includes(word) ? Math.max(1, words.length - index) : 0), 0
    );
}

function searchInputs($w) {
    try {
        return asArray($w('TextInput')).filter(input =>
            read(input, 'id') !== 'categorySearch' && read(input, 'id') !== 'townFilter' &&
            score(input, ['search', 'venue', 'town', 'city', 'postcode', 'place', 'where']) > 0
        );
    } catch (_) {
        return [];
    }
}

function searchButtons($w) {
    try {
        return asArray($w('Button')).filter(button =>
            score(button, ['search', 'find', 'explore', 'go']) > 0
        );
    } catch (_) {
        return [];
    }
}

function resultRepeater($w) {
    try {
        return [...asArray($w('Repeater'))]
            .sort((a, b) =>
                score(b, ['search', 'result', 'card', 'directory']) -
                score(a, ['search', 'result', 'card', 'directory'])
            )[0] || null;
    } catch (_) {
        return null;
    }
}

function statusText($w) {
    try {
        return asArray($w('Text'))
            .map(element => ({
                element,
                score: score(element, ['searchstatus', 'search', 'result', 'status', "couldn't find", 'couldn', 'spelling', 'another spelling'])
            }))
            .filter(row => row.score > 0)
            .sort((a, b) => b.score - a.score)[0]?.element || null;
    } catch (_) {
        return null;
    }
}

function toggleEmptyStateCopy($w, show) {
    try {
        const texts = asArray($w('Text'));
        for (const element of texts) {
            const value = read(element, 'text').toLowerCase();
            if (
                value.includes("couldn't find") ||
                value.includes('try another spelling') ||
                value.includes('search articles and blog posts')
            ) {
                if (show) {
                    if (typeof element.show === 'function') element.show();
                    if (typeof element.expand === 'function') element.expand();
                } else {
                    if (typeof element.hide === 'function') element.hide();
                    if (typeof element.collapse === 'function') element.collapse();
                }
            }
        }
    } catch (_) {}
}

function pickById(elements, pattern, fallbackIndex) {
    return elements.find(element => pattern.test(read(element, 'id'))) ||
        elements[fallbackIndex] ||
        null;
}

function setText(element, value) {
    if (!element) return;
    try {
        element.text = String(value || '');
    } catch (_) {}
}

function setImage(element, card) {
    if (!element) return;

    try {
        if (card.image) {
            element.src = card.image;
            if ('alt' in element) element.alt = card.alt || card.title || '';
            if (typeof element.show === 'function') element.show();
        } else if (typeof element.hide === 'function') {
            element.hide();
        }
    } catch (_) {}
}

function setStatus(element, value) {
    if (!element) return;
    try {
        element.text = String(value || '');
    } catch (_) {}
}

function firstNonEmpty(inputs) {
    return inputs.find(input => String(input.value || '').trim()) || inputs[0] || null;
}

function resultButtonLabel(card) {
    if (card.kind === 'location') return 'Explore';
    if (card.kind === 'offer' || card.kind === 'recommendation' || card.kind === 'partner') return 'View offer';
    if (card.kind === 'video') return 'Watch';
    if (card.kind === 'machine' || card.kind === 'machine-family' || card.kind === 'manufacturer') return 'View machine';
    return 'View';
}

function renderCardItem($item, card) {
    const texts = asArray($item('Text'));
    const images = asArray($item('Image'));
    const buttons = asArray($item('Button'));

    const title = pickById(texts, /(title|name|heading)/i, 0);
    const location = pickById(texts, /(location|town|place|meta)/i, 1);
    const description = pickById(texts, /(description|summary|excerpt|copy)/i, 2);
    const category = pickById(texts, /(category|type|tag)/i, 3);

    setText(title, card.title);
    setText(location, [card.location, card.subtitle].filter(Boolean).join(' · '));
    setText(description, card.description);
    setText(category, card.category);
    setImage(images[0], card);

    const button = pickById(buttons, /(view|open|offer|guide|more|result|explore)/i, 0);
    if (!button) return;

    try {
        button.label = card.routeStatus === 'ready' ? resultButtonLabel(card) : 'Guide unavailable';
        if (card.routeStatus === 'ready' && card.route) {
            button.link = card.route;
            if (typeof button.enable === 'function') button.enable();
        } else if (typeof button.disable === 'function') {
            button.disable();
        }
    } catch (_) {}
}

export function wireSearchEntryPoints($w, destination = '/search') {
    const inputs = searchInputs($w);
    const buttons = searchButtons($w);

    if (!inputs.length) return { inputs: 0, buttons: 0 };

    const go = input => {
        const query = String(input && input.value || '').trim();
        wixLocation.to(
            query
                ? destination + '?q=' + encodeURIComponent(query)
                : destination
        );
    };

    for (const input of inputs) {
        if (wiredInputs.has(input)) continue;
        wiredInputs.add(input);

        input.onKeyPress(event => {
            if (event.key === 'Enter') go(input);
        });
    }

    for (const button of buttons) {
        if (wiredButtons.has(button)) continue;
        wiredButtons.add(button);
        button.onClick(() => go(firstNonEmpty(inputs)));
    }

    return {
        inputs: inputs.length,
        buttons: buttons.length
    };
}

export function mountAutoSearchResults($w) {
    const input = searchInputs($w)[0] || null;
    const submit = searchButtons($w)[0] || null;
    const repeater = resultRepeater($w);
    const status = statusText($w);

    if (!input || !repeater) {
        wireSearchEntryPoints($w);
        return {
            mounted: false,
            reason: 'missing-search-input-or-results-repeater'
        };
    }

    let requestId = 0;
    let debounce;

    repeater.onItemReady(($item, itemData) => {
        renderCardItem($item, itemData);
    });

    async function run() {
        const query = String(input.value || '').trim();
        const current = ++requestId;

        if (!query) {
            repeater.data = [];
            setStatus(status, 'Search destinations, venues, hotels, attractions, arcades, machines and more.');
            return;
        }

        setStatus(status, 'Searching everything…');

        try {
            const result = await searchPlaces(query, 500);
            if (current !== requestId) return;

            repeater.data = result.results || [];

            if (result.total) {
                try {
                    if (typeof repeater.show === 'function') repeater.show();
                    if (typeof repeater.expand === 'function') repeater.expand();
                } catch (_) {}
                toggleEmptyStateCopy($w, false);
                setStatus(status, result.total + (result.total === 1 ? ' result' : ' results') + (result.unavailableRoutes?.length ? ' · Some guide links are currently unavailable' : ''));
            } else {
                toggleEmptyStateCopy($w, true);
                try {
                    if (typeof repeater.collapse === 'function') repeater.collapse();
                } catch (_) {}
                setStatus(status, 'No results found.');
            }
        } catch (_) {
            if (current === requestId) {
                setStatus(status, 'Search is temporarily unavailable.');
            }
        }
    }

    input.onInput(() => {
        clearTimeout(debounce);
        debounce = setTimeout(run, 250);
    });

    input.onKeyPress(event => {
        if (event.key === 'Enter') {
            clearTimeout(debounce);
            run();
        }
    });

    if (submit) {
        submit.onClick(() => {
            clearTimeout(debounce);
            run();
        });
    }

    const query = String(wixLocation.query && wixLocation.query.q || '').trim();

    if (query) {
        input.value = query;
        run();
    } else {
        setStatus(status, 'Search destinations, venues, hotels, attractions, arcades, machines and more.');
    }

    return {
        mounted: true,
        run,
        dispose() {
            requestId++;
            clearTimeout(debounce);
        }
    };
}

