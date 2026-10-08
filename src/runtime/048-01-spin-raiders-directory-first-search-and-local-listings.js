(function () {
  try {
    (() => {
      "use strict";
      const norm = (v) =>
        String(v || "")
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[’']/g, "")
          .replace(/silcox|silcocks/g, "silcock")
          .replace(/\b(?:real|rio) vegas\b/g, "reel vegas")
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
      const live = (r) =>
        r.active !== false &&
        r.directoryReady !== false &&
        r.cardReady !== false &&
        !r.canonicalMachineId &&
        !/^(duplicate|merged|deleted|archived|quarantin|suppress|permanently closed|closed)/i.test(
          [r.status, r.locationStatus, r.currentVenueStatus]
            .filter(Boolean)
            .join(" "),
        );
      const fields = [
        "title",
        "displayName",
        "town",
        "shortDescription",
        "unifiedSearchText",
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
        "offerTitle",
        "offerBadge",
        "dealBadge",
        "discountText",
        "dealImage",
        "offerValidUntil",
        "guideCanonicalId",
        "name",
        "displayTitle",
        "slug",
        "locationName",
        "locationSlug",
        "destination",
        "category",
        "venueType",
        "manufacturer",
        "sourceVenues",
        "active",
        "directoryReady",
        "cardReady",
        "status",
        "locationStatus",
        "currentVenueStatus",
        "canonicalMachineId",
        "heroImage",
        "cardImage",
        "cardMarqueeImage",
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
        "ratingSource",
        "latitude",
        "longitude",
        "facilities",
        "features",
        "disabledAccess",
        "parking",
        "parkingAvailable",
        "freeParking",
        "familyFriendly",
        "familyFEC",
        "familyEntertainmentCentre",
        "amusementArcade",
        "adultGamingCentre",
        "dogFriendly",
        "wifi",
        "freeWifi",
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
        "region",
        "county",
        "country",
        "link-arcade-venues-title",
        "link-arcade-locations-title",
        "link-classic-fruit-machine-archive-1-title",
      ];
      const collections = [
        "Locations",
        "Venues",
        "ClassicFruitMachines",
        "HotelGuides",
        "NearbyAttractions",
        "FoodAndDrink",
        "AffiliateOffers",
      ];
      let S;
      async function rows(c, filter) {
        let out = [],
          offset = 0;
        for (;;) {
          const res = await S.archiveQuery(
            {
              fields,
              filter: filter || {},
              sort: [{ fieldName: "_id", order: "ASC" }],
              paging: { limit: 1000, offset },
            },
            null,
            false,
            c,
          );
          out.push(
            ...res.dataItems
              .map((x) => ({ ...x.data, _id: x.id, _collection: c }))
              .map(row => c === "HotelGuides" ? {...row,category:"Hotel"} : row)
              .filter(row => c !== "HotelGuides" || window.SR_CANONICAL.hotelHref(row))
              .filter(live),
          );
          if (res.dataItems.length < 1000) break;
          offset += 1000;
        }
        return window.SR_ROUTE_UI.businessRows(out,c,{discovery:!(location.pathname==="/search"&&new URLSearchParams(location.search).get("favourites")==="1")});
      }
      const title = (r) => r.displayTitle || r.title || r.name || "";
      const town = (r) => r.locationName || r.destination || "";
      function href(r) { return window.SR_PLACE_HREF(r); }

      function card(r) {
        if(!window.SR_ROUTE_UI.ready(r))return window.SR_ROUTE_UI.unavailable(r);
        const c = r._collection,
          isMachine = c === "ClassicFruitMachines";
        return S.card({
          title: title(r),
          subtitle: [town(r), r.venueType || r.category || r.manufacturer]
            .filter(Boolean)
            .join(" · "),
          image: isMachine
            ? S.archiveQuality?.cardPhoto(r)
            : S.safePhoto?.({ ...r, heroImage: r.heroImage || r.image }),
          kind: isMachine ? "machine" : c === "Locations" ? "town" : "place",
          category: isMachine
            ? "Fruit machine"
            : c === "Locations"
              ? "Destination"
              : r.venueType || r.category || "Venue",
          href: href(r),
          button:
            c === "Locations"
              ? "Explore all local places"
              : isMachine
                ? "Explore machine"
                : c === "Venues"
                  ? "View venue guide"
                  : "Find out more",
        });
      }
      function dedupe(a) {
        return [
          ...new Map(
            a.map((r) => [window.SR_ROUTE_UI.key(r), r]),
          ).values(),
        ];
      }
      function section(root, name, a) {
        if (!a.length) return;
        const el = document.createElement("section");
        el.className = "section wrap";
        el.innerHTML =
          "<h2>" +
          S.e(name) +
          " <small>(" +
          a.length +
          ')</small></h2><div class="grid"></div><button class="btn outline" type="button">Show more</button>';
        root.append(el);
        let count = 0;
        const more = () => {
          el.querySelector(".grid").insertAdjacentHTML(
            "beforeend",
            a
              .slice(count, count + 24)
              .map(card)
              .join(""),
          );
          count += 24;
          el.querySelector("button").hidden = count >= a.length;
        };
        el.querySelector("button").onclick = more;
        more();
      }
      function filterWords(words, cols) {
        return words.length
          ? {
              $and: words.map((w) => ({
                $or: (window.SR_SEARCH_WORD_FORMS?.(w)||[w]).flatMap(form=>cols.map(k=>({[k]:{$contains:form}}))),
              })),
            }
          : {};
      }
      async function search() {
        if (
          location.pathname.replace(/\/$/, "") !== "/search" ||
          new URLSearchParams(location.search).get("view") === "articles"
        )
          return;
        if (document.getElementById("sr-directory-search")) return;
        if (!window.SR_SEARCH_VIEW || !window.SR_SEARCH_VIEW_CSS)
          return setTimeout(search, 80);
        const searchNavigation=location.pathname+location.search;
        const host = document.createElement("div");
        host.id = "sr-directory-search";
        const root = host.attachShadow({ mode: "open" }),
          p = new URLSearchParams(location.search),
          q = p.has("favourites")
            ? "Saved places"
            : (p.get("q") || "").trim().slice(0, 160),
          n = norm(q);
        const parsed = window.SR_PARSE_PLACE_SEARCH(q);
        const category = p.get("category") || parsed.category;
        const words = norm(parsed.query)
          .replace(/\b(the|in|near|at|find|a|an|and|all|places to visit|places to eat)\b/g, " ")
          .trim().split(/\s+/).filter(Boolean);
        const native = document.getElementById("SITE_CONTAINER");
        if (native) native.before(host);
        else document.body.append(host);
        const css = document.createElement("style");
        css.id = "sr-directory-search-isolation";
        css.textContent =
          "body:has(#sr-directory-search) #sr-seaside-related,body:has(#sr-directory-search) #raidertube-global-button,body:has(#sr-directory-search) #sr-report-action,body:has(#sr-directory-search) #SITE_CONTAINER,body:has(#sr-directory-search) #sr-seaside-root{display:none!important}#sr-directory-search{display:block!important;position:relative;z-index:5}body:has(#sr-directory-search){background:white!important}";
        document.head.append(css);
        document.title = (q ? "Search: " + q : "Search") + " | Spin Raiders";
        const view = window.SR_SEARCH_VIEW(root, {
          S,
          q,
          category,
          href,
          favourites: p.has("favourites"),
        });
        if (!q && !category) {window.SR_RUNTIME?.ready("search",searchNavigation);return;}
        if (q && !p.has("favourites")) {
          for (let i = 0; i < (document.querySelector('script[src*="sr-smart-search"]') ? 120 : 0) && !window.SR_SMART_SEARCH; i++) await new Promise((r) => setTimeout(r, 100));
          if (window.SR_SMART_SEARCH) {
            try {
              const sm = await window.SR_SMART_SEARCH(q, { root });
              if (sm) { view.setRecords(sm.rows, sm.failed || 0); return; }
            } catch (err) { console.warn("SR smart search failed", err); }
          }
        }
        try {
          if (p.has("favourites")) {
            let ids = [];
            try {
              ids = JSON.parse(
                localStorage.getItem("sr-directory-favourites-v1") || "[]",
              );
            } catch {}
            if (!Array.isArray(ids)) ids = [];
            const groups = collections
              .map((c) => ({
                c,
                ids: ids
                  .filter(
                    (id) => typeof id === "string" && id.startsWith(c + ":"),
                  )
                  .map((id) => id.slice(c.length + 1)),
              }))
              .filter((g) => g.ids.length);
            const outcomes = await Promise.allSettled(
              groups.map((g) =>
                rows(g.c, { $or: g.ids.map((id) => ({ _id: { $eq: id } })) }),
              ),
            );
            view.setRecords(
              outcomes.flatMap((r) =>
                r.status === "fulfilled" ? r.value : [],
              ),
              outcomes.filter((r) => r.status === "rejected").length,
            );
            return;
          }
          const requested =
            !words.length && category === "machines"
              ? ["ClassicFruitMachines"]
              : !words.length && category && category !== "destinations"
                ? ["Venues", "HotelGuides", "NearbyAttractions", "FoodAndDrink", "AffiliateOffers"]
                : collections;
          const outcomes = await Promise.allSettled(
            requested.map((c) =>
              rows(
                c,
                filterWords(
                  words,
                  c === "ClassicFruitMachines"
                    ? ["title", "manufacturer"]
                    : c === "Locations"
                      ? ["title"]
                      : [
                          "title",
                          "name",
                          "displayTitle",
                          "displayName",
                          "town",
                          "shortDescription",
                          "locationName",
                          "destination",
                          "postcode",
                          "category",
                          "venueType",
                          "unifiedSearchText",
                        ],
                ),
              ),
            ),
          );
          let all = outcomes.flatMap((r) =>
              r.status === "fulfilled" ? r.value : [],
            ),
            failed = outcomes.filter((r) => r.status === "rejected").length;
          const score = (r) => {
            const t = norm(title(r)),
              w = words.join(" ");
            return t === n || t === w
              ? 100
              : t.startsWith(w) && w
                ? 80
                : words.length && words.every((x) => t.includes(x))
                  ? 60
                  : 10;
          };
          all = dedupe(all);
          const seen = new Set();
          all = all.filter((r) => {
            const k =
              (["NearbyAttractions", "HotelGuides"].includes(
                r._collection,
              )
                ? "place"
                : r._collection) +
              "|" +
              norm(title(r)) +
              "|" +
              norm(town(r));
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
          all.sort(
            (a, b) => score(b) - score(a) || title(a).localeCompare(title(b)),
          );
          view.setRecords(all, failed);
        } catch (err) {
          view.error();
        }
      }
      function install() {
        S = window.SR_SEASIDE;
        if (
          !S?.archiveQuery ||
          !S?.pages?.destination ||
          !S?.styles?.length ||
          !document.body
        )
          return setTimeout(install, 80);
        window.SR_SEARCH_DATA = { rows, href, norm, filterWords };
        if (!window.SR_LOCATION_DESIGN_ACTIVE && !S.directoryFirstInstalled) {
          S.directoryFirstInstalled = true;
          const original = S.pages.destination;
          S.pages.destination = (slug) => {
            const html = original(slug),
              box = document.createElement("div");
            box.innerHTML = html;
            const local = box.querySelector("#local-arcades");
            if (local) {
              local.querySelector("h2").textContent =
                "Arcades & venues in " +
                (S.currentRecord?.title || "this town");
              const grid = local.querySelector(".grid");
              if (grid)
                grid.innerHTML = (window.SR_V || [])
                  .map((r) =>
                    S.card({ ...S.venue(r), button: "View venue guide" }),
                  )
                  .join("");
            }
            const intro = [...box.querySelectorAll("p")].find((p) =>
              p.textContent.includes("<h3>Destination overview"),
            );
            if (intro) intro.remove();
            const attractions = box.querySelector("#local-attractions .grid");
            if (attractions)
              attractions.innerHTML = (window.SR_A || [])
                .map((r) =>
                  S.card({
                    title: r[0],
                    subtitle: r[2],
                    image: r[4],
                    href:
                      r[5] ||
                      "/attractions?town=" +
                        encodeURIComponent(S.currentRecord?.title || ""),
                  }),
                )
                .join("");
            return box.innerHTML;
          };
          if (window.SR_FAST) {
            const finish = window.SR_FAST.finish;
            window.SR_FAST.finish = function (e, type) {
              finish.call(this, e, type);
              if (!["venue", "destination"].includes(type)) return;
              const main = e.root?.querySelector("main"),
                map = main?.querySelector("#local-map");
              if (map) {
                const section = map.closest("section") || map;
                const trip = main.querySelector(".trip-cta");
                if (trip) trip.before(section);
                else main.append(section);
              }
              const nav = e.root?.querySelector(".local-navigation"),
                mapButton = nav?.querySelector('[data-local-jump="local-map"]');
              if (mapButton) nav.append(mapButton);
              const load = main?.querySelector(
                "[data-local-recommendations] [data-load-section]",
              );
              load?.click();
            };
          }
        }
        function enhance() {
          if (window.SR_LOCATION_DESIGN_ACTIVE) return;
          const path = location.pathname,
            isTown = /^\/destination\//.test(path),
            isVenue = /^\/arcade-venues\//.test(path);
          if (!isTown && !isVenue) return;
          S = window.SR_SEASIDE;
          const root = document.getElementById("sr-seaside-root"),
            main = root?.querySelector("main");
          if (!main || main.querySelector("[data-fast-loading]")) return;
          if (isTown) {
            const area = main.querySelector("#local-arcades");
            if (area && !area.dataset.expanded) {
              area.dataset.expanded = "1";
              area.querySelector("h2").textContent =
                "Arcades & venues in " +
                (S.currentRecord?.title || "this town");
              const grid = area.querySelector(".grid");
              if (grid)
                grid.innerHTML = (window.SR_V || [])
                  .map((r) =>
                    S.card({ ...S.venue(r), button: "View venue guide" }),
                  )
                  .join("");
              S.bind();
            }
            const intro = [...main.querySelectorAll("p")].find((p) =>
              p.textContent.includes("<h3>Destination overview"),
            );
            intro?.remove();
            const attractions = main.querySelector("#local-attractions .grid");
            if (attractions && !attractions.dataset.expanded) {
              attractions.dataset.expanded = "1";
              attractions.innerHTML = (window.SR_A || [])
                .map((r) =>
                  S.card({
                    title: r[0],
                    subtitle: r[2],
                    image: r[4],
                    href:
                      r[5] ||
                      "/attractions?town=" +
                        encodeURIComponent(S.currentRecord?.title || ""),
                  }),
                )
                .join("");
            }
            if (
              S.cmsVenues?.length &&
              !main.querySelector("[data-town-machines]")
            ) {
              const holder = document.createElement("div");
              holder.dataset.townMachines = "1";
              holder.innerHTML =
                '<p class="wrap" role="status">Finding machines recorded locally…</p>';
              const before =
                main.querySelector("#local-map") ||
                main.querySelector(".trip-cta");
              before ? before.before(holder) : main.append(holder);
              const refs = [
                ...new Set(
                  S.cmsVenues.flatMap((r) => [
                    r.title,
                    r.title + ", " + town(r),
                  ]),
                ),
              ];
              rows("ClassicFruitMachines", { sourceVenues: { $hasSome: refs } })
                .then((a) => {
                  holder.innerHTML = "";
                  section(
                    holder,
                    "Fruit machines recorded in " +
                      (S.currentRecord?.title || "this town"),
                    dedupe(a).sort((a, b) => title(a).localeCompare(title(b))),
                  );
                })
                .catch(() => {
                  holder.innerHTML =
                    '<p class="wrap">Local machines could not load. Please reload to try again.</p>';
                });
            }
          }
          const map = main.querySelector("#local-map"),
            trip = main.querySelector(".trip-cta");
          if (map) {
            const part = map.closest("section") || map;
            if (trip && part.nextElementSibling !== trip) trip.before(part);
            else if (!trip && part !== main.lastElementChild) main.append(part);
          }
          const nav = root.querySelector(".local-navigation"),
            button = nav?.querySelector('[data-local-jump="local-map"]');
          if (button && button !== nav.lastElementChild) nav.append(button);
          main
            .querySelector("[data-local-recommendations] [data-load-section]")
            ?.click();
        }
        let orderTries = 0;
        function watchOrder() {
          enhance();
          const host = document.getElementById("sr-seaside-root");
          if (host && !host.directoryOrderObserver) {
            let t;
            host.directoryOrderObserver = new MutationObserver(() => {
              clearTimeout(t);
              t = setTimeout(enhance, 100);
            });
            host.directoryOrderObserver.observe(host, {
              childList: true,
              subtree: true,
            });
          }
          if (++orderTries < 60) setTimeout(watchOrder, 1000);
        }
        if (/^\/arcade-(locations|venues)\//.test(location.pathname))
          watchOrder();
        enhance();
        if (
          /^\/arcade-(locations|venues)\//.test(location.pathname) &&
          S.root &&
          !S.root.directoryOrderObserver
        ) {
          let timer;
          S.root.directoryOrderObserver = new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(enhance, 80);
          });
          S.root.directoryOrderObserver.observe(S.root, {
            childList: true,
            subtree: true,
          });
        }
        search();
      }
      install();
    })();
  } catch (e) {
    console.warn(
      "SR snippet failed: Spin Raiders Directory First Search and Local Listings",
      e,
    );
  }
})();

