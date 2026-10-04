import { applyUnifiedSearchText } from 'backend/searchText';

function before(collection, item) {
    return applyUnifiedSearchText(collection, item);
}

export function Venues_beforeInsert(item) { return before('Venues', item); }
export function Venues_beforeUpdate(item) { return before('Venues', item); }

export function Locations_beforeInsert(item) { return before('Locations', item); }
export function Locations_beforeUpdate(item) { return before('Locations', item); }

export function NearbyAttractions_beforeInsert(item) { return before('NearbyAttractions', item); }
export function NearbyAttractions_beforeUpdate(item) { return before('NearbyAttractions', item); }

export function DestinationRecommendations_beforeInsert(item) { return before('DestinationRecommendations', item); }
export function DestinationRecommendations_beforeUpdate(item) { return before('DestinationRecommendations', item); }

export function WowcherOffers_beforeInsert(item) { return before('WowcherOffers', item); }
export function WowcherOffers_beforeUpdate(item) { return before('WowcherOffers', item); }

export function Guides_beforeInsert(item) { return before('Guides', item); }
export function Guides_beforeUpdate(item) { return before('Guides', item); }

export function SpinRaidersVideos_beforeInsert(item) { return before('SpinRaidersVideos', item); }
export function SpinRaidersVideos_beforeUpdate(item) { return before('SpinRaidersVideos', item); }

export function ClassicFruitMachines_beforeInsert(item) { return before('ClassicFruitMachines', item); }
export function ClassicFruitMachines_beforeUpdate(item) { return before('ClassicFruitMachines', item); }

export function ClassicFruitMachineFamilies_beforeInsert(item) { return before('ClassicFruitMachineFamilies', item); }
export function ClassicFruitMachineFamilies_beforeUpdate(item) { return before('ClassicFruitMachineFamilies', item); }

export function ClassicMachineSightings_beforeInsert(item) { return before('ClassicMachineSightings', item); }
export function ClassicMachineSightings_beforeUpdate(item) { return before('ClassicMachineSightings', item); }

export function Manufacturers_beforeInsert(item) { return before('Manufacturers', item); }
export function Manufacturers_beforeUpdate(item) { return before('Manufacturers', item); }

export function Machines_beforeInsert(item) { return before('Machines', item); }
export function Machines_beforeUpdate(item) { return before('Machines', item); }

export function AffiliatePartners_beforeInsert(item) { return before('AffiliatePartners', item); }
export function AffiliatePartners_beforeUpdate(item) { return before('AffiliatePartners', item); }
