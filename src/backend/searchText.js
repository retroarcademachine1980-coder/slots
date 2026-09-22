const FIELD_MAP = {
    Venues: ['title','slug','operator','brand','locationName','locationSlug','postcode','venueType','shortDescription','seoTitle','seoDescription','mapSearchText','mapPrimaryCategory','machineTypesSummary','amenitiesSummary','historySummary','searchTerms','mapTags','machineTypes','formerNames','features','facilities'],
    Locations: ['title','slug','county','region','locationType','shortDescription','seoTitle','seoDescription','archiveSearchText','discoveryHeading','raiderDestinationSummary','overview','searchTerms','knownFor','bestFor','featuredVenueNames','venueTypes'],
    NearbyAttractions: ['title','slug','locationName','locationSlug','category','postcode','shortDescription','sourceName','searchTerms','tags','facilities'],
    DestinationRecommendations: ['name','displayTitle','displaySubtitle','destination','destinationSlug','locationName','locationSlug','category','summary','offerTitle','offerText'],
    WowcherOffers: ['title','slug','offerType','destination','description'],
    Guides: ['title','slug','guideType','summary','seoTitle','seoDescription'],
    SpinRaidersVideos: ['title','slug','channelName','locationName','venueName','seoSearchText','seoTitle','seoDescription','seoSummary','searchText','contentTags','categories','machines'],
    ClassicFruitMachines: ['title','slug','familyName','manufacturer','variantName','machineType','archiveSearchText','searchText','seoTitle','seoDescription','searchAliases','aliases','manufacturerAliases','manufacturers','searchFacets','marketRegions','features','relatedMachines'],
    ClassicFruitMachineFamilies: ['title','slug','seoTitle','seoDescription','searchText','knownManufacturers','knownVariants','knownCabinetFamilies','knownBoardFamilies'],
    ClassicMachineSightings: ['machineName','manufacturer','venueName','town','countyRegion','postcode','searchTerms','availabilityStatus'],
    Manufacturers: ['title','slug','shortDescription','seoTitle','seoDescription'],
    Machines: ['title','slug','manufacturer','machineType','seoTitle','seoDescription','knownLocations'],
    AffiliatePartners: ['title','slug','offerSummary','termsSummary']
};

export function normalizeSearch(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[’']/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function buildUnifiedSearchText(collection, item) {
    const fields = [...(FIELD_MAP[collection] || []), 'searchKeywords'];
    const parts = [];

    for (const field of fields) {
        const value = item && item[field];
        if (Array.isArray(value)) {
            parts.push(...value);
        } else if (value !== undefined && value !== null) {
            parts.push(value);
        }
    }

    return normalizeSearch(parts.join(' ')).slice(0, 15000);
}

export function applyUnifiedSearchText(collection, item) {
    item.unifiedSearchText = buildUnifiedSearchText(collection, item);
    return item;
}
