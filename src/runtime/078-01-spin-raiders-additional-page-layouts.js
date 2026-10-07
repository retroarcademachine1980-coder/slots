(function () {
  try {
    (() => {
      "use strict";
      const e = new URLSearchParams(location.search),
        t =
          window.SR_CATEGORY_FROM_PATH() ||
          ({cinemas:"cinema",nature:"nature-outdoors",outdoors:"nature-outdoors","fishing-lakes":"fishing"}[e.get("explore")] || e.get("explore")) ||
          ("agc" === e.get("view") || "agc" === e.get("category")
            ? "agc"
            : "") ||
          ("offers" === e.get("view")
            ? "offers"
            : "/destination-recommendations" !==
                  location.pathname.replace(/\/$/, "") ||
                e.has("view") ||
                e.has("place")
              ? ""
              : "discover"),
        a = window.SR_EXTENDED_CONFIG || {};
      if (!a[t]) return;
      window.SR_EXTENDED_ACTIVE = !0;
      let s = 0;
      !(function e() {
        const o = window.SR_PUBLIC_DIRECTORY?.S,
          i = window.SR_PUBLIC_DIRECTORY?.D;
        if (
          !o?.archiveQuery ||
          !i ||
          !document.body ||
          !window.SR_TOPIC_ICON ||
          !window.SR_EXTENDED_CSS ||
          (a[t].offers && (!window.SR_SETUP_OFFERS || !window.SR_OFFERS_CSS))
        )
          return void (++s < 600 && setTimeout(e, 100));
        if (document.getElementById("sr-extended-pages")) return;
        const r = a[t],
          n = document.createElement("div");
        n.id = "sr-extended-pages";
        const l =
          document.getElementById("sr-seaside-root") ||
          document.getElementById("SITE_CONTAINER");
        l ? l.before(n) : document.body.append(n);
        const c = n.attachShadow({ mode: "open" }),
          d = o.e;
        n.style.cssText =
          "display:flow-root;position:relative;width:100%;background:#fff;clear:both";
        const u = document.createElement("style");
        ((u.textContent =
          "body:has(#sr-extended-pages){background:white!important}body:has(#sr-extended-pages) #SITE_CONTAINER,body:has(#sr-extended-pages) #sr-seaside-root,body:has(#sr-extended-pages) #sr-seaside-related,body:has(#sr-extended-pages) #raidertube-global-button,body:has(#sr-extended-pages) #sr-report-action{display:none!important}"),
          document.head.append(u),
          (document.title = r.title + " | Spin Raiders"));
        const p = (e) => e.displayTitle || e.title || e.name || "",
          y = (e) => e.locationName || e.destination || e.town || "",
          m = (e) =>
            e.region ||
            (["Scotland", "Wales", "Northern Ireland"].includes(e.country)
              ? e.country
              : ""),
          f = (e) => {
            const t = o.safePhoto?.({
              ...e,
              heroImage: e.heroImage || e.image,
            });
            return t ? o.fit(o.img(t), 640) : "";
          },
          g = (e) => window.SR_PLACE_HREF(e),
          h = (e) =>
            [
              p(e),
              e.category,
              e.venueType,
              e.locationName,
              e.destination,
              e.region,
              e.county,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase(),
          b = (e) => window.SR_TOPIC_ICON(e, 48);
        let v = !1,
          S = [],
          w = 1,
          $ = "",
          E = [];
        const A = "sr-directory-favourites-v1";
        try {
          ((E = JSON.parse(localStorage.getItem(A) || "[]")),
            Array.isArray(E) || (E = []));
        } catch {}
        const R = (e) => e._collection + ":" + e._id,
          x = (e) =>
            /^VERIFIED/i.test(e.publicRatingStatus || "") &&
            +e.publicRating > 0 &&
            +e.publicReviewCount > 0;
        function k(e, t = 0) {
          if(!window.SR_ROUTE_UI.ready(e))return window.SR_ROUTE_UI.unavailable(e,{image:f(e),title:p(e),town:y(e)});
          if (r.offers)
            return (function (e) {
              const t = f(e),
                a = window.SR_PLACE_HREF(e),
                s = e.offerText || e.offerTitle || e.shortDescription || "",
                o =
                  e.discountText ||
                  e.offerBadge ||
                  e.dealBadge ||
                  "PARTNER OFFER";
              return `<article class="card"><a class="photo" href="${d(g(e))}">${t ? `<img src="${d(t)}" alt="${d(e.imageAltText || e.imageAlt || p(e))}" loading="lazy">` : ""}<span class="badge">${d(o)}</span><span class="offer-town">⌖ ${d(y(e) || "UK")}</span></a><div class="copy"><h3><a href="${d(g(e))}">${d(p(e))}</a></h3><p class="offer-description">${d(s)}</p><a class="offer-cta" href="${d(a)}" aria-label="View hotel guide for ${d(p(e))}">→</a><div class="offer-tags"><span>${d(/hotel|stay/i.test(e.category || "") ? "Places to Stay" : e.category || "Days Out")}</span>${!0 === e.familyFriendly ? "<span>Family Friendly</span>" : ""}</div><p class="ad">Ad · Check terms and availability.</p></div></article>`;
            })(e);
          const a = f(e);
          return `<article class="card"><a href="${d(g(e))}" class="photo">${a ? `<img src="${d(a)}" alt="${d(e.exteriorImageAlt || e.imageAltText || e.imageAlt || p(e))}" loading="lazy">` : "<span>Photo being added</span>"}${r.nature ? "" : '<span class="badge">' + d(e.category || e.venueType || r.title) + "</span>"}</a><button class="save" data-save="${d(R(e))}" aria-pressed="${E.includes(R(e))}" aria-label="Save ${d(p(e))}">${E.includes(R(e)) ? "♥" : "♡"}</button><div class="copy"><h3><a href="${d(g(e))}">${d(p(e))}</a></h3><p>${d(y(e))}</p><p class="rating">${x(e) ? "<b>★ " + Number(e.publicRating).toFixed(1) + "</b> (" + Number(e.publicReviewCount).toLocaleString("en-GB") + " reviews)" : "No public rating yet."}</p><div class="tags">${[
            e.category || e.venueType,
            !0 === e.familyFriendly ? "Family friendly" : "",
            !0 === e.disabledAccess ? "Accessible entrance" : "",
          ]
            .filter(Boolean)
            .slice(0, 3)
            .map((e) => "<span>" + d(e) + "</span>")
            .join(
              "",
            )}</div>${r.offers ? '<p class="ad">Ad · Check current terms with the provider</p>' : ""}</div></article>`;
        }
        ((c.innerHTML =
          "<style>" +
          window.SR_EXTENDED_CSS +
          (r.offers ? window.SR_OFFERS_CSS : "") +
          "</style>" +
          `<main class="${r.nature ? "nature" : ""} ${r.directory ? "directory" : ""}"><section class="hero${r.heroArt ? " art" : ""}"${r.heroArt ? ` style="--art:url('${r.heroArt}');--ar:${r.heroAr || 3.5}"` : ""}><div class="hero-image"></div><div class="hero-copy"><h1>${d(r.title)}</h1><h2>${d(r.strap)}</h2><p>${d(r.intro)}</p>${r.adult ? '<strong class="age">18+</strong>' : ""}</div>${r.nature ? "" : '<form class="hero-search"><input aria-label="Search ' + d(r.title) + '" placeholder="Search a venue, town or location…"><button>Search →</button></form>'}</section><nav class="topics" aria-label="Browse categories">${r.topics.map((e, t) => `<button data-topic="${d(e)}" aria-pressed="false"><span aria-hidden="true">${b(e)}</span>${d(e)}</button>`).join("")}</nav><div class="wrap"><div class="layout"><aside class="filters"><input data-search aria-label="Filter ${d(r.title)} results" type="search" placeholder="Filter these results…"><div class="filter-heading"><h2>Filter by</h2><button data-clear>Clear all</button></div><details open><summary>Category</summary>${r.topics.map((e) => `<label><input type="checkbox" name="topic" value="${d(e)}">${d(e)}</label>`).join("")}</details><details><summary>Region / town</summary><select data-town><option value="">All locations</option></select></details><details><summary>Facilities</summary><label><input type="checkbox" name="facility" value="parking">Parking</label><label><input type="checkbox" name="facility" value="wifi">Wi-Fi</label><label><input type="checkbox" name="facility" value="dogFriendly">Dog friendly</label></details><details><summary>Accessibility</summary><label><input type="checkbox" name="facility" value="disabledAccess">Accessible entrance</label></details><details><summary>Family friendly</summary><label><input type="checkbox" name="facility" value="familyFriendly">Family friendly</label></details><button class="button" data-apply>Show results</button><a class="map-link" href="/map">Explore places on the map →</a><div class="side-inspire"><p>GOOD PLACES<br>HAPPIER PEOPLE ♡</p></div></aside><div class="results"><div class="heading"><div><h2>${r.nature ? "Featured Outdoor Destinations" : r.directory ? d(r.title) + " in the UK" : r.offers ? "Featured offers" : (r.listTitle ? d(r.listTitle) : "Featured " + d(r.title.toLowerCase()))}</h2><p data-count role="status">Finding places…</p></div><label class="sort">Sort by <select data-sort><option value="name">Name A–Z</option><option value="rating">Highest rated</option></select></label></div><div class="cards" data-results></div><nav class="pagination" aria-label="Results pages"></nav><section class="topic-section"><div class="heading"><h2>${r.nature ? "Popular Activities" : "Explore by category"}</h2></div><div class="activity-tiles" data-activities></div></section><section class="regions"><div class="heading"><h2>${r.nature ? "Explore by Region" : "Explore by destination"}</h2><a href="/map">View map →</a></div><div class="region-grid" data-regions></div></section></div></div><section class="trip-strip"><div><h2>Plan Your Perfect Day Out</h2><p>Add places to visit, somewhere to stay and food & drink to your trip.</p></div><a class="button yellow" href="${window.SR_ROUTES.viewPaths["trip"]}">Plan a trip →</a><span>⌖ <b>Discover</b><small>Amazing places across the UK</small></span><span>♡ <b>Save</b><small>Add to your favourites</small></span><span>▥ <b>Plan</b><small>Create your itinerary</small></span></section><p data-status role="status"></p></div></main>`),
          r.offers &&
            window.SR_SETUP_OFFERS(c, {
              e: d,
              onAll: () => {
                ((v = !0), (w = 1), _());
              },
              onTown: (e) => {
                ((C.value = e),
                  (w = 1),
                  _(),
                  c
                    .querySelector(".results")
                    .scrollIntoView({ block: "start" }));
              },
            }));
        const C = c.querySelector("[data-search]"),
          T = c.querySelector("[data-town]"),
          F = c.querySelector("[data-sort]"),
          I = (e, t) => {
            const a = h(e);
            if (/^All /.test(t)) return !0;
            return new RegExp(
              {
                Beaches: "beach",
                "Places to Stay": "hotel|stay|accommodation|holiday",
                "Days Out": "attraction|day out",
                "Short Breaks": "hotel|holiday|break",
                "Eat & Drink": "food|drink|pub|restaurant|cafe",
                "Seasonal Deals": "seasonal|christmas|summer|winter|pantomime",
                Travel: "travel|transfer|train",
                "Family Fun": "family|attraction",
                "Tours & Experiences": "tour|experience",
                "Food & Drink": "food|drink|pub|restaurant|cafe",
                "Walking & Hiking": "walk|hiking|trail",
                "Parks & Gardens": "garden|park",
                "Forests & Woodlands": "forest|woodland",
                Wildlife: "wildlife|zoo|nature",
                "National Parks": "national park",
                "Nature Reserves": "reserve",
                "Water Activities": "water|lake|boat",
                "Family Friendly": "family",
                "Independent AGCs": "^(?![\\s\\S]*(?:merkur|admiral|luxury leisure|quicksilver|cashino|game nation))[\\s\\S]*adult gaming",
                "Independent Arcades": "arcade",
                "Classic Machines": "classic|retro|fruit",
                "Modern Slots": "adult gaming|slots",
                "Classic Arcades": "classic|retro",
                "Seaside Stays": "hotel|guest house",
                "Family Hotels": "hotel",
                "EV Charging": "service",
                "All Services": "service",
                "Machine Archive": "classic|fruit",
              }[t] ||
                t.replace(/s$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "i",
            ).test(a);
          };
        const requestedTown = (new URLSearchParams(location.search).get("town") || new URLSearchParams(location.search).get("q") || "").trim();
        if(requestedTown){C.value=requestedTown;const top=c.querySelector('.hero-search input');if(top)top.value=requestedTown;}
        const hasDeal = row => !!(row.offerTitle || row.discountText || row.dealBadge || row.offerBadge);

        const restoreKey="sr-directory-return:"+t+":"+requestedTown;
        let restored=false;
        function _() {
          if(!restored && S.length){restored=true;try{const saved=JSON.parse(sessionStorage.getItem(restoreKey)||'null');if(saved){C.value=saved.q||'';T.value=saved.town||'';F.value=saved.sort||'name';w=saved.page||1;$=saved.region||'';for(const el of c.querySelectorAll('[name=topic],[name=facility]'))el.checked=(saved[el.name]||[]).includes(el.value);const top=c.querySelector('.hero-search input');if(top)top.value=C.value;}}catch{}}
          const e = C.value.trim().toLowerCase().split(/\s+/).filter(Boolean),
            t = [...c.querySelectorAll("[name=topic]:checked")].map(
              (e) => e.value,
            ),
            a = [...c.querySelectorAll("[name=facility]:checked")].map(
              (e) => e.value,
            ),
            s = T.value;
          if(restored)try{sessionStorage.setItem(restoreKey,JSON.stringify({q:C.value,town:s,sort:F.value,page:w,region:$,topic:t,facility:a}))}catch{}
          let o = S.filter(
            (o) =>
              e.every((e) => h(o).includes(e)) &&
              (!s || y(o) === s) &&
              (!$ || m(o) === $) &&
              (!t.length || t.some((e) => I(o, e))) &&
              a.every((e) => !0 === o[e]),
          );
          if(r.offers){
            c.querySelector('.affiliate-section')?.remove();
            window.SR_RENDER_AFFILIATES(c, o.filter(row => !hasDeal(row)), {e:d,picture:f,title:p,town:y});
            o = o.filter(hasDeal);
          }
          o.sort((e, t) =>
            "rating" === F.value
              ? (x(t) ? +t.publicRating : 0) - (x(e) ? +e.publicRating : 0)
              : (r.offers
                  ? Number(!!t.discountText) - Number(!!e.discountText)
                  : 0) || p(e).localeCompare(p(t)),
          );
          const i = r.offers
              ? v
                ? 12
                : 4
              : r.nature
                ? 6
                : r.directory
                  ? 9
                  : 9,
            n = Math.max(1, Math.ceil(o.length / i));
          ((w = Math.max(1, Math.min(w, n))),
            (c.querySelector("[data-count]").textContent =
              o.length + (r.offers ? " offers found" : " places found")),
            (c.querySelector("[data-apply]").textContent =
              "Show results (" + o.length + ")"),
            (c.querySelector("[data-results]").innerHTML =
              o
                .slice((w - 1) * i, w * i)
                .map(k)
                .join("") ||
              '<p class="empty">No places match these filters. Try clearing the filters.</p>'),
            (c.querySelector(".pagination").innerHTML =
              n > 1
                ? `<button data-page="${w - 1}" ${1 === w ? "disabled" : ""}>← Previous</button><span>${w} / ${n}</span><button data-page="${w + 1}" ${w === n ? "disabled" : ""}>Next →</button>`
                : ""),
            c
              .querySelectorAll("[data-topic]")
              .forEach((e) =>
                e.setAttribute(
                  "aria-pressed",
                  String(
                    t.includes(e.dataset.topic) ||
                      (!t.length && /^All /.test(e.dataset.topic)),
                  ),
                ),
              ));
        }
        (c.addEventListener("click", (e) => {
          const t = e.target.closest("button");
          var a;
          if (
            t &&
            (t.dataset.topic &&
              ((a = t.dataset.topic),
              c
                .querySelectorAll("[name=topic]")
                .forEach(
                  (e) => (e.checked = e.value === a && !/^All /.test(a)),
                ),
              (w = 1),
              _()),
            t.dataset.page &&
              ((w = +t.dataset.page),
              _(),
              c.querySelector(".results").scrollIntoView({ block: "start" })),
            t.dataset.region &&
              (r.nature ? ($ = t.dataset.region) : (T.value = t.dataset.region),
              (w = 1),
              _(),
              c.querySelector(".results").scrollIntoView({ block: "start" })),
            t.hasAttribute("data-apply") && ((w = 1), _(), c.querySelector(".results").scrollIntoView({block:"start"})),
            t.hasAttribute("data-clear") &&
              (c
                .querySelectorAll("input[type=checkbox]")
                .forEach((e) => (e.checked = !1)),
              (C.value = ""),
              (c.querySelector(".hero-search input") && (c.querySelector(".hero-search input").value = "")),
              (T.value = ""),
              ($ = ""),
              (w = 1),
              _()),
            t.dataset.save)
          ) {
            const e = t.dataset.save;
            try {
              ((E = E.includes(e) ? E.filter((t) => t !== e) : [...E, e]),
                localStorage.setItem(A, JSON.stringify(E)),
                (t.textContent = E.includes(e) ? "♥" : "♡"),
                t.setAttribute("aria-pressed", String(E.includes(e))),
                (c.querySelector("[data-status]").textContent = E.includes(e)
                  ? "Saved on this browser."
                  : "Removed from favourites."));
            } catch {
              c.querySelector("[data-status]").textContent =
                "Saving is unavailable in this browser.";
            }
          }
        }),
          (F.onchange = () => {
            ((w = 1), _());
          }),
          (C.oninput = () => {
            const top = c.querySelector(".hero-search input"); if(top) top.value = C.value;
            ((w = 1), _());
          }));
        const N = c.querySelector(".hero-search");
        C.addEventListener("keydown", event => { if(event.key === "Enter"){event.preventDefault();w=1;_();c.querySelector(".results").scrollIntoView({block:"start"});} });
        if(N) N.querySelector("input").addEventListener("input",event=>{C.value=event.target.value;w=1;_();});
        (N &&
          (N.onsubmit = (e) => {
            (e.preventDefault(),
              (C.value = N.querySelector("input").value),
              (w = 1),
              _(),
              c.querySelector(".results").scrollIntoView({ block: "start" }));
          }),
          (async () => {
            try {
              const e = r.words.length
                  ? {
                      $or: r.words.flatMap((e) =>
                        ["category", "venueType", "title", "name"].map((t) => ({
                          [t]: { $contains: e },
                        })),
                      ),
                    }
                  : {},
                t = r.offers
                  ? ["HotelOffers", "AffiliateOffers"]
                  : r.nature || r.discover
                    ? ["NearbyAttractions", "AffiliateOffers"]
                    : [
                        "Venues",
                        "NearbyAttractions",
                        "HotelGuides",
                        "FoodAndDrink",
                        "AffiliateOffers",
                      ],
                a = r.offers ? await window.SR_CANONICAL.offerOutcomes(i) : await Promise.allSettled(t.map((t) => i.rows(t, e).then(rows=>window.SR_ROUTE_UI.businessRows(rows,t)))),
                s = new Set();
              S = a
                  .flatMap((e) => ("fulfilled" === e.status ? e.value : []))
                  .filter((e) => {
                    if(!window.SR_ROUTE_UI.discoverable(e))return false;
                    const t = window.SR_ROUTE_UI.key(e) + (r.offers ? "|" + window.SR_CANONICAL.outbound(e) : "");
                    return (
                      !(
                        s.has(t) ||
                        (r.exclude && h(e).includes(r.exclude.toLowerCase())) ||
                        (r.agcOnly && /family|pier|bowl|bingo|holiday|theme park|amusement arcade|amusement venue|amusement centre|adult gaming area/i.test(String(e.venueType || ""))) ||
                        (r.nature && !["outdoors","beaches","fishing"].includes(window.SR_CLASSIFY_PLACE(e))) ||
                        (r.title === "Cinemas" && window.SR_CLASSIFY_PLACE(e) !== "cinemas") ||
                        (r.offers && (!window.SR_CANONICAL.offerLive(e) || !window.SR_CANONICAL.hotelHref(e))) ||
                        ((e.validUntil || e.offerValidUntil) &&
                          new Date(
                            (e.validUntil || e.offerValidUntil) + " 23:59:59",
                          ) < new Date())
                      ) && (s.add(t), !0)
                    );
                  });
              const o = S.filter(row=>!["AffiliateOffers","FoodAndDrink"].includes(row._collection)).filter(f).sort(
                (e, t) =>
                  Number(
                    /national park|nature reserve/i.test(t.category || ""),
                  ) -
                  Number(
                    /national park|nature reserve/i.test(e.category || ""),
                  ),
              );
              (o.length &&
                !r.offers &&
                ((c.querySelector(".hero-image").style.backgroundImage =
                  'url("' + f(o[0]).replace(/"/g, "%22") + '")'),
                (c.querySelector(".side-inspire").style.backgroundImage =
                  'linear-gradient(transparent,#001b41bb),url("' +
                  f(o[1] || o[0]).replace(/"/g, "%22") +
                  '")')),
                (T.innerHTML =
                  '<option value="">All locations</option>' +
                  [...new Set(S.map(y).filter(Boolean))]
                    .sort()
                    .map((e) => "<option>" + d(e) + "</option>")
                    .join("")),
                (c.querySelector("[data-activities]").innerHTML = r.topics
                  .slice(r.nature ? 1 : 0, r.nature ? 7 : 6)
                  .map((e) => {
                    const t = o.find((t) => I(t, e));
                    return `<button data-topic="${d(e)}">${t ? `<img src="${d(f(t))}" alt="${d(p(t))}" loading="lazy">` : `<span class="activity-icon">${b(e)}</span>`}<strong>${d(e)}</strong></button>`;
                  })
                  .join("")));
              const n = r.nature ? m : y,
                l = [...new Map(o.map((e) => [n(e), e])).values()]
                  .filter((e) => n(e))
                  .slice(0, 12);
              ((c.querySelector("[data-regions]").innerHTML = l
                .map(
                  (e) =>
                    `<button data-region="${d(n(e))}"><img src="${d(f(e))}" alt="${d(p(e))}" loading="lazy"><strong>${d(n(e))}</strong></button>`,
                )
                .join("")),
                r.offers &&
                  (c.querySelector("[data-activities]").innerHTML = r.topics
                    .slice(1)
                    .map((e) => {
                      const t = o.find((t) => I(t, e)),
                        a =
                          window.SR_OFFER_CATEGORY_IMAGES[e] ||
                          (t ? [f(t), p(t)] : null);
                      return `<button data-topic="${d(e)}">${a ? `<img src="${d(a[0])}" alt="${d(a[1])}" loading="lazy">` : ""}<strong>${d(e)}</strong></button>`;
                    })
                    .join("")),
                a.some((e) => "rejected" === e.status) &&
                  (c.querySelector("[data-status]").textContent =
                    "Some categories could not load. Reload to try again."),
                _());
            } catch {
              c.querySelector("[data-count]").textContent =
                "Places could not load. Please reload to try again.";
            }
          })());
      })();
    })();
  } catch (e) {
    console.warn("SR snippet failed: Spin Raiders additional page layouts", e);
  }
})();

