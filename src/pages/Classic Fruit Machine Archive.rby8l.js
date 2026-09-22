import wixLocation from 'wix-location';
import { getMachinePage } from 'backend/pageData.web';
import { bindCardRepeater } from 'public/cardBinder';

function currentSlug() {
    const parts = wixLocation.path || [];
    return String(parts[parts.length - 1] || '').trim();
}

$w.onReady(async function () {
    const data = await getMachinePage(currentSlug());
    if (!data || !data.page) {
        wixLocation.to('/search');
        return;
    }

    const page = data.page;

    $w('#machineTitle').text = page.title || '';
    $w('#machineManufacturer').text = page.manufacturer || '';
    $w('#machineMeta').text = [
        page.yearReleased ? String(page.yearReleased) : '',
        page.era,
        page.machineType,
        page.variantName
    ].filter(Boolean).join(' · ');

    $w('#machineHistory').text = page.history || '';
    $w('#machineTechnical').text = page.technicalNotes || '';

    if (page.heroImage) {
        $w('#machineHero').src = page.heroImage;
        $w('#machineHero').alt = page.title || '';
        $w('#machineHero').show();
    } else {
        $w('#machineHero').hide();
    }

    $w('#machineStakes').text = (page.stakes || []).join(' · ');
    $w('#machineJackpots').text = (page.jackpots || []).join(' · ');
    $w('#machineFeatures').text = (page.features || []).join(' · ');

    bindCardRepeater($w('#relatedRepeater'), data.related || []);
});
