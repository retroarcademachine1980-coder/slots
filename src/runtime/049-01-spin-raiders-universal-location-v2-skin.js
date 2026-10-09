(function(){'use strict';
 window.SR_DETAIL_PAGES.register({collection:'Locations',kinds:['destination'],async render(result,ctx){
  if(!await ctx.waitFor(()=>document.body&&window.SR_PUBLIC_DIRECTORY?.S?.archiveQuery&&window.SR_SEARCH_DATA&&window.SR_SEARCH_VIEW&&window.SR_SEARCH_VIEW_CSS))return;
  const S=window.SR_PUBLIC_DIRECTORY.S,api=window.SR_SEARCH_DATA,q=String(result.row.title||'').trim();
  if(!q)throw Error('Destination title unavailable');
  window.SR_LOCATION_DESIGN_ACTIVE=true;
  const host=ctx.own(document.createElement('div'));host.id='sr-location-directory';
  const old=document.getElementById('sr-seaside-root'),native=document.getElementById('SITE_CONTAINER');
  (old||native)?.before(host);if(!host.isConnected)document.body.append(host);
  const root=host.attachShadow({mode:'open'});
  const view=window.SR_SEARCH_VIEW(root,{S,q,locationMode:true,href:api.href});
  const guide=window.SR_TOWN_GUIDE?.(result.row);if(guide){const prose=guide.querySelector('.body');if(prose&&window.SR_ROUTE_HTML)prose.innerHTML=await window.SR_ROUTE_HTML.prepare(prose.innerHTML);if(!ctx.current())return;root.querySelector('.results-heading')?.before(guide);}
  ctx.setTitle(q+' — places to visit, eat and stay | Spin Raiders');
  ctx.className('sr-location-ready');
  const style=ctx.own(document.createElement('style'));style.id='sr-location-design-isolation';style.textContent='html.sr-location-ready,html.sr-location-ready body{background:white!important}html.sr-location-ready #sr-seaside-root,html.sr-location-ready #sr-seaside-related,html.sr-location-ready #SITE_CONTAINER,html.sr-location-ready #raidertube-global-button,html.sr-location-ready #sr-report-action{display:none!important}#sr-location-directory{display:block!important;width:100%;position:relative}';document.head.append(style);
  ctx.commit({loading:true});
  const words=api.norm(q).split(/\s+/).filter(Boolean);
  const outcomes=await Promise.allSettled(['Venues','NearbyAttractions','HotelGuides','FoodAndDrink','AffiliateOffers'].map(c=>api.rows(c,api.filterWords(words,['locationName','destination','title','name','displayTitle','unifiedSearchText']))));
  if(!ctx.current())return;
  const seen=new Set,records=outcomes.flatMap(r=>r.status==='fulfilled'?r.value:[]).filter(r=>{const key=window.SR_ROUTE_UI.key(r);if(seen.has(key))return false;seen.add(key);return true});
  if(outcomes.every(r=>r.status==='rejected')){view.error();throw Error('Destination records unavailable');}
  if(records.filter(r=>window.SR_ROUTE_UI.ready(r)).length<6){for(let i=0;i<(document.querySelector('script[src*="sr-smart-search"]')?30:0)&&!window.SR_SMART_SEARCH;i++)await new Promise(r=>setTimeout(r,100));if(window.SR_SMART_SEARCH){try{const sm=await window.SR_SMART_SEARCH('things to do and places to eat in '+q,{root});if(sm&&sm.rows&&sm.rows.length){const have=new Set(records.map(r=>window.SR_ROUTE_UI.key(r)));records.push(...sm.rows.filter(r=>!have.has(window.SR_ROUTE_UI.key(r))));}}catch(e){}}if(!ctx.current())return;}view.setRecords(records,outcomes.filter(r=>r.status==='rejected').length);ctx.commit();
 }});
})();

