(function(){try{
(()=>{'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext=u=>{try{const x=new URL(String(u||'').trim());return /^https?:$/.test(x.protocol)?x.href:''}catch{return ''}};
const img=u=>{u=String(u||'');if(u.startsWith('wix:image://v1/')){const id=u.split('/')[3];return 'https://static.wixstatic.com/media/'+id}return ext(u)};
function clean(html){const t=document.createElement('template');t.innerHTML=String(html||'');const ok=/^(P|H2|H3|STRONG|B|EM|I|UL|OL|LI|BR|A|BLOCKQUOTE)$/;
 const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===1){if(!ok.test(c.tagName)){c.replaceWith(...c.childNodes);return walk(n)}[...c.attributes].forEach(a=>{if(!(c.tagName==='A'&&a.name==='href'||a.name==='id'&&/^[A-Za-z][\w:.-]*$/.test(a.value)))c.removeAttribute(a.name)});if(c.tagName==='A'){const raw=c.getAttribute('href')||'',h=raw.startsWith('#')?raw:ext(raw);if(h){c.setAttribute('href',h);if(!h.startsWith('#')&&new URL(h,location.origin).origin!==location.origin){c.setAttribute('target','_blank');c.setAttribute('rel','noopener')}}else c.replaceWith(...c.childNodes)}walk(c)}else if(c.nodeType!==3)c.remove()})};walk(t.content);
 t.content.querySelectorAll('h2').forEach(h=>{const x=document.createElement('h3');x.innerHTML=h.innerHTML;h.replaceWith(x)});return t.innerHTML}
function photoCredit(p){return [p.credit?E(p.credit):'',p.date?'Photographed '+E(String(p.date).slice(0,19)):'',ext(p.sourceUrl)?`<a href="${E(ext(p.sourceUrl))}" target="_blank" rel="noopener">${E(p.originalTitle||'Photo source')}</a>`:'',p.license&&ext(p.licenseUrl)?`<a href="${E(ext(p.licenseUrl))}" target="_blank" rel="noopener">${E(p.license)}</a>`:E(p.license||'')].filter(Boolean).join(' · ')}
const CSS=`:host{all:initial;display:block;font-family:"Roboto","Helvetica Neue",Arial,sans-serif;color:#0b2545}
*{box-sizing:border-box}a{color:#1d6fd8}
.wrap{max-width:1180px;margin:0 auto;padding:18px 20px 60px}
.crumbs{font-size:13px;color:#5a6f88;margin:4px 0 16px}.crumbs a{color:#1d6fd8;text-decoration:none}.crumbs a:hover{text-decoration:underline}
.hero{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:22px;align-items:stretch}
.photo{border-radius:18px;overflow:hidden;background:linear-gradient(135deg,#13315c,#1d6fd8);aspect-ratio:3/2;position:relative;box-shadow:0 14px 34px #0b254526}
.photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.photo .ph{position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-weight:900;font-size:20px;text-align:center;padding:20px}
.credit{font-size:11px;color:#7a8ca3;margin-top:6px}
.panel{background:#fff;border-radius:18px;padding:24px;box-shadow:0 14px 34px #0b25451a;display:flex;flex-direction:column;gap:12px}
.chip{align-self:flex-start;background:#e8f1fd;color:#1d6fd8;font-weight:800;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:6px 10px;border-radius:999px}
h1{margin:0;font-size:clamp(30px,4vw,46px);line-height:1.05;font-weight:900;color:#0b2545}
.where{margin:0;color:#39506b;font-size:15px}
.scores{display:flex;flex-wrap:wrap;gap:10px}
.score{background:#0b2545;color:#fff;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;min-width:120px}
.score b{font-size:22px;line-height:1;color:#ffd23f}.score span{font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin-top:4px;color:#c9dcf2}
.score.pub{background:#fff;border:2px solid #e2eaf4;color:#0b2545}.score.pub b{color:#0b2545}.score.pub span{color:#5a6f88}
.lede{margin:0;font-size:16px;line-height:1.55;color:#223a57}
.btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:auto}
.btn{display:inline-flex;align-items:center;gap:6px;text-decoration:none;font-weight:900;font-size:14px;padding:12px 16px;border-radius:11px;border:2px solid transparent}
.btn.main{background:#ff2e88;color:#fff}.btn.alt{background:#ffd23f;color:#0b2545}.btn.ghost{border-color:#cfdced;color:#0b2545;background:#fff}
.btn:hover{filter:brightness(1.05);transform:translateY(-1px)}.btn:focus-visible{outline:3px solid #1d6fd8;outline-offset:2px}
.facts{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 4px}.facts span{background:#fff;border:1px solid #dbe5f1;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:700;color:#223a57}
.body{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:26px;margin-top:22px;align-items:start}
article{background:#fff;border-radius:18px;padding:26px 28px;box-shadow:0 10px 26px #0b254514;font-size:17px;line-height:1.7;color:#1c3350}
article h3{font-size:22px;line-height:1.2;margin:26px 0 8px;color:#0b2545}article h3:first-child{margin-top:0}article p{margin:0 0 14px}
aside{display:flex;flex-direction:column;gap:16px;position:sticky;top:90px}
.box{background:#fff;border-radius:16px;padding:18px;box-shadow:0 10px 26px #0b254514;font-size:14px;line-height:1.55;color:#223a57}
.box h2{font-size:16px;margin:0 0 8px;color:#0b2545}.box p{margin:0 0 8px}
.map{width:100%;aspect-ratio:4/3;border:0;border-radius:12px;display:block;background:#dfe9f5}
.more{display:block;text-align:center;background:#0b2545;color:#fff;text-decoration:none;font-weight:900;padding:14px;border-radius:12px}
.src{font-size:12px;color:#7a8ca3;margin-top:14px}
.loading{padding:80px 20px;text-align:center;color:#5a6f88;font-size:16px}
.visit-gallery{margin-top:30px}.visit-gallery h2{font-size:28px;margin:0 0 8px}.visit-gallery p{color:#51657f}.gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:18px}.gallery-grid figure{margin:0;background:white;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px #0b254514}.gallery-grid img{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;display:block}.gallery-grid figcaption{padding:12px;font-size:14px;line-height:1.5}.gallery-grid a:focus-visible{outline:4px solid #ff2e88;outline-offset:-4px;display:block}
@media(max-width:900px){.hero,.body{grid-template-columns:1fr}aside{position:static}article{padding:20px}}
@media(prefers-reduced-motion:reduce){.btn:hover{transform:none}}`;

async function render(d,root,ctx,policy={}){const t=d.title||d.name||'This place',town=d.locationName||'',tslug=d.locationSlug||'';
 const pic=img(d.heroImage||d.image?.url||d.image),alt=d.imageAltText||d.imageAlt||(t+(town?', '+town:''));
 const raider=Number(d.raiderRating),rs=raider?(raider>5?raider/2:raider):0;
 const web=policy.offerActionsAllowed===false?'':ext(d.website)||ext(d.outboundUrl)||ext(d.affiliateUrl)||ext(d.offerUrl)||ext(d.bookingUrl),maps=ext(d.googleMapsUrl)||(d.latitude&&d.longitude?'https://www.google.com/maps/search/?api=1&query='+d.latitude+','+d.longitude:(d.address?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t+' '+d.address):''));
 const tel=policy.offerActionsAllowed===false?'':String(d.phone||'').replace(/[^0-9+]/g,'');const food=/food|restaurant|takeaway|pizza|cafe|café|pub|bar/i.test(d.category||'');const cinema=/cinema/i.test(d.category||'');
 const body=clean(await window.SR_ROUTE_HTML.prepare(d.sourceFacts||d.fullDescription||d.guideContent||d.description||''));if(!ctx.current())return;
 const cinemaRecord=window.SR_CINEMA_IDS?.has(d._id);
 const heroMeta=cinemaRecord?(d.heroImageMetadata||null):null;
 const gallery=cinemaRecord?(Array.isArray(d.gallery)?d.gallery:[]).filter(p=>p&&img(p.src)):[];
 const mapSrc=d.latitude&&d.longitude?'https://maps.google.com/maps?q='+d.latitude+','+d.longitude+'&z=16&output=embed':(d.address?'https://maps.google.com/maps?q='+encodeURIComponent(t+', '+d.address)+'&z=16&output=embed':'');
 root.innerHTML=`<style>${CSS}${cinemaRecord?".credit{line-height:1.6;font-size:12px}":""}</style><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › ${cinema?'<a href="/cinemas">Cinemas</a> › ':''}${tslug?`<a href="/destination/${E(tslug)}">${E(town||tslug)}</a> › `:''}<span aria-current="page">${E(t)}</span></nav>
<section class="hero"><div><div class="photo">${pic?`<img src="${E(/^https:\/\/static\.wixstatic\.com\/media\/[^/]+~mv2\.(?:webp|jpe?g|png)$/.test(pic)?pic+(cinemaRecord?"/v1/fit/w_1200,h_900,q_85,enc_auto/":"/v1/fit/w_560,h_560,q_60,enc_auto/")+pic.split("/").pop():pic)}" alt="${E(alt)}" width="900" height="600">`:`<div class="ph">${E(t)}</div>`}</div>${heroMeta?`<div class="credit">${E(heroMeta.caption||'Venue photograph')} · ${photoCredit(heroMeta)}</div>`:d.imageCredit?`<div class="credit">Photo: ${E(d.imageCredit)}</div>`:''}</div>
<div class="panel"><span class="chip">${E(String(d.category||'Place to visit').split('·').pop().trim())}</span><h1>${E(t)}</h1>
<p class="where">⌖ ${E(d.address||town)}</p>
${(rs||d.publicRating)?`<div class="scores">${rs?`<div class="score"><b>${rs.toFixed(1)}/5</b><span>Raider Score</span></div>`:''}${d.publicRating?`<div class="score pub"><b>★ ${E(d.publicRating)}</b><span>${d.publicReviewCount?Number(d.publicReviewCount).toLocaleString('en-GB')+' ':''}${E(d.publicRatingSource||'public')} reviews</span></div>`:''}</div>`:''}
${d.shortDescription?`<p class="lede">${E(d.shortDescription)}</p>`:''}
<div class="btns">${web?`<a class="btn main" href="${E(web)}" target="_blank" rel="${d.affiliateUrl&&web===ext(d.affiliateUrl)?'sponsored noopener':'noopener'}">${cinema?'Films & showtimes':food?'Order online':'Visit website'} →</a>`:''}${tel?`<a class="btn alt" href="tel:${E(tel)}">☎ Call ${E(d.phone)}</a>`:''}${maps?`<a class="btn ghost" href="${E(maps)}" target="_blank" rel="noopener">Directions</a>`:''}</div></div></section>
${Array.isArray(d.facilities)&&d.facilities.length?`<div class="facts">${d.facilities.slice(0,10).map(f=>`<span>${E(f)}</span>`).join('')}</div>`:''}
${gallery.length?`<section class="visit-gallery" aria-label="Cinema photographs"><h2>${d.brand==='Vue'?'A look around the cinema':'Inside the cinema adventure'}</h2><p>${d.brand==='Vue'?'Venue photographs; dates and credits appear below':E(d.imageCredit||d.reviewAuthor||'Venue')} · ${gallery.length} photos. Select a photo to view it full size.</p><div class="gallery-grid">${gallery.map(p=>`<figure><a href="${E(img(p.originalSrc||p.src))}" target="_blank" rel="noopener"><img src="${E(img(p.src))}" alt="${E(p.alt||p.title||t)}" loading="lazy" width="640" height="480"></a><figcaption>${E(p.title||p.alt||'')}${p.credit||p.sourceUrl?`<div class="credit">${photoCredit(p)}</div>`:''}</figcaption></figure>`).join('')}</div></section>`:''}
<div class="body">${body?`<article>${body}${d.sourceName?`<p class="src">Sources: ${E(d.sourceName)}${d.verifiedDate?' · checked '+E(new Date(d.verifiedDate).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})):''}</p>`:''}</article>`:`<article><p>${E(d.shortDescription||'More details coming soon.')}</p></article>`}
<aside>${cinemaRecord&&d.brand==='Vue'?`<div class="box"><h2>What’s on at this Vue?</h2><p>Use the branch’s official listings for today’s films, available seats and final ticket prices.</p><a class="btn main" href="${E(web)}" target="_blank" rel="noopener">Check live listings at Vue →</a><p class="src">Showtimes are on Vue’s website. They are not automatically imported here.</p></div>`:''}${(d.openingHoursSummary||d.address||d.phone)?`<div class="box"><h2>Plan your visit</h2>${d.openingHoursSummary?`<p>${E(d.openingHoursSummary)}</p>`:''}${d.address?`<p><strong>Address:</strong> ${E(d.address)}</p>`:''}${d.phone?`<p><strong>Phone:</strong> <a href="tel:${E(tel)}">${E(d.phone)}</a></p>`:''}</div>`:''}
${mapSrc?`<div class="box"><iframe class="map" title="Map showing ${E(t)}" src="${E(mapSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`:''}
${tslug?`<a class="more" href="/destination/${E(tslug)}">More to do in ${E(town||tslug)} →</a>`:''}</aside></div></div>`;
 const TT=t+(town?', '+town:'')+' | Spin Raiders';ctx.setTitle(TT);
 if(ctx.current())window.SR_CINEMA_SHOWTIMES?.(root,d);
}
async function renderCurrentPlace(result,ctx){
 if(result.collection==='AffiliateOffers'&&result.route.recordRole!=='business')throw Error('Business source unavailable');
 if(!await ctx.waitFor(()=>document.body))return;
 const hide=ctx.own(document.createElement('style'));hide.id='sr-place-page-isolation';
hide.textContent='html.sr-place-page #sr-seaside-root,html.sr-place-page #sr-seaside-related,html.sr-place-page #SITE_CONTAINER,html.sr-place-page #sr-location-directory{display:none!important}html.sr-place-page,html.sr-place-page body{background:#f4f7fb!important}#sr-place-page{display:block;width:100%}';
ctx.className('sr-place-page');(document.head||document.documentElement).append(hide);
 const host=ctx.own(document.createElement('div'));host.id='sr-place-page';const root=host.attachShadow({mode:'open'});
 const header=document.getElementById('sr-brand-header');header?header.after(host):document.body.prepend(host);
 const params=window.SR_ROUTES.parse(result.route.path).params||{};
 await render({...result.row,shortDescription:result.row.shortDescription||result.row.summary,locationName:result.row.locationName||result.row.destination||result.row.town,locationSlug:result.row.locationSlug||params.locationSlug||params.townSlug},root,ctx,result.route);
 if(!ctx.current())return;
 await window.SR_RENDER_SOURCE_RECORDS(root,result,{current:ctx.current,selector:'.wrap'});if(ctx.current())ctx.commit();
}
window.SR_DETAIL_PAGES.register({collection:'NearbyAttractions',kinds:['food','arcade','agc','cinema','bowling','bowlingOperator','bingo','casino','holidayPark','arcadeBar','fishing','themePark','zoo','seaLife','museum','historicSite','pier','beach','tour','outdoors','service','attraction'],render:renderCurrentPlace});
window.SR_DETAIL_PAGES.register({collection:'AffiliateOffers',kinds:['food','arcade','agc','cinema','bowling','bowlingOperator','bingo','casino','holidayPark','arcadeBar','fishing','themePark','zoo','seaLife','museum','historicSite','pier','beach','tour','outdoors','service','attraction'],render:renderCurrentPlace});
})();
}catch(e){console.warn('SR snippet failed: Spin Raiders Place Page 20260925',e)}})();

