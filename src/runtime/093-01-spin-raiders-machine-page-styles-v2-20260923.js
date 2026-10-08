(function () {
  'use strict';
  window.SR_ARCHIVE_DETAIL2_CSS = `
:host{display:block;background:#fff;color:#0b192c}
.machine-heading.vh{height:auto;min-height:0;background:#0b2a4a}
.machine-heading .vhc{position:static;padding-top:22px;padding-bottom:22px}
.machine-heading h1{text-shadow:none}.machine-heading .vhl{align-items:center}
.machine-full-card{width:100%;margin:0 auto 28px;text-align:center}
.machine-full-card img{display:block;width:100%;height:auto;object-fit:contain;border-radius:12px}
.machine-detail .g2,.machine-detail .g3{align-items:start}
.machine-detail .about p,.machine-detail .vcard p{line-height:1.7}
.machine-detail a{color:#1f63c6}.machine-detail li{margin-bottom:8px;line-height:1.6}
.machine-facts dl{margin:0}.machine-facts dl>div{display:flex;justify-content:space-between;gap:20px;padding:10px 0;border-bottom:1px solid #e2e8f0}
.machine-facts dt{font-weight:700}.machine-facts dd{margin:0;text-align:right}
.machine-gallery,.machine-reviews{margin-bottom:24px}
.gal-main{position:relative;display:grid;place-items:center;background:#f1f5f9;border-radius:12px;overflow:hidden}
.gal-main img{display:block;width:100%;height:auto;max-height:650px;object-fit:contain}
.ga{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border:0;border-radius:50%;background:#0b2a4a;color:#fff;font-size:30px;cursor:pointer;z-index:1}
.ga-p{left:10px}.ga-n{right:10px}.gal-th{display:flex;gap:12px;overflow:auto;padding:14px 0 0}
.gal-th button{flex:0 0 100px;width:100px;height:100px;border:3px solid transparent;border-radius:8px;background:#f1f5f9;padding:3px;cursor:pointer}
.gal-th button[aria-pressed=true]{border-color:#1f63c6}.gal-th img{width:100%;height:100%;object-fit:contain}
.machine-detail .ng{grid-template-columns:repeat(3,minmax(0,1fr))}.machine-detail .nc img{object-fit:contain;background:#0b2a4a}
.machine-detail button:focus-visible,.machine-detail a:focus-visible{outline:3px solid #1f63c6;outline-offset:3px}
@media(max-width:760px){.machine-heading .vhc{padding-top:18px;padding-bottom:18px}.machine-detail .ng{grid-template-columns:repeat(2,minmax(0,1fr))}.gal-main img{max-height:480px}.machine-full-card{margin-bottom:20px}}
`;
})();
