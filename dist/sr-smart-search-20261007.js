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
    ['cafe', 'Cafés & coffee', 'food', /\bcafe|\bcafes|coffee|tea ?room|tearoom|bakery|bakehouse|patisserie/, /\bcaf(?:e|es)\b|\bcoffee(?: shops?)?\b|\btea ?rooms?\b|\bbakery\b|\bbakeries\b/, ['cafe', 'café', 'coffee', 'tea room', 'tearoom', 'bakery']],
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
        if (family && !pureAgc && !/^\s*(bingo|casino|service|holiday park|holiday|theme)\s*$/i.test(String(r.venueType || ''))) out.push('familyarcade');
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

  /* ---------- query parsing ---------- */
  var NEAR = /\b(?:near ?me|nearby|near here|close to me|close by|closest|nearest|around me|around here|local to me|in my area|my area|near to me)\b/;
  var STOP = /\b(?:the|a|an|in|at|on|near|around|by|best|good|great|top|cheap|cheapest|nice|lovely|decent|proper|where|wheres|can|i|we|get|find|some|any|places?|to|go|for|sell|sells|selling|serve|serves|serving|do|does|they|with|open|today|tonight|now|me|my|us|of|is|are|there|what|which|and|or|please|show|looking|want|fancy|near|uk|area|local|family friendly|kids|cheap)\b/g;
  var towns = null, townsReady = null;
  function loadTowns() {
    if (townsReady) return townsReady;
    var list = {};
    Object.keys(window.SR_TRIP_COORDS || {}).forEach(function (k) {
      var c = window.SR_TRIP_COORDS[k]; list[slugify(k)] = { slug: slugify(k), name: k.replace(/\b[a-z]/g, function (m) { return m.toUpperCase(); }), lat: c[0], lng: c[1] };
    });
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
    var S = window.SR_SEASIDE, out = [];
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
    if (!C || !C.offerOutcomes || !D) return Promise.resolve([]);
    offersReady = C.offerOutcomes(D).then(function (outs) {
      var seen = {};
      return outs.flatMap(function (o) { return o.status === 'fulfilled' ? o.value : []; }).filter(function (r) {
        var href = C.hotelHref(r); if (!href || !(r.dealPrice || r.offerTitle)) return false;
        var k = href + '|' + C.outbound(r); if (seen[k]) return false; seen[k] = 1; return true;
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
    var C = window.SR_CANONICAL, u = C.hotelHref(r); if (!u) return '';
    var pic = '', raw = r.dealImage || (r.image && r.image.url) || r.image || r.heroImage;
    try { var S = window.SR_SEASIDE; pic = S && S.fit && S.img ? S.fit(S.img(raw), 560) : String(raw || ''); } catch (e) { pic = ''; }
    var t = r.displayTitle || r.name || r.title || '';
    var save = String(r.offerBadge || r.discountText || '').replace(/^SAVE UP TO/i, 'Save');
    var cat = String(r.category || '').replace(/^THINGS TO DO OFFER\s*•\s*/i, '').replace(/\bOFFER\b/i, '').trim() || 'Deal';
    return '<a class="srsd-card" href="' + escapeHtml(u) + '"><div class="srsd-img">' + (pic ? '<img src="' + escapeHtml(pic) + '" alt="' + escapeHtml(r.imageAlt || t) + '" loading="lazy">' : '') +
      (save ? '<span class="srsd-save">' + escapeHtml(save) + '</span>' : '') + '</div><div class="srsd-body"><span class="srsd-cat">' + escapeHtml(cat) + '</span><h3 class="srsd-t">' + escapeHtml(t) + '</h3>' +
      (r.offerTitle ? '<p class="srsd-o">' + escapeHtml(r.offerTitle) + '</p>' : '') + '<div class="srsd-foot"><span class="srsd-p">' + escapeHtml(String(r.dealPrice || '').replace(/^FROM\s*/i, 'From ')) + '</span><span class="srsd-cta">View deal →</span></div></div></a>';
  }

  /* ---------- main ---------- */
  async function smart(q, opts) {
    opts = opts || {};
    if (!q || !window.SR_SEASIDE || !window.SR_SEASIDE.archiveQuery) return null;
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
    var sub = deals.length ? 'Deals shown first.' : '';
    if (here && p.near) sub = (sub ? sub + ' ' : '') + 'Nearest to you first.';
    return { rows: found.map(decorate), deals: deals, failed: failed, heading: heading, note: [note, sub].filter(Boolean).join(' '), parsed: p };
  }

  window.SR_SMART_SEARCH = function (q, opts) {
    return smart(q, opts).then(function (r) {
      if (!r) return null;
      var root = opts && opts.root;
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
