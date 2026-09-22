import wixLocation from 'wix-location';
import { getLocationPage } from 'backend/pageData.web';
import { bindCardRepeater } from 'public/cardBinder';

function currentSlug() {
    const parts = wixLocation.path || [];
    return String(parts[parts.length - 1] || '').trim();
}

$w.onReady(async function () {
    const data = await getLocationPage(currentSlug());
    if (!data || !data.page) {
        wixLocation.to('/search');
        return;
    }

    const page = data.page;

    $w('#locationTitle').text = page.title || '';
    $w('#locationKicker').text = page.heroKicker || page.locationType || '';
    $w('#locationIntro').text = page.intro || '';
    $w('#locationOverview').text = page.overview || '';

    $w('#locationMeta').text = [
        page.county,
        page.region,
        page.venueCount ? page.venueCount + ' venues' : ''
    ].filter(Boolean).join(' · ');

    if (page.heroImage) {
        $w('#locationHero').src = page.heroImage;
        $w('#locationHero').alt = page.heroImageAlt || page.title || '';
        $w('#locationHero').show();
    } else {
        $w('#locationHero').hide();
    }

    bindCardRepeater($w('#venueRepeater'), data.sections.venues);
    bindCardRepeater($w('#attractionRepeater'), data.sections.attractions);
    bindCardRepeater($w('#recommendationRepeater'), data.sections.hotelsAndFood);
    bindCardRepeater($w('#offerRepeater'), data.sections.offers);
    bindCardRepeater($w('#videoRepeater'), data.sections.videos);
    bindCardRepeater($w('#machineRepeater'), data.sections.machines);
});
