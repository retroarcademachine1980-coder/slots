(function(){try{
(function(){
  function uniq(a){return [...new Set((Array.isArray(a)?a:[]).filter(Boolean))]}
  function text(v){return String(v||"").replace(/[&<>"]/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]})}
  function mapEvidence(o){
    var m={};
    var items=o&&o.venuePhotoEvidence&&Array.isArray(o.venuePhotoEvidence.items)?o.venuePhotoEvidence.items:[];
    items.forEach(function(x){if(x&&x.url)m[x.url]=x});
    return m;
  }
  function section(title,urls,evidence,venue){
    urls=urls.filter(function(u){return !/3a517e_(90a46cf03cc2455788007460224c7ad6|b8c90a536a4b483ba8a28f3652502faa|43d2df97ea774c0c96e66731482c6d9d)/.test(String(u))});if(!urls.length)return "";
    var cards=urls.map(function(url){
      var ev=evidence[url]||{};
      var alt=ev.alt||ev.caption||("Inside "+venue);
      var cap=ev.caption||ev.alt||"";
      var wide=/wide view|row of|gaming floor|inside/i.test(alt)?' data-wide="1"':"";
      return '<figure class="sr-venue-photo-card"'+wide+'><a href="'+text(url)+'" target="_blank" rel="noopener"><img loading="lazy" decoding="async" src="'+text(url)+'" alt="'+text(alt)+'"></a>'+(cap?'<figcaption>'+text(cap)+'</figcaption>':'')+'</figure>';
    }).join("");
    return '<section class="section wrap sr-venue-photo-section"><h2>'+text(title)+'</h2><div class="sr-venue-photo-grid">'+cards+'</div></section>';
  }
  window.SR_VENUE_PHOTOS={
    render:function(e,o,i,r){
      if(!r||!o)return;
      var evidence=mapEvidence(o);var venue=o.title||i.title||"the venue";
      var inside=uniq(o.interiorGallery);
      var machines=uniq(o.machineAreaGallery).filter(function(u){return !inside.includes(u)});
      var pats=(o._id||i._id||i.id)==="venue-blackpool-pats-prize-bingo"||(o.exteriorGallery||[]).some(u=>String(u).includes("3a517e_6eb99fcd02ed443bbac4be5e2ab59b99"));
      var html=(pats?section("Outside Pat’s Bingo",uniq(o.exteriorGallery),evidence,venue):"")+section(pats?"Inside Pat’s Bingo":"Inside "+venue,inside,evidence,venue)+section("Machines at "+venue,machines,evidence,venue);
      if(html)r.insertAdjacentHTML("beforeend",html);
    }
  };
})();
}catch(e){console.warn('SR snippet failed: Spin Raiders Venue Photo Renderer 20260919',e)}})();

