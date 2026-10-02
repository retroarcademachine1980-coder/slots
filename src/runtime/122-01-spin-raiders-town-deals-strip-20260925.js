(function(){try{
(()=>{'use strict';
if(!/^\/destination\/[^/]+\/?$/.test(location.pathname))return;
const slug=decodeURIComponent(location.pathname.split('/').filter(Boolean).pop()).toLowerCase();
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>{try{const x=new URL(u,location.origin);return /^https?:$/.test(x.protocol)?x.href:''}catch{return ''}};
const img=u=>{u=String(u||'');if(u.startsWith('wix:image://v1/')){const id=u.split('/')[3];return 'https://static.wixstatic.com/media/'+id+'/v1/fill/w_480,h_320,q_80/'+id}return safe(u)};
const CSS=`.srtd{margin:6px 0 26px;padding:18px 18px 20px;border-radius:18px;background:linear-gradient(135deg,#0b2545 0%,#13315c 60%,#1d4e89 100%);color:#fff;font-family:inherit;position:relative;overflow:hidden}
.srtd:before{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,#ffd23f55,transparent 70%);pointer-events:none}
.srtd-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;position:relative}
.srtd-k{display:inline-block;background:#ffd23f;color:#0b2545;font-weight:900;font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:999px}
.srtd h2{margin:8px 0 0;font-size:clamp(22px,2.6vw,30px);line-height:1.1;color:#fff}
.srtd-note{margin:0;font-size:12px;color:#c9dcf2;max-width:360px}
.srtd-row{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(230px,1fr);gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px;position:relative}
.srtd-row::-webkit-scrollbar{height:6px}.srtd-row::-webkit-scrollbar-thumb{background:#ffffff55;border-radius:6px}
.srtd-card{scroll-snap-align:start;display:flex;flex-direction:column;background:#fff;color:#0b2545;border-radius:14px;overflow:hidden;text-decoration:none;box-shadow:0 10px 24px #00000033;transition:transform .18s,box-shadow .18s;min-width:0}
.srtd-card:hover,.srtd-card:focus-visible{transform:translateY(-4px);box-shadow:0 16px 30px #00000055;outline:none}
.srtd-card:focus-visible{outline:3px solid #ffd23f;outline-offset:2px}
.srtd-img{position:relative;aspect-ratio:3/2;background:#dfe9f5;overflow:hidden}
.srtd-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.srtd-save{position:absolute;left:10px;top:10px;background:#ff2e88;color:#fff;font-weight:900;font-size:12px;padding:5px 9px;border-radius:8px;letter-spacing:.03em}
.srtd-body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;flex:1}
.srtd-cat{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#1d6fd8}
.srtd-t{font-size:16px;font-weight:900;line-height:1.2;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.srtd-o{font-size:13px;line-height:1.4;color:#39506b;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.srtd-foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:6px}
.srtd-p{font-weight:900;font-size:16px;color:#0b2545;line-height:1.15}.srtd-p s{font-weight:600;font-size:12px;color:#7a8ca3;margin-left:5px}
.srtd-cta{background:#ffd23f;color:#0b2545;font-weight:900;font-size:12px;padding:8px 11px;border-radius:9px;white-space:nowrap}
@media(max-width:640px){.srtd{padding:14px;border-radius:14px}.srtd-row{grid-auto-columns:78%}}
@media(prefers-reduced-motion:reduce){.srtd-card{transition:none}}`;
const cat=r=>String(r.category||'').replace(/^THINGS TO DO OFFER\s*•\s*/i,'').replace(/\bOFFER\b/i,'').trim()||'Deal';
function card(r){const u=window.SR_CANONICAL.hotelHref(r);if(!u)return '';const pic=img(r.dealImage||r.image?.url||r.image||r.heroImage);const t=r.displayTitle||r.name||r.title||'';const save=String(r.offerBadge||r.discountText||'').replace(/^SAVE UP TO/i,'Save');
return `<a class="srtd-card" href="${E(u)}"  aria-label="${E(t+' — view hotel guide')}"><div class="srtd-img">${pic?`<img src="${E(/^https:\/\/static\.wixstatic\.com\/media\/[^/]+~mv2\.(?:webp|jpe?g|png)$/.test(pic)?pic+"/v1/fit/w_560,h_560,q_60,enc_auto/"+pic.split("/").pop():pic)}" alt="${E(r.imageAlt||t)}" loading="lazy" width="480" height="320">`:''}${save?`<span class="srtd-save">${E(save)}</span>`:''}</div><div class="srtd-body"><span class="srtd-cat">${E(cat(r))}</span><h3 class="srtd-t">${E(t)}</h3>${r.offerTitle?`<p class="srtd-o">${E(r.offerTitle)}</p>`:''}<div class="srtd-foot"><span class="srtd-p">${E(String(r.dealPrice||'').replace(/^FROM\s*/i,'From '))}${r.wasPrice?`<s>${E(r.wasPrice)}</s>`:''}</span><span class="srtd-cta">View hotel guide →</span></div></div></a>`}
let rows=null,town=slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),tries=0,loadFailed=false;
async function load(){const api=window.SR_PUBLIC_DIRECTORY,canonical=window.SR_CANONICAL;if(!api?.D?.rows||!canonical){if(++tries<300)return setTimeout(load,100);return}
 try{const outcomes=await canonical.offerOutcomes(api.D);loadFailed=outcomes.some(result=>result.status==='rejected');
  const normal=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const seen=new Set();
  rows=outcomes.flatMap(result=>result.status==='fulfilled'?result.value:[]).filter(row=>[row.locationSlug,row.destinationSlug,row.locationName,row.destination].some(value=>normal(value)===slug)).filter(row=>canonical.hotelHref(row)&&(row.dealPrice||row.offerTitle)).filter(row=>{const key=canonical.hotelHref(row)+'|'+canonical.outbound(row);if(seen.has(key))return false;seen.add(key);return true;});
  rows.sort((a,b)=>(+!!b.dealPrice)-(+!!a.dealPrice)||(Number(b.dealBoughtCount)||0)-(Number(a.dealBoughtCount)||0));
  rows=rows.slice(0,12);town=rows[0]?.locationName||rows[0]?.destination||town;
 }catch(e){rows=[];loadFailed=true;}
 place();
 const mo=new MutationObserver(place);const host=document.getElementById('sr-location-directory');
 if(host?.shadowRoot)mo.observe(host.shadowRoot,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),120000);
}
function place(){if(!rows||(!rows.length&&!loadFailed))return;const host=document.getElementById('sr-location-directory'),root=host&&host.shadowRoot;if(!root){if(++tries<400)setTimeout(place,150);return}
 if(root.getElementById('sr-town-deals'))return;const head=root.querySelector('.results-heading');if(!head){if(++tries<400)setTimeout(place,150);return}
 if(!root.getElementById('sr-town-deals-css')){const st=document.createElement('style');st.id='sr-town-deals-css';st.textContent=CSS;root.append(st)}
 const s=document.createElement('section');s.id='sr-town-deals';s.className='srtd';s.setAttribute('aria-labelledby','srtd-h');
 s.innerHTML=`<div class="srtd-head"><div><span class="srtd-k">Hand-picked deals</span><h2 id="srtd-h">Hotel offers in ${E(town)}</h2></div><p class="srtd-note">Explore hotel guides and current booking options in ${E(town)}. Spin Raiders may earn a commission from qualifying bookings. Check dates, availability and terms with the provider.</p></div><div class="srtd-row">${rows.map(card).join('')}</div>${loadFailed?'<p role="status">Some hotel offers could not load. Reload to try again.</p>':''}`;
 head.after(s);
}
load();
})();
}catch(e){console.warn('SR snippet failed: Spin Raiders Town Deals Strip 20260925',e)}})();

