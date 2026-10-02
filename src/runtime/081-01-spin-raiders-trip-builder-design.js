(function () {
  try {
    window.SR_TRIP_BUILDER = function (t) {
      "use strict";
      const {
          root: e,
          content: a,
          S: n,
          D: o,
          e: s,
          get: i,
          put: r,
          href: l,
          photo: d,
          params: p,
        } = t,
        c = {
          stops: [],
          hotels: [],
          people: 1,
          days: 1,
          nights: 0,
          rooms: 1,
          roomRate: 0,
          food: 0,
          activities: 0,
          extras: 0,
          miles: 0,
          mileCost: 0,
        };
      let m = t.trip || { ...c },
        u = p.get("trip") || m.savedId || crypto.randomUUID(),
        y = t.allTrips.find((t) => t.id === u),
        h = y?.title || m.tripTitle || "My next adventure",
        v = y?.startDate || m.startDate || "",
        b = y?.endDate || m.endDate || "",
        g = [];
      if (
        (y && (m = structuredClone(y.plan)),
        p.has("new") &&
          ((m = { ...c, stops: [], hotels: [] }),
          (u = crypto.randomUUID()),
          (h = "My next adventure"),
          (v = b = "")),
        p.get("shared"))
      )
        try {
          const t = JSON.parse(
            new TextDecoder().decode(
              Uint8Array.from(atob(p.get("shared")), (t) => t.charCodeAt(0)),
            ),
          );
          t.plan &&
            Array.isArray(t.plan.stops) &&
            t.plan.stops.length <= 30 &&
            ((m = { ...c, ...t.plan }),
            (h = String(t.title || "Shared trip").slice(0, 140)),
            (v = t.startDate || ""),
            (b = t.endDate || ""),
            (u = crypto.randomUUID()));
        } catch {}
      m = {
        ...c,
        ...m,
        stops: Array.isArray(m.stops) ? m.stops : [],
        hotels: Array.isArray(m.hotels) ? m.hotels : [],
      };
      for (const t of Object.keys(c).filter((t) => "number" == typeof c[t])) {
        const e = ["people", "days", "rooms"].includes(t) ? 1 : 0;
        m[t] = Number.isFinite(+m[t])
          ? Math.max(e, Math.min("days" === t ? 14 : 1e5, +m[t]))
          : c[t];
      }
      ((m.stops = m.stops.map((t) => ({
        ...t,
        day: Math.max(1, Math.min(14, +t.day || 1)),
        time: /^\d{2}:\d{2}$/.test(t.time || "") ? t.time : "",
      }))),
        (m.days = Math.max(1, Math.min(14, +m.days || 1))));
      const f = (t) =>
          new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0,
          }).format(t),
        $ = [
          ["roomRate", "Accommodation £ / room / night"],
          ["food", "Food £ / person / day"],
          ["activities", "Activities £ / person / day"],
          ["miles", "Driving miles (whole trip)"],
          ["mileCost", "Fuel allowance £ / mile"],
          ["extras", "Other costs £"],
        ];
      a.innerHTML = `<nav class="steps" aria-label="Trip steps">${[
        ["settings", "Plan", "Add places & dates"],
        ["itinerary", "Build", "Arrange your itinerary"],
        ["costs", "Review", "Check your budget"],
        ["save", "Save", "Keep or share your trip"],
      ]
        .map(
          ([t, e, a], n) =>
            `<button data-jump="${t}"><b>${n + 1}</b><span>${e}<small>${a}</small></span></button>`,
        )
        .join(
          "",
        )}</nav><section id="settings" class="panel"><form class="settings"><label style="flex-basis:100%">Trip name<input name="title" value="${s(h)}" maxlength="140"></label><label>Start date<input type="date" name="start" value="${s(v)}"></label><label>End date<input type="date" name="end" value="${s(b)}"></label><label>People<input type="number" name="people" min="1" max="100" value="${m.people}"></label><label>Days<input type="number" name="days" min="1" max="14" value="${m.days}"></label><label>Nights<input type="number" name="nights" min="0" max="30" value="${m.nights}"></label><label>Rooms<input type="number" name="rooms" min="1" max="30" value="${m.rooms}"></label></form></section><div class="builder"><section class="panel add-panel"><h2>Add to Your Trip</h2><form class="add-search"><input aria-label="Search places to add" placeholder="Search places, hotels, attractions…" value="${s(p.get("town") || "")}" required><button aria-label="Search places">⌕</button></form><style>.add-types button.on{background:#071b58;color:#fff;border-color:#071b58}</style><div class="add-types">${[
        ["All", "all"],
        ["Places to Stay", "stay"],
        ["Eat & Drink", "eat"],
        ["Things to Do", "do"],
        ["Arcades & Bowling", "arcade"],
        ["Towns", "town"],
        ["Cinemas", "type:cinemas"],
        ["Nature & Outdoors", "type:outdoors"],
        ["Fishing Lakes", "type:fishing"],
      ]
        .map(
          ([t, e]) =>
            `<button data-category="${e}"${e === "all" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"'}>${t}</button>`,
        )
        .join(
          "",
        )}</div><label>More categories<select data-more-categories aria-label="More trip categories"><option value="">Choose a category</option>${window.SR_PLACE_TYPES.map(([key,label])=>`<option value="type:${key}">${s(label)}</option>`).join("")}</select></label><p class="muted">Type any town or place, then pick what you want: somewhere to stay, eat &amp; drink, things to do or arcades.</p><div class="add-results" role="region" aria-label="Places to add"></div></section><section id="itinerary"><div class="heading"><h2>Your Itinerary</h2><button class="button white" data-add-day>+ Add day</button></div><div data-days></div>${m.hotels.length ? '<section class="panel"><h3>Previously saved stays</h3>' + m.hotels.map((t, e) => "<p>" + s(t.name) + ' <button class="button white" data-old-hotel="' + e + '">Add to itinerary</button></p>').join("") + "</section>" : ""}</section><aside><section class="panel"><div class="heading"><h2>Trip Map</h2><a data-route target="_blank" rel="noopener">Driving route ↗</a></div><iframe class="map" title="Trip destination map" loading="lazy"></iframe><p class="muted">Open the driving route for current road distances and journey times.</p></section><section class="panel" id="costs"><h2>Estimated Costs</h2><p class="muted">Add your hotel and travel quotes. Fuel uses the latest UK weekly average.</p><form class="budget">${$.map(([t, e]) => `<label>${e}<input type="number" name="${t}" min="0" max="100000" step="${"mileCost" === t ? ".01" : "1"}" value="${m[t]}"></label>`).join("")}</form><div data-total></div></section><div class="aside-actions" id="save"><button class="button green" data-save>▣ Save Trip</button><button class="button white" data-share>Share Trip</button><button class="button white" data-print>Print / Save PDF</button><a class="button white" href="${l("my-trips")}">My Trips →</a><button class="button white" data-export>Export plan</button></div><p class="status" data-status role="status"></p><p class="muted">Your plans are saved on this browser. Saving does not make a booking.</p></aside></div>`;
      const w = (t) => (e.querySelector("[data-status]").textContent = t);
      window.SR_TRIP_ATTACH = () => window.SR_TRIP_COSTS?.(e, m, A, S, f);
      function x() {
        ((h =
          e.querySelector("[name=title]").value.trim() || "My next adventure"),
          (v = e.querySelector("[name=start]").value),
          (b = e.querySelector("[name=end]").value));
        for (const t of [
          "people",
          "days",
          "nights",
          "rooms",
          ...$.map((t) => t[0]),
        ]) {
          const a = e.querySelector("[name=" + t + "]");
          m[t] = Math.max(+a.min, Math.min(+a.max, +a.value || +a.min));
        }
        return {
          id: u,
          title: h,
          startDate: v,
          endDate: b,
          updatedAt: new Date().toISOString(),
          plan: { ...m, tripTitle: h, savedId: u, startDate: v, endDate: b },
        };
      }
      function S() {
        try {
          r("sr-trip-v1", x().plan);
        } catch {
          w(
            "Browser storage is unavailable. Export or print your plan to keep it.",
          );
        }
      }
      function A() {
        const t =
          m.nights * m.rooms * m.roomRate +
          m.days * m.people * m.food +
          m.days * m.people * m.activities +
          m.miles * m.mileCost +
          m.extras;
        ((e.querySelector("[data-total]").innerHTML =
          '<div class="total"><span>Estimated Total</span><strong>' +
          f(t) +
          '</strong></div><p class="muted">' +
          f(t / m.people) +
          " per person · " +
          (m.miles
            ? "Includes your fuel allowance."
            : "Add mileage or fares to include travel.") +
          "</p>"),
          window.SR_TRIP_ATTACH());
      }
      function D() {
        e.querySelector("[data-days]").innerHTML = Array.from(
          { length: m.days },
          (t, e) => {
            const a = e + 1,
              n = m.stops
                .map((t, e) => ({ ...t, index: e }))
                .filter((t) => t.day === a),
              o = v ? new Date(v + "T12:00:00") : null;
            return (
              o && o.setDate(o.getDate() + e),
              `<section class="day"><h3>Day ${a}${o ? " — " + o.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : ""}</h3>${n.length ? n.map((t) => `<article class="stop">${d(t) ? `<img src="${s(d(t))}" alt="${s(t.name)}" loading="lazy">` : '<span aria-hidden="true">⌖</span>'}<input type="time" data-time="${t.index}" value="${s(t.time)}" aria-label="Time for ${s(t.name)}"><div><strong>${s(t.name)}</strong><small>${s(t.town || t.category || "")}</small></div><div class="stop-controls"><select data-day="${t.index}" aria-label="Day for ${s(t.name)}">${Array.from({ length: m.days }, (e, a) => `<option value="${a + 1}" ${a + 1 === t.day ? "selected" : ""}>Day ${a + 1}</option>`).join("")}</select><button data-up="${t.index}" ${0 === t.index ? "disabled" : ""} aria-label="Move ${s(t.name)} earlier">↑</button><button data-down="${t.index}" ${t.index === m.stops.length - 1 ? "disabled" : ""} aria-label="Move ${s(t.name)} later">↓</button><button data-remove="${t.index}" aria-label="Remove ${s(t.name)}">×</button></div></article>`).join("") : '<p class="muted" style="padding:15px">Add a place to start this day.</p>'}</section>`
            );
          },
        ).join("");
        const t = m.stops.at(-1),
          a = m.stops[0],
          n = t
            ? [t.name, t.town].filter(Boolean).join(", ")
            : "United Kingdom";
        ((e.querySelector(".map").src =
          "https://www.google.com/maps?q=" +
          encodeURIComponent(n) +
          "&output=embed"),
          (e.querySelector("[data-route]").href =
            a && t
              ? "https://www.google.com/maps/dir/?api=1&origin=" +
                encodeURIComponent(
                  [a.name, a.town].filter(Boolean).join(", "),
                ) +
                "&destination=" +
                encodeURIComponent(n) +
                (m.stops.length > 2
                  ? "&waypoints=" +
                    encodeURIComponent(
                      m.stops
                        .slice(1, -1)
                        .map((t) => [t.name, t.town].filter(Boolean).join(", "))
                        .join("|"),
                    )
                  : "")
              : "https://www.google.com/maps"),
          A());
      }
      let K = "all";
      const KL = {
        town: "Town",
        stay: "Stay",
        eat: "Eat & Drink",
        do: "Things to do",
        arcade: "Arcade",
      };
      function Q(t) {
        const key = window.SR_CLASSIFY_PLACE(t);
        return key==='destinations'?'town':['stays','holiday'].includes(key)?'stay':key==='food'?'eat':['venues','agc','bowling','arcadebars'].includes(key)?'arcade':'do';
      }
      let searchSequence=0;
      async function T(t) {
        const sequence=++searchSequence;
        const parsedSearch=window.SR_PARSE_PLACE_SEARCH(t);
        const selectedCategory=K==="all"&&parsedSearch.category?"type:"+parsedSearch.category:K;
        const a = e.querySelector(".add-results");
        t = String(parsedSearch.category ? parsedSearch.query : t || "").replace(/\b(in|near|at)\b/gi," ").trim();
        if (!t && !selectedCategory.startsWith("type:")) {
          a.innerHTML =
            "<p>Type a town or place first, e.g. Grimsby, Blackpool or Whitby.</p>";
          return;
        }
        a.textContent = "Finding places…";
        const i = {
            $and: t
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 6)
              .map((t) => ({
                $or: [
                  "title",
                  "name",
                  "displayTitle",
                  "locationName",
                  "destination",
                  "category",
                  "venueType",
                  "unifiedSearchText",
                ].map((e) => ({ [e]: { $contains: t } })),
              })),
          },
          C = {
            all: [
              "Locations",
              "HotelGuides",
              "NearbyAttractions",
              "Venues",
              "FoodAndDrink",
              "AffiliateOffers",
            ],
            town: ["Locations"],
            stay: ["HotelGuides", "NearbyAttractions"],
            eat: ["FoodAndDrink", "NearbyAttractions", "AffiliateOffers"],
            do: ["NearbyAttractions", "AffiliateOffers"],
            arcade: ["Venues", "NearbyAttractions", "AffiliateOffers"],
          }[K] || ["Venues","NearbyAttractions","HotelGuides","FoodAndDrink","AffiliateOffers"];
        try {
          const r = await Promise.allSettled(C.map((t) => o.rows(t, i).then(rows=>window.SR_ROUTE_UI.businessRows(rows,t))));
          if(sequence!==searchSequence) return;
          const failures=r.filter(t=>t.status==="rejected").length;
          if(failures===C.length){a.textContent="Places could not load. Please retry.";return;}
          const
            u = new Set(),
            l = r
              .flatMap((t) => ("fulfilled" === t.status ? t.value : []))
              .filter((t) => {
                const a = window.SR_ROUTE_UI.key(t);
                return !u.has(a) && (u.add(a), !0);
              })
              .map((t) => ((t._kind = Q(t)), t))
              .filter((t) => selectedCategory === "all" || (selectedCategory.startsWith("type:") ? window.SR_CLASSIFY_PLACE(t) === selectedCategory.slice(5) : t._kind === selectedCategory)),
            d = { town: [], stay: [], eat: [], do: [], arcade: [] };
          l.forEach((t) => d[t._kind].push(t));
          Object.values(d).forEach((t) =>
            t.sort(
              (a, e) =>
                +!!n.safePhoto(e) - +!!n.safePhoto(a) ||
                (+e.publicRating || 0) - (+a.publicRating || 0),
            ),
          );
          if (K === "all") {
            g = d.town.slice(0, 2);
            const f = ["stay", "eat", "do", "arcade"];
            for (let t = 0; g.length < 24 && t < 30; t++)
              for (const e of f) d[e][t] && g.length < 24 && g.push(d[e][t]);
          } else g = (selectedCategory.startsWith("type:") ? l : d[selectedCategory]).slice(0, 30);
          const h =
            K === "all"
              ? Object.entries(d)
                  .filter(([t, e]) => e.length && t !== "town")
                  .map(([t, e]) => KL[t] + " " + e.length)
                  .join(" · ")
              : "";
          a.innerHTML =
            (h ? `<p class="muted">Found: ${s(h)}</p>` : "") +
            (failures ? '<p role="status">Some categories could not load. Search again to retry.</p>' : "") +
            (g
              .map(
                (t, e) =>
                  `<article>${n.safePhoto(t) ? `<img src="${s(n.fit(n.safePhoto(t), 700))}" alt="${s(t.displayTitle || t.title || t.name)}" loading="lazy">` : ""}<p class="muted" style="margin:0;font-weight:800;text-transform:uppercase;font-size:11px;letter-spacing:.08em">${s(KL[t._kind])}</p><h3>${s(t.displayTitle || t.title || t.name)}</h3><p class="muted">${s(t.locationName || t.destination || "")}</p>${window.SR_ROUTE_UI.ready(t)?`<button data-add="${e}">Add to trip +</button>`:'<p role="status">Guide temporarily unavailable</p>'}</article>`,
              )
              .join("") ||
              `<p>No ${K === "all" ? "" : s((KL[K] || window.SR_PLACE_TYPES.find(t=>"type:"+t[0]===K)?.[1] || "place").toLowerCase()) + " "}matches for “${s(t)}” yet. Try a nearby town or choose All.</p>`);
        } catch {
          if(sequence===searchSequence) a.textContent = "Places could not load. Please retry.";
        }
      }
      e.querySelector("[data-more-categories]").addEventListener("change",event=>{
        K=event.target.value||"all";
        e.querySelectorAll("[data-category]").forEach(button=>{const active=button.dataset.category===K;button.classList.toggle("on",active);button.setAttribute("aria-pressed",String(active));});
        T(e.querySelector(".add-search input").value);
      });
      ((e.querySelector(".add-search").onsubmit = (t) => {
        (t.preventDefault(), T(t.target.querySelector("input").value));
      }),
        (e.querySelector(".settings").onsubmit = (t) => t.preventDefault()),
        (e.querySelector(".budget").onsubmit = (t) => t.preventDefault()),
        e.addEventListener("change", (t) => {
          const a = t.target;
          (a.closest(".settings") &&
            ("title" === a.name
              ? (h = a.value.trim() || "My next adventure")
              : "start" === a.name
                ? (v = a.value)
                : "end" === a.name
                  ? (b = a.value)
                  : ((m[a.name] = Math.min(
                      +a.max,
                      Math.max(+a.min, +a.value || +a.min),
                    )),
                    (a.value = m[a.name])),
            v &&
              b &&
              b >= v &&
              ((m.days = Math.min(
                14,
                Math.round((new Date(b) - new Date(v)) / 864e5) + 1,
              )),
              (m.nights = m.days - 1),
              (e.querySelector("[name=days]").value = m.days),
              (e.querySelector("[name=nights]").value = m.nights)),
            m.stops.forEach((t) => (t.day = Math.min(m.days, t.day))),
            S(),
            D()),
            a.closest(".budget") &&
              ((m[a.name] = Math.max(0, Math.min(1e5, +a.value || 0))),
              S(),
              A()),
            a.hasAttribute("data-time") &&
              ((m.stops[+a.dataset.time].time = a.value), S()),
            a.hasAttribute("data-day") &&
              ((m.stops[+a.dataset.day].day = +a.value), S(), D()));
        }),
        e.addEventListener("click", async (t) => {
          const a = t.target.closest("button");
          if (a) {
            if (
              (a.dataset.jump &&
                e
                  .getElementById(a.dataset.jump)
                  ?.scrollIntoView({ behavior: "smooth" }),
              a.dataset.category)
            ) {
              K = a.dataset.category;
              e.querySelector("[data-more-categories]").value=K.startsWith("type:")?K:"";
              e.querySelectorAll("[data-category]").forEach((t) => {
                const n = t === a;
                t.classList.toggle("on", n);
                t.setAttribute("aria-pressed", n);
              });
              T(e.querySelector(".add-search input").value);
            }
            if (a.hasAttribute("data-old-hotel")) {
              const t = m.hotels[+a.dataset.oldHotel];
              t &&
                !m.stops.some((e) => e.id === t.id) &&
                (m.stops.push({ ...t, day: 1, time: "", category: "Hotel" }),
                S(),
                D(),
                (a.textContent = "Added ✓"));
            }
            if (
              (a.hasAttribute("data-add-day") &&
                m.days < 14 &&
                (m.days++,
                (e.querySelector("[name=days]").value = m.days),
                S(),
                D()),
              a.hasAttribute("data-add"))
            ) {
              const t = g[+a.dataset.add];
              if (!t) return;
              if(!window.SR_ROUTE_UI.ready(t))return void w("This guide is unavailable. Please try again later.");
              if (m.stops.some((e) => e.id === t._id))
                return void w("That place is already in this trip.");
              (m.stops.push({
                id: t._id,
                name: t.displayTitle || t.title || t.name,
                town: t.locationName || t.destination || "",
                image: n.safePhoto(t),
                category:
                  t.category || t.venueType || KL[t._kind] || "Destination",
                day: 1,
                time: "",
                url: window.SR_PLACE_HREF(t),
              }),
                S(),
                D(),
                (a.textContent = "Added ✓"),
                w("Added to your itinerary."));
            }
            for (const [t, e] of [
              ["up", -1],
              ["down", 1],
            ])
              if (a.hasAttribute("data-" + t)) {
                const n = +a.dataset[t],
                  o = n + e;
                (o >= 0 &&
                  o < m.stops.length &&
                  ([m.stops[n], m.stops[o]] = [m.stops[o], m.stops[n]]),
                  S(),
                  D());
              }
            if (
              (a.hasAttribute("data-remove") &&
                (m.stops.splice(+a.dataset.remove, 1), S(), D()),
              a.hasAttribute("data-save"))
            )
              try {
                const t = i("sr-trips-v2", []),
                  e = x(),
                  a = t.findIndex((t) => t.id === u);
                (a < 0 ? t.push(e) : (t[a] = e),
                  r("sr-trips-v2", t),
                  S(),
                  w("Trip saved. Open My Trips to find it again."));
              } catch {
                w("Saving failed. Export or print your plan to keep it.");
              }
            if (
              (a.hasAttribute("data-print") && window.print(),
              a.hasAttribute("data-export"))
            ) {
              const t = new Blob([JSON.stringify(x(), null, 2)], {
                  type: "application/json",
                }),
                e = URL.createObjectURL(t),
                a = document.createElement("a");
              ((a.href = e),
                (a.download = "spin-raiders-trip.json"),
                a.click(),
                setTimeout(() => URL.revokeObjectURL(e), 1e3));
            }
            if (a.hasAttribute("data-share"))
              try {
                const t = x();
                t.plan.stops = t.plan.stops.map(({ image: t, ...e }) => e);
                const e = btoa(
                    String.fromCharCode(
                      ...new TextEncoder().encode(JSON.stringify(t)),
                    ),
                  ),
                  a =
                    location.origin +
                    l("trip") +
                    "&shared=" +
                    encodeURIComponent(e);
                if (a.length > 24e3)
                  return void w(
                    "This trip is too large for a share link. Export the plan instead.",
                  );
                (await navigator.clipboard.writeText(a),
                  w(
                    "Share link copied. Anyone with the link can read this itinerary.",
                  ));
              } catch {
                w("The link could not be copied. Export the plan instead.");
              }
          }
        }),
        D());
    };
  } catch (e) {
    console.warn("SR snippet failed: Spin Raiders trip builder design", e);
  }
})();

