(function(){'use strict';
 const path=location.pathname.replace(/\/$/,'')||'/';
 const indexInput=window.SR_ROUTES.indexInput(path+location.search);
 if(!window.SR_ROUTES.isLegacyRecordInput(path+location.search)&&!(indexInput.ok&&indexInput.mode==='redirect'))return;
 window.SR_ALIAS_REQUESTED=true;
 const navigationKey=path+location.search;let stopped=false,status,statusStyle;
 const current=()=>!stopped&&(location.pathname.replace(/\/$/,'')||'/')+location.search===navigationKey;
 function release(){if(stopped)return;stopped=true;status?.remove();statusStyle?.remove();window.SR_ALIAS_REQUESTED=false;removeEventListener('popstate',navigation);removeEventListener('pageshow',navigation);removeEventListener('sr:navigation',navigation);}
 function navigation(){if(!current())release();}
 addEventListener('popstate',navigation);addEventListener('pageshow',navigation);addEventListener('sr:navigation',navigation);
 function message(text,unavailable=false){
  if(!current()){release();return;}
  if(!document.body){document.addEventListener('DOMContentLoaded',()=>message(text,unavailable),{once:true});return;}
  if(!status){status=document.createElement('section');status.id='sr-route-status';status.setAttribute('role','status');status.style.cssText='font:18px/1.5 Arial,sans-serif;color:#0b2545;background:white;padding:48px 24px;max-width:1180px;margin:auto';document.body.prepend(status);statusStyle=document.createElement('style');statusStyle.textContent='body:has(#sr-route-status)>#SITE_CONTAINER{display:none!important}';document.head.append(statusStyle);}
  status.replaceChildren();const heading=document.createElement('h1');heading.textContent='Spin Raiders';const copy=document.createElement('p');copy.textContent=text;status.append(heading,copy);if(unavailable){const search=document.createElement('a');search.href='/search';search.textContent='Search current guides';status.append(search);window.SR_RUNTIME?.failed('legacy-alias',navigationKey);}
 }
 message('Opening your guide…');
 window.SR_ROUTES.alias(navigationKey).then(result=>{
  if(!current()){release();return;}
  if(result.ok&&result.to!==navigationKey){location.replace(result.to);return;}
  message(result.code==='legacy_bookmark_unmapped'?'This old link could not be matched to a current guide.':'This guide is currently unavailable. Please use the site search or try again later.',true);
 }).catch(()=>message('This guide is temporarily unavailable. Please reload to try again.',true));
})();

