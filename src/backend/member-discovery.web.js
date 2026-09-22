import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { Permissions, webMethod } from 'wix-web-module';
import { createHash } from 'crypto';
import { loadCatalogue } from 'backend/discovery-service';
import { recommend } from 'public/discovery-core';
import { preferencePatch, publicPreferences } from 'public/member-preferences';

async function memberId() {
    const member = await currentMember.getMember();
    if (!member || !member._id) throw new Error('Please sign in.');
    return member._id;
}

async function ownRows(collection, owner) {
    // Retain collection author permissions as a second boundary. No suppressAuth.
    let page = await wixData.query(collection).eq('_owner', owner).limit(1000).find({ consistentRead: true });
    const items = [...page.items];
    while (page.hasNext()) { page = await page.next(); items.push(...page.items); }
    return items;
}

export const getMyPreferences = webMethod(Permissions.SiteMember, async () => {
    const id = await memberId();
    const rows = await ownRows('MemberJourney', id);
    return publicPreferences(rows[0]);
});

export const saveMyPreferences = webMethod(Permissions.SiteMember, async (input) => {
    const patch = preferencePatch(input);
    const id = await memberId();
    const rows = await ownRows('MemberJourney', id);
    const row = { ...(rows[0] || { _id: id }), ...patch };
    return publicPreferences(await wixData.save('MemberJourney', row));
});

export const setSavedVenue = webMethod(Permissions.SiteMember, async (venueId, saved) => {
    if (typeof venueId !== 'string' || venueId.length > 120 || typeof saved !== 'boolean') throw new Error('Invalid saved place.');
    const owner = await memberId();
    const existing = await ownRows('MemberVenueJourney', owner);
    const catalogue = await loadCatalogue();
    const venue = catalogue.find(e => e.card.kind === 'venue' && e.card.id === venueId);
    const rowId = createHash('sha256').update(owner + ':' + venueId).digest('hex').slice(0, 32);
    const previous = existing.find(r => r._id === rowId || venue && r.venueSlug === venue.row.slug);
    // Allow removal of a previously saved, subsequently suppressed venue.
    if (!venue && (!previous || saved)) throw new Error('This venue is not currently available.');
    const row = {
        ...(previous || { _id: rowId }),
        ...(venue ? { venueSlug: venue.row.slug, venueTitle: venue.card.title, venuePageLink: venue.card.route, locationName: venue.card.location } : {}),
        saved,
        journeyStatus: saved ? 'SAVED' : 'UNSAVED'
    };
    await wixData.save('MemberVenueJourney', row);
    return { venueId, saved };
});

export const getMyRecommendations = webMethod(Permissions.SiteMember, async (area = '') => {
    const id = await memberId();
    const preferences = (await ownRows('MemberJourney', id))[0] || {};
    const catalogue = await loadCatalogue();
    if (preferences.personalisationEnabled !== true) return recommend(catalogue, { area });
    const journey = await ownRows('MemberVenueJourney', id);
    const savedSlugs = new Set(journey.filter(r => r.saved || r.favourite).map(r => r.venueSlug));
    const seenSlugs = new Set(journey.filter(r => r.lastViewed || r.visited).map(r => r.venueSlug));
    return recommend(catalogue, {
        area: typeof area === 'string' && area.trim() ? area : preferences.homeLocation,
        savedIds: catalogue.filter(e => savedSlugs.has(e.row.slug)).map(e => e.card.id),
        seenIds: catalogue.filter(e => seenSlugs.has(e.row.slug)).map(e => e.card.id)
    });
});
