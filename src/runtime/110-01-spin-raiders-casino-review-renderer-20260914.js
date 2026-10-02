(function(){try{
(()=>{'use strict';
const paths=new Set(['/all-british-casino','/william-hill-vegas','/video-slots','/funcasino','/mrvegas-casino-review','/casino-casino','/race-casino']);
const path=(location.pathname.replace(/\/$/,'')||'/');if(!paths.has(path))return;
let tries=0;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=v=>{try{const u=new URL(v,location.origin);return /^https?:$/.test(u.protocol)?u.href:'#'}catch{return '#'}};
const image=v=>{if(!v)return'';const s=String(v);return /^https?:/i.test(s)?s:'https://static.wixstatic.com/media/'+s};
function mount(){
 const S=window.SR_SEASIDE, data=S?.casinoOffersData, top=document.getElementById('sr-seaside-top'), site=document.getElementById('SITE_CONTAINER');
 if(!S||!Array.isArray(data)||!top||!site){if(tries++<240)return setTimeout(mount,50);return;}
 const o=data.find(x=>x&&x.review===path);if(!o)return;
 document.documentElement.classList.add('sr-casino-view');
 let root=document.getElementById('sr-casino-review-root');if(!root){root=document.createElement('main');root.id='sr-casino-review-root';top.after(root);}
 const facts=Array.isArray(o.facts)&&o.facts.length?'<ul class="cr-facts">'+o.facts.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Current qualifying details are shown in the terms below.</p>';
 const breakdown=Array.isArray(o.breakdown)&&o.breakdown.length?'<div class="cr-break">'+o.breakdown.map(x=>'<div>'+esc(x[0])+'</div><div><strong>'+esc(x[1])+'/10</strong></div>').join('')+'</div>':'<p>No detailed score breakdown is published for this review yet.</p>';
 const history=o.history?'<section class="cr-card"><h2>Offer history</h2><p>'+esc(o.history)+'</p>'+(o.legacyTerms?'<p>'+esc(o.legacyTerms)+'</p>':'')+'</section>':'';
 const src=o.source&&safe(o.source)!=='#'?'<a class="cr-btn" href="'+esc(safe(o.source))+'" target="_blank" rel="noopener noreferrer">View offer evidence / source</a>':'';
 const visit=o.url&&safe(o.url)!=='#'?'<a class="cr-btn red" href="'+esc(safe(o.url))+'" target="_blank" rel="sponsored nofollow noopener noreferrer">Visit '+esc(o.name)+'</a>':'';
 root.innerHTML='<div class="cr-wrap"><a class="cr-back" href="/casino-offers">← Back to casino reviews & offers</a><section class="cr-hero"><img class="cr-logo" src="'+esc(image(o.image))+'" alt="'+esc(o.name)+' logo"><div><div class="cr-meta"><span class="cr-pill">18+ only</span>'+(o.raiderScore?'<span class="cr-pill cr-score">Raider Score '+esc(o.raiderScore)+'/10</span>':'')+(o.offerDate?'<span class="cr-pill">Checked '+esc(o.offerDate)+'</span>':'')+'</div><h1>'+esc(o.name)+' Casino Review</h1><div class="cr-offer">'+esc(o.heading||'Current welcome offer')+'</div><div class="cr-actions">'+visit+src+'</div></div></section><div class="cr-grid"><section class="cr-card"><h2>Current offer details</h2>'+facts+'<h2 style="margin-top:24px">Terms recorded by Spin Raiders</h2><p>'+esc(o.terms||'Full qualifying terms have not yet been independently verified. Check the operator terms before depositing.')+'</p></section><aside class="cr-card"><h2>Raider Score breakdown</h2>'+breakdown+'<p style="margin-top:18px"><strong>Status:</strong> '+esc(o.offerStatus||'not stated')+'</p></aside></div>'+history+'<div class="cr-note"><strong>18+ only.</strong> Gambling can be addictive. Please gamble responsibly. Offers and terms can change, so check the operator’s current terms before depositing or playing.</div></div>';
 document.title=o.name+' Casino Review | Spin Raiders';
}
mount();
})();
}catch(e){console.warn('SR snippet failed: Spin Raiders Casino Review Renderer 20260914',e)}})();

