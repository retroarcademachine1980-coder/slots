(function () {
  try {
    window.SR_SEARCH_VIEW = function (e, t) {
      "use strict";
      const viewNavigation=location.pathname+location.search,currentView=()=>location.pathname+location.search===viewNavigation&&(e.host?e.host.isConnected:e.isConnected);
      const {
          S: a,
          q: s,
          category: i = "",
          locationMode: n = !1,
          favourites: o = !1,
        } = t,
        r = a.e,
        l = (e) => e.displayTitle || e.title || e.displayName || e.name || "",
        c = (e) => e.locationName || e.destination || e.town || "",
        d = (e) => window.SR_CLASSIFY_PLACE(e),
        u = [["", "All Results", "all"],
          ...["venues","stays","food","attractions","cinemas","outdoors","fishing"].map(key=>window.SR_PLACE_TYPES.find(t=>t[0]===key).slice(0,3)),
          ...window.SR_PLACE_TYPES.filter(t=>!["venues","stays","food","attractions","cinemas","outdoors","fishing"].includes(t[0])).map(t=>t.slice(0,3)),
          ["machines","Fruit Machines","fruit-machines"],["destinations","Destinations","map"]];
      const searchIntent=window.SR_PARSE_PLACE_SEARCH(s);
      let requestedLocation=false;
      const sidePlace=searchIntent.category?searchIntent.query:'';
      const categoryButton=([key,label,icon])=>`<button data-cat="${key}" aria-pressed="${i===key}">${window.SR_ICON(icon,40)}<span>${label}</span></button>`;
      const categoryNavigation=u.slice(0,8).map(categoryButton).join("")+`<details class="more-categories"${u.slice(8).some(t=>t[0]===i)?" open":""}><summary>More categories</summary><div>${u.slice(8).map(categoryButton).join("")}</div></details>`;
      let p = [],
        m = [],
        h = 1,
        g = null,
        b = !1,
        f = i,
        y = 0,
        v = [];
      const $ = n ? 9 : 6,
        S = "sr-directory-favourites-v1";
      try {
        ((v = JSON.parse(localStorage.getItem(S) || "[]")),
          Array.isArray(v) || (v = []));
      } catch {}
      const w = (e) => e._collection + ":" + (e._id || e.slug || l(e)),
        x = (e) => {
          const t =
            "ClassicFruitMachines" === e._collection
              ? a.archiveQuality?.cardPhoto(e)
              : a.safePhoto?.({ ...e, heroImage: e.heroImage || e.image });
          return t ? a.fit(a.img(t), 480) : "";
        },
        C = (e) =>
          /^VERIFIED/i.test(e.publicRatingStatus || "") &&
          Number(e.publicRating) > 0 &&
          Number(e.publicReviewCount) > 0
            ? {
                score: Number(e.publicRating),
                count: Number(e.publicReviewCount),
                source: e.publicRatingSource || e.ratingSource || "",
              }
            : null,
        q = (e) => {
          const t = Number(e.latitude),
            a = Number(e.longitude);
          if (
            !g ||
            null == e.latitude ||
            null == e.longitude ||
            !Number.isFinite(t) ||
            !Number.isFinite(a)
          )
            return null;
          const s = (e) => (e * Math.PI) / 180,
            i =
              Math.sin(s(t - g[0]) / 2) ** 2 +
              Math.cos(s(g[0])) *
                Math.cos(s(t)) *
                Math.sin(s(a - g[1]) / 2) ** 2;
          return 7917.6 * Math.asin(Math.min(1, Math.sqrt(i)));
        },
        R = (e) => window.SR_ROUTES.href(e);
      function A(e) {
        if(!window.SR_ROUTE_UI.ready(e))return window.SR_ROUTE_UI.unavailable(e,{className:"result-card",image:x(e),title:l(e),town:c(e)});
        const t = x(e),
          a = C(e),
          s = w(e),
          i = !(!e.affiliateUrl && !e.affiliate),
          n = u.find((t) => t[0] === d(e))?.[1] || "Explore";
        return `<article class="result-card"><a class="card-image" href="${r(R(e))}"${i ? ' rel="sponsored noopener"' : ""}>${t ? `<img src="${r(t)}" alt="${r(e.exteriorImageAlt || e.imageAltText || e.imageAlt || l(e))}" loading="lazy" width="600" height="480">` : '<span class="image-empty">Photo being added</span>'}<span class="badge">${"541e7ebd-3e48-441e-9e21-c24b2233a0f0" === e._id ? "RAIDER RECOMMENDED" : r(n)}</span></a><button class="save" data-save="${r(s)}" aria-pressed="${v.includes(s)}" aria-label="Save ${r(l(e))}">${v.includes(s) ? "♥" : "♡"}</button><div class="card-copy"><h2><a href="${r(R(e))}"${i ? ' rel="sponsored noopener"' : ""}>${r(l(e))}<span aria-hidden="true">→</span></a></h2><p>⌖ ${r([c(e), e.postcode].filter(Boolean).join(", "))}${g && !b && null != q(e) ? " · " + q(e).toFixed(1) + " miles" : ""}</p>${"541e7ebd-3e48-441e-9e21-c24b2233a0f0" === e._id ? "<p><strong>Raider Score 4.9/5 · Hidden Gem</strong></p>" : ""}<p>${a ? `<span class="stars">★</span> ${a.score.toFixed(1)} (${a.count.toLocaleString("en-GB")})${a.source ? " · " + r(a.source) : ""}` : "No public rating yet."}</p><div class="tags">${((
          e,
        ) =>
          [
            e.venueType || e.category || e.manufacturer,
            !0 === e.familyFriendly ? "Family Friendly" : null,
            e.ageRestriction,
          ]
            .filter(Boolean)
            .slice(0, 3))(e)
          .map((e) => "<span>" + r(e) + "</span>")
          .join(
            "",
          )}</div></div></article>`;
      }
      e.innerHTML =
        "<style>" +
        window.SR_SEARCH_VIEW_CSS +
        "</style>" +
        `<main class="${n ? "location-mode" : ""}"><section class="search-hero"><img src="${n ? "https://static.wixstatic.com/media/3a517e_d1cae7805ea348a796fa77821f7f1f17~mv2.png/v1/fit/w_1000,h_1000,q_60,enc_auto/file.webp" : "https://static.wixstatic.com/media/3a517e_a97bdf5ade7f463bb2b47daf79dacbb3~mv2.png/v1/fit/w_1000,h_1000,q_60,enc_auto/file.webp"}" alt="${n ? "Explore the UK" : "Find your next adventure"} — Blackpool seaside header artwork" width="2048" height="683" fetchpriority="high"><div class="hero-controls"><form class="hero-form" action="/search" role="search"><span aria-hidden="true">⌕</span><label class="sr-only" for="search-query">Search for a town, venue or attraction</label><input id="search-query" name="q" value="${r(o ? "" : s)}" required maxlength="160" placeholder="Search for a town, venue or attraction…"><button class="button pink">Search →</button></form><nav class="hero-quick" aria-label="Popular searches">${["Blackpool", "Skegness", "Great Yarmouth", "Southend", "Hotels", "Arcades"].map((e) => `<a href="/search?q=${encodeURIComponent(e)}">${r(e)}</a>`).join("")}</nav></div></section><nav class="categories" aria-label="Results categories">${categoryNavigation}</nav><div class="content"><div class="results-heading"><div><h1>${o ? "Your saved places" : (n ? "Results for" : "Search results for") + " <em>" + r(s || "your next adventure") + "</em>"}</h1><p data-count role="status">${s ? "Finding matching places…" : "Enter a town, venue or attraction to begin."}</p></div><div class="toolbar"><label>Sort by <select data-sort><option value="relevance">Most relevant</option><option value="rating">Highest rated</option><option value="name">Name A–Z</option></select></label><button data-view="grid" aria-pressed="true">▦ Grid</button><button data-view="list" aria-pressed="false">☷ List</button><button class="map-link" data-toggle-map aria-pressed="true">◫ Show map</button></div></div><p class="result-status" data-message role="status"></p><div class="layout"><details class="filter-panel" open><summary>Filter results <span>⌄</span></summary><form data-filters><fieldset><legend>Category</legend>${u
          .slice(1)
          .map(
            ([e, t]) =>
              `<label><input type="checkbox" name="category" value="${e}"${f === e ? " checked" : ""}>${t}</label>`,
          )
          .join(
            "",
          )}</fieldset><fieldset><legend>Distance</legend><label class="range-label"><input type="range" name="distance" min="1" max="100" value="25" aria-label="Distance in miles"><output>Within 25 miles</output></label><button type="button" class="button reset" data-locate>Use my location</button><p class="small-status" data-location-status>Move the slider or tap “Use my location” to filter by distance.</p></fieldset><fieldset><legend>Rating</legend>${[4, 3, 2, 1].map((e) => `<label><input type="radio" name="rating" value="${e}"><span class="stars">${"★".repeat(e)}</span> & up</label>`).join("")}</fieldset><fieldset><legend>Facilities</legend>${[
          ["disabledAccess", "Disabled Access"],
          ["parking", "On-site Parking"],
          ["familyFriendly", "Family Friendly"],
          ["dogFriendly", "Dog Friendly"],
          ["wifi", "Free Wi-Fi"],
        ]
          .map(
            ([e, t]) =>
              `<label><input type="checkbox" name="facility" value="${e}">${t}</label>`,
          )
          .join(
            "",
          )}</fieldset><button class="button" type="submit">▽ Apply filters</button><button class="button reset" type="reset">↻ Reset filters</button></form></details><section aria-label="Search results"><div class="results-grid" data-results><div class="empty"><h2>${s ? "Finding places for your next day out…" : "Where would you like to go?"}</h2></div></div><nav class="pagination" aria-label="Results pages" data-pagination></nav></section><aside><section class="side-panel"><div class="side-heading"><h2>⌖ Results on map</h2><a href="/map?q=${encodeURIComponent(s)}">View larger map →</a></div><iframe class="map-frame" src="https://www.google.com/maps?q=${encodeURIComponent(searchIntent.category ? (searchIntent.query && !searchIntent.nearMe ? searchIntent.query : "United Kingdom") : (s || "United Kingdom"))}&output=embed" title="Map of ${r(s || "the UK")}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></section><div data-side-results></div><section class="plan-panel"><h2>Plan ${sidePlace ? "more in " + r(sidePlace) : "your next adventure"}</h2><p>Bring together places to visit, food and drink, and somewhere to stay.</p><a class="button yellow" href="${window.SR_ROUTES.viewPaths["trip"]}">Plan your day →</a></section></aside></div><a class="articles-link" href="/search?q=${encodeURIComponent(s)}&view=articles">Search articles and blog posts →</a></div></main>`;
      const k = e.querySelector("[data-filters]"),
        F = e.querySelector("[data-results]"),
        M = e.querySelector("[data-message]");
      function N() {
        if(!currentView())return;
        const t = new FormData(k),
          a = t.getAll("category"),
          s = t.getAll("facility"),
          i = Number(t.get("rating") || 0),
          n = Number(t.get("distance") || 25),
          r = e.querySelector("[data-sort]").value;
        ((m = p.filter(
          (e) =>
            (!e._id || e._routesLoading || window.SR_ROUTE_UI.ready(e)) &&
            (!g || b || !searchIntent.nearMe || window.SR_MATCH_PLACE_SEARCH(e,searchIntent)) &&
            (!o || v.includes(w(e))) &&
            (!a.length || window.SR_PLACE_CATEGORIES(e).some(category => a.includes(category))) &&
            (!i || (C(e)?.score || 0) >= i) &&
            s.every((t) =>
              "parking" === t
                ? e.parking === true ||
                  e.parkingAvailable === true ||
                  e.freeParking === true
                : "wifi" === t
                  ? e.wifi === true || e.freeWifi === true
                  : e[t] === true,
            ) &&
            (!g || (null === q(e) ? b : q(e) <= n)),
        )),
          "name" === r && m.sort((e, t) => l(e).localeCompare(l(t))),
          "rating" === r &&
            m.sort((e, t) => (C(t)?.score || 0) - (C(e)?.score || 0)),
          "relevance" === r &&
            g &&
            !b &&
            m.sort((e, t) => (q(e) ?? 1e9) - (q(t) ?? 1e9)),
          "relevance" === r &&
            (!g || b) && m.sort(
              (e, t) =>
                Number("541e7ebd-3e48-441e-9e21-c24b2233a0f0" === t._id) -
                Number("541e7ebd-3e48-441e-9e21-c24b2233a0f0" === e._id),
            ));
        const c = Math.max(1, Math.ceil(m.length / $));
        ((h = Math.max(1, Math.min(h, c))),
          (e.querySelector("[data-count]").textContent =
            m.length + (1 === m.length ? " result found" : " results found")),
          (F.innerHTML = m.length
            ? m
                .slice((h - 1) * $, h * $)
                .map(A)
                .join("")
            : '<div class="empty"><h2>No matching places</h2><p>Try another search or reset the filters.</p></div>'));
        const u = [
          ...new Set([
            1,
            ...Array.from({ length: 5 }, (e, t) => h - 2 + t).filter(
              (e) => e > 1 && e < c,
            ),
            c,
          ]),
        ];
        ((e.querySelector("[data-pagination]").innerHTML =
          c > 1
            ? `<button data-page="${h - 1}" ${1 === h ? "disabled" : ""}>← Previous</button>` +
              u
                .map(
                  (e, t) =>
                    `${t && e - u[t - 1] > 1 ? "<span>…</span>" : ""}<button data-page="${e}"${e === h ? ' aria-current="page"' : ""}>${e}</button>`,
                )
                .join("") +
              `<button data-page="${h + 1}" ${h === c ? "disabled" : ""}>Next →</button>`
            : ""),
          (M.textContent = y
            ? "Some categories could not load. Reload to try again."
            : ""),
          e
            .querySelectorAll("[data-cat]")
            .forEach((e) =>
              e.setAttribute(
                "aria-pressed",
                String(
                  1 === a.length
                    ? a[0] === e.dataset.cat
                    : !a.length && !e.dataset.cat,
                ),
              ),
            ));
      }
      let E;
      let srNearKey = "";
      async function srNear() {
        try {
          const api = window.SR_SEARCH_DATA;
          if (o || !g || !api || !api.rows) return;
          const key = g[0].toFixed(3) + "," + g[1].toFixed(3);
          if (srNearKey === key) return;
          srNearKey = key;
          const dl = 1.5,
            dn = 1.5 / Math.max(0.2, Math.cos((g[0] * Math.PI) / 180)),
            f = {
              $and: [
                { latitude: { $gt: g[0] - dl } },
                { latitude: { $lt: g[0] + dl } },
                { longitude: { $gt: g[1] - dn } },
                { longitude: { $lt: g[1] + dn } },
              ],
            },
            out = await Promise.allSettled(
              ["Venues", "NearbyAttractions", "HotelGuides", "FoodAndDrink", "AffiliateOffers"].map(
                (c) => api.rows(c, f),
              ),
            ),
            have = new Set(p.map(w)),
            add = out
              .flatMap((r) => ("fulfilled" === r.status ? r.value : []))
              .filter((x) => !have.has(w(x)) && window.SR_MATCH_PLACE_SEARCH(x,searchIntent));
          if(!currentView())return;
          if (add.length) {
            p = p.concat(add);
            N();
          }
        } catch (err) {
          console.warn("SR nearby search failed", err);
        }
      }
      function L() {
        if (!s || searchIntent.nearMe) return;
        const t = String(s).toLowerCase().trim(),
          a = t.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        let i = (window.SR_TRIP_COORDS || {})[a];
        if (!i) {
          const e = p
            .filter((e) => c(e).toLowerCase().trim() === t)
            .map((e) => [Number(e.latitude), Number(e.longitude)])
            .filter(
              (e) =>
                Number.isFinite(e[0]) && Number.isFinite(e[1]) && 0 !== e[0],
            );
          if (e.length) {
            const t = (e) =>
              (e = e.slice().sort((e, t) => e - t))[e.length >> 1];
            i = [t(e.map((e) => e[0])), t(e.map((e) => e[1]))];
          }
        }
        if (!i) return;
        ((g = i), (b = !0), (k.elements.distance.disabled = !1));
        const n = e.querySelector("[data-location-status]");
        n &&
          (n.textContent =
            "Distances are measured from " +
            s +
            ". Tap “Use my location” to measure from where you are.");
      }
      return (
        o &&
          (e.querySelector(".map-link").remove(),
          e.querySelector("aside .side-panel").remove(),
          (e.querySelector(".plan-panel h2").textContent =
            "Plan your next adventure"),
          e.querySelector(".articles-link").remove()),
        window.matchMedia?.("(max-width:600px)").matches &&
          (e.querySelector(".filter-panel").open = !1),
        k.addEventListener("submit", (e) => {
          (e.preventDefault(), (h = 1), N());
        }),
        k.addEventListener("reset", () => {
          ((g = null),
            (b = !1),
            (k.elements.distance.disabled = !1),
            (e.querySelector("[data-location-status]").textContent =
              "Move the slider or tap “Use my location” to filter by distance."),
            setTimeout(() => {
              (L(),
                (e.querySelector("output").textContent =
                  "Within " + k.elements.distance.value + " miles"),
                k
                  .querySelectorAll("input[name=category]")
                  .forEach((e) => (e.checked = !1)),
                (h = 1),
                N());
            }, 0));
        }),
        k.elements.distance.addEventListener("input", () => {
          if (!g) { const loc = e.querySelector("[data-locate]"); loc && loc.click(); }
          b = !1;
          srNear();
          const z = e.querySelector("[data-location-status]");
          z &&
            !z.textContent.includes("Places without a map location") &&
            (z.textContent += " Places without a map location are excluded.");
          ((e.querySelector("output").textContent =
            "Within " +
            k.elements.distance.value +
            (1 === Number(k.elements.distance.value) ? " mile" : " miles")),
            clearTimeout(E),
            (E = setTimeout(() => {
              ((h = 1), N());
            }, 150)));
        }),
        k.addEventListener("change", (e) => {
          "distance" !== e.target.name && ((h = 1), N());
        }),
        e.querySelector("[data-sort]").addEventListener("change", () => {
          ((h = 1), N());
        }),
        e.addEventListener("click", (t) => {
          const a = t.target.closest("button");
          if (a) {
            if (
              (a.hasAttribute("data-cat") &&
                (k
                  .querySelectorAll("input[name=category]")
                  .forEach((e) => (e.checked = e.value === a.dataset.cat)),
                (h = 1),
                N()),
              a.dataset.view &&
                (F.classList.toggle("list", "list" === a.dataset.view),
                e
                  .querySelectorAll("[data-view]")
                  .forEach((e) =>
                    e.setAttribute("aria-pressed", String(e === a)),
                  )),
              a.hasAttribute("data-toggle-map"))
            ) {
              const t = e.querySelector("main").classList.toggle("map-hidden");
              (a.setAttribute("aria-pressed", String(!t)),
                (a.textContent = t ? "◫ Show map" : "◫ Hide map"));
            }
            if (
              (a.dataset.page &&
                ((h = Number(a.dataset.page)),
                N(),
                e
                  .querySelector(".results-heading")
                  .scrollIntoView({ block: "start" })),
              a.dataset.save)
            ) {
              const e = a.dataset.save,
                t = v.includes(e) ? v.filter((t) => t !== e) : [...v, e];
              try {
                (localStorage.setItem(S, JSON.stringify(t)),
                  (v = t),
                  o && N(),
                  a.setAttribute("aria-pressed", String(v.includes(e))),
                  (a.textContent = v.includes(e) ? "♥" : "♡"),
                  (M.textContent = v.includes(e)
                    ? "Saved to favourites on this browser."
                    : "Removed from favourites."));
              } catch {
                M.textContent =
                  "Favourites could not be saved in this browser.";
              }
            }
          }
        }),
        (e.querySelector("[data-locate]").onclick = () => {
          const t = e.querySelector("[data-location-status]");
          navigator.geolocation
            ? ((t.textContent = "Finding your location…"),
              navigator.geolocation.getCurrentPosition(
                (e) => {
                  if(!currentView())return;
                  ((g = [e.coords.latitude, e.coords.longitude]),
                    (b = !1),
                    (srNearKey = ""),
                    srNear(),
                    (k.elements.distance.disabled = !1),
                    (t.textContent =
                      "Using your location. Distances are straight-line estimates."),
                    (h = 1),
                    N());
                },
                () =>
                  currentView() && (t.textContent =
                    "Location access was unavailable. Search by town instead."),
                { timeout: 1e4, maximumAge: 6e4 },
              ))
            : (t.textContent = "Location is unavailable in this browser.");
        }),
        {
          setRecords(t, a = 0) {
            if(!currentView())return;
            ((p = t),
              (y = a),
              g || L(),
              (function () {
                if (o) return;
                const t = p.filter((e) => "stays" === d(e) && x(e) && (g && null != q(e) ? q(e) <= 25 : !!s && String(c(e) || "").toLowerCase().trim() === String(s).toLowerCase().trim()) && window.SR_ROUTE_UI.ready(e) && window.SR_ROUTE_UI.discoverable(e)).slice(0, 4);
                e.querySelector("[data-side-results]").innerHTML = t.length
                  ? `<section class="side-panel"><div class="side-heading"><h2>Places to stay</h2><a href="/search?q=${encodeURIComponent(s)}&category=stays">View all →</a></div><div class="side-cards">${t.map((e) => `<a class="side-card" href="${r(R(e))}"${e.affiliateUrl ? ' rel="sponsored noopener"' : ""}><img src="${r(x(e))}" alt="${r(l(e))}" loading="lazy"><h3>${r(l(e))}</h3>${window.SR_ROUTE_UI.notice(e)}<p>${r(e.ctaLabel || e.ctaText || "View stay →")}</p></a>`).join("")}</div></section>`
                  : "";
              })(),
              N());
            if(!o&&!n&&searchIntent.nearMe&&!requestedLocation){requestedLocation=true;e.querySelector("[data-locate]").click();}
            window.SR_RUNTIME?.ready(n?"destination":"search",viewNavigation);
          },
          error() {
            if(!currentView())return;
            ((e.querySelector("[data-count]").textContent =
              "Search could not load."),
              (F.innerHTML =
                '<div class="empty"><h2>Unable to load results</h2><p>Please reload to try again.</p></div>'));
            window.SR_RUNTIME?.failed(n?"destination":"search",viewNavigation);
          },
        }
      );
    };
  } catch (e) {
    console.warn(
      "SR snippet failed: Spin Raiders approved search layout renderer 20260922",
      e,
    );
  }
})();

