(function(){'use strict';
 const fontId="sr-site-fonts";let fontLink=document.getElementById(fontId);if(!fontLink){fontLink=document.createElement("link");fontLink.id=fontId;fontLink.rel="stylesheet";fontLink.href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,800&family=Bree+Serif&family=Caveat:wght@600;700&family=Inter:wght@500;600;700;800;900&family=Permanent+Marker&family=Roboto+Condensed:wght@400;500;600;700;800;900&display=swap";document.head.append(fontLink);}window.SR_FONT_LINK=fontLink;
 const readiness=new Map();let lastNavigation=(location.pathname.replace(/\/$/,'')||'/')+location.search;
 function navigation(){const path=location.pathname.replace(/\/$/,'')||'/',navigationKey=path+location.search;if(navigationKey===lastNavigation)return;lastNavigation=navigationKey;readiness.clear();dispatchEvent(new CustomEvent('sr:navigation',{detail:{path,navigationKey}}));}
 function settle(owner,navigationKey,state){if(typeof navigationKey!=='string'||!navigationKey)return false;let u;try{u=new URL(navigationKey,location.origin)}catch{return false;}const normalized=u.pathname.replace(/\/$/,'')||'/',key=normalized+u.search,current=(location.pathname.replace(/\/$/,'')||'/')+location.search;if(u.origin!==location.origin||key!==current||u.hash)return false;navigation();if(readiness.get(key)===state)return true;readiness.set(key,state);const status=document.getElementById('sr-runtime-status');if(status?.dataset.srOwner==='release-loader'&&status.dataset.path===key)status.remove();dispatchEvent(new CustomEvent(state==='ready'?'sr:page-ready':'sr:page-failed',{detail:{owner,path:normalized,navigationKey:key}}));return true;}
 window.SR_RUNTIME=Object.freeze({navigation,ready:(owner,navigationKey)=>settle(owner,navigationKey,'ready'),failed:(owner,navigationKey)=>settle(owner,navigationKey,'failed')});

 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.SR_ROUTE_UI={
  unavailable(row,{className='card',image='',title,town}={}){
   const name=title||row.displayTitle||row.title||row.name||'This place';
   return `<article class="${escape(className)}" data-route-unavailable="true"><div class="photo card-image">${image?`<img src="${escape(image)}" alt="${escape(row.imageAltText||row.imageAlt||name)}" loading="lazy">`:''}</div><div class="copy card-copy"><h3>${escape(name)}</h3><p>${escape(town||row.locationName||row.destination||'')}</p><p role="status">This guide is temporarily unavailable. Please try again later.</p></div></article>`;
  },
  key(row){const route=window.SR_ROUTES.outcome(row);return route.ok?(route.targetKey||route.key):(row._collection+':'+row._id);},
  notice(row){const notice=window.SR_ROUTES.outcome(row).contentNotice;return typeof notice==='string'&&notice.trim()?'<p class="sr-record-notice" role="status">'+escape(notice)+'</p>':'';},
  discoverable(row){return window.SR_ROUTES.outcome(row).discoveryAllowed!==false;},
  businessRows(rows,collection,{discovery=true}={}){
   if(discovery)rows=rows.filter(row=>window.SR_ROUTES.outcome(row).discoveryAllowed!==false);
   if(collection!=='AffiliateOffers')return rows;
   if(rows.some(row=>!['business','offer'].includes(window.SR_ROUTES.outcome(row).recordRole)))throw Error('Business source classification unavailable');
   return rows.filter(row=>window.SR_ROUTES.outcome(row).recordRole==='business');
  },
  ready(row){return window.SR_ROUTES.outcome(row).ok;},
  async hydrateResult(response,collection){
   const records=(response.dataItems||[]).map(item=>({...item.data,_id:item.id||item.data?._id,_collection:collection}));
   const resolved=await window.SR_ROUTES.annotate(records,collection);
   return {...response,dataItems:(response.dataItems||[]).map((item,index)=>({...item,data:resolved[index]}))};
  }
 };
 const requests=new Map();
 window.SR_CURRENT_ROUTE=path=>{
  path=path||location.pathname.replace(/\/$/,'');
  if(!requests.has(path)){const request=window.SR_ROUTES.current(path).catch(()=>({status:503,issue:'route_service_unavailable'})).finally(()=>{if(requests.get(path)===request)requests.delete(path)});requests.set(path,request);}
  return requests.get(path);
 };

 window.SR_CATEGORY_FROM_PATH=function(){const current=new URL(location.href),available=Object.assign({},window.SR_CATEGORY_PAGES,window.SR_EXTENDED_CONFIG);return Object.entries(window.SR_ROUTES.categoryPaths).map(([key,value])=>{const target=new URL(value,location.origin),required=[...target.searchParams];return available[key]&&target.pathname===current.pathname&&required.every(([k,v])=>current.searchParams.get(k)===v)?{key,score:required.length}:null}).filter(Boolean).sort((a,b)=>b.score-a.score)[0]?.key||null;};
})();

