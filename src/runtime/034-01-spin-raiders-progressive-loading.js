(function(){try{
window.SR_FAST = {
  near(element, start) {
    let done=false, observer;
    const run=()=>{if(done)return;done=true;observer?.disconnect();element.querySelector("[data-load-section]")?.remove();start();};
    element.querySelector("[data-load-section]")?.addEventListener("click",run,{once:true});
    if(!("IntersectionObserver" in window)){run();return run;}
    observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))run();},{rootMargin:"200px 0px"});
    observer.observe(element);
    return run;
  },
  install(e,type) {
    if(type==="map")return;
    const defer=html=>html.replace(/(<iframe\b[^>]*?)\ssrc=/gi,'$1 data-sr-map-src=');
    for(const [object,key] of [[e.googleMaps,"frame"],[e,"localMapPanel"]]){
      if(!object?.[key]||object[key].srDeferred)continue;
      const original=object[key],wrapped=(...args)=>defer(original(...args));
      wrapped.srDeferred=true;object[key]=wrapped;
    }
  },
  maps(e) {
    const root=e.root;
    if(!root||root.srLazyMaps)return;
    root.srLazyMaps=true;
    const scan=node=>{
      if(node.nodeType!==1&&node!==root)return;
      const frames=[...(node.matches?.("iframe[data-sr-map-src]")?[node]:[]),...node.querySelectorAll("iframe[data-sr-map-src]")];
      for(const frame of frames) {
        if(frame.dataset.srObserved)continue;
        frame.dataset.srObserved="1";
        this.near(frame,()=>{if(!frame.getAttribute("src"))frame.src=frame.getAttribute("data-sr-map-src");frame.removeAttribute("data-sr-map-src");});
      }
    };
    scan(root);
    new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(scan))).observe(root,{childList:true,subtree:true});
  },
  shell(e,type) {
    this.install(e,type);
    const names={venues:"Discover Amusement Arcades You Never Knew Existed",towns:"Where Will Your Next Day Out Take You?",attractions:"Plan your trip",casinos:"UK casinos",bookmakers:"UK bookmakers",map:"Explore the arcade map",destination:"Explore your next day out",venue:"Plan your visit"};
    if(type==='venues'&&new URLSearchParams(location.search).get('type')?.toUpperCase()==='BINGO')names.venues='Find your next bingo night';
    return '<main><section class="wrap section" data-fast-loading><h1>'+e.e(names[type]||"Explore Spin Raiders")+'</h1><p role="status">Loading places…</p></section></main>';
  },
  primary(e,type,row) {
    e.relatedPlacesUnavailable=false;
    e.failedNearby=()=>{e.relatedPlacesUnavailable=true;return [];};
    const main=e.root?.querySelector("main");
    if(!main?.querySelector("[data-fast-loading]"))return;
    const photo=e.safePhoto(row);
    main.innerHTML=type==="destination"
      ?e.hero({title:row.title,accent:"DAYS OUT",kicker:"★ THE HOME OF ★",text:row.shortDescription||"",image:photo,imageAlt:row.imageAltText||row.title,kind:"destination"})
      :'<section class="detail wrap">'+e.photo(photo,row.imageAltText||row.title,"photo",true)+'<div><p class="kicker">'+e.e(row.locationName||"")+'</p><h1>'+e.e(row.title)+'</h1><p>'+e.e(row.shortDescription||"")+'</p></div></section>';
    const gate=document.createElement("section");
    gate.className="wrap section";
    gate.innerHTML='<p role="status">Loading the rest of this page...</p>';
    main.append(gate);
    e.pageMetadata?.(type,row);
    return;
  },
  finish(e,type) {
    this.install(e,type);
    this.maps(e);
    if(e.relatedPlacesUnavailable){
      const main=e.root?.querySelector("main");
      if(main&&!main.querySelector("[data-related-load-warning]")){
        const note=document.createElement("p");
        note.className="wrap section";
        note.dataset.relatedLoadWarning="";
        note.setAttribute("role","status");
        note.textContent="Some nearby listings could not be loaded. Reload this page to try them again.";
        main.append(note);
      }
    }
    const pending=e.pendingRecommendations;
    if(!pending||!["venue","destination"].includes(type))return;
    e.pendingRecommendations=null;
    const root=e.root,main=root.querySelector("main"),holder=document.createElement("section");
    holder.setAttribute("data-local-recommendations","");holder.id="local-recommendations";
    holder.innerHTML='<div class="wrap section"><h2>Places to eat &amp; stay</h2><button class="btn" data-load-section>Explore food &amp; stays →</button></div>';
    const trip=main.querySelector(".trip-cta");
    trip?trip.before(holder):main.append(holder);
    const localNav=root.querySelector(".local-navigation");
    if(localNav&&!localNav.querySelector('[data-local-jump="local-recommendations"]'))localNav.insertAdjacentHTML("beforeend",'<button class="chip" data-local-jump="local-recommendations">Food &amp; stays</button>');
    const load=this.near(holder,()=>{
      holder.innerHTML='<p class="wrap section" role="status">Finding places to eat and stay…</p>';
      Promise.resolve().then(()=>typeof pending==="function"?pending():pending).then(rows=>{
        if(!holder.isConnected)return;
        e.cmsRecommendations=rows;
        for(const row of rows)delete row.__shown;
        holder.innerHTML=e.recommendationSections();
        if(!rows.length)holder.innerHTML='<p class="wrap section">No local recommendations are available here yet.</p>';
        if(e.recommendationsUnavailable)throw Error("Recommendations unavailable");
        const nav=root.querySelector(".local-navigation"),record=e.currentRecord;
        if(nav&&record&&type==="destination"){
          const arcades=!!nav.querySelector('[data-local-jump="local-arcades"]');
          const attractions=!!nav.querySelector('[data-local-jump="local-attractions"]');
          nav.outerHTML=e.townNavigation(record.title,arcades,attractions);
        }
        e.bind();e.bindLocalMaps?.();
        if(holder.dataset.jump){const target=root.querySelector("#"+CSS.escape(holder.dataset.jump));target?.scrollIntoView({block:"start"});}
      }).catch(()=>{
        e.recommendationsUnavailable=true;
        holder.innerHTML='<div class="wrap section"><p>Local recommendations could not load.</p><a class="btn" href="'+e.e(location.pathname+location.search)+'">Reload to try again</a></div>';
      });
    });
    const click=event=>{
      const link=event.target.closest?.("[data-local-jump],a[href^='#']");
      const target=link?.dataset.localJump||link?.getAttribute("href")?.slice(1);
      if(target==="local-recommendations"){event.preventDefault();event.stopImmediatePropagation();holder.scrollIntoView({block:"start"});load();return;}
      if(!["local-food","local-stays","local-more"].includes(target)||root.querySelector("#"+CSS.escape(target)))return;
      event.preventDefault();event.stopImmediatePropagation();holder.dataset.jump=target;holder.scrollIntoView({block:"start"});load();
    };
    root.addEventListener("click",click,true);
  }
};
}catch(e){console.warn('SR snippet failed: Spin Raiders Progressive Loading',e)}})();

