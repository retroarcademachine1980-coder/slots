(function(){try{
(function(){
  var venue=/^\/arcade-venues\//.test(location.pathname);
  var destination=/^\/destination\//.test(location.pathname);
  if(!venue&&!destination)return;
  var ticks=0;
  function setNoindex(){
    var metas=[].slice.call(document.head.querySelectorAll('meta[name="robots"]'));
    var m=metas.shift()||document.createElement("meta");
    metas.forEach(function(x){x.remove()});
    m.setAttribute("name","robots");
    m.setAttribute("content","noindex,follow");
    if(!m.parentNode)document.head.appendChild(m);
  }
  function apply(){
    ticks++;
    var sr=window.SR_SEASIDE;
    var rec=sr&&sr.currentRecord;
    if(!rec){if(ticks<80)setTimeout(apply,250);return;}
    var pending=venue ? (!sr.listingReady||!sr.listingReady(rec)) : rec.directoryReady===false;
    if(!pending)return;
    document.documentElement.classList.add("sr-research-pending");
    setNoindex();
    var root=sr.root||document;
    if(venue){
      var guide=root.querySelector&&root.querySelector("[data-venue-guide]");
      if(guide&&!guide.querySelector(".sr-research-pending-panel")){
        guide.innerHTML='<section class="section wrap" data-guide-section="Research status"><div class="sr-research-pending-panel"><h2>Research in progress</h2><p>This venue record and its existing URL are being kept for continuity while this exact branch is rechecked. The identity and practical details shown above may still help with finding the venue, but Spin Raiders is not treating this as a finished guide yet.</p><p>Detailed machine, facility, opening-time, accessibility and visitor-experience claims will be restored here only when they are supported by current branch-specific evidence. Until then, use the official venue link or directions shown on the page for time-sensitive planning.</p></div></section>';
      }
    }else{
      var main=root.querySelector&&root.querySelector("main");
      if(main&&!main.querySelector(".sr-research-pending-panel")){
        main.innerHTML='<section class="section wrap"><div class="sr-research-pending-panel"><p class="kicker">DESTINATION GUIDE</p><h1>Research in progress</h1><p>This destination page is being rebuilt before it returns to the public directory. Its existing URL is being kept so old links still have somewhere useful to land, but the previous short directory-style page is not being presented as a finished visitor guide.</p><p>Spin Raiders will relist this destination when its local venues, practical travel information, imagery and day-out suggestions have been checked and written as a substantial guide.</p><p><a href="/destinations">Browse the currently published destinations →</a></p></div></section>';
      }
    }
    if(ticks<80)setTimeout(apply,250);
  }
  apply();
})();
}catch(e){console.warn('SR snippet failed: Spin Raiders Venue Quality Gate 20260921',e)}})();

