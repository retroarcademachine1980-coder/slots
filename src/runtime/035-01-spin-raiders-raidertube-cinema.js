(function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const topics = [['all','Browse'],['latest','Latest uploads'],['arcade','Arcade sessions'],['classic','Classic machines'],['visits','Days out & visits'],['gambling','Slot sessions'],['shorts','Shorts'],['popular','Most watched'],['vault','From the vault'],['saved','My list']];
  let current = 'all', term = '', visible = 48;
  const read = key => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const matches = (video, key) => {
    const text = [video.title, video.venue, video.location, video.category].join(' ');
    if (key === 'classic') return /classic|retro|barcrest|jpm|maygay|bandit|astra/i.test(text);
    if (key === 'arcade') return /arcade|amusement|silcock|reel vegas/i.test(text);
    if (key === 'gambling') return /£|jackpot|slot|gambl|win|cash|bonus/i.test(text);
    if (key === 'visits') return /tour|visit|walk|day out|beach|pier|seaside/i.test(text);
    if (key === 'shorts') return video.isShort || /\bshorts?\b/i.test(text);
    if (key === 'saved') return read('rt_saved').includes(video.id);
    return true;
  };
  const format = value => Number(value || 0).toLocaleString('en-GB');
  const duration = value => {
    const match = String(value || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (/^P(?:0D)?(?:T0S)?$/.test(String(value || ''))) return '';
    return match ? [match[1], match[1] ? String(match[2] || 0).padStart(2, '0') : String(match[2] || 0), String(match[3] || 0).padStart(2, '0')].filter(x => x !== undefined).join(':') : value || '';
  };
  const image = video => {
    try { const url = new URL(video.thumb, location.href); if (url.protocol === 'https:') return url.href; } catch { /* Use the verified video ID fallback. */ }
    return /^[-\w]{11}$/.test(video.id) ? 'https://i.ytimg.com/vi/' + video.id + '/hqdefault.jpg' : '';
  };
  const css = `
html.rt-active,html.rt-active body{background:#0b0d12!important;color:#f6f5f3!important}
html.rt-active #sr-brand-header,html.rt-active #sr-seaside-top,html.rt-active #sr-brand-footer,html.rt-active #sr-seaside-foot,html.rt-active #sr-seaside-related{display:none!important}
#raidertube-root.sr-vault-cinema{background:#0b0d12!important;color:#f6f5f3!important;font-family:Arial,Helvetica,sans-serif;min-height:100vh;width:100%;overflow:clip}
#raidertube-root.sr-vault-cinema *{box-sizing:border-box}
#raidertube-root.sr-vault-cinema button,#raidertube-root.sr-vault-cinema input,#raidertube-root.sr-vault-cinema textarea{font:inherit}
#raidertube-root.sr-vault-cinema button,#raidertube-root.sr-vault-cinema a{-webkit-tap-highlight-color:transparent}
#raidertube-root.sr-vault-cinema button{cursor:pointer}
#raidertube-root.sr-vault-cinema button:disabled{cursor:default;opacity:.45}
#raidertube-root.sr-vault-cinema :focus-visible{outline:3px solid #f9c858!important;outline-offset:5px}
#raidertube-root.sr-vault-cinema .rt-top{display:flex!important;align-items:center;gap:28px!important;position:relative;inset:auto;z-index:5;max-width:none;margin:0;padding:22px 4.5%!important;height:auto;min-height:82px;background:#0b0d12!important;border:0;border-bottom:1px solid #ffffff12;box-shadow:none}
#raidertube-root.sr-vault-cinema .rt-logo{display:flex!important;flex-direction:column;gap:4px;text-decoration:none;color:#ff477e!important;white-space:nowrap;line-height:1;font:900 24px/1 Arial,Helvetica,sans-serif!important;letter-spacing:-1.2px}
#raidertube-root.sr-vault-cinema .rt-logo small{color:#e8e7e5;font-size:10px;letter-spacing:2.8px;font-weight:600}
#raidertube-root.sr-vault-cinema .rt-site-nav{display:flex!important;align-items:center;gap:23px;flex:1}
#raidertube-root.sr-vault-cinema .rt-site-nav a{font-size:13px;font-weight:600;color:#b8bcc8;text-decoration:none;white-space:nowrap}
#raidertube-root.sr-vault-cinema .rt-site-nav a[aria-current]{color:#fff}
#raidertube-root.sr-vault-cinema .rt-search{display:block!important;width:clamp(160px,23vw,320px);min-width:0;max-width:320px!important;margin-left:auto}
#raidertube-root.sr-vault-cinema .rt-search #rt-search{width:100%;height:40px;border:1px solid #ffffff30!important;border-radius:3px;background:#ffffff08!important;color:#fff!important;padding:0 13px;font-size:13px}
#raidertube-root.sr-vault-cinema #rt-login{white-space:nowrap;border:1px solid #ffffff4d!important;border-radius:3px;padding:10px 15px;background:transparent!important;color:#fff!important;font-size:12px}
#raidertube-root.sr-vault-cinema .rt-shell{width:100%;max-width:none;margin:0;padding:0;display:block}
#raidertube-root.sr-vault-cinema #rt-main{width:100%;max-width:none;margin:0;background:#0b0d12;color:#f6f5f3}
#raidertube-root.sr-vault-cinema .vv-hero{min-height:550px;height:min(660px,75vh);position:relative;display:flex;align-items:center;padding:48px 4.5% 80px;isolation:isolate}
#raidertube-root.sr-vault-cinema .vv-backdrop{position:absolute;inset:0 0 0 auto;width:78%;height:100%;object-fit:cover;object-position:center 30%;z-index:-2;opacity:.88}
#raidertube-root.sr-vault-cinema .vv-hero:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#0b0d12 1%,#0b0d12ed 18%,#0b0d1280 58%,#0b0d1218),linear-gradient(0deg,#0b0d12,transparent 55%);z-index:-1}
#raidertube-root.sr-vault-cinema .vv-feature-copy{max-width:630px;width:55%;position:relative}
#raidertube-root.sr-vault-cinema .vv-eyebrow{color:#ff7a9f;text-transform:uppercase;font-size:11px;font-weight:700;letter-spacing:2.5px;margin:0 0 18px}
#raidertube-root.sr-vault-cinema .vv-feature-copy h1{font-family:Arial,Helvetica,sans-serif!important;font-size:clamp(30px,3.5vw,54px)!important;font-weight:850!important;letter-spacing:-1.7px!important;line-height:1.05!important;text-transform:none!important;color:#fff!important;margin:0 0 20px!important;max-width:620px;text-wrap:balance}
#raidertube-root.sr-vault-cinema .vv-meta{font-size:12px;color:#c6c7cc;line-height:1.6;display:flex;gap:16px;flex-wrap:wrap;margin:0 0 17px}
#raidertube-root.sr-vault-cinema .vv-feature-copy>p:not(.vv-eyebrow){color:#d0d1d7;font-size:15px;line-height:1.65;max-width:490px;margin:0 0 26px}
#raidertube-root.sr-vault-cinema .vv-actions{display:flex;gap:12px;flex-wrap:wrap}
#raidertube-root.sr-vault-cinema .vv-primary,#raidertube-root.sr-vault-cinema .vv-secondary{border-radius:3px;font-size:14px;font-weight:700;padding:14px 25px;min-height:46px;border:1px solid transparent}
#raidertube-root.sr-vault-cinema .vv-primary{background:#f9f8f6;color:#12141b}
#raidertube-root.sr-vault-cinema .vv-secondary{background:#ffffff15;color:#fff;border-color:#ffffff3b}
#raidertube-root.sr-vault-cinema .vv-primary:hover{background:#ff477e;color:white}
#raidertube-root.sr-vault-cinema .vv-secondary:hover{background:#ffffff26}
#raidertube-root.sr-vault-cinema .vv-tabs{display:flex;overflow-x:auto;gap:25px;align-items:center;padding:0 4.5%;margin:0 0 32px;border-bottom:1px solid #ffffff1a;scrollbar-width:thin}
#raidertube-root.sr-vault-cinema .vv-tabs button{flex:none;white-space:nowrap;border:0;border-bottom:3px solid transparent;background:transparent;color:#a6abb7;padding:19px 0;font-size:13px;font-weight:600;border-radius:0}
#raidertube-root.sr-vault-cinema .vv-tabs button[aria-pressed=true]{color:#fff;border-color:#ff477e}
#raidertube-root.sr-vault-cinema .vv-tabs button:hover{color:#fff}
#raidertube-root.sr-vault-cinema .vv-content{padding:0 4.5% 40px}
#raidertube-root.sr-vault-cinema .vv-shelf{margin:0 0 39px}
#raidertube-root.sr-vault-cinema .vv-shelf-head{display:flex;align-items:center;gap:18px;margin:0 0 15px}
#raidertube-root.sr-vault-cinema .vv-shelf-head h2,#raidertube-root.sr-vault-cinema .vv-results-head h1{font-size:22px!important;letter-spacing:-.5px!important;font-weight:700!important;margin:0!important;line-height:1.3!important;color:#f4f4f6!important;text-transform:none!important}
#raidertube-root.sr-vault-cinema .vv-shelf-head>button{margin-left:auto}
#raidertube-root.sr-vault-cinema .vv-text-button,#raidertube-root.sr-vault-cinema .vv-row-controls button{border:0;border-radius:0;background:transparent;color:#b7bdca;padding:9px 2px;font-size:12px;white-space:nowrap}
#raidertube-root.sr-vault-cinema .vv-text-button:hover,#raidertube-root.sr-vault-cinema .vv-row-controls button:hover{color:#fff;text-decoration:underline}
#raidertube-root.sr-vault-cinema .vv-row-controls{display:flex;gap:13px}
#raidertube-root.sr-vault-cinema .vv-row{display:grid;grid-auto-flow:column;grid-auto-columns:clamp(210px,23vw,335px);gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:thin;scrollbar-color:#464956 transparent;padding:5px 3px 15px;margin:0 -3px}
#raidertube-root.sr-vault-cinema .vv-card{display:block;width:100%;min-width:0;scroll-snap-align:start;text-align:left;background:none;color:#e9e9ee;border:0;border-radius:3px;padding:0;margin:0;transition:transform .18s ease}
#raidertube-root.sr-vault-cinema .vv-card:hover{transform:translateY(-4px)}
#raidertube-root.sr-vault-cinema .vv-thumb{position:relative;display:block;aspect-ratio:16/9;background:#20242f;border-radius:4px;overflow:hidden;margin-bottom:11px}
#raidertube-root.sr-vault-cinema .vv-thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .2s ease}
#raidertube-root.sr-vault-cinema .vv-card:hover img{transform:scale(1.025)}
#raidertube-root.sr-vault-cinema .vv-duration{position:absolute;right:8px;bottom:8px;padding:4px 6px;background:#08090dde;color:white;font-size:10px;font-weight:600;border-radius:2px}
#raidertube-root.sr-vault-cinema .vv-card strong{font-size:12px;line-height:1.5;font-weight:650;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:36px}
#raidertube-root.sr-vault-cinema .vv-card small{display:block;color:#8d95a6;font-size:11px;margin-top:7px;line-height:1.5}
#raidertube-root.sr-vault-cinema .vv-results-head{display:flex;justify-content:space-between;align-items:center;gap:20px;margin:28px 0}
#raidertube-root.sr-vault-cinema .vv-results-head p{color:#a4abb9;font-size:13px;margin:10px 0 0}
#raidertube-root.sr-vault-cinema .vv-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:30px 18px}
#raidertube-root.sr-vault-cinema .vv-empty{padding:55px 24px;text-align:center;border:1px solid #ffffff15;color:#aab1be;line-height:1.7;grid-column:1/-1}
#raidertube-root.sr-vault-cinema .vv-load{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:15px;padding:25px 0;color:#969eaf;font-size:12px}
#raidertube-root.sr-vault-cinema .vv-load p{margin:0}
#raidertube-root.sr-vault-cinema .vv-footer{border-top:1px solid #ffffff14;padding:35px 4.5%;display:flex;align-items:center;justify-content:space-between;gap:30px;font-size:12px;color:#9098a9;background:#0b0d12}
#raidertube-root.sr-vault-cinema .vv-footer strong{display:block;color:#eaeaf0;font-size:16px;margin-bottom:7px;letter-spacing:-.5px}
#raidertube-root.sr-vault-cinema .vv-footer nav{display:flex;gap:22px;flex-wrap:wrap}
#raidertube-root.sr-vault-cinema .vv-footer a{color:#b6bdca;text-decoration:none}
#raidertube-root.sr-vault-cinema .rv-watchbar{padding:28px 4.5%;background:#0b0d12;display:flex;justify-content:space-between;align-items:center;color:#fff}
#raidertube-root.sr-vault-cinema .rv-watchbar nav{display:flex;gap:24px}#raidertube-root.sr-vault-cinema .rv-watchbar a{color:#b9bfca}
#raidertube-root.sr-vault-cinema .rt-layout{padding:0 4.5% 35px;display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:32px;max-width:1600px;margin:auto}
#raidertube-root.sr-vault-cinema .rt-player-wrap{aspect-ratio:16/9;background:#000;border-radius:4px;overflow:hidden}#raidertube-root.sr-vault-cinema #rt-player{width:100%;height:100%}
#raidertube-root.sr-vault-cinema .rt-title{color:#fff!important;font-size:27px!important;line-height:1.25!important;margin:24px 0 12px!important}
#raidertube-root.sr-vault-cinema .rt-meta,#raidertube-root.sr-vault-cinema .rt-small{color:#a6afbf;font-size:12px;line-height:1.6}
#raidertube-root.sr-vault-cinema .rt-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:20px 0}
#raidertube-root.sr-vault-cinema .rt-btn,#raidertube-root.sr-vault-cinema .rt-star{background:#ffffff0d;color:#dddfe6;border:1px solid #ffffff25;border-radius:3px;padding:10px 14px;font-size:12px;min-height:40px}
#raidertube-root.sr-vault-cinema .rt-star{padding:8px 11px;margin-right:5px}#raidertube-root.sr-vault-cinema .rt-star.on{border-color:#ff477e;color:#ff9db9}
#raidertube-root.sr-vault-cinema .rt-rating{display:flex;align-items:center;gap:7px}
#raidertube-root.sr-vault-cinema .rt-desc,#raidertube-root.sr-vault-cinema .rt-comments{background:#ffffff04;border:1px solid #ffffff12;border-radius:4px;padding:22px;margin:20px 0;color:#b9c0cd;line-height:1.7;font-size:14px}
#raidertube-root.sr-vault-cinema .rt-comments h3{color:#fff!important}#raidertube-root.sr-vault-cinema .rt-comments textarea{background:#141720;color:white;border:1px solid #ffffff30;padding:12px;width:100%}
#raidertube-root.sr-vault-cinema .rt-side-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;color:#fff;font-size:14px}
#raidertube-root.sr-vault-cinema .rt-next{display:flex;background:transparent;border:0;text-align:left;color:#fff;padding:0;margin:0 0 18px;gap:12px;width:100%}
#raidertube-root.sr-vault-cinema .rt-next img{width:125px;aspect-ratio:16/9;object-fit:cover;align-self:flex-start;border-radius:3px}
#raidertube-root.sr-vault-cinema .rt-next h4{font-size:12px!important;color:#ddd!important;line-height:1.4!important;margin:0 0 6px!important}
#raidertube-root.sr-vault-cinema .rt-grid-head{padding:0 4.5%;display:flex;align-items:center;justify-content:space-between}#raidertube-root.sr-vault-cinema .rt-grid-head h2{color:#fff!important}
#raidertube-root.sr-vault-cinema .rt-grid{padding:20px 4.5% 45px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px}
#raidertube-root.sr-vault-cinema .rt-card{background:none;border:0;color:#fff;text-align:left;padding:0;min-width:0}#raidertube-root.sr-vault-cinema .rt-card img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:3px}#raidertube-root.sr-vault-cinema .rt-card h4{color:#ddd!important;font-size:12px!important;line-height:1.5!important}
@media(min-width:1600px){#raidertube-root.sr-vault-cinema .vv-grid,#raidertube-root.sr-vault-cinema .rt-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media(max-width:1100px){#raidertube-root.sr-vault-cinema .rt-site-nav a:not([aria-current]){display:none}#raidertube-root.sr-vault-cinema .vv-feature-copy{width:63%}#raidertube-root.sr-vault-cinema .rt-layout{grid-template-columns:minmax(0,1fr) 260px}#raidertube-root.sr-vault-cinema .vv-grid,#raidertube-root.sr-vault-cinema .rt-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:760px){#raidertube-root.sr-vault-cinema .rt-top{flex-wrap:wrap;gap:16px!important;padding:20px 5%!important}#raidertube-root.sr-vault-cinema .rt-logo{font-size:22px!important}#raidertube-root.sr-vault-cinema .rt-site-nav{display:none!important}#raidertube-root.sr-vault-cinema #rt-login{margin-left:auto}#raidertube-root.sr-vault-cinema .rt-search{order:3;width:100%;max-width:none!important;flex-basis:100%}#raidertube-root.sr-vault-cinema .vv-hero{min-height:560px;height:auto;align-items:flex-end;padding:230px 5% 36px}#raidertube-root.sr-vault-cinema .vv-backdrop{width:100%;height:65%;object-position:center top;opacity:.9}#raidertube-root.sr-vault-cinema .vv-hero:before{background:linear-gradient(0deg,#0b0d12 4%,#0b0d12e8 37%,#0b0d121a 100%)}#raidertube-root.sr-vault-cinema .vv-feature-copy{width:100%;max-width:520px}#raidertube-root.sr-vault-cinema .vv-feature-copy h1{font-size:34px!important;letter-spacing:-1px!important}#raidertube-root.sr-vault-cinema .vv-feature-copy>p:not(.vv-eyebrow){font-size:13px}#raidertube-root.sr-vault-cinema .vv-tabs{gap:23px;padding:0 5%;margin-bottom:25px}#raidertube-root.sr-vault-cinema .vv-content{padding:0 5% 30px}#raidertube-root.sr-vault-cinema .vv-row{grid-auto-columns:78%;gap:12px}#raidertube-root.sr-vault-cinema .vv-grid,#raidertube-root.sr-vault-cinema .rt-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:25px 12px}#raidertube-root.sr-vault-cinema .vv-shelf-head h2{font-size:18px!important}#raidertube-root.sr-vault-cinema .vv-row-controls{display:none}#raidertube-root.sr-vault-cinema .vv-footer{align-items:flex-start;flex-direction:column;padding:30px 5%}#raidertube-root.sr-vault-cinema .rt-layout{display:block;padding:0 5%}#raidertube-root.sr-vault-cinema .rt-side{margin:30px 0}#raidertube-root.sr-vault-cinema .rt-title{font-size:23px!important}#raidertube-root.sr-vault-cinema .rv-watchbar{padding:25px 5%;font-size:12px}#raidertube-root.sr-vault-cinema .rv-watchbar strong{display:none}#raidertube-root.sr-vault-cinema .rt-grid-head,#raidertube-root.sr-vault-cinema .rt-grid{padding-left:5%;padding-right:5%}}
@media(prefers-reduced-motion:reduce){#raidertube-root.sr-vault-cinema *{scroll-behavior:auto!important;transition:none!important}}
`;
  function installStyles() {
    if (document.getElementById('sr-vault-cinema-styles')) return;
    const style = document.createElement('style'); style.id = 'sr-vault-cinema-styles'; style.textContent = css; document.head.append(style);
  }
  const footer = '<footer class="vv-footer"><div><strong>SPIN RAIDERS</strong>Years of adventures. One video vault.</div><nav aria-label="Video Vault footer"><a href="/seaside">Explore the UK</a><a href="/forum">Community</a><a href="/privacy-policy">Privacy</a><a href="/terms">Terms</a></nav></footer>';
  window.RT_VAULT_FOOTER = footer;
  window.RT_CINEMA = {
    installStyles,
    render(ctx) {
      installStyles();
      document.getElementById('raidertube-root')?.classList.add('sr-vault-cinema');
      const main = document.getElementById('rt-main'); if (!main) return;
      document.title = 'Video Vault | Spin Raiders';
      const { videos = [], hasMore, loading, loadError, onPlay, onMore } = ctx;
      const active = document.activeElement;
      const focus = active && main.contains(active) ? active.getAttribute('data-topic') : null;
      const scrolls = new Map([...main.querySelectorAll('[data-shelf]')].map(row => [row.dataset.shelf, row.scrollLeft]));
      main.className = 'rt-cinema';
      const top = videos[0];
      const card = video => `<button type="button" class="vv-card" data-watch="${escape(video.id)}" aria-label="Watch ${escape(video.title)}"><span class="vv-thumb"><img src="${escape(image(video))}" alt="" loading="lazy" decoding="async">${video.duration ? '<span class="vv-duration">' + escape(duration(video.duration)) + '</span>' : ''}</span><strong>${escape(video.title)}</strong><small>${video.location ? escape(video.location) + ' · ' : ''}${format(video.views)} views</small></button>`;
      let list = videos.filter(video => matches(video, current) && [video.title, video.venue, video.location, video.category].join(' ').toLowerCase().includes(term.toLowerCase()));
      if (current === 'popular') list.sort((a, b) => Number(b.views || 0) - Number(a.views || 0));
      if (current === 'vault') list.reverse();
      const browsing = current === 'all' && !term;
      const shelf = (key, label, items) => items.length ? `<section class="vv-shelf" aria-label="${escape(label)}"><div class="vv-shelf-head"><h2>${escape(label)}</h2><button type="button" class="vv-text-button" data-topic="${key}">View all</button><div class="vv-row-controls"><button type="button" data-scroll="${key}" data-direction="-1" aria-label="Previous ${escape(label)} videos">Previous</button><button type="button" data-scroll="${key}" data-direction="1" aria-label="Next ${escape(label)} videos">Next</button></div></div><div class="vv-row" data-shelf="${key}">${items.slice(0,18).map(card).join('')}</div></section>` : '';
      const recently = read('rt_history_v1').map(item => videos.find(video => video.id === item.id)).filter(Boolean);
      const catalogStatus = hasMore ? (loading ? 'Loading the rest of the catalogue…' : 'More videos are available.') : `${format(videos.length)} videos in the vault`;
      main.innerHTML = `${browsing && top ? `<section class="vv-hero" aria-label="Featured video"><img class="vv-backdrop" src="${escape(image(top))}" alt="" fetchpriority="high"><div class="vv-feature-copy"><p class="vv-eyebrow">Spin Raiders · Latest release</p><h1>${escape(top.title)}</h1><div class="vv-meta"><span>${escape(duration(top.duration))}</span>${top.location ? '<span>' + escape(top.location) + '</span>' : ''}<span>${format(top.views)} views</span></div><p>Real arcades. Classic machines. Days worth watching. Find your next session in the Spin Raiders Video Vault.</p><div class="vv-actions"><button type="button" class="vv-primary" data-watch="${escape(top.id)}">Watch now</button><button type="button" class="vv-secondary" data-save="${escape(top.id)}" aria-pressed="${read('rt_saved').includes(top.id)}">${read('rt_saved').includes(top.id) ? 'Saved to my list' : 'Add to my list'}</button></div></div></section>` : ''}
        <nav class="vv-tabs" aria-label="Video categories">${topics.map(([key, label]) => `<button type="button" data-topic="${key}" aria-pressed="${current === key && !term}">${escape(label)}</button>`).join('')}</nav>
        <div class="vv-content">${browsing ?
          shelf('latest','New in the vault',videos) + shelf('recent','Recently watched',recently) + shelf('classic','Classic machine sessions',videos.filter(video => matches(video,'classic'))) + shelf('arcade','Inside the arcades',videos.filter(video => matches(video,'arcade'))) + shelf('popular','Most watched',[...videos].sort((a,b)=>Number(b.views||0)-Number(a.views||0))) + shelf('visits','Days out & visits',videos.filter(video=>matches(video,'visits'))) + shelf('shorts','Shorts',videos.filter(video=>matches(video,'shorts'))) :
          `<section id="vv-results"><div class="vv-results-head"><div><h1>${term ? 'Search results' : escape(current === 'recent' ? 'Recently watched' : topics.find(([key])=>key===current)?.[1] || 'All videos')}</h1><p>${term ? 'For “'+escape(term)+'” · ' : ''}${format(current === 'recent' ? recently.length : list.length)} ${hasMore ? 'matches so far' : 'videos'}</p></div><button type="button" class="vv-text-button" data-clear>Back to browse</button></div><div class="vv-grid">${(current === 'recent' ? recently : list).slice(0,visible).map(card).join('') || `<p class="vv-empty">${hasMore ? 'Searching the remaining catalogue…' : current === 'saved' ? 'Your list is empty. Add a video to keep it here.' : 'No videos match this search. Try a machine, place or another title.'}</p>`}</div>${(current === 'recent' ? recently.length : list.length) > visible ? '<div class="vv-load"><button type="button" class="vv-secondary" data-show-more>Show more results</button></div>' : ''}</section>`}
        <div class="vv-load" role="status"><p>${escape(loadError || catalogStatus)}</p>${loadError || hasMore && !loading ? '<button type="button" class="vv-text-button" data-retry>Load remaining videos</button>' : ''}</div></div>${footer}`;
      main.querySelectorAll('[data-watch]').forEach(button => { button.onclick = () => onPlay(button.dataset.watch); });
      main.querySelectorAll('[data-topic]').forEach(button => { button.onclick = () => { current = button.dataset.topic; term = ''; visible = 48; this.render(ctx); }; });
      main.querySelector('[data-clear]')?.addEventListener('click', () => { current = 'all'; term = ''; visible = 48; this.render(ctx); });
      main.querySelector('[data-show-more]')?.addEventListener('click', () => { visible += 48; const y = window.scrollY; this.render(ctx); window.scrollTo(0,y); });
      main.querySelector('[data-retry]')?.addEventListener('click', () => ctx.onRetry ? ctx.onRetry() : onMore());
      main.querySelectorAll('[data-scroll]').forEach(button => { button.onclick = () => { const row = [...main.querySelectorAll('[data-shelf]')].find(item=>item.dataset.shelf===button.dataset.scroll); row?.scrollBy({left:row.clientWidth*0.85*Number(button.dataset.direction),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); }; });
      main.querySelector('[data-save]')?.addEventListener('click', event => {
        const button = event.currentTarget, saved = read('rt_saved'), id = button.dataset.save, exists = saved.includes(id);
        try { localStorage.setItem('rt_saved',JSON.stringify(exists?saved.filter(item=>item!==id):saved.concat(id))); button.textContent=exists?'Add to my list':'Saved to my list';button.setAttribute('aria-pressed',String(!exists)); } catch { button.textContent='Saving is unavailable in this browser'; }
      });
      const search = document.getElementById('rt-search');
      if (search) { if (search.value !== term) search.value = term; search.oninput = () => { term = search.value.trim(); visible = 48; this.render(ctx); }; }
      const login = document.getElementById('rt-login');
      if (login && window.RTAuth) { login.textContent = window.RTAuth.member() ? window.RTAuth.name() : 'Sign in'; login.onclick = window.RTAuth.member() ? null : () => window.RTAuth.start(); }
      main.querySelectorAll('[data-shelf]').forEach(row => { row.scrollLeft = scrolls.get(row.dataset.shelf) || 0; });
      if (focus) [...main.querySelectorAll('[data-topic]')].find(button=>button.dataset.topic===focus)?.focus({preventScroll:true});
      main.querySelectorAll('img').forEach(img => { img.onerror = () => { img.onerror = null; const id = img.closest('[data-watch]')?.dataset.watch || top?.id; if (/^[-\w]{11}$/.test(id)) img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }; });
    }
  };
})();
