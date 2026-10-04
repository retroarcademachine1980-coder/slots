(function () {
  try {
    (() => {
      "use strict";
      const e = (e, s, a, r, o) =>
          `https://static.wixstatic.com/media/3a517e_7ae3a75dcc3047cf8aa26411a6455c16~mv2.webp/v1/crop/x_${e},y_${s},w_${a},h_${r}/${o}.webp`,
        s = (e, s) => (window.SR_ICON ? window.SR_ICON(e, s) : ""),
        a = {
          search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 6 6"/>',
          compass:
            '<circle cx="12" cy="12" r="9"/><path d="m12 0 2 10 10 2-10 2-2 10-2-10L0 12l10-2Z"/>',
        },
        r = (e) => `<svg viewBox="0 0 24 24" aria-hidden="true">${a[e]}</svg>`,
        o = {
          towns: (""+window.SR_ROUTES.categoryPaths["seaside"]+""),
          attractions: (""+window.SR_ROUTES.categoryPaths["attractions"]+""),
          stays: (""+window.SR_ROUTES.categoryPaths["places-to-stay"]+""),
          food: (""+window.SR_ROUTES.categoryPaths["food-drink"]+""),
          arcades: (""+window.SR_ROUTES.categoryPaths["arcades"]+""),
          gems: (""+window.SR_ROUTES.categoryPaths["hidden-gems"]+""),
          planner: (""+window.SR_ROUTES.viewPaths["trip"]+""),
          offers: (""+window.SR_ROUTES.viewPaths["offers"]+""),
        },
        t = [
          [
            "Days Out",
            o.towns,
            [
              ["seaside", "Seaside", o.towns],
              ["beaches", "Beaches", (""+window.SR_ROUTES.categoryPaths["beaches"]+"")],
              ["piers", "Piers", (""+window.SR_ROUTES.categoryPaths["piers"]+"")],
              ["theme-parks", "Theme Parks", (""+window.SR_ROUTES.categoryPaths["theme-parks"]+"")],
              ["family-fun", "Family Fun", (""+window.SR_ROUTES.categoryPaths["family-fun"]+"")],
              ["zoos", "Zoos", (""+window.SR_ROUTES.categoryPaths["zoos"]+"")],
              ["sea-life", "Sea Life", (""+window.SR_ROUTES.categoryPaths["sea-life"]+"")],
              ["nature", "Nature", (""+window.SR_ROUTES.categoryPaths["nature-outdoors"]+"")],
              ["tours", "Tours", (""+window.SR_ROUTES.categoryPaths["tours"]+"")],
              ["hidden-gems", "Hidden Gems", o.gems],
            ],
          ],
          [
            "Places to Stay",
            o.stays,
            [
              ["places-to-stay", "Places to Stay", o.stays],
              [
                "holiday-parks",
                "Holiday Parks & Hotels",
                (""+window.SR_ROUTES.categoryPaths["holiday-parks"]+""),
              ],
            ],
          ],
          [
            "Eat & Drink",
            o.food,
            [
              ["food-drink", "Food & Drink", o.food],
              ["arcade-bars", "Arcade Bars & Clubs", (""+window.SR_ROUTES.categoryPaths["arcade-bars"]+"")],
            ],
          ],
          [
            "Attractions",
            o.attractions,
            [
              ["attractions", "All Attractions", o.attractions],
              ["arcades", "Arcades", o.arcades],
              [
                "retro-video-games",
                "Retro Video Games",
                (""+window.SR_ROUTES.categoryPaths["retro-video-games"]+""),
              ],
              ["agc", "Adult Gaming Centres", (""+window.SR_ROUTES.viewPaths["agc"]+"")],
              ["bingo", "Bingo", (""+window.SR_ROUTES.categoryPaths["bingo"]+"")],
              ["bowling", "Bowling", (""+window.SR_ROUTES.categoryPaths["bowling"]+"")],
              ["cinemas", "Cinemas", (""+window.SR_ROUTES.categoryPaths["cinema"]+"")],
              ["fishing", "Fishing", (""+window.SR_ROUTES.categoryPaths["fishing"]+"")],
              ["museums", "Museums", (""+window.SR_ROUTES.categoryPaths["museums"]+"")],
              [
                "historical-sites",
                "Historical Sites",
                (""+window.SR_ROUTES.categoryPaths["historical-sites"]+""),
              ],
            ],
          ],
          [
            "Fruit Machines",
            "/classic-fruit-machines",
            [
              [
                "fruit-machines",
                "Classic Machine Archive",
                "/classic-fruit-machines",
              ],
              ["casinos", "Manufacturers", "/fruit-machine-manufacturers"],
            ],
          ],
          [
            "Offers",
            o.offers,
            [
              ["offers", "Amazing Offers", o.offers],
              ["casinos", "UK Casino Deals", "/casino-offers"],
            ],
          ],
          [
            "Plan Your Trip",
            o.planner,
            [
              ["plan-a-trip", "Trip Builder", o.planner],
              ["map", "Raiders Map", "/map"],
              ["videos", "Video Vault", "/?raidertube=1"],
            ],
          ],
        ];
      window.SR_SHELL = {
        U: o,
        crop: e,
        css: ".srsh{--navy:#0b2a4a;--ink:#0b192c;--cyan:#00b4d8;--yellow:#ffd21f;--blue:#1d4fa3;font-family:'Roboto Condensed',Arial,sans-serif;color:var(--ink);background:#fff}.srsh *{box-sizing:border-box}.srsh a{color:inherit;text-decoration:none}.srsh img{display:block;max-width:100%}.srsh .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.srsh .masthead{position:sticky;top:0;z-index:50;background:linear-gradient(#0e3561,#0b2a4a);box-shadow:0 2px 12px #0005}.srsh .nav{display:flex;align-items:center;gap:clamp(10px,1.6vw,26px);height:72px;width:min(1440px,100%);margin:0 auto;padding:0 clamp(12px,2vw,28px)}.srsh .brand{display:flex;align-items:center;gap:10px;color:#fff;font:800 clamp(22px,2vw,30px)/1 'Roboto Condensed';letter-spacing:.01em;white-space:nowrap}.srsh .brand svg{width:44px;height:44px;stroke:var(--cyan);fill:none;stroke-width:1.6}.srsh .brand small{display:block;font:700 10px/1.4 'Roboto Condensed';letter-spacing:.22em;color:var(--cyan)}.srsh .menu{display:flex;gap:clamp(4px,1vw,14px);margin-left:auto}.srsh .dd{position:relative}.srsh .dd>a{display:flex;align-items:center;gap:4px;color:#fff;font:700 16px 'Roboto Condensed';padding:24px 6px;border-bottom:3px solid transparent}.srsh .dd>a:after{content:'';width:6px;height:6px;border:solid #9fd8ff;border-width:0 2px 2px 0;transform:rotate(45deg) translateY(-2px);margin-left:2px}.srsh .dd:hover>a,.srsh .dd:focus-within>a,.srsh .dd.on>a{color:var(--yellow);border-color:var(--yellow)}.srsh .panel{position:absolute;left:50%;top:100%;transform:translateX(-50%);min-width:260px;background:#fff;border-radius:14px;box-shadow:0 18px 40px #0b192c40;padding:10px;display:none;grid-template-columns:1fr 1fr;gap:2px}.srsh .dd:hover .panel,.srsh .dd:focus-within .panel{display:grid}.srsh .panel.one{grid-template-columns:1fr}.srsh .panel a{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;font:700 15px 'Roboto Condensed';color:var(--ink);white-space:nowrap}.srsh .panel a:hover{background:#eef6fd}.srsh .panel svg{width:34px;height:34px;flex:none}.srsh .nav-search{background:none;border:0;cursor:pointer;padding:6px}.srsh .nav-search svg{width:26px;height:26px;stroke:#fff;fill:none;stroke-width:2.2}.srsh .button{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(#ffe45c,#ffc400);color:var(--ink);font:800 17px 'Roboto Condensed';padding:12px 20px;border-radius:10px;border:0;cursor:pointer;box-shadow:0 3px 0 #d69e00,0 6px 14px #0003;white-space:nowrap}.srsh .button.pink{background:linear-gradient(#ff4f93,#e11d62);color:#fff;box-shadow:0 3px 0 #a3123f,0 6px 14px #0003}.srsh .tagline{font:700 18px/0.95 Caveat,cursive;color:#fff;transform:rotate(-6deg);text-align:center}.srsh .burger{display:none}.srsh .hero .sr-only{position:absolute}.srsh .hero-search .button{padding:14px 26px;font-size:19px}.srsh .promo .hit{position:absolute;border-radius:10px}.srsh .promo .hit:focus-visible{outline:3px solid #1f63c6}.srsh .footer{position:relative;aspect-ratio:7.37;background-size:cover!important;background-position:center!important}.srsh .footer .hit{position:absolute}.srsh .footlinks{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;background:#0b2a4a;padding:10px;font:600 14px Inter,Arial;color:#cfe6ff}.srsh dialog{border:0;border-radius:16px;padding:26px;width:min(560px,92vw);box-shadow:0 30px 70px #0008}.srsh dialog::backdrop{background:#0b192ccc}.srsh dialog form{display:flex;gap:8px}.srsh dialog input{flex:1;font:16px Inter;padding:12px;border:2px solid #cbd5e1;border-radius:10px}.srsh .close{float:right;background:none;border:0;font-size:28px;cursor:pointer}@media(max-width:1100px){.srsh .menu,.srsh .tagline{display:none}.srsh .burger{display:block;margin-left:auto}.srsh .burger summary{list-style:none;color:#fff;font:800 17px 'Roboto Condensed';cursor:pointer;padding:10px 14px;border:2px solid #ffffff55;border-radius:10px}.srsh .burger[open] nav{position:absolute;left:0;right:0;top:72px;background:#fff;max-height:78vh;overflow:auto;padding:8px 14px 20px;box-shadow:0 20px 40px #0006}.srsh .burger details{border-bottom:1px solid #e2e8f0}.srsh .burger details summary{list-style:none;color:var(--ink);border:0;padding:14px 4px;font-size:19px}.srsh .burger details a{display:flex;align-items:center;gap:10px;padding:8px 6px;font:700 16px 'Roboto Condensed'}.srsh .burger details svg{width:32px;height:32px}.srsh .nav>.button{display:none}}@media(max-width:760px){.srsh .nav{height:60px;gap:6px;padding:0 10px}.srsh .brand{font-size:20px;gap:8px}.srsh .brand svg{width:32px;height:32px}.srsh .brand small{font-size:7.5px;letter-spacing:.16em}.srsh .nav-search{margin-left:auto;padding:6px}.srsh .nav-search svg{width:24px;height:24px}.srsh .burger{margin-left:0}.srsh .burger summary{white-space:nowrap;padding:8px 12px;font-size:16px}.srsh .burger[open] nav{top:60px}.srsh .hero-search .button{padding:11px 14px;font-size:16px}.srsh .footer{aspect-ratio:auto;min-height:0;background:#0b2a4a!important}.srsh .footer .hit{display:none}.srsh .fm{display:block!important}}.srsh .footer-live{aspect-ratio:auto!important;background:#0b2a4a!important;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;padding:32px clamp(16px,4vw,64px);color:white}.srsh .footer-live p{margin:0;font-size:16px;line-height:1.5}.srsh .footer-live .brand{white-space:normal}.srsh .footer-live .brand small{letter-spacing:.1em}.srsh .fm{display:none;padding:22px 16px;color:#fff;text-align:center;font:800 24px 'Roboto Condensed'}.srsh .fm small{display:block;font:700 10px 'Roboto Condensed';letter-spacing:.2em;color:var(--cyan);margin-top:4px}.srsh .fm p{margin:12px 0 0;font:600 15px Inter,Arial;color:#cfe6ff}",
        head(e) {
          const a = t
              .map(
                ([a, r, o], t) =>
                  `<div class="dd${t === e ? " on" : ""}"><a href="${r}">${a}</a><div class="panel${o.length < 4 ? " one" : ""}">${o.map(([e, a, r]) => `<a href="${r}">${s(e, 34)}${a}</a>`).join("")}</div></div>`,
              )
              .join(""),
            i = t
              .map(
                ([e, a, r]) =>
                  `<details><summary>${e}</summary>${r.map(([e, a, r]) => `<a href="${r}">${s(e, 32)}${a}</a>`).join("")}</details>`,
              )
              .join("");
          return `<div class="srsh" style="display:contents"><header class="masthead"><div class="nav"><a href="/" class="brand" aria-label="Spin Raiders home">${r("compass")}<span>SPIN RAIDERS<small>DISCOVER MORE OF THE UK</small></span></a><nav class="menu" aria-label="Main">${a}</nav><button class="nav-search" aria-label="Search">${r("search")}</button><a class="button" href="${o.planner}">Plan a day out →</a><span class="tagline">Great<br>Places<br>Brighter<br>Days</span><details class="burger"><summary>Menu ☰</summary><nav aria-label="Mobile">${i}</nav></details></div></header></div>`;
        },
        foot: () =>
          `<div class="srsh"><footer><div class="footer footer-live"><a href="/" class="brand" aria-label="Spin Raiders home">${r("compass")}<span>SPIN RAIDERS<small>PUTTING GREAT PLACES BACK ON THE MAP</small></span></a><p>Real places · Honest guides · Great tips · For all ages</p><p>Explore more together</p></div><nav class="footlinks" aria-label="Footer"><a href="/about-us">About us</a><a href="/?report=change">Report a change</a><a href="/responsiblegambling">Safer gambling</a><a href="/privacy-policy">Privacy</a><a href="/terms">Terms</a></nav></footer><dialog id="sd"><button class="close" data-close aria-label="Close">×</button><h2>Where shall we go?</h2><form action="/search" role="search"><input name="q" type="search" placeholder="Search places, towns and days out" required><button class="button pink">Search →</button></form></dialog></div>`,
        wire(e) {
          const s = "width=device-width, initial-scale=1",
            a = () => {
              const e = document.querySelector('meta[name="viewport"]');
              e && e.content !== s && (e.content = s);
            };
          void (a(),
            window.__srVP ||
              ((window.__srVP = 1),
              new MutationObserver(a).observe(document.head, {
                subtree: !0,
                childList: !0,
                attributes: !0,
                attributeFilter: ["content"],
              })),
            false);
          const r = e.querySelector(".nav-search");
          (r &&
            (r.onclick = () => {
              const s =
                e.querySelector("#sd") ||
                document
                  .getElementById("sr-brand-footer")
                  ?.shadowRoot?.querySelector("#sd");
              if (s) {
                s.showModal();
                s.querySelector("input").focus();
              } else location.assign("/search");
            }),
            e
              .querySelectorAll("[data-close]")
              .forEach((e) => (e.onclick = () => e.closest("dialog").close())),
            e
              .querySelectorAll("[data-signup]")
              .forEach(
                (e) =>
                  (e.onclick = () =>
                    window.SR_NEWSLETTER
                      ? window.SR_NEWSLETTER()
                      : location.assign(
                          "https://spinraiders.wixforms.com/f/7508127101044655112",
                        )),
              ),
            e.addEventListener("click", (e) => e.stopPropagation()),
            e.addEventListener("submit", (e) => e.stopPropagation()));
        },
        own() {
          let e = document.getElementById("sr-shell-surface");
          (e ||
            ((e = document.createElement("style")),
            (e.id = "sr-shell-surface"),
            document.head.append(e)),
            (e.textContent =
              "html.sr-shell #raidertube-global-button,html.sr-shell #sr-report-action,html.sr-shell #sr-seaside-related,html.sr-shell body #SITE_CONTAINER#SITE_CONTAINER,html.sr-shell #sr-brand-header,html.sr-shell #sr-brand-footer,html.sr-shell body>#srapp,html.sr-shell body>#srh-root,html.sr-shell #sr-seaside-root{display:none!important}html.sr-shell,html.sr-shell body{margin:0!important;background:#fff!important;height:auto!important;min-height:0!important;overflow:visible!important}html.sr-shell #sr-shell-page{display:block!important}"),
            document.documentElement.classList.add("sr-shell"));
          const s = document.getElementById("sr-shell-page");
          s && s.style.setProperty("background", "#fff", "important");
          const a = () =>
            [
              "sr-brand-header",
              "sr-brand-footer",
              "raidertube-global-button",
              "sr-report-action",
              "sr-seaside-related",
            ].forEach((e) => document.getElementById(e)?.remove());
          (a(),
            window.__srKill ||
              ((window.__srKill = 1),
              new MutationObserver(a).observe(document.body, {
                childList: !0,
              })));
        },
      };
    })();
  } catch (e) {
    console.warn("SR snippet failed: Spin Raiders shared shell 20260923", e);
  }
})();

window.SR_SHELL.css += "@media(max-width:760px){.srsh dialog{padding:18px;max-width:calc(100vw - 24px)}.srsh dialog form{flex-wrap:wrap}.srsh dialog input{min-width:0;flex:1 1 180px;max-width:100%;font-size:16px}.srsh dialog .button{min-height:44px}.srsh .footer-live{padding-bottom:74px}.srsh .burger summary{min-height:44px}}";

