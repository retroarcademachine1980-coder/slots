(function(){'use strict';
 window.SR_DETAIL_PAGES.register({collection:'ClassicFruitMachines',kinds:['machine'],async render(result,ctx){
  window.SR_ARCHIVE_DESIGN_ACTIVE=true;
  if(!await ctx.waitFor(()=>document.body&&window.SR_SEASIDE?.archiveQuery&&window.SR_SEASIDE?.archiveQuality&&window.SR_ARCHIVE_DETAIL))return;
  const host=document.createElement('div');host.id='sr-approved-archive';document.body.append(host);ctx.own(host);
  const root=host.attachShadow({mode:'open'}),S=window.SR_SEASIDE,C=S.archiveQuality;
  const style=document.createElement('style');style.textContent='body:has(#sr-approved-archive){background:white!important}body:has(#sr-approved-archive) #sr-seaside-root,body:has(#sr-approved-archive) #sr-seaside-related,body:has(#sr-approved-archive) #SITE_CONTAINER,body:has(#sr-approved-archive) #raidertube-global-button,body:has(#sr-approved-archive) #sr-report-action{display:none!important}';document.head.append(style);ctx.own(style);
  await window.SR_ARCHIVE_DETAIL(result.row,{S,C,root,e:S.e,photo:row=>C.photo(row),cardPhoto:row=>C.cardPhoto(row),current:ctx.current,setTitle:ctx.setTitle});
  if(!ctx.current())return;await window.SR_RENDER_SOURCE_RECORDS(root,result,{current:ctx.current,selector:".mw"});if(ctx.current())ctx.commit();
 }});
})();

