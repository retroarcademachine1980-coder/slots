/* Spin Raiders: responsive images and reference-matched dynamic town signs; measured type proportions. */
(() => {
  'use strict';
  if (window.SR_IMAGE_QUALITY_V1) return;
  window.SR_IMAGE_QUALITY_V1 = true;
  const roots = new Set();
  const sources = new WeakMap();
  const backgrounds = new WeakMap();
  const townBanners = new WeakMap();
  const townRequests = new Map();
  const signFits = new WeakMap();
  let pending = false;
  let fontEpoch = 0;
  const EXPLORE_ART = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 561 135\"><path fill=\"#fff\" fill-rule=\"evenodd\" d=\"M557,18L555,18L554,17L546,17L545,18L540,17L539,18L537,17L536,18L529,18L528,19L527,18L525,18L524,19L522,19L521,18L517,18L516,17L511,21L509,21L506,23L505,22L505,23L501,26L502,28L500,29L500,32L499,33L499,41L501,43L500,50L499,51L499,55L497,56L497,61L495,65L492,67L492,71L491,72L491,79L492,80L492,82L491,83L491,88L490,89L490,92L488,94L487,104L483,110L485,113L484,118L487,123L490,123L491,125L496,127L505,127L510,125L512,126L515,124L519,124L523,122L524,123L528,121L529,122L532,120L535,120L539,118L541,119L543,117L545,113L545,111L547,108L547,106L545,104L546,103L544,100L546,99L546,98L542,96L539,96L538,97L536,96L535,97L531,97L530,98L524,98L521,100L519,99L518,100L514,100L512,101L511,100L511,96L512,95L512,91L517,81L520,81L521,80L522,81L526,79L535,78L543,75L543,73L542,72L544,68L544,66L542,63L543,59L539,56L535,58L533,57L532,58L525,58L524,59L522,57L523,48L526,42L532,42L536,40L537,41L539,41L540,40L542,41L546,39L549,40L550,39L555,39L556,38L558,38L558,36L560,34L559,32L560,25L558,23L558,19ZM482,23L476,19L474,19L472,17L470,17L467,15L462,15L461,14L460,15L454,14L453,15L447,15L446,16L444,15L441,17L439,16L434,16L434,17L430,21L428,21L426,23L421,33L422,34L422,38L424,38L425,39L424,49L421,55L421,58L419,60L419,65L417,67L416,75L415,76L415,80L413,82L412,91L410,94L410,97L407,103L406,113L405,114L405,115L408,117L408,119L410,122L416,119L418,119L420,122L427,117L428,113L430,110L431,101L433,99L433,96L434,95L438,97L443,104L444,104L453,114L453,115L456,117L459,122L462,120L463,121L466,121L467,120L469,121L469,118L476,113L476,110L478,107L476,104L467,95L465,94L464,91L463,91L458,86L458,85L455,83L454,80L463,74L465,74L467,71L468,72L470,69L474,67L482,58L488,47L488,45L489,44L488,43L489,37L488,36L488,33ZM464,37L466,39L466,42L464,44L464,46L456,55L456,56L449,62L445,64L443,64L442,63L443,62L443,57L444,56L444,52L447,46L448,38L452,36L458,36L459,35L462,37ZM394,14L392,14L391,15L387,12L383,11L382,12L379,12L376,15L373,15L367,18L365,21L367,19L369,21L366,23L366,24L360,30L360,32L358,33L355,38L354,37L354,35L363,22L363,23L360,25L354,33L353,36L351,38L351,40L348,43L347,47L345,49L345,52L343,54L343,56L337,69L337,74L336,75L336,77L337,78L336,80L336,93L337,94L337,99L338,100L339,105L341,107L340,108L346,114L350,117L352,117L354,119L364,119L365,120L369,120L370,119L375,118L382,113L391,104L391,103L395,100L395,98L401,90L401,87L403,85L404,81L406,78L406,76L407,75L407,70L409,69L409,65L410,64L410,60L411,59L410,58L410,54L411,53L411,50L410,49L411,48L411,45L410,44L411,42L410,41L410,34L408,32L409,31L403,20L400,17L396,16ZM385,37L387,39L387,44L388,45L387,46L388,48L388,51L387,52L388,53L388,56L387,57L386,66L384,68L384,71L382,73L381,78L378,81L378,83L376,84L375,87L371,90L371,91L367,95L362,98L359,94L359,89L358,88L359,87L359,82L360,81L361,72L364,68L365,61L367,60L367,58L370,55L371,51L373,50L374,46L378,43L378,41L382,37ZM309,6L307,7L305,11L301,10L297,13L296,19L294,21L294,25L292,27L292,31L289,37L289,42L288,43L288,46L286,48L286,52L284,55L283,63L280,69L280,74L278,75L277,85L275,87L274,95L273,96L273,101L270,103L270,106L269,107L269,114L270,115L270,117L269,118L271,121L274,123L276,122L282,127L285,125L287,126L288,125L291,125L292,124L293,125L297,123L301,123L302,122L306,122L307,121L318,120L319,119L323,119L324,118L326,119L329,117L328,115L329,113L331,112L331,107L332,105L329,103L331,98L327,94L324,94L323,95L322,94L321,95L315,95L314,96L309,96L308,97L306,96L302,98L300,98L299,97L299,93L302,87L302,83L305,76L305,72L307,70L307,67L310,60L310,56L313,50L313,45L318,34L319,24L321,22L321,19L322,18L321,15L318,13L315,9L313,9ZM273,12L267,9L265,7L263,7L259,5L249,4L248,3L246,3L245,4L243,3L241,4L233,4L232,3L230,3L226,6L224,6L222,8L220,7L216,12L209,16L209,23L207,26L207,29L209,32L212,34L212,35L210,37L209,45L206,52L206,56L203,62L203,66L200,68L200,70L198,73L199,75L199,77L198,78L199,79L199,83L196,89L196,94L195,95L194,104L192,107L192,110L191,111L192,116L194,118L194,120L195,121L199,118L200,118L203,122L205,123L206,122L208,122L210,120L211,121L213,121L218,115L218,113L219,112L218,108L219,107L219,103L220,102L220,97L222,96L223,88L226,85L232,84L235,82L240,81L242,79L244,79L250,76L259,69L263,67L263,66L266,64L266,63L268,62L272,57L273,57L274,53L276,52L279,47L279,45L281,41L281,37L282,36L282,33L281,32L282,30L281,25L279,23L278,18ZM256,29L258,31L259,34L258,35L258,38L255,41L254,44L252,45L248,50L244,52L243,54L240,55L239,57L238,56L235,59L231,60L230,59L230,56L232,53L232,49L235,43L235,38L237,37L238,29L239,28L243,28L244,27L246,27L247,28L250,28L251,27ZM198,5L196,5L194,2L192,2L191,3L188,1L185,3L181,2L176,6L167,18L163,21L163,22L153,32L151,33L149,31L145,18L142,13L142,11L140,9L139,4L137,2L130,2L129,4L121,6L112,12L114,15L113,16L114,21L116,23L117,28L119,30L119,33L120,34L121,39L123,42L123,45L124,46L125,51L129,57L129,60L127,62L126,65L124,66L124,67L119,72L116,77L111,82L109,86L107,87L106,90L102,94L102,95L99,97L99,99L95,102L94,105L88,112L88,117L90,119L94,118L97,122L99,122L101,124L104,124L106,126L111,122L112,123L112,122L123,109L125,105L127,104L127,103L132,98L133,95L135,94L135,92L137,91L137,90L141,86L143,89L145,96L147,98L148,103L152,109L153,114L160,121L163,121L164,120L168,121L172,117L175,116L177,113L179,113L180,112L180,110L182,107L182,104L180,102L180,100L176,92L174,90L173,85L171,83L170,78L168,76L169,75L166,71L163,60L168,55L168,54L170,53L171,50L175,47L175,46L185,35L189,29L193,26L193,25L197,21L198,18L200,17L202,11L199,9L199,6ZM100,0L99,1L96,1L95,0L93,1L91,1L90,0L88,1L85,1L84,0L82,1L80,1L79,0L77,1L74,1L73,0L71,1L69,1L68,0L66,1L63,1L62,0L60,0L59,1L57,0L55,0L54,1L52,1L51,0L49,0L48,1L46,0L41,1L40,0L38,3L34,5L31,8L27,9L24,11L23,13L23,17L21,19L21,22L19,24L19,25L21,26L21,29L24,32L23,39L20,46L20,50L18,52L17,58L13,61L12,66L10,68L11,71L9,73L12,77L11,78L10,87L8,90L5,107L1,110L1,114L0,115L0,118L3,121L3,125L5,126L5,128L7,129L9,128L18,134L20,134L21,133L23,134L26,132L32,132L33,131L37,131L38,130L40,131L44,129L48,129L53,127L57,127L61,125L62,126L66,124L70,124L78,121L77,119L82,115L82,113L81,112L84,108L81,104L82,101L84,100L84,99L82,99L81,97L79,97L78,96L72,96L71,97L69,96L68,97L63,97L62,98L56,98L55,99L50,99L49,100L47,99L43,101L42,100L38,101L37,100L38,91L39,90L40,83L44,77L46,78L47,77L59,76L60,75L61,76L65,74L67,75L71,73L77,72L80,70L79,68L80,67L80,64L82,61L80,61L79,59L81,58L82,56L79,55L77,53L78,51L80,51L74,48L72,48L71,49L69,48L68,49L61,49L60,50L55,50L53,51L50,49L51,48L52,38L54,35L55,30L59,28L60,29L65,27L67,28L68,27L73,27L74,26L78,27L79,26L83,26L84,25L87,25L88,26L91,24L97,24L98,23L100,23L101,15L103,13L100,9L101,7L101,4L99,2Z\"/></svg>";
  const SIGN_CSS = `
.town-photo-banner{position:relative!important;isolation:isolate;background:#103958!important;width:100%;min-height:0!important;height:var(--town-hero-height,620px)!important;max-height:none!important;aspect-ratio:auto!important;overflow:hidden}
.town-photo-banner>img{position:absolute!important;inset:0;width:100%!important;height:100%!important;object-fit:cover;object-position:center}
.town-photo-banner:after{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(0deg,#00172c88,transparent 45%)}
.town-banner-sign{position:absolute;z-index:1;top:var(--town-sign-top,48px);left:3%;width:37%;max-width:660px;height:var(--town-board-height,auto);aspect-ratio:1484/1425;container-type:inline-size;box-sizing:border-box;padding:0;color:#fff;transform:rotate(-6deg);transform-origin:center;background:transparent;border:0;box-shadow:none;filter:drop-shadow(5px 8px 12px #00152366)}

.town-banner-sign:before,.town-banner-sign:after{content:"";position:absolute;z-index:0;left:0;width:100%;pointer-events:none;background-image:url("https://static.wixstatic.com/media/3a517e_07b6f0e7586d4f8ab7d8ab67ad6ea7b1~mv2.png/v1/fit/w_1484,h_1060,q_90,enc_auto/location-sign.webp");background-repeat:no-repeat}
.town-banner-sign:before{top:0;height:62.70cqw;background-size:100cqw 81.54cqw;background-position:center top}
.town-banner-sign:after{top:62.70cqw;height:calc(100% - 62.70cqw);background-size:100% 432.653061%;background-position:center bottom}
.town-banner-title{position:absolute;z-index:1;inset:0;width:100%;height:81.54cqw;display:block;margin:0!important;padding:0!important;font-weight:400!important;line-height:1!important;text-transform:uppercase;letter-spacing:0!important;transform:rotate(-3.3deg);transform-origin:center}
.town-banner-explore{position:absolute;top:13%;left:8.5%;width:83%;height:auto;display:block;line-height:0!important;margin:0!important;padding:0!important;filter:drop-shadow(2px 4px 1px #00152388)}
.town-banner-explore svg{display:block;width:100%;height:auto;overflow:visible}
.town-banner-town{position:absolute;top:39%;left:50%;transform:translateX(-50%) scaleX(.88);transform-origin:center;display:block;width:max-content;max-width:none;white-space:nowrap;margin:0!important;padding:0!important;font-family:'Permanent Marker','Roboto Condensed',Arial,sans-serif!important;font-size:var(--town-name-size,16cqw)!important;font-weight:400!important;font-style:normal!important;font-kerning:none;line-height:1!important;letter-spacing:0!important;color:#ffe21b;text-shadow:2px 4px 1px #00152388}
.town-banner-strapline{position:absolute;z-index:1;top:49.74cqw;left:4.5%;width:91%;height:10.6cqw;display:flex;justify-content:center;align-items:center;background:transparent!important;color:#fff;text-align:center;font-family:'Roboto Condensed',Arial,sans-serif!important;font-weight:400!important;line-height:1;text-transform:uppercase;margin:0!important;padding:0!important;transform:rotate(-3.3deg);transform-origin:center}
.town-banner-strapline-text{display:block;width:max-content;white-space:nowrap;font-size:var(--town-strap-size,4.7cqw)!important;font-weight:400!important;line-height:1.1;margin:0!important;padding:0!important;letter-spacing:0!important}
.town-banner-description{position:absolute;z-index:1;left:6%;top:63cqw;bottom:auto;width:88%;box-sizing:border-box;font-family:Arial,sans-serif!important;font-size:var(--town-description-size,3.5cqw)!important;font-weight:400!important;line-height:1.22!important;letter-spacing:0!important;margin:0!important;padding:0!important;color:#fff;text-shadow:0 1px 2px #001523;transform:rotate(-3.3deg);transform-origin:center}
.town-banner-description .town-description-line{display:block;width:max-content;white-space:nowrap}
.town-sign-accessible{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important;border:0!important}
.town-photo-banner .hero-controls{position:absolute!important;z-index:2;top:var(--town-controls-top,500px)!important;bottom:auto!important;left:18%;width:66%;margin:0!important}
@media(max-width:1100px) and (min-width:601px){.town-banner-sign{width:52%;max-width:520px}}
@media(max-width:600px){.town-photo-banner{display:block}.town-banner-sign{left:50%;width:88%;max-width:420px;aspect-ratio:auto;transform:translateX(-50%) rotate(-6deg)}.town-banner-description{top:63cqw;font-size:var(--town-description-size,14px)!important;line-height:1.2!important}.town-banner-description .town-description-line{display:inline;width:auto;white-space:normal}.town-photo-banner .hero-controls{left:4%;width:92%}}
`;
  function improve(url, displayWidth) {
    if (!url || !url.includes('static.wixstatic.com/media/') || !url.includes('/v1/')) return url;
    return url.replace(/\/(fit|fill)\/([^/]+)\//, (whole, mode, args) => {
      const w = args.match(/(?:^|,)w_(\d+)/), h = args.match(/(?:^|,)h_(\d+)/);
      if (!w || !h) return whole;
      const original = Number(w[1]);
      if (displayWidth < 100 || original < 100) return whole;
      const wanted = Math.min(3000, Math.max(original, Math.ceil(displayWidth * Math.min(devicePixelRatio || 1, 2))));
      const height = Math.round(Number(h[1]) * wanted / original);
      let next = args.replace(/w_\d+/, 'w_' + wanted).replace(/h_\d+/, 'h_' + height);
      if (/(?:^|,)q_\d+/.test(next)) next = next.replace(/q_(\d+)/, (_, q) => 'q_' + Math.max(85, Number(q)));
      else next += ',q_85';
      return '/' + mode + '/' + next + '/';
    });
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; scan(); });
  }
  function register(root) {
    if (roots.has(root)) return;
    roots.add(root);
    new MutationObserver(schedule).observe(root, {childList:true,subtree:true});
    root.addEventListener('change',schedule);
    root.addEventListener('submit',() => setTimeout(schedule,0));
  }
  let townFontRequested=false;
  function ensureTownFont(){if(townFontRequested)return;townFontRequested=true;if(document.fonts)document.fonts.ready.then(()=>document.fonts.load('400 100px "Permanent Marker"')).then(schedule).catch(()=>{});}
  function setVariable(el, name, value) {
    if (el.style.getPropertyValue(name) !== value) el.style.setProperty(name,value);
  }
  function fitTownSign(sign) {
    const width = sign.clientWidth;
    const hero = sign.parentElement;
    if (!width || !hero) return;
    const mobile = window.innerWidth <= 600;
    const loaded = document.fonts?.check('400 100px "Permanent Marker"') || false;
    const name = sign.querySelector('.town-banner-town');
    const signature = [width,mobile,loaded,fontEpoch,name?.textContent].join('|');
    if (signFits.get(sign) !== signature) {
      for (const [selector,variable,size,available] of [
        ['.town-banner-town','--town-name-size',.16,.91],
        ['.town-banner-strapline-text','--town-strap-size',.047,.90]
      ]) {
        const line = sign.querySelector(selector);
        if (!line) continue;
        setVariable(sign,variable,(width * size) + 'px');
        const actual = line.scrollWidth;
        if (actual > width * available) setVariable(sign,variable,(width * size * width * available / actual) + 'px');
      }
      setVariable(sign,'--town-description-size',(mobile ? 14 : width * .035) + 'px');
      if (!mobile) {
        const longest = Math.max(...Array.from(sign.querySelectorAll('.town-description-line'),line => line.scrollWidth));
        if (longest > width * .88) setVariable(sign,'--town-description-size',(width * .035 * width * .88 / longest) + 'px');
      }
      signFits.set(sign,signature);
    }
    const description = sign.querySelector('.town-banner-description');
    const boardHeight = mobile ? Math.max(width * .8154,width * .81 + (description?.offsetHeight || 84)) : width * .90;
    setVariable(sign,'--town-board-height',Math.ceil(boardHeight + width * .06) + 'px');
    const top = Math.max(24,Math.round(width * .085));
    setVariable(hero,'--town-sign-top',top + 'px');
    const controls = hero.querySelector('.hero-controls');
    const controlsHeight = controls?.offsetHeight || 100;
    const controlsTop = Math.ceil(top + boardHeight - width * .045);
    setVariable(hero,'--town-controls-top',controlsTop + 'px');
    setVariable(hero,'--town-hero-height',Math.ceil(controlsTop + controlsHeight + (mobile ? 24 : 30)) + 'px');
  }
  function buildSign(root, hero, name) {
    if (!root.querySelector('#sr-town-reference-style')) {
      const style = document.createElement('style');
      style.id = 'sr-town-reference-style';
      style.textContent = SIGN_CSS;
      root.appendChild(style);
    }
    let sign = hero.querySelector('.town-banner-sign');
    if (sign) {
      sign.querySelector('.town-banner-town').textContent = name;
      fitTownSign(sign);
      return;
    }
    sign = document.createElement('div');
    sign.className = 'town-banner-sign';
    const title = document.createElement('h2');
    title.className = 'town-banner-title';
    const explore = document.createElement('span');
    explore.className = 'town-banner-explore';
    explore.setAttribute('aria-hidden','true');
    explore.innerHTML = EXPLORE_ART;
    const accessible = document.createElement('span');
    accessible.className = 'town-sign-accessible';
    accessible.textContent = 'Explore ';
    const town = document.createElement('span');
    town.className = 'town-banner-town';
    town.textContent = name;
    title.append(accessible,explore,town);
    const strapline = document.createElement('strong');
    strapline.className = 'town-banner-strapline';
    const straplineText = document.createElement('span');
    straplineText.className = 'town-banner-strapline-text';
    straplineText.textContent = 'Amazing places. Unforgettable days.';
    strapline.appendChild(straplineText);
    const description = document.createElement('p');
    description.className = 'town-banner-description';
    for (const text of [
      'Search for towns, cities or attractions and discover',
      'arcades, theme parks, places to stay, great food',
      'and more \u2013 all in one place.'
    ]) {
      const line = document.createElement('span');
      line.className = 'town-description-line';
      line.textContent = text;
      description.append(line,document.createTextNode(' '));
    }
    sign.append(title,strapline,description);
    hero.appendChild(sign);
    fitTownSign(sign);
  }
  function townBanner(root) {
    const hero = root.querySelector('.search-hero');
    const S = window.SR_SEASIDE;
    if (!hero || !S?.archiveQuery) return;
    const query = (root.querySelector('#search-query')?.value || '').trim();
    const locationPage = root.host.id === 'sr-location-directory';
    let term = query;
    try { term = window.SR_PARSE_PLACE_SEARCH?.(query)?.query || query; } catch {}
    let route = '';
    try { route = locationPage ? decodeURIComponent(location.pathname.split('/').filter(Boolean).at(-1) || '') : ''; } catch {}
    const slug = (route || term).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    if (!slug || new URLSearchParams(location.search).has('favourites') || townBanners.get(hero)?.slug === slug) return;
    const photo = hero.querySelector(':scope>img') || hero.querySelector('img');
    if (!photo) return;
    const previous = townBanners.get(hero);
    const state = {
      slug,
      display: previous?.display ?? photo.style.display,
      originalSrc: previous?.originalSrc ?? photo.getAttribute('src'),
      originalAlt: previous?.originalAlt ?? photo.getAttribute('alt')
    };
    townBanners.set(hero,state);
    photo.style.display = 'none';
    if (!townRequests.has(slug)) {
      townRequests.set(slug,S.archiveQuery({
        fields:['title','slug','heroImage','heroImageAlt','imageAltText'],
        filter:{slug:{$eq:slug}},paging:{limit:1}
      },null,false,'Locations').then(result=>result.dataItems?.[0]?.data || null).catch(error=>{
        townRequests.delete(slug);
        throw error;
      }));
    }
    townRequests.get(slug).then(record=>{
      if (!hero.isConnected || townBanners.get(hero) !== state) return;
      if (!record && !locationPage) {
        hero.classList.remove('town-photo-banner');
        hero.querySelector('.town-banner-sign')?.remove();
        if (state.originalSrc) photo.setAttribute('src',state.originalSrc);
        photo.setAttribute('alt',state.originalAlt || '');
        photo.style.display = state.display;
        return;
      }
      ensureTownFont();
      hero.classList.add('town-photo-banner');
      buildSign(root,hero,record?.title || query || term || route.replace(/-/g,' '));
      let src = record?.heroImage;
      if (typeof src === 'object') src = src?.url || src?.src;
      if (src) {
        src = S.img ? S.img(src) : src;
        if (/^https:\/\//.test(src)) {
          const match = src.match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/?]+)(?:\/v1\/.*)?$/);
          if (match) src = match[1] + '/v1/fit/w_2560,h_1440,q_85,enc_auto/town.webp';
          photo.alt = record.heroImageAlt || record.imageAltText || record.title;
          photo.onerror = () => { photo.style.display = 'none'; };
          photo.src = src;
          photo.style.display = state.display;
        }
      }
    }).catch(()=>{
      if (townBanners.get(hero) !== state) return;
      townBanners.delete(hero);
      if (!locationPage && !hero.classList.contains('town-photo-banner')) photo.style.display = state.display;
    });
  }
  function scan() {
    register(document);
    for (const root of roots) {
      if (root.host && !root.host.isConnected) { roots.delete(root); continue; }
      for (const host of root.querySelectorAll('*')) if (host.shadowRoot) register(host.shadowRoot);
      const owned = root.host && /^sr-|^raidertube/.test(root.host.id);
      if (!owned) continue;
      townBanner(root);
      for (const sign of root.querySelectorAll('.town-banner-sign')) fitTownSign(sign);
      if (root.querySelector('.search-hero') && !root.querySelector('#sr-search-banner-width')) {
        const style = document.createElement('style');
        style.id = 'sr-search-banner-width';
        style.textContent = '.search-hero{width:100%;min-width:100%;box-sizing:border-box}';
        root.appendChild(style);
      }
      for (const img of root.querySelectorAll('img')) {
        const width = img.getBoundingClientRect().width;
        if (!width || img.srcset) continue;
        const previous = sources.get(img);
        const base = previous && previous.result === img.src ? previous.base : img.src;
        const result = improve(base, width);
        if (result !== img.src) { sources.set(img,{base,result}); img.src = result; }
      }
      for (const el of root.querySelectorAll('[style*="background"],.hero,.hero-sign,.hero-post,.banner,.promo')) {
        const width = el.getBoundingClientRect().width;
        if (!width) continue;
        const bg = getComputedStyle(el).backgroundImage;
        const previous = backgrounds.get(el);
        const base = previous && previous.result === bg ? previous.base : bg;
        const result = base.replace(/url\(["']?([^"')]+)["']?\)/g, (_,url) => 'url("' + improve(url,width) + '")');
        if (result !== bg) { el.style.setProperty('background-image',result,'important'); backgrounds.set(el,{base,result}); }
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  if (document.fonts) document.fonts.addEventListener('loadingdone',() => { fontEpoch++; schedule(); });
  addEventListener('resize',schedule,{passive:true});
  addEventListener('popstate',schedule);
  let attempts = 0;
  const startup = setInterval(() => { schedule(); if (++attempts >= 30) clearInterval(startup); },1000);
})();

