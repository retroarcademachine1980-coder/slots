/* Restore Jamie's original Cinemas artwork; venue images remain on venue cards. */
(function () {
  "use strict";
  var query = new URLSearchParams(location.search);
  if (!(/^\/cinemas\/?$/.test(location.pathname) || /^(cinema|cinemas)$/.test(query.get("explore") || ""))) return;
  var artwork = "https://static.wixstatic.com/media/3a517e_5af50158e36d441581c06d759d0652c1~mv2.png";
  function restore() {
    var query = new URLSearchParams(location.search);
    if (!(/^\/cinemas\/?$/.test(location.pathname) || /^(cinema|cinemas)$/.test(query.get("explore") || ""))) return false;
    var host = document.getElementById("sr-extended-pages");
    var root = host && host.shadowRoot;
    var hero = root && root.querySelector(".hero");
    if (!hero) return false;
    if (root.getElementById("sr-original-cinema-banner")) return true;
    var style = document.createElement("style");
    style.id = "sr-original-cinema-banner";
    /* The original 1024 x 1536 design is shown unaltered: its banner occupies y=56..323.
       Search is real HTML below the artwork, not the pictured mockup controls. */
    style.textContent = `
      :host{max-width:100vw;min-width:0}
      .hero,.hero.art{height:auto!important;aspect-ratio:auto!important;display:flex!important;flex-direction:column;background:#07345d!important}
      .hero .hero-image{position:relative!important;inset:auto!important;width:100%!important;height:auto!important;min-height:0!important;aspect-ratio:1024/267!important;flex:none!important;background-image:url("${artwork}")!important;background-size:100% auto!important;background-position:center 4.413% !important;background-repeat:no-repeat!important}
      .hero .hero-image:after{display:none!important}
      .hero .hero-copy{position:absolute!important;inset:auto!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important}
      .hero .hero-search{position:relative!important;inset:auto!important;width:calc(100% - 32px)!important;max-width:1100px!important;margin:12px auto!important;display:flex!important}
      .hero .hero-search input{min-width:0!important}
      .topics{max-width:100%;min-width:0}
      @media(max-width:760px){.hero .hero-search{width:calc(100% - 20px)!important;margin:10px auto!important}.hero .hero-search button{padding:10px 14px!important}}
    `;
    root.appendChild(style);
    return true;
  }
  var attempts = 0;
  var timer = setInterval(function(){if(restore() || ++attempts >= 600) clearInterval(timer);},100);
  restore();
})();

