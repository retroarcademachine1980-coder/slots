(function () {
  try {
    (() => {
      "use strict";
      let t,
        e = "",
        i = 0;
      try {
        const t = JSON.parse(
          sessionStorage.getItem("sr-public-visitor-v1") || "null",
        );
        t?.until > Date.now() && ((e = t.token), (i = t.until));
      } catch {}
      async function a() {
        return e && i > Date.now()
          ? e
          : (t ||
              (t = (async () => {
                const t = await fetch("https://www.wixapis.com/oauth2/token", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    clientId: "5296d1b3-888a-4d2e-bdd2-a8a8dd0018d8",
                    grantType: "anonymous",
                  }),
                });
                if (!t.ok) throw Error("Visitor connection unavailable");
                const a = await t.json();
                ((e = a.access_token),
                  (i =
                    Date.now() +
                    1e3 * Math.max(30, (+a.expires_in || 300) - 60)));
                try {
                  sessionStorage.setItem(
                    "sr-public-visitor-v1",
                    JSON.stringify({ token: e, until: i }),
                  );
                } catch {}
                return e;
              })().finally(() => (t = null))),
            t);
      }
      async function o(t, o, n, r = "ClassicFruitMachines") {
        for (let s = 0; s < 2; s++) {
          const c = await a(),
            l = await fetch("https://www.wixapis.com/wix-data/v2/items/query", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: c },
              body: JSON.stringify({
                dataCollectionId: r,
                query: t,
                returnTotalCount: !!n,
              }),
              signal: o,
            });
          if (401 === l.status && !s) {
            ((e = ""), (i = 0));
            continue;
          }
          if (!l.ok) throw Error("Directory request failed: " + l.status);
          const d = await l.json();
          if (!Array.isArray(d.dataItems))
            throw Error("Invalid directory response");
          return window.SR_ROUTE_UI.hydrateResult(d,r);
        }
      }
      const n = (t) => (
          t && "object" == typeof t && (t = t.src || t.url || ""),
          "string" != typeof t
            ? ""
            : t.startsWith("wix:image://v1/")
              ? "https://static.wixstatic.com/media/" +
                t.slice(15).split("/")[0]
              : /^https?:\/\//i.test(t)
                ? t
                : ""
        ),
        r = (t) =>
          !1 !== t.active &&
          !1 !== t.directoryReady &&
          !1 !== t.cardReady &&
          !t.canonicalMachineId &&
          !/^(duplicate|merged|deleted|archived|quarantin|suppress|permanently closed|closed)/i.test(
            [t.status, t.locationStatus, t.currentVenueStatus]
              .filter(Boolean)
              .join(" "),
          ),
        s = [
          "title",
          "shortUrl",
          "canonicalUrl",
          "canonicalHotelUrl",
          "hotelGuideId",
          "locationItemId",
          "destinationSlug",
          "offerCount",
          "offerIds",
          "summary",
          "description",
          "revenueReady",
          "offerRecordType",
          "recordType",
          "guideCanonicalId",
          "guideReady",
          "canonicalMachineId",
          "name",
          "displayTitle",
          "slug",
          "locationName",
          "locationSlug",
          "destination",
          "category",
          "venueType",
          "active",
          "directoryReady",
          "cardReady",
          "status",
          "locationStatus",
          "currentVenueStatus",
          "heroImage",
          "cardImage",
          "image",
          "imageVerified",
          "imageResearchStatus",
          "imageAccuracy",
          "website",
          "outboundUrl",
          "bookingUrl",
          "affiliateUrl",
          "offerUrl",
          "sourceUrl",
          "address",
          "postcode",
          "publicRatingStatus",
          "publicRating",
          "publicReviewCount",
          "publicRatingSource",
          "latitude",
          "longitude",
          "facilities",
          "tags",
          "features",
          "disabledAccess",
          "parking",
          "familyFriendly",
          "familyFEC",
          "familyEntertainmentCentre",
          "amusementArcade",
          "adultGamingCentre",
          "dogFriendly",
          "wifi",
          "ageRestriction",
          "exteriorImageAlt",
          "imageAltText",
          "imageAlt",
          "ctaLabel",
          "ctaText",
          "affiliate",
          "offerType",
          "validUntil",
          "offerText",
          "offerTitle",
          "offerBadge",
          "dealBadge",
          "discountText",
          "dealImage",
          "dealPrice",
          "wasPrice",
          "dealBoughtCount",
          "offerValidUntil",
          "shortDescription",
          "region",
          "county",
          "country",
          "link-arcade-venues-title",
          "link-arcade-locations-title",
        ];
      window.SR_PUBLIC_DIRECTORY = {
        S: {
          e: (t) =>
            String(t ?? "").replace(
              /[&<>"']/g,
              (t) =>
                ({
                  "&": "&amp;",
                  "<": "&lt;",
                  ">": "&gt;",
                  '"': "&quot;",
                  "'": "&#39;",
                })[t],
            ),
          img: n,
          fit: (t, e = 1400) => {
            const i = n(t);
            return i
              ? i.includes("static.wixstatic.com/media/") &&
                !i.includes("/crop/")
                ? i.split("/v1/")[0] +
                  "/v1/fit/w_" +
                  e +
                  ",h_" +
                  Math.ceil(0.7 * e) +
                  ",q_65,enc_auto/file.webp"
                : i
              : "";
          },
          safePhoto: (t) =>
            /AI.GENERATED|WRONG.VENUE|PLACEHOLDER|UNVERIFIED|REJECTED/i.test(
              [t.imageResearchStatus, t.imageAccuracy].join(" "),
            )
              ? ""
              : n(t.heroImage || t.image || t.mainImage || t.cardImage),
          archiveQuery: o,
        },
        D: {
          rows: async function (t, e = {}) {
            let i = [];
            for (let a = 0; ; a += 500) {
              const n = await o(
                {
                  fields: s,
                  filter: e,
                  sort: [{ fieldName: "_id", order: "ASC" }],
                  paging: { limit: 500, offset: a },
                },
                null,
                !1,
                t,
              );
              if (
                (i.push(
                  ...n.dataItems
                    .map((e) => ({ ...e.data, _id: e.id, _collection: t }))
                    .filter(r),
                ),
                n.dataItems.length < 500)
              )
                break;
            }
            return i;
          },
        },
        eligible: r,
      };
    })();
  } catch (e) {
    console.warn("SR snippet failed: Spin Raiders public directory adapter", e);
  }
})();

(function(){
  const types = [
    ['fishing','Fishing Lakes','fishing',/fishery|fisheries|fishing|angling/i,/\b(?:fishing(?: lakes?)?|fisheries|fishery|angling)\b/i],
    ['cinemas','Cinemas','cinemas',/\bcinema\b|\bcineworld\b|\bodeon\b|\bvue\b/i,/\b(?:cinemas?|cineworld|odeon)\b/i],
    ['bowling','Bowling','bowling',/bowling|tenpin/i,/\b(?:bowling|tenpin)\b/i],
    ['bingo','Bingo','bingo',/bingo/i,/\bbingo\b/i],
    ['agc','Adult Gaming Centres','agc',/adult gaming|\bagc\b|merkur|admiral/i,/\b(?:adult gaming centres?|agcs?)\b/i],
    ['casinos','Casinos','casinos',/casino/i,/\bcasinos?\b/i],
    ['holiday','Holiday Parks','holiday-parks',/holiday park|caravan park|holiday village|camping|glamping/i,/\b(?:holiday parks?|caravan parks?|camping|glamping)\b/i],
    ['stays','Places to Stay','places-to-stay',/hotel|guest\s?house|b&b|accommodation|lodge|cottage|apartment|\bstay\b/i,/\b(?:places to stay|hotels?|stays?|accommodation)\b/i],
    ['arcadebars','Arcade Bars','arcade-bars',/arcade bar|gaming bar/i,/\barcade bars?\b/i],
    ['food','Eat & Drink','food-drink',/food|restaurant|cafe|café|takeaway|\bpub\b|chippy|\bbar\b|grill|dining/i,/\b(?:food and drink|eat and drink|food|restaurants?|cafes?)\b/i],
    ['theme','Theme Parks','theme-parks',/theme park|amusement park/i,/\btheme parks?\b/i],
    ['zoos','Zoos & Wildlife','zoos',/zoo|wildlife park|safari/i,/\b(?:zoos?|wildlife parks?|safari)\b/i],
    ['sealife','Sea Life & Aquariums','sea-life',/aquarium|sea life|sealife/i,/\b(?:sea life|sealife|aquariums?)\b/i],
    ['museums','Museums','museums',/museum|gallery/i,/\b(?:museums?|galleries)\b/i],
    ['history','Historic Sites','historical-sites',/historic|castle|heritage|stately home/i,/\b(?:historic(?:al)? sites?|castles?|heritage)\b/i],
    ['piers','Piers','piers',/\bpier\b/i,/\bpiers?\b/i],
    ['beaches','Beaches','beaches',/beach/i,/\bbeach(?:es)?\b/i],
    ['tours','Tours & Experiences','tours',/tour|experience|sightseeing/i,/\b(?:tours?|experiences?|sightseeing)\b/i],
    ['outdoors','Nature & Outdoors','nature',/nature|outdoor|garden|forest|woodland|reserve|walk|hiking|country park|national park|lake/i,/\b(?:nature(?: reserves?)?|outdoors?|national parks?|country parks?|walking|hiking|gardens?|forests?)\b/i],
    ['services','Service Stations','services',/service station|motorway services/i,/\b(?:service stations?|motorway services)\b/i],
    ['venues','Arcades','arcades',/arcade|retro video/i,/\b(?:arcades?|retro video games?)\b/i],
    ['attractions','Attractions & Family Fun','attractions',/attraction|family fun/i,/\b(?:attractions?|family fun|things to do|days out)\b/i]
  ];
  window.SR_PLACE_TYPES=types;
  window.SR_CLASSIFY_PLACE = row => row._collection==='HotelGuides'?'stays':row._collection==='ClassicFruitMachines'?'machines':row._collection==='Locations'?'destinations':(types.find(t=>t[3].test([row.category,row.venueType].filter(Boolean).join(' ')))||types.find(t=>t[3].test([row.title,row.name].filter(Boolean).join(' ')))||[row._collection==='Venues'?'venues':'attractions'])[0];
  // A family arcade with a separate adult room belongs in both filters.
  // Keep the single primary category for its existing label and age information.
  window.SR_PLACE_CATEGORIES = row => {
    const primary = window.SR_CLASSIFY_PLACE(row);
    const result = [primary];
    if (row._collection === 'Venues') {
      const familyArcade = row.familyFEC === true || row.familyEntertainmentCentre === true ||
        (row.amusementArcade === true && row.familyFriendly === true) ||
        /family amusement|family entertainment/i.test(row.venueType || '');
      if (familyArcade && !result.includes('venues')) result.push('venues');
      if (row.adultGamingCentre === true && !result.includes('agc')) result.push('agc');
    }
    return result;
  };
  window.SR_PARSE_PLACE_SEARCH = value => {
    let text=String(value||'').trim(), type=types.find(t=>t[4].test(text));
    if(/\b(?:fruit machines?|slots?)\b/i.test(text))return {category:'machines',query:text.replace(/\b(?:fruit machines?|slots?)\b/ig,' ')};
    return {category:type?.[0]||'',query:type?text.replace(type[4],' ').replace(/\b(?:in|near|around)\b/ig,' ').replace(/\s+/g,' ').trim():text};
  };
  // Only emit registered canonical contracts. CMS values are migrated separately after preview.
  window.SR_CANONICAL = {
    localPath(value, kind) {const parsed=window.SR_ROUTES.parse(value);return parsed.ok&&parsed.kind===kind?parsed.path:'';},
    hotelHref(row) {const result=window.SR_ROUTES.outcome(row);return result.ok&&result.kind==='hotel'?result.href:'';},
    outbound(row) { return [row.affiliateUrl,row.offerUrl,row.outboundUrl,row.bookingUrl].find(value => {if(typeof value!=='string')return false;try{const url=new URL(value);return /^https?:$/.test(url.protocol)&&!!url.hostname&&!url.username&&!url.password;}catch{return false;}}) || ''; },
    offerLive(row, now = Date.now()) {
      if (row.active === false || row.directoryReady === false || row.guideReady === false || row.cardReady === false || row.revenueReady === false || row.canonicalMachineId || [row.status,row.locationStatus,row.currentVenueStatus].some(value => /^(duplicate|merged|deleted|archived|quarantin|suppress|permanently closed|closed)/i.test(String(value||''))) || (!row.affiliateUrl && !row.offerUrl) || !this.outbound(row)) return false;
      const value = row.validUntil || row.offerValidUntil;
      const raw = value && typeof value === 'object' ? value.$date : value;
      const expires = raw ? Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + 'T23:59:59Z' : raw) : NaN;
      return !raw || (Number.isFinite(expires) && expires >= now);
    },
    normalizeOffer(row, guides) {
      const matches = guides.filter(g => g.active !== false && (g._id === row.hotelGuideId || (Array.isArray(g.offerIds) && g.offerIds.includes(row._id))));
      const guide = matches.length === 1 && (!row.hotelGuideId || row.hotelGuideId === matches[0]._id) ? matches[0] : null;
      return {...row,
        _guideResolved: !!guide,
        _guideRoute: guide ? this.hotelHref(guide) : '',
        displayTitle: row.displayTitle || row.title || row.name || row.offerTitle || '',
        locationName: row.locationName || row.destination || row.location || guide?.locationName || '',
        locationSlug: row.locationSlug || row.destinationSlug || guide?.locationSlug || '',
        category: row.category || row.offerType || (row._collection === 'HotelOffers' ? 'Hotel' : 'Offer'),
        shortDescription: row.shortDescription || row.summary || row.description || '',
        image: row.dealImage || row.image || row.heroImage || ''
      };
    },
    async offerOutcomes(reader) {
      const collections = ['HotelGuides','HotelOffers','AffiliateOffers'];
      const outcomes = await Promise.allSettled(collections.map(c => reader.rows(c)));
      const guides = outcomes[0].status === 'fulfilled' ? outcomes[0].value.filter(g => g.active !== false) : [];
      return outcomes.map((outcome,index) => outcome.status !== 'fulfilled' ? outcome : {
        status:'fulfilled', value:index === 0 ? [] : outcome.value.map(row => this.normalizeOffer(row,guides))
          .filter(row => this.offerLive(row) && this.hotelHref(row))
      });
    }
  };
  window.SR_PLACE_HREF = row => window.SR_ROUTES.href(row);
  const style=document.createElement('style');style.id='sr-mobile-cookie-control';style.textContent='@media(max-width:760px){[data-hook="consent-banner-revisit-settings-container"]{top:auto!important;bottom:calc(10px + env(safe-area-inset-bottom))!important;left:10px!important;right:auto!important;transform:none!important;width:auto!important;height:44px!important;flex-direction:row!important;border-radius:8px!important;overflow:hidden!important}[data-hook="consent-banner-revisit-settings-button"]{width:auto!important;height:44px!important;padding:0 12px!important}[data-hook="consent-banner-revisit-settings-button-text"]{writing-mode:horizontal-tb!important;transform:none!important;width:auto!important;height:auto!important;margin:0!important;font-size:12px!important}[data-hook="consent-banner-revisit-settings-close-button"]{width:44px!important;height:44px!important}}';document.head.append(style);
})();

