import wixLocation from 'wix-location-frontend';
import { listCategoryVenues } from 'backend/categoryPages.web';
import { categoryForPath } from 'public/category-config';

// Native Wix elements keep their editor-defined colours, typography and spacing.
// The hero/title/intro and SEO remain editable in Wix; only cards are populated.
export function mountCategoryPage($w) {
    const category = categoryForPath(wixLocation.path);
    if (!category) throw new Error('Category page URL does not match category-config');
    const repeater = $w('#venueRepeater');
    const search = $w('#categorySearch');
    const town = $w('#townFilter');
    const status = $w('#resultsStatus');
    const more = $w('#loadMore');
    let generation = 0;
    let nextOffset = 0;
    let timer;
    let pending = false;
    let hasMore = false;
    let disposed = false;

    function render($item, item) {
        $item('#venueName').text = item.title;
        $item('#venueTown').text = item.town;
        $item('#venueDescription').text = item.description;
        $item('#venueRating').text = item.ratingText;
        const photo = $item('#venuePhoto');
        if (item.image) {
            photo.src = item.image;
            photo.alt = item.alt;
            photo.show();
        } else photo.hide();
        const link = $item('#venueLink');
        link.label = 'View venue';
        link.link = item.route;
        if (item.route) link.enable(); else link.disable();
    }

    repeater.onItemReady(render);
    repeater.data = [];
    more.disable();

    async function run(append = false) {
        if (disposed || (append && (pending || !hasMore))) return;
        const request = ++generation;
        pending = true;
        more.disable();
        if (!append) {
            nextOffset = 0;
            repeater.data = [];
        }
        status.text = 'Loading venues…';
        try {
            const result = await listCategoryVenues({
                category: category.slug,
                search: search.value,
                town: town.value,
                offset: nextOffset,
                limit: 24
            });
            if (disposed || request !== generation) return;
            const rows = append ? [...repeater.data, ...result.items] : result.items;
            repeater.data = [...new Map(rows.map(item => [item._id, item])).values()];
            repeater.forEachItem(render);
            nextOffset = result.offset + result.items.length;
            hasMore = result.hasMore;
            status.text = result.total ? repeater.data.length + ' of ' + result.total + ' venues'
                : 'No matching venues in this category. Try another town or search.';
            if (hasMore) more.enable();
        } catch (_) {
            if (request === generation && !disposed) {
                status.text = 'Venues could not be loaded. Please try the search again.';
                // Permit retry of a failed later page without losing prior cards.
                if (append && hasMore) more.enable();
            }
        } finally {
            if (request === generation) pending = false;
        }
    }

    function schedule() {
        // Invalidate outstanding results immediately, even during the debounce.
        generation++;
        pending = false;
        more.disable();
        clearTimeout(timer);
        timer = setTimeout(() => run(), 250);
    }
    search.onInput(schedule);
    search.onKeyPress(event => {
        if (event.key === 'Enter') { clearTimeout(timer); run(); }
    });
    town.onChange(() => { clearTimeout(timer); run(); });
    more.onClick(() => run(true));
    const ready = run();
    return { ready, refresh: () => run(), dispose() {
        disposed = true;
        generation++;
        clearTimeout(timer);
    } };
}
