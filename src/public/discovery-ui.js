import wixLocation from 'wix-location-frontend';
import wixWindow from 'wix-window-frontend';
import { currentMember, authentication } from 'wix-members-frontend';
import { searchPlaces, getNearestDestination, getRecommendations, getMemberOffer, getPublicRecommendationLink } from 'backend/discovery.web';
import { getMyRecommendations } from 'backend/member-discovery.web';
import { createSearchController, createOfferController } from 'public/discovery-controller';

const wiredInputs = new WeakSet();
const wiredButtons = new WeakSet();

function asArray(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
}

function read(element, key) {
    try { return String(element && element[key] || ''); } catch (_) { return ''; }
}

function score(element, words) {
    const haystack = [read(element, 'id'), read(element, 'label'), read(element, 'placeholder'), read(element, 'text')]
        .join(' ').toLowerCase();
    return words.reduce((total, word, index) => total + (haystack.includes(word) ? Math.max(1, words.length - index) : 0), 0);
}

function searchInputs($w) {
    try {
        return asArray($w('TextInput')).filter(input =>
            score(input, ['search', 'venue', 'town', 'city', 'postcode', 'place', 'where']) > 0
        );
    } catch (_) { return []; }
}

function searchButtons($w) {
    try {
        return asArray($w('Button')).filter(button =>
            score(button, ['search', 'find', 'explore', 'go']) > 0
        );
    } catch (_) { return []; }
}

function resultRepeater($w) {
    try {
        const repeaters = asArray($w('Repeater'));
        if (!repeaters.length) return null;
        return [...repeaters].sort((a, b) =>
            score(b, ['search', 'result', 'card', 'directory']) - score(a, ['search', 'result', 'card', 'directory'])
        )[0] || null;
    } catch (_) { return null; }
}

function statusText($w) {
    try {
        const texts = asArray($w('Text'));
        const ranked = texts
            .map(element => ({ element, score: score(element, ['searchstatus', 'search', 'result', 'did you mean', 'status']) }))
            .filter(row => row.score > 0)
            .sort((a, b) => b.score - a.score);
        return ranked[0] && ranked[0].element;
    } catch (_) { return null; }
}

function statusProxy(element) {
    return {
        set text(value) {
            if (!element) return;
            try { element.text = value; } catch (_) {}
        }
    };
}

function searchUrl(query) {
    const value = String(query || '').trim();
    return value ? '/search?q=' + encodeURIComponent(value) : '/search';
}

function firstNonEmpty(inputs) {
    return inputs.find(input => String(input.value || '').trim()) || inputs[0] || null;
}

function pickById(elements, pattern, fallbackIndex) {
    return elements.find(element => pattern.test(read(element, 'id'))) || elements[fallbackIndex] || null;
}

function setText(element, value) {
    if (!element) return;
    try { element.text = String(value || ''); } catch (_) {}
}

function setImage(element, card) {
    if (!element || !card.image) return;
    try {
        element.src = card.image;
        if ('alt' in element) element.alt = card.alt || card.title || '';
    } catch (_) {}
}

// Connect any existing search-like input/button pair on the current page to the unified /search route.
// Type selectors let this work without inventing Editor IDs. WeakSets prevent duplicate handlers.
export function wireSearchEntryPoints($w, destination = '/search') {
    const inputs = searchInputs($w);
    const buttons = searchButtons($w);
    if (!inputs.length) return { inputs: 0, buttons: 0 };

    const go = input => {
        const query = String(input && input.value || '').trim();
        wixLocation.to(query ? destination + '?q=' + encodeURIComponent(query) : destination);
    };

    for (const input of inputs) {
        if (wiredInputs.has(input)) continue;
        wiredInputs.add(input);
        input.onKeyPress(event => { if (event.key === 'Enter') go(input); });
    }

    for (const button of buttons) {
        if (wiredButtons.has(button)) continue;
        wiredButtons.add(button);
        button.onClick(() => go(firstNonEmpty(inputs)));
    }

    return { inputs: inputs.length, buttons: buttons.length };
}

// Pass real $w elements from the Editor; no guessed IDs or DOM overrides.
export function mountSearch({ input, submit, render, status }) {
    const target = statusProxy(status);
    const controller = createSearchController({
        search: query => searchPlaces(query),
        render,
        setStatus: message => { target.text = message; },
        navigate: route => wixLocation.to(route)
    });
    let debounce;
    input.onInput(() => {
        controller.invalidate();
        clearTimeout(debounce);
        debounce = setTimeout(() => { controller.run(input.value || ''); }, 250);
    });
    const run = () => { clearTimeout(debounce); controller.run(input.value || '', true); };
    input.onKeyPress(event => { if (event.key === 'Enter') run(); });
    if (submit) submit.onClick(run);
    return { run, dispose: () => { clearTimeout(debounce); controller.dispose(); } };
}

export function offerClickHandler(status) {
    const target = statusProxy(status);
    return createOfferController({
        isMember: async () => !!(await currentMember.getMember()),
        login: () => authentication.promptLogin({ mode: 'login', modal: true }),
        resolve: card => card.memberOffer ? getMemberOffer(card.id) : getPublicRecommendationLink(card.id),
        navigate: url => wixLocation.to(url),
        setStatus: message => { target.text = message; }
    });
}

function renderCardItem($item, card, openOffer) {
    const texts = asArray($item('Text'));
    const images = asArray($item('Image'));
    const buttons = asArray($item('Button'));

    const title = pickById(texts, /(title|name|heading)/i, 0);
    const location = pickById(texts, /(location|town|place)/i, 1);
    const description = pickById(texts, /(description|summary|excerpt|copy)/i, 2);
    const category = pickById(texts, /(category|type|tag)/i, 3);

    setText(title, card.title);
    setText(location, card.location);
    setText(description, card.description);
    setText(category, card.category);
    setImage(images[0], card);

    const button = pickById(buttons, /(view|open|offer|guide|more|result)/i, 0);
    if (!button) return;

    try {
        if (card.route) {
            button.link = card.route;
            button.label = card.kind === 'location' ? 'Explore ' + card.title : 'View venue';
        } else {
            button.link = '';
            button.label = card.memberOffer ? 'Sign in to view offer' : 'View offer';
            button.onClick(() => openOffer(card));
        }
    } catch (_) {}
}

// Automatically binds the existing Search Results page controls by element type/semantic labels.
// It never guesses an Editor ID. If the page does not expose an identifiable input/repeater, it safely does nothing.
export function mountAutoSearchResults($w) {
    const inputs = searchInputs($w);
    const input = inputs[0];
    const submit = searchButtons($w)[0] || null;
    const repeater = resultRepeater($w);
    const status = statusText($w);

    if (!input || !repeater) {
        wireSearchEntryPoints($w);
        return { mounted: false, reason: 'missing-search-input-or-results-repeater' };
    }

    const openOffer = offerClickHandler(status);
    repeater.onItemReady(($item, itemData) => renderCardItem($item, itemData, openOffer));

    const mounted = mountSearch({
        input,
        submit,
        status,
        render: result => {
            try { repeater.data = result.results || []; } catch (_) {}
        }
    });

    const query = String(wixLocation.query && wixLocation.query.q || '').trim();
    if (query) {
        input.value = query;
        mounted.run(query);
    } else {
        statusProxy(status).text = 'Search venues, towns, attractions and offers.';
    }

    return { mounted: true, run: mounted.run, dispose: mounted.dispose };
}

export async function loadHomeRecommendations(area = '') {
    const member = await currentMember.getMember();
    return member ? getMyRecommendations(area) : getRecommendations({ area });
}

// Attach only to an explicit “Use my location” click, never to initial page load.
export async function chooseNearbyArea() {
    let timeout;
    try {
        const position = await Promise.race([
            wixWindow.getCurrentGeolocation(),
            new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Location timed out.')), 10000); })
        ]);
        return await getNearestDestination({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch (_) { return null; }
    finally { clearTimeout(timeout); }
}
