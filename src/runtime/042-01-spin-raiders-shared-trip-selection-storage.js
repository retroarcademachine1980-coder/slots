(function(){'use strict';
 const store='sr-trip-v1';
 function read(){try{const saved=JSON.parse(localStorage.getItem(store)||'null');return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{stops:[],hotels:[]};}catch{return {stops:[],hotels:[]};}}
 function normalize(row){const route=window.SR_ROUTES.outcome(row),lat=Number(row.latitude),lon=Number(row.longitude),coordinates=Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180&&lat!==0?{lat,lon}:{};return{id:route.key||row._id||row.id,name:row.displayTitle||row.name||row.title||'',town:row.locationName||row.destination||'',...coordinates,url:route.ok?route.href:null,affiliate:false};}
 function add(row,hotel=false){if(!row?.id||!row.name||!row.url)return false;const saved=read(),field=hotel?'hotels':'stops',rows=Array.isArray(saved[field])?saved[field]:[];if(rows.some(existing=>existing.id===row.id)||rows.length>=(hotel?8:12))return false;saved[field]=[...rows,row];try{localStorage.setItem(store,JSON.stringify(saved));dispatchEvent(new Event('sr-trip-updated'));return true;}catch{return false;}}
 window.SR_TRIP=Object.freeze({url:window.SR_ROUTES.viewPaths.trip,normalize,add});
})();

