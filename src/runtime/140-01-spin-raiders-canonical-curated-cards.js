(function(){'use strict';
 const pending=new WeakMap();
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.SR_STATIC_CARDS={
  hydrate(rows){
   if(pending.has(rows))return pending.get(rows);
   rows.forEach(row=>row._routesLoading=true);
   const entries=rows.filter(row=>row._id&&row._collection);
   const promise=window.SR_ROUTES.annotate(entries).finally(()=>{rows.forEach(row=>row._routesLoading=false);pending.delete(rows)}).then(()=>rows);
   pending.set(rows,promise);return promise;
  },
  card(row,badge,index){
   const route=row._id?window.SR_ROUTES.outcome(row):window.SR_ROUTES.navigation(row.href),tag=route.ok?'a':'article';
   if(route.discoveryAllowed===false)return '';
   const attributes=route.ok?' href="'+esc(route.href)+'"'+(row.ad?' rel="sponsored noopener"':''):' data-route-unavailable="true"'+(row._routesLoading?' aria-busy="true"':'');
   return `<${tag} class="card"${attributes}><img src="${esc(row.image)}" alt="${esc(row.alt||row.title)}" loading="lazy"><span class="badge b${index}">${esc(badge)}</span><div class="card-copy"><h3>${esc(row.title)}</h3><p>${esc(row.town||row.description)}</p>${row._id?window.SR_ROUTE_UI.notice(row):''}${route.ok?'':`<p role="status">${row._routesLoading?'Loading guide…':'Guide temporarily unavailable'}</p>`}</div><span class="arrow" aria-hidden="true">${route.ok?'→':''}</span></${tag}>`;
  }
 };
})();

