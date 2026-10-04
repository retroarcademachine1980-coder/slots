(function () {
  try {
    (() => {
      "use strict";
      const p = location.pathname.replace(/\/$/, "") || "/",
        e =
          window.SR_CATEGORY_FROM_PATH() ||
          (p === "/"
            ? new URLSearchParams(location.search).get("explore")
            : null);
      if (!e || e === "plan-a-trip" || !window.SR_CATEGORY_PAGES?.[e]) return;
      window.__srSeasideStarted = !0;
      let t = 0;
      function o() {
        const t = window.SR_CATEGORY_PAGES?.[e];
        if (!(
          document.body &&
          t &&
          window.SR_RENDER_CATEGORY &&
          window.SR_CATEGORY_CSS &&
          window.SR_CATEGORY_ICONS &&
          ("directory" !== t?.template ||
            (window.SR_DIRECTORY_HTML &&
              window.SR_INIT_DIRECTORY &&
              window.SR_DIRECTORY_CSS))
        ))
          return !1;
        let o = document.getElementById("sr-seaside-root");
        o ||
          ((o = document.createElement("div")),
          (o.id = "sr-seaside-root"),
          document.body.prepend(o));
        const r = o.shadowRoot || o.attachShadow({ mode: "open" });
        r.innerHTML =
          '<style>:host{display:block!important;background:white}</style><div id="sr-home-approved-20260921"></div>';
        const d = r.lastElementChild.attachShadow({ mode: "open" });
        window.SR_RENDER_CATEGORY(d, t);
        let n = document.getElementById("sr-home-owned-surface");
        (n ||
          ((n = document.createElement("style")),
          (n.id = "sr-home-owned-surface"),
          document.head.append(n)),
          (n.textContent =
            "html.sr-home-ready #raidertube-global-button,html.sr-home-ready #sr-report-action,html.sr-home-ready #sr-seaside-related,html.sr-home-ready #SITE_CONTAINER,html.sr-home-ready #sr-brand-header,html.sr-home-ready #sr-brand-footer,html.sr-home-ready body>#srapp,html.sr-home-ready body>#srh-root{display:none!important}html.sr-home-ready,html.sr-home-ready body{margin:0!important;background:white!important}html.sr-home-ready #sr-seaside-root{display:block!important;width:100%;position:relative;min-height:100vh}"),
          document.documentElement.classList.add(
            "sr-home-ready",
            "sr-seaside-rendered",
          ),
          (document.title = t.title + " | Spin Raiders"));
        return true;
      }
      if (!o()) {
        const e = setInterval(() => {
          (o() || ++t > 600) && clearInterval(e);
        }, 100);
      }
    })();
  } catch (e) {
    console.warn("SR snippet failed: Spin Raiders category routes 20260922", e);
  }
})();

