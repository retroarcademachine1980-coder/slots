(function () {
  try {
    (() => {
      "use strict";
      const e = new URLSearchParams(location.search),
        t = location.pathname.replace(/\/$/, "")===window.SR_ROUTES.viewPaths.trip?"trip":e.get("view") || (e.get("explore")==="plan-a-trip" ? "trip" : "");
      if (
        ![
          "trip",
          "my-trips",
          "account",
          "saved-videos",
          "history",
          "settings",
        ].includes(t)
      )
        return;
      window.SR_TRIP_DESIGN_ACTIVE = !0;
      let r = 0;
      !(async function a() {
        const i = window.SR_PUBLIC_DIRECTORY;
        if (!(
          document.body &&
          i &&
          window.SR_TRIP_PAGES_CSS &&
          window.SR_TRIP_BUILDER &&
          window.SR_ACCOUNT_VIEW
        ))
          return void (++r < 600 && setTimeout(a, 100));
        if (document.getElementById("sr-trip-pages")) return;
        const s = document.createElement("div");
        s.id = "sr-trip-pages";
        const o =
          document.getElementById("sr-seaside-root") ||
          document.getElementById("SITE_CONTAINER");
        o ? o.before(s) : document.body.append(s);
        const n = s.attachShadow({ mode: "open" }),
          d = i.S,
          c = d.e,
          p = document.createElement("style");
        ((p.textContent =
          "body:has(#sr-trip-pages){background:white!important}body:has(#sr-trip-pages) #sr-seaside-root,body:has(#sr-trip-pages) #SITE_CONTAINER,body:has(#sr-trip-pages) #sr-seaside-related,body:has(#sr-trip-pages) #raidertube-global-button,body:has(#sr-trip-pages) #sr-report-action{display:none!important}"),
          document.head.append(p));
        const l = (e, t) => {
            try {
              return JSON.parse(localStorage.getItem(e)) ?? t;
            } catch {
              return t;
            }
          },
          u = (e,params={}) => {const link=new URL(window.SR_ROUTES.viewPaths[e] || "/?view="+e,location.origin);for(const [key,value]of Object.entries(params))link.searchParams.set(key,value);return link.pathname+link.search;},
          m = {
            trip: "TRIP BUILDER",
            "my-trips": "MY TRIPS",
            account: "MY ACCOUNT",
            "saved-videos": "SAVED VIDEOS",
            history: "WATCH HISTORY",
            settings: "ACCOUNT SETTINGS",
          }[t],
          S = l("sr-trips-v2", []),
          h = l("sr-directory-favourites-v1", []),
          v = l("rt_saved", []);
        let y = l("sr-trip-v1", null);
        if (!Array.isArray(S)) throw Error("Saved trip format unavailable");
        ((n.innerHTML =
          "<style>" +
          window.SR_TRIP_PAGES_CSS +
          "</style>" +
          `<main><section class="hero"><h1>${m}</h1><p>${"trip" === t || "my-trips" === t ? "Plan it. Save it. Live it." : "Your places. Your trips. Your adventures."}</p><nav class="hero-signs" aria-label="Trip inspiration"><a href="${window.SR_ROUTES.categoryPaths["arcades"]}">Arcades</a><a href="${window.SR_ROUTES.categoryPaths["attractions"]}">Attractions</a><a href="${window.SR_ROUTES.categoryPaths["places-to-stay"]}">Hotels</a><a href="${window.SR_ROUTES.categoryPaths["food-drink"]}">Food & Drink</a><a href="/map">& More!</a></nav></section><div class="shell"><aside class="sidebar"><div class="profile"><div class="avatar" aria-hidden="true">♙</div><h3 data-member-name>Your adventures</h3><p data-member-note>Saved on this browser</p><button class="button white" data-signin>Sign in</button></div><nav class="side-nav" aria-label="Your account">${[
            ["account", "⌂", "Dashboard"],
            ["favourites", "♡", "My Favourites"],
            ["my-trips", "▣", "My Trips"],
            ["saved-videos", "▶", "Saved Videos"],
            ["history", "◷", "Watch History"],
            ["settings", "⚙", "Account Settings"],
          ]
            .map(
              ([e, r, a]) =>
                `<a href="${"favourites" === e ? "/search?favourites=1" : u(e)}" ${e === t || ("my-trips" === e && "trip" === t) ? 'aria-current="page"' : ""}><span>${r}</span>${a}</a>`,
            )
            .join(
              "",
            )}</nav><div class="side-promo">LIFE’S BETTER<br>WITH<br>DAYS OUT ♡</div></aside><div class="content"></div></div></main>`),
          (n.querySelector("[data-signin]").onclick = () => {
            window.RTAuth?.start
              ? window.RTAuth.start()
              : (location.href = "/?raidertube=1");
          }),
          window.RTAuth?.member?.() &&
            ((n.querySelector("[data-member-name]").textContent =
              window.RTAuth.name()),
            (n.querySelector("[data-member-note]").textContent =
              "Signed in · plans saved on this browser"),
            (n.querySelector("[data-signin]").textContent = "Open Video Vault"),
            (n.querySelector("[data-signin]").onclick = () =>
              (location.href = "/?raidertube=1"))));
        const g = n.querySelector(".content"),
          T = {
            root: n,
            content: g,
            S: d,
            D: i.D,
            e: c,
            get: l,
            put: (e, t) => {
              localStorage.setItem(e, JSON.stringify(t));
            },
            href: u,
            photo: (e) => d.fit(d.img(e.image || e.heroImage), 1e3),
            params: e,
            allTrips: S,
            favourites: Array.isArray(h) ? h : [],
            savedVideos: Array.isArray(v) ? v : [],
            trip: y,
          };
        ((document.title = m + " | Spin Raiders"),
          "trip" === t
            ? window.SR_TRIP_BUILDER(T)
            : window.SR_ACCOUNT_VIEW(t, T));
      })();
    })();
  } catch (e) {
    console.warn("SR snippet failed: Spin Raiders trip and account routes", e);
  }
})();

