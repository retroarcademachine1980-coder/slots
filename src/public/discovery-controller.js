// UI-independent controller, called after $w.onReady with observed Editor elements.
export function createSearchController({ search, render, setStatus }) {
    let version = 0;
    let disposed = false;
    return {
        invalidate() { version++; },
        async run(query) {
            const request = ++version;
            setStatus('Searching…');
            try {
                const result = await search(query);
                if (disposed || request !== version) return;
                render(result);
                const suggestions = (result.suggestions || []).map(item => item.title).join(', ');
                const message = result.matchType === 'related' ? `No full match. ${result.total} related results` :
                    result.matchType === 'suggested' && suggestions ? `Did you mean ${suggestions}?` :
                        result.total ? `${result.total} matching places` : 'No close match found. Try a town, venue name or category.';
                setStatus(message);
                // Keep the complete result list visible; cards navigate only on a deliberate click.
            } catch (_) {
                if (!disposed && request === version) setStatus('Search is temporarily unavailable. Please try again.');
            }
        },
        dispose() { disposed = true; version++; }
    };
}

export function createOfferController({ isMember, login, resolve, navigate, setStatus }) {
    let busy = false;
    return async function open(card) {
        if (busy) return;
        busy = true;
        try {
            if (card.memberOffer && !(await isMember())) {
                await login();
                setStatus('You’re signed in. Click the offer again to continue.');
                return; // Deliberately no navigation after login.
            }
            const { url } = await resolve(card);
            if (!/^https:\/\//.test(url || '')) throw new Error('Invalid offer link.');
            navigate(url);
        } catch (_) {
            setStatus('The offer wasn’t opened. You can try again.');
        } finally { busy = false; }
    };
}
