/* Reader-first navigation and discovery for the existing Spin Raiders routes. */
(function () {
  'use strict';
  if (window.SR_DAYS_OUT_EXPERIENCE) return;
  window.SR_DAYS_OUT_EXPERIENCE = true;
  var primary = [['Days out','/days-out'],['Attractions','/attractions'],['Seaside','/seaside'],['Food & drink','/food-and-drink'],['Places to stay','/places-to-stay'],['Arcades','/arcade']];
  var browse = [['Theme parks','/theme-parks'],['Zoos & wildlife','/zoos'],['Museums','/museums'],['Historic places','/historical-sites'],['Beaches','/beaches'],['Piers','/piers'],['Outdoors','/outdoors'],['Hidden gems','/hidden-gems'],['Cinema','/cinemas'],['Bowling','/bowling'],['Fishing','/fishing-lakes'],['Holiday parks','/holiday-parks'],['Retro games','/retro-video-games'],['Arcade bars','/arcade-bars'],['Adult gaming centres','/agc'],['Classic machines','/classic-fruit-machines'],['Offers','/offers'],['Plan a trip','/plan-a-trip']];
  var topics = {'All Attractions':'/attractions','Theme Parks':'/theme-parks','Zoos & Wildlife':'/zoos','Museums':'/museums','Museums & Galleries':'/museums','Historic Sites':'/historical-sites','Historical Sites':'/historical-sites','Family Fun':'/family-fun','Tours':'/tours','Tours & Experiences':'/tours','Nature & Outdoors':'/outdoors','All Seaside':'/seaside','Piers & Promenades':'/piers','Beaches':'/beaches','Arcades':'/arcade','Family Arcades':'/arcade','All Arcades':'/arcade','Food & Drink':'/food-and-drink','Places to Stay':'/places-to-stay','Hidden Gems':'/hidden-gems','Plan a Trip':'/plan-a-trip','Sea Life Centres':'/sea-life','Sea Life':'/sea-life','Cinemas':'/cinemas','Bowling':'/bowling','Retro Video Games':'/retro-video-games','Classic Fruit Machines':'/classic-fruit-machines','AGC (Adult Gaming)':'/agc','AGC (Adult Gaming Centres)':'/agc','Arcade Bars':'/arcade-bars'};
  var experiences = {
    coast: ['A proper breath of sea air','Beach time, a waterfront wander and something tasty afterwards. Pick a resort or a quieter stretch of coast, then leave room for the little discoveries.', [['☀','Beach days','Build sandcastles, wander the shore or just sit and watch the sea.','/beaches'],['⚓','Piers & promenades','A walk with a view, with stops along the way.','/piers'],['♨','Chips, cafés & treats','Give your seaside food stop a place in the plan.','/food-and-drink']]],
    adventure: ['What shall we do today?','Start with the bit everyone is excited about. Choose an adventure, add lunch nearby and keep an indoor idea ready if the weather changes.', [['✦','Big rides & big smiles','Make a theme park your main event.','/theme-parks'],['❋','Wildlife discoveries','Explore zoos, wildlife parks and aquariums.','/zoos'],['⌂','Stories worth exploring','Museums and historic places for a different kind of day.','/museums']]],
    stay: ['One more day of exploring','A night away means time for an evening meal, a slower morning and another adventure. Choose the area first, then compare the full cost and room details.', [['☾','Find your base','Explore places to stay around your next trip.','/places-to-stay'],['☀','A seaside short break','Start with a resort and build the weekend around it.','/seaside'],['✦','Plan tomorrow’s adventure','Add an attraction to the stay.','/attractions']]],
    food: ['Make the food stop part of the fun','A good lunch can be a highlight, not a hurried stop between attractions. Find a place that fits your route, then check menus and service times before you go.', [['⚓','Food by the sea','Choose your coastal day, then find a nearby food stop.','/seaside'],['✦','Lunch after an adventure','Pair a meal with an attraction or a town wander.','/attractions'],['☾','Stay for dinner','Make time for an evening out and a night away.','/places-to-stay']]],
    outdoors: ['Less rush. More fresh air.','Pick a walk, a beach or a quieter escape. Plan the route and facilities around your group, and check the weather before heading out.', [['☀','Along the coast','Find a beach or a promenade for your next walk.','/beaches'],['❋','A slower escape','Explore fishing and country-day ideas.','/fishing-lakes'],['☾','Make it a little break','Stay nearby and give yourself another day outside.','/places-to-stay']]],
    culture: ['A day with a story to tell','Choose one museum or historic place to explore properly. Add a wander and a food stop, rather than rushing between every attraction on the map.', [['⌂','Museums & galleries','Find stories, collections and indoor discoveries.','/museums'],['✦','Castles & historic places','Build the day around a place with a past.','/historical-sites'],['♨','A well-earned food stop','Leave time to sit down after exploring.','/food-and-drink']]],
    play: ['Press pause. Have some fun.','Choose a play stop that suits the group: retro games, family entertainment or an evening with friends. Check venue age rules and session times before travelling.', [['✚','Family arcade fun','Explore amusement arcades around the UK.','/arcade'],['★','Retro favourites','Find classic video-game experiences.','/retro-video-games'],['♨','Keep the day going','Add a nearby food stop to your plan.','/food-and-drink']]],
    indoor: ['A good day, whatever the weather','Make an indoor activity the main event, then add lunch or dinner nearby. Check session times and any booking or age requirements before setting off.', [['●','A game of bowling','Make a little friendly competition part of the day.','/bowling'],['▶','An afternoon at the cinema','Pick a film and plan the food stop around it.','/cinemas'],['⌂','Something new to discover','Explore museums for a different indoor day.','/museums']]]
  };
  var families = {'/days-out':'adventure','/attractions':'adventure','/family-fun':'adventure','/theme-parks':'adventure','/zoos':'adventure','/sea-life':'adventure','/hidden-gems':'adventure','/tours':'adventure','/seaside':'coast','/beaches':'coast','/piers':'coast','/places-to-stay':'stay','/holiday-parks':'stay','/food-and-drink':'food','/outdoors':'outdoors','/fishing-lakes':'outdoors','/museums':'culture','/historical-sites':'culture','/arcade':'play','/agc':'play','/retro-video-games':'play','/arcade-bars':'play','/classic-fruit-machines':'play','/bowling':'indoor','/cinemas':'indoor','/bingo-halls':'indoor'};
  var css = 'nav.menu[data-sr-flat-menu]{display:flex;align-items:center;justify-content:center;gap:4px;flex:1;min-width:0}nav.menu[data-sr-flat-menu]>a{color:#fff;text-decoration:none;white-space:nowrap;font:800 15px/1.3 "Roboto Condensed",Arial;padding:14px 10px;border-radius:8px}nav.menu[data-sr-flat-menu]>a:hover,nav.menu[data-sr-flat-menu]>a[aria-current="page"]{background:#ffffff16;color:#ffe05b}nav.menu[data-sr-flat-menu] [data-sr-browse]{display:none!important}nav.menu[data-sr-flat-menu]>a:focus-visible{outline:3px solid #ffe05b;outline-offset:-3px}header .tagline{display:none!important}nav[aria-label="Mobile"][data-sr-flat-mobile]{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:75vh;overflow:auto;padding:16px;min-width:min(330px,88vw);background:#fff}nav[aria-label="Mobile"][data-sr-flat-mobile]>a{color:#0b2545!important;background:#f0f6fd;white-space:normal;padding:13px;border-radius:9px;text-decoration:none;font:800 16px/1.3 "Roboto Condensed",Arial}nav[aria-label="Mobile"][data-sr-flat-mobile]>p{grid-column:1/-1;margin:8px 0 0;color:#536981;font:800 11px/1.4 Arial;letter-spacing:.1em}.sr-experience{width:min(1180px,calc(100% - 40px));margin:32px auto 28px;color:#0b2545;font-family:Inter,Arial,sans-serif}.sr-experience .eyebrow{font:800 11px/1.4 Arial;letter-spacing:.12em;color:#a01859;margin:0 0 8px}.sr-experience h2{font:900 clamp(28px,3.2vw,42px)/1.1 "Roboto Condensed",Arial;margin:0 0 12px}.sr-experience>p{font:400 16px/1.7 Inter,Arial;max-width:880px;color:#31465d}.sr-experience-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:22px 0}.sr-experience-card{position:relative;padding:28px 24px;border-radius:23px 23px 9px 23px;min-height:220px;background:#def3ff;color:#075985!important;text-decoration:none;display:flex;flex-direction:column;gap:12px;transition:transform .15s}.sr-experience-card:nth-child(2){background:#ffe4f0;color:#a01859!important;border-radius:23px 9px 23px 23px}.sr-experience-card:nth-child(3){background:#fff0c4;color:#805200!important}.sr-experience-card>span:first-child{font-size:38px;line-height:1}.sr-experience-card strong{font:900 27px/1.1 "Roboto Condensed",Arial}.sr-experience-card small{font:400 14px/1.6 Inter,Arial;max-width:280px}.sr-experience-card .go{margin-top:auto;font:800 15px Arial}.sr-experience-card:hover{transform:translateY(-3px)}.sr-experience a:focus-visible{outline:3px solid #0c63b6;outline-offset:4px}.sr-experience-link{display:inline-block;background:#0b2545;color:#fff!important;border-radius:10px;padding:12px 18px;text-decoration:none;font:800 15px Arial}.topics[data-sr-category-links]{display:flex!important;flex-wrap:wrap;justify-content:center;gap:8px;padding:16px 20px;background:#f5f9fd!important;height:auto}.topics[data-sr-category-links]>a{display:inline-flex;align-items:center;padding:10px 16px;background:#fff;border:1px solid #d5e4f1;border-radius:10px;color:#174b7c;text-decoration:none;font:800 15px "Roboto Condensed",Arial;white-space:normal}.topics[data-sr-category-links]>a[aria-current="page"]{background:#ffe36b;color:#0b2545}.hero:has(+.sr-experience){min-height:285px!important;height:auto!important}.hero:has(+.sr-experience) .hero-copy{padding-bottom:36px}.hero-search[data-sr-catalog-search]{position:static!important;transform:none!important;width:min(920px,calc(100% - 40px))!important;max-width:none!important;margin:24px auto!important}.sr-catalog-intro{margin:28px 0 18px;font:400 15px/1.7 Inter,Arial;color:#31465d}.sr-catalog-intro h2{font:900 30px "Roboto Condensed",Arial;margin:0 0 8px;color:#0b2545}.sr-catalog-disclosure{margin:14px 0 24px;border:1px solid #d5e4f1;border-radius:14px;background:#fff;padding:16px}.sr-catalog-disclosure>summary{cursor:pointer;font:800 17px "Roboto Condensed",Arial;color:#0b2545}.sr-catalog-disclosure>.layout{margin-top:20px}.sr-catalog-disclosure:not([open])>.layout{display:none!important}.sr-guide-index{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 26px}.sr-guide-index a{display:block;background:#e9f3ff;color:#174b7c;text-decoration:none!important;padding:9px 13px;border-radius:10px;font:800 14px/1.45 Inter,Arial}.sr-town-guide[data-sr-reader-guide]{background:#fff;border-radius:22px;padding:clamp(22px,4vw,42px);margin-top:26px}.sr-town-guide[data-sr-reader-guide] .wrapbox{max-height:none!important;overflow:visible!important}.sr-town-guide[data-sr-reader-guide] .wrapbox:after{display:none!important}.sr-town-guide[data-sr-reader-guide] .more{display:none!important}.sr-town-guide[data-sr-reader-guide] .body{max-width:880px}.sr-town-guide[data-sr-reader-guide] .body h2{scroll-margin-top:105px;border-top:1px solid #dfebf5;padding-top:28px;margin-top:30px;font-size:clamp(24px,2.5vw,32px)}.sr-town-guide[data-sr-reader-guide] .intro{max-width:900px;font-weight:500;line-height:1.7}.categories[data-sr-reader-categories]{flex-wrap:wrap;gap:8px;height:auto}.categories[data-sr-reader-categories]>button{border-radius:10px!important;margin:0!important}.sr-continue-day{margin:30px 0 10px;padding:26px;background:#fff0c4;border-radius:22px;color:#0b2545;font:400 16px/1.65 Inter,Arial}.sr-continue-day h2{font:900 30px/1.1 "Roboto Condensed",Arial;margin:0 0 12px}.sr-continue-day nav{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.sr-continue-day a{display:inline-block;background:#fff;color:#174b7c;border:1px solid #decd9b;border-radius:10px;padding:10px 14px;text-decoration:none;font-weight:800}.sr-reader-page .body article{font-size:17px;line-height:1.8;border-radius:22px}.sr-reader-page .body article h2,.sr-reader-page .body article h3{font:900 27px/1.2 "Roboto Condensed",Arial;margin:28px 0 12px;scroll-margin-top:100px}.sr-reader-page .body article p{margin-bottom:18px}.sr-reader-page .panel{background:#eff7ff;border-radius:22px}.sr-reader-page .photo{border-radius:22px}.sr-reader-page .box{border:1px solid #dde8f4;box-shadow:none}.sr-reader-page .btns{margin-top:20px}.sr-reader-page .guide-jumps{margin:24px 0}.sr-reader-page .guide-jumps>a{display:inline-block;padding:10px 14px;background:#e9f3ff;border-radius:10px;font-weight:800;margin:0 8px 8px 0;text-decoration:none}.sr-category-library{margin:26px 0;padding:24px;background:#f5f9fd;border-radius:18px}.sr-category-library h2{font:900 27px "Roboto Condensed",Arial;margin:0 0 14px}.sr-category-library nav{display:flex;flex-wrap:wrap;gap:8px}.sr-category-library a{display:block;padding:10px 13px;background:#fff;border:1px solid #d5e4f1;border-radius:9px;color:#174b7c;text-decoration:none;font:700 14px Inter,Arial}@media(max-width:1050px){nav.menu[data-sr-flat-menu]>a{font-size:14px;padding:12px 7px}header .nav-search{display:none!important}}@media(max-width:850px){nav.menu[data-sr-flat-menu]{display:none!important}.sr-experience-grid{grid-template-columns:1fr}.sr-experience-card{min-height:0;padding:22px}.sr-experience{width:calc(100% - 32px)}.sr-guide-index{display:grid;grid-template-columns:1fr 1fr}.sr-catalog-disclosure{padding:14px}.sr-catalog-disclosure>.layout{display:block!important}.sr-catalog-disclosure .filters{position:static!important;width:100%!important;margin-bottom:20px}}@media(prefers-reduced-motion:reduce){.sr-experience-card{transition:none}}';

  css += '@media(max-width:1100px){nav.menu[data-sr-flat-menu]{display:none!important}header .burger{display:block!important}}@media(min-width:1101px){header .burger{display:none!important}}.search-hero h1{margin:0;font:900 clamp(38px,6vw,76px)/1.04 \"Roboto Condensed\",Arial;color:#fff}.search-hero h1 span:last-child{color:#ffe05b}.sr-source-records[data-sr-reader-sources]{padding:24px;background:#f5f9fd;border-radius:18px}.sr-source-records[data-sr-reader-sources]>h2{font:900 27px/1.2 \"Roboto Condensed\",Arial;margin:0 0 16px}.sr-source-records[data-sr-reader-sources] h3{font-size:21px}.sr-reader-page main .about{font:400 17px/1.8 Inter,Arial,sans-serif;max-width:850px}.sr-reader-page main .head{padding:24px;background:#eef7ff;border-radius:22px;margin-bottom:24px}.sr-reader-page main .grid{border-radius:22px;overflow:hidden}.sr-guide-index{grid-column:1/-1}';

  function link(label, href) {
    var a = document.createElement('a'); a.textContent = label; a.href = href;
    if (location.pathname.replace(/\/$/,'') === href) a.setAttribute('aria-current','page');
    return a;
  }
  function style(root) {
    if (root.querySelector('style[data-sr-days-out-style]')) return;
    var s=document.createElement('style');s.dataset.srDaysOutStyle='1';s.textContent=css;
    (root.head || root).appendChild(s);
  }
  function navigation(root) {
    var nav = root.querySelector('nav[aria-label="Main"]');
    if (nav && !nav.hasAttribute('data-sr-flat-menu')) {
      nav.dataset.srFlatMenu='1';
      nav.replaceChildren.apply(nav,primary.map(function(item){return link(item[0],item[1]);}));
      // Retain the older browse hook without another dropdown being injected.
      var marker=document.createElement('span');marker.dataset.srBrowse='1';marker.hidden=true;nav.append(marker);
    }
    var mobile=root.querySelector('nav[aria-label="Mobile"]');
    if(mobile&&!mobile.hasAttribute('data-sr-flat-mobile')){
      mobile.dataset.srFlatMobile='1';mobile.replaceChildren.apply(mobile,primary.map(function(item){return link(item[0],item[1]);}));
      var p=document.createElement('p');p.textContent='MORE WAYS TO EXPLORE';mobile.append(p);
      browse.forEach(function(item){mobile.append(link(item[0],item[1]));});mobile.append(link('Search all places','/search'));
    }
  }
  function discovery(root) {
    var path=location.pathname.replace(/\/$/,'')||'/';
    var family=families[path],main=root.querySelector('main.directory');
    if(!family||!main||main.querySelector('.sr-experience'))return;
    var hero=main.querySelector(':scope > .hero');if(!hero)return;
    var data=experiences[family],section=document.createElement('section');section.className='sr-experience';
    var eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent='START WITH AN IDEA';
    var h=document.createElement('h2');h.textContent=data[0];
    var intro=document.createElement('p');intro.textContent=data[1];
    var grid=document.createElement('nav');grid.className='sr-experience-grid';grid.setAttribute('aria-label','Day-out ideas');
    data[2].forEach(function(item){var a=link('',item[3]);a.className='sr-experience-card';var icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=item[0];var title=document.createElement('strong');title.textContent=item[1];var desc=document.createElement('small');desc.textContent=item[2];var go=document.createElement('span');go.className='go';go.textContent='Explore →';a.append(icon,title,desc,go);grid.append(a);});
    var more=link('Find a specific place ↓','#sr-catalog');more.className='sr-experience-link';
    section.append(eyebrow,h,intro,grid,more);hero.after(section);
    var layout=main.querySelector('.layout');if(layout){var parent=layout.parentElement;parent.id='sr-catalog';var heading=document.createElement('div');heading.className='sr-catalog-intro';var ht=document.createElement('h2');ht.textContent='Find the places for your plan';var p=document.createElement('p');p.textContent='Know what you’re looking for? Search by name or town, or use the filters below.';heading.append(ht,p);parent.prepend(heading);var form=hero.querySelector('form.hero-search');if(form){form.dataset.srCatalogSearch='1';heading.after(form);}}
    var nav=main.querySelector('nav.topics');if(nav){var found=[];nav.querySelectorAll('button').forEach(function(button){var label=button.textContent.trim(),href=topics[label];if(href)found.push(link(label,href));});if(found.length>1){nav.replaceChildren.apply(nav,found);nav.dataset.srCategoryLinks='1';nav.setAttribute('aria-label','Explore categories');}}
  }
  function guideIndex(guide, body) {
    if(guide.querySelector('.sr-guide-index'))return;
    var headings=Array.from(body.querySelectorAll('h2,h3'));if(headings.length<2)return;
    var nav=document.createElement('nav');nav.className='sr-guide-index';nav.setAttribute('aria-label','In this guide');
    headings.slice(0,16).forEach(function(h,i){if(!h.id)h.id='sr-guide-chapter-'+i;nav.append(link(h.textContent,'#'+h.id));});
    body.before(nav);
  }
  function destination(root) {
    if(!/^\/destination\//.test(location.pathname))return;
    var guide=root.querySelector('.sr-town-guide');if(!guide||guide.hasAttribute('data-sr-reader-guide'))return;
    guide.dataset.srReaderGuide='1';guide.classList.remove('closed');
    var hero=root.querySelector('.search-hero'),title=hero&&hero.querySelector('h2');
    if(title){var h1=document.createElement('h1');h1.className=title.className;h1.innerHTML=title.innerHTML;title.replaceWith(h1);}
    root.querySelectorAll('.content h1').forEach(function(h){var h2=document.createElement('h2');h2.className=h.className;h2.innerHTML=h.innerHTML;h.replaceWith(h2);});
    var body=guide.querySelector('.body');if(body)guideIndex(guide,body);
    var cats=root.querySelector('nav.categories');if(cats){cats.dataset.srReaderCategories='1';var order=['All Results','Attractions & Family Fun','Eat & Drink','Places to Stay','Nature & Outdoors','Cinemas','Arcades','Fishing Lakes'];var buttons=order.map(function(label){return Array.from(cats.querySelectorAll(':scope > button')).find(function(b){return b.textContent.trim()===label;});}).filter(Boolean);cats.prepend.apply(cats,buttons);}
    var kicker=guide.querySelector('.kicker');if(kicker){var town=guide.getAttribute('aria-label')||'Your destination';kicker.textContent=town.replace(/^About /,'').toUpperCase()+' · DAYS OUT & DISCOVERIES';}
  }
  function detail(root) {
    var id=root.host&&root.host.id;
    if(!id||!/^sr-(place-page|food-page|hotel-guide|venue-page)/.test(id))return;
    var wrapper=root.querySelector('.wrap'),article=root.querySelector('.body article,main .about');if(!wrapper||!article)return;
    wrapper.classList.add('sr-reader-page');
    if(!wrapper.querySelector('.sr-continue-day')){
      var s=document.createElement('section');s.className='sr-continue-day';var h=document.createElement('h2');h.textContent='Make a day of it';var p=document.createElement('p');p.textContent='Keep the adventure going: add something to do, a food stop or a night away. Start with the place, then choose the stops that fit your day.';var nav=document.createElement('nav');nav.setAttribute('aria-label','Keep exploring');var town=root.querySelector('aside a.more,a[href^="/destination/"]');if(town&&town.getAttribute('href'))nav.append(link('Explore the destination →',town.getAttribute('href')));[['More things to do','/attractions'],['Food & drink','/food-and-drink'],['Places to stay','/places-to-stay']].forEach(function(item){nav.append(link(item[0],item[1]));});s.append(h,p,nav);wrapper.append(s);
    }
    guideIndex(wrapper,article);
  }
  function readableSources(root) {
    var source=root.querySelector('.sr-source-records');if(!source||source.hasAttribute('data-sr-reader-sources'))return;
    source.dataset.srReaderSources='1';
    var normalize=function(value){return String(value||'').replace(/\s+/g,' ').trim().toLowerCase();};
    var seenText=new Set(),seenPhotos=new Set(),refs=new Map();
    root.querySelectorAll('p,li').forEach(function(e){if(!source.contains(e))seenText.add(normalize(e.textContent));});
    root.querySelectorAll('img').forEach(function(e){if(!source.contains(e))seenPhotos.add((e.getAttribute('src')||'').split('/v1/')[0]);});
    var labels={overview:'What to expect',shortDescription:'At a glance',summary:'At a glance',review:'About this place',detailedReview:'A closer look',historySummary:'The story of this place',archiveSummary:'The story of this place',guideContent:'Your visit',guideDetails:'Planning your visit',sourceFacts:'About your visit',fullDescription:'A closer look',description:'About this place',visitorInfo:'Before you go'};
    var children=[];
    source.querySelectorAll('[data-source-field]').forEach(function(section){
      var copy=section.cloneNode(true);
      copy.querySelectorAll('p,li').forEach(function(e){var key=normalize(e.textContent);if(!key||seenText.has(key))e.remove();else seenText.add(key);});
      copy.querySelectorAll('ul,ol').forEach(function(e){if(!e.querySelector('li'))e.remove();});
      if(!copy.querySelector('p,li'))return;
      if(root.host && root.host.id==='sr-food-page' && /^(review|fullDescription|detailedReview)$/.test(section.getAttribute('data-source-field'))){
        var about=root.querySelector('main .about');
        if(about){var label=copy.querySelector(':scope > h4');if(label)label.remove();about.replaceChildren.apply(about,Array.from(copy.childNodes));about.dataset.srExpandedReview='1';return;}
      }
      var old=copy.querySelector('h4'),heading=document.createElement('h3');heading.textContent=labels[section.getAttribute('data-source-field')]||'More about your visit';if(old)old.replaceWith(heading);else copy.prepend(heading);
      copy.removeAttribute('data-source-field');children.push(copy);
    });
    source.querySelectorAll('figure').forEach(function(figure){var img=figure.querySelector('img'),key=img&&(img.getAttribute('src')||'').split('/v1/')[0];if(key&&!seenPhotos.has(key)){seenPhotos.add(key);children.push(figure.cloneNode(true));}});
    source.querySelectorAll('a[href]').forEach(function(a){var href=a.getAttribute('href');if(/^https?:\/\//.test(href)&&!refs.has(href))refs.set(href,a);});
    var title=document.createElement('h2');title.textContent=children.length?'More about your visit':'Sources for this guide';
    source.replaceChildren(title);
    children.forEach(function(e){source.append(e);});
    if(refs.size){var list=document.createElement('ul');refs.forEach(function(a,href){var li=document.createElement('li'),copy=a.cloneNode(true);var domain=new URL(href).hostname.replace(/^www\./,'');copy.textContent=domain;li.append(copy);list.append(li);});if(children.length){var h=document.createElement('h3');h.textContent='Sources for this guide';source.append(h);}source.append(list);}
    if(!children.length&&!refs.size)source.hidden=true;
  }
  function foodClaims(root) {
    if(!root.host||root.host.id!=='sr-food-page')return;
    var banner=root.querySelector('.banner');if(banner){var tagline=banner.querySelector('.bs');if(tagline)tagline.textContent='A food stop for your day out.';banner.querySelectorAll('*').forEach(function(e){if(e.children.length)return;if(/^(?:✓\s*)?(Personally recommended|Real reviews|Local favourite|Great food & drink)$/.test(e.textContent.trim()))e.remove();});}
    root.querySelectorAll('a[href^="https://www.tripadvisor."]').forEach(function(a){if(/^Visit website/.test(a.textContent.trim()))a.textContent='View customer reviews →';});
    root.querySelectorAll('a[href^="tel:"]').forEach(function(a){if(/^Book a table/.test(a.textContent.trim()))a.textContent='Call the venue ☎';});
    var about=root.querySelector('main .about'),lede=root.querySelector('main .tag');if(about&&lede){lede.hidden=about.textContent.replace(/\s+/g,' ').trim()===lede.textContent.replace(/\s+/g,' ').trim();}
  }
  function relatedCategories(root) {
    root.querySelectorAll('.sr-me-chips').forEach(function(nav){if(nav.hasAttribute('data-sr-days-out-order'))return;nav.dataset.srDaysOutOrder='1';var links=Array.from(nav.querySelectorAll('a'));var ranks=['/destination/','/attractions','/theme-parks','/zoos','/sea-life','/museums','/historical-sites','/outdoors','/beaches','/piers','/food-and-drink','/places-to-stay','/bowling','/cinemas','/tours','/arcade','/plan-a-trip'];links.sort(function(a,b){function rank(e){var href=e.getAttribute('href');var i=ranks.findIndex(function(prefix){return href===prefix||prefix==='/destination/'&&href.startsWith(prefix);});return i<0?99:i;}return rank(a)-rank(b);});nav.replaceChildren.apply(nav,links);});
    if(root.host&&root.host.id==='sr-food-page')root.querySelectorAll('.promo a').forEach(function(a){if(/Latest food.*offers/.test(a.textContent)&&a.getAttribute('href')!=='/offers')a.setAttribute('href','/offers');});
  }
  function categoryLibrary(root) {
    var footer=root.querySelector('footer');if(!footer||root.querySelector('.sr-category-library'))return;
    var section=document.createElement('section');section.className='sr-category-library';var h=document.createElement('h2');h.textContent='More ways to spend your day';var nav=document.createElement('nav');nav.setAttribute('aria-label','All categories');browse.forEach(function(item){nav.append(link(item[0],item[1]));});section.append(h,nav);footer.before(section);
  }
  function includePublicReviews() {
    var original=window.SR_RENDER_SOURCE_RECORDS;
    if(typeof original!=='function'||original.srReaderReviews)return;
    var wrapped=async function(root,result,options){
      var view=result;
      if(result&&Array.isArray(result.sourceRecords)){
        view=Object.assign({},result,{sourceRecords:result.sourceRecords.map(function(source){
          if(!source||!source.row||typeof source.row.review!=='string'||!source.row.review.trim())return source;
          var row=Object.assign({},source.row);
          if(!row.fullDescription)row.fullDescription=row.review;
          else if(row.fullDescription!==row.review&&!row.detailedReview)row.detailedReview=row.review;
          return Object.assign({},source,{row:row});
        })});
      }
      return original.call(this,root,view,options);
    };
    wrapped.srReaderReviews=true;window.SR_RENDER_SOURCE_RECORDS=wrapped;
  }
  var seen=new WeakSet(),scheduled=false,scans=0;
  function scan(){scheduled=false;includePublicReviews();var roots=[document];for(var i=0;i<roots.length;i++){var r=roots[i];r.querySelectorAll('*').forEach(function(e){if(e.shadowRoot)roots.push(e.shadowRoot);});style(r);navigation(r);discovery(r);destination(r);detail(r);readableSources(r);foodClaims(r);categoryLibrary(r);relatedCategories(r);if(!seen.has(r)){seen.add(r);new MutationObserver(schedule).observe(r,{childList:true,subtree:true});}}}
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(scan,120);}
  if(document.body)scan();else document.addEventListener('DOMContentLoaded',scan,{once:true});
  var timer=setInterval(function(){scan();if(++scans>=80)clearInterval(timer);},500);
  addEventListener('pageshow',scan);addEventListener('popstate',schedule);
})();
