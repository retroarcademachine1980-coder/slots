// Generated only from reviewed captured native handler names.
// branch Original revision registered-binding-capture-2026-10-02, evidence SHA-256 5d3a2cdfeef115fa85f9f5a6b6fef75a44d0370154a73c617bab99328165b2eb; native runtime acceptance pending.
import { canonicalRouter, canonicalSitemap } from 'backend/nativeRoutingService';

export async function agc_Router(request) { return canonicalRouter('agc', request); }
export async function agc_SiteMap() { return canonicalSitemap('agc'); }

export async function arcade_Router(request) { return canonicalRouter('arcade', request); }
export async function arcade_SiteMap() { return canonicalSitemap('arcade'); }

export async function arcade_bars_Router(request) { return canonicalRouter('arcadeBar', request); }
export async function arcade_bars_SiteMap() { return canonicalSitemap('arcadeBar'); }

export async function attractions_Router(request) { return canonicalRouter('attraction', request); }
export async function attractions_SiteMap() { return canonicalSitemap('attraction'); }

export async function bingo_halls_Router(request) { return canonicalRouter('bingo', request); }
export async function bingo_halls_SiteMap() { return canonicalSitemap('bingo'); }

export async function bowling_Router(request) { return canonicalRouter('bowling', request); }
export async function bowling_SiteMap() { return canonicalSitemap('bowling'); }

export async function casinos_Router(request) { return canonicalRouter('casino', request); }
export async function casinos_SiteMap() { return canonicalSitemap('casino'); }

export async function cinemas_Router(request) { return canonicalRouter('cinema', request); }
export async function cinemas_SiteMap() { return canonicalSitemap('cinema'); }

export async function classic_fruit_machines_Router(request) { return canonicalRouter('machine', request); }
export async function classic_fruit_machines_SiteMap() { return canonicalSitemap('machine'); }

export async function days_out_Router(request) { return canonicalRouter('daysOutIndex', request); }
export async function days_out_SiteMap() { return canonicalSitemap('daysOutIndex'); }

export async function family_fun_Router(request) { return canonicalRouter('familyFunIndex', request); }
export async function family_fun_SiteMap() { return canonicalSitemap('familyFunIndex'); }

export async function fishing_lakes_Router(request) { return canonicalRouter('fishing', request); }
export async function fishing_lakes_SiteMap() { return canonicalSitemap('fishing'); }

export async function hidden_gems_Router(request) { return canonicalRouter('hiddenGemsIndex', request); }
export async function hidden_gems_SiteMap() { return canonicalSitemap('hiddenGemsIndex'); }

export async function historical_sites_Router(request) { return canonicalRouter('historicSite', request); }
export async function historical_sites_SiteMap() { return canonicalSitemap('historicSite'); }

export async function holiday_parks_Router(request) { return canonicalRouter('holidayPark', request); }
export async function holiday_parks_SiteMap() { return canonicalSitemap('holidayPark'); }

export async function hotels_Router(request) { return legacyPathRouter('/hotels', request); }
export function hotels_SiteMap() { return []; }

export async function museums_Router(request) { return canonicalRouter('museum', request); }
export async function museums_SiteMap() { return canonicalSitemap('museum'); }

export async function nearby_attractions_Router(request) { return legacyPathRouter('/nearby-attractions', request); }
export function nearby_attractions_SiteMap() { return []; }

export async function offers_Router(request) { return canonicalRouter('offersIndex', request); }
export async function offers_SiteMap() { return canonicalSitemap('offersIndex'); }

export async function outdoors_Router(request) { return canonicalRouter('outdoors', request); }
export async function outdoors_SiteMap() { return canonicalSitemap('outdoors'); }

export async function piers_Router(request) { return canonicalRouter('pier', request); }
export async function piers_SiteMap() { return canonicalSitemap('pier'); }

export async function places_to_stay_Router(request) { return canonicalRouter('staysIndex', request); }
export async function places_to_stay_SiteMap() { return canonicalSitemap('staysIndex'); }

export async function plan_a_trip_Router(request) { return canonicalRouter('tripIndex', request); }
export async function plan_a_trip_SiteMap() { return canonicalSitemap('tripIndex'); }

export async function retro_video_games_Router(request) { return canonicalRouter('retroIndex', request); }
export async function retro_video_games_SiteMap() { return canonicalSitemap('retroIndex'); }

export async function sea_life_Router(request) { return canonicalRouter('seaLife', request); }
export async function sea_life_SiteMap() { return canonicalSitemap('seaLife'); }

export async function services_Router(request) { return canonicalRouter('service', request); }
export async function services_SiteMap() { return canonicalSitemap('service'); }

export async function theme_parks_Router(request) { return canonicalRouter('themePark', request); }
export async function theme_parks_SiteMap() { return canonicalSitemap('themePark'); }

export async function tours_Router(request) { return canonicalRouter('tour', request); }
export async function tours_SiteMap() { return canonicalSitemap('tour'); }

export async function zoos_Router(request) { return canonicalRouter('zoo', request); }
export async function zoos_SiteMap() { return canonicalSitemap('zoo'); }

// Dynamic hook spellings follow the documented prefix convention; invocation is a native test gate.
import { foodBeforeRouter, foodCustomizeQuery, foodAfterRouter } from 'backend/dynamicRoutingService';
import { legacyPathRouter } from 'backend/legacyRoutingService';
export function food_and_drink_beforeRouter(request) { return foodBeforeRouter(request); }
export function food_and_drink_customizeQuery(request, route, query) { return foodCustomizeQuery(request, route, query); }
export function food_and_drink_afterRouter(request, response) { return foodAfterRouter(request, response); }
export function arcade_venues_beforeRouter(request) { return legacyPathRouter('/arcade-venues', request); }
export function classic_fruit_machine_archive_beforeRouter(request) { return legacyPathRouter('/classic-fruit-machine-archive', request); }
export function classic_fruit_machine_archive_1_beforeRouter(request) { return legacyPathRouter('/classic-fruit-machine-archive-1', request); }
