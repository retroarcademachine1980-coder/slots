// Category membership uses CMS facts, never a venue's name or marketing copy.
const flag = field => ({ field, op: 'eq', value: true });
const type = value => ({ field: 'venueType', op: 'contains', value });
const entry = (slug, title, rules) => ({ slug, title, rules });

export const categories = Object.freeze([
    entry('adult-gaming-centres', 'Adult Gaming Centres (AGCs)', [flag('adultGamingCentre')]),
    entry('amusement-arcades', 'Amusement Arcades', [flag('amusementArcade'), type('Amusement Arcade')]),
    entry('seaside-arcades', 'Seaside Arcades', [flag('seaside'), type('Seaside'), type('Pier')]),
    entry('pier-arcades', 'Pier Arcades', [flag('pierArcade'), type('Pier')]),
    entry('family-entertainment-centres', 'Family Entertainment Centres', [flag('familyEntertainmentCentre'), type('Family Entertainment Centre')]),
    entry('retro-arcades', 'Retro Arcades', [flag('retroArcade'), type('Retro')]),
    entry('ticket-arcades', 'Ticket Arcades', [flag('ticketMachines'), flag('redemptionArcade')]),
    entry('coin-pusher-arcades', 'Coin Pusher Arcades', [flag('coinPushers')]),
    entry('bowling-arcades', 'Bowling Arcades', [flag('bowlingArcade'), type('Bowling')]),
    entry('arcade-bars', 'Arcade Bars', [type('Arcade Bar'), type('Barcade')]),
    entry('pinball-arcades', 'Pinball Arcades', [type('Pinball'), { field: 'machineTypes', op: 'hasSome', value: ['Pinball', 'pinball'] }]),
    entry('vr-arcades', 'VR Arcades', [type('VR Arcade'), type('Virtual Reality')]),
    entry('holiday-park-arcades', 'Holiday Park Arcades', [flag('holidayParkArcade'), type('Holiday Park')]),
    entry('casinos', 'Casinos', [{ field: 'venueType', op: 'eq', value: 'Casino' }]),
    entry('bingo-halls', 'Bingo Halls', [type('Bingo')]),
    entry('bookmakers-with-fruit-machines', 'Bookmakers With Fruit Machines', [type('Bookmaker')]),
    entry('500-jackpot-slots', '£500 Jackpot Slots', [{ field: 'jackpotMaximum', op: 'eq', value: 500 }]),
    entry('dog-friendly-arcades', 'Dog-Friendly Arcades', [flag('dogFriendly')]),
    entry('wheelchair-friendly-arcades', 'Wheelchair-Friendly Arcades', [flag('disabledAccess')])
]);

export function categoryForPath(path) {
    const parts = (Array.isArray(path) ? path.join('/') : String(path || ''))
        .split('?')[0].split('#')[0].split('/').filter(Boolean);
    // Operator/town children require their own explicit routing contract.
    return parts.length === 1 ? categories.find(category => category.slug === parts[0]) || null : null;
}
