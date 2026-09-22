import { getHomepageData } from 'backend/homepage.web';
import { bindCardRepeater } from 'public/cardBinder';

function setButton(button, label, link) {
    button.label = label || '';
    if (link) {
        button.link = link;
        button.enable();
        button.show();
    } else {
        button.disable();
        button.hide();
    }
}

function sectionByKey(sections, key) {
    return (sections || []).find(section => section.key === key) || {};
}

$w.onReady(async function () {
    const data = await getHomepageData();
    const sections = data.sections || [];
    const heroSection = sectionByKey(sections, 'hero');
    const hero = data.hero || {};

    $w('#heroEyebrow').text = heroSection.eyebrow || hero.badge || '';
    $w('#heroTitle').text = heroSection.heading || hero.title || '';
    $w('#heroBody').text = heroSection.body || hero.summary || hero.subtitle || '';

    setButton(
        $w('#heroPrimaryButton'),
        heroSection.primaryCtaLabel || 'START EXPLORING',
        heroSection.primaryCtaUrl || '/search'
    );
    setButton(
        $w('#heroSecondaryButton'),
        heroSection.secondaryCtaLabel || 'EXPLORE DESTINATIONS',
        heroSection.secondaryCtaUrl || '/map'
    );

    if (hero.image) {
        $w('#heroImage').src = hero.image;
        $w('#heroImage').alt = hero.alt || hero.title || '';
        $w('#heroImage').show();
    } else {
        $w('#heroImage').hide();
    }

    bindCardRepeater($w('#monthlyRepeater'), data.monthlyPicks || [], {
        title: '#monthlyTitle', meta: '#monthlyMeta', description: '#monthlyDescription',
        image: '#monthlyImage', button: '#monthlyButton'
    });
    bindCardRepeater($w('#destinationRepeater'), data.destinations || [], {
        title: '#destinationTitle', meta: '#destinationMeta', description: '#destinationDescription',
        image: '#destinationImage', button: '#destinationButton'
    });
    bindCardRepeater($w('#browseRepeater'), data.browseByType || [], {
        title: '#browseTitle', meta: '#browseMeta', description: '#browseDescription',
        image: '#browseImage', button: '#browseButton'
    });
    bindCardRepeater($w('#featuredRepeater'), data.featuredVenues || [], {
        title: '#featuredTitle', meta: '#featuredMeta', description: '#featuredDescription',
        image: '#featuredImage', button: '#featuredButton'
    });
    bindCardRepeater($w('#hotelRepeater'), data.hotels || [], {
        title: '#hotelTitle', meta: '#hotelMeta', description: '#hotelDescription',
        image: '#hotelImage', button: '#hotelButton'
    });
    bindCardRepeater($w('#foodRepeater'), data.food || [], {
        title: '#foodTitle', meta: '#foodMeta', description: '#foodDescription',
        image: '#foodImage', button: '#foodButton'
    });
    bindCardRepeater($w('#thingToDoRepeater'), data.thingsToDo || [], {
        title: '#thingToDoTitle', meta: '#thingToDoMeta', description: '#thingToDoDescription',
        image: '#thingToDoImage', button: '#thingToDoButton'
    });

    const destinationSection = sectionByKey(sections, 'locations');
    const featuredSection = sectionByKey(sections, 'featured-arcades');
    const videoSection = sectionByKey(sections, 'videos');
    const communitySection = sectionByKey(sections, 'community');

    $w('#destinationsHeading').text = destinationSection.heading || 'EXPLORE UK DESTINATIONS';
    $w('#destinationsBody').text = destinationSection.body || '';
    $w('#featuredHeading').text = featuredSection.heading || 'PLACES WORTH A LOOK';
    $w('#featuredBody').text = featuredSection.body || '';
    $w('#hotelHeading').text = 'PLACES TO STAY';
    $w('#foodHeading').text = 'PLACES TO EAT';
    $w('#thingToDoHeading').text = 'THINGS TO DO';
    $w('#videoHeading').text = videoSection.heading || 'WATCH ON RAIDERTUBE';
    $w('#videoBody').text = videoSection.body || '';
    $w('#communityHeading').text = communitySection.heading || 'HELP KEEP SPIN RAIDERS CURRENT';
    $w('#communityBody').text = communitySection.body || '';

    setButton(
        $w('#videoButton'),
        videoSection.primaryCtaLabel || 'OPEN RAIDERTUBE',
        videoSection.primaryCtaUrl || '/raidertube'
    );
    setButton(
        $w('#communityButton'),
        communitySection.primaryCtaLabel || 'REPORT A CHANGE',
        communitySection.primaryCtaUrl || '/forum'
    );
});
