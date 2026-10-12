/* Keep category browsing on its own page, using the existing canonical guide contracts. */
(function(){
  'use strict';
  if(window.SR_CATEGORY_BROWSE_20261012)return;window.SR_CATEGORY_BROWSE_20261012=true;
  var path=location.pathname.replace(/\/$/,'');
  var discoveries=/* DISCOVERY_DATA */ [];
  var configs={
    '/beaches':{title:'Find your seaside escape',collections:['Locations'],coastal:true},
    '/seaside':{title:'Choose your seaside town',collections:['Locations'],coastal:true},
    '/attractions':{title:'Find your next big adventure',collections:['NearbyAttractions'],types:['theme','zoos','sealife','museums','history','piers','tours','outdoors','attractions']},
    '/family-fun':{title:'Find a day everyone can enjoy',collections:['NearbyAttractions'],types:['theme','zoos','sealife','museums','history','piers','tours','outdoors','attractions']},
    '/theme-parks':{title:'Choose your theme-park adventure',collections:['NearbyAttractions'],types:['theme']},
    '/zoos':{title:'Choose your wildlife day out',collections:['NearbyAttractions'],types:['zoos']},
    '/sea-life':{title:'Find an aquarium to explore',collections:['NearbyAttractions'],types:['sealife']},
    '/museums':{title:'Find a museum that makes you curious',collections:['NearbyAttractions'],types:['museums']},
    '/historical-sites':{title:'Choose your trip into the past',collections:['NearbyAttractions'],types:['history']},
    '/piers':{title:'Find your next pier wander',collections:['NearbyAttractions'],types:['piers']},
    '/tours':{title:'Find an experience to remember',collections:['NearbyAttractions'],types:['tours']},
    '/hidden-gems':{title:'Find a little surprise',collections:['NearbyAttractions','FoodAndDrink'],types:['theme','zoos','sealife','museums','history','piers','tours','outdoors','attractions'],hidden:true,names:['Audley End House and Gardens','Belsay Hall, Castle and Gardens','Bodnant Garden','Brodsworth Hall and Gardens','Inverewe Garden','Masala & Malt','The Masala n Malt']},
    '/places-to-stay':{title:'Find a base for your next break',collections:['HotelGuides'],types:['stays']},
    '/food-and-drink':{title:'Find somewhere worth stopping for',collections:['FoodAndDrink'],types:['food']},
    '/retro-video-games':{title:'Find somewhere for another go',collections:['Venues'],retro:true},
    '/family-arcades':{title:'Find your family play stop',collections:['Venues'],family:true}
  };
  var config=configs[path];if(!config)return;
  var owner, section, loaded, search, grid, count, pages, chosen='', page=1;
  var CSS='.sr-category-browse{padding:30px 22px;max-width:1376px;margin:10px auto 30px;color:#0b2545;scroll-margin-top:90px}.sr-category-browse h2{font:900 clamp(27px,3vw,38px)/1.1 "Roboto Condensed",Arial;margin:0 0 12px}.sr-category-browse>p{font:400 16px/1.6 Inter,Arial;max-width:850px}.sr-category-browse form{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:22px 0}.sr-category-browse input{flex:1;min-width:180px;font:400 16px Inter,Arial;border:1px solid #b9cadb;padding:13px 16px;border-radius:8px;color:#0b2545;background:white}.sr-category-browse button{font:700 15px Inter,Arial;padding:12px 16px;border-radius:8px;background:#0b2545;color:white;border:0;cursor:pointer;min-height:44px}.sr-category-browse button:disabled{opacity:.45;cursor:default}.sr-category-browse a{color:#126baf}.sr-browse-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.sr-browse-card{border:1px solid #dae5ef;border-radius:12px;overflow:hidden;background:white;box-shadow:0 5px 13px #0b254508}.sr-browse-card>a{display:block;text-decoration:none;color:#0b2545}.sr-browse-card img{display:block;width:100%;height:220px;object-fit:cover}.sr-browse-card .copy{padding:18px}.sr-browse-card h3{font:900 24px/1.15 "Roboto Condensed",Arial;margin:0 0 8px}.sr-browse-card p{font:400 15px/1.55 Inter,Arial;margin:8px 0}.sr-browse-card .town{color:#537087;font-size:13px}.sr-browse-card strong{color:#1671af;font:700 14px Inter,Arial;display:block;margin-top:14px}.sr-browse-pages{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:24px}@media(max-width:900px){.sr-browse-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.sr-browse-cards{grid-template-columns:1fr}.sr-category-browse{padding:24px 18px}.sr-browse-card img{height:240px}}';
  function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function title(r){return r.displayTitle||r.displayName||r.title||r.name||'';}
  function text(r){return [title(r),r.locationName,r.destination,r.town,r.region,r.county,r.category,r.venueType,r.shortDescription,r.description,r.overview,r.fullDescription,r.sourceFacts,(r.tags||[]).join(' ')].join(' ').replace(/<[^>]*>/g,' ').toLowerCase();}
  function eligible(r){
    if(!window.SR_ROUTE_UI.ready(r)||!window.SR_ROUTE_UI.discoverable(r))return false;
    // The existing public projection omits locationType. Apply the verified
    // coastal filter in the CMS query, before that projection, instead.
    if(config.coastal)return true;
    if(config.retro)return /retro|video arcade|pinball|arcade club|free play|free-play|gaming bar/i.test([r.title,r.venueType,r.category].join(' '));
    if(config.family)return r.familyFEC===true||/family|amusement|seaside|pier/i.test(r.venueType||'')&&!/^adult gaming|^agc/i.test(r.venueType||'');
    if(config.hidden)return config.names.includes(title(r))||r.hiddenGem===true||/hidden gem|quirky|unusual|little.known/i.test(text(r));
    return config.types.includes(window.SR_CLASSIFY_PLACE(r));
  }
  function photo(r){var S=window.SR_PUBLIC_DIRECTORY.S;return S.safePhoto?S.fit(S.img(S.safePhoto(r)),720):'';}
  function card(r){var href=window.SR_ROUTES.href(r),image=photo(r),town=r.locationName||r.destination||r.town||'',summary=String(r.shortDescription||r.summary||'').replace(/<[^>]*>/g,' ').replace(/^[^:]{1,100} arcade and visitor guide:\s*/i,'');if(summary.length>260)summary=summary.slice(0,257).replace(/\s+\S*$/,'')+'…';return '<article class="sr-browse-card"><a href="'+esc(href)+'">'+(image?'<img src="'+esc(image)+'" alt="'+esc(r.heroImageAlt||r.exteriorImageAlt||r.imageAltText||r.imageAlt||title(r))+'" loading="lazy" width="720" height="480">':'')+'<div class="copy"><h3>'+esc(title(r))+'</h3>'+(town?'<p class="town">'+esc(town)+'</p>':'')+(summary?'<p>'+esc(summary)+'</p>':'')+'<strong>Open the guide →</strong></div></a></article>';}
  function paint(){if(!loaded)return;var words=chosen.toLowerCase().split(/\s+/).filter(Boolean);var matches=loaded.filter(function(r){return words.every(function(word){return text(r).includes(word);});});var total=Math.max(1,Math.ceil(matches.length/9));page=Math.min(page,total);count.textContent=matches.length+' '+(config.coastal?'town guides':'guides')+(chosen?' matching “'+chosen+'”':' to explore');grid.innerHTML=matches.slice((page-1)*9,page*9).map(card).join('')||'<p>Nothing matches that choice yet. Clear the search to explore the available guides.</p>';pages.innerHTML=total>1?'<button type="button" data-browse-page="'+(page-1)+'" '+(page===1?'disabled':'')+'>← Previous</button><span>'+page+' of '+total+'</span><button type="button" data-browse-page="'+(page+1)+'" '+(page===total?'disabled':'')+'>Next →</button>':'';}
  function scroll(){if(section)section.scrollIntoView({block:'start'});}
  function select(value){chosen=String(value||'');page=1;search.value=chosen;paint();scroll();}
  function read(){
    if(section)return;
    section=document.createElement('section');section.id='sr-all-places';section.className='sr-category-browse';section.setAttribute('aria-label',config.title);
    section.innerHTML='<style>'+CSS+'</style><h2>'+esc(config.title)+'</h2><p>Choose a name or a town, then open a guide for the story, photographs and useful details. A little browsing can turn into a very good day out.</p><form><label class="sr-only" for="sr-browse-search">Search these guides</label><input id="sr-browse-search" type="search" placeholder="Search a place or town…" aria-label="Search these guides"><button type="reset">Clear search</button></form><p role="status" data-browse-count>Bringing the guides together…</p><div class="sr-browse-cards"></div><nav class="sr-browse-pages" aria-label="Guide pages"></nav>';
    var main=owner.querySelector('main'),guide=main&&main.querySelector('.sr-hub-guide');if(guide)guide.before(section);else main.append(section);
    search=section.querySelector('input');grid=section.querySelector('.sr-browse-cards');count=section.querySelector('[data-browse-count]');pages=section.querySelector('.sr-browse-pages');
    section.querySelector('form').addEventListener('submit',function(e){e.preventDefault();select(search.value);});search.addEventListener('input',function(){chosen=search.value;page=1;paint();});section.querySelector('form').addEventListener('reset',function(){chosen='';page=1;setTimeout(paint,0);});pages.addEventListener('click',function(e){var b=e.target.closest('button[data-browse-page]');if(!b)return;page=+b.dataset.browsePage;paint();scroll();});
    var D=window.SR_PUBLIC_DIRECTORY.D,UI=window.SR_ROUTE_UI;
    var filter=config.coastal?{$or:['Seaside','Coastal','Beach','Island'].map(function(v){return {locationType:{$contains:v}};})}:{};
    Promise.allSettled(config.collections.map(function(c){return readCollection(c,filter).then(function(rows){return UI.businessRows(rows,c);});})).then(function(results){if(!section.isConnected)return;var successful=results.filter(function(r){return r.status==='fulfilled';});if(!successful.length)throw Error('Category data unavailable');var seen=new Set();loaded=successful.flatMap(function(r){return r.value;}).filter(eligible).filter(function(r){var k=UI.key(r);if(seen.has(k))return false;seen.add(k);return true;}).sort(function(a,b){return title(a).localeCompare(title(b));});if(results.some(function(r){return r.status==='rejected';}))count.textContent='Some guides could not load. Reload to try again.';paint();}).catch(function(){count.textContent='The guides could not load this time. Reload the page to try again; the featured guides above are still available.';});
  }
  async function readCollection(collection,filter){
    var S=window.SR_PUBLIC_DIRECTORY.S,D=window.SR_PUBLIC_DIRECTORY.D;
    if(!S.archiveQuery)return D.rows(collection,filter);
    // Search the real public guide prose as well as its card summary. Keep the
    // existing route hydration and readiness gates, with explicit public fields.
    var fields=['title','name','displayTitle','displayName','slug','locationName','locationSlug','destination','destinationSlug','town','region','county','country','category','venueType','shortDescription','summary','description','overview','fullDescription','sourceFacts','hiddenGem','tags','heroImage','heroImageAlt','exteriorImageAlt','imageAltText','imageAlt','imageVerified','imageResearchStatus','imageAccuracy','active','directoryReady','cardReady','status','locationStatus','currentVenueStatus','familyFEC','amusementArcade','familyEntertainmentCentre','link-arcade-locations-title','link-nearby-attractions-title'];
    var rows=[];for(var offset=0;;offset+=500){var result=await S.archiveQuery({fields:fields,filter:filter,sort:[{fieldName:'_id',order:'ASC'}],paging:{limit:500,offset:offset}},null,false,collection);var items=result.dataItems||[];rows.push.apply(rows,items.map(function(item){return Object.assign({},item.data,{_id:item.id,_collection:collection});}).filter(function(row){return window.SR_PUBLIC_DIRECTORY.eligible?window.SR_PUBLIC_DIRECTORY.eligible(row):row.active!==false&&row.directoryReady!==false&&row.cardReady!==false;}));if(items.length<500)break;}return rows;
  }
  function discoveryLink(name){return path==='/hidden-gems'?discoveries.find(function(item){return item.name===name;}):null;}
  function installDiscoveries(root){
    if(path!=='/hidden-gems'||root.querySelector('#sr-named-discoveries'))return;
    var guide=root.querySelector('main .sr-hub-guide');if(!guide)return;
    var section=document.createElement('section');section.id='sr-named-discoveries';section.className='sr-named-discoveries';
    section.innerHTML='<style>.sr-named-discoveries{max-width:1200px;padding:24px;margin:auto;color:#102744}.sr-named-discoveries>h2{font:900 34px "Roboto Condensed",Arial}.sr-discovery{scroll-margin-top:100px;border-top:1px solid #d8e6f2;padding:28px 0;max-width:850px}.sr-discovery h3{font:900 28px "Roboto Condensed",Arial;margin:0 0 5px}.sr-discovery p{font:400 17px/1.7 Inter,Arial;margin:14px 0}.sr-discovery a{color:#126baf;text-decoration:underline}.sr-discovery .where{font-size:14px;color:#526c83}.sr-discovery .sources{font-size:13px}</style><h2>Six discoveries worth a closer look</h2>'+discoveries.map(function(item){return '<article class="sr-discovery" id="sr-discovery-'+esc(item.id)+'"><h3>'+esc(item.name)+'</h3><p class="where">'+esc(item.location)+'</p>'+item.body+(item.related?'<p><a href="'+esc(item.related[1])+'">'+esc(item.related[0])+' →</a></p>':'')+'<p class="sources">Visitor information checked 12 October 2026: '+item.sources.map(function(source){return '<a href="'+esc(source[1])+'" target="_blank" rel="noopener">'+esc(source[0])+'</a>';}).join(' · ')+'</p></article>';}).join('');guide.after(section);
  }
  function anchor(value){return path+'#sr-all-places'+(value?'='+encodeURIComponent(value):'');}
  function fromHash(){if(!owner)return;var discovery=location.hash.match(/^#sr-discovery-([a-z-]+)$/);if(discovery){owner.querySelector('#sr-discovery-'+discovery[1])?.scrollIntoView({block:'start'});return;}var m=location.hash.match(/^#sr-all-places(?:=(.*))?$/);if(!m)return;read();select(m[1]?decodeURIComponent(m[1]):'');}
  function attach(root){
    if(!root.querySelector('main>.chero')||root.querySelector('main.directory'))return;
    owner=root;
    installDiscoveries(root);
    root.querySelectorAll('main>section .heading>a,main>section a.tile').forEach(function(a){
      var href=a.getAttribute('href')||'',label=a.querySelector('strong')?.textContent||a.getAttribute('aria-label')||a.textContent.trim();
      if(a.classList.contains('tile')){var discovery=discoveryLink(label);if(discovery){a.href=path+'#sr-discovery-'+discovery.id;return;}if(!/^\/(search|post)\b/.test(href)&&!href.startsWith(path+'#sr-all-places'))return;if(!label)return;a.href=anchor(/^(more|explore|uk )/i.test(label)?'':label);}
      else if(/view all/i.test(a.textContent))a.href=anchor('');
    });
    if(!root.querySelector('[data-sr-browse-hook]')){
      var mark=document.createElement('span');mark.dataset.srBrowseHook='1';mark.hidden=true;root.append(mark);
      root.addEventListener('click',function(e){var a=e.target.closest('a'),href=a&&a.getAttribute('href');if(!href||(!href.startsWith(path+'#sr-all-places')&&!href.startsWith(path+'#sr-discovery-'))||e.ctrlKey||e.metaKey||e.shiftKey)return;e.preventDefault();var u=new URL(href,location.origin);history.pushState(null,'',u.pathname+u.hash);fromHash();});
      fromHash();
    }
  }
  var observed=new WeakSet(),pending=false;
  function scan(){pending=false;if(!window.SR_PUBLIC_DIRECTORY||!window.SR_ROUTES||!window.SR_CLASSIFY_PLACE)return;var roots=[document];for(var i=0;i<roots.length;i++){var root=roots[i];root.querySelectorAll('*').forEach(function(e){if(e.shadowRoot)roots.push(e.shadowRoot);});attach(root);if(!observed.has(root)){observed.add(root);new MutationObserver(schedule).observe(root,{childList:true,subtree:true});}}}
  function schedule(){if(pending)return;pending=true;setTimeout(scan,100);}
  addEventListener('hashchange',fromHash);addEventListener('popstate',fromHash);var tries=0,timer=setInterval(function(){scan();if(++tries>=80)clearInterval(timer);},250);scan();
})();
