/* Approved live additions consolidated into the maintained runtime.
 * URL-rewriting fallbacks are retired; the shared route authority remains in control.
 */

/* Expanded search and taxonomy */
/* Spin Raiders smart search (2026-10-07).
   Rules agreed with Jamie:
   1. Type on its own ("burgers", "family arcade", "bowling") -> every place of that type, offers first.
   2. Type + town ("burgers blackpool") -> only that type in that town, offers first.
   3. "near me" -> uses the visitor's location, nearest first, for any type.
   4. Places that are more than one thing show under every type they belong to (family arcade + AGC).
   5. Offers also surface at the top of their category. Affiliate records are read only, never changed.
   Exposes window.SR_SMART_SEARCH(q, {root}) -> {rows, note} | null (null = let the normal search run). */
(function () {
  'use strict';
  if (window.SR_SMART_SEARCH) return;
  if (location.pathname.replace(/\/+$/, '') === '/near-me') { location.replace('/search?q=' + encodeURIComponent('near me')); return; }

  /* ---------- text helpers ---------- */
  var norm = function (v) {
    return String(v || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[’']/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9+]+/g, ' ').replace(/\s+/g, ' ').trim();
  };
  var slugify = function (v) { return norm(v).replace(/\+/g, '').replace(/ /g, '-'); };
  var title = function (r) { return r.displayTitle || r.displayName || r.title || r.name || ''; };
  var townOf = function (r) { return r.locationName || r.destination || r.town || ''; };
  var townSlugOf = function (r) { return r.locationSlug || r.townSlug || r.destinationSlug || slugify(townOf(r)); };

  /* ---------- taxonomy ----------
     [key, label, parent filter key, row regex, query regex, CMS keywords for UK-wide prefilter] */
  var FOOD = [
    ['fishchips', 'Fish & chips', 'food', /fish (?:and )?(?:n )?chips?|fish and chip|chip shop|chippy|chippie|fish bar|fisheries|fish supper|fish restaurant|plaice|cod end|chipper/, /\bfish (?:and |n )?chips?\b|\bchipp(?:y|ie|ies)\b|\bchip shops?\b|\bfish bars?\b|\bfish suppers?\b/, ['fish and chip', 'fish & chip', 'fish-and-chip', 'chippy', 'fish bar', 'fisheries', 'chip shop']],
    ['burgers', 'Burgers', 'food', /burger/, /\bburgers?\b/, ['burger']],
    ['pizza', 'Pizza', 'food', /pizz/, /\bpizzas?\b|\bpizzerias?\b/, ['pizz']],
    ['italian', 'Italian', 'food', /italian|pasta|trattoria|osteria|ristorante/, /\bitalians?\b|\bpasta\b/, ['italian', 'pasta', 'trattoria', 'osteria']],
    ['indian', 'Indian & curry', 'food', /indian|curry|curries|tandoori|masala|balti|tikka|naan|bhaji|biryani/, /\bindians?\b|\bcurr(?:y|ies)(?: houses?)?\b|\btandoori\b|\bbalti\b/, ['indian', 'curry', 'curries', 'tandoori', 'masala', 'balti']],
    ['chinese', 'Chinese', 'food', /chinese|cantonese|oriental|dim sum|\bwok\b/, /\bchinese\b|\bdim sum\b|\boriental\b/, ['chinese', 'oriental', 'cantonese']],
    ['asian', 'Thai, Japanese & Asian', 'food', /\bthai\b|japanese|sushi|ramen|noodle|asian|korean|vietnamese/, /\bthai\b|\bjapanese\b|\bsushi\b|\bramen\b|\bnoodles?\b|\basian\b/, ['thai', 'japanese', 'sushi', 'ramen', 'noodle', 'asian']],
    ['greek', 'Greek, Turkish & Mediterranean', 'food', /greek|turkish|mediterranean|souvlaki|meze|mezze/, /\bgreek\b|\bturkish\b|\bmediterranean\b/, ['greek', 'turkish', 'mediterranean']],
    ['kebab', 'Kebabs & takeaways', 'food', /kebab|takeaway|take away|take-away/, /\bkebabs?\b|\btakeaways?\b|\btake aways?\b/, ['kebab', 'takeaway']],
    ['seafood', 'Seafood', 'food', /seafood|oyster|lobster|\bcrab\b|mussels/, /\bseafood\b|\boysters?\b|\blobsters?\b/, ['seafood', 'oyster', 'lobster']],
    ['cafe', 'Cafés & coffee', 'food', /\bcafe|\bcafes|coffee|tea ?room|tearoom|bakery|bakehouse|patisserie/, /\bcaf(?:e|es)\b|\bcoffee(?: shops?)?\b|\btea ?rooms?\b|\bbakery\b|\bbakeries\b/, ['cafe', 'café', 'coffee', 'espresso', 'tea room', 'tearoom', 'bakery']],
    ['breakfast', 'Breakfast & brunch', 'food', /breakfast|brunch|fry up|full english/, /\bbreakfasts?\b|\bbrunch(?:es)?\b|\bfry ups?\b|\bfull english\b/, ['breakfast', 'brunch']],
    ['afternoontea', 'Afternoon tea', 'food', /afternoon tea|cream tea|scones/, /\bafternoon teas?\b|\bcream teas?\b/, ['afternoon tea', 'cream tea', 'scones']],
    ['carvery', 'Carvery & Sunday roast', 'food', /carvery|sunday roast|roast dinner|toby|farmhouse inns/, /\bcarver(?:y|ies)\b|\bsunday roasts?\b|\broast dinners?\b|\broasts?\b/, ['carvery', 'roast']],
    ['pub', 'Pubs', 'food', /\bpubs?\b|\binn\b|\barms\b|tavern|hungry horse|wetherspoon|gastropub|\bale\b|carvery/, /\bpubs?\b|\binns?\b|\bgastro ?pubs?\b|\bbeer gardens?\b/, ['pub', ' inn', 'arms', 'tavern', 'hungry horse']],
    ['bar', 'Bars', 'food', /(?:^|[^h] )bars?\b|cocktail|wine bar|sky bar|lounge bar/, /\bbars?\b|\bcocktails?\b/, ['bar', 'cocktail']],
    ['desserts', 'Desserts & ice cream', 'food', /dessert|ice cream|gelato|waffle|sundae|cookie dough|milkshake/, /\bdesserts?\b|\bice creams?\b|\bgelato\b|\bwaffles?\b|\bmilkshakes?\b/, ['dessert', 'ice cream', 'gelato', 'waffle']],
    ['buffet', 'Buffets', 'food', /buffet|all you can eat/, /\bbuffets?\b|\ball you can eat\b/, ['buffet', 'all-you-can-eat']],
    ['diner', 'Diners', 'food', /\bdiner\b|american/, /\bdiners?\b|\bamerican\b/, ['diner', 'american']],
    ['restaurant', 'Restaurants', 'food', /restaurant|dining|bistro|brasserie|grill|steak/, /\brestaurants?\b|\bdining\b|\bbistros?\b|\bsteak ?houses?\b|\bsteaks?\b/, ['restaurant', 'dining', 'bistro', 'brasserie', 'grill', 'steak']]
  ];
  /* Generic "food" words: any food place. */
  var FOOD_ANY = /\b(?:food(?: and drink)?|eat and drink|places? to eat|somewhere to eat|where to eat|eat(?:ing)? out|eateries|eatery|something to eat|lunch|dinner|tea time|grub|meals?)\b/;
  var FOOD_ROW = /food|restaurant|cafe|café|coffee|takeaway|\bpub\b|\bpubs\b|\binn\b|chippy|fish (?:and |& )?chip|\bbar\b|grill|dining|tea ?room|bistro|carvery|diner|pizz|kebab|bakery/i;

  var PLACE = [
    ['familyarcade', 'Family arcades', 'venues', null, /\bfamily (?:arcades?|amusements?|entertainment cent(?:re|er)s?)\b|\bamusement arcades?\b|\bamusements\b|\bpenny arcades?\b|\b2p (?:machines?|arcades?)\b|\bcoin pushers?\b|\bseaside arcades?\b|\bfecs?\b|\barcades?\b/, ['amusement', 'arcade', 'family entertainment']],
    ['agc', 'Adult gaming centres', 'agc', null, /\badult gaming(?: cent(?:re|er)s?)?\b|\bagcs?\b|\bslot (?:arcades?|shops?|venues?)\b|\b18 ?\+? ?arcades?\b|\bmerkur\b|\badmiral\b/, ['adult gaming', 'agc', 'merkur', 'admiral']],
    ['arcadebars', 'Arcade bars', 'arcadebars', /arcade bar|gaming bar|arcade pub|racing simulator arcade/i, /\barcade (?:bars?|pubs?)\b|\bgaming bars?\b/, ['arcade bar', 'arcade pub', 'gaming bar']],
    ['retro', 'Retro & pinball arcades', 'venues', /retro|pinball|video arcade|video game|free.?play/i, /\bretro(?: arcades?| games?| gaming)?\b|\bpinball\b|\bvideo (?:arcades?|games?)\b/, ['retro', 'pinball', 'video game']],
    ['bowling', 'Bowling', 'bowling', /bowl|tenpin/i, /\bbowling(?: alleys?)?\b|\bten ?pin\b/, ['bowl', 'tenpin']],
    ['cinemas', 'Cinemas', 'cinemas', /cinema|cineworld|odeon|\bvue\b|showcase|picturehouse/i, /\bcinemas?\b|\bfilms?\b|\bmovies?\b|\bpictures\b/, ['cinema', 'odeon', 'cineworld', 'vue']],
    ['bingo', 'Bingo', 'bingo', /bingo/i, /\bbingo\b/, ['bingo']],
    ['casinos', 'Casinos', 'casinos', /casino/i, /\bcasinos?\b/, ['casino']],
    ['minigolf', 'Mini golf', 'golf', /mini golf|crazy golf|adventure golf|putt/i, /\b(?:mini|crazy|adventure) golf\b|\bputting\b/, ['mini golf', 'crazy golf', 'adventure golf']],
    ['golf', 'Golf', 'golf', /\bgolf\b|driving range|pitch and putt/i, /\bgolf(?: courses?| clubs?)?\b|\bdriving ranges?\b/, ['golf']],
    ['theme', 'Theme parks', 'theme', /theme park|amusement park|pleasure beach|funfair|fun fair|adventure park/i, /\btheme parks?\b|\bamusement parks?\b|\bfunfairs?\b|\bfun fairs?\b|\brollercoasters?\b|\brides\b/, ['theme park', 'amusement park', 'pleasure beach', 'funfair']],
    ['zoos', 'Zoos & wildlife', 'zoos', /\bzoo|wildlife|safari|farm park|animal park|bird of prey|falconry/i, /\bzoos?\b|\bwildlife(?: parks?)?\b|\bsafari(?: parks?)?\b|\bfarm parks?\b|\banimals?\b/, ['zoo', 'wildlife', 'safari', 'farm park']],
    ['sealife', 'Aquariums & Sea Life', 'sealife', /aquarium|sea life|sealife/i, /\baquariums?\b|\bsea ?life\b/, ['aquarium', 'sea life', 'sealife']],
    ['museums', 'Museums', 'museums', /museum|gallery/i, /\bmuseums?\b|\bgaller(?:y|ies)\b/, ['museum', 'gallery']],
    ['history', 'Castles & historic sites', 'history', /historic|castle|heritage|stately home|abbey|priory/i, /\bcastles?\b|\bhistoric(?:al)?(?: sites?| places?)?\b|\bheritage\b|\babbeys?\b|\bstately homes?\b/, ['castle', 'historic', 'heritage', 'abbey']],
    ['piers', 'Piers', 'piers', /\bpier\b/i, /\bpiers?\b/, ['pier']],
    ['beaches', 'Beaches', 'beaches', /beach/i, /\bbeach(?:es)?\b|\bseaside\b/, ['beach']],
    ['softplay', 'Soft play & trampolines', 'attractions', /soft play|trampoline|play cent(?:re|er)|indoor play|ninja|airtastic|jump/i, /\bsoft play\b|\btrampolin(?:e|es|ing)\b|\b(?:indoor )?play cent(?:re|er)s?\b|\bindoor play\b|\bninja\b/, ['soft play', 'trampoline', 'play centre', 'indoor play']],
    ['karting', 'Go karting', 'attractions', /kart/i, /\bgo ?karts?\b|\bkarting\b/, ['kart']],
    ['escape', 'Escape rooms', 'attractions', /escape room/i, /\bescape rooms?\b/, ['escape room']],
    ['laser', 'Laser tag & quest', 'attractions', /laser/i, /\blaser (?:tag|quest)\b|\blaser\b/, ['laser']],
    ['holiday', 'Holiday parks', 'holiday', /holiday park|caravan park|holiday village|camping|glamping/i, /\bholiday parks?\b|\bcaravan parks?\b|\bcamping\b|\bglamping\b|\bcampsites?\b/, ['holiday park', 'caravan park', 'camping']],
    ['stays', 'Places to stay', 'stays', /hotel|guest\s?house|b ?& ?b|accommodation|lodge|cottage|apartment/i, /\bplaces to stay\b|\bhotels?\b|\baccommodation\b|\bb ?(?:and|&|n) ?bs?\b|\bguest ?houses?\b|\bsomewhere to stay\b/, ['hotel', 'guest house', 'accommodation']],
    ['fishing', 'Fishing lakes', 'fishing', /fishery|fishing|angling|fishing lake/i, /\bfishing(?: lakes?)?\b|\bangling\b|\bfisher(?:y|ies)\b(?! and chips)/, ['fishing', 'fishery', 'angling']],
    ['outdoors', 'Nature & outdoors', 'outdoors', /nature|country park|national park|forest|woodland|reserve|garden/i, /\bnature(?: reserves?)?\b|\bcountry parks?\b|\bnational parks?\b|\bwalks?\b|\bwalking\b|\bforests?\b|\bgardens?\b/, ['nature', 'country park', 'forest', 'garden']],
    ['services', 'Service stations', 'services', /service station|motorway services/i, /\bservice stations?\b|\bmotorway services\b/, ['services']],
    ['attractions', 'Things to do', 'attractions', null, /\bthings to do\b|\bdays? out\b|\battractions?\b|\bfamily fun\b|\bkids?\b|\bchildren\b|\bwhat to do\b|\bfun\b/, null]
  ];
  var BY = {};
  FOOD.concat(PLACE).forEach(function (t) { BY[t[0]] = t; });

  /* ---------- classification ---------- */
  function rowText(r) {
    return norm([title(r), r.category, r.venueType, r.displaySubtitle, r.summary, r.shortDescription, r.unifiedSearchText,
      Array.isArray(r.tags) ? r.tags.join(' ') : r.tags, r.offerTitle].filter(Boolean).join(' '));
  }
  function isFoodRow(r) {
    if (r._collection === 'FoodAndDrink') return true;
    var head = [r.category, r.venueType, r.displaySubtitle].filter(Boolean).join(' ');
    if (r._collection === 'Venues') return /restaurant|food|cafe|café|pub\b|takeaway|diner/i.test(head) && !/arcade|amusement|bowl|gaming/i.test(head);
    return FOOD_ROW.test(head) || /food/i.test(head);
  }
  var cache = new WeakMap();
  function typesOf(r) {
    if (cache.has(r)) return cache.get(r);
    var out = [], text, head = norm([title(r), r.category, r.venueType, r.displaySubtitle].filter(Boolean).join(' '));
    if (isFoodRow(r)) {
      text = rowText(r);
      FOOD.forEach(function (t) { if (t[3].test(text)) out.push(t[0]); });
      /* "fish bar" etc. must not count as a bar; tidy obvious clashes */
      if (out.indexOf('fishchips') >= 0) out = out.filter(function (k) { return k !== 'bar' || /cocktail|wine bar|sky bar/.test(text); });
      if (!out.length) out.push('restaurant');
      out.push('food');
    } else {
      var vt = String(r.venueType || '') + ' ' + String(r.category || '');
      var smallText = norm([title(r), r.category, r.venueType, r.displaySubtitle, r.summary].filter(Boolean).join(' '));
      var placeText = r._collection === 'AffiliateOffers' ? smallText : head;
      PLACE.forEach(function (t) {
        if (t[3] && t[3].test(placeText)) out.push(t[0]);
      });
      if (r._collection === 'Venues') {
        var adult = /adult|\bagc\b|18\+|slots|merkur|admiral|luxury leisure|cashino|quicksilver/i.test(vt + ' ' + title(r));
        var family = /family|amusement|\bfec\b|arcade|pier|seaside|fun ?park|leisure/i.test(vt) || r.familyFEC === true || r.familyEntertainmentCentre === true || (r.amusementArcade === true && r.familyFriendly === true);
        var pureAgc = adult && !/family|amusement|\bfec\b|pier|retro|classic amusements|holiday|theme/i.test(vt) && r.familyFEC !== true;
        if (adult || r.adultGamingCentre === true) out.push('agc');
        var notArcade = /airtastic|trampolin|soft play|ninja|clip ?n ?climb|jump|escape room|laser|kart/i.test(vt + ' ' + title(r));
        if (family && !pureAgc && !notArcade && !/^\s*(bingo|casino|service|holiday park|holiday|theme)\s*$/i.test(String(r.venueType || ''))) out.push('familyarcade');
      }
      if (out.indexOf('fishing') >= 0 && /fish (?:and |& )?chip/.test(smallText)) out.splice(out.indexOf('fishing'), 1);
      if (!out.length && r._collection !== 'Venues') out.push('attractions');
    }
    out = out.filter(function (v, i, a) { return a.indexOf(v) === i; });
    cache.set(r, out);
    return out;
  }
  function parentsOf(r) {
    return typesOf(r).map(function (k) { return k === 'food' ? 'food' : (BY[k] ? BY[k][2] : k); });
  }
  window.SR_PLACE_SUBTYPES = typesOf;

  /* Make the existing filters understand dual places and food. */
  (function wrapCategories() {
    if (!window.SR_PLACE_CATEGORIES || !window.SR_CLASSIFY_PLACE) return setTimeout(wrapCategories, 100);
    if (window.SR_PLACE_CATEGORIES.__smart) return;
    var origCats = window.SR_PLACE_CATEGORIES, origClass = window.SR_CLASSIFY_PLACE;
    var cats = function (row) {
      var base = origCats(row) || [];
      try { parentsOf(row).forEach(function (p) { if (base.indexOf(p) < 0) base = base.concat(p); }); } catch (e) {}
      return base;
    };
    cats.__smart = true;
    window.SR_PLACE_CATEGORIES = cats;
    window.SR_CLASSIFY_PLACE = function (row) {
      var c = origClass(row);
      try {
        var want = window.__srSmartPrimary;
        if (want && want !== c && cats(row).indexOf(want) >= 0) return want;
        if (c === 'agc' && want !== 'agc' && row._collection === 'Venues' && typesOf(row).indexOf('familyarcade') >= 0) return 'venues'; if ((c === 'fishing' || c === 'attractions' || c === 'venues') && isFoodRow(row) && row._collection !== 'Venues') return 'food'; } catch (e) {}
      return c;
    };
  })();

  /* Coordinates for towns that were missing them, so "nearest" fallbacks work there too. */
  (function addCoords() {
    var X = { 'thornaby': [54.533, -1.300], 'talybont': [52.775, -4.098], 'crook': [54.716, -1.746], 'strood': [51.393, 0.478], 'moreton': [53.401, -3.112],
      'watton': [52.571, 0.828], 'shaw': [53.577, -2.093], 'redhill': [51.240, -0.170], 'wymondham': [52.570, 1.116], 'newbridge': [51.666, -3.143], 'hyde': [53.451, -2.079],
      'willenhall': [52.585, -2.059], 'normanton': [53.700, -1.416], 'ripley': [53.050, -1.405], 'ocean edge leisure park': [54.039, -2.894], 'romney sands holiday village': [50.973, 0.959],
      'southerness holiday village': [54.876, -3.598], 'summerfields holiday park': [52.676, 1.718], 'littleborough': [53.644, -2.096], 'bluewater': [51.439, 0.271],
      'minster on sea': [51.420, 0.811], 'donington park': [52.830, -1.375], 'heathrow airport': [51.470, -0.454], 'manchester airport': [53.358, -2.272], 'attleborough': [52.518, 1.019],
      'norris green': [53.445, -2.928], 'handsworth': [52.505, -1.930], 'kingswood': [51.458, -2.505], 'norbury': [51.411, -0.121], 'sydenham': [51.427, -0.054], 'saltburn': [54.582, -0.974] };
    var C = window.SR_TRIP_COORDS = window.SR_TRIP_COORDS || {};
    Object.keys(X).forEach(function (k) { if (!C[k]) C[k] = X[k]; var h = k.replace(/ /g, '-'); if (!C[h]) C[h] = X[k]; });
  })();
  /* ---------- query parsing ---------- */
  var NEAR = /\b(?:near ?me|nearby|near here|close to me|close by|closest|nearest|around me|around here|local to me|in my area|my area|near to me)\b/;
  var STOP = /\b(?:the|a|an|in|at|on|near|around|by|best|good|great|top|cheap|cheapest|nice|lovely|decent|proper|where|wheres|can|i|we|get|find|some|any|places?|to|go|for|sell|sells|selling|serve|serves|serving|do|does|they|with|open|today|tonight|now|me|my|us|of|is|are|there|what|which|and|or|please|show|looking|want|fancy|near|uk|area|local|family friendly|family|kids|cheap)\b/g;
  var towns = null, townsReady = null;
  function loadTowns() {
    if (townsReady) return townsReady;
    var list = {};
    Object.keys(window.SR_TRIP_COORDS || {}).forEach(function (k) {
      var c = window.SR_TRIP_COORDS[k]; list[slugify(k)] = { slug: slugify(k), name: k.replace(/\b[a-z]/g, function (m) { return m.toUpperCase(); }), lat: c[0], lng: c[1] };
    });
    towns = list;
    if (!((window.SR_SEASIDE && window.SR_SEASIDE.archiveQuery) || (window.SR_PUBLIC_DIRECTORY && window.SR_PUBLIC_DIRECTORY.S && window.SR_PUBLIC_DIRECTORY.S.archiveQuery))) { townsReady = null; return Promise.resolve(list); }
    townsReady = query('Locations', {}, ['title', 'slug', 'latitude', 'longitude', 'region', 'county']).then(function (rows) {
      rows.forEach(function (r) {
        var s = r.slug || slugify(r.title); if (!s) return;
        var t = list[s] || (list[s] = { slug: s });
        t.name = r.title || t.name; t.region = r.region;
        if (r.latitude && r.longitude) { t.lat = +r.latitude; t.lng = +r.longitude; }
      });
      towns = list; return list;
    }).catch(function () { towns = list; return list; });
    return townsReady;
  }
  function findTown(text) {
    var words = norm(text).split(' ').filter(Boolean);
    if (!words.length || !towns) return null;
    var best = null;
    for (var n = Math.min(4, words.length); n >= 1 && !best; n--) {
      for (var i = 0; i + n <= words.length; i++) {
        var cand = words.slice(i, i + n).join('-');
        var hit = towns[cand] || towns[cand.replace(/^st-/, 'saint-')] || towns[cand.replace(/^saint-/, 'st-')] || towns[cand + '-on-sea'];
        if (hit) { best = { town: hit, used: words.slice(i, i + n) }; break; }
      }
    }
    return best;
  }
  function parse(q) {
    var t = ' ' + norm(q) + ' ', types = [], near = false, anyFood = false;
    if (NEAR.test(t)) { near = true; t = t.replace(NEAR, ' '); }
    /* longest / most specific phrases first */
    [['arcadebars'], ['minigolf'], ['agc'], ['retro']].forEach(function (k) {
      var ty = BY[k[0]]; if (ty[4].test(t)) { types.push(ty[0]); t = t.replace(new RegExp(ty[4].source, 'g'), ' '); }
    });
    FOOD.forEach(function (ty) { if (ty[4].test(t)) { types.push(ty[0]); t = t.replace(new RegExp(ty[4].source, 'g'), ' '); } });
    PLACE.forEach(function (ty) { if (types.indexOf(ty[0]) < 0 && ty[4].test(t)) { types.push(ty[0]); t = t.replace(new RegExp(ty[4].source, 'g'), ' '); } });
    if (FOOD_ANY.test(t)) { anyFood = true; t = t.replace(new RegExp(FOOD_ANY.source, 'g'), ' '); }
    if (anyFood && !types.some(function (k) { return BY[k] && BY[k][2] === 'food'; })) types.push('food');
    var raw = t.replace(/\s+/g, ' ').trim();
    var tw = findTown(raw);
    if (tw) raw = (' ' + raw + ' ').replace(' ' + tw.used.join(' ') + ' ', ' ');
    var rest = raw.replace(STOP, ' ').replace(/\s+/g, ' ').trim();
    return { types: types, near: near, town: tw && tw.town, words: rest ? rest.split(' ').filter(function (w) { return w.length > 1; }) : [] };
  }
  window.SR_SMART_PARSE = parse;

  /* ---------- data ---------- */
  var FIELDS = ['title', 'name', 'displayTitle', 'displayName', 'slug', 'routeSlug', 'locationName', 'locationSlug', 'destination', 'destinationSlug', 'town', 'townSlug',
    'category', 'venueType', 'displaySubtitle', 'summary', 'shortDescription', 'unifiedSearchText', 'tags', 'offerTitle', 'offerText', 'offerCount', 'offerIds',
    'offerValidUntil', 'validUntil', 'recordType', 'affiliate', 'affiliateUrl', 'outboundUrl', 'heroImage', 'cardImage', 'image', 'imageVerified', 'imageResearchStatus', 'imageAccuracy',
    'exteriorImageAlt', 'imageAltText', 'imageAlt', 'latitude', 'longitude', 'publicRatingStatus', 'publicRating', 'publicReviewCount', 'publicRatingSource', 'ratingSource',
    'familyFriendly', 'familyFEC', 'familyEntertainmentCentre', 'amusementArcade', 'adultGamingCentre', 'ageRestriction', 'facilities', 'disabledAccess', 'parking', 'parkingAvailable',
    'freeParking', 'dogFriendly', 'wifi', 'freeWifi', 'active', 'directoryReady', 'cardReady', 'pageReady', 'status', 'locationStatus', 'currentVenueStatus', 'canonicalMachineId',
    'revenueReady', 'website', 'address', 'postcode', 'region', 'county', 'country', 'linkedAttractionId', 'hotelGuideId', 'canonicalHotelUrl', 'link-arcade-venues-title'];
  var live = function (r) {
    return r.active !== false && r.directoryReady !== false && r.cardReady !== false && !r.canonicalMachineId &&
      !/^(duplicate|merged|deleted|archived|quarantin|suppress|permanently closed|closed|rejected|hold)/i.test([r.status, r.locationStatus, r.currentVenueStatus].filter(Boolean).join(' '));
  };
  function query(c, filter, fields) {
    var S = (window.SR_SEASIDE && window.SR_SEASIDE.archiveQuery) ? window.SR_SEASIDE : (window.SR_PUBLIC_DIRECTORY && window.SR_PUBLIC_DIRECTORY.S), out = [];
    function page(offset) {
      return S.archiveQuery({ fields: fields || FIELDS, filter: filter || {}, sort: [{ fieldName: '_id', order: 'ASC' }], paging: { limit: 1000, offset: offset } }, null, false, c)
        .then(function (res) {
          var items = (res && res.dataItems) || [];
          out.push.apply(out, items.map(function (x) { return Object.assign({}, x.data, { _id: x.id, _collection: c }); }));
          return items.length >= 1000 && offset < 5000 ? page(offset + 1000) : out;
        });
    }
    return page(0);
  }
  var COLS_FOOD = ['FoodAndDrink', 'AffiliateOffers', 'NearbyAttractions', 'Venues'];
  var COLS_PLACE = ['Venues', 'NearbyAttractions', 'AffiliateOffers'];
  function colsFor(types) {
    var food = types.some(function (k) { return k === 'food' || (BY[k] && BY[k][2] === 'food'); });
    var place = types.some(function (k) { return BY[k] && BY[k][2] !== 'food'; });
    var cols = [];
    if (food) cols = cols.concat(COLS_FOOD);
    if (place) cols = cols.concat(COLS_PLACE);
    if (types.indexOf('stays') >= 0 || types.indexOf('holiday') >= 0) cols.push('HotelGuides');
    return cols.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }
  function textFields(c) {
    return c === 'FoodAndDrink' ? ['title', 'displayName', 'shortDescription'] :
      c === 'Venues' ? ['title', 'venueType', 'category', 'unifiedSearchText'] :
        ['title', 'category', 'unifiedSearchText'];
  }
  function keywordFilter(c, types) {
    var kws = [];
    types.forEach(function (k) {
      if (k === 'food') kws.push('food', 'restaurant', 'cafe', 'pub', 'bar');
      else if (BY[k] && BY[k][5]) kws = kws.concat(BY[k][5]);
    });
    if (!kws.length) return {};
    kws = kws.filter(function (v, i, a) { return a.indexOf(v) === i; });
    var or = [];
    textFields(c).forEach(function (f) { kws.forEach(function (w) { var o = {}; o[f] = { $contains: w.trim() }; or.push(o); }); });
    return { $or: or };
  }
  function inTown(r, t) {
    var want = t.slug, ts = [townSlugOf(r), slugify(r.locationName), slugify(r.destination), slugify(r.town)].filter(Boolean);
    return ts.some(function (x) { return x === want || x.indexOf(want + '-') === 0; });
  }
  function townFilter(c, slugs, names) {
    var or = [];
    if (c === 'FoodAndDrink') {
      or.push({ townSlug: { $in: slugs } });
      names.forEach(function (n) { or.push({ town: { $contains: n } }); });
    } else {
      or.push({ locationSlug: { $in: slugs } });
      if (c === 'AffiliateOffers') or.push({ destinationSlug: { $in: slugs } });
      names.forEach(function (n) { or.push({ locationName: { $contains: n } }); });
    }
    return { $or: or };
  }

  async function settle(rows) {
    for (var i = 0; i < 2; i++) {
      var bad = rows.filter(function (r) { try { var o = window.SR_ROUTES.outcome(r); return !o.ok && /route_service_unavailable|route_pending|route_not_resolved/.test(o.code || ''); } catch (e) { return false; } });
      if (!bad.length || !window.SR_ROUTES.annotate) return;
      await new Promise(function (ok) { setTimeout(ok, 600 * (i + 1)); });
      var by = {};
      bad.forEach(function (r) { (by[r._collection] = by[r._collection] || []).push(r); });
      await Promise.all(Object.keys(by).map(function (c) { return window.SR_ROUTES.annotate(by[c], c, { refresh: true }).catch(function () {}); }));
    }
  }
  /* ---------- geography ---------- */
  function miles(a, b) {
    var r = function (x) { return x * Math.PI / 180; };
    var h = Math.pow(Math.sin(r(b[0] - a[0]) / 2), 2) + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.pow(Math.sin(r(b[1] - a[1]) / 2), 2);
    return 7917.6 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function coordsOf(r) {
    var la = +r.latitude, lo = +r.longitude;
    if (isFinite(la) && isFinite(lo) && la && lo) return [la, lo];
    var t = towns && towns[townSlugOf(r)];
    return t && t.lat ? [t.lat, t.lng] : null;
  }
  function where() {
    return new Promise(function (ok) {
      if (!navigator.geolocation) return ok(null);
      var done = false;
      setTimeout(function () { if (!done) { done = true; ok(null); } }, 12000);
      navigator.geolocation.getCurrentPosition(function (p) { if (!done) { done = true; ok([p.coords.latitude, p.coords.longitude]); } },
        function () { if (!done) { done = true; ok(null); } }, { timeout: 10000, maximumAge: 120000 });
    });
  }

  /* ---------- offers and ranking ---------- */
  function role(r) { try { return window.SR_ROUTES.outcome(r).recordRole; } catch (e) { return 'unknown'; } }
  function ready(r) { try { return window.SR_ROUTE_UI.ready(r) && window.SR_ROUTE_UI.discoverable(r); } catch (e) { return false; } }
  function isOffer(r) {
    if (r._collection !== 'AffiliateOffers' || role(r) !== 'offer') return false;
    try { if (window.SR_CANONICAL && window.SR_CANONICAL.offerLive && !window.SR_CANONICAL.offerLive(r)) return false; } catch (e) {}
    var until = r.validUntil || r.offerValidUntil;
    return !(until && new Date(until + ' 23:59:59') < new Date());
  }
  function hasOffers(r) { return (+r.offerCount > 0) || (Array.isArray(r.offerIds) && r.offerIds.length > 0); }
  function rating(r) { if (!(/^VERIFIED/i.test(r.publicRatingStatus || '') && +r.publicRating > 0)) return 0; var n = +r.publicReviewCount || 0; return (+r.publicRating * n + 3.8 * 25) / (n + 25); }
  function photo(r) {
    var S = window.SR_SEASIDE;
    try { return !!(S.safePhoto && S.safePhoto(Object.assign({}, r, { heroImage: r.heroImage || r.image }))); } catch (e) { return false; }
  }
  function matches(r, types) {
    var ts = typesOf(r);
    return types.some(function (k) {
      if (k === 'food') return ts.indexOf('food') >= 0;
      if (k === 'attractions') return ts.length > 0 && ts.indexOf('food') < 0 && ts.indexOf('stays') < 0;
      if (k === 'restaurant') return ts.indexOf('food') >= 0 && (ts.indexOf('restaurant') >= 0 || ts.length > 1);
      return ts.indexOf(k) >= 0;
    });
  }
  function label(types, town, near) {
    var names = types.map(function (k) { return k === 'food' ? 'Places to eat' : (BY[k] ? BY[k][1] : k); });
    var s = names.slice(0, 3).join(' & ') || 'Places';
    if (town) s += ' in ' + (town.name || town.slug);
    if (near) s += ' near you';
    return s;
  }
  function decorate(r) {
    /* Show the food type on the card for listings that only say "Food". */
    if (r._collection === 'Venues' || r.venueType) return r;
    var ts = typesOf(r).filter(function (k) { return k !== 'food' && k !== 'restaurant' && BY[k] && BY[k][2] === 'food'; });
    if (!ts.length) return r;
    return Object.assign({}, r, { venueType: ts.slice(0, 2).map(function (k) { return BY[k][1]; }).join(' · ') });
  }

  /* ---------- hand-picked deals (same rules as the town deals strip: only offers with a hotel guide) ---------- */
  var offersReady = null;
  function loadOffers() {
    if (offersReady) return offersReady;
    var C = window.SR_CANONICAL, D = window.SR_PUBLIC_DIRECTORY && window.SR_PUBLIC_DIRECTORY.D;
    if (!C || !C.normalizeOffer || !D || !D.rows) return Promise.resolve([]);
    offersReady = Promise.allSettled(['HotelGuides', 'HotelOffers', 'AffiliateOffers'].map(function (c) { return D.rows(c); })).then(function (outs) {
      var guides = outs[0].status === 'fulfilled' ? outs[0].value.filter(function (g) { return g.active !== false; }) : [];
      var seen = {};
      return outs.slice(1).flatMap(function (o) { return o.status === 'fulfilled' ? o.value : []; }).map(function (r) {
        r = C.normalizeOffer(r, guides);
        if (!C.offerLive(r)) return null;
        var h = C.hotelHref(r);
        if (h) return Object.assign(r, { _dealHref: h });
        var role; try { role = window.SR_ROUTES.outcome(r).recordRole; } catch (e) { role = ''; }
        if (r._collection === 'AffiliateOffers' && (role !== 'business' || r.affiliate === true) && C.outbound(r)) return Object.assign(r, { _dealHref: C.outbound(r), _external: true });
        return null;
      }).filter(function (r) {
        if (!r || !(r.dealPrice || r.offerTitle || r.discountText || r.offerBadge)) return false;
        var k = C.offerKey ? C.offerKey(r) : r._dealHref + '|' + C.outbound(r); if (seen[k]) return false; seen[k] = 1; return true;
      });
    }).catch(function () { return []; });
    return offersReady;
  }
  function offerMatches(r, p, slugSet, here, radius) {
    if (slugSet) {
      var hit = [r.locationSlug, r.destinationSlug, r.locationName, r.destination].some(function (v) { return v && slugSet[slugify(v)]; });
      if (!hit) return false;
    } else if (here) {
      var c = coordsOf(r); if (!c || miles(here, c) > radius * 1.2 + 5) return false;
    }
    if (p.types.indexOf('attractions') >= 0 && p.types.indexOf('food') >= 0) return true;
    return matches(r, p.types);
  }
  var DEAL_CSS = '.srsd{margin:0 0 22px;padding:16px;border-radius:16px;background:linear-gradient(135deg,#0b2545 0%,#13315c 60%,#1d4e89 100%);color:#fff}' +
    '.srsd-k{display:inline-block;background:#ffd23f;color:#0b2545;font-weight:900;font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:999px}' +
    '.srsd h2{margin:8px 0 12px;font-size:clamp(20px,2.4vw,26px);line-height:1.1;color:#fff}' +
    '.srsd-row{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(220px,1fr);gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px}' +
    '.srsd-card{scroll-snap-align:start;display:flex;flex-direction:column;background:#fff;color:#0b2545;border-radius:12px;overflow:hidden;text-decoration:none;min-width:0}' +
    '.srsd-img{position:relative;aspect-ratio:3/2;background:#dfe9f5;overflow:hidden}.srsd-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
    '.srsd-save{position:absolute;left:8px;top:8px;background:#ff2e88;color:#fff;font-weight:900;font-size:12px;padding:4px 8px;border-radius:8px}' +
    '.srsd-body{padding:10px 12px 12px;display:flex;flex-direction:column;gap:4px;flex:1}.srsd-cat{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#1d6fd8}' +
    '.srsd-t{font-size:15px;font-weight:900;line-height:1.2;margin:0}.srsd-o{font-size:13px;line-height:1.35;color:#39506b;margin:0}' +
    '.srsd-foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:6px}.srsd-p{font-weight:900}.srsd-cta{background:#ffd23f;color:#0b2545;font-weight:900;font-size:12px;padding:7px 10px;border-radius:8px;white-space:nowrap}' +
    '@media(max-width:640px){.srsd-row{grid-auto-columns:78%}}';
  function dealCard(r) {
    var u = r._dealHref; if (!u) return '';
    var pic = '', raw = r.dealImage || (r.image && r.image.url) || r.image || r.heroImage;
    try { var S = window.SR_SEASIDE; pic = S && S.fit && S.img ? S.fit(S.img(raw), 560) : String(raw || ''); } catch (e) { pic = ''; }
    var t = r.displayTitle || r.name || r.title || '';
    var save = String(r.offerBadge || r.discountText || '').replace(/^SAVE UP TO/i, 'Save');
    var cat = String(r.category || '').replace(/^THINGS TO DO OFFER\s*•\s*/i, '').replace(/\bOFFER\b/i, '').trim() || 'Deal';
    return '<a class="srsd-card" href="' + escapeHtml(u) + '"' + (r._external ? ' target="_blank" rel="sponsored noopener"' : '') + '><div class="srsd-img">' + (pic ? '<img src="' + escapeHtml(pic) + '" alt="' + escapeHtml(r.imageAlt || t) + '" loading="lazy">' : '') +
      (save ? '<span class="srsd-save">' + escapeHtml(save) + '</span>' : '') + '</div><div class="srsd-body"><span class="srsd-cat">' + escapeHtml(cat) + '</span><h3 class="srsd-t">' + escapeHtml(t) + '</h3>' +
      (r.offerTitle ? '<p class="srsd-o">' + escapeHtml(r.offerTitle) + '</p>' : '') + '<div class="srsd-foot"><span class="srsd-p">' + escapeHtml(String(r.dealPrice || '').replace(/^FROM\s*/i, 'From ')) + '</span><span class="srsd-cta">View deal →</span></div></div></a>';
  }

  /* ---------- main ---------- */
  async function smart(q, opts) {
    opts = opts || {};
    if (!q || !((window.SR_SEASIDE && window.SR_SEASIDE.archiveQuery) || (window.SR_PUBLIC_DIRECTORY && window.SR_PUBLIC_DIRECTORY.S && window.SR_PUBLIC_DIRECTORY.S.archiveQuery))) return null;
    await loadTowns();
    var p = parse(q);
    if (!p.types.length && !p.near) return null;          /* plain name / town searches use the normal search */
    var noType = !p.types.length;
    if (noType) p.types = ['attractions', 'food'];   /* "near me" on its own: things to do + places to eat */
    var anyTypeTried = '', cols = colsFor(p.types), here = null, slugs = null, names = [], note = '', radius = 0, setRadius = null;

    if (p.near) {
      here = await where();
      if (here) {
        var near = Object.keys(towns).map(function (k) { return towns[k]; }).filter(function (t) { return t.lat; })
          .map(function (t) { return { t: t, d: miles(here, [t.lat, t.lng]) }; }).sort(function (a, b) { return a.d - b.d; });
        var nearTowns = near;
        setRadius = function (r) {
          radius = r;
          slugs = nearTowns.filter(function (x) { return x.d <= r; }).map(function (x) { return x.t.slug; });
          if (slugs.length < 3) slugs = nearTowns.slice(0, 15).map(function (x) { return x.t.slug; });
          slugs = slugs.slice(0, 150);
        };
        setRadius(25);
      } else if (noType && !p.town) {
        return null;
      } else {
        note = 'Turn on location for this site to see what’s nearest – showing the best matches across the UK for now.';
      }
    }
    if (p.town) { slugs = [p.town.slug]; names = [p.town.name || p.town.slug]; }

    async function fetchAll() {
    var tasks = cols.map(function (c) {
      var f = slugs ? townFilter(c, slugs, names) : keywordFilter(c, p.types);
      if (slugs && p.near && here && (c === 'Venues')) {
        var dl = Math.min(1.5, radius / 69 + 0.1), dn = dl / Math.max(0.2, Math.cos(here[0] * Math.PI / 180));
        f = { $or: [f, { $and: [{ latitude: { $gt: here[0] - dl } }, { latitude: { $lt: here[0] + dl } }, { longitude: { $gt: here[1] - dn } }, { longitude: { $lt: here[1] + dn } }] }] };
      }
      return query(c, f);
    });
    var res = await Promise.allSettled(tasks);
    failed = res.filter(function (r) { return r.status === 'rejected'; }).length;
    return res.flatMap(function (r) { return r.status === 'fulfilled' ? r.value : []; }).filter(live);
    }
    var failed = 0, rows = await fetchAll();
    await settle(rows);

    function pick(list, loose) {
      var seen = {}, out = [];
      list.forEach(function (r) {
        if (!ready(r)) return;
        if (r._collection === 'HotelGuides' && !(window.SR_CANONICAL && window.SR_CANONICAL.hotelHref && window.SR_CANONICAL.hotelHref(r))) return;
        var off = false;
        if (r._collection === 'AffiliateOffers' && role(r) !== 'business') return;
        if (!matches(r, p.types)) return;
        if (p.town && !loose && !inTown(r, p.town)) return;
        if (p.words.length) {
          var tx = rowText(r) + ' ' + norm(townOf(r));
          if (!p.words.every(function (w) { return tx.indexOf(w) >= 0; })) return;
        }
        var k; try { k = window.SR_ROUTE_UI.key(r); } catch (e) { k = r._collection + ':' + r._id; }
        var tn = norm(townOf(r)), tt = norm(title(r)); if (tn && tt.length > tn.length + 3 && tt.slice(-tn.length) === tn) tt = tt.slice(0, -tn.length).trim();
        var k2 = tt + '|' + tn;
        if (seen[k] || (!off && seen[k2])) return;
        seen[k] = 1; if (!off) seen[k2] = 1;
        out.push(r);
      });
      return out;
    }
    var found = pick(rows);
    while (p.near && here && setRadius && found.length < 5 && radius < 100) {
      setRadius(radius === 25 ? 50 : 100);
      var more2 = await fetchAll(); await settle(more2); found = pick(more2);
    }
    if (p.near && here && !found.length) {
      var wide = await Promise.allSettled(cols.map(function (c) { return query(c, keywordFilter(c, p.types)); }));
      found = pick(wide.flatMap(function (r) { return r.status === 'fulfilled' ? r.value : []; }).filter(live));
      if (found.length) { radius = 100000; note = 'We haven’t listed any within 100 miles of you yet – here are the nearest we have.'; }
    }

    /* Never leave someone with nothing: widen to nearby towns, then say so. */
    if (!found.length && p.town && p.town.lat) {
      var around = Object.keys(towns).map(function (k) { return towns[k]; }).filter(function (t) { return t.lat && miles([p.town.lat, p.town.lng], [t.lat, t.lng]) <= 25; }).map(function (t) { return t.slug; }).slice(0, 80);
      var more = await Promise.allSettled(cols.map(function (c) { return query(c, townFilter(c, around, [])); }));
      found = pick(more.flatMap(function (r) { return r.status === 'fulfilled' ? r.value : []; }).filter(live), true);
      here = [p.town.lat, p.town.lng];
      if (found.length) note = 'We haven’t listed any ' + label(p.types).toLowerCase() + ' in ' + (p.town.name || p.town.slug) + ' yet, so here are the nearest within 25 miles.';
    }
    if (!found.length && p.town) {
      var anyType = p.types.some(function (k) { return k === 'food' || (BY[k] && BY[k][2] === 'food'); }) ? ['food'] : ['attractions', 'food'];
      anyTypeTried = anyType.length > 1 ? 'all' : 'food';
      var all = await Promise.allSettled(colsFor(anyType).map(function (c) { return query(c, townFilter(c, [p.town.slug], [p.town.name || p.town.slug])); }));
      var keep = p.types; p.types = anyType;
      found = pick(all.flatMap(function (r) { return r.status === 'fulfilled' ? r.value : []; }).filter(live));
      p.types = keep;
      if (found.length) note = 'Nothing listed for that in ' + (p.town.name || p.town.slug) + ' yet – here’s everything else nearby you might like.';
    }

    if (!found.length && p.town && anyTypeTried !== 'all') {
      var all2 = await Promise.allSettled(colsFor(['attractions', 'food']).map(function (c) { return query(c, townFilter(c, [p.town.slug], [p.town.name || p.town.slug])); }));
      var keep2 = p.types; p.types = ['attractions', 'food'];
      found = pick(all2.flatMap(function (r) { return r.status === 'fulfilled' ? r.value : []; }).filter(live));
      p.types = keep2;
      if (found.length) note = 'Nothing listed for that in ' + (p.town.name || p.town.slug) + ' yet – here’s what else is there.';
    }
    if (!found.length && !p.near) return null;   /* nothing typed matches: fall back to the normal word search */
    var dist = function (r) { if (!here) return null; var c = coordsOf(r); return c ? miles(here, c) : null; };
    var nameHit = function (r) { var t = norm(title(r)); return p.types.some(function (k) { return BY[k] && BY[k][3] && BY[k][3].test(t); }) ? 1 : 0; };
    found.sort(function (a, b) {
      var oa = isOffer(a) ? 2 : hasOffers(a) ? 1 : 0, ob = isOffer(b) ? 2 : hasOffers(b) ? 1 : 0;
      if (oa !== ob) return ob - oa;
      if (here) { var da = dist(a), db = dist(b); if (da == null) da = 1e9; if (db == null) db = 1e9; if (Math.abs(da - db) > 0.05) return da - db; }
      var sa = nameHit(a) * 2 + (photo(a) ? 1 : 0) + rating(a) / 5, sb = nameHit(b) * 2 + (photo(b) ? 1 : 0) + rating(b) / 5;
      return sb - sa || title(a).localeCompare(title(b));
    });
    if (here && p.near) found = found.filter(function (r) { var d = dist(r); return d == null ? false : d <= radius * 1.2 + 5; });

    var slugSet = null;
    if (slugs) { slugSet = {}; slugs.forEach(function (x) { slugSet[x] = 1; }); }
    var deals = [];
    try {
      deals = (await loadOffers()).filter(function (r) { return offerMatches(r, p, slugSet, here, radius || 25); });
      deals.sort(function (a, b) { return (+!!b.dealPrice) - (+!!a.dealPrice) || (Number(b.dealBoughtCount) || 0) - (Number(a.dealBoughtCount) || 0); });
      deals = deals.slice(0, 12);
    } catch (e) { deals = []; }
    var heading = label(p.types, p.town, p.near && here);
    if (deals.length && /^(Nothing listed|We haven’t listed)/.test(note)) note = 'Current deals for that are at the top. We haven’t listed places for it here yet, so below is what else is nearby.';
    var sub = deals.length && !/deals/i.test(note) ? 'Deals shown first.' : '';
    if (here && p.near) sub = (sub ? sub + ' ' : '') + 'Nearest to you first.';
    return { rows: found.map(decorate), deals: deals, failed: failed, heading: heading, note: [note, sub].filter(Boolean).join(' '), parsed: p };
  }

  window.SR_SMART_SEARCH = function (q, opts) {
    return smart(q, opts).then(function (r) {
      if (!r) return null;
      var root = opts && opts.root;
      if (root && root.host && !root.host.isConnected) return null;
      if (root) {
        try {
          /* Tick the matching category filter (or clear it) so the panel agrees with the results. */
          var keys = r.parsed.types.map(function (k) { return k === 'food' ? 'food' : BY[k] && BY[k][2]; });
          var boxes = root.querySelectorAll('input[name=category]');
          var single = keys.length === 1 ? keys[0] : null;
          if (single && !r.rows.every(function (row) { try { return window.SR_PLACE_CATEGORIES(row).indexOf(single) >= 0; } catch (e) { return false; } })) single = null;
          window.__srSmartPrimary = single;
          boxes.forEach(function (b) { b.checked = !!single && b.value === single; });
          var head = root.querySelector('.results-heading') || root.querySelector('[data-count]');
          var el = root.querySelector('#sr-smart-note');
          if (!el && head) {
            el = document.createElement('div'); el.id = 'sr-smart-note';
            el.style.cssText = 'margin:6px 0 14px;font:inherit;';
            (head.closest('.results-heading') || head).insertAdjacentElement('afterend', el);
          }
          if (el) el.innerHTML = '<strong style="font-size:1.15em;display:block">' + escapeHtml(r.heading) + '</strong>' + (r.note ? '<span style="opacity:.85">' + escapeHtml(r.note) + '</span>' : '');
          var old = root.querySelector('#sr-smart-deals'); if (old) old.remove();
          if (r.deals && r.deals.length && el) {
            if (!root.querySelector('#sr-smart-deals-css')) { var st = document.createElement('style'); st.id = 'sr-smart-deals-css'; st.textContent = DEAL_CSS; root.append(st); }
            var sec = document.createElement('section'); sec.id = 'sr-smart-deals'; sec.className = 'srsd';
            sec.innerHTML = '<span class="srsd-k">Hand-picked deals</span><h2>' + escapeHtml(r.heading) + ' – current deals</h2><div class="srsd-row">' + r.deals.map(dealCard).join('') + '</div>';
            el.insertAdjacentElement('afterend', sec);
          }
        } catch (e) {}
      }
      return r;
    });
  };
  function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
})();


/* Town guide renderer from the canonical record */
(function(){'use strict';
  var ALLOWED = { H2: 1, H3: 1, P: 1, STRONG: 1, B: 1, EM: 1, I: 1, UL: 1, OL: 1, LI: 1, BR: 1, A: 1 };

  function clean(html) {
    var doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
    var root = doc.body.firstChild;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) return;
        if (child.nodeType !== 1 || !ALLOWED[child.tagName]) {
          if (child.nodeType === 1 && !/^(SCRIPT|STYLE|IFRAME|OBJECT|IMG)$/.test(child.tagName)) {
            walk(child);
            while (child.firstChild) node.insertBefore(child.firstChild, child);
          }
          node.removeChild(child);
          return;
        }
        Array.prototype.slice.call(child.attributes).forEach(function (a) {
          var keep = child.tagName === 'A' && a.name === 'href' && /^\/(?!\/)/.test(a.value);
          if (!keep) child.removeAttribute(a.name);
        });
        if (child.tagName === 'A' && !child.getAttribute('href')) {
          while (child.firstChild) node.insertBefore(child.firstChild, child);
          node.removeChild(child);
          return;
        }
        walk(child);
      });
    })(root);
    return root.innerHTML;
  }
  function text(v) { return String(v == null ? '' : v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  function esc(v) { return text(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var CSS = '.sr-town-guide{margin:22px 0 26px;background:#fff;border:1px solid #d9e5ef;border-radius:16px;box-shadow:0 4px 18px #0b192c10;padding:clamp(18px,3vw,36px);font:500 16.5px/1.7 Inter,Arial,sans-serif;color:#243b55}' +
    '.sr-town-guide .kicker{display:inline-block;font:900 13px/1 "Roboto Condensed",Arial;letter-spacing:.16em;color:#1f63c6;margin-bottom:10px;text-transform:uppercase}' +
    '.sr-town-guide .intro{font:600 clamp(17px,1.4vw,20px)/1.6 Inter,Arial;color:#0b1f3a;margin:0 0 6px}' +
    '.sr-town-guide .body h2{margin:26px 0 8px;font:900 clamp(22px,2.1vw,30px)/1.1 "Roboto Condensed",Arial;color:#0b1f3a}' +
    '.sr-town-guide .body h3{margin:20px 0 6px;font:800 21px/1.15 "Roboto Condensed",Arial;color:#0b1f3a}' +
    '.sr-town-guide .body p{margin:0 0 14px}.sr-town-guide .body a{color:#1f63c6;text-decoration:underline}' +
    '.sr-town-guide .body ul{margin:0 0 14px;padding-left:22px}' +
    '.sr-town-guide .wrapbox{position:relative}.sr-town-guide.closed .wrapbox{max-height:520px;overflow:hidden}' +
    '.sr-town-guide.closed .wrapbox:after{content:"";position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(#fff0,#fff)}' +
    '.sr-town-guide .more{margin-top:14px;border:0;border-radius:999px;background:#1f63c6;color:#fff;padding:11px 22px;font:800 16px "Roboto Condensed",Arial;cursor:pointer}' +
    '.sr-town-guide .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:22px}' +
    '.sr-town-guide .fact{background:#f4f8fc;border:1px solid #dce7f2;border-radius:12px;padding:16px 18px}' +
    '.sr-town-guide .fact h3{margin:0 0 6px;font:900 19px "Roboto Condensed",Arial;color:#0b1f3a}.sr-town-guide .fact p{margin:0;font-size:15px;line-height:1.6}' +
    '@media(max-width:760px){.sr-town-guide{margin:16px 0;border-radius:12px}.sr-town-guide.closed .wrapbox{max-height:420px}}';

  function build(rec) {
    var overview = clean(rec.overview || '');
    var intro = text(rec.pageIntro || rec.raiderDestinationSummary || '');
    if (text(overview).split(' ').length < 60 && !intro) return null;
    var facts = '';
    if (text(rec.arcadeScene).length > 40) facts += '<div class="fact"><h3>The arcade scene</h3><p>' + esc(rec.arcadeScene) + '</p></div>';
    if (text(rec.visitorInfo).length > 40) facts += '<div class="fact"><h3>Getting around</h3><p>' + esc(rec.visitorInfo) + '</p></div>';
    var el = document.createElement('section');
    el.className = 'sr-town-guide closed';
    el.setAttribute('aria-label', 'About ' + text(rec.title));
    el.innerHTML = '<style>' + CSS + '</style>' +
      '<span class="kicker">' + esc(rec.heroKicker || ('Your guide to ' + text(rec.title))) + '</span>' +
      (intro ? '<p class="intro">' + esc(intro) + '</p>' : '') +
      '<div class="wrapbox"><div class="body">' + overview + '</div>' + (facts ? '<div class="facts">' + facts + '</div>' : '') + '</div>' +
      '<button class="more" type="button" aria-expanded="false">Read the full ' + esc(rec.title) + ' guide ↓</button>';
    var btn = el.querySelector('.more');
    btn.addEventListener('click', function () {
      var open = el.classList.toggle('closed') === false;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Show less ↑' : 'Read the full ' + text(rec.title) + ' guide ↓';
    });
    if (text(overview).split(' ').length < 160) { el.classList.remove('closed'); btn.remove(); }
    return el;
  }


window.SR_TOWN_GUIDE=build;
})();


/* Published category guide text */
/* Spin Raiders hub guides (6 Oct 2026): a written guide under the cards on each category hub page. */
(function(){'use strict';
var G={"/arcade": {"h2": "Your guide to UK amusement arcades", "html": "<h2>Bright lights, loud bells and a pocket full of 2ps</h2> <p>Step off any British promenade and you'll hear it before you see it: the clatter of coins, the jingle of a crane game and somebody's nan cheering as a pusher finally tips. Amusement arcades are one of the great joys of a UK day out, and they're far more varied than people think. Some are huge seaside halls with hundreds of machines, others are cosy town-centre rooms with a few cranes and a dance machine in the corner.</p> <h3>What you'll find inside</h3> <ul> <li><strong>Coin pushers</strong> – the classic 2p and 10p falls, often stacked with novelty prizes, keyrings and tokens.</li> <li><strong>Cranes and prize machines</strong> – grabbers, stackers and \"win every time\" machines with plush toys and gadgets.</li> <li><strong>Ticket games</strong> – skee-ball, wheel spinners and video redemption games that spit out tickets you swap at the prize counter.</li> <li><strong>Video games and simulators</strong> – racing cabinets, shooting games, air hockey and basketball hoops.</li> <li><strong>Retro corners</strong> – plenty of seaside arcades keep a few vintage cabinets or old-school pushers for the nostalgia crowd.</li> </ul> <h3>Picking the right arcade for your crowd</h3> <p>Got little ones? Look for a family arcade with a clear prize counter and plenty of low-stake pushers. Teenagers usually head straight for the driving games and dance machines. Big kids who grew up in the eighties might fancy a town with a dedicated retro room. Most arcades are indoors, which makes them a lifesaver when the British weather turns, and the bigger seaside halls are usually step-free with wide aisles, though older buildings can be a squeeze.</p> <p>Famous arcade towns include <strong>Blackpool</strong>, <strong>Great Yarmouth</strong>, <strong>Skegness</strong>, <strong>Cleethorpes</strong>, <strong>Scarborough</strong>, <strong>Southend</strong>, <strong>Margate</strong> and <strong>Weston-super-Mare</strong>, where the seafront is practically one long run of flashing lights.</p> <h3>Tips for getting the most from your coppers</h3> <ul> <li>Set a spending pot before you go in and split it into bags for the kids – it stops the \"just one more go\" spiral.</li> <li>Bring a pouch of 2p coins, although most places have change machines and many now take cards on token systems.</li> <li>Save tickets across visits: plenty of arcades let you keep a ticket card, so you can build up to the big prize.</li> <li>Go early on a sunny day or late afternoon on a rainy one – that's when everyone else piles in.</li> <li>Under-18s should stick to the family side; anything marked as an adult area is off limits.</li> </ul> <p>Ready to hit the seafront? Scroll back up to the cards above for arcades worth a visit, then hop over to the town pages to see what else is around once your coppers run out.</p>"}, "/agc": {"h2": "Your guide to adult gaming centres", "html": "<h2>So what exactly is an AGC?</h2> <p>Walk down most British high streets and you'll spot them: bright frontages, frosted windows and a sign saying something like \"Adult Gaming Centre – Over 18s Only\". An adult gaming centre, or AGC, is a licensed premises packed with gaming machines that are only for grown-ups. They're a very different beast from the family arcade down the road with its cranes and 2p pushers, and it helps to know what you're walking into.</p> <h3>AGC versus family arcade</h3> <p>A family entertainment centre is open to all ages and mostly runs lower-stake machines, prize games and video games. An AGC is strictly 18+ from the moment you step through the door, and it's licensed to run higher-category machines, including the modern reel games and digital slots you'd recognise from seaside towns. Some seaside venues have both under one roof, with a clearly separated adult area; kids stay on the family side and the adult section is walled or roped off with staff watching the entrance.</p> <h3>Where you'll find them</h3> <ul> <li><strong>High streets and retail parks</strong> – many towns have at least one, often near bus stations or shopping centres.</li> <li><strong>Seaside fronts</strong> – resorts such as Blackpool, Great Yarmouth, Skegness and Southend have AGCs mixed in among the family amusements.</li> <li><strong>Motorway and leisure sites</strong> – you'll sometimes see small gaming areas near services or bowling complexes.</li> </ul> <p>Big names you're likely to come across include <strong>MERKUR Slots</strong>, <strong>Admiral</strong> and <strong>Quicksilver</strong>, alongside plenty of independent family-run operators on the coast who've been in the trade for generations.</p> <h3>What to expect when you go in</h3> <ul> <li><strong>ID checks</strong> – anyone who looks young can expect to be asked. Bring a passport, photo driving licence or a PASS-card proof-of-age card, or you won't get past the door.</li> <li><strong>Staff on the floor</strong> – there's nearly always an attendant or two about, and many venues offer free tea, coffee and soft drinks to customers.</li> <li><strong>Quiet hours</strong> – weekday daytimes are usually calm, while seaside AGCs get busier on summer evenings.</li> <li><strong>Accessibility</strong> – high-street units are generally ground-floor and step-free, though they can be compact, so ask staff if you need a hand with seating.</li> <li><strong>No kids, no exceptions</strong> – even a baby in a pram isn't allowed in, so plan who's minding the little ones.</li> </ul> <p>Curious about the venues near you? The cards above point you towards adult gaming centres worth knowing about, and the town pages show what else each place has going on for the rest of your day.</p>"}, "/arcade-bars": {"h2": "Your guide to arcade bars and gaming lounges", "html": "<h2>Pints, pinball and a high-score grudge match</h2> <p>Somewhere in the last decade, the arcade grew up and got a drinks licence. Arcade bars mix cocktails and craft beer with rows of retro cabinets, pinball tables and console booths, and they've become one of the best nights out in British cities. Think birthday drinks with a Street Fighter showdown, or a first date that ends in a tense round of Mario Kart.</p> <h3>The big names and what they do best</h3> <ul> <li><strong>NQ64</strong> – started in Manchester's Northern Quarter and now in several cities, with neon-soaked rooms, classic cabinets, console booths and themed cocktails.</li> <li><strong>Four Quarters</strong> – a London favourite with retro cabinets, pinball and console stations, great for a casual pint and a game.</li> <li><strong>Arcade Club</strong> – the giant one, born in Bury, with floors of Japanese imports, rhythm games, pinball and retro machines on free play once you've paid entry. More of a full-day venue than a bar, and great for gaming fans.</li> <li><strong>F1 Arcade and similar \"competitive socialising\" venues</strong> – racing simulators, team games, food and drinks, built for groups and work dos.</li> </ul> <h3>Choosing your venue</h3> <p>Ask yourself what the night is for. A chilled catch-up suits a smaller bar where you can grab a booth. A big group celebration works better somewhere that takes bookings and does food. Serious gamers will want somewhere with a huge machine count and free-play wristbands. Most arcade bars go 18+ in the evening, though some welcome families during the day, so check the age policy before turning up with the kids. City-centre venues are often in basements or old warehouses, so if step-free access matters, ask ahead.</p> <h3>Tips for a winning night</h3> <ul> <li><strong>Book on Fridays and Saturdays</strong> – booths and simulator slots fill up fast.</li> <li><strong>Know how the games are paid for</strong> – some use tokens, some cards, some flat entry with free play.</li> <li><strong>Bring ID</strong> – door staff check, even at teatime.</li> <li><strong>Go early in the week</strong> if you want the good cabinets without a queue.</li> <li><strong>Use public transport</strong> – city parking is pricey, and you'll probably want a drink.</li> </ul> <p>Fancy putting your initials on a leaderboard? Have a look through the cards above for arcade bars to try, then pop into the town pages to find where to eat and stay nearby.</p>"}, "/retro-video-games": {"h2": "Your guide to retro arcades and video game venues", "html": "<h2>Insert coin: the golden age is back</h2> <p>Remember the glow of a Pac-Man cabinet in a chip shop, or queuing behind the big lads for a go on Street Fighter II at the seaside? Retro gaming venues bring all of that back, and the best ones look after their machines like museum pieces that you're actually allowed to play.</p> <h3>Different flavours of retro</h3> <ul> <li><strong>Free-play arcades</strong> – pay once at the door and play everything as often as you like. <strong>Arcade Club</strong> in Bury is the famous one, with sites elsewhere in the country too.</li> <li><strong>Gaming museums</strong> – the <strong>National Videogame Museum</strong> in Sheffield lets you play your way through gaming history, with consoles, cabinets and hands-on exhibits.</li> <li><strong>Seaside retro rooms</strong> – plenty of older seaside arcades keep a few classic cabinets tucked away among the modern machines, and spotting them is half the fun.</li> <li><strong>Arcade bars</strong> – city spots mixing drinks with classic cabinets, usually adults-only at night.</li> <li><strong>Pinball venues</strong> – dedicated pinball halls and clubs pop up across the country, often run by enthusiasts.</li> </ul> <h3>How to choose your fix</h3> <p>Bringing kids? Free-play arcades and museums are brilliant, because nobody's crying over a lost credit and they get to try games their parents talk about. After a lads' or girls' night out, an arcade bar makes more sense. Purists who want the real deal – original boards, proper CRT screens, joysticks with that satisfying clunk – should look for venues that shout about their restoration work. Most retro venues are indoors and work brilliantly on a wet day, but warehouse sites can have stairs, so check access if you need lifts.</p> <h3>Tips for a top score</h3> <ul> <li><strong>Arrive at opening</strong> – the popular cabinets and pinball tables get crowded by mid-afternoon at weekends.</li> <li><strong>Check age rules</strong> – some venues switch to adults-only in the evening.</li> <li><strong>Book big days</strong> – free-play venues can cap numbers on bank holidays and school breaks.</li> <li><strong>Bring a bit of patience</strong> – old machines occasionally go out of service, and that's part of the charm.</li> <li><strong>Take snacks money</strong> – you'll lose track of time, and three hours vanish quicker than you'd think.</li> </ul> <p>Ready to dust off your joystick skills? Check out the cards above for retro venues worth the trip, and head to the town pages to plan the rest of your day around them.</p>"}, "/classic-fruit-machines": {"h2": "Your guide to classic fruit machines", "html": "<h2>Nudges, holds and the sound of the eighties</h2> <p>Ask anyone who grew up in Britain in the seventies, eighties or nineties and they'll remember a fruit machine: winking lights in the corner of the local, the chunk of a reel stopping, and that cheeky \"nudge\" button that made you feel like a genius. This archive is all about celebrating those machines as a slice of pop culture and design history, from the cabinets themselves to the makers who built them.</p> <h3>The makers behind the magic</h3> <ul> <li><strong>Barcrest</strong> – the giant of the pub scene, famous for skill-feature machines and those unmistakable artwork panels.</li> <li><strong>JPM</strong> – the Welsh manufacturer behind loads of well-loved pub and club machines, with bold themes and big features.</li> <li><strong>Bell-Fruit</strong> – a name stamped on countless cabinets in pubs and seaside arcades for decades.</li> <li><strong>Maygay</strong> – known for inventive features and popular licensed themes.</li> <li><strong>Astra</strong> – a later arrival that brought plenty of colourful machines to the arcade floor.</li> </ul> <h3>What made them so memorable</h3> <p>Classic fruit machines weren't just spinning reels. <strong>Holds</strong> let you keep a reel in place for the next spin. <strong>Nudges</strong> let you shuffle a reel up a step. Then there were <strong>features</strong> – number trails, cash ladders, hi-lo games, reel bonuses and \"Mystery\" boxes – all lit up across a glass top-box with artwork that ranged from simple fruit to TV shows, board games and cartoon characters. The cabinets were a riot of chrome, chasing lights and electronic jingles, and every model had its own personality.</p> <p>You'd find the low-stake versions in seaside arcades and the bigger ones in pubs, working men's clubs and snooker halls. Many collectors now restore them at home, and you'll still spot a few vintage machines running in seaside arcades and retro rooms around the country.</p> <h3>Getting the most out of the archive</h3> <ul> <li><strong>Start with a maker</strong> – browsing by manufacturer is a great way to spot family resemblances between cabinets.</li> <li><strong>Look at the details</strong> – reel bands, feature boards and top-box artwork often changed between versions of the same machine, so colours and layouts can differ.</li> <li><strong>Bring your memories</strong> – if you remember a machine from your local, chances are someone else does too.</li> <li><strong>Treat it as nostalgia</strong> – this is a trip down memory lane and a celebration of design, not tips on how to play.</li> </ul> <p>Go on, have a rummage through the cards above to find the cabinets you remember, then visit the town pages to see which seaside spots still keep a bit of that golden-age spirit alive.</p>"}, "/attractions": {"h2": "Your guide to UK attractions", "html": "<h2>Too much to do and only one weekend</h2> <p>Britain is ridiculously well stocked with places to go. In a single county you might have a castle, a steam railway, a farm park, a science centre and a pier, all within half an hour's drive. That's brilliant, but it can also leave you stood in the kitchen on a Saturday morning with nobody able to decide. This guide is here to help you pick well.</p> <h3>The main types of attraction</h3> <ul> <li><strong>Thrills</strong> – theme parks, adventure parks, high ropes and zip wires.</li> <li><strong>Animals</strong> – zoos, safari parks, aquariums and petting farms.</li> <li><strong>History and heritage</strong> – castles, stately homes, abbeys and living museums like Beamish in County Durham.</li> <li><strong>Science and discovery</strong> – hands-on centres such as the Eden Project in Cornwall or Eureka! in Halifax.</li> <li><strong>Seaside fun</strong> – piers, arcades, crazy golf and promenades.</li> <li><strong>Steam and transport</strong> – heritage railways, transport museums and boat trips.</li> </ul> <h3>Choosing the right one</h3> <p>Start with who's coming. Toddlers are happiest somewhere compact with soft play, animals and a decent café. Teenagers want speed, screens or something they can show off about. Grandparents might prefer gardens, heritage and plenty of benches. Then check the weather: if rain's forecast, lean towards indoor options like museums, aquariums and arcades, and save the gardens and adventure parks for a dry day. Budget matters too – plenty of brilliant places, including many national museums, are free, so a big ticket isn't the only route to a great day.</p> <p>For accessibility, most larger attractions publish access information covering parking, toilets, lifts and quiet times. It's always worth reading before you set off, especially for historic sites where cobbles and stairs come with the territory.</p> <h3>Practical tips</h3> <ul> <li><strong>Book online</strong> – many attractions are cheaper or guarantee entry when booked ahead, especially in school holidays.</li> <li><strong>Look for annual passes and memberships</strong> – if you'll go more than once, they often pay for themselves.</li> <li><strong>Arrive at opening</strong> – car parks fill and queues build from late morning.</li> <li><strong>Pack a picnic</strong> – it saves money, though check whether there are picnic areas.</li> <li><strong>Pair attractions up</strong> – a morning at a castle and an afternoon on the beach makes a proper day of it.</li> </ul> <p>Spoilt for choice? Have a scroll through the cards above for attractions worth your time, then dip into the town pages to see what's nearby and plan the rest of your day.</p>"}, "/days-out": {"h2": "Your guide to planning UK days out", "html": "<h2>The secret to a cracking day out</h2> <p>A great day out rarely happens by accident. It's usually the result of a bit of planning the night before: knowing where you'll park, where you'll eat, what you'll do if it chucks it down and how you'll get everyone home before the meltdowns start. Get those bits sorted and the day itself takes care of the rest.</p> <h3>Pick a plan that fits the gang</h3> <p>Think about the mix of people first. A family with little ones needs short journeys, toilets on tap and something with a play area. A group of mates might want arcades, a pub lunch and a walk along a pier. A couple's day could be a historic town, a gallery and a nice meal. Then look at the season. Summer suits beaches, parks and open-air attractions; winter is brilliant for museums, aquariums, bowling and cosy seaside towns where you'll have the prom to yourself.</p> <p>Budget is easy to forget until you're at the till. Plenty of the best UK days cost next to nothing: a coastal walk, a free museum, a picnic in a country park. Mix one paid attraction with a couple of free ones and the day feels big without the bank balance taking a hit.</p> <h3>Build your day in three parts</h3> <ul> <li><strong>The main event</strong> – the thing everyone's excited about, booked ahead if needed.</li> <li><strong>The food stop</strong> – a café, chippy or pub you've already scoped out, so nobody gets hangry.</li> <li><strong>The back-up</strong> – an indoor option nearby in case the weather turns.</li> </ul> <h3>Handy tips before you set off</h3> <ul> <li><strong>Check the travel</strong> – roadworks, rail engineering and match days can add an hour to a journey.</li> <li><strong>Know your parking</strong> – seaside towns fill fast on sunny weekends, and many car parks now use apps.</li> <li><strong>Bring layers and a brolly</strong> – British weather can do all four seasons before lunch.</li> <li><strong>Charge your phone</strong> – tickets, maps and parking often live on it.</li> <li><strong>Look up access info</strong> – step-free routes, Changing Places toilets and quiet hours are often listed on venue websites.</li> <li><strong>Leave room for wandering</strong> – the best moments are often the ones you didn't plan.</li> </ul> <p>Some of the UK's most-loved day-out destinations, from Blackpool and York to the Lake District and the Cornish coast, are easy to build a full day around. Use the cards above to find your main event, then head to the town pages to fill in the food stops and back-up plans.</p>"}, "/family-fun": {"h2": "Your guide to family days out", "html": "<h2>Tired kids, happy parents: the dream</h2> <p>The best family days out end with everyone conked out in the back of the car, sticky with ice cream and still talking about the best bit. Getting there takes a little thought, because what thrills a seven-year-old can bore a teenager stiff, and a toddler's idea of a great day might just be feeding the ducks.</p> <h3>Matching the day to the ages</h3> <ul> <li><strong>Toddlers and pre-schoolers</strong> – farm parks, soft play, aquariums, gentle beaches and places with short walks and plenty of toilets.</li> <li><strong>Primary-age kids</strong> – theme parks with family rides, zoos, adventure playgrounds, hands-on science centres and seaside arcades with ticket prizes.</li> <li><strong>Tweens and teens</strong> – bigger rollercoasters, go-karting, bowling, climbing walls, trampoline parks and retro arcades.</li> <li><strong>Mixed ages</strong> – look for places with zones, like Legoland Windsor, Chessington or large farm parks, where everyone gets a turn.</li> </ul> <h3>Making it work on the day</h3> <p>Indoor or outdoor is the big question, and in Britain the answer is usually \"have a plan for both\". Pick a main destination, then note an indoor option nearby, such as a museum, bowling alley or aquarium, in case the heavens open. Budget-wise, family tickets and booking online in advance often bring the cost down, and many attractions offer free entry for under-threes and carers. If anyone in the family has additional needs, look for sensory maps, quiet rooms, accessible toilets and ride access schemes, which many larger venues provide.</p> <p>Timing makes a huge difference. Weekdays outside school holidays are calmer, and arriving at opening means shorter queues and fresher kids. Afternoons tend to be busiest, so plan the big-ticket thing for the morning and the slower stuff for later.</p> <h3>The family day-out survival kit</h3> <ul> <li>Snacks, water bottles and a few emergency sweets for the queue.</li> <li>Wet wipes, plasters and a spare set of clothes for the little ones.</li> <li>Sun cream and hats in summer; waterproofs all year round.</li> <li>A pound coin or two for lockers and a small pot of change for the arcade.</li> <li>A meeting point agreed in advance, just in case anyone wanders off.</li> </ul> <p>Ready for a day the kids will remember? Have a look through the cards above for family favourites, then check the town pages for nearby places to eat, play and stay.</p>"}, "/hidden-gems": {"h2": "Your guide to the UK's hidden gems", "html": "<h2>Off the beaten track and worth every mile</h2> <p>Everybody knows the big hitters. But some of the most memorable days out happen in places the coach tours skip: a fishing village down a steep lane, an independent museum run by volunteers, a sleepy seaside town with one brilliant chippy and an arcade that hasn't changed since 1985. That's what this section is all about – the UK's hidden gems, the spots locals love and visitors stumble on by luck.</p> <h3>What makes a place a proper find</h3> <ul> <li><strong>Character</strong> – somewhere with its own personality rather than a carbon copy of every other high street.</li> <li><strong>Breathing space</strong> – fewer crowds, easier parking and no queuing for a bench.</li> <li><strong>A story</strong> – an odd bit of history, a local legend or a quirky collection you won't see elsewhere.</li> <li><strong>Good value</strong> – smaller attractions are often cheaper, and many are free.</li> </ul> <p>Think of places like <strong>Staithes</strong> and <strong>Robin Hood's Bay</strong> on the Yorkshire coast, the cliff lift at <strong>Saltburn-by-the-Sea</strong>, the book town of <strong>Hay-on-Wye</strong>, the cobbled village of <strong>Clovelly</strong> in Devon or the quiet beaches around <strong>Seahouses</strong> in Northumberland. None of them are secret exactly, but they all reward the extra effort.</p> <h3>Who these trips suit</h3> <p>Smaller places are perfect for couples, photographers, walkers and anyone who's had their fill of busy tourist hotspots. Families can do brilliantly too, as long as you check facilities first: little places may have limited toilets, no café open out of season and fewer step-free routes. Old villages love a steep hill and a cobbled street, so anyone with mobility needs or a buggy should look at maps and access notes before setting off.</p> <h3>Tips for finding your own</h3> <ul> <li><strong>Check opening days</strong> – small attractions often open only at weekends or in the summer season.</li> <li><strong>Carry some cash</strong> – honesty boxes, village car parks and tiny cafés don't always take cards.</li> <li><strong>Park outside and walk in</strong> – many historic villages have a car park at the top and narrow lanes below.</li> <li><strong>Visit midweek</strong> – even quiet spots get busy on sunny bank holidays.</li> <li><strong>Talk to locals</strong> – the person behind the counter usually knows the next great place down the road.</li> <li><strong>Be a good guest</strong> – small communities rely on visitors who park considerately and take litter home.</li> </ul> <p>Fancy discovering somewhere new? Browse the cards above for lesser-known places worth the trip, then use the town pages to see what else is tucked away nearby.</p>"}, "/theme-parks": {"h2": "Your guide to UK theme parks", "html": "<h2>Screams, queues and the best day of the summer</h2> <p>There's nothing quite like the first clank of a rollercoaster chain lift on a sunny morning. The UK punches well above its weight for theme parks, from historic seaside parks with wooden coasters to huge resorts with record-breaking rides, and picking the right one makes all the difference between a brilliant day and a long one in a queue.</p> <h3>The big names</h3> <ul> <li><strong>Blackpool Pleasure Beach</strong> – a seaside icon with classic rides alongside big coasters like The Big One and Icon.</li> <li><strong>Alton Towers</strong> – Staffordshire's thrill giant, with coasters set in the grounds of a historic estate, plus hotels and a waterpark.</li> <li><strong>Thorpe Park</strong> – Surrey's adrenaline hotspot, popular with teenagers and thrill-seekers.</li> <li><strong>Flamingo Land</strong> – North Yorkshire's mix of rides and a zoo, handy for families who want both.</li> <li><strong>Fantasy Island</strong> – at Ingoldmells near Skegness, a seaside park with a pay-as-you-go feel and a big market next door.</li> <li><strong>Pleasurewood Hills</strong> – near Lowestoft, a family-sized park with rides, shows and a coastal holiday vibe.</li> <li><strong>Paultons Park</strong>, <strong>Legoland Windsor</strong>, <strong>Chessington</strong>, <strong>Drayton Manor</strong> and <strong>Gulliver's</strong> – great picks for younger children.</li> </ul> <h3>Choosing your park</h3> <p>Check the height restrictions before you promise anyone anything – nothing ruins a day like a child who's two centimetres short for the ride they've talked about all week. Families with little ones will get more from parks built around young kids, while teens and thrill-seekers should head for the big coasters. Parks are mostly outdoors, so rides can close in high winds or storms. Most big parks offer ride access passes for visitors with disabilities or additional needs, which usually need registering in advance.</p> <h3>Beat the queues</h3> <ul> <li><strong>Book online in advance</strong> – gate prices are usually the most expensive way in.</li> <li><strong>Arrive before opening</strong> and head to the most popular ride first, then work backwards.</li> <li><strong>Avoid weekends in the summer holidays</strong> if you can; term-time weekdays are far quieter.</li> <li><strong>Look at annual passes</strong> – the Merlin Annual Pass covers several parks and attractions if you'll go more than once.</li> <li><strong>Bring a refillable bottle and packed lunch</strong> – food inside parks adds up fast.</li> <li><strong>Use the park app</strong> where there is one to check live queue times.</li> <li><strong>Pack a waterproof</strong> for water rides, and a bag for wet socks.</li> </ul> <p>Ready to hit the rides? Have a look at the cards above for theme parks to try, then check the town pages for places to stay and eat nearby to turn it into a weekend.</p>"}, "/zoos": {"h2": "Your guide to UK zoos and wildlife parks", "html": "<h2>Lions, lemurs and a lot of happy faces</h2> <p>A zoo day is one of those rare outings that works for almost every age. Toddlers squeal at the penguins, teenagers secretly love the big cats, and grandparents enjoy a good wander with a coffee. Modern British zoos and wildlife parks are about much more than looking through a fence, too – many take part in conservation and breeding programmes for endangered species.</p> <h3>Zoo, safari park or wildlife park?</h3> <ul> <li><strong>Traditional zoos</strong> – walk-around sites with a wide range of species. <strong>Chester Zoo</strong>, <strong>London Zoo</strong>, <strong>Edinburgh Zoo</strong>, <strong>Colchester Zoo</strong>, <strong>Twycross Zoo</strong> and <strong>Paignton Zoo</strong> are well-loved examples.</li> <li><strong>Safari parks</strong> – you drive through big open enclosures in your own car, then explore walk-through areas on foot. Think <strong>Longleat</strong>, <strong>Knowsley Safari</strong> and <strong>West Midland Safari Park</strong>.</li> <li><strong>Wildlife parks</strong> – often larger, more spread-out sites with spacious enclosures, such as <strong>Yorkshire Wildlife Park</strong> near Doncaster and <strong>Whipsnade Zoo</strong> in Bedfordshire.</li> <li><strong>Smaller animal parks and farms</strong> – brilliant for little ones, with feeding, handling sessions and shorter walks.</li> </ul> <h3>How to pick the right one</h3> <p>Big zoos take a full day and plenty of walking, so they're best for families with older kids or anyone who loves animals enough to want to see everything. With toddlers, a smaller site with a playground and a café can be a better shout. Zoos are mainly outdoors, but most have indoor houses for reptiles, butterflies or nocturnal animals, so a drizzly day isn't a disaster. Paths at larger zoos are generally buggy- and wheelchair-friendly, though hilly sites can be hard work, and many offer mobility scooter or wheelchair hire.</p> <h3>Top tips for a wild day</h3> <ul> <li><strong>Book tickets online</strong> – it's often cheaper and some zoos require timed entry at busy times.</li> <li><strong>Check talk and feeding times</strong> as you arrive, and plan your route around the ones you don't want to miss.</li> <li><strong>Go early</strong> – animals are often more active in the cooler morning.</li> <li><strong>Wear comfy shoes</strong> – you'll easily walk several miles.</li> <li><strong>Protect your car</strong> at safari parks: monkeys love wing mirrors and aerials, and some parks offer a route that avoids them.</li> <li><strong>Bring binoculars</strong> for spotting animals in larger enclosures.</li> </ul> <p>Ready to go wild? Browse the cards above for zoos and wildlife parks to visit, then use the town pages to find somewhere to eat or stay nearby.</p>"}, "/sea-life": {"h2": "Your guide to UK aquariums and sea life centres", "html": "<h2>Sharks, rays and the calmest hour of your week</h2> <p>Walking through an underwater tunnel with a shark gliding over your head never gets old. Aquariums are one of the best rainy-day options in the country, and they're surprisingly soothing too: the blue light, the slow-moving fish and the quiet hum of the tanks can turn a hectic family outing into something oddly relaxing.</p> <h3>What you'll see</h3> <p>Most UK aquariums take you on a journey from local rockpools and British coastal waters to tropical reefs and open ocean. Expect sharks, rays, jellyfish, seahorses, octopus and shoals of colourful reef fish. Many sites also have penguins, otters or turtles, plus touch pools where kids can gently meet starfish and crabs, and regular talks and feeding sessions.</p> <p>Well-known examples include <strong>The Deep</strong> in Hull, the <strong>National Marine Aquarium</strong> in Plymouth, <strong>Blue Planet Aquarium</strong> at Ellesmere Port, the <strong>Bristol Aquarium</strong> and the <strong>SEA LIFE</strong> centres in places such as Blackpool, Brighton, Scarborough, Great Yarmouth and London. Brighton's is set in a beautiful Victorian building that's been showing off sea creatures since the 1870s.</p> <h3>Is it right for your day?</h3> <ul> <li><strong>Great for little ones</strong> – compact, buggy-friendly and full of wow moments at eye level.</li> <li><strong>Perfect in bad weather</strong> – almost everything is indoors.</li> <li><strong>Usually accessible</strong> – most modern aquariums are step-free with lifts, and many offer quieter sessions or sensory guides.</li> <li><strong>Pairs well with the seaside</strong> – most sit on or near the seafront, so you can add a pier, an arcade or a beach walk.</li> </ul> <p>Bear in mind that most visits take two to three hours, so it's a half-day rather than a full day for most families.</p> <h3>Tips for a smooth visit</h3> <ul> <li><strong>Book online</strong> – walk-up prices tend to be higher, and timed tickets help on busy days.</li> <li><strong>Look at combo tickets and annual passes</strong> – SEA LIFE centres are covered by the Merlin Annual Pass, which can be great value.</li> <li><strong>Go first thing or late afternoon</strong> – the middle of a wet school-holiday day is peak time.</li> <li><strong>Check the talk schedule</strong> on arrival so you catch the penguin or shark feeds.</li> <li><strong>Turn off your flash</strong> – it upsets the animals and ruins your photos against the glass anyway.</li> </ul> <p>Fancy a dive without getting wet? Check out the cards above for aquariums near you, then hop over to the town pages to plan a seaside day around your visit.</p>"}, "/museums": {"h2": "Your guide to UK museums and galleries", "html": "<h2>Dinosaurs, steam engines and a free day out</h2> <p>Here's one of the best-kept open secrets in Britain: a lot of the country's finest museums cost absolutely nothing to get into. The national museums in London, Edinburgh, Cardiff, Liverpool, Manchester and beyond are free for their main collections, which makes a museum trip one of the best-value days out going.</p> <h3>Museums worth crossing the country for</h3> <ul> <li><strong>Natural History Museum</strong> and <strong>Science Museum</strong> in London – dinosaurs, space rockets and enough hands-on exhibits to wear out any child.</li> <li><strong>British Museum</strong> and the <strong>V&amp;A</strong> – world history, art and design under one roof each.</li> <li><strong>National Railway Museum</strong> in York – huge locomotives, royal carriages and a genuine wow factor.</li> <li><strong>Science and Industry Museum</strong> in Manchester – the story of the city's industrial muscle.</li> <li><strong>Kelvingrove</strong> in Glasgow and <strong>National Museum Cardiff</strong> – grand buildings packed with art and natural history.</li> <li><strong>Beamish</strong> in County Durham – a living museum where you walk through recreated streets, ride old trams and buy sweets from a period shop.</li> <li><strong>Ironbridge Gorge Museums</strong> in Shropshire – a cluster of sites telling the story of the Industrial Revolution.</li> </ul> <h3>Picking the right one</h3> <p>Big national museums can be overwhelming, so pick a few galleries rather than trying to see everything. With kids, look for museums with dedicated family trails, dressing-up areas or interactive zones. Living museums and outdoor heritage sites need decent shoes and a forecast check, while traditional museums are a rock-solid rainy-day choice. Most larger museums have lifts, accessible toilets and seating, and many offer quiet mornings for visitors who find crowds tough.</p> <p>Don't overlook the little ones either: local town museums, transport collections and quirky single-subject museums can be absolute treasures, often run by passionate volunteers.</p> <h3>Tips for a top visit</h3> <ul> <li><strong>Book a free timed slot</strong> where required – some big museums ask for this at busy times.</li> <li><strong>Go on a weekday afternoon</strong> to dodge school trips in term time.</li> <li><strong>Check for paid exhibitions</strong> – temporary shows often carry a charge even when the museum is free.</li> <li><strong>Bring a small bag</strong> – some places have bag checks or limited cloakrooms.</li> <li><strong>Leave a donation</strong> if you enjoyed it; it helps keep free museums free.</li> </ul> <p>Ready for a day of discovery? Browse the cards above for museums and galleries to visit, then check the town pages for cafés, parks and other things to do nearby.</p>"}, "/historical-sites": {"h2": "Your guide to UK castles and heritage", "html": "<h2>A thousand years of history, one day at a time</h2> <p>Few countries cram as much history into so little space. Within an hour of almost anywhere in Britain you'll find a castle, an abbey ruin, a stately home or a Roman fort, and plenty of them come with dramatic views, cracking tearooms and grounds that are perfect for letting the kids run wild.</p> <h3>Types of historic day out</h3> <ul> <li><strong>Castles</strong> – from crumbling ruins to complete fortresses. <strong>Warwick Castle</strong>, the <strong>Tower of London</strong>, <strong>Edinburgh Castle</strong>, <strong>Alnwick Castle</strong>, <strong>Bamburgh Castle</strong>, and Wales's mighty <strong>Conwy</strong> and <strong>Caernarfon</strong> are all crowd favourites.</li> <li><strong>Stately homes</strong> – grand houses with gardens and parkland, such as <strong>Chatsworth</strong>, <strong>Blenheim Palace</strong> and <strong>Hampton Court Palace</strong>.</li> <li><strong>Ancient sites</strong> – <strong>Stonehenge</strong>, <strong>Hadrian's Wall</strong> and countless stone circles and hill forts.</li> <li><strong>Abbeys and churches</strong> – atmospheric ruins like <strong>Whitby Abbey</strong> and <strong>Fountains Abbey</strong>.</li> <li><strong>Industrial heritage</strong> – mills, mines, canals and dockyards that tell the story of how modern Britain was built.</li> </ul> <h3>Choosing the right site</h3> <p>Kids love anything with battlements to climb, dressing-up, falconry displays or a good gory story, so look out for family events in the school holidays. History buffs might prefer quieter ruins with good guidebooks. Most heritage sites are a mix of indoor and outdoor, and ruins are pretty exposed, so check the forecast. Access can be tricky: spiral staircases, uneven ground and steep approaches come with the territory, though many sites offer accessible routes, virtual tours of upper floors or mobility buggies around the grounds.</p> <h3>Insider tips</h3> <ul> <li><strong>Consider a membership</strong> – <strong>English Heritage</strong>, the <strong>National Trust</strong>, <strong>Cadw</strong> in Wales and <strong>Historic Environment Scotland</strong> all offer memberships that include free entry and parking at their sites, which pays off quickly if you visit a few times a year.</li> <li><strong>Book ahead</strong> for the big names, which often use timed tickets.</li> <li><strong>Check event days</strong> – jousting, re-enactments and open-air theatre are brilliant but busy.</li> <li><strong>Wear sturdy shoes</strong> – stone steps and grassy slopes get slippy.</li> <li><strong>Leave time for the grounds</strong> – gardens, woods and walled kitchen gardens are often as good as the house.</li> </ul> <p>Ready to storm the battlements? Have a look at the cards above for historic places worth a visit, then use the town pages to find somewhere to eat, stay and explore nearby.</p>"}, "/piers": {"h2": "Your guide to UK seaside piers", "html": "<h2>Walking on water, Victorian style</h2> <p>A stroll down a pier is about as British as it gets: salty air, gulls eyeing up your chips, the boards creaking underfoot and the sea sloshing about beneath you. Most of the UK's piers were built in the Victorian era, when railway day-trippers flocked to the coast, and the survivors are some of the most charming structures in the country.</p> <h3>Pleasure piers and promenade piers</h3> <p>Broadly, there are two flavours. <strong>Pleasure piers</strong> are packed with fun: arcades, rides, fairground stalls, cafés and sometimes a theatre. <strong>Promenade piers</strong> are quieter, with benches, fishing spots and uninterrupted sea views. Both make a cracking addition to a seaside day.</p> <h3>Famous piers to put on your list</h3> <ul> <li><strong>Southend Pier</strong> – the longest pleasure pier in the world, stretching well over a mile into the Thames Estuary, with its own railway.</li> <li><strong>Brighton Palace Pier</strong> – rides, arcades and doughnuts in one of the UK's most famous seaside settings.</li> <li><strong>Blackpool's three piers</strong> – North, Central and South, each with its own personality.</li> <li><strong>Llandudno Pier</strong> – an elegant Victorian pier against a backdrop of the Great Orme.</li> <li><strong>Saltburn Pier</strong> – the last surviving pier on the Yorkshire coast, with the cliff lift right next to it.</li> <li><strong>Clevedon Pier</strong> – slender, graceful and much loved by photographers.</li> <li><strong>Cleethorpes Pier</strong> and <strong>Southport Pier</strong> – northern favourites with long seaside histories.</li> </ul> <h3>Making the most of your visit</h3> <ul> <li><strong>Check the tide</strong> – piers look completely different at high and low water, and both are worth seeing.</li> <li><strong>Wrap up</strong> – it's always a few degrees colder and windier at the end of a pier.</li> <li><strong>Look after small children</strong> – gaps between boards and railings are safe, but buggies and scooters need a steady hand.</li> <li><strong>Check access</strong> – most piers are flat and step-free, though some longer ones have a train or land train for the return trip.</li> <li><strong>Watch your chips</strong> – the gulls are bold and organised.</li> <li><strong>Visit at sunset</strong> – the lights coming on along a pleasure pier is pure seaside magic.</li> </ul> <p>Some piers charge a small entry fee and others are free, and opening hours vary through the year, so it's worth checking before you travel.</p> <p>Fancy a walk over the waves? Browse the cards above for piers worth a visit, then head to the town pages to plan the rest of your seaside day.</p>"}, "/beaches": {"h2": "Your guide to UK beaches", "html": "<h2>Sand between your toes (and in your sandwiches)</h2> <p>The UK has thousands of miles of coastline, and it's lined with every kind of beach you can imagine: golden bucket-and-spade sands, wild surf beaches, pebbly coves, dune-backed bays and rockpool paradises. Pick the right one and a beach day is about as good as it gets, warm weather or not.</p> <h3>Find your kind of beach</h3> <ul> <li><strong>Classic resort beaches</strong> – lifeguards, toilets, ice cream and donkey rides within easy reach. <strong>Blackpool</strong>, <strong>Bournemouth</strong>, <strong>Weymouth</strong>, <strong>Scarborough</strong>, <strong>Skegness</strong> and <strong>Cleethorpes</strong> are good examples.</li> <li><strong>Surf beaches</strong> – big waves and surf schools, like <strong>Woolacombe</strong> and <strong>Newquay's Fistral</strong> in the South West.</li> <li><strong>Wild and scenic</strong> – jaw-dropping spots such as <strong>Rhossili Bay</strong> in Gower, <strong>Bamburgh</strong> with its castle backdrop, <strong>Holkham</strong> in Norfolk and <strong>Luskentyre</strong> on the Isle of Harris.</li> <li><strong>Dune beaches</strong> – <strong>Camber Sands</strong> and <strong>West Wittering</strong> are well-loved, but get very busy on hot days.</li> <li><strong>Rockpool beaches</strong> – rocky shores at low tide are brilliant for crab hunting.</li> </ul> <h3>Choosing and planning</h3> <p>With young kids, go for a sandy beach with lifeguards, toilets and a café nearby. Dog owners should check seasonal restrictions, as many popular beaches ban dogs from certain stretches in summer. For accessibility, some resorts offer beach wheelchairs or matting across the sand, so it's worth looking up the local council's beach information. Timing matters too: tides can swallow a huge beach in a couple of hours, so check tide times before you set up camp.</p> <h3>Beach-day tips</h3> <ul> <li><strong>Swim between the red and yellow flags</strong> where lifeguards are on duty, and keep inflatables out of the water when the wind blows offshore.</li> <li><strong>Arrive early</strong> on a sunny weekend – car parks at popular beaches fill by mid-morning.</li> <li><strong>Pack a windbreak</strong> – the British beach essential.</li> <li><strong>Bring sun cream</strong> even when it's cloudy; sea breezes hide how strong the sun is.</li> <li><strong>Take your rubbish home</strong> and leave the beach as you found it.</li> <li><strong>Look for Blue Flag or Seaside Award beaches</strong> for good water quality and facilities.</li> </ul> <p>Ready to dig in? Have a look through the cards above for beaches worth the drive, then use the town pages to find chippies, arcades and places to stay nearby.</p>"}, "/seaside": {"h2": "Your guide to UK seaside towns", "html": "<h2>Kiss-me-quick hats and a stick of rock</h2> <p>A British seaside day has a recipe that never really changes: a walk along the prom, fish and chips on a bench, a paddle that's colder than you expected, a few coppers in the arcade and an ice cream before home. The magic is in how each town puts its own spin on it.</p> <h3>Different towns, different vibes</h3> <ul> <li><strong>Big, bold resorts</strong> – <strong>Blackpool</strong>, <strong>Great Yarmouth</strong>, <strong>Skegness</strong>, <strong>Southend</strong> and <strong>Brighton</strong> bring piers, rides, arcades and nightlife.</li> <li><strong>Classic family resorts</strong> – <strong>Cleethorpes</strong>, <strong>Scarborough</strong>, <strong>Llandudno</strong>, <strong>Weston-super-Mare</strong> and <strong>Bridlington</strong> balance traditional fun with plenty of sand.</li> <li><strong>Picture-postcard towns</strong> – <strong>Whitby</strong>, <strong>St Ives</strong>, <strong>Tenby</strong> and <strong>Southwold</strong> are full of colourful houses, harbours and independent shops.</li> <li><strong>Foodie favourites</strong> – <strong>Whitstable</strong> for oysters, <strong>Padstow</strong> for seafood and almost anywhere on the Yorkshire coast for a proper chippy.</li> </ul> <h3>Choosing your seaside day</h3> <p>Families with young kids will want a sandy beach, an easy prom and things to do if it rains, so the bigger resorts are hard to beat. Couples and day-trippers after a slower pace may prefer a harbour town with cafés and coastal walks. Out of season, seaside towns have a lovely wistful charm and you'll get the best tables and empty beaches, though some attractions shut over winter. Most promenades are flat and great for wheelchairs and buggies, but old harbour towns can be very steep.</p> <h3>Seaside survival tips</h3> <ul> <li><strong>Park early or use the train</strong> – plenty of resorts have stations close to the front, and seafront parking goes quickly on sunny days.</li> <li><strong>Guard your chips</strong> – seagulls are not to be trusted.</li> <li><strong>Check tide times</strong> before heading onto the sands or rockpools.</li> <li><strong>Bring change for the arcades</strong> and set a budget for the kids before they spot the cranes.</li> <li><strong>Pack layers</strong> – sea breezes can make a warm day feel chilly.</li> <li><strong>Stay for the evening</strong> – seafront lights and a sunset walk are often the highlight.</li> </ul> <p>Fancy a trip to the coast? The cards above point you to seaside favourites, and the town pages are packed with ideas for arcades, food and places to stay along the way.</p>"}, "/outdoors": {"h2": "Your guide to nature and the great outdoors", "html": "<h2>Muddy boots and big skies</h2> <p>Sometimes the best day out costs nothing but a bit of petrol and a flask of tea. Britain's countryside is ridiculously varied for such a small place, with mountains, moors, ancient forests, wetlands, lakes and coastal paths all within reach. Getting outside is good for the soul, great for tiring out kids and dogs, and a brilliant antidote to a week of screens.</p> <h3>Where to go</h3> <ul> <li><strong>National parks</strong> – the <strong>Lake District</strong>, <strong>Peak District</strong>, <strong>Yorkshire Dales</strong>, <strong>North York Moors</strong>, <strong>Eryri (Snowdonia)</strong>, <strong>Dartmoor</strong>, the <strong>New Forest</strong>, <strong>Northumberland</strong> and the <strong>Cairngorms</strong> are just a start.</li> <li><strong>Country parks</strong> – usually free or cheap to visit, with marked trails, play areas and cafés, perfect for an easy afternoon.</li> <li><strong>Forests</strong> – woodland trails, cycle routes and treetop adventure courses such as Go Ape.</li> <li><strong>Nature reserves</strong> – RSPB and Wildlife Trust reserves offer hides, birdwatching and seasonal wildlife spectacles.</li> <li><strong>Coastal paths</strong> – the South West Coast Path and the Wales Coast Path have endless short sections to choose from.</li> </ul> <h3>Picking your adventure</h3> <p>Match the walk to the weakest walker, not the keenest. Little legs and buggies are happiest on flat, surfaced trails around reservoirs, lakes and country parks. Fitter groups might go for hill walks or a summit, but proper mountain days need maps, kit and an eye on the weather. Many parks now have <strong>Miles without Stiles</strong> routes or similar accessible trails suitable for wheelchairs and pushchairs, and some even hire out all-terrain mobility scooters.</p> <h3>Outdoor essentials</h3> <ul> <li><strong>Check the forecast</strong> – and remember hills are colder, wetter and windier than the valleys.</li> <li><strong>Wear proper footwear</strong> – trainers are fine for surfaced paths, boots for anything muddier.</li> <li><strong>Pack water, snacks and a waterproof</strong>, even if it looks sunny.</li> <li><strong>Download maps offline</strong> – phone signal disappears in valleys and moorland.</li> <li><strong>Follow the Countryside Code</strong> – close gates, keep dogs under control near livestock and take litter home.</li> <li><strong>Arrive early at honeypot spots</strong> – car parks at places like Malham, Buttermere or Pen y Fan fill on fine weekends.</li> </ul> <p>Ready to get some fresh air? Browse the cards above for outdoor spots worth exploring, then use the town pages to find a pub, café or place to stay for after the walk.</p>"}, "/tours": {"h2": "Your guide to tours and experiences", "html": "<h2>Let someone else do the driving (and the talking)</h2> <p>A good tour turns a place you think you know into somewhere completely new. A guide pointing out the ghost story behind a pub sign, a skipper spotting seals on a sandbank, a brewer explaining why your favourite pint tastes the way it does – these are the details that stick in your memory long after the photos are forgotten.</p> <h3>Kinds of tours to try</h3> <ul> <li><strong>Open-top bus tours</strong> – hop on, hop off and see a city's highlights without sore feet. Great for a first visit to London, York, Edinburgh or Liverpool.</li> <li><strong>Walking tours</strong> – history walks, ghost walks and street-art trails, often led by brilliant local characters.</li> <li><strong>Boat trips</strong> – seal-watching off the Norfolk coast, puffin trips to the Farne Islands, river cruises on the Thames or lake steamers in the Lake District.</li> <li><strong>Behind-the-scenes tours</strong> – football stadiums, theatres, film studios such as the <strong>Warner Bros. Studio Tour London</strong>, and working factories.</li> <li><strong>Food and drink</strong> – brewery, distillery, cheese and chocolate tours, often with tastings.</li> <li><strong>Underground and industrial</strong> – old mines, caves and tunnels, like the caverns of the Peak District.</li> <li><strong>Heritage railways</strong> – steam trains through glorious scenery, a full experience in their own right.</li> </ul> <h3>Choosing the right experience</h3> <p>Think about attention spans. Kids usually love boats, trains and anything spooky, but can struggle with a two-hour history talk. Couples and groups of mates often go for tastings or quirky walks. Check age limits too: distillery tastings are 18+, and some mine and cave tours have minimum ages. For accessibility, boat trips and underground tours can involve steps, ladders or uneven ground, so read the details or ring ahead. Bus tours and many studio tours are fully accessible.</p> <h3>Tips for a smoother tour</h3> <ul> <li><strong>Book in advance</strong> – popular tours sell out, especially at weekends and in the holidays.</li> <li><strong>Check the weather policy</strong> – boat trips are often cancelled at short notice if the sea is rough.</li> <li><strong>Arrive early</strong> – most tours leave on time, with or without you.</li> <li><strong>Dress for the conditions</strong> – caves stay chilly all year, and boats are always breezier than you think.</li> <li><strong>Bring a little cash</strong> to tip a guide who's made your day.</li> </ul> <p>Fancy a day with a difference? Take a look at the cards above for tours and experiences worth booking, and dip into the town pages for food, stays and things to do nearby.</p>"}, "/bowling": {"h2": "Your guide to bowling alleys", "html": "<h2>Strikes, gutter balls and a bit of friendly rivalry</h2> <p>Bowling is one of those rare activities where a five-year-old can genuinely beat their dad. It's cheap-ish, it's indoors, it works in any weather and it's guaranteed to spark at least one family argument about who stepped over the line. No wonder it's a go-to for birthdays, rainy afternoons and work socials.</p> <h3>What to expect at a modern alley</h3> <p>Today's bowling centres are much more than lanes and a vending machine. Most have a bar, a diner or pizza counter, an arcade with cranes and ticket games, and sometimes pool tables, air hockey or even mini golf. Big chains such as <strong>Hollywood Bowl</strong> and <strong>Tenpin</strong> have sites across the country, often in retail and leisure parks with free parking, while independent alleys and seaside bowling centres add plenty of local character.</p> <h3>Choosing your lanes</h3> <ul> <li><strong>With little kids</strong> – ask for bumpers to stop gutter balls, and look for ball ramps and lightweight balls.</li> <li><strong>With teens</strong> – evening glow bowling with music and lights is usually a big hit.</li> <li><strong>For parties</strong> – most centres do party packages with food and a set number of games.</li> <li><strong>For a night out</strong> – some venues go adults-only later on and focus on cocktails and competitive socialising.</li> <li><strong>For accessibility</strong> – lanes are generally on one level, and ball ramps help anyone who can't lift or swing a ball. Ask about wheelchair access to the lanes and toilets.</li> </ul> <h3>Tips to bowl like a pro (or at least have fun)</h3> <ul> <li><strong>Book a lane</strong> – weekends, school holidays and rainy days get busy fast.</li> <li><strong>Look for off-peak deals</strong> – weekday daytimes are often much cheaper.</li> <li><strong>Wear socks</strong> – you'll need them with the bowling shoes, and some places charge for a pair if you forget.</li> <li><strong>Pick the right ball</strong> – your fingers should fit snugly without gripping, and the weight should feel comfortable.</li> <li><strong>Aim for the arrows</strong>, not the pins – it's the oldest trick in the book.</li> <li><strong>Budget for the arcade</strong> – kids will spot the prize machines before the lanes.</li> </ul> <p>Ready to knock 'em down? Have a look through the cards above for bowling alleys near you, then head to the town pages to find arcades, food and more fun nearby.</p>"}, "/cinemas": {"h2": "Your guide to cinemas", "html": "<h2>Lights down, phones off, popcorn ready</h2> <p>There's still nothing like seeing a film on a massive screen with the sound shaking your seat. A trip to the pictures is the easiest win on a wet afternoon, a classic date night and a lifesaver in the school holidays, and British cinemas come in every shape from shiny multiplexes to faded art deco picture palaces.</p> <h3>Picking your kind of cinema</h3> <ul> <li><strong>Multiplexes</strong> – <strong>Odeon</strong>, <strong>Vue</strong>, <strong>Cineworld</strong> and <strong>Showcase</strong> have big screens, lots of showtimes and usually free parking at retail parks.</li> <li><strong>Premium screens</strong> – IMAX, 4DX, Dolby and recliner screens cost more but turn a blockbuster into an event.</li> <li><strong>Boutique cinemas</strong> – chains like <strong>Everyman</strong> and <strong>Curzon</strong> offer sofas, food to your seat and a more grown-up vibe.</li> <li><strong>Independents and historic cinemas</strong> – many towns still have a characterful single-screen or community cinema, often in a beautiful old building, showing a mix of new releases, classics and live screenings.</li> <li><strong>Outdoor and pop-up screenings</strong> – summer showings in parks, castles and rooftops make a proper night of it.</li> </ul> <h3>Choosing for your crowd</h3> <p>Families should look out for cheap weekend morning screenings of kids' films, which are a fraction of the evening price. Many cinemas run <strong>relaxed or autism-friendly screenings</strong> with lights up and sound down, plus parent-and-baby showings where nobody minds a crying toddler. For accessibility, most modern cinemas have step-free screens, wheelchair spaces, subtitled showings and audio description. The <strong>CEA Card</strong> lets an eligible disabled visitor bring a carer free at participating cinemas.</p> <h3>Tips for a better trip</h3> <ul> <li><strong>Book online</strong> to pick your seats, especially for big releases on opening weekend.</li> <li><strong>Go midweek</strong> – some chains have cheaper days, and screens are quieter.</li> <li><strong>Check the certificate</strong> – staff will ask for ID at 15 and 18 films.</li> <li><strong>Look at memberships</strong> – unlimited cards and loyalty schemes pay off if you go regularly.</li> <li><strong>Arrive in the trailers</strong> – adverts and previews usually run for around twenty minutes.</li> <li><strong>Bring a jumper</strong> – screens can be chilly with the air con on.</li> </ul> <p>Fancy a night at the pictures? Scroll up to the cards above for cinemas worth a visit, and pop into the town pages to find somewhere to eat before or after the film.</p>"}, "/bingo-halls": {"h2": "Your guide to bingo clubs and prize bingo", "html": "<h2>Eyes down for a full house</h2> <p>Two little ducks, legs eleven and clickety-click: bingo calls are woven into British culture, and a night at the bingo is a proper social occasion. From big town-centre clubs with comedy and cabaret to the seaside prize bingo stalls where families play for a cuddly toy, there's a version of bingo for most ages.</p> <h3>Two very different kinds of bingo</h3> <ul> <li><strong>Bingo clubs</strong> – cash bingo in dedicated halls, run by names such as <strong>Mecca Bingo</strong> and <strong>Buzz Bingo</strong> alongside independent clubs. These are strictly 18+, with ID checks at the door. Expect a café or bar, electronic or paper tickets and a busy, chatty atmosphere, especially on themed nights.</li> <li><strong>Seaside prize bingo</strong> – the traditional family game found in arcades along the coast in towns such as Blackpool, Skegness, Great Yarmouth and Cleethorpes. You play for tokens or points that are swapped for prizes, from sweets to toys and household bits, and children can usually join in with an adult.</li> </ul> <h3>Is it for you?</h3> <p>Bingo clubs suit groups of friends, hen dos, birthdays and anyone who loves a natter and a bit of entertainment. Many clubs put on themed events, with music, drag hosts or quiz-style games that turn it into a full night out. Prize bingo is gentler, ideal for a rainy hour at the seaside, and a lovely one for grandparents to share with the grandkids. Most halls are on one level with plenty of seating, and many offer large-print tickets or electronic units with adjustable displays.</p> <h3>Tips for first-timers</h3> <ul> <li><strong>Bring photo ID</strong> to a bingo club – some ask you to register as a member on your first visit.</li> <li><strong>Arrive early</strong> to learn the game format and grab a good table.</li> <li><strong>Ask the staff</strong> – they're used to newcomers and happy to explain lines, full houses and the different games.</li> <li><strong>Know the calls</strong> – learning a few classics like \"two fat ladies\" for 88 adds to the fun.</li> <li><strong>Keep the kids on the family side</strong> – prize bingo only, never cash bingo halls.</li> <li><strong>Treat it as a social night</strong> – the laughs and the company are the real attraction.</li> </ul> <p>Fancy a game? Have a look at the cards above for bingo venues and seaside prize bingo, then visit the town pages to make a full day or night of it.</p>"}, "/fishing-lakes": {"h2": "Your guide to fishing lakes and fisheries", "html": "<h2>Tight lines and a flask of tea</h2> <p>Few days out are as peaceful as a morning on the bank, watching a float bob while the mist lifts off the water. Commercial fishing lakes and fisheries have made angling easier than ever, with well-stocked waters, comfy swims, car parks close by and often a café serving bacon butties. It's a brilliant way to switch off, and a cracking hobby to share with kids.</p> <h3>Types of fishery</h3> <ul> <li><strong>Pleasure lakes</strong> – packed with silverfish, small carp and bream, ideal for beginners and youngsters who want plenty of bites.</li> <li><strong>Match lakes</strong> – designed for competitions, with evenly spaced pegs and good stocks; most are open for day tickets when no match is on.</li> <li><strong>Specimen and carp lakes</strong> – for anglers chasing big fish, often with longer sessions and overnight stays.</li> <li><strong>Trout fisheries</strong> – fly fishing for rainbow and brown trout, sometimes with tuition for beginners.</li> <li><strong>Holiday fisheries</strong> – lakes with lodges or caravans on site, so you can fish from first light.</li> </ul> <h3>Choosing your venue</h3> <p>Beginners and families should look for a fishery with a dedicated beginners' or kids' pool, tackle hire and staff happy to give advice. Many venues have accessible platforms for wheelchair users and level paths to the swims; it's worth ringing to ask which pegs are best. Fishing is an outdoor sport, so think about shelter: an umbrella or brolly shelter makes a huge difference when the weather turns.</p> <h3>Before you cast</h3> <ul> <li><strong>Get a rod licence</strong> – in England and Wales you need an Environment Agency rod licence to fish for freshwater fish once you're 13 or over. It's quick to buy online.</li> <li><strong>Read the fishery rules</strong> – many insist on barbless hooks, landing mats, specific baits or no keepnets.</li> <li><strong>Buy a day ticket</strong> on arrival or book ahead at popular venues, especially in summer.</li> <li><strong>Arrive early</strong> – the first and last hours of daylight are often the most productive.</li> <li><strong>Pack the essentials</strong> – waterproofs, a chair, sun cream, hand wipes, food and plenty of drinks.</li> <li><strong>Handle fish with care</strong> – wet hands, unhooking mat and a quick return.</li> </ul> <p>Ready to wet a line? Browse the cards above for fishing lakes and fisheries worth a visit, then check the town pages for places to stay and eat nearby.</p>"}, "/holiday-parks": {"h2": "Your guide to holiday parks and caravan sites", "html": "<h2>Static caravans, swimming pools and the clubhouse disco</h2> <p>For loads of British families, holidays mean a caravan park: the excitement of collecting the keys, the kids racing off to find the pool, evening entertainment in the clubhouse and a walk down to the beach in the morning. Holiday parks remain one of the easiest, best-value ways to get away, and they've come a long way since the days of draughty tourers and a single shower block.</p> <h3>Types of park</h3> <ul> <li><strong>Big resort parks</strong> – run by names such as <strong>Haven</strong> and <strong>Parkdean Resorts</strong>, with pools, kids' clubs, shows and restaurants on site.</li> <li><strong>Holiday camps</strong> – <strong>Butlin's</strong> at Skegness, Minehead and Bognor Regis is the classic, with big entertainment venues, fairground rides and day visitor options.</li> <li><strong>Forest villages</strong> – <strong>Center Parcs</strong> offers lodges in the woods with a huge indoor pool dome and outdoor activities.</li> <li><strong>Touring and camping sites</strong> – pitches for tents, tourers and motorhomes, from basic farm fields to well-equipped sites run by the likes of the <strong>Caravan and Motorhome Club</strong>.</li> <li><strong>Quiet, smaller parks</strong> – adults-only or peaceful family-run sites without the entertainment, great for walkers and couples.</li> </ul> <h3>Choosing your park</h3> <p>Think about what you'll actually use. If the kids live in the pool and love a disco, a big entertainment park is worth it. If you plan to be out exploring every day, a simpler site near the coast or countryside might be better value. Look at caravan grades (bronze, silver, gold and similar) as they reflect age and comfort. Many parks offer accessible caravans or lodges with ramps and wet rooms, but these are limited and book up early.</p> <h3>Tips for a better break</h3> <ul> <li><strong>Book early or late</strong> – early-bird offers and last-minute deals can be very different from peak prices.</li> <li><strong>Go out of school holidays</strong> if you can; it's quieter and far cheaper.</li> <li><strong>Check what's included</strong> – entertainment passes, Wi-Fi, bedding and towels aren't always part of the price.</li> <li><strong>Know the arrival times</strong> – check-in is often mid-afternoon, so plan a stop on the way.</li> <li><strong>Pack for every weather</strong> and bring a few board games for the evenings.</li> <li><strong>Look at nearby attractions</strong> – parks near seaside towns let you mix pool days with arcade nights.</li> </ul> <p>Ready to book that break? The cards above point you to holiday parks worth a look, and the town pages show what's on your doorstep once you've unpacked.</p>"}, "/places-to-stay": {"h2": "Your guide to places to stay", "html": "<h2>Where to rest your head after a big day out</h2> <p>Turning a day out into an overnight stay changes everything. No rushing back up the motorway, no worrying about the last train, and you get the bonus of an evening stroll along the seafront or a lazy breakfast before round two. The trick is picking the right kind of stay for your trip and your budget.</p> <h3>Your main options</h3> <ul> <li><strong>Budget hotels</strong> – chains like <strong>Premier Inn</strong> and <strong>Travelodge</strong> are reliable, often handy for motorways and town centres, and family rooms can be good value.</li> <li><strong>Boutique and independent hotels</strong> – more character, better breakfasts and often great restaurants, ideal for couples and special occasions.</li> <li><strong>Guest houses and B&amp;Bs</strong> – the seaside classic, with a cooked breakfast and owners who know every corner of the town.</li> <li><strong>Pub rooms and inns</strong> – a bed upstairs, dinner and a pint downstairs, perfect for walkers and countryside trips.</li> <li><strong>Holiday lets and cottages</strong> – a whole house or flat for families and groups who want space and a kitchen.</li> <li><strong>Glamping and lodges</strong> – shepherd's huts, pods and cabins for a cosy outdoor experience without a tent.</li> </ul> <h3>How to choose</h3> <p>Start with location. Staying within walking distance of the seafront, attraction or town centre saves parking headaches and lets you nip back for a rest. Families should check what a \"family room\" actually means – sometimes it's a sofa bed squeezed in. Couples might pay a bit more for a sea view or a hot tub. If anyone needs step-free access, ask specifically about accessible rooms, lifts and parking, as older seaside guest houses often have narrow stairs and no lift.</p> <h3>Booking tips</h3> <ul> <li><strong>Book early for peak dates</strong> – summer weekends, bank holidays and big events fill fast.</li> <li><strong>Check the cancellation policy</strong> – flexible rates cost a bit more but are worth it with unpredictable British weather.</li> <li><strong>Ask about parking</strong> – city and seaside hotels often charge or have limited spaces.</li> <li><strong>Look at minimum stays</strong> – holiday lets often require two or three nights at weekends.</li> <li><strong>Read recent reviews</strong> for honest views on noise, cleanliness and breakfast.</li> <li><strong>Ring direct</strong> – some places offer better rates or extras when you book with them.</li> </ul> <p>Need somewhere to stay? Have a browse of the cards above for hotels, guest houses and holiday lets, then visit the town pages to see what's on near your bed for the night.</p>"}, "/food-and-drink": {"h2": "Your guide to eating on a day out", "html": "<h2>An army marches on its stomach (and so does a family)</h2> <p>Ask anyone about their favourite day out and food will come up within about thirty seconds. Fish and chips on the harbour wall, a Sunday roast in a country pub, a doughnut on the pier, a proper ice cream in a cone – the food is often the bit you remember most. Getting it right means planning a little, so nobody ends up hangry in a queue for overpriced sandwiches.</p> <h3>Classic day-out food stops</h3> <ul> <li><strong>The chippy</strong> – the seaside essential. Whitby, Scarborough, Cleethorpes and Grimsby, Britain's famous fishing town, all take their fish and chips very seriously.</li> <li><strong>Country pubs</strong> – hearty meals, beer gardens and often dog-friendly, great after a walk.</li> <li><strong>Cafés and tearooms</strong> – cream teas, cakes and light lunches, especially around heritage sites and market towns.</li> <li><strong>Ice cream parlours</strong> – family-run parlours on the coast are a holiday ritual.</li> <li><strong>Street food and markets</strong> – food halls and markets in cities and seaside towns offer something different for every member of the group.</li> <li><strong>Takeaways</strong> – pizza, kebabs and curries for a relaxed night back at the caravan or hotel.</li> <li><strong>Local specialities</strong> – Cornish pasties, Whitstable oysters, Bakewell puddings and Lincolnshire sausages are worth seeking out.</li> </ul> <h3>Choosing where to eat</h3> <p>With kids, look for a children's menu, high chairs and quick service. Groups should book ahead on weekends, as popular pubs and restaurants fill quickly. If anyone in your party has allergies or dietary needs, check menus online and ring ahead; by law, food businesses must be able to tell you about the main allergens in their dishes. For accessibility, ask about step-free entrances and accessible toilets, as older pubs and cafés can be tricky.</p> <h3>Hungry tips</h3> <ul> <li><strong>Eat early or late</strong> – noon to 2pm is peak time everywhere.</li> <li><strong>Pack snacks</strong> to keep everyone going between meals.</li> <li><strong>Bring a picnic</strong> for one meal and treat yourselves for the other.</li> <li><strong>Follow the locals</strong> – a queue of people in work clothes usually means it's good.</li> <li><strong>Book Sunday lunch</strong> well ahead at popular pubs.</li> </ul> <p>Feeling peckish? Browse the cards above for great places to eat on your day out, then use the town pages to find food near the attractions you're visiting.</p>"}, "/services": {"h2": "Your guide to motorway services", "html": "<h2>Coffee, toilets and a quick leg stretch</h2> <p>On any proper British road trip, the services are part of the journey. A stop breaks up a long drive, gets the kids out of their seats and gives the driver a well-earned coffee. Most are fairly standard, but a few are so good that people actually plan their route around them.</p> <h3>What you'll usually find</h3> <p>Most motorway service areas are run by operators like <strong>Moto</strong>, <strong>Welcome Break</strong>, <strong>Roadchef</strong> and <strong>Extra</strong>. Expect free toilets, baby changing, fuel, a shop, fast-food chains and coffee outlets, and often EV charging points. Many have a small arcade area with cranes and video games too, which is either a blessing or a curse depending on how long you planned to stop. Larger sites have hotels attached, handy for breaking up a long journey overnight.</p> <h3>The ones worth a detour</h3> <ul> <li><strong>Tebay Services</strong> on the M6 in Cumbria – a family-run farm shop and kitchen with views of the fells and a duck pond. A legend among road-trippers.</li> <li><strong>Gloucester Services</strong> on the M5 – from the same family, with a turf roof, farm shop and local food.</li> <li><strong>Cairn Lodge Services</strong> on the M74 in Scotland – a small, much-loved independent stop.</li> </ul> <h3>Road-trip tips</h3> <ul> <li><strong>Take a break every two hours</strong> – the Highway Code suggests at least 15 minutes for every two hours of driving.</li> <li><strong>Watch the parking time limit</strong> – most motorway services offer a free period, usually around two hours, and charge after that.</li> <li><strong>Fill up before the motorway</strong> if you can; fuel at services is often pricier than in town.</li> <li><strong>Pack snacks and drinks</strong> to avoid paying motorway prices for every bite.</li> <li><strong>Use the apps</strong> – EV drivers should check charger availability before relying on one site.</li> <li><strong>Look for accessible facilities</strong> – many services have Changing Places toilets, and staff can help with refuelling for disabled drivers if you call ahead or use the help button.</li> <li><strong>Stretch properly</strong> – a five-minute walk round the car park makes a big difference on a long run.</li> </ul> <p>Services are also handy meeting points for families travelling from different directions, or for a halfway catch-up with friends.</p> <p>Planning a long drive? Have a look at the cards above for services worth stopping at, then use the town pages to plan what to do once you arrive.</p>"}, "/plan-a-trip": {"h2": "Plan your trip with Spin Raiders", "html": "<h2>From \"where shall we go?\" to a day sorted</h2> <p>We've all done it: twenty tabs open, a map on one screen, a booking page on another, and still no idea where you're eating lunch. The Spin Raiders trip planner is built to take that faff away, letting you pull together arcades, attractions, food stops and places to stay into one simple plan you can take with you on the day.</p> <h3>How the planner works</h3> <ul> <li><strong>Save places as you browse</strong> – spot an arcade, a chippy or a castle you fancy and add it to your saved places.</li> <li><strong>Group them into a trip</strong> – pick a town or area and pull together the spots you want to visit.</li> <li><strong>Build a route</strong> – put your stops in a sensible order so you're not zigzagging across town.</li> <li><strong>Mix and match</strong> – combine an arcade session with lunch, a beach walk, an attraction and a bed for the night.</li> </ul> <h3>Ideas for putting a trip together</h3> <p>Try a <strong>seaside arcade crawl</strong>: start at one end of the prom and work your way along, with a fish and chip stop in the middle. Or a <strong>rainy-day plan</strong>: a museum in the morning, bowling after lunch and a cinema to finish. Families might go for a <strong>theme park weekend</strong>, with a hotel close to the gates so you're first in the queue. Retro fans can plan a <strong>nostalgia road trip</strong> linking classic seaside arcades in different towns, with motorway services and stays in between.</p> <h3>Tips for a smoother trip</h3> <ul> <li><strong>Don't overfill the day</strong> – three or four stops is plenty, especially with kids.</li> <li><strong>Check opening times before you go</strong> – seasonal venues can change hours out of summer.</li> <li><strong>Build in a back-up</strong> – save an indoor option in case the weather turns.</li> <li><strong>Think about travel time</strong> – parking and walking between places always takes longer than the map says.</li> <li><strong>Book the big things</strong> – theme parks, hotels and popular restaurants are worth reserving in advance.</li> <li><strong>Check accessibility</strong> for each stop if anyone in your group needs step-free access.</li> <li><strong>Share the plan</strong> with the rest of the group so everyone knows where they're heading.</li> </ul> <p>Ready to start planning? Use the cards above to get your trip going, and explore the town pages to find the arcades, food and stays that'll fill your perfect day.</p>"}};
var p=(location.pathname||'/').replace(/\/+$/,'')||'/';
if(!Object.prototype.hasOwnProperty.call(G,p))return;
var g=G[p],n=0;
function build(){return '<style>.sr-hub-guide{max-width:900px;margin:0 auto;padding:40px 20px 56px;font-family:Arial,Helvetica,sans-serif;line-height:1.7;color:#1b2a3a}.sr-hub-guide h2{font-family:"Barlow Condensed",Arial,sans-serif;font-weight:800;font-size:34px;line-height:1.2;margin:28px 0 10px;color:#0d2340}.sr-hub-guide h3{font-family:"Barlow Condensed",Arial,sans-serif;font-weight:700;font-size:24px;margin:22px 0 6px;color:#0d2340}.sr-hub-guide p{font-size:17px;margin:12px 0}.sr-hub-guide ul{padding-left:22px;font-size:17px}.sr-hub-guide li{margin:6px 0}</style>'+(/^\s*<h2/.test(g.html)?'':'<h2>'+g.h2+'</h2>')+g.html;}
function place(){
  var root=null,x=document.getElementById('sr-extended-pages');if(!(x&&x.shadowRoot&&x.shadowRoot.querySelector('main')))x=document.getElementById('sr-trip-pages');
  var ar=document.getElementById('sr-approved-archive');
  if(x&&x.shadowRoot&&x.shadowRoot.querySelector('main'))root=x.shadowRoot;
  else if(ar&&ar.shadowRoot&&ar.shadowRoot.childElementCount>0){var sr=ar.shadowRoot;if(sr.querySelector('.sr-hub-guide'))return true;var s0=document.createElement('section');s0.className='sr-hub-guide';s0.innerHTML=build();sr.appendChild(s0);return true;}
  else{var r=document.getElementById('sr-seaside-root');r=r&&r.shadowRoot;if(!r)return false;var inner=r.querySelector('#sr-home-approved-20260921');root=(inner&&inner.shadowRoot)||r;}
  var main=root.querySelector('main');if(!main||!main.firstElementChild)return false;
  if(main.querySelector('.sr-hub-guide'))return true;
  var s=document.createElement('section');s.className='section wrap sr-hub-guide';
  s.innerHTML=build();
  var promos=main.querySelector('.cpromos');var anchor=promos&&promos.closest('.wrap');
  if(anchor&&anchor.parentNode===main)main.insertBefore(s,anchor);else main.appendChild(s);
  return true;
}
var t=setInterval(function(){try{place();if(++n>120)clearInterval(t);}catch(e){clearInterval(t);}},250);
if(window.MutationObserver){var mo=new MutationObserver(function(){try{place();}catch(e){}});mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(function(){mo.disconnect();},30000);}
})();


/* Published extra venue guide text */
/* Spin Raiders: extra guide text for pages whose description was short (2026-10-07).
   Text lives in dist/extra/<path>.json; shown under the existing description. Read-only. */
(function(){try{
if(window.__srExtraText)return;window.__srExtraText=true;
var me=document.currentScript&&document.currentScript.src;var BASE=me?new URL('extra/',me).href:null;if(!BASE)return;
var cache={};function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function load(k){if(!(k in cache))cache[k]=fetch(BASE+encodeURIComponent(k)+'.json').then(function(r){return r.ok?r.json():null}).catch(function(){return null});return cache[k]}
function html(d,tag){return '<'+tag+' class="sr-extra-text"><h2>'+esc(d.h)+'</h2>'+d.p.map(function(x){return '<p>'+esc(x)+'</p>'}).join('')+'</'+tag+'>'}
function tick(){var path=location.pathname.replace(/\/+$/,'');if(path.split('/').length<4)return;var key=path.replace(/^\//,'').replace(/\//g,'__');
 var place=document.getElementById('sr-place-page'),shell=document.getElementById('sr-shell-page');
 var root=(place&&place.shadowRoot)||(shell&&shell.shadowRoot);if(!root||root.querySelector('.sr-extra-text'))return;
 var art=place&&root.querySelector('.body article');var about=shell&&root.querySelector('section.about');if(!art&&!about)return;
 load(key).then(function(d){if(!d||!root.host.isConnected||location.pathname.replace(/\/+$/,'')!==path||root.querySelector('.sr-extra-text'))return;
  if(art){var src=art.querySelector('p.src');var w=document.createElement('div');w.innerHTML=html(d,'div');var n=w.firstChild;art.insertBefore(n,src||null)}
  else{about.insertAdjacentHTML('afterend',html(d,'section').replace('class="sr-extra-text"','class="about vcard sr-extra-text"'))}})}
setInterval(tick,800);tick();
}catch(e){console.warn('SR extra text failed',e)}})();


/* Published related-place sections */
/* Spin Raiders: "More to explore" block for attraction-style place pages (2026-10-06).
   Adds links to other places in the same town plus category links under the main text.
   Read-only: changes no CMS data, pictures or affiliate content. */
(function () {
  try {
    if (window.__srMoreExplore) return;
    window.__srMoreExplore = true;
    var me = document.currentScript && document.currentScript.src;
    var BASE = me ? new URL('explore/',me).href : null;
    if (!BASE) return;
    var CATS = [
      ['Arcades', '/arcade'], ['Theme parks', '/theme-parks'], ['Zoos & wildlife', '/zoos'],
      ['Aquariums', '/sea-life'], ['Museums', '/museums'], ['Historic sites', '/historical-sites'],
      ['Nature & outdoors', '/outdoors'], ['Beaches', '/beaches'], ['Piers', '/piers'],
      ['Bowling', '/bowling'], ['Cinemas', '/cinemas'], ['Tours', '/tours'],
      ['Places to stay', '/places-to-stay'], ['Food & drink', '/food-and-drink'], ['Plan a trip', '/plan-a-trip']
    ];
    var cache = {};
    function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function townName(slug) { return String(slug || '').split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' '); }
    function load(slug) {
      if (!cache[slug]) cache[slug] = fetch(BASE + encodeURIComponent(slug) + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
      return cache[slug];
    }
    function build(root, path, data, anchor, where, slug) {
      if (!root.host.isConnected || location.pathname.replace(/\/+$/, '') !== path || root.querySelector('.sr-more-explore')) return;
      var parts = path.split('/');
      var body = anchor;
      if (!body) return;
      var town = (data && data.d) ? townName(data.d.split('/').pop()) : townName(slug);
      var items = ((data && data.items) || []).filter(function (x) { return x.p !== path; });
      var cats = CATS.filter(function (c) { return c[1] !== '/' + parts[1]; });
      var html = '<style>.sr-more-explore{margin:28px 0 8px;font-family:inherit}.sr-more-explore h2{font-size:1.35rem;margin:0 0 12px;color:#0b2545}.sr-more-explore .sr-me-grid{grid-auto-rows:auto!important;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:22px;align-items:start;align-content:start}.sr-more-explore a.pl{display:block;background:#fff;border:1px solid #dbe4ef;border-radius:12px;padding:12px 14px;text-decoration:none;color:#0b2545;height:auto!important;min-height:0!important}.sr-more-explore a.pl:hover{border-color:#1d6fe0}.sr-more-explore a.pl b{display:block;font-size:.98rem;line-height:1.25}.sr-more-explore a.pl span{display:block;font-size:.8rem;color:#5b6b80;margin-top:3px}.sr-more-explore .sr-me-chips{display:flex;flex-wrap:wrap;gap:8px}.sr-more-explore .sr-me-chips a{background:#0b2545;color:#fff;border-radius:999px;padding:8px 14px;font-size:.88rem;font-weight:600;text-decoration:none}.sr-more-explore .sr-me-chips a.town{background:#facc15;color:#0b2545}</style>';
      html += '<section class="sr-more-explore" aria-label="More to explore">';
      if (items.length) {
        html += '<h2>More to explore in ' + esc(town) + '</h2><div class="sr-me-grid">';
        items.slice(0, 9).forEach(function (x) { html += '<a class="pl" href="' + esc(x.p) + '"><b>' + esc(x.t) + '</b><span>' + esc(x.c) + '</span></a>'; });
        html += '</div>';
      }
      html += '<h2>Explore more days out</h2><div class="sr-me-chips">';
      if (data && data.d) html += '<a class="town" href="' + esc(data.d) + '">All of ' + esc(town) + ' →</a>';
      cats.forEach(function (c) { html += '<a href="' + c[1] + '">' + esc(c[0]) + '</a>'; });
      html += '</div></section>';
      body.insertAdjacentHTML(where || 'afterend', html);
    }
    function firstOk(slugs) {
      var i = 0;
      function next() { if (i >= slugs.length) return Promise.resolve(null); var sl = slugs[i++]; return load(sl).then(function (d) { return d ? d : next(); }); }
      return next();
    }
    function chipsOnly(root, anchor) {
      if (!root.host.isConnected || location.pathname.replace(/\/+$/, '') !== path || root.querySelector('.sr-more-explore')) return;
      build(root, location.pathname.replace(/\/+$/, ''), null, anchor, 'afterend', '');
    }
    function tick() {
      var path = location.pathname.replace(/\/+$/, '');
      var parts = path.split('/');
      var host, root, anchor;
      if ((host = document.getElementById('sr-place-page')) && host.shadowRoot) {
        root = host.shadowRoot; if (parts.length < 4 || root.querySelector('.sr-more-explore')) return;
        anchor = root.querySelector('.wrap .body'); if (!anchor) return;
        load(parts[3]).then(function (data) { build(root, path, data, anchor, 'afterend'); });
        return;
      }
      if ((host = document.getElementById('sr-shell-page')) && host.shadowRoot) {
        root = host.shadowRoot; if (parts.length !== 4 || root.querySelector('.sr-more-explore')) return;
        var main = root.querySelector('main.wrap'); if (!main || !root.querySelector('section.about')) return;
        var src = root.querySelector('.sr-source-records');
        var tgt = src && src.parentElement && src.parentElement.parentElement === main ? src.parentElement : null;
        load(parts[3]).then(function (data) { if (tgt) build(root, path, data, tgt, 'beforebegin'); else build(root, path, data, main, 'beforeend'); });
        return;
      }
      if ((host = document.getElementById('sr-food-page')) && host.shadowRoot) {
        root = host.shadowRoot; if (![3,4].includes(parts.length) || root.querySelector('.sr-more-explore')) return;
        var m2 = root.querySelector('.wrap main'); if (!m2) return;
        var w = parts[2].split('-'), cands = parts.length===4 ? [parts[3]] : [];
        for (var k = Math.min(4, w.length - 1); k >= 1; k--) cands.push(w.slice(w.length - k).join('-'));
        firstOk(cands).then(function (data) { build(root, path, data, m2, 'beforeend'); });
        return;
      }
      if (path === '/classic-fruit-machines') {
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
          var sr = all[i].shadowRoot; if (!sr) continue;
          var g = sr.querySelector('section.sr-hub-guide');
          if (g) { chipsOnly(sr, g); return; }
        }
      }
    }
    setInterval(tick, 700);
    tick();
  } catch (e) { console.warn('SR more-explore failed', e); }
})();


/* Published full arcade directory */
/* Spin Raiders — "All arcades" browsable list on /arcade (2026-10-07).
   Family and seaside arcades, including ones with a separate 18+ area, so they appear
   in the arcade section as well as on the AGC page. 9 cards per page. */
(function () {
  if (window.__srArcadeAll) return; window.__srArcadeAll = 1;
  var PER = 9, tries = 0;
  var INCLUDE = /arcade|amusement|family|fec|pier|bowl|retro|pinball|video|free.?play/i;
  var PURE_AGC = /^\s*(adult gaming centre|adult arcade)\b(?![\s\S]*(amusement|family|pier|retro|classic amusements))/i;
  var ADULT_AREA = /adult|18\+|casino|slots area/i;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function root() {
    var a = document.getElementById('sr-seaside-root'); a = a && a.shadowRoot;
    var b = a && a.getElementById('sr-home-approved-20260921'); return b && b.shadowRoot;
  }
  function title(e) { return e.displayTitle || e.title || e.name || ''; }
  function town(e) { return e.locationName || e.destination || e.town || ''; }
  function photo(e) {
    var S = window.SR_PUBLIC_DIRECTORY.S;
    var t = S.safePhoto && S.safePhoto(Object.assign({}, e, { heroImage: e.heroImage || e.image }));
    return t ? S.fit(S.img(t), 640) : '';
  }
  function kind(e) {
    var v = String(e.venueType || '');
    if (/pier/i.test(v)) return 'Pier arcade';
    if (/bowl/i.test(v)) return 'Bowling & arcade';
    if (/retro|pinball|video|free.?play|bar|pub/i.test(v)) return 'Retro & arcade bars';
    return 'Family arcade';
  }
  function card(e, i) {
    var img = photo(e), adult = ADULT_AREA.test(String(e.venueType || ''));
    var badge = adult ? 'FAMILY + 18+ AREA' : kind(e).toUpperCase();
    return '<a class="card" href="' + esc(window.SR_PLACE_HREF(e)) + '">' +
      (img ? '<img src="' + esc(img) + '" alt="' + esc(e.exteriorImageAlt || e.imageAltText || e.imageAlt || title(e)) + '" loading="lazy">' : '<span class="sr-aa-nophoto">Photo being added</span>') +
      '<span class="badge b' + (i % 4) + '">' + esc(badge) + '</span><div class="card-copy"><h3>' + esc(title(e)) + '</h3><p>' + esc(town(e)) + '</p></div><span class="arrow" aria-hidden="true">→</span></a>';
  }
  var CSS = '.sr-aa .sr-aa-tools{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px}' +
    '.sr-aa .sr-aa-tools input,.sr-aa .sr-aa-tools select{font:inherit;font-size:15px;padding:10px 14px;border:1px solid #cfd6e4;border-radius:999px;background:#fff;color:inherit;min-width:0}' +
    '.sr-aa .sr-aa-tools input{flex:1 1 220px}.sr-aa .sr-aa-tools select{flex:0 1 220px}' +
    '.sr-aa .sr-aa-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:18px}' +
    '.sr-aa .sr-aa-grid .card{min-width:0}' +
    '.sr-aa .sr-aa-nophoto{display:flex;align-items:center;justify-content:center;position:absolute;inset:0;background:#eef2f8;color:#5a6680;font-size:14px}' +
    '.sr-aa .sr-aa-pages{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:22px 0 0}' +
    '.sr-aa .sr-aa-pages button{font:inherit;min-width:40px;padding:8px 12px;border-radius:999px;border:1px solid #cfd6e4;background:#fff;cursor:pointer;color:inherit}' +
    '.sr-aa .sr-aa-pages button[aria-current="page"]{background:#001b41;color:#fff;border-color:#001b41}' +
    '.sr-aa .sr-aa-count{margin:0 0 12px;opacity:.8}' +
    '@media(max-width:900px){.sr-aa .sr-aa-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}' +
    '@media(max-width:560px){.sr-aa .sr-aa-grid{grid-template-columns:1fr!important}}';
  function render(sr, rows) {
    if (sr.getElementById('sr-arcade-all')) return;
    var anchor = sr.querySelector('section.sr-hub-guide') || sr.querySelector('main .wrap .cpromos');
    if (!anchor) return;
    if (anchor.classList.contains('cpromos')) anchor = anchor.parentNode;
    var towns = Array.from(new Set(rows.map(town).filter(Boolean))).sort();
    var sec = document.createElement('section');
    sec.className = 'section wrap sr-aa'; sec.id = 'sr-arcade-all';
    sec.innerHTML = '<style>' + CSS + '</style><div class="heading"><div><h2>All arcades</h2><p>Family and seaside arcades across the UK – including the ones with a separate 18+ adult gaming area, which you’ll also find on our AGC page.</p></div><a class="outline" href="/agc">AGC venues →</a></div>' +
      '<div class="sr-aa-tools"><input type="search" placeholder="Search an arcade or town…" aria-label="Search arcades"><select data-t aria-label="Choose a town"><option value="">All locations</option>' + towns.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select>' +
      '<select data-k aria-label="Arcade type"><option value="">All arcade types</option><option>Family arcade</option><option value="adult">Family + 18+ area</option><option>Pier arcade</option><option>Bowling &amp; arcade</option><option>Retro &amp; arcade bars</option></select></div>' +
      '<p class="sr-aa-count" role="status"></p><div class="highlights sr-aa-grid"></div><nav class="sr-aa-pages" aria-label="Arcade pages"></nav>';
    anchor.parentNode.insertBefore(sec, anchor);
    var q = sec.querySelector('input'), st = sec.querySelector('[data-t]'), sk = sec.querySelector('[data-k]'),
      grid = sec.querySelector('.sr-aa-grid'), pages = sec.querySelector('.sr-aa-pages'), count = sec.querySelector('.sr-aa-count'), page = 1;
    function list() {
      var s = q.value.trim().toLowerCase(), t = st.value, k = sk.value;
      return rows.filter(function (e) {
        if (t && town(e) !== t) return false;
        if (k === 'adult' && !ADULT_AREA.test(String(e.venueType || ''))) return false;
        if (k && k !== 'adult' && kind(e) !== k) return false;
        if (s && (title(e) + ' ' + town(e) + ' ' + (e.venueType || '') + ' ' + (e.region || '')).toLowerCase().indexOf(s) < 0) return false;
        return true;
      });
    }
    function draw(scroll) {
      var l = list(), n = Math.max(1, Math.ceil(l.length / PER));
      if (page > n) page = n;
      count.textContent = l.length + (l.length === 1 ? ' arcade' : ' arcades') + ' found';
      grid.innerHTML = l.slice((page - 1) * PER, page * PER).map(card).join('') || '<p>No arcades match – try another town or clear the search.</p>';
      var h = '';
      if (n > 1) {
        if (page > 1) h += '<button data-p="' + (page - 1) + '">← Prev</button>';
        for (var i = Math.max(1, page - 2); i <= Math.min(n, page + 2); i++) h += '<button data-p="' + i + '"' + (i === page ? ' aria-current="page"' : '') + '>' + i + '</button>';
        if (page < n) h += '<button data-p="' + (page + 1) + '">Next →</button>';
      }
      pages.innerHTML = h;
      if (scroll) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    pages.addEventListener('click', function (ev) { var b = ev.target.closest('button[data-p]'); if (b) { page = +b.dataset.p; draw(true); } });
    q.addEventListener('input', function () { page = 1; draw(); });
    st.addEventListener('change', function () { page = 1; draw(); });
    sk.addEventListener('change', function () { page = 1; draw(); });
    draw();
    // Swap any featured card whose guide is unavailable for a live arcade with a photo.
    var feat = sr.querySelector('.highlights:not(.sr-aa-grid)');
    if (feat) {
      var used = Array.from(feat.querySelectorAll('a.card')).map(function (a) { return a.getAttribute('href'); });
      var spare = rows.filter(function (e) { return photo(e) && used.indexOf(window.SR_PLACE_HREF(e)) < 0 && /amusement|arcade/i.test(String(e.venueType || '')) && !/bowl|bar|pub|retro|pinball|video/i.test(String(e.venueType || '')); });
      feat.querySelectorAll('article.card[data-route-unavailable]').forEach(function (a, i) {
        var e = spare[i * 7 % Math.max(1, spare.length)]; if (!e) { a.remove(); return; }
        var w = document.createElement('div'); w.innerHTML = card(e, 2); a.replaceWith(w.firstChild);
      });
    }
  }
  function go() {
    var path = location.pathname.replace(/\/+$/, '');
    if (path !== '/arcade') return;
    var D = window.SR_PUBLIC_DIRECTORY && window.SR_PUBLIC_DIRECTORY.D, U = window.SR_ROUTE_UI, sr = root();
    if (!D || !U || !window.SR_PLACE_HREF || !sr || !sr.querySelector('main section.sr-hub-guide, main .cpromos')) { if (++tries < 300) setTimeout(go, 200); return; }
    var f = { $or: ['Amusement', 'Arcade', 'Family', 'Pier', 'Bowl', 'Retro', 'Pinball'].reduce(function (a, w) { return a.concat(['category', 'venueType', 'title', 'name'].map(function (k) { var o = {}; o[k] = { $contains: w }; return o; })); }, []) };
    Promise.resolve(D.rows('Venues', f)).then(function (rows) { return U.businessRows(rows, 'Venues'); }).then(function (rows) {
      var seen = {};
      rows = (rows || []).filter(function (e) {
        var v = String(e.venueType || '');
        if (!U.discoverable(e) || !U.ready(e) || !title(e)) return false;
        if (/airtastic|trampolin|soft play|ninja|clip ?n ?climb|jump|escape room|laser|kart/i.test(v + ' ' + title(e))) return false;
        if (!INCLUDE.test(v) || PURE_AGC.test(v) || /^(bingo|casino|service|holiday|holiday park|theme)$/i.test(v.trim())) return false;
        var k = U.key(e); if (seen[k]) return false; seen[k] = 1; return true;
      }).sort(function (a, b) { return (photo(b) ? 1 : 0) - (photo(a) ? 1 : 0) || title(a).localeCompare(title(b)); });
      if (rows.length) render(sr, rows);
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  var last = location.pathname;
  setInterval(function () { if (location.pathname !== last) { last = location.pathname; tries = 0; go(); } }, 800);
})();


/* Approved rotating homepage arcade selection */
(function(){'use strict';
if(location.pathname!=='/'||Array.from(new URLSearchParams(location.search).keys()).some(key=>key!=='rc'))return;
const P=[['41e6d9e3-f037-46da-be61-b14d4d1f0fc5','onetec'],['b8ce32bf-9c74-41fe-92cc-07c07ffd6391','reel-vegas'],['venue-retrodome-barnsley','retrodome'],['ebcb8d89-2205-49b0-a454-6cb96a50a4da','r-cade'],['d29ebf7b-1e06-4a46-b352-fceaa0223de7','continue'],['768700c9-344f-42f0-bc0b-0891ad9c5fc8','high-score'],['venue-weston-super-mare-the-grand-pier-arcade','grand-pier'],['baef6936-52c8-4a3f-b8ce-7fca7ad44868','teignmouth-pier'],['9bce7109-aa52-4006-9de8-87de05113212','arcade-warehouse'],['venue-timewarp-arcade-bridgwater','timewarp'],['ukgc-37787-jimmy-g','jimmy-g'],['d9f5d108-13bd-4368-abc9-822f46447490','game-nation'],['ukgc-2755-derwent-matlock','derwent'],['14945496-6c7f-49f6-a151-d54ef61353b6','high-score'],['10e08bb1-eef7-41d6-8598-e6b4a2ab331b','play-barn'],['ukgc-29850-tj-leisure-whitley','tj-leisure'],['ukgc-916-golden-disc-ayr','golden-disc'],['ukgc-25086-bubbles-hopton','bubbles'],['9d6f2f56-f4bc-4fe9-8ba5-6b507e41bff9','wellington-pier'],['ukgc-1080-nevill-40','silcocks']],M=new Map(P),I=P.map(x=>x[0]),F=['title','locationName','venueType','heroImage','exteriorImageAlt','shortUrl','detailedReview','overview','historySummary','archiveSummary','shortDescription','status','currentVenueStatus','researchStatus','directoryReady','cardReady','pageReady','sourceVerified','adultGamingCentre','familyEntertainmentCentre','retroArcade'],T=v=>String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),W=v=>{v=T(v);return v?v.split(/\s+/).length:0},B=r=>/duplicate|merged|deleted|archived|quarantin|suppress|permanently closed|closed(?:[\s_-]|$)|rejected|not open to general public|research retained|not a separate venue|hold(?:[\s_-]|$)|research in progress/i.test([r.status,r.currentVenueStatus,r.researchStatus].filter(Boolean).join(' ')),N=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''),H=v=>{let h=2166136261;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0},R=()=>document.getElementById('sr-seaside-root')?.shadowRoot?.querySelector('#sr-home-approved-20260921')?.shadowRoot||null,C=r=>{const p=String(r.shortUrl||'');return /^\/(?:arcade|agc)\/[a-z0-9-]+\/[a-z0-9-]+$/.test(p)&&!/(?:^|\/)ukgc-|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[?#]/i.test(p)};
function Q(a){const s=String(Math.floor(Date.now()/604800000)),z=a.slice().sort((x,y)=>H(s+'|'+x._id)-H(s+'|'+y._id)),o=[],t=new Set,g=new Set;for(const r of z){const n=N(r.locationName),b=M.get(r._id)||N(r.title);if(!n||t.has(n)||g.has(b))continue;o.push(r);t.add(n);g.add(b);if(o.length===6)break}for(const r of z){if(o.length===6)break;if(!o.includes(r))o.push(r)}return o}
function D(a){const r=R(),m=r?.querySelector('.highlights')?.closest('section');if(!r||!m)return false;r.querySelector('[data-sr-home-arcades]')?.remove();const s=document.createElement('section');s.className='section wrap';s.dataset.srHomeArcades='1';s.innerHTML='<div class="heading"><div><h2>Arcades worth <em>a look</em></h2><p>A changing mix from around the UK — seaside favourites, family arcades, retro rooms and 18+ gaming venues. Open a card for the full guide.</p></div><a class="outline" href="/arcade">Explore arcades →</a></div><div class="highlights" data-sr-arcade-grid></div>';s.querySelector('[data-sr-arcade-grid]').innerHTML=a.map((x,i)=>SR_STATIC_CARDS.card(x,x.adultGamingCentre&&!x.familyEntertainmentCentre?'18+ VENUE':x.retroArcade?'RETRO ARCADE':'ARCADE',i%4)).join('');m.before(s);return true}
async function X(){if(!window.SR_SEASIDE?.archiveQuery||!window.SR_STATIC_CARDS||!window.SR_ROUTES||!R())return false;try{const nav=location.pathname+location.search;const q=await SR_SEASIDE.archiveQuery({fields:F,filter:{$or:I.map(id=>({_id:{$eq:id}}))},paging:{limit:100,offset:0}},null,false,'Venues'),a=(q.dataItems||[]).map(x=>({...x.data,_id:x.id||x.data?._id,_collection:'Venues'})).filter(x=>M.has(x._id)&&x.title&&x.heroImage&&x.sourceVerified===true&&x.directoryReady!==false&&x.cardReady!==false&&x.pageReady!==false&&!B(x)&&C(x)&&W([x.detailedReview,x.overview,x.historySummary,x.archiveSummary,x.shortDescription].filter(Boolean).join(' '))>=350),s=Q(a).map(x=>({...x,town:x.locationName,image:x.heroImage,alt:x.exteriorImageAlt||x.title,ad:false}));if(s.length<4)return true;await SR_STATIC_CARDS.hydrate(s);const c=s.filter(x=>{const y=SR_ROUTES.outcome(x);return y.ok&&y.discoveryAllowed!==false&&/^(?:\/arcade\/|\/agc\/)[a-z0-9-]+\/[a-z0-9-]+$/.test(y.href)&&!/[?#]/.test(y.href)}).slice(0,6);if(c.length<4)return true;if(location.pathname+location.search!==nav)return true;if(window.SR_HOME_SELECTION)SR_HOME_SELECTION.arcades=c;D(c)}catch(e){console.warn('Spin Raiders homepage arcade strip unavailable',e)}return true}
let n=0,k=setInterval(async()=>{if(await X()||++n>120)clearInterval(k)},100)})();

/* Published search phrase and spelling assistance */
/* Spin Raiders: search helper (2026-10-06).
   1) Rewrites common phrasings ("hotels in york", "fish and chips", "things to do in whitby").
   2) When a search finds no places, corrects typos against the site's own place/town names
      ("blakpool" -> "blackpool") and shows "Showing results for ...". Read-only. */
(function () {
  try {
    if (window.__srSearchAssist) return; window.__srSearchAssist = true;
    if (!/^\/search\/?$/.test(location.pathname)) return;
    var me = document.currentScript && document.currentScript.src;
    var VOCAB_URL = me ? new URL('search-vocab-20261006.json',me).href : null;
    var P = new URLSearchParams(location.search);
    var q0 = (P.get('q') || '').trim();
    if (!q0) return;
    var KEEP = /^(near|nearby|nearest|closest|close|around|local|here|food|eat|burgers?|chippy|chippie|chips|fish|pizzas?|pizzeria|cafes?|coffee|pubs?|bars?|inns?|curry|indian|chinese|thai|sushi|kebabs?|takeaways?|carvery|roast|breakfast|brunch|desserts?|museums?|bowling|cinemas?|arcades?|amusements|agcs?|bingo|casinos?|golf|zoos?|aquariums?|castles?|piers?|beach|beaches|hotels?|parks?|play|trampoline|karting|escape|laser|retro|pinball|stay|things|places)$/;
    var ALIAS = { skeggy: 'skegness', saint: 'st', gt: 'great', yarmuth: 'yarmouth', brid: 'bridlington', scarbados: 'scarborough', 'b&b': 'places to stay', bnb: 'places to stay' };
    function phrase(q) {
      var s = ' ' + q.toLowerCase().replace(/\s+/g, ' ').trim() + ' ';
      s = s.replace(/ fish (and|n|'n') chips /g, ' fish & chips ').replace(/ food and drink /g, ' food & drink ').replace(/ bed and breakfasts? /g, ' places to stay ');
      s = s.replace(/ (hotels?|accommodation|guest ?houses?|b ?& ?b'?s?|bnbs?|holiday lets?|holiday cottages?|cottages|somewhere to stay|where to stay) /g, ' places to stay ');
      s = s.replace(/^ (things|stuff|what) to do (in|at|near(?! me)|around(?! me)) /, ' ').replace(/^ (days? out|attractions|places to visit) (in|at|near(?! me)|around(?! me)) /, ' ');
      s = s.replace(/ places to stay (in|at|near(?! me)|around(?! me)) /g, ' places to stay ');
      return s.trim();
    }
    if (!P.get('sf')) {
      var p1 = phrase(q0);
      if (p1 && p1 !== q0.toLowerCase().replace(/\s+/g, ' ').trim()) {
        P.set('q', p1); P.set('sf', '1'); P.set('from', q0);
        location.replace('/search?' + P.toString()); return;
      }
    }
    function dist(a, b, max) {
      if (Math.abs(a.length - b.length) > max) return max + 1;
      var d = []; for (var i = 0; i <= a.length; i++) { d[i] = [i]; }
      for (var j = 1; j <= b.length; j++) d[0][j] = j;
      for (i = 1; i <= a.length; i++) {
        var best = 99;
        for (j = 1; j <= b.length; j++) {
          var c = a[i - 1] === b[j - 1] ? 0 : 1;
          d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
          if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
          if (d[i][j] < best) best = d[i][j];
        }
        if (best > max) return max + 1;
      }
      return d[a.length][b.length];
    }
    function correct(q, V) {
      var words = q.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9& ]+/g, ' ').split(/\s+/).filter(Boolean);
      var out = [], changed = false;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (KEEP.test(w)) { out.push(w); continue; }
        if (ALIAS[w]) { out.push(ALIAS[w]); changed = true; continue; }
        if (i + 1 < words.length && V[w + words[i + 1]] && !(V[w] && V[words[i + 1]])) { out.push(w + words[i + 1]); i++; changed = true; continue; }
        if (w.length < 4 || V[w] || w === '&') { out.push(w); continue; }
        var split = null;
        for (var sp = 3; sp <= w.length - 3 && !split; sp++) if (V[w.slice(0, sp)] > 3 && V[w.slice(sp)] > 3) split = w.slice(0, sp) + ' ' + w.slice(sp);
        if (split) { out.push(split); changed = true; continue; }
        var max = w.length >= 8 ? 2 : 1, best = null, bd = 9, bf = 0;
        for (var k in V) {
          if (Math.abs(k.length - w.length) > max) continue;
          var dd = dist(w, k, max);
          if (dd <= max && (dd < bd || (dd === bd && V[k] > bf))) { best = k; bd = dd; bf = V[k]; }
        }
        if (best) { out.push(best); changed = true; } else out.push(w);
      }
      return changed ? out.join(' ') : null;
    }
    function deep(sel) {
      var found = null;
      (function walk(r) { if (found) return; var x = r.querySelector(sel); if (x) { found = x; return; } var all = r.querySelectorAll('*'); for (var i = 0; i < all.length && !found; i++) if (all[i].shadowRoot) walk(all[i].shadowRoot); })(document);
      return found;
    }
    function noPlaces() {
      var e = deep('.empty h2');
      return e && /No matching places/i.test(e.textContent);
    }
    function banner() {
      var from = P.get('from'); if (!from || !P.get('sf')) return;
      var h = deep('[data-message]') || deep('h2');
      if (!h || h.parentNode.querySelector('.sr-sf-note')) return;
      var d = document.createElement('p'); d.className = 'sr-sf-note';
      d.style.cssText = 'margin:6px 0 10px;font-size:.95rem;color:#334155';
      var a = document.createElement('a'); a.href = '/search?q=' + encodeURIComponent(from) + '&sf=0'; a.textContent = from; a.style.cssText = 'color:#1d6fe0;font-weight:600';
      d.appendChild(document.createTextNode('Showing results for “' + (P.get('q') || '') + '”. Search instead for '));
      d.appendChild(a);
      h.parentNode.insertBefore(d, h.nextSibling);
    }
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      banner();
      if (P.get('sf')) { if (tries > 40) clearInterval(t); return; }
      if (tries > 40) { clearInterval(t); return; }
      if (!noPlaces() || !VOCAB_URL) return;
      clearInterval(t);
      fetch(VOCAB_URL).then(function (r) { return r.json(); }).then(function (V) {
        var c = correct(q0, V);
        if (c && c !== q0.toLowerCase()) { P.set('q', c); P.set('sf', '1'); P.set('from', q0); location.replace('/search?' + P.toString()); }
      }).catch(function () {});
    }, 500);
  } catch (e) { console.warn('SR search assist failed', e); }
})();

