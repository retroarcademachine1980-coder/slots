(function () {
  try {
    (() => {
      "use strict";
      const indexNavigation=location.pathname+location.search;
      const e = new URLSearchParams(location.search);
      const indexInput=window.SR_ROUTES.indexInput(indexNavigation),renderPath=indexInput.ok&&indexInput.mode==='render'?new URL(indexInput.to,location.origin).pathname:location.pathname;
      if(window.SR_ROUTES.parse(renderPath).kind!=="machineIndex")return;
      window.SR_ARCHIVE_DESIGN_ACTIVE = !0;
      let a = 0;
      !(function t() {
        if(location.pathname+location.search!==indexNavigation)return;
        if (document.documentElement.classList.contains("rt-active")) return;
        const s = window.SR_SEASIDE,
          r = s?.archiveQuality,
          o = document.getElementById("sr-seaside-root");
        if (!(
          s?.archiveQuery &&
          r &&
          o &&
          window.SR_ARCHIVE_DESIGN_CSS &&
          window.SR_ARCHIVE_DETAIL
        ))
          return void (++a < 600 && setTimeout(t, 100));
        if (document.getElementById("sr-approved-archive")) return;
        const i = document.createElement("div");
        ((i.id = "sr-approved-archive"), o.before(i));
        const archiveHost=i;
        const n = i.attachShadow({ mode: "open" }),
          c = s.e,
          l = document.createElement("style");
        ((l.textContent =
          "body:has(#sr-approved-archive){background:white!important}body:has(#sr-approved-archive) #sr-seaside-root,body:has(#sr-approved-archive) #sr-seaside-related,body:has(#sr-approved-archive) #SITE_CONTAINER,body:has(#sr-approved-archive) #raidertube-global-button,body:has(#sr-approved-archive) #sr-report-action{display:none!important}"),
          document.head.append(l));
        const d = (e) => window.SR_ROUTES.href(e),
          h = (e) => r.photo(e),
          p = (e) => r.cardPhoto(e),
          m = (e) => r.text(e),
          u = (e) => e.title || "Classic machine",
          v = (e, a, t = "") =>
            e
              ? `<img class="${t}" src="${c(s.fit(s.img(e), 640))}" alt="${c(a)}" loading="lazy">`
              : '<div class="empty">Photograph being added</div>',
          y = (e, a, t = !1) =>
            !window.SR_ROUTE_UI.ready(e)?window.SR_ROUTE_UI.unavailable(e,{image:p(e),title:u(e)}):`<a class="card" href="${c(d(e))}"><div class="card-photo">${v(p(e), e.imageAltText || u(e) + " — real machine logo photograph")}${t ? '<span class="badge">' + ["FROM THE ARCHIVE", "EXPLORE", "DISCOVER", "CLASSIC MACHINE"][a % 4] + "</span>" : ""}</div><div class="copy"><h3>${c(u(e))}</h3><p>${c(m(e.cardSummary || e.shortDescription || e.seoDescription).slice(0, 150))}</p><div class="tags"><span>${c(e.manufacturer || "Classic machine")}</span>${r.year(e) ? "<span>" + c(r.year(e)) + "</span>" : ""}</div></div></a>`,
          b = [
            "Barcrest",
            "JPM",
            "Maygay / BWB",
            "Astra",
            "Red Gaming",
            "Electrocoin",
            "Project",
            "Concept",
            "BFM",
            "Impulse",
          ];
        let g = [],
          f = Math.max(1, +e.get("page") || 1),
          S = "",
          w = [];
        try {
          w = JSON.parse(
            localStorage.getItem("sr-directory-favourites-v1") || "[]",
          );
        } catch {}
        function E(e) {
          n.getElementById(e)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
        Array.isArray(w) || (w = []);
        const C = `<style>${window.SR_ARCHIVE_DESIGN_CSS}.era-grid button{min-height:0;aspect-ratio:367/216;border-radius:10px;background:#082444;box-shadow:0 5px 14px #0b192c33;transition:transform .2s}.era-grid button:hover,.promo-art:hover{transform:translateY(-3px)}.era-art{position:absolute;inset:0;background:center/cover}.era-grid strong.vh,.vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.promos.art{display:grid;gap:15px;margin:24px 0}.promo-art{display:block;border:0;padding:0;border-radius:12px;background:#e8f4fd center/cover;box-shadow:0 6px 18px #0b192c26;cursor:pointer;transition:transform .2s}@media(max-width:760px){.promos.art{grid-template-columns:1fr!important}}.hero-photos img[hidden]{display:none}</style>`,
          $ = window.SR_ROUTES.parse(location.pathname).kind==="machine"?location.pathname:"";
        n.innerHTML =
          C +
          `<main><section class="hero"><div class="hero-copy"><h1>CLASSIC FRUIT<br><span>MACHINE ARCHIVE</span></h1><strong class="strap">REAL MACHINES. REAL LOGOS. REAL NOSTALGIA.</strong><p>Browse classic fruit machines by logo, manufacturer and era. From Barcrest and JPM to Astra, Maygay/BWB, Red Gaming and more.</p></div><div class="hero-photos" data-hero-photos></div><div class="hero-controls"><form class="hero-search"><input aria-label="Search the machine archive" placeholder="Search by machine name, manufacturer or year…" value="${c(e.get("q") || "")}"><button class="pink">Search →</button></form><div class="quick">${b
            .slice(0, 7)
            .map((e) => `<button data-maker="${c(e)}">${c(e)}</button>`)
            .join(
              "",
            )}</div></div></section><nav class="tabs" aria-label="Browse machines">${[
            ["all", "777", "All Machines"],
            ["makers", "⚙", "Manufacturers"],
            ["eras", "▦", "By Era"],
            ["club", "♟", "Club Machines"],
            ["4-player", "♟♟", "4-Player Favourites"],
            ["£5", "▤", "£5 Jackpot Era"],
            ["£15", "▤", "£15 Jackpot Era"],
            ["£25", "▤", "£25 Jackpot Era"],
            ["seaside", "♜", "Seaside Classics"],
          ]
            .map(
              ([e, a, t]) =>
                `<button data-browse="${e}" aria-pressed="${"all" === e}"><span>${window.SR_ICON(e === "seaside" ? "beaches" : e === "makers" ? "all" : "fruit-machines",34)}</span>${t}</button>`,
            )
            .join(
              "",
            )}</nav><div class="wrap"><section class="section" data-featured-section><div class="section-heading"><div><h2>Featured <em>machines</em></h2><p>Logo-led classics, hand-picked from the archive.</p></div><button data-browse="all">View all machines →</button></div><div class="cards" data-featured><p>Loading your machine photographs…</p></div></section><section class="section" id="makers"><div class="section-heading"><div><h2>Browse by <em>manufacturer</em></h2><p>Explore the biggest names in fruit machine history.</p></div></div><div class="manufacturers">${b.map((e) => `<button data-maker="${c(e)}">${/^(Barcrest|JPM|Electrocoin)$/.test(e) ? s.makerBadge(e) : '<span class="maker-text">' + c(e) + "</span>"}${c(e)}</button>`).join("")}</div></section><section class="section" id="eras"><div class="section-heading"><div><h2>Popular <em>eras & styles</em></h2><p>Find machines by era, format and classic appeal.</p></div></div><div class="era-grid" data-eras></div></section><section id="all-machines"><div class="section-heading"><h2>Explore the <em>archive</em></h2></div><form class="filters"><label>Machine or keyword<input name="q" value="${c(e.get("q") || "")}" placeholder="Machine name or keyword"></label><label>Manufacturer<select name="maker"><option value="">All manufacturers</option></select></label><label>Era<select name="era"><option value="">All eras</option>${[1960, 1970, 1980, 1990, 2e3, 2010, 2020].map((e) => `<option value="${e}">${e}s</option>`).join("")}</select></label><label>Sort by<select name="sort"><option value="photos">Logos first</option><option value="title">Name A–Z</option><option value="year">Newest recorded year</option></select></label><button type="reset">Reset</button></form><p class="status" role="status">Loading the archive…</p><div class="cards" data-grid></div><nav class="pagination" aria-label="Archive pages"></nav></section><div class="promos art" style="grid-template-columns:880fr 692fr 715fr"><button class="promo-art" data-browse="all" style="background-image:url(https://static.wixstatic.com/media/3a517e_d1b21b01be464be3a4cd0a926f9308a8~mv2.webp/v1/crop/x_0,y_216,w_880,h_373/journey.webp);aspect-ratio:880/373" aria-label="Start your archive journey – start exploring"></button><button class="promo-art" data-latest style="background-image:url(https://static.wixstatic.com/media/3a517e_d1b21b01be464be3a4cd0a926f9308a8~mv2.webp/v1/crop/x_880,y_216,w_692,h_373/latest.webp);aspect-ratio:692/373" aria-label="Latest archive additions – view latest"></button><a class="promo-art" href="/?report=change" style="background-image:url(https://static.wixstatic.com/media/3a517e_d1b21b01be464be3a4cd0a926f9308a8~mv2.webp/v1/crop/x_1572,y_216,w_715,h_373/join.webp);aspect-ratio:715/373" aria-label="Join the archive – help build the collection"></a></div></div></main>`;
        const A = n.querySelector(".filters"),
          k = n.querySelector(".hero-search input"),
          M = n.querySelector(".status");
        let I = !1,
          R = "";
        function L() {
          if(location.pathname+location.search!==indexNavigation||!archiveHost.isConnected)return;
          const e = A.elements.maker.value,
            a = A.elements.q.value
              .trim()
              .toLowerCase()
              .split(/\s+/)
              .filter(Boolean),
            t = +A.elements.era.value,
            s = A.elements.sort.value,
            o = r
              .group(
                g.filter(
                  (s) =>
                    (!e || r.makers(s).some((a) => r.key(a) === e)) &&
                    (!t || 10 * Math.floor(r.exactYear(s) / 10) === t) &&
                    a.every((e) =>
                      [
                        s.title,
                        s.manufacturer,
                        s.variantName,
                        s.familyName,
                        r.year(s),
                        r.val(s.jackpots),
                        r.val(s.stakes),
                      ]
                        .join(" ")
                        .toLowerCase()
                        .includes(e),
                    ) &&
                    (!S ||
                      ("club" === S &&
                        /club/i.test(
                          [s.title, s.category, s.machineType, s.cabinet].join(
                            " ",
                          ),
                        )) ||
                      ("4-player" === S &&
                        /4[ -]?player/i.test(
                          [s.title, s.variantName, s.cabinet].join(" "),
                        )) ||
                      ("seaside" === S && (s.sourceVenues || []).length) ||
                      (S.startsWith("£") &&
                        new RegExp(
                          "(?:£|GBP\\s*)" + S.slice(1) + "(?!\\d)",
                        ).test(r.val(s.jackpots)))),
                ),
              )
              .sort((e, a) =>
                "photos" === s
                  ? Number(!!p(a)) - Number(!!p(e)) || u(e).localeCompare(u(a))
                  : ("year" === s && r.exactYear(a) - r.exactYear(e)) ||
                    u(e).localeCompare(u(a)),
              ),
            i = Math.max(1, Math.ceil(o.length / 24));
          ((f = Math.min(f, i)),
            (M.textContent =
              o.length.toLocaleString("en-GB") +
              " matching titles" +
              (I ? "" : " · Loading more archive records…") +
              (R ? " · " + R : "")),
            (n.querySelector("[data-grid]").innerHTML =
              o
                .slice(24 * (f - 1), 24 * f)
                .map((e, a) => y(e, a))
                .join("") ||
              '<div class="empty">No machines match these filters.</div>'),
            (n.querySelector(".pagination").innerHTML =
              `<button data-page="${f - 1}" ${1 === f ? "disabled" : ""}>← Previous</button><span>Page ${f} of ${i}</span><button data-page="${f + 1}" ${f >= i ? "disabled" : ""}>Next →</button>`));
        }
        let highlightsPainted = false;
        function paintHighlights(){
          if(highlightsPainted || !g.some(p)) return;
          highlightsPainted = true;
              const t = g.filter(p),
                o = ["Andy Capp", "Bar-X", "Bullion Bars", "Rainbow Riches"]
                  .map(
                    (e) =>
                      t.find((a) => u(a).toLowerCase() === e.toLowerCase()) ||
                      t.find((a) =>
                        u(a).toLowerCase().startsWith(e.toLowerCase()),
                      ),
                  )
                  .filter(Boolean);
              for (const e of t) o.length < 4 && !o.includes(e) && o.push(e);
              ((n.querySelector("[data-featured]").innerHTML = o
                .map((e, a) => y(e, a, !0))
                .join("")),
                (() => {
                  const H = n.querySelector("[data-hero-photos]"),
                    P = [...o, ...t]
                      .filter((e, a, x) => h(e) && x.indexOf(e) === a)
                      .slice(0, 10);
                  H.innerHTML = P.map((e) =>
                    v(h(e), u(e) + " — original machine photograph"),
                  )
                    .join("")
                    .replace(/loading="lazy"/g, "hidden");
                  const F = () => {
                    let k = 0;
                    H.querySelectorAll("img").forEach((i) => {
                      const ok =
                        i.naturalHeight > i.naturalWidth * 1.15 && k < 4;
                      i.hidden = !ok;
                      ok && k++;
                    });
                  };
                  H.querySelectorAll("img").forEach((i) => {
                    i.onload = F;
                    i.onerror = F;
                  });
                  F();
                })(),
                (n.querySelector("[data-eras]").innerHTML = [
                  ["1980", "1980s"],
                  ["1990", "1990s"],
                  ["2000", "2000s"],
                  ["club", "Club Machines"],
                  ["4-player", "4-Players"],
                  ["seaside", "Seaside Classics"],
                ]
                  .map(
                    ([e, a], i) =>
                      `<button ${/^\d/.test(e) ? "data-era" : "data-browse"}="${e}" aria-label="${a}"><span class="era-art" style="background-image:url(${["https://static.wixstatic.com/media/3a517e_d1b21b01be464be3a4cd0a926f9308a8~mv2.webp/v1/crop/x_0,y_0,w_367,h_216/era0.webp", "https://static.wixstatic.com/media/3a517e_d1b21b01be464be3a4cd0a926f9308a8~mv2.webp/v1/crop/x_367,y_0,w_367,h_216/era1.webp", "https://static.wixstatic.com/media/3a517e_d1b21b01be464be3a4cd0a926f9308a8~mv2.webp/v1/crop/x_734,y_0,w_367,h_216/era2.webp", "https://static.wixstatic.com/media/3a517e_d1b21b01be464be3a4cd0a926f9308a8~mv2.webp/v1/crop/x_1101,y_0,w_367,h_216/era3.webp", "https://static.wixstatic.com/media/3a517e_d1b21b01be464be3a4cd0a926f9308a8~mv2.webp/v1/crop/x_1468,y_0,w_367,h_216/era4.webp", "https://static.wixstatic.com/media/3a517e_d1b21b01be464be3a4cd0a926f9308a8~mv2.webp/v1/crop/x_1835,y_0,w_367,h_216/era5.webp"][i]})"></span><strong class="vh">${a}</strong></button>`,
                  )
                  .join("")));
        }
        ((n.querySelector(".hero-search").onsubmit = (e) => {
          (e.preventDefault(),
            (A.elements.q.value = k.value),
            (f = 1),
            L(),
            E("all-machines"));
        }),
          (A.onsubmit = (e) => e.preventDefault()),
          (A.oninput = () => {
            ((f = 1), L());
          }),
          (A.onchange = () => {
            ((f = 1), L());
          }),
          (A.onreset = () => {
            ((S = ""),
              setTimeout(() => {
                ((f = 1), L());
              }, 0));
          }),
          n.addEventListener("click", (e) => {
            const a = e.target.closest("button");
            if (a) {
              var t;
              if (
                (a.dataset.maker &&
                  ((t = a.dataset.maker),
                  (S = ""),
                  (A.elements.maker.value = r.key(
                    "Maygay / BWB" === t
                      ? "Maygay"
                      : "BFM" === t
                        ? "Bell Fruit"
                        : t,
                  )),
                  (f = 1),
                  L(),
                  E("all-machines")),
                a.dataset.browse)
              ) {
                const e = a.dataset.browse;
                if (
                  (n
                    .querySelectorAll("[data-browse]")
                    .forEach((a) =>
                      a.setAttribute(
                        "aria-pressed",
                        String(a.dataset.browse === e),
                      ),
                    ),
                  "makers" === e || "eras" === e)
                )
                  return void E(e);
                ((S = "all" === e ? "" : e), (f = 1), L(), E("all-machines"));
              }
              (a.dataset.era &&
                ((A.elements.era.value = a.dataset.era),
                (S = ""),
                (f = 1),
                L(),
                E("all-machines")),
                a.dataset.page &&
                  ((f = +a.dataset.page), L(), E("all-machines")),
                a.hasAttribute("data-latest") &&
                  ((A.elements.sort.value = "year"),
                  (f = 1),
                  L(),
                  E("all-machines")));
            }
          }),
          (async () => {
            try {
              const a = new Set();
              for (let t = 0; ;) {
                const pageSize = t === 0 ? 100 : 500;
                const o = await s.archiveQuery(
                  {
                    fields: r.fields,
                    filter: { directoryReady: { $eq: !0 } },
                    sort: [
                      { fieldName: "title", order: "ASC" },
                      { fieldName: "_id", order: "ASC" },
                    ],
                    paging: { limit: pageSize, offset: t },
                  },
                  null,
                  !1,
                );
                if(location.pathname+location.search!==indexNavigation||!archiveHost.isConnected)return;
                o.dataItems.forEach((e) => {
                  const t = { ...e.data, _id: e.id };
                  !r.usable(t) ||
                    t.canonicalMachineId ||
                    a.has(t._id) ||
                    (a.add(t._id), g.push(t));
                });
                const i = A.elements.maker.value || e.get("maker") || "";
                if (
                  ((A.elements.maker.innerHTML =
                    '<option value="">All manufacturers</option>' +
                    [
                      ...new Map(
                        g.flatMap(r.makers).map((e) => [r.key(e), e]),
                      ).entries(),
                    ]
                      .sort((e, a) => e[1].localeCompare(a[1]))
                      .map(
                        ([e, a]) => `<option value="${c(e)}">${c(a)}</option>`,
                      )
                      .join("")),
                  (A.elements.maker.value = i),
                  L(),
                  paintHighlights(),
                  t += o.dataItems.length,
                  o.dataItems.length < pageSize)
                )
                  break;
              }
              ((I = !0),
                (document.title =
                  "Classic Fruit Machine Archive | Spin Raiders"),
                L());
              window.SR_RUNTIME?.ready("machine-index",indexNavigation);
            } catch (e) {
              if(location.pathname+location.search!==indexNavigation||!archiveHost.isConnected)return;
              ((I = !0),
                (R = "Some records could not load. Reload to retry."),
                L());
              window.SR_RUNTIME?.failed("machine-index",indexNavigation);
            }
          })());
      })();
    })();
  } catch (e) {
    console.warn(
      "SR snippet failed: Spin Raiders approved archive landing 20260922",
      e,
    );
  }
})();

