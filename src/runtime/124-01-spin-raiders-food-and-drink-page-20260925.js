(function(){try{
(()=>{'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext=u=>{try{const x=new URL(String(u||'').trim());return /^https?:$/.test(x.protocol)?x.href:''}catch{return ''}};
const img=(u,w,h)=>{u=String(u||'');let id='';if(u.startsWith('wix:image://v1/'))id=u.split('/')[3];else{const m=u.match(/static\.wixstatic\.com\/media\/([^/?#]+)/);if(m)id=m[1]}if(id)return 'https://static.wixstatic.com/media/'+id+(w?'/v1/fill/w_'+w+',h_'+h+',q_85/'+id:'');return ext(u)};
async function token(){const K='sr-public-visitor-v1';try{const c=JSON.parse(sessionStorage.getItem(K)||'null');if(c&&c.token&&c.until>Date.now())return c.token}catch(e){}
 const r=await fetch('https://www.wixapis.com/oauth2/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:'5296d1b3-888a-4d2e-bdd2-a8a8dd0018d8',grantType:'anonymous'})});const j=await r.json();
 try{sessionStorage.setItem(K,JSON.stringify({token:j.access_token,until:Date.now()+1e3*Math.max(30,(Number(j.expires_in)||300)-60)}))}catch(e){}return j.access_token}
async function q(coll,filter,limit){for(let i=0;i<4;i++){try{const r=await fetch('https://www.wixapis.com/wix-data/v2/items/query',{method:'POST',headers:{'Content-Type':'application/json',Authorization:await token()},body:JSON.stringify({dataCollectionId:coll,query:{filter,paging:{limit:limit||1}}})});
 if(r.status===429){await new Promise(s=>setTimeout(s,800*(i+1)));continue}if(!r.ok)throw Error('Food detail enrichment unavailable');const response=await window.SR_ROUTE_UI.hydrateResult(await r.json(),coll);return (response.dataItems||[]).map(x=>({...x.data,_id:x.id||x.data?._id,_collection:coll}))}catch(e){await new Promise(s=>setTimeout(s,600))}}return []}
function clean(html){const t=document.createElement('template');t.innerHTML=String(html||'');const ok=/^(P|H2|H3|STRONG|B|EM|I|UL|OL|LI|BR|A|BLOCKQUOTE|FIGURE|FIGCAPTION|IMG)$/;
 const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===1){if(!ok.test(c.tagName)){c.replaceWith(...c.childNodes);return walk(n)}[...c.attributes].forEach(a=>{if(!((a.name==='id'&&/^[A-Za-z][\w:.-]*$/.test(a.value))||(c.tagName==='A'&&a.name==='href')||(c.tagName==='IMG'&&(a.name==='src'||a.name==='alt'))))c.removeAttribute(a.name)});
 if(c.tagName==='A'){const raw=c.getAttribute('href')||'',h=raw.startsWith('#')?raw:ext(raw);if(h){c.setAttribute('href',h);if(!h.startsWith('#')&&new URL(h,location.origin).origin!==location.origin){c.setAttribute('target','_blank');c.setAttribute('rel','noopener')}}else c.replaceWith(...c.childNodes)}
 if(c.tagName==='IMG'){const s=img(c.getAttribute('src'));if(s){c.setAttribute('src',s);c.setAttribute('loading','lazy')}else c.remove()}walk(c)}else if(c.nodeType!==3)c.remove()})};walk(t.content);return t}
const stars=v=>{let s='';for(let i=1;i<=5;i++)s+=`<span class="${v>=i-.25?'on':v>=i-.75?'half':'off'}">★</span>`;return `<span class="stars" aria-hidden="true">${s}</span>`};
const CSS=`:host{all:initial;display:block;font-family:"Roboto","Helvetica Neue",Arial,sans-serif;color:#0b2545}*{box-sizing:border-box}a{color:#1d4ed8}
.banner{position:relative;min-height:230px;display:flex;align-items:flex-end;overflow:hidden;background:#0b2545}
.banner img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55}
.banner .in{position:relative;max-width:1240px;width:100%;margin:0 auto;padding:26px 20px}
.bt{display:inline-block;background:#0b2545;color:#fff;font:900 clamp(30px,5vw,54px)/1 "Roboto Condensed",Impact,Arial,sans-serif;text-transform:uppercase;padding:10px 18px;transform:rotate(-2deg);box-shadow:6px 6px 0 #ffd23f}
.bs{display:inline-block;margin:12px 0 0 10px;background:#ffd23f;color:#0b2545;font:800 italic clamp(18px,2.4vw,26px)/1.1 Georgia,serif;padding:8px 14px;transform:rotate(-2deg)}
.ticks{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:18px}.ticks span{color:#fff;font-weight:700;font-size:14px;text-shadow:0 1px 3px #000a}.ticks span:before{content:"✓";display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#ffd23f;color:#0b2545;font-size:12px;margin-right:6px}
.wrap{max-width:1240px;margin:0 auto;padding:16px 20px 60px;display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:24px}
.crumbs{grid-column:1/-1;font-size:13px;color:#51657f}.crumbs a{color:#1d4ed8;text-decoration:none}
.head{display:flex;gap:18px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}.head>div:first-child{flex:1 1 420px}
h1{margin:0;font:900 clamp(30px,4vw,44px)/1.05 "Roboto Condensed",Arial,sans-serif;color:#0b1f6b}
.tag{margin:6px 0 10px;font-size:17px;color:#1d4ed8}
.rate{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:15px}.stars span{font-size:22px;letter-spacing:1px}.stars .on{color:#f5b301}.stars .half{color:#f5d27a}.stars .off{color:#d6dde8}.rate b{font-size:22px}
.raider{display:inline-flex;align-items:center;gap:8px;background:#0b2545;color:#fff;border-radius:10px;padding:6px 10px;font-weight:800;font-size:13px}.raider em{font-style:normal;color:#ffd23f;font-size:18px}
.cta{display:flex;flex-direction:column;gap:8px;min-width:210px}
.btn{display:flex;justify-content:space-between;align-items:center;gap:10px;text-decoration:none;font-weight:800;font-size:15px;padding:11px 16px;border-radius:9px;border:2px solid transparent}
.btn.pink{background:#ff2e7a;color:#fff}.btn.blue{background:#1d4ed8;color:#fff}.btn.ghost{background:#fff;color:#1d4ed8;border-color:#c9d6ee}
.btn:hover{filter:brightness(1.06)}.btn:focus-visible{outline:3px solid #ffd23f;outline-offset:2px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.chips span{background:#fff;border:1px solid #d8e2f1;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:700;color:#0b2545}
.grid{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:8px;height:360px;margin:6px 0 22px}
.grid{overflow:hidden}.grid>img{width:100%;height:100%;min-height:0;min-width:0;object-fit:cover;border-radius:10px;display:block}.grid img:first-child{grid-row:1/3}
.grid.one{grid-template-columns:1fr;grid-template-rows:1fr}.grid.one img:first-child{grid-row:auto}
h2{font:900 26px/1.1 "Roboto Condensed",Arial,sans-serif;color:#0b1f6b;margin:26px 0 10px}
.about{background:#fff;border-radius:14px;padding:22px 24px;box-shadow:0 8px 24px #0b254512;font-size:16.5px;line-height:1.7;color:#1c2f4d}
.about h2,.about h3{font:800 21px/1.2 "Roboto Condensed",Arial,sans-serif;color:#0b1f6b;margin:22px 0 6px}.about p{margin:0 0 12px}
.about figure{margin:14px 0}.about figure img{width:100%;border-radius:10px}.about figcaption{font-size:13px;color:#64748b;margin-top:4px}
.src{font-size:12px;color:#7a8ca3;margin-top:10px}
aside{display:flex;flex-direction:column;gap:16px}
.card{background:#fff;border-radius:14px;padding:16px;box-shadow:0 8px 24px #0b254512;font-size:14px;line-height:1.55}
.card h3{margin:0 0 8px;font:900 20px/1.1 "Roboto Condensed",Arial,sans-serif;color:#0b1f6b}
.map{width:100%;aspect-ratio:4/3;border:0;border-radius:10px;display:block;background:#dfe9f5;margin-bottom:10px}
.fac{list-style:none;margin:0;padding:0}.fac li{padding:5px 0;border-bottom:1px solid #eef2f8}.fac li:before{content:"✓ ";color:#16a34a;font-weight:900}
.near a{display:flex;gap:10px;align-items:center;text-decoration:none;color:#0b2545;padding:6px 0;border-bottom:1px solid #eef2f8}.near img{width:64px;height:48px;object-fit:cover;border-radius:6px;background:#dfe9f5}.near b{display:block;font-size:14px}.near small{color:#64748b}
.promo{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px}
.promo a{display:block;background:#0b2545;color:#fff;text-decoration:none;border-radius:14px;padding:20px;min-height:120px}.promo b{display:block;font:900 20px/1.1 "Roboto Condensed",Arial,sans-serif;text-transform:uppercase;margin-bottom:6px}.promo span{display:inline-block;margin-top:10px;background:#ffd23f;color:#0b2545;font-weight:800;padding:7px 12px;border-radius:8px}
.loading{grid-column:1/-1;padding:80px 20px;text-align:center;color:#5a6f88}
@media(max-width:900px){.wrap{grid-template-columns:1fr}.grid{height:240px}.promo{grid-template-columns:1fr}.cta{width:100%}}`;
async function render(f,d,near,root,ctx){const name=f.displayName||d.title||f.title,town=f.town||d.locationName||'',tslug=f.townSlug||d.locationSlug||'';
 const hero=img(f.heroImage||d.heroImage,1400,800);
 const rv=Number(d.raiderRating),rs=rv?(rv>5?rv/2:rv):0,pub=Number(d.publicRating)||0,cnt=Number(d.publicReviewCount)||0;
 const web=ext(d.website)||ext(d.outboundUrl),tel=String(d.phone||'').replace(/[^0-9+]/g,'');
 const maps=ext(d.googleMapsUrl)||(d.latitude&&d.longitude?'https://www.google.com/maps/search/?api=1&query='+d.latitude+','+d.longitude:(d.address?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+' '+d.address):''));
 const mapSrc=d.latitude&&d.longitude?'https://maps.google.com/maps?q='+d.latitude+','+d.longitude+'&z=16&output=embed':(d.address?'https://maps.google.com/maps?q='+encodeURIComponent(name+', '+d.address)+'&z=16&output=embed':'');
 const tpl=clean(await window.SR_ROUTE_HTML.prepare(d.sourceFacts||d.fullDescription||d.description||''));if(!ctx.current())return;const pics=[hero,...[...tpl.content.querySelectorAll('img')].map(i=>i.getAttribute('src'))].filter(Boolean);
 const offersUrl=new URL(window.SR_ROUTES.viewPaths.offers,location.origin);offersUrl.searchParams.set('town',town);
 const uniq=[...new Set(pics)].slice(0,5);
 const cat=String(d.category||'Food & drink').split('·').pop().trim();
 const chips=[cat,...(Array.isArray(d.tags)?d.tags:[]).filter(t=>!/raider score|grimsby|cleethorpes|hidden gems/i.test(t))].filter((v,i,a)=>v&&a.indexOf(v)===i).slice(0,8);
 const takeaway=/takeaway|pizza|kebab/i.test(d.category||'');
 root.innerHTML=`<style>${CSS}</style>
<section class="banner">${hero?`<img src="${E(hero)}" alt="">`:''}<div class="in"><div class="bt">Good food &amp; drink</div><br><div class="bs">A table worth travelling for.</div><div class="ticks">${['Great food &amp; drink','Personally recommended','Real reviews','Local favourite'].map(t=>`<span>${t}</span>`).join('')}</div></div></section>
<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/destination/${E(tslug)}">${E(town)}</a> › Food &amp; Drink › <span aria-current="page">${E(name)}</span></nav>
<main><div class="head"><div><h1>${E(name)}, ${E(town)}</h1><p class="tag">${E(d.shortDescription||f.shortDescription||'')}</p>
<div class="rate">${pub?`${stars(pub)}<b>${pub.toFixed(1)}</b><span>(${cnt?cnt.toLocaleString('en-GB')+' ':''}${E(d.publicRatingSource||'')} reviews)</span>`:''}${rs?`<span class="raider">Raider Score <em>${rs.toFixed(1)}/5</em></span>`:''}</div></div>
<div class="cta">${tel?`<a class="btn pink" href="tel:${E(tel)}">${takeaway?'Call to order':'Book a table'} <span>☎</span></a>`:''}${web?`<a class="btn blue" href="${E(web)}" target="_blank" rel="noopener">${takeaway?'Order online':'Visit website'} <span>→</span></a>`:''}${maps?`<a class="btn ghost" href="${E(maps)}" target="_blank" rel="noopener">Get directions <span>→</span></a>`:''}</div></div>
${chips.length?`<div class="chips">${chips.map(c=>`<span>${E(c)}</span>`).join('')}</div>`:''}
${uniq.length?`<div class="grid${uniq.length<3?' one':''}">${(uniq.length<3?uniq.slice(0,1):uniq).map((u,i)=>`<img src="${E(u)}" alt="${E(i?name+', '+town:(d.imageAltText||name+', '+town))}" loading="${i?'lazy':'eager'}">`).join('')}</div>`:''}
<h2>About ${E(name)}</h2><div class="about">${tpl.innerHTML||`<p>${E(d.shortDescription||'')}</p>`}${d.sourceName?`<p class="src">Sources: ${E(d.sourceName)}</p>`:''}</div></main>
<aside>${mapSrc||d.address?`<div class="card">${mapSrc?`<iframe class="map" title="Map showing ${E(name)}" src="${E(mapSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`:''}<h3>${E(name)}</h3><p>${E(d.address||town)}</p>${maps?`<a href="${E(maps)}" target="_blank" rel="noopener">Get directions →</a>`:''}</div>`:''}
${d.openingHoursSummary||d.phone?`<div class="card"><h3>Opening hours</h3>${d.openingHoursSummary?`<p>${E(d.openingHoursSummary)}</p>`:''}${d.phone?`<p><strong>Phone:</strong> <a href="tel:${E(tel)}">${E(d.phone)}</a></p>`:''}</div>`:''}
${Array.isArray(d.facilities)&&d.facilities.length?`<div class="card"><h3>Facilities</h3><ul class="fac">${d.facilities.map(x=>`<li>${E(x)}</li>`).join('')}</ul></div>`:''}
${near.filter(n=>window.SR_ROUTE_UI.ready(n)).length?`<div class="card near"><h3>Nearby places</h3>${near.filter(n=>window.SR_ROUTE_UI.ready(n)).map(n=>window.SR_ROUTE_UI.ready(n)?`<a href="${E(window.SR_PLACE_HREF(n))}">${n.heroImage?`<img src="${E(img(n.heroImage,160,120))}" alt="" loading="lazy">`:'<img alt="">'}<span><b>${E(n.title)}</b><small>${E(String(n.category||'').split('·').pop().trim())}</small></span></a>`:window.SR_ROUTE_UI.unavailable(n,{className:'card',image:img(n.heroImage,160,120),title:n.title})).join('')}</div>`:''}</aside>
<div class="promo"><a href="/destination/${E(tslug)}"><b>Plan your perfect food stop</b>More places to eat and drink in ${E(town)}.<br><span>Explore ${E(town)} →</span></a><a href="${E(offersUrl.pathname+offersUrl.search)}"><b>Latest food &amp; drink offers</b>Hand-picked deals and days out.<br><span>View offers →</span></a><a href="/destination/${E(tslug)}"><b>Explore nearby places</b>Make a day of it with brilliant places to visit.<br><span>Find things to do →</span></a></div></div>`;
 const TT=name+', '+town+' | Spin Raiders';ctx.setTitle(TT)}
window.SR_DETAIL_PAGES.register({collection:'FoodAndDrink',kinds:['food'],async render(result,ctx){
 if(!await ctx.waitFor(()=>document.body&&window.SR_ROUTE_UI))return;
 const hide=ctx.own(document.createElement('style'));
hide.textContent='html.sr-food-page #sr-seaside-root,html.sr-food-page #sr-seaside-related,html.sr-food-page #SITE_CONTAINER,html.sr-food-page #sr-shell-page,html.sr-food-page #sr-location-directory{display:none!important}html.sr-food-page,html.sr-food-page body{background:#f3f6fb!important}#sr-food-page{display:block;width:100%}';
ctx.className('sr-food-page');(document.head||document.documentElement).append(hide);
 const host=ctx.own(document.createElement('div'));host.id='sr-food-page';const root=host.attachShadow({mode:'open'});
 const header=document.getElementById('sr-brand-header');header?header.after(host):document.body.prepend(host);
 root.innerHTML=`<style>${CSS}</style><div class="wrap"><div class="loading" role="status">Loading…</div></div>`;
 ctx.commit({loading:true});
 const f={...result.row,townSlug:result.row.townSlug||window.SR_ROUTES.parse(result.route.path).params?.townSlug};
 const linkedSource=result.sourceRecords?.find(source=>source.key==='NearbyAttractions:'+f.linkedAttractionId);
 const linked=linkedSource?(linkedSource.withheld?{}:linkedSource.row||{}):f.linkedAttractionId?((await q('NearbyAttractions',{_id:f.linkedAttractionId},1))[0]||{}):{};
 if(!ctx.current())return;
 const d={...f,...linked};
 const locationSlug=f.townSlug||d.locationSlug;
 const near=locationSlug?(await q('NearbyAttractions',{locationSlug,heroImage:{$exists:true}},8)).filter(n=>n._id!==f.linkedAttractionId).slice(0,5):[];
 if(!ctx.current())return;
 await render(f,d,near,root,ctx);if(!ctx.current())return;
 const displayed={};const bodyField=['sourceFacts','fullDescription','description'].find(field=>d[field]);if(bodyField){const key=linked[bodyField]?'NearbyAttractions:'+f.linkedAttractionId:result.collection+':'+f._id;displayed[key]={[bodyField]:d[bodyField]};}
 await window.SR_RENDER_SOURCE_RECORDS(root,result,{current:ctx.current,selector:'.wrap',displayed});if(ctx.current())ctx.commit();
}});
})();
}catch(e){console.warn('SR snippet failed: Spin Raiders Food and Drink Page 20260925',e)}})();

