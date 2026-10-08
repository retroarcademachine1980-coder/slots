(function () {
  try {
    (() => {
      "use strict";
      if ("/map" !== location.pathname.replace(/\/$/, "")) return;
      window.SR_NEW_MAP_ACTIVE = !0;
      let mapNavigation=location.pathname+location.search;
      let e = 0;
      !(async function t() {
        let B=0,mapFailed=false,sourceLoading=true;
        const sourceCollections=["Venues", "NearbyAttractions", "HotelGuides", "FoodAndDrink", "AffiliateOffers"];
        if (
          "/map" !== location.pathname.replace(/\/$/, "") ||
          document.documentElement.classList.contains("rt-active")
        )
          return;
        const a = window.SR_SEASIDE,
          o = window.SR_SEARCH_DATA;
        if (!(
          document.body &&
          document.getElementById("sr-seaside-root") &&
          a?.archiveQuery &&
          o &&
          window.SR_MAP_DESIGN_CSS
        ))
          return void (++e < 600 && setTimeout(t, 100));
        if (document.getElementById("sr-approved-map")) return;
        const i = document.createElement("div");
        ((i.id = "sr-approved-map"),
          document.getElementById("sr-seaside-root").before(i));
        const s = i.attachShadow({ mode: "open" }),
          r = a.e,
          n = document.createElement("style");
        ((n.textContent =
          "body:has(#sr-approved-map){background:white!important}body:has(#sr-approved-map) #sr-seaside-root,body:has(#sr-approved-map) #sr-seaside-related,body:has(#sr-approved-map) #SITE_CONTAINER,body:has(#sr-approved-map) #raidertube-global-button,body:has(#sr-approved-map) #sr-report-action{display:none!important}"),
          document.head.append(n),
          (document.title = "Explore the UK Map | Spin Raiders"));
        const l = [
            ["seaside", "Arcades (Seaside)", "#06a56b", "♜"],
            ["classic", "Classic Arcades", "#ff8600", "777"],
            ["agc", "Adult Gaming (AGC)", "#ed1642", "18"],
            ["merkur", "Merkur", "#f7b500", "☀"],
            ["admiral", "Admiral", "#063dc7", "⚓"],
            ["casino", "Other Casinos", "#9427d3", "♣"],
            ["bingo", "Bingo", "#f7008b", "B"],
            ["cinema", "Cinemas", "#0659d9", "▣"],
            ["bowling", "Bowling", "#008f68", "●"],
            ["holiday", "Holiday Parks", "#049967", "△"],
            ["hotel", "Hotels", "#7825cc", "▰"],
            ["attraction", "Attractions", "#ff8200", "◎"],
            ["food", "Food & Drink", "#ff6500", "♜"],
            ["service", "Service Stations", "#008b67", "▤"],
            ["other", "Other", "#506a85", "•••"],
          ],
          c = (e) => {
            const t = [e.category, e.venueType, e.title, e.brand]
              .join(" ")
              .toLowerCase();
            return e._collection === "FoodAndDrink" ? "food" : /service station|motorway services|^services?$/.test(String(e.category||e.venueType||"").toLowerCase()) ? "service" : e._collection === "HotelGuides"
              ? "hotel"
              : /merkur/.test(t)
              ? "merkur"
              : /admiral/.test(t)
                ? "admiral"
                : /service station|motorway services/.test(t)
                  ? "service"
                  : /bingo/.test(t)
                    ? "bingo"
                    : /cinema/.test(t)
                      ? "cinema"
                      : /bowling/.test(t)
                        ? "bowling"
                        : /casino/.test(t)
                          ? "casino"
                          : /holiday park|caravan|camping/.test(t)
                            ? "holiday"
                            : /hotel|guest house|b&b|accommodation/.test(t)
                              ? "hotel"
                              : /restaurant|cafe|café|food|drink|pub|chippy/.test(
                                    t,
                                  )
                                ? "food"
                                : /classic/.test(t)
                                  ? "classic"
                                  : /adult gaming|agc/.test(t)
                                    ? "agc"
                                    : "Venues" === e._collection
                                      ? "seaside"
                                      : "NearbyAttractions" === e._collection
                                        ? "attraction"
                                        : "other";
          },
          d = (e) => e.displayTitle || e.title || e.name || "Place",
          p = (e) => e.locationName || e.destination || e.town || "",
          u = (e) => e._collection + ":" + e._id,
          m = (e) => {
            const t = a.safePhoto?.({
              ...e,
              heroImage: e.heroImage || e.image,
            });
            return t ? a.fit(a.img(t), 480) : "";
          },
          g = new Map(
            (window.SR_MAP || [])
              .filter((e) => e[2] && null != e[6] && null != e[7])
              .map((e) => [e[2], [+e[6], +e[7]]]),
          ),
          h = (e) =>
            null != e.latitude &&
            null != e.longitude &&
            Number.isFinite(+e.latitude) &&
            Number.isFinite(+e.longitude) &&
            +e.latitude >= 49 &&
            +e.latitude <= 61 &&
            +e.longitude >= -9 &&
            +e.longitude <= 2
              ? [+e.latitude, +e.longitude]
              : null,
          y = (e) => l.find((t) => t[0] === c(e));
        let b,
          v,
          f = [],
          S = [],
          w = null,
          A = null,
          $ = [],
          k = l.map((e) => e[0]),
          R = [];
        try {
          const e = JSON.parse(
            localStorage.getItem("sr-map-design-preferences") || "null",
          );
          (Array.isArray(e) && (k = e.filter((e) => l.some((t) => t[0] === e))),
            ($ = JSON.parse(
              localStorage.getItem("sr-directory-favourites-v1") || "[]",
            )));
        } catch {}
        Array.isArray($) || ($ = []);
        const mapParams=new URLSearchParams(location.search);
        if(mapParams.has("category"))k=(mapParams.get("category")||"").split(",").filter(value=>l.some(row=>row[0]===value));
        const I = mapParams.get("q") || "";
        s.innerHTML =
          '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""><style>' +
          window.SR_MAP_DESIGN_CSS +
          "</style>" +
          `<div class="map-ribbon">Putting great places back on the map!</div><main class="layout"><aside class="filters"><h1>Explore the UK Map</h1><p>Find arcades, attractions, places to stay, food and more.</p><div class="tabs"><button data-tab="search" aria-pressed="true">Search</button><button data-tab="categories">Categories</button><button data-tab="preferences">My Preferences</button></div><form class="search"><input aria-label="Search the UK map" value="${r(I)}" placeholder="Search for a town, venue or attraction…"><button aria-label="Search map">⌕</button></form><div class="preferences" hidden><strong>Your map preferences</strong><p>Selected categories are remembered on this browser.</p><label><input type="checkbox" data-saved-only ${mapParams.get("saved")==="1"?"checked":""}> Only my saved places</label><button data-near>Use my location</button></div><div class="filter-top"><strong>Show on Map</strong><button class="text-button" data-all>Select all</button></div><div class="categories">${l.map(([e, t, a, o]) => `<label class="category"><span class="icon" style="--pin:${a}">${window.SR_ICON(({seaside:"arcades",classic:"fruit-machines",agc:"agc",merkur:"agc",admiral:"agc",casino:"casinos",bingo:"bingo",cinema:"cinemas",bowling:"bowling",holiday:"holiday-parks",hotel:"places-to-stay",attraction:"attractions",food:"food-drink",service:"services",other:"all"})[e],30)}</span>${t}<input type="checkbox" value="${e}" ${k.includes(e) ? "checked" : ""}></label>`).join("")}</div><button class="primary wide" data-update>Update Map ↻</button><button class="wide" data-reset>Reset Filters</button><p class="map-status" role="status">Loading places…</p><div class="map-results" aria-label="Matching places"></div></aside><section class="map-stage" aria-label="UK places map"><div class="map-canvas"></div><div class="map-tools"><button data-near aria-label="Find my location">⌖</button><button data-fullscreen aria-label="Expand map">⛶</button></div><div class="map-count" role="status">Loading map…</div></section><article class="place"><div class="empty"><h2>Where will you explore?</h2><p>Select a pin or a place to see its photos, facilities and guide.</p></div></article></main><dialog><button data-close>Close ✕</button><div data-photo></div></dialog>`;
        const q = s.querySelector(".search input"),
          M = s.querySelector(".map-status"),
          C = s.querySelector(".place");
        function E(e, t) {
          const a = (e) => (e * Math.PI) / 180,
            o =
              Math.sin(a(t[0] - e[0]) / 2) ** 2 +
              Math.cos(a(e[0])) *
                Math.cos(a(t[0])) *
                Math.sin(a(t[1] - e[1]) / 2) ** 2;
          return 7917.6 * Math.asin(Math.sqrt(Math.min(1, o)));
        }
        function x(e) {
          w = e;
          const t = m(e),
            i = y(e),
            s =
              /^VERIFIED/i.test(e.publicRatingStatus || "") &&
              +e.publicReviewCount > 0 &&
              +e.publicRating > 0,
            n = f
              .filter((t) => u(t) !== u(e) && h(t) && h(e))
              .sort((t, a) => E(h(t), h(e)) - E(h(a), h(e)))
              .slice(0, 3);
          ((R = [t].filter(Boolean)),
            (C.innerHTML = `<div class="place-hero">${t ? `<img src="${r(t)}" alt="${r(e.exteriorImageAlt || e.imageAlt || d(e))}">` : '<div class="photo-empty">Photo being added</div>'}<button class="save" data-save aria-pressed="${$.includes(u(e))}">${$.includes(u(e)) ? "♥ Saved" : "♡ Save to Favourites"}</button></div><div class="place-copy"><h2>${r(d(e))}</h2><p class="location">${r(p(e))}</p><p class="rating">${s ? "<b>★</b> " + (+e.publicRating).toFixed(1) + " (" + Number(e.publicReviewCount).toLocaleString("en-GB") + " reviews)" : "No public rating yet."}</p><div class="tags"><span>${r(i[1])}</span>${!0 === e.familyFriendly ? "<span>Family Friendly</span>" : ""}${e.ageRestriction ? "<span>" + r(e.ageRestriction) + "</span>" : ""}</div><p>${r(e.shortDescription || e.description || "")}</p><div class="actions">${window.SR_ROUTE_UI.ready(e)?`<a class="visit" href="${r(window.SR_ROUTES.href(e))}">View place →</a>`:'<span class="visit" role="status">Guide temporarily unavailable</span>'}<a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([d(e), e.address, e.postcode, p(e)].filter(Boolean).join(", "))}" target="_blank" rel="noopener">Get Directions</a></div><div class="address">⌖ ${r([e.address, e.postcode, p(e)].filter(Boolean).join(", "))}</div><div data-details></div><div class="gallery"></div>${n.length ? `<section class="nearby"><h3>Nearby Places</h3><div class="nearby-grid">${n.map((t) => `<button class="nearby-card" data-place="${r(u(t))}">${m(t) ? `<img src="${r(m(t))}" alt="${r(d(t))}" loading="lazy">` : ""}<span>${r(d(t))}<br>${E(h(t), h(e)).toFixed(1)} miles</span></button>`).join("")}</div><small>Distances are straight-line estimates.</small></section>` : ""}</div>`),
            a
              .archiveQuery(
                { filter: { _id: { $eq: e._id } }, paging: { limit: 1 } },
                null,
                !1,
                e._collection,
              )
              .then((t) => {
                if (w !== e) return;
                const o = t.dataItems[0]?.data || {},
                  i = o.openingHoursSummary || o.openingHours || o.openingTimes,
                  s = [
                    ["Disabled access", o.disabledAccess],
                    ["Parking", o.parking],
                    ["Toilets", o.toilets],
                    ["Wi-Fi", o.wifi],
                    ["Food & drink", o.cafe],
                  ].filter((e) => !0 === e[1]);
                C.querySelector("[data-details]").innerHTML =
                  ("string" == typeof i
                    ? `<details class="hours"><summary>Opening Times</summary><p>${r(i)}</p></details>`
                    : "") +
                  (s.length
                    ? '<div class="tags">' +
                      s.map((e) => "<span>" + r(e[0]) + "</span>").join("") +
                      "</div>"
                    : "");
                const n = [
                  ...Array.from(
                    { length: 12 },
                    (e, t) => o["galleryImage" + (t + 1)],
                  ).filter(Boolean),
                  ...(Array.isArray(o.galleryImages)
                    ? o.galleryImages
                    : Array.isArray(o.gallery)
                      ? o.gallery
                      : Array.isArray(o.photos)
                        ? o.photos
                        : []),
                ];
                (Array.isArray(n) &&
                  (R = [
                    ...new Set([
                      ...R,
                      ...n
                        .map((e) =>
                          "string" == typeof e ? e : e.src || e.url || e.image,
                        )
                        .filter(Boolean)
                        .map((e) => a.img(e)),
                    ]),
                  ].slice(0, 12)),
                  (C.querySelector(".gallery").innerHTML = R.slice(0, 4)
                    .map(
                      (t, o) =>
                        `<button data-photo-index="${o}" aria-label="View photo ${o + 1}"><img src="${r(a.fit(t, 600))}" alt="${r(d(e))} photo ${o + 1}" loading="lazy"></button>`,
                    )
                    .join("")));
              })
              .catch(() => {}));
        }
        function _(e = !0) {
          if(location.pathname!=="/map"||!s.host.isConnected)return;
          k = Array.from(s.querySelectorAll(".categories input:checked")).map(
            (e) => e.value,
          );
          const stateUrl=new URL(location.href),query=q.value.trim();
          query?stateUrl.searchParams.set("q",query):stateUrl.searchParams.delete("q");
          k.length===l.length?stateUrl.searchParams.delete("category"):stateUrl.searchParams.set("category",k.join(","));
          s.querySelector("[data-saved-only]").checked?stateUrl.searchParams.set("saved","1"):stateUrl.searchParams.delete("saved");
          if(stateUrl.pathname+stateUrl.search+stateUrl.hash!==location.pathname+location.search+location.hash)history.replaceState(history.state,"",stateUrl.pathname+stateUrl.search+stateUrl.hash);mapNavigation=location.pathname+location.search;
          try {
            localStorage.setItem(
              "sr-map-design-preferences",
              JSON.stringify(k),
            );
          } catch {}
          const t = o.norm(q.value).split(" ").filter(Boolean),
            a = s.querySelector("[data-saved-only]").checked;
          ((S = f.filter(
            (e) =>
              k.includes(c(e)) &&
              (!a || $.includes(u(e))) &&
              t.every((t) =>
                o
                  .norm(
                    [d(e), p(e), e.postcode, e.category, e.venueType].join(" "),
                  )
                  .includes(t),
              ),
          )),
            A &&
              S.sort(
                (e, t) =>
                  (h(e) ? E(A, h(e)) : 1 / 0) - (h(t) ? E(A, h(t)) : 1 / 0),
              ));
          const i = S.filter(h);
          ((s.querySelector(".map-count").textContent =
            mapFailed ? "Map unavailable — use the place list." : b ? "Showing " + i.length.toLocaleString("en-GB") + " places" : "Loading map — places are available below."),
            (M.textContent =
              S.length.toLocaleString("en-GB") +
              " matching places" +
              (S.length > i.length
                ? " · " + (S.length - i.length) + " without map coordinates"
                : "") + (B ? " · Some records could not load. Reload to retry." : "")),
            (s.querySelector(".map-results").innerHTML =
              S.slice(0, 40)
                .map(
                  (e) =>
                    `<button data-place="${r(u(e))}">${r(d(e))}<small>${r(p(e))}</small></button>`,
                )
                .join("") ||
              (sourceLoading?"<p role=\"status\">Loading places…</p>":B===sourceCollections.length?"<p role=\"status\">Places could not load. Reload to retry.</p>":"<p>No matching places. Try a town or another category.</p>")),
            b &&
              (v.clearLayers(),
              i.forEach((e) => {
                const t = y(e),
                  a = L.marker(h(e), {
                    icon: L.divIcon({
                      className: "",
                      html: `<div class="map-pin" style="--pin:${t[2]}"><span>${window.SR_ICON(({seaside:"arcades",classic:"fruit-machines",agc:"agc",merkur:"agc",admiral:"agc",casino:"casinos",bingo:"bingo",cinema:"cinemas",bowling:"bowling",holiday:"holiday-parks",hotel:"places-to-stay",attraction:"attractions",food:"food-drink",service:"services",other:"all"})[t[0]],25)}</span></div>`,
                      iconSize: [29, 29],
                      iconAnchor: [15, 29],
                    }),
                    title: d(e),
                    alt: d(e),
                    keyboard: !0,
                  }).addTo(v);
                (a.getElement()?.setAttribute("aria-label", d(e)),
                  a.on("click", () => x(e)));
              }),
              e && i.length && q.value
                ? b.fitBounds(L.latLngBounds(i.map(h)), {
                    padding: [35, 35],
                    maxZoom: 13,
                  })
                : !e || q.value || A || b.setView([54.4, -3.4], 6)),
            !w &&
              S.length &&
              x(
                S.find((e) => /golden mile/i.test(d(e))) ||
                  S.find((e) => /blackpool/i.test(p(e))) ||
                  S[0],
              ));
        if(!sourceLoading){if(B<sourceCollections.length)window.SR_RUNTIME?.ready("map",mapNavigation);else window.SR_RUNTIME?.failed("map",mapNavigation);}
}
        ((s.querySelector("form").onsubmit = (e) => {
          (e.preventDefault(), (A = null), _());
        }),
          (s.querySelector("[data-update]").onclick = () => _()),
          (s.querySelector("[data-all]").onclick = () => {
            (s
              .querySelectorAll(".categories input")
              .forEach((e) => (e.checked = !0)),
              _());
          }),
          (s.querySelector("[data-reset]").onclick = () => {
            ((q.value = ""),
              (A = null),
              (s.querySelector("[data-saved-only]").checked = !1),
              s
                .querySelectorAll(".categories input")
                .forEach((e) => (e.checked = !0)),
              _());
          }),
          (s.querySelector("[data-saved-only]").onchange = () => _()),
          s.querySelectorAll("[data-tab]").forEach(
            (e) =>
              (e.onclick = () => {
                (s
                  .querySelectorAll("[data-tab]")
                  .forEach((t) =>
                    t.setAttribute("aria-pressed", String(t === e)),
                  ),
                  (s.querySelector(".preferences").hidden =
                    "preferences" !== e.dataset.tab),
                  "search" === e.dataset.tab && q.focus(),
                  "categories" === e.dataset.tab &&
                    s.querySelector(".categories input").focus());
              }),
          ),
          s.addEventListener("click", (e) => {
            const t = e.target.closest("button");
            if (t) {
              if (t.dataset.place) {
                const e = f.find((e) => u(e) === t.dataset.place);
                e && (x(e), b && h(e) && b.setView(h(e), 14));
              }
              if (t.hasAttribute("data-save") && w) {
                const e = u(w);
                $ = $.includes(e) ? $.filter((t) => t !== e) : [...$, e];
                try {
                  (localStorage.setItem(
                    "sr-directory-favourites-v1",
                    JSON.stringify($),
                  ),
                    t.setAttribute("aria-pressed", String($.includes(e))),
                    (t.textContent = $.includes(e)
                      ? "♥ Saved"
                      : "♡ Save to Favourites"));
                } catch {
                  M.textContent = "Unable to save on this browser." + (B?" Some records could not load. Reload to retry.":"");
                }
              }
              if (
                (t.hasAttribute("data-photo-index") &&
                  ((s.querySelector("[data-photo]").innerHTML =
                    '<img src="' +
                    r(a.fit(R[+t.dataset.photoIndex], 1800)) +
                    '" alt="' +
                    r(d(w)) +
                    '">'),
                  s.querySelector("dialog").showModal()),
                t.hasAttribute("data-close") &&
                  s.querySelector("dialog").close(),
                t.hasAttribute("data-fullscreen") &&
                  (s.querySelector(".map-stage").classList.toggle("fullscreen"),
                  setTimeout(() => b?.invalidateSize(), 50)),
                t.hasAttribute("data-near"))
              ) {
                if (!navigator.geolocation)
                  return void (M.textContent =
                    "Location unavailable. Search by town." + (B?" Some records could not load. Reload to retry.":""));
                navigator.geolocation.getCurrentPosition(
                  (e) => {
                    ((A = [e.coords.latitude, e.coords.longitude]),
                      (q.value = ""),
                      _(!1),
                      b?.setView(A, 11));
                  },
                  () =>
                    (M.textContent =
                      "Location unavailable. Search by town instead." + (B?" Some records could not load. Reload to retry.":"")),
                  { timeout: 1e4 },
                );
              }
            }
          }));
        async function mountMap(){
        if(b||location.pathname!=="/map"||!i.isConnected)return;
        try {
          (window.L ||
            (await new Promise((e, t) => {
              const a = document.createElement("script");
              const timer = setTimeout(() => t(new Error("Map library timed out")), 10000);
              ((a.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"),
                (a.integrity =
                  "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="),
                (a.crossOrigin = ""),
                (a.onload = () => { clearTimeout(timer); e(); if(mapFailed)mountMap(); }),
                (a.onerror = () => { clearTimeout(timer); t(new Error("Map library failed")); }),
                document.head.append(a));
            })),
            (mapFailed=false),
            (b = L.map(s.querySelector(".map-canvas"), {
              zoomControl: !0,
            }).setView([54.4, -3.4], 6)),
            L.tileLayer(
              window.SR_MAP_TILE_URL ||
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              {
                maxZoom: 19,
                attribution:
                  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              },
            ).addTo(b),
            (v = L.layerGroup().addTo(b)),
            new ResizeObserver(() => b.invalidateSize()).observe(
              s.querySelector(".map-stage"),
            ));
        } catch {
          mapFailed = true;
        }
        _();
        }
        void mountMap();
        const T = [
            "title",
            "name",
            "displayTitle",
            "displayName",
            "town",
            "slug",
            "locationSlug",
            "canonicalUrl",
            "canonicalHotelUrl",
            "locationName",
            "destination",
            "category",
            "venueType",
            "brand",
            "latitude",
            "longitude",
            "active",
            "directoryReady",
            "cardReady",
            "status",
            "heroImage",
            "image",
            "imageVerified",
            "imageResearchStatus",
            "imageAccuracy",
            "address",
            "postcode",
            "website",
            "outboundUrl",
            "bookingUrl",
            "affiliateUrl",
            "offerUrl",
            "sourceUrl",
            "publicRatingStatus",
            "publicRating",
            "publicReviewCount",
            "familyFriendly",
            "ageRestriction",
            "exteriorImageAlt",
            "imageAlt",
            "shortDescription",
            "link-arcade-venues-title",
          ],
          N = new Set();
        (await Promise.allSettled(
          sourceCollections.map(
            async (e) => {
              try {
                for (let t = 0; ; t += 500) {
                  const i = await a.archiveQuery(
                    {
                      fields: T,
                      sort: [{ fieldName: "_id", order: "ASC" }],
                      paging: { limit: 500, offset: t },
                    },
                    null,
                    !1,
                    e,
                  );
                  if(location.pathname!=="/map")return;
                  if (
                    (i.dataItems.forEach((t) => {
                      const a = { ...t.data, _id: t.id, _collection: e };
                      const route=window.SR_ROUTES.outcome(a);
                      if(route.discoveryAllowed===false||['record_not_public','record_not_ready'].includes(route.code)||e==="AffiliateOffers"&&route.recordRole==='offer')return;
                      if(!route.ok&&route.code==='route_service_unavailable')B=Math.max(B,1);
                      null == a.latitude &&
                        g.has(a.slug) &&
                        ([a.latitude, a.longitude] = g.get(a.slug));
                      const i = window.SR_ROUTE_UI.key(a);
                      !1 === a.active ||
                        !1 === a.directoryReady ||
                        !1 === a.cardReady ||
                        /^(duplicate|merged|deleted|archived|closed|quarantin|suppress)/i.test(
                          a.status || "",
                        ) ||
                        N.has(i) ||
                        (N.add(i), f.push(a));
                    }),
                    _(0 === t),
                    i.dataItems.length < 500)
                  )
                    break;
                }
              } catch {
                B++;
              }
            },
          ),
        ),
          (sourceLoading=false),
          _());
        if(B<sourceCollections.length)window.SR_RUNTIME?.ready("map",mapNavigation);else window.SR_RUNTIME?.failed("map",mapNavigation);
      })();
    })();
  } catch (e) {
    console.warn(
      "SR snippet failed: Spin Raiders approved interactive map renderer 20260922",
      e,
    );
  }
})();

