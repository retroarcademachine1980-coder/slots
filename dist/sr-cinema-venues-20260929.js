/* Cinema venue navigation repair. Only known cinema records are affected. */
(()=>{'use strict';
const aliases={"tower-cinema-skegness": "sr-tower-cinema-skegness", "scott-cinemas-barnstaple": "sr-scott-cinema-scobar", "scott-cinemas-newton-abbot": "sr-scott-cinema-sconew", "scott-cinemas-sidmouth": "sr-scott-cinema-scorad", "scott-cinemas-bridgwater": "sr-scott-cinema-scobwr", "scott-cinemas-exmouth": "sr-scott-cinema-scoexm", "scott-cinemas-bristol": "sr-scott-cinema-scoorp", "cineworld-hull": "sr-cineworld-hull-kingswood", "cineworld-hull-kingswood": "sr-cineworld-hull-kingswood", "parkway-playhouse-cinema-louth": "sr-parkway-playhouse-cinema-louth", "parkway-cinema-beverley": "sr-parkway-cinema-beverley", "parkway-cinema-theatre-beverley": "sr-parkway-cinema-beverley", "parkway-cinema-cleethorpes": "sr-parkway-cinema-cleethorpes", "parkway-cinema-theatre-cleethorpes": "sr-parkway-cinema-cleethorpes", "vue-accrington": "sr-vue-accrington", "vue-altrincham": "sr-vue-altrincham", "vue-barrow": "sr-vue-barrow", "vue-bedford": "sr-vue-bedford", "vue-bicester": "sr-vue-bicester", "vue-birkenhead": "sr-vue-birkenhead", "vue-birmingham": "sr-vue-birmingham", "vue-blackburn": "sr-vue-blackburn", "vue-bolton": "sr-vue-bolton", "vue-bristol-longwell-green": "sr-vue-bristol-longwell-green", "vue-bromley": "sr-vue-bromley", "vue-bury-the-rock": "sr-vue-bury-the-rock", "vue-camberley": "sr-vue-camberley", "vue-carlisle": "sr-vue-carlisle", "vue-carmarthen": "sr-vue-carmarthen", "vue-cheshire-oaks": "sr-vue-cheshire-oaks", "vue-cleveleys": "sr-vue-cleveleys", "vue-cramlington": "sr-vue-cramlington", "vue-croydon-purley-way": "sr-vue-croydon-purley-way", "vue-cwmbran": "sr-vue-cwmbran", "vue-dagenham": "sr-vue-dagenham", "vue-darlington": "sr-vue-darlington", "vue-doncaster": "sr-vue-doncaster", "vue-eastleigh": "sr-vue-eastleigh", "vue-edinburgh-ocean-terminal": "sr-vue-edinburgh-ocean-terminal", "vue-eltham": "sr-vue-eltham", "vue-exeter": "sr-vue-exeter", "vue-farnborough": "sr-vue-farnborough", "vue-gateshead": "sr-vue-gateshead", "vue-glasgow-fort": "sr-vue-glasgow-fort", "vue-glasgow-st-enoch": "sr-vue-glasgow-st-enoch", "vue-halifax": "sr-vue-halifax", "vue-hamilton": "sr-vue-hamilton", "vue-harrow": "sr-vue-harrow", "vue-hartlepool": "sr-vue-hartlepool", "vue-hull": "sr-vue-hull", "vue-inverness": "sr-vue-inverness", "vue-lancaster": "sr-vue-lancaster", "vue-leamington-spa": "sr-vue-leamington-spa", "vue-leeds-the-light": "sr-vue-leeds-the-light", "vue-leicester": "sr-vue-leicester", "vue-livingston": "sr-vue-livingston", "vue-finchley-road": "sr-vue-finchley-road", "vue-fulham-broadway": "sr-vue-fulham-broadway", "vue-islington": "sr-vue-islington", "vue-north-finchley": "sr-vue-north-finchley", "vue-piccadilly": "sr-vue-piccadilly", "vue-leicester-square": "sr-vue-leicester-square", "vue-westfield": "sr-vue-westfield", "vue-westfield-stratford-city": "sr-vue-westfield-stratford-city", "vue-manchester-printworks": "sr-vue-manchester-printworks", "vue-manchester": "sr-vue-manchester", "vue-merthyr-tydfil": "sr-vue-merthyr-tydfil", "vue-newbury": "sr-vue-newbury", "vue-newcastle-under-lyme": "sr-vue-newcastle-under-lyme", "vue-northampton": "sr-vue-northampton", "vue-norwich": "sr-vue-norwich", "vue-oxford": "sr-vue-oxford", "vue-plymouth": "sr-vue-plymouth", "vue-portsmouth": "sr-vue-portsmouth", "vue-preston": "sr-vue-preston", "vue-reading": "sr-vue-reading", "vue-redditch": "sr-vue-redditch", "vue-romford": "sr-vue-romford", "vue-scunthorpe": "sr-vue-scunthorpe", "vue-sheffield": "sr-vue-sheffield", "vue-southport": "sr-vue-southport", "vue-staines": "sr-vue-staines", "vue-stirling": "sr-vue-stirling", "vue-stroud": "sr-vue-stroud", "vue-swansea": "sr-vue-swansea", "vue-thanet": "sr-vue-thanet", "vue-thurrock": "sr-vue-thurrock", "vue-torbay": "sr-vue-torbay", "vue-watford": "sr-vue-watford", "vue-wood-green": "sr-vue-wood-green", "vue-worcester": "sr-vue-worcester", "vue-york": "sr-vue-york", "vue-swindon": "sr-vue-swindon", "vue-basildon": "sr-vue-basildon", "vue-nottingham": "sr-vue-nottingham", "vue-poole": "sr-vue-poole", "vue-castleford": "sr-vue-castleford", "vue-colchester": "sr-vue-colchester", "vue-basingstoke-festival-place": "sr-vue-basingstoke-festival-place", "vue-bristol-cribbs-causeway": "sr-vue-bristol-cribbs-causeway", "vue-edinburgh-omni-centre": "sr-vue-edinburgh-omni-centre", "vue-leeds-kirkstall-road": "sr-vue-leeds-kirkstall-road"};
window.SR_CINEMA_IDS=new Set(Object.values(aliases));
window.SR_CINEMA_URL=function(value){
 try{const u=new URL(value,location.origin);if(u.origin!==location.origin)return '';
 const m=u.pathname.match(/^\/(?:nearby-attractions|cinemas)\/([^/]+)\/?$/);
 const id=m?aliases[m[1]]:(u.searchParams.get('collection')==='NearbyAttractions'?u.searchParams.get('place'):'');
 if(!window.SR_CINEMA_IDS.has(id))return '';
 return '/?collection=NearbyAttractions&place='+encodeURIComponent(id);
 }catch{return ''}
};
const seen=new WeakSet();let queued=false;
function scan(root=document){
 if(!seen.has(root)){seen.add(root);new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;scan()})}}).observe(root,{childList:true,subtree:true});}
 root.querySelectorAll('a[href]').forEach(a=>{const url=window.SR_CINEMA_URL(a.href);if(url&&a.getAttribute('href')!==url)a.setAttribute('href',url)});
 root.querySelectorAll('*').forEach(el=>{if(el.shadowRoot)scan(el.shadowRoot)});
}
document.addEventListener('click',e=>{
 const a=e.composedPath().find(n=>n.tagName==='A'&&n.href);if(!a)return;
 const url=window.SR_CINEMA_URL(a.href);if(url)a.href=url;
},true);
scan();let ticks=0;const timer=setInterval(()=>{scan();if(++ticks===40)clearInterval(timer)},500);
})();

/* [131] Spin Raiders automatic cinema showtimes */
(function(){
 window.SR_CINEMA_SHOWTIMES=async function(root,d){
  const code=String(d.cinemaFeedKey||'');if(!['SCOBAR','SCONEW','SCORAD','SCOBWR','SCOEXM','SCOORP'].includes(code))return;
  const article=root.querySelector('article');if(!article)return;
  const section=document.createElement('section');section.setAttribute('aria-label','Cinema showtimes');section.innerHTML='<h3>What’s showing</h3><p role="status">Loading cinema times…</p>';article.before(section);
  section.style.cssText='grid-column:1/-1;background:white;border-radius:16px;padding:24px;margin-bottom:4px;color:#0b2545';
  const safe=value=>{try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='scottcinemas.co.uk'||u.hostname.endsWith('.scottcinemas.co.uk'))?u.href:''}catch{return ''}};
  const fallback=()=>{section.replaceChildren();const h=document.createElement('h3');h.textContent='What’s showing';const p=document.createElement('p');p.textContent='Up-to-date screening times are temporarily unavailable here. Check the cinema before travelling.';section.append(h,p);const url=safe(d.website);if(url){const a=document.createElement('a');a.href=url;a.textContent='Check films & book with the cinema →';a.target='_blank';a.rel='noopener';section.append(a)}};
  try{
   const r=await fetch('https://raw.githubusercontent.com/retroarcademachine1980-coder/slots/main/dist/cinema-showtimes/'+code+'.json',{signal:AbortSignal.timeout(10000),cache:'no-cache'});if(!r.ok)throw Error('Feed unavailable');const data=await r.json(),now=Date.now(),updated=Date.parse(data.updatedAt),sourceUpdated=Date.parse(data.sourceUpdatedAt);
   if(data.cinema!==code||![updated,sourceUpdated].every(Number.isFinite)||now-updated>21600000||now-sourceUpdated>21600000||updated>now+600000||sourceUpdated>now+600000||!Array.isArray(data.showtimes))throw Error('Feed is stale');
   const rows=data.showtimes.filter(s=>Date.parse(s.startsAt)>now&&Date.parse(s.startsAt)<now+14*86400000&&safe(s.bookingUrl));
   section.replaceChildren();const title=document.createElement('h3');title.textContent='What’s showing — next 14 days';section.append(title);
   const stamp=document.createElement('p');stamp.style.cssText='font-size:13px;color:#51657f';stamp.textContent='Updated '+new Date(sourceUpdated).toLocaleString('en-GB',{timeZone:'Europe/London'})+' · UK times. Confirm availability and prices with the cinema.';section.append(stamp);
   const label=document.createElement('label');label.textContent='Choose a day ';const select=document.createElement('select');select.style.cssText='font:inherit;padding:8px;margin:8px 0;max-width:100%';label.append(select);section.append(label);const list=document.createElement('div');section.append(list);
   const day=s=>new Date(s).toLocaleDateString('en-CA',{timeZone:'Europe/London'});const days=[...new Set(rows.map(s=>day(s.startsAt)))];for(const date of days){const option=document.createElement('option');option.value=date;option.textContent=new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short',timeZone:'Europe/London'});select.append(option)}
   function render(){list.replaceChildren();const groups=new Map();for(const s of rows.filter(s=>day(s.startsAt)===select.value)){if(Date.parse(s.startsAt)<=Date.now())continue;if(!groups.has(s.title))groups.set(s.title,[]);groups.get(s.title).push(s)}for(const [name,shows]of groups){const box=document.createElement('div');box.style.cssText='border-top:1px solid #dbe5f1;padding:16px 0';const h=document.createElement('h4');h.textContent=name+(shows[0].certificate?' ('+shows[0].certificate+')':'');h.style.margin='0 0 10px';box.append(h);for(const s of shows){const a=document.createElement('a');a.href=safe(s.bookingUrl);a.target='_blank';a.rel='noopener';a.style.cssText='display:inline-block;border:1px solid #b9cce2;border-radius:8px;padding:9px;margin:4px;font-size:14px';a.textContent=new Date(s.startsAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'})+' '+s.format+(s.subtitled?' · Subtitled':'')+(s.audioDescription?' · AD available':'')+(s.relaxed?' · Autism friendly':'')+(s.soldOut?' · Sold out':'');box.append(a)}list.append(box)}if(!groups.size)list.textContent='No upcoming screenings listed for this day.'}
   if(days.length){select.addEventListener('change',render);render()}else{label.remove();list.textContent='No upcoming screenings supplied for the next 14 days.'}
   const credit=document.createElement('a');credit.href='https://www.scottcinemas.co.uk/';credit.textContent='Data provided by Scott Cinemas API';credit.style.cssText='display:block;margin-top:16px;font-size:13px';credit.target='_blank';credit.rel='noopener';section.append(credit);
   const expires=Math.min(updated,sourceUpdated)+21600000;const timer=setInterval(()=>{if(!section.isConnected){clearInterval(timer);return}if(Date.now()>expires){clearInterval(timer);fallback()}else render()},60000);
  }catch{fallback()}
 };
})();

/* [123] Spin Raiders Place Page 20260925 */
(function(){try{
(()=>{'use strict';
const P=new URLSearchParams(location.search),COLL=P.get('collection'),ID=P.get('place');
if(!/^(?:\/|\/destination-recommendations\/?)$/.test(location.pathname)||COLL!=='NearbyAttractions'||!window.SR_CINEMA_IDS.has(ID))return;
if(window.__SR_CINEMA_PAGE__)return;window.__SR_CINEMA_PAGE__=1;window.__SR_PLACE_PAGE__=1;
const hide=document.createElement('style');hide.id='sr-place-page-isolation';
hide.textContent='html.sr-place-page #sr-seaside-root,html.sr-place-page #sr-seaside-related,html.sr-place-page #SITE_CONTAINER,html.sr-place-page #sr-location-directory{display:none!important}html.sr-place-page,html.sr-place-page body{background:#f4f7fb!important}#sr-place-page{display:block;width:100%}';
document.documentElement.classList.add('sr-place-page');(document.head||document.documentElement).append(hide);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext=u=>{try{const x=new URL(String(u||'').trim());return /^https?:$/.test(x.protocol)?x.href:''}catch{return ''}};
const img=u=>{u=String(u||'');if(u.startsWith('wix:image://v1/')){const id=u.split('/')[3];return 'https://static.wixstatic.com/media/'+id}return ext(u)};
async function token(){const K='sr-public-visitor-v1';try{const c=JSON.parse(sessionStorage.getItem(K)||'null');if(c&&c.token&&c.until>Date.now())return c.token}catch(e){}
 const r=await fetch('https://www.wixapis.com/oauth2/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:'5296d1b3-888a-4d2e-bdd2-a8a8dd0018d8',grantType:'anonymous'})});const j=await r.json();
 try{sessionStorage.setItem(K,JSON.stringify({token:j.access_token,until:Date.now()+1e3*Math.max(30,(Number(j.expires_in)||300)-60)}))}catch(e){}return j.access_token}
async function get(){for(let i=0;i<4;i++){try{const r=await fetch('https://www.wixapis.com/wix-data/v2/items/query',{method:'POST',headers:{'Content-Type':'application/json',Authorization:await token()},body:JSON.stringify({dataCollectionId:'NearbyAttractions',query:{filter:{_id:ID},paging:{limit:1}}})});
 if(r.status===429){await new Promise(s=>setTimeout(s,800*(i+1)));continue}const d=((await r.json()).dataItems||[])[0];return d?d.data:null}catch(e){await new Promise(s=>setTimeout(s,600))}}return null}
function clean(html){const t=document.createElement('template');t.innerHTML=String(html||'');const ok=/^(P|H2|H3|STRONG|B|EM|I|UL|OL|LI|BR|A|BLOCKQUOTE)$/;
 const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===1){if(!ok.test(c.tagName)){c.replaceWith(...c.childNodes);return walk(n)}[...c.attributes].forEach(a=>{if(!(c.tagName==='A'&&a.name==='href'))c.removeAttribute(a.name)});if(c.tagName==='A'){const h=ext(c.getAttribute('href'));if(h){c.setAttribute('href',h);c.setAttribute('target','_blank');c.setAttribute('rel','noopener')}else c.replaceWith(...c.childNodes)}walk(c)}else if(c.nodeType!==3)c.remove()})};walk(t.content);
 t.content.querySelectorAll('h2').forEach(h=>{const x=document.createElement('h3');x.innerHTML=h.innerHTML;h.replaceWith(x)});return t.innerHTML}
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
let host,root;
function mount(){if(host)return;host=document.createElement('div');host.id='sr-place-page';root=host.attachShadow({mode:'open'});
 root.innerHTML=`<style>${CSS}</style><div class="loading" role="status">Loading…</div>`;
 const hdr=document.getElementById('sr-brand-header');if(hdr)hdr.after(host);else if(document.body)document.body.prepend(host);else return setTimeout(()=>{host=null;mount()},50)}
function render(d){const t=d.title||d.name||'This place',town=d.locationName||'',tslug=d.locationSlug||'';
 const pic=img(d.heroImage||d.image),alt=d.imageAltText||d.imageAlt||(t+(town?', '+town:''));
 const raider=Number(d.raiderRating),rs=raider?(raider>5?raider/2:raider):0;
 const web=ext(d.website)||ext(d.outboundUrl),maps=ext(d.googleMapsUrl)||(d.latitude&&d.longitude?'https://www.google.com/maps/search/?api=1&query='+d.latitude+','+d.longitude:(d.address?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t+' '+d.address):''));
 const tel=String(d.phone||'').replace(/[^0-9+]/g,'');const food=/food|restaurant|takeaway|pizza|cafe|café|pub|bar/i.test(d.category||'');const cinema=/cinema/i.test(d.category||'');
 const body=clean(d.sourceFacts||d.fullDescription||d.description||'');
 const gallery=(Array.isArray(d.gallery)?d.gallery:[]).filter(p=>p&&img(p.src));
 const mapSrc=d.latitude&&d.longitude?'https://maps.google.com/maps?q='+d.latitude+','+d.longitude+'&z=16&output=embed':(d.address?'https://maps.google.com/maps?q='+encodeURIComponent(t+', '+d.address)+'&z=16&output=embed':'');
 root.innerHTML=`<style>${CSS}</style><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › ${cinema?'<a href="/?explore=cinema">Cinemas</a> › ':''}${tslug?`<a href="/destination/${E(tslug)}">${E(town||tslug)}</a> › `:''}<span aria-current="page">${E(t)}</span></nav>
<section class="hero"><div><div class="photo">${pic?`<img src="${E(/^https:\/\/static\.wixstatic\.com\/media\/[^/]+~mv2\.(?:webp|jpe?g|png)$/.test(pic)?pic+"/v1/fit/w_560,h_560,q_60,enc_auto/"+pic.split("/").pop():pic)}" alt="${E(alt)}" width="900" height="600">`:`<div class="ph">${E(t)}</div>`}</div>${d.imageCredit?`<div class="credit">Photo: ${E(d.imageCredit)}</div>`:''}</div>
<div class="panel"><span class="chip">${E(String(d.category||'Place to visit').split('·').pop().trim())}</span><h1>${E(t)}</h1>
<p class="where">⌖ ${E(d.address||town)}</p>
${(rs||d.publicRating)?`<div class="scores">${rs?`<div class="score"><b>${rs.toFixed(1)}/5</b><span>Raider Score</span></div>`:''}${d.publicRating?`<div class="score pub"><b>★ ${E(d.publicRating)}</b><span>${d.publicReviewCount?Number(d.publicReviewCount).toLocaleString('en-GB')+' ':''}${E(d.publicRatingSource||'public')} reviews</span></div>`:''}</div>`:''}
${d.shortDescription?`<p class="lede">${E(d.shortDescription)}</p>`:''}
<div class="btns">${web?`<a class="btn main" href="${E(web)}" target="_blank" rel="noopener">${cinema?'Films & showtimes':food?'Order online':'Visit website'} →</a>`:''}${tel?`<a class="btn alt" href="tel:${E(tel)}">☎ Call ${E(d.phone)}</a>`:''}${maps?`<a class="btn ghost" href="${E(maps)}" target="_blank" rel="noopener">Directions</a>`:''}</div></div></section>
${Array.isArray(d.facilities)&&d.facilities.length?`<div class="facts">${d.facilities.slice(0,10).map(f=>`<span>${E(f)}</span>`).join('')}</div>`:''}
${gallery.length?`<section class="visit-gallery" aria-label="Photos from the visit"><h2>Inside the cinema adventure</h2><p>${E(d.imageCredit||d.reviewAuthor||'Venue')} · ${gallery.length} photos. Select a photo to view it full size.</p><div class="gallery-grid">${gallery.map(p=>`<figure><a href="${E(img(p.src))}" target="_blank" rel="noopener"><img src="${E(img(p.src))}" alt="${E(p.alt||p.title||t)}" loading="lazy" width="640" height="480"></a><figcaption>${E(p.title||p.alt||'')}</figcaption></figure>`).join('')}</div></section>`:''}
<div class="body">${body?`<article>${body}${d.sourceName?`<p class="src">Sources: ${E(d.sourceName)}${d.verifiedDate?' · checked '+E(new Date(d.verifiedDate).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})):''}</p>`:''}</article>`:`<article><p>${E(d.shortDescription||'More details coming soon.')}</p></article>`}
<aside>${(d.openingHoursSummary||d.address||d.phone)?`<div class="box"><h2>Plan your visit</h2>${d.openingHoursSummary?`<p>${E(d.openingHoursSummary)}</p>`:''}${d.address?`<p><strong>Address:</strong> ${E(d.address)}</p>`:''}${d.phone?`<p><strong>Phone:</strong> <a href="tel:${E(tel)}">${E(d.phone)}</a></p>`:''}</div>`:''}
${mapSrc?`<div class="box"><iframe class="map" title="Map showing ${E(t)}" src="${E(mapSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`:''}
${tslug?`<a class="more" href="/destination/${E(tslug)}">More to do in ${E(town||tslug)} →</a>`:''}</aside></div></div>`;
 const TT=t+(town?', '+town:'')+' | Spin Raiders';document.title=TT;let n=0;const iv=setInterval(()=>{if(document.title!==TT)document.title=TT;if(++n>40)clearInterval(iv)},250);
 const md=document.querySelector('meta[name="description"]');if(md&&d.shortDescription)md.setAttribute('content',d.shortDescription);
 window.SR_CINEMA_SHOWTIMES?.(root,d);
 window.scrollTo(0,0)}
function fail(){if(!host)mount();if(root)root.innerHTML='<style>'+CSS+'</style><div class="wrap"><h1>This place could not load</h1><p>Please try again, or return to the directory.</p><a class="btn main" href="/?explore=discover">Browse places</a></div>'}
mount();get().then(d=>{if(!d)return fail();if(!host)mount();render(d)}).catch(fail);
})();
}catch(e){console.warn('SR snippet failed: Spin Raiders Place Page 20260925',e)}})();

