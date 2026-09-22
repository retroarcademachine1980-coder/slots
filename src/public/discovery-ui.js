import wixLocation from 'wix-location-frontend';
import wixWindow from 'wix-window-frontend';
import { currentMember, authentication } from 'wix-members-frontend';
import { searchPlaces, getNearestDestination, getRecommendations, getMemberOffer, getPublicRecommendationLink } from 'backend/discovery.web';
import { getMyRecommendations } from 'backend/member-discovery.web';
import { createSearchController, createOfferController } from 'public/discovery-controller';

// Pass real $w elements from the Editor; no guessed IDs or DOM overrides.
export function mountSearch({ input, submit, render, status }) {
    const controller = createSearchController({
        search: query => searchPlaces(query),
        render,
        setStatus: message => { status.text = message; },
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
    submit.onClick(run);
    return () => { clearTimeout(debounce); controller.dispose(); };
}

export function offerClickHandler(status) {
    return createOfferController({
        isMember: async () => !!(await currentMember.getMember()),
        login: () => authentication.promptLogin({ mode: 'login', modal: true }),
        resolve: card => card.memberOffer ? getMemberOffer(card.id) : getPublicRecommendationLink(card.id),
        navigate: url => wixLocation.to(url),
        setStatus: message => { status.text = message; }
    });
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
    } catch (_) { return null; } // UI keeps the manual area picker usable.
    finally { clearTimeout(timeout); }
}
