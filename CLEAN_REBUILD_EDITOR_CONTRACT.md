# Spin Raiders Clean Relaunch — Editor Contract

This branch intentionally contains no legacy page wiring. Build the fresh Wix Editor layout using these IDs exactly.

## Global header
- `#globalSearchInput`
- `#globalSearchButton`
- `#globalSuggestionsRepeater`
  - `#suggestionButton`
  - `#suggestionMeta`

## Home — page ID jrgbr
Hero:
- `#heroEyebrow`
- `#heroTitle`
- `#heroBody`
- `#heroImage`
- `#heroPrimaryButton`
- `#heroSecondaryButton`

Headings:
- `#destinationsHeading`, `#destinationsBody`
- `#featuredHeading`, `#featuredBody`
- `#hotelHeading`
- `#foodHeading`
- `#thingToDoHeading`
- `#videoHeading`, `#videoBody`, `#videoButton`
- `#communityHeading`, `#communityBody`, `#communityButton`

Repeaters:
- Monthly: `#monthlyRepeater` → `#monthlyTitle`, `#monthlyMeta`, `#monthlyDescription`, `#monthlyImage`, `#monthlyButton`
- Destinations: `#destinationRepeater` → `#destinationTitle`, `#destinationMeta`, `#destinationDescription`, `#destinationImage`, `#destinationButton`
- Browse: `#browseRepeater` → `#browseTitle`, `#browseMeta`, `#browseDescription`, `#browseImage`, `#browseButton`
- Venues: `#featuredRepeater` → `#featuredTitle`, `#featuredMeta`, `#featuredDescription`, `#featuredImage`, `#featuredButton`
- Hotels: `#hotelRepeater` → `#hotelTitle`, `#hotelMeta`, `#hotelDescription`, `#hotelImage`, `#hotelButton`
- Food: `#foodRepeater` → `#foodTitle`, `#foodMeta`, `#foodDescription`, `#foodImage`, `#foodButton`
- Things to do: `#thingToDoRepeater` → `#thingToDoTitle`, `#thingToDoMeta`, `#thingToDoDescription`, `#thingToDoImage`, `#thingToDoButton`

## Search — page ID cfe9p
- `#searchInput`
- `#searchButton`
- `#resultsStatus`
- `#resultsCount`
- `#loadMoreButton`
- `#resultsRepeater`
  - `#resultTitle`
  - `#resultMeta`
  - `#resultDescription`
  - `#resultImage`
  - `#resultButton`

## Arcades — page ID qydor
- `#arcadeSearchInput`
- `#arcadeSearchButton`
- `#arcadeCount`
- `#arcadeLoadMore`
- `#arcadeRepeater`
  - `#cardTitle`
  - `#cardMeta`
  - `#cardDescription`
  - `#cardImage`
  - `#cardButton`

## Destination discovery — page ID qh29o
- `#destinationRepeater` → `#destinationTitle`, `#destinationMeta`, `#destinationDescription`, `#destinationImage`, `#destinationButton`
- `#hotelRepeater` → `#hotelTitle`, `#hotelMeta`, `#hotelDescription`, `#hotelImage`, `#hotelButton`
- `#foodRepeater` → `#foodTitle`, `#foodMeta`, `#foodDescription`, `#foodImage`, `#foodButton`
- `#attractionRepeater` → `#attractionTitle`, `#attractionMeta`, `#attractionDescription`, `#attractionImage`, `#attractionButton`

## Map — page ID ngnt4
- `#mapSearchInput`
- `#mapSearchButton`
- `#mapCount`
- `#mapHtml`
The HTML component receives:
`{ type: "spin-raiders-map-data", pins: [...] }`

## Classic archive list — page ID ij13e
- `#archiveSearchInput`
- `#archiveSearchButton`
- `#archiveCount`
- `#archiveLoadMore`
- `#archiveRepeater`
  - `#cardTitle`
  - `#cardMeta`
  - `#cardDescription`
  - `#cardImage`
  - `#cardButton`

## Affiliate partners — page ID cgrmm
- `#partnerCount`
- `#partnerRepeater`
  - `#cardTitle`
  - `#cardMeta`
  - `#cardDescription`
  - `#cardImage`
  - `#cardButton`

## Dynamic location — page ID aa2s4
- `#locationTitle`, `#locationKicker`, `#locationIntro`, `#locationOverview`, `#locationMeta`, `#locationHero`
- Venue repeater: `#venueRepeater` → `#venueCardTitle`, `#venueCardMeta`, `#venueCardDescription`, `#venueCardImage`, `#venueCardButton`
- Attraction repeater: `#attractionRepeater` → `#attractionCardTitle`, `#attractionCardMeta`, `#attractionCardDescription`, `#attractionCardImage`, `#attractionCardButton`
- Recommendations: `#recommendationRepeater` → `#recommendationCardTitle`, `#recommendationCardMeta`, `#recommendationCardDescription`, `#recommendationCardImage`, `#recommendationCardButton`
- Offers: `#offerRepeater` → `#offerCardTitle`, `#offerCardMeta`, `#offerCardDescription`, `#offerCardImage`, `#offerCardButton`
- Videos: `#videoRepeater` → `#videoCardTitle`, `#videoCardMeta`, `#videoCardDescription`, `#videoCardImage`, `#videoCardButton`
- Machines: `#machineRepeater` → `#machineCardTitle`, `#machineCardMeta`, `#machineCardDescription`, `#machineCardImage`, `#machineCardButton`

## Dynamic venue — page ID hn63w
- `#venueTitle`, `#venueIntro`, `#venueOverview`, `#venueMeta`, `#venueHero`
- `#venueAddress`, `#venueHours`, `#venueVisitorInfo`
- `#directionsButton`, `#websiteButton`
- `#relatedRepeater` with default card IDs

## Dynamic machine — page ID rby8l
- `#machineTitle`, `#machineManufacturer`, `#machineMeta`, `#machineHistory`, `#machineTechnical`, `#machineHero`
- `#machineStakes`, `#machineJackpots`, `#machineFeatures`
- `#relatedRepeater` with default card IDs

## CMS search rule
Every public source collection contains:
- `unifiedSearchText` — generated automatically.
- `searchKeywords` — editable extra keywords/phrases.

Add new discovery words to `searchKeywords`; the beforeInsert/beforeUpdate hooks rebuild `unifiedSearchText` automatically.
