/** Existing current-design index views. Native bindings are verified separately. */
export const INDEX_ROUTES = Object.freeze({
  staysIndex: Object.freeze({ prefix: '/places-to-stay', fields: [], viewKey: 'places-to-stay' }),
  offersIndex: Object.freeze({ prefix: '/offers', fields: [], viewKey: 'offers' }),
  familyFunIndex: Object.freeze({ prefix: '/family-fun', fields: [], viewKey: 'family-fun' }),
  hiddenGemsIndex: Object.freeze({ prefix: '/hidden-gems', fields: [], viewKey: 'hidden-gems' }),
  retroIndex: Object.freeze({ prefix: '/retro-video-games', fields: [], viewKey: 'retro-video-games' }),
  daysOutIndex: Object.freeze({ prefix: '/days-out', fields: [], viewKey: 'discover' }),
  tripIndex: Object.freeze({ prefix: '/plan-a-trip', fields: [], viewKey: 'trip' })
});
export const CATEGORY_PATHS = Object.freeze({
  arcades: '/arcade', venues: '/arcade', 'family-arcades': '/arcade?type=family', 'classic-arcades': '/arcade?type=classic',
  cinema: '/cinemas', cinemas: '/cinemas', fishing: '/fishing-lakes', 'fishing-lakes': '/fishing-lakes',
  nature: '/outdoors', outdoors: '/outdoors', 'nature-outdoors': '/outdoors', bowling: '/bowling',
  bingo: '/bingo-halls', 'holiday-parks': '/holiday-parks', 'places-to-stay': '/places-to-stay', stays: '/places-to-stay',
  'food-drink': '/food-and-drink', food: '/food-and-drink', museums: '/museums',
  'historical-sites': '/historical-sites', 'theme-parks': '/theme-parks', zoos: '/zoos',
  'sea-life': '/sea-life', piers: '/piers', beaches: '/beaches', 'arcade-bars': '/arcade-bars',
  agc: '/agc', services: '/services', casinos: '/casinos', 'casino-venues': '/casinos',
  seaside: '/seaside', tours: '/tours', attractions: '/attractions', 'family-fun': '/family-fun',
  'hidden-gems': '/hidden-gems', 'retro-video-games': '/retro-video-games', discover: '/days-out',
  'days-out': '/days-out', offers: '/offers', 'fruit-machines': '/classic-fruit-machines',
  'plan-a-trip': '/plan-a-trip'
});
export const VIEW_PATHS = Object.freeze({ trip: '/plan-a-trip', offers: '/offers', agc: '/agc' });
