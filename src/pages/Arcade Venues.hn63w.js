import wixLocation from 'wix-location';
import { getVenuePage } from 'backend/pageData.web';
import { bindCardRepeater } from 'public/cardBinder';

function currentSlug() {
    const parts = wixLocation.path || [];
    return String(parts[parts.length - 1] || '').trim();
}

$w.onReady(async function () {
    const data = await getVenuePage(currentSlug());
    if (!data || !data.page) {
        wixLocation.to('/search');
        return;
    }

    const page = data.page;

    $w('#venueTitle').text = page.title || '';
    $w('#venueIntro').text = page.intro || '';
    $w('#venueOverview').text = page.overview || '';
    $w('#venueMeta').text = [
        page.locationName,
        page.postcode,
        page.venueType
    ].filter(Boolean).join(' · ');

    if (page.heroImage) {
        $w('#venueHero').src = page.heroImage;
        $w('#venueHero').alt = page.heroImageAlt || page.title || '';
        $w('#venueHero').show();
    } else {
        $w('#venueHero').hide();
    }

    $w('#venueAddress').text = page.address || '';
    $w('#venueHours').text = page.openingHours || '';
    $w('#venueVisitorInfo').text = page.visitorInfo || '';

    if (page.googleDirectionsUrl) {
        $w('#directionsButton').link = page.googleDirectionsUrl;
        $w('#directionsButton').enable();
    } else {
        $w('#directionsButton').disable();
    }

    if (page.website) {
        $w('#websiteButton').link = page.website;
        $w('#websiteButton').enable();
    } else {
        $w('#websiteButton').disable();
    }

    bindCardRepeater($w('#relatedRepeater'), data.related || []);
});
