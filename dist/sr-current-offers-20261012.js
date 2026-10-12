/* Current commissioned offers: keep food, stays, attractions and festive trips connected. */
(function () {
  'use strict';
  if (window.SR_CURRENT_OFFERS) return;
  window.SR_CURRENT_OFFERS = true;
  var catalog, installing = 0, mounted = false;
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var scalar = function (value) { return value && typeof value === 'object' ? value.$date : value; };
  var approvedCopy = {'06b5c357-1c66-48ee-904c-4e1bed97a698':'The Great Yorkshire Christmas Fair runs from 26 to 29 November 2026 in Hall 1 at the Great Yorkshire Showground, Harrogate. The organiser lists around 180 gift, food and fashion stalls, with the café and restaurant in Hall 2. Wheelchairs and mobility scooters are welcome; pushchairs and buggies are not permitted inside, so check the organiser’s access information before travelling. The supplier offers an entry-for-two option. Choose the current day and ticket option with Things To Do and read its redemption conditions before booking. Check opening hours with the organiser, especially for the final Sunday, when the fair closes earlier.'};
  function readableDate(value){var date=new Date(scalar(value));return Number.isFinite(date.getTime())?date.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'}):String(scalar(value));}
  function balanced(rows){var groups={festive:[],food:[],stays:[],attractions:[]},result=[],order=['festive','food','stays','attractions'];rows.forEach(function(row){groups[kind(row)].push(row);});while(order.some(function(key){return groups[key].length;}))order.forEach(function(key){if(groups[key].length)result.push(groups[key].shift());});return result;}
  function end(row) { var raw = scalar(row.validUntil || row.offerValidUntil); if (!raw) return null; var date = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw+'T23:59:59Z' : raw); return Number.isFinite(date) ? date : -1; }
  function live(row) { var until=end(row); return row.active !== false && row.revenueReady !== false && row.cardReady !== false && row.directoryReady !== false && (until === null || until >= Date.now()) && !/^(duplicate|merged|archived|closed|quarantin|suppress)/i.test([row.status,row.currentVenueStatus].filter(Boolean).join(' ')); }
  function kind(row) {
    var category=[row.category,row.offerType].join(' '), offer=row.offerTitle || row.offerText || '', text=[category,row.title,offer].join(' ');
    if (/christmas|festive|panto|winter market/i.test(text)) return 'festive';
    if (row._collection==='HotelOffers' || /\bstay\b|accommodation|holiday|short break/i.test(category) || /overnight|\broom\b.*\bstay\b|\bstay\b.*\bfor\b/i.test(offer)) return 'stays';
    if (/food|drink|dining|restaurant|brunch/i.test(category)) return 'food';
    if (/activity|spa|beauty|attraction|experience|theatre|show/i.test(category)) return 'attractions';
    return /afternoon tea|dining|brunch|meal/i.test(offer) ? 'food' : /hotel|motel|stay|accommodation|holiday/i.test(text) ? 'stays' : 'attractions';
  }
  var markets = {
    york: {
      title: 'York Christmas Market 2026', dates: '12 November–21 December 2026', until: '2026-12-21T23:59:59Z',
      copy: 'Start with the chalets on Parliament Street and St Sampson’s Square, then leave time for a sit-down meal or another stop in the city. The market opens Wednesday to Monday, 10.30am–7pm, and is closed every Tuesday. The last day finishes at 5pm. Match your hotel dates to an open market day before booking.',
      source: 'https://visityork.org/christmas/york-christmas-market', credit: 'Visit York',
      related: '<p>Another festive trip: <a href="/offers?offer=06b5c357-1c66-48ee-904c-4e1bed97a698">Great Yorkshire Christmas Fair in Harrogate, 26–29 November →</a></p>'
    },
    manchester: {
      title: 'Manchester Christmas Markets 2026', dates: '6 November–22 December 2026', until: '2027-01-03T23:59:59Z',
      copy: 'Plan a route between a few of the ten city-centre market sites rather than trying to fit everything into one hurried stop. Lincoln Square joins this year with a food and drink focus. Albert Square and Cathedral Gardens continue until 3 January 2027; the main market run ends on 22 December. Check the council’s opening times for the particular sites and dates you choose.',
      source: 'https://www.manchester.gov.uk/christmas-in-manchester-2026/christmas-markets', credit: 'Manchester City Council'
    },
    birmingham: {
      title: 'Birmingham Frankfurt Christmas Market 2026', dates: '5 November–24 December 2026', until: '2026-12-24T23:59:59Z',
      copy: 'The market stretches between Victoria Square and New Street, making a city-centre stay a useful base for an evening among the stalls. Opening hours vary: weekdays begin at 11am, weekends at 10am, with a later 1pm opening on Remembrance Sunday, 8 November. Leave room in the day for a meal or an attraction, and check the day’s closing time before travelling.',
      source: 'https://visitbirmingham.com/christmas/birminghams-frankfurt-christmas-market/', credit: 'Visit Birmingham'
    },
    edinburgh: {
      title: 'Edinburgh’s Christmas 2026', dates: '14 November 2026–3 January 2027', until: '2027-01-03T23:59:59Z',
      copy: 'Browse the Christmas market at East Princes Street Gardens, then build a day around the family funfair in West Princes Street Gardens or the ice rink on George Street. Entry to the market is free; rides and other activities have their own booking conditions. Choose the activities first, then compare a place to stay and a meal stop for the same dates.',
      source: 'https://edinburgh.org/festivals/edinburghs-christmas/', credit: 'Forever Edinburgh'
    }
  };
  function marketPlan(town, rows) {
    var market=markets[normal(town)];
    if (!market || Date.parse(market.until)<Date.now()) return '';
    var buttons=[['food','Food offers for your visit'],['stays','Stay for the Christmas markets'],['attractions','Add an attraction']].filter(function(item){return rows.some(function(row){return kind(row)===item[0];});}).map(function(item){return '<button type="button" data-offer-category="'+item[0]+'">'+item[1]+' →</button>';}).join('');
    var related=market.related && Date.now()<=Date.parse('2026-11-29T16:00:00Z') ? market.related : '';
    return '<article class="sr-festive-plan"><span class="sr-current-label">Plan a festive break</span><h3>'+esc(market.title)+'</h3><p><strong>'+esc(market.dates)+'</strong></p><p>'+esc(market.copy)+'</p><div class="sr-current-filters">'+buttons+'</div>'+related+'<p class="source">Market details: <a href="'+esc(market.source)+'" target="_blank" rel="noopener">'+esc(market.credit)+' →</a> · Checked 12 October 2026</p></article>';
  }
  function normal(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  function picture(row) { var value=row.dealImage || row.image || row.heroImage; value=value && typeof value==='object' ? value.url || value.src : value; if(!value)return ''; if(value.indexOf('wix:image://v1/')===0)value='https://static.wixstatic.com/media/'+value.slice(15).split('/')[0]; try { var u=new URL(value); if(!/^https?:$/.test(u.protocol))return ''; if(u.hostname==='static.wixstatic.com')return value.split('/v1/')[0]+'/v1/fit/w_640,h_440,q_82,enc_auto/offer.webp'; return u.href; } catch (_) { return ''; } }
  function offerHref(row) { var hotel=window.SR_CANONICAL.hotelHref(row); return hotel || '/offers?offer='+encodeURIComponent(row._id); }
  function card(row) { var title=row.displayTitle || row.title || row.name, type=kind(row), labels={food:'Food & drink',stays:'Places to stay',attractions:'Things to do',festive:'Festive days out'}, image=picture(row),href=offerHref(row); return '<a class="sr-current-card" href="'+esc(href)+'">'+(image?'<img src="'+esc(image)+'" alt="'+esc(row.imageAlt || row.imageAltText || title)+'" loading="lazy" width="480" height="300">':'')+'<div><span class="sr-current-label">'+labels[type]+'</span><h3>'+esc(title)+'</h3><p>'+esc(row.offerTitle || row.offerText || row.shortDescription || row.summary || 'Choose dates and check current availability.')+'</p><strong>View '+(href.indexOf('/hotel/')===0?'hotel guide':'offer details')+' →</strong><small>Ad · Affiliate booking option</small></div></a>'; }
  var CSS = '.sr-current-offers{margin:24px 0;padding:26px;border-radius:22px;background:#0b2545;color:white;font:16px/1.6 Inter,Arial}.sr-current-offers h2{font:900 32px/1.15 "Roboto Condensed",Arial;margin:0 0 10px;color:white}.sr-current-offers>p{max-width:860px;margin:0 0 18px;color:#d4e8ff}.sr-current-filters{display:flex;flex-wrap:wrap;gap:9px;margin:18px 0}.sr-current-filters button{cursor:pointer;border:1px solid #c5ddfa;border-radius:9px;background:white;color:#0b2545;padding:10px 15px;font:800 15px Arial;min-height:44px}.sr-current-filters button[aria-pressed="true"]{background:#ffdf45}.sr-current-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.sr-current-card{display:flex;flex-direction:column;border-radius:14px;overflow:hidden;background:#fff;color:#0b2545;text-decoration:none!important;box-shadow:0 6px 16px #0002}.sr-current-card img{width:100%;height:175px;object-fit:cover}.sr-current-card>div{padding:18px;display:flex;flex-direction:column;flex:1;gap:10px}.sr-current-label{font:800 11px/1.3 Arial;letter-spacing:.06em;color:#0860ad;text-transform:uppercase}.sr-current-card h3{font:900 23px/1.2 "Roboto Condensed",Arial;margin:0}.sr-current-card p{font:400 14px/1.65 Inter,Arial;margin:0;flex:1}.sr-current-card strong{font-size:14px;color:#095d9f}.sr-current-card small{font:400 11px Arial;color:#536981}.sr-current-card:hover{box-shadow:0 10px 24px #0005}.sr-current-card:focus-visible{outline:3px solid #ffe05b;outline-offset:3px}.sr-current-detail{margin:28px auto;padding:30px;border-radius:22px;background:#fff1c8;color:#0b2545;max-width:1000px;font:16px/1.75 Inter,Arial}.sr-current-detail h2{font:900 32px "Roboto Condensed",Arial;margin:0 0 15px}.sr-current-detail .booking{display:inline-block;background:#0b2545;color:white;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:800}.sr-current-detail img{float:right;width:min(40%,350px);max-height:240px;object-fit:cover;border-radius:15px;margin:0 0 20px 24px}.sr-current-detail:after{content:"";display:block;clear:both}.sr-current-pagination{display:flex;justify-content:center;gap:12px;align-items:center;margin-top:20px}.sr-current-pagination button{min-height:44px;padding:10px 16px;cursor:pointer;border:0;border-radius:9px}.sr-current-pagination button:disabled{opacity:.4;cursor:default}@media(max-width:900px){.sr-current-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.sr-current-offers{padding:20px 16px}.sr-current-grid{grid-template-columns:1fr}.sr-current-detail{margin:18px 16px;padding:22px}.sr-current-detail img{float:none;width:100%;margin:0 0 20px}.sr-current-offers h2{font-size:28px}}';
  function style(root) { if(root.querySelector('[data-sr-current-offer-style]'))return;var el=document.createElement('style');el.dataset.srCurrentOfferStyle='1';el.textContent=CSS;root.append(el); }
  CSS += '.sr-festive-plan{margin:22px 0;padding:22px;border-radius:15px;background:#fff1c8;color:#0b2545}.sr-festive-plan h3{font:900 26px/1.2 "Roboto Condensed",Arial;margin:10px 0}.sr-festive-plan p{margin:10px 0;max-width:900px}.sr-festive-plan a{color:#095d9f;font-weight:700}.sr-festive-plan .source{font-size:12px}.sr-festive-plan .sr-current-filters{margin-bottom:10px}';
  function list(root, rows, town, target) {
    if(root.querySelector('[data-sr-current-town-offers]'))return;
    var old=root.querySelector('#sr-town-deals');if(old)old.remove();
    var section=document.createElement('section');section.id='sr-town-deals';section.dataset.srCurrentTownOffers='1';section.className='sr-current-offers';
    section.innerHTML='<h2>Food, stays & things to do'+(town?' in '+esc(town):'')+'</h2><p>Explore current partner offers and booking options. Check the date, what is included and the provider’s terms before booking. Spin Raiders may earn a commission.</p>'+marketPlan(town,rows)+'<nav class="sr-current-filters sr-current-category-filters" aria-label="Offer categories"></nav><div class="sr-current-grid"></div><nav class="sr-current-pagination" aria-label="Offer pages"></nav>';
    var chosen='all', page=1;
    var labels=[['all','All offers'],['food','Food & drink'],['stays','Places to stay'],['attractions','Things to do'],['festive','Festive offers']];
    var initial=new URLSearchParams(location.search).get('category');if(labels.some(function(i){return i[0]===initial;}))chosen=initial;
    function paint(){var filtered=rows.filter(function(r){return live(r)&&(chosen==='all'||kind(r)===chosen);});if(chosen==='all')filtered=balanced(filtered);var pages=Math.max(1,Math.ceil(filtered.length/9));page=Math.min(page,pages);section.querySelector('.sr-current-category-filters').innerHTML=labels.filter(function(i){return i[0]==='all'||rows.some(function(r){return kind(r)===i[0];});}).map(function(i){return '<button type="button" data-offer-category="'+i[0]+'" aria-pressed="'+(chosen===i[0])+'">'+i[1]+'</button>';}).join('');section.querySelector('.sr-current-grid').innerHTML=filtered.slice((page-1)*9,page*9).map(card).join('')||'<p>No current offers in this category.</p>';section.querySelector('.sr-current-pagination').innerHTML=pages>1?'<button data-offer-page="'+(page-1)+'" '+(page===1?'disabled':'')+'>← Previous</button><span>'+page+' of '+pages+'</span><button data-offer-page="'+(page+1)+'" '+(page===pages?'disabled':'')+'>Next →</button>':'';}
    section.addEventListener('click',function(event){var button=event.target.closest('button');if(!button)return;if(button.dataset.offerCategory){chosen=button.dataset.offerCategory;page=1;paint();}else if(button.dataset.offerPage){page=+button.dataset.offerPage;paint();section.scrollIntoView({block:'start'});}});
    style(root);target.after(section);paint();
  }
  function detail(root, rows) { var id=new URLSearchParams(location.search).get('offer');if(!id||root.querySelector('[data-sr-current-offer-detail]'))return;var row=rows.find(function(r){return r._id===id&&live(r);});if(!row)return;var main=root.querySelector('main'),hero=main&&main.querySelector('.hero');if(!hero)return;var section=document.createElement('article');section.className='sr-current-detail';section.dataset.srCurrentOfferDetail='1';var title=row.displayTitle || row.title || row.name,image=picture(row),url=window.SR_CANONICAL.outbound(row);section.innerHTML=(image?'<img src="'+esc(image)+'" alt="'+esc(row.imageAlt || title)+'">':'')+'<h2>'+esc(title)+'</h2><p>'+esc(row.offerTitle || row.offerText || '')+'</p><p>'+esc(row.fullSummary || approvedCopy[id] || row.summary || row.shortDescription || '')+'</p>'+(row.offerValidUntil||row.validUntil?'<p><strong>Offer end date:</strong> '+esc(readableDate(row.offerValidUntil||row.validUntil))+'</p>':'')+'<p>Choose dates and check the full inclusions, availability and booking conditions with the provider.</p><a class="booking" href="'+esc(url)+'" target="_blank" rel="sponsored noopener">View booking options →</a><p><small>Ad · Spin Raiders may earn a commission from qualifying bookings.</small></p>';style(root);hero.after(section); }
  function mount(rows) {
    if(mounted)return;var path=location.pathname.replace(/\/$/,'');
    if(/^\/destination\/[^/]+$/.test(path)){
      var root=document.getElementById('sr-location-directory')?.shadowRoot,slug=path.split('/').pop();if(!root)return;
      var heading=root.querySelector('.results-heading');if(!heading)return;
      var local=rows.filter(function(row){return [row.locationSlug,row.destinationSlug,row.locationName,row.destination].some(function(value){return normal(value)===slug;});});
      if(local.length){var start=root.querySelector('main>.categories') || root.querySelector('main>.search-hero') || heading;list(root,local,local[0].locationName || local[0].destination || slug.replace(/-/g,' '),start);mounted=true;}
    }else if(path==='/offers'){
      var root=document.getElementById('sr-extended-pages')?.shadowRoot;if(!root)return;var hero=root.querySelector('main>.hero');if(!hero)return;
      list(root,rows,'',hero);mounted=true;detail(root,rows);
      root.querySelectorAll('.layout,.affiliate-section').forEach(function(element){element.hidden=true;element.style.setProperty('display','none','important');});
      var topics=root.querySelector('nav.topics');if(topics){topics.replaceChildren();[['all','All offers'],['food','Food & drink'],['stays','Places to stay'],['attractions','Things to do'],['festive','Festive offers']].forEach(function(item){var a=document.createElement('a');a.href='/offers'+(item[0]==='all'?'':'?category='+item[0]);a.textContent=item[1];a.style.cssText='padding:16px;color:#0b2545;text-decoration:none;font-weight:800';topics.append(a);});}
    }
  }
  function install() {
    var C=window.SR_CANONICAL,D=window.SR_PUBLIC_DIRECTORY?.D;
    if(!C||!D){if(++installing<200)setTimeout(install,150);return;}
    var UI=window.SR_ROUTE_UI,Routes=window.SR_ROUTES;
    if(UI&&Routes&&!UI.srKnownPartnerBusinesses){
      UI.srKnownPartnerBusinesses=true;
      var businessRows=UI.businessRows.bind(UI);
      UI.businessRows=function(rows,collection,options){
        if(collection!=='AffiliateOffers')return businessRows(rows,collection,options);
        var known=rows.filter(function(row){return ['business','offer'].includes(Routes.outcome(row).recordRole);});
        if(known.length!==rows.length)console.warn('Unclassified partner records excluded from business results:',rows.length-known.length);
        return businessRows(known,collection,options);
      };
    }
    if(!D.srOfferReadCache){D.srOfferReadCache=true;var read=D.rows.bind(D),requests=new Map();D.rows=function(collection,filters){if(!/^(HotelGuides|HotelOffers|AffiliateOffers)$/.test(collection))return read(collection,filters);var key=collection+'|'+JSON.stringify(filters||{});if(!requests.has(key)){var promise=read(collection,filters).catch(function(error){requests.delete(key);throw error;});requests.set(key,promise);}return requests.get(key);};}
    if(!C.srAllOfferKinds){
      C.srAllOfferKinds=true;var previous=C.offerLive.bind(C);
      C.offerLive=function(row,now){return live(row)&&previous(row,now);};
      C.offerOutcomes=async function(reader){var names=['HotelGuides','HotelOffers','AffiliateOffers'],outcomes=await Promise.allSettled(names.map(function(name){return reader.rows(name);})),guides=outcomes[0].status==='fulfilled'?outcomes[0].value:[];return outcomes.map(function(outcome,index){if(outcome.status!=='fulfilled')return outcome;if(index===0)return {status:'fulfilled',value:[]};return {status:'fulfilled',value:outcome.value.map(function(row){return C.normalizeOffer(row,guides);}).filter(function(row){return C.offerLive(row)&&C.outbound(row)&&(row.affiliate===true||row.sponsored===true||/awin1\.com|tidd\.ly/.test(C.outbound(row)));})};});};
    }
    var path=location.pathname.replace(/\/$/,'');if(!/^\/destination\/[^/]+$/.test(path)&&path!=='/offers')return;
    if(!catalog)catalog=C.offerOutcomes(D).then(function(outcomes){var seen=new Set();return outcomes.flatMap(function(o){return o.status==='fulfilled'?o.value:[];}).filter(function(row){var key=row._collection+':'+row._id+'|'+C.outbound(row);if(seen.has(key))return false;seen.add(key);return true;});});
    catalog.then(function(rows){mount(rows);if(!mounted&&installing++<100)setTimeout(install,200);}).catch(function(error){console.warn('Current offers unavailable',error);});
  }
  install();
})();
