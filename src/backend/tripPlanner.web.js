import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';

function clean(value, max = 240) {
    return String(value || '').trim().slice(0, max);
}

function normalizeType(value) {
    const v = clean(value, 40).toLowerCase();
    const allowed = new Set(['venue','hotel','attraction','cinema','bowling','food','holiday-park','casino','nature','other']);
    return allowed.has(v) ? v : 'other';
}

function plannerItem(row) {
    return {
        _id: row._id,
        itemId: row.itemId || row.venueSlug || '',
        itemType: row.itemType || 'venue',
        title: row.itemTitle || row.venueTitle || '',
        pageLink: row.itemPageLink || row.venuePageLink || '',
        locationName: row.locationName || '',
        saved: row.saved === true,
        favourite: row.favourite === true,
        visited: row.visited === true,
        journeyStatus: row.journeyStatus || '',
        personalNotes: row.personalNotes || '',
        lastViewed: row.lastViewed || null,
        visitedDate: row.visitedDate || null
    };
}

async function findOwned(itemId, itemType) {
    const result = await wixData.query('MemberVenueJourney')
        .eq('itemId', itemId)
        .eq('itemType', itemType)
        .limit(1)
        .find();

    if ((result.items || []).length) return result.items[0];

    if (itemType === 'venue') {
        const legacy = await wixData.query('MemberVenueJourney')
            .eq('venueSlug', itemId)
            .limit(1)
            .find();
        return (legacy.items || [])[0] || null;
    }
    return null;
}

export const getTripPlanner = webMethod(Permissions.SiteMember, async () => {
    let page = await wixData.query('MemberVenueJourney')
        .descending('_updatedDate')
        .limit(1000)
        .find();

    const rows = [...(page.items || [])];

    while (page.hasNext && page.hasNext() && rows.length < 5000) {
        page = await page.next();
        rows.push(...(page.items || []));
    }

    return rows
        .filter(row => row.saved === true || row.favourite === true || row.visited === true)
        .map(plannerItem);
});

export const saveTripItem = webMethod(Permissions.SiteMember, async input => {
    const itemId = clean(input && (input.itemId || input.slug), 160);
    if (!itemId) throw new Error('Missing item ID.');

    const itemType = normalizeType(input && input.itemType);
    const title = clean(input && input.title, 180);
    const pageLink = clean(input && (input.pageLink || input.route), 500);
    const locationName = clean(input && input.locationName, 140);

    let row = await findOwned(itemId, itemType);
    const now = new Date();

    if (!row) {
        row = {
            itemId,
            itemType,
            itemTitle: title,
            itemPageLink: pageLink,
            locationName,
            journeyStatus: 'SAVED',
            saved: true,
            favourite: input && input.favourite === true,
            visited: input && input.visited === true,
            lastViewed: now
        };

        if (itemType === 'venue') {
            row.venueSlug = itemId;
            row.venueTitle = title;
            row.venuePageLink = pageLink;
        }

        const inserted = await wixData.insert('MemberVenueJourney', row);
        return plannerItem(inserted);
    }

    row.itemTitle = title || row.itemTitle || row.venueTitle || '';
    row.itemPageLink = pageLink || row.itemPageLink || row.venuePageLink || '';
    row.locationName = locationName || row.locationName || '';
    row.saved = true;
    row.journeyStatus = row.visited === true ? 'VISITED' : 'SAVED';
    row.lastViewed = now;

    const updated = await wixData.update('MemberVenueJourney', row);
    return plannerItem(updated);
});

export const updateTripItem = webMethod(Permissions.SiteMember, async input => {
    const itemId = clean(input && (input.itemId || input.slug), 160);
    const itemType = normalizeType(input && input.itemType);
    if (!itemId) throw new Error('Missing item ID.');

    const row = await findOwned(itemId, itemType);
    if (!row) throw new Error('Trip item not found.');

    if (typeof input.saved === 'boolean') row.saved = input.saved;
    if (typeof input.favourite === 'boolean') row.favourite = input.favourite;
    if (typeof input.visited === 'boolean') row.visited = input.visited;
    if (input.personalNotes !== undefined) row.personalNotes = clean(input.personalNotes, 3000);
    if (input.visitedDate !== undefined) row.visitedDate = input.visitedDate || null;

    row.journeyStatus = row.visited ? 'VISITED' : row.saved ? 'SAVED' : row.favourite ? 'FAVOURITE' : 'VIEWED';
    row.lastViewed = new Date();

    const updated = await wixData.update('MemberVenueJourney', row);
    return plannerItem(updated);
});

export const removeTripItem = webMethod(Permissions.SiteMember, async input => {
    const itemId = clean(input && (input.itemId || input.slug), 160);
    const itemType = normalizeType(input && input.itemType);
    if (!itemId) throw new Error('Missing item ID.');

    const row = await findOwned(itemId, itemType);
    if (!row) return { removed: false };

    await wixData.remove('MemberVenueJourney', row._id);
    return { removed: true, itemId, itemType };
});

export const getTripPreferences = webMethod(Permissions.SiteMember, async () => {
    const result = await wixData.query('MemberJourney').limit(1).find();
    const row = (result.items || [])[0] || {};
    return {
        journeyStage: row.journeyStage || '',
        homeLocation: row.homeLocation || '',
        homePostcode: row.homePostcode || '',
        preferredRadiusMiles: row.preferredRadiusMiles || null,
        preferredVenueTypes: row.preferredVenueTypes || [],
        preferredBrands: row.preferredBrands || [],
        preferredFeatures: row.preferredFeatures || [],
        showNearbyAttractions: row.showNearbyAttractions !== false,
        showClassicFruitMachines: row.showClassicFruitMachines !== false,
        showRetroVideoGames: row.showRetroVideoGames !== false
    };
});

export const saveTripPreferences = webMethod(Permissions.SiteMember, async input => {
    const existing = await wixData.query('MemberJourney').limit(1).find();
    let row = (existing.items || [])[0] || {};

    row.journeyStage = clean(input && input.journeyStage, 80) || row.journeyStage || 'PLANNING';
    row.homeLocation = clean(input && input.homeLocation, 120) || row.homeLocation || '';
    row.homePostcode = clean(input && input.homePostcode, 20) || row.homePostcode || '';

    if (Number.isFinite(Number(input && input.preferredRadiusMiles))) {
        row.preferredRadiusMiles = Math.max(1, Math.min(250, Number(input.preferredRadiusMiles)));
    }

    row.preferredVenueTypes = Array.isArray(input && input.preferredVenueTypes)
        ? input.preferredVenueTypes.map(v => clean(v, 80)).filter(Boolean).slice(0, 30)
        : (row.preferredVenueTypes || []);

    row.preferredBrands = Array.isArray(input && input.preferredBrands)
        ? input.preferredBrands.map(v => clean(v, 80)).filter(Boolean).slice(0, 30)
        : (row.preferredBrands || []);

    row.preferredFeatures = Array.isArray(input && input.preferredFeatures)
        ? input.preferredFeatures.map(v => clean(v, 80)).filter(Boolean).slice(0, 30)
        : (row.preferredFeatures || []);

    if (typeof (input && input.showNearbyAttractions) === 'boolean') row.showNearbyAttractions = input.showNearbyAttractions;
    if (typeof (input && input.showClassicFruitMachines) === 'boolean') row.showClassicFruitMachines = input.showClassicFruitMachines;
    if (typeof (input && input.showRetroVideoGames) === 'boolean') row.showRetroVideoGames = input.showRetroVideoGames;

    row.lastUpdated = new Date();

    const saved = row._id
        ? await wixData.update('MemberJourney', row)
        : await wixData.insert('MemberJourney', row);

    return {
        journeyStage: saved.journeyStage || '',
        homeLocation: saved.homeLocation || '',
        homePostcode: saved.homePostcode || '',
        preferredRadiusMiles: saved.preferredRadiusMiles || null,
        preferredVenueTypes: saved.preferredVenueTypes || [],
        preferredBrands: saved.preferredBrands || [],
        preferredFeatures: saved.preferredFeatures || [],
        showNearbyAttractions: saved.showNearbyAttractions !== false,
        showClassicFruitMachines: saved.showClassicFruitMachines !== false,
        showRetroVideoGames: saved.showRetroVideoGames !== false
    };
});
