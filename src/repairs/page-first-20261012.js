/* Make the existing guide clear on arrival, and use the original photographs beneath artwork tiles. */
(function () {
  'use strict';
  if (window.SR_PAGE_FIRST_20261012_V6) return;
  window.SR_PAGE_FIRST_20261012_V6 = true;
  document.documentElement.dataset.srPageFirstVersion='20261012-6';
  var welcomes = /* WELCOME_DATA */ {};
  var photoCorrections = /* PHOTO_DATA */ {};
  var resortOpenings = /* DETAIL_DATA */ {};
  var pathsToCategory = {'/food-and-drink':'food-drink','/arcade':'arcades','/fishing-lakes':'fishing','/outdoors':'nature-outdoors','/cinemas':'cinema'};
  var styleText = '.sr-page-intro{box-sizing:border-box;padding:22px max(20px,calc((100vw - 1320px)/2));background:#fff;color:#102744;border-bottom:1px solid #d8e6f2;font-family:Arial,sans-serif}.sr-page-intro h1,.sr-page-intro ::slotted(h1){font-family:"Roboto Condensed",Arial,sans-serif;font-weight:900;font-size:clamp(27px,3.1vw,40px);line-height:1.1;color:#102744;margin:0 0 8px}.sr-page-intro p{margin:0;max-width:1100px;font-size:17px;line-height:1.55;color:#243b53}.sr-page-intro .sr-information-source{font-size:12px;margin-top:6px}.sr-first-description{font-size:17px;line-height:1.6;color:#243b53;margin:16px 0;max-width:75ch}.tile.sr-real-photo{position:relative;display:block;overflow:hidden;isolation:isolate;aspect-ratio:16/10;background:#0c355e;border-radius:12px}.tile.sr-real-photo:before{content:"";position:absolute;inset:40% 0 0;background:linear-gradient(transparent,rgba(3,24,42,.88));z-index:1;pointer-events:none}.tile.sr-real-photo>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.tile.sr-real-photo>strong{position:absolute;left:14px;right:14px;bottom:13px;z-index:2;font-family:"Roboto Condensed",Arial,sans-serif;font-weight:900;font-size:clamp(19px,1.8vw,27px);line-height:1.15;color:#fff;text-shadow:0 1px 3px #0008}.tile.sr-real-photo>.sr-tile-icon{position:absolute;inset:15px 0 45px;display:grid;place-items:center;background:linear-gradient(135deg,#c9f3ff,#e6defd)}.sr-photo-credits{margin-top:9px;font-size:12px;line-height:1.5;color:#516579}.sr-photo-credits summary{cursor:pointer}.sr-photo-credits p{font-size:12px;margin:4px 0}.sr-photo-credits a{color:#175fad;text-decoration:underline}@media(max-width:650px){.sr-page-intro{padding:17px 18px}.sr-page-intro p{font-size:16px;line-height:1.5}.sr-first-description{font-size:16px}.tile.sr-real-photo>strong{font-size:21px}}';
  var observed = new WeakSet(), queued = false;
  styleText += '.sr-resort-story p,.sr-resort-story li{font:400 17px/1.7 Inter,Arial,sans-serif;margin:0 0 18px;color:#243b53}.sr-resort-story h2{font:900 clamp(24px,2.2vw,31px)/1.2 "Roboto Condensed",Arial,sans-serif;margin:24px 0 12px}.sr-resort-story a{color:#126baf;text-decoration:underline}';
  styleText += '.sr-machine-intro{background:transparent!important;border-bottom:1px solid #ffffff35;color:#eaf5ff}.sr-machine-intro h1{position:static!important;width:auto!important;height:auto!important;overflow:visible!important;clip:auto!important;clip-path:none!important;white-space:normal!important;font:900 clamp(27px,3.1vw,40px)/1.1 "Roboto Condensed",Arial,sans-serif!important;color:#ffe65d!important;margin:0 0 10px;text-shadow:none}.sr-machine-intro p{color:#eaf5ff!important}';
  function route() { return location.pathname.replace(/\/+$/, '') || '/'; }
  function installStyle(root) {
    var existing=root.querySelector('#sr-page-first-style');if(existing){if(existing.textContent!==styleText)existing.textContent=styleText;return;}
    var style = document.createElement('style');style.id='sr-page-first-style';style.textContent=styleText;
    (root === document ? document.head : root).append(style);
  }
  function assignedHeading(slot) {
    if (!slot || typeof slot.assignedElements !== 'function') return null;
    return slot.assignedElements({flatten:true}).find(function(e){return e.matches('h1');}) || null;
  }
  function introduction(root) {
    var welcome=welcomes[route()], main=root.querySelector('main'), hero=main&&main.querySelector(':scope > .chero');
    if (!welcome || !main || !hero) return;
    var existing=main.querySelector(':scope > .sr-page-intro');
    if(existing){var live=existing.querySelector('h1')||assignedHeading(existing.querySelector('slot[name="sr-hub-heading"]'));if(live&&live.textContent!==welcome[0])live.textContent=welcome[0];return;}
    var heading=hero.querySelector('h1'), headingSlot=hero.querySelector('slot[name="sr-hub-heading"]');
    if (!heading) heading=assignedHeading(headingSlot);
    if (!heading) return;
    var intro=document.createElement('section');intro.className='sr-page-intro';intro.dataset.srPagePurpose=route();
    heading.textContent=welcome[0];heading.classList.remove('sr-only','sr-hub-visually-hidden');
    heading.style.cssText='font-family:"Roboto Condensed",Arial,sans-serif;font-weight:900;font-size:clamp(27px,3.1vw,40px);line-height:1.1;color:#102744;margin:0 0 8px;position:static;width:auto;height:auto;overflow:visible;clip:auto;clip-path:none;white-space:normal';
    if (headingSlot) intro.append(headingSlot);else intro.append(heading);
    var p=document.createElement('p');p.textContent=welcome[1];intro.append(p);
    if (route()==='/beaches') {var source=document.createElement('p');source.className='sr-information-source';var a=document.createElement('a');a.href='https://www.visitbrighton.com/things-to-do/brighton-naturist-beach-p628201';a.textContent='Brighton beach information';source.append(a);intro.append(source);}
    main.insertBefore(intro,hero);
  }
  function photoCredits(grid, entries) {
    if (!entries.length) return;
    var details=grid.nextElementSibling;
    if(!details||!details.matches('details.sr-photo-credits')){details=document.createElement('details');details.className='sr-photo-credits';var summary=document.createElement('summary');summary.textContent='Photograph credits';details.append(summary);grid.after(details);}
    entries.forEach(function(entry){if(Array.from(details.querySelectorAll('a')).some(function(a){return a.href===entry.source;}))return;var p=document.createElement('p');var a=document.createElement('a');a.href=entry.source;a.textContent=entry.alt;var license=document.createElement('a');license.href=entry.licenseUrl;license.textContent=entry.license;p.append(a,document.createTextNode(' · '+entry.credit+' · '),license,document.createTextNode(' · display crop'));details.append(p);});
  }
  function restoreTilePhotos(root) {
    var path=route(), id=pathsToCategory[path]||path.slice(1), model=window.SR_CATEGORY_PAGES&&window.SR_CATEGORY_PAGES[id];
    if (!model || !Array.isArray(model.rows)) return;
    root.querySelectorAll('main > section .tiles').forEach(function(grid,rowIndex){
      var row=model.rows[rowIndex];if(!row)return;var credits=[];
      grid.querySelectorAll(':scope > a.tile').forEach(function(tile,index){
        if(tile.dataset.srOriginalPhoto==='1')return;
        var label=row.items[index];if(typeof label!=='string')return;
        var correction=photoCorrections[label], source=correction&&correction.src||model.rowImages&&model.rowImages[rowIndex]&&model.rowImages[rowIndex][index];
        var alt=correction&&correction.alt||model.rowImageAlts&&model.rowImageAlts[rowIndex]&&model.rowImageAlts[rowIndex][index]||label;
        // Separate real photographs and HTML labels. A category without a verified
        // photo uses the site's crisp vector artwork rather than a blurry art sheet.
        var visual;
        if(source&&/^https:\/\/static\.wixstatic\.com\/media\//.test(source)){
          visual=document.createElement('img');visual.src=source.split('/v1/')[0]+'/v1/fill/w_640,h_400,q_85,enc_auto/photo.webp';visual.alt=alt;visual.width=640;visual.height=400;visual.loading='lazy';visual.decoding='async';
        }else{
          var icons=window.SR_CATEGORY_ICONS;if(!icons)return;
          var key=/machine|agc|slots/i.test(label)?'arcade':/game|retro/i.test(label)?'game':/fish|aquarium|reptile/i.test(label)?'fish':/lion|elephant|giraffe|animal|wildlife|primat|cat|penguin|bird|safari|zoo/i.test(label)?'paw':/castle|roman|histor|medieval|monument|battlefield/i.test(label)?'castle':/museum|gallery|science|heritage/i.test(label)?'museum':/food|dining|cafe|drink|pub/i.test(label)?'food':/hotel|stay|cottage|camp|lodge/i.test(label)?'bed':/water|boat|beach|coast/i.test(label)?'beach':/ride|park|family fun/i.test(label)?'coaster':/walk|garden|nature|forest|wood/i.test(label)?'tree':'compass';
          visual=document.createElement('span');visual.className='sr-tile-icon';visual.setAttribute('aria-hidden','true');visual.innerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="72" height="72">'+(icons[key]||icons.compass)+'</svg>';
        }
        var name=document.createElement('strong');name.textContent=label;tile.replaceChildren(visual,name);tile.classList.remove('art');tile.classList.add('sr-real-photo');tile.style.removeProperty('background-image');tile.style.removeProperty('aspect-ratio');tile.dataset.srOriginalPhoto='1';
        if(correction&&correction.credit)credits.push(correction);
      });photoCredits(grid,credits);
    });
  }
  function currentDestinationPhotos(root) {
    root.querySelectorAll('a[href^="/destination/"]').forEach(function(a){
      var heading=a.querySelector('h3,h2,strong'), label=heading&&heading.textContent.trim(), correction=photoCorrections[label], img=a.querySelector('img');
      if(!correction||!img||a.classList.contains('tile'))return;
      if(img.dataset.srCurrentPlacePhoto===correction.src)return;
      img.removeAttribute('srcset');img.removeAttribute('sizes');img.dataset.srImageSource=correction.src;
      img.src=correction.src+'/v1/fill/w_960,h_720,q_85,enc_auto/place.webp';img.alt=correction.alt||label;img.dataset.srCurrentPlacePhoto=correction.src;
    });
  }
  function cleanOfferLinks(root){root.querySelectorAll('a[href*="/offers?"]').forEach(function(a){var u;try{u=new URL(a.getAttribute('href'),location.origin);}catch(_){return;}if(u.origin===location.origin&&u.pathname==='/offers'&&Array.from(u.searchParams.keys()).every(function(key){return ['offer','category','town'].includes(key);}))a.setAttribute('href',u.pathname+'#'+u.search.slice(1));});}
  function detailLead(root) {
    var host=root.host, id=host&&host.id;if(!id||!/^sr-(place-page|food-page|hotel-guide|venue-page)/.test(id))return;
    var article=root.querySelector('.body article,main .about'), first=article&&article.querySelector('p:not(.src)'), heading=root.querySelector('.panel h1,main .head h1,.detail h1');
    if(!first||!heading||root.querySelector('[data-sr-first-description]'))return;
    var text=first.textContent.replace(/\s+/g,' ').trim();if(text.split(' ').length<15)return;
    var lead;
    if(text.split(' ').length<=120)lead=first;
    else {lead=document.createElement('p');var sentences=text.match(/[^.!?]+[.!?]+(?:\s|$)/g)||[];var brief=sentences.slice(0,2).join(' ').trim();if(!brief||brief.split(' ').length>100)return;lead.textContent=brief;}
    lead.dataset.srFirstDescription='1';lead.classList.add('sr-first-description');
    var target=heading.parentElement, address=target.querySelector('.where,.tag');if(address)address.after(lead);else heading.after(lead);
  }
  function venueFirstView(root) {
    if(root.host?.id!=='sr-shell-page')return;
    var hero=root.querySelector('section.vh'), heading=hero&&hero.querySelector('h1'),about=root.querySelector('main .about'),first=about&&about.querySelector('p');
    if(!hero||!heading||!first||root.querySelector('[data-sr-venue-purpose]'))return;
    var special=resortOpenings[route()],text=first.textContent.replace(/\s+/g,' ').trim(),sentences=text.match(/[^.!?]+[.!?]+(?:\s|$)/g)||[],brief=text.split(' ').length<=90?text:sentences.slice(0,2).join(' ').trim();
    if(!special){if(!brief||brief.split(' ').length>110)brief=text.split(' ').slice(0,90).join(' ')+'…';if(text.split(' ').length<15)return;}
    var opening=document.createElement('section');opening.className='sr-page-intro';opening.dataset.srVenuePurpose='1';
    if(special){heading.textContent=special.title;
      var category=root.querySelector('.crumb nav a[href="/arcade"]');if(category){category.href='/theme-parks';category.textContent='Theme parks';}
      var tags=hero.querySelector('.tags');if(tags){tags.replaceChildren();(special.tags||['Theme park']).forEach(function(label,index){var span=document.createElement('span');span.className='t'+(index+1);span.textContent=label;tags.append(span);});}
    }
    heading.style.cssText='position:static;color:#102744;font:900 clamp(27px,3.1vw,40px)/1.1 "Roboto Condensed",Arial;margin:0 0 10px;text-shadow:none';
    opening.append(heading);var paragraph=document.createElement('p');
    if(special){var fragment=document.createElement('template');fragment.innerHTML=special.body;paragraph=fragment.content.querySelector('p').cloneNode(true);var guide=document.createElement('section');guide.className='sr-resort-story';guide.style.cssText='grid-column:1/-1;line-height:1.65;padding:24px 0;max-width:1000px';guide.innerHTML=special.body;var oldOpening=guide.querySelector('p');if(oldOpening)oldOpening.remove();var main=root.querySelector('main');main.prepend(guide);var oldTitle=about.querySelector('h2');if(oldTitle)oldTitle.textContent=special.sectionTitle;
      var image=hero.querySelector('img.vhi');if(image&&special.photo){image.removeAttribute('srcset');image.removeAttribute('sizes');image.dataset.srImageSource=special.photo.src;image.src=special.photo.src+'/v1/fit/w_1600,h_1100,q_88,enc_auto/resort.webp';image.alt=special.photo.alt;}
    }else{paragraph.textContent=brief;}
    opening.append(paragraph);hero.before(opening);
  }
  function foodFirstView(root){
    if(root.host?.id!=='sr-food-page')return;
    var banner=root.querySelector('.banner'),heading=root.querySelector('main .head h1');
    if(!banner||!heading||root.querySelector('[data-sr-food-purpose]'))return;
    var intro=document.createElement('section');intro.className='sr-page-intro';intro.dataset.srFoodPurpose='1';intro.append(heading);
    var lead=root.querySelector('[data-sr-first-description]');if(lead)intro.append(lead);
    else {var tag=root.querySelector('main .head .tag');if(tag&&tag.textContent.trim())intro.append(tag);}
    banner.before(intro);
    // Supplier listings and researched guides must not imply a personal visit.
    var labels=['Food & drink guides','Restaurants & cafés','Local discoveries','Plan your food stop'];
    banner.querySelectorAll('.ticks span').forEach(function(span,index){if(labels[index])span.textContent=labels[index];});
  }
  function placeFirstView(root){
    if(!/^sr-(place-page|hotel-guide|venue-page)/.test(root.host?.id||''))return;
    var hero=root.querySelector('main > .hero'),heading=hero&&hero.querySelector('.panel h1');
    if(!hero||!heading||root.querySelector('[data-sr-place-purpose]'))return;
    var intro=document.createElement('section');intro.className='sr-page-intro';intro.dataset.srPlacePurpose='1';intro.append(heading);
    var lead=root.querySelector('[data-sr-first-description]');if(lead)intro.append(lead);
    hero.before(intro);
  }
  function machineFirstView(root){
    if(root.host?.id!=='sr-approved-archive')return;
    var grid=root.querySelector('.mh-grid'),info=grid&&grid.querySelector('.mh-info'),heading=info&&info.querySelector('h1');
    if(!grid||!heading||root.querySelector('[data-sr-machine-purpose]'))return;
    var intro=document.createElement('section');intro.className='sr-page-intro sr-machine-intro';intro.dataset.srMachinePurpose='1';intro.style.padding='20px 0';heading.classList.remove('vh','sr-only','sr-hub-visually-hidden');intro.append(heading);
    var maker=info.querySelector('.mh-sub'),lead=info.querySelector('.mh-desc');if(maker)intro.append(maker);if(lead)intro.append(lead);
    grid.before(intro);
  }
  function importedPhotoCredits(root) {
    root.querySelectorAll('img').forEach(function(img){
      if(img.closest('.sr-real-photo')||img.dataset.srPhotoCredit)return;
      var src=(img.getAttribute('data-sr-image-source')||img.getAttribute('src')||'').split('/v1/')[0];
      var entry=Object.values(photoCorrections).find(function(p){return p.src===src&&p.credit;});
      if(!entry)return;img.dataset.srPhotoCredit='1';
      var grid=img.closest('.cards,.highlights,.home-picks,.sr-browse-cards,.grid');
      if(grid){photoCredits(grid,[entry]);return;}
      var container=img.parentElement;if(!container)return;
      var caption=document.createElement('p');caption.className='sr-photo-credits';var a=document.createElement('a');a.href=entry.source;a.textContent=entry.alt;
      var license=document.createElement('a');license.href=entry.licenseUrl;license.textContent=entry.license;
      caption.append(a,document.createTextNode(' · '+entry.credit+' · '),license,document.createTextNode(' · display crop'));
      if(container.tagName==='A'||container.classList.contains('photo'))container.after(caption);else img.after(caption);
    });
  }
  function directHeroLead(root) {
    var welcome=welcomes[route()];if(!welcome||root.querySelector('.sr-page-intro'))return;
    var main=root.querySelector('main'), hero=main&&main.querySelector(':scope > .hero'), heading=hero&&hero.querySelector('h1');
    if(!heading||hero.querySelector('[data-sr-page-welcome]'))return;
    var p=document.createElement('p');p.className='sr-first-description';p.dataset.srPageWelcome='1';p.textContent=welcome[1];heading.after(p);
  }
  function scan() {
    queued=false;var roots=[document];
    for(var i=0;i<roots.length;i++){
      var root=roots[i];root.querySelectorAll('*').forEach(function(e){if(e.shadowRoot)roots.push(e.shadowRoot);});
      installStyle(root);introduction(root);restoreTilePhotos(root);currentDestinationPhotos(root);cleanOfferLinks(root);detailLead(root);venueFirstView(root);foodFirstView(root);placeFirstView(root);machineFirstView(root);directHeroLead(root);importedPhotoCredits(root);
      if(!observed.has(root)){observed.add(root);new MutationObserver(schedule).observe(root,{childList:true,subtree:true});}
    }
  }
  function schedule(){if(queued)return;queued=true;setTimeout(scan,90);}
  if(document.body)scan();else document.addEventListener('DOMContentLoaded',scan,{once:true});
  addEventListener('pageshow',schedule);addEventListener('popstate',schedule);
  var tries=0,timer=setInterval(function(){scan();if(++tries>=40)clearInterval(timer);},500);
})();
