/* Reach the existing fuel finder from every public site's shared navigation. */
(function(){
 'use strict';
 if(window.SR_SITEWIDE_FUEL_20261028)return;window.SR_SITEWIDE_FUEL_20261028=true;
 var watched=new WeakSet(),jumped=new WeakSet(),queued=false;
 function destination(){return /^\/destination\/[^/]+\/?$/.test(location.pathname);}
 function target(){return destination()?location.pathname.replace(/\/$/,'')+'#fuel-prices':'/plan-a-trip#fuel-prices';}
 function roots(){var all=[document];for(var i=0;i<all.length;i++)all[i].querySelectorAll('*').forEach(function(e){if(e.shadowRoot)all.push(e.shadowRoot)});return all;}
 function panel(all){for(var i=0;i<all.length;i++){var e=all[i].querySelector('.sr-local-fuel');if(e&&e.getBoundingClientRect().width>0)return e;}return null;}
 function jump(e){e.scrollIntoView({block:'start',behavior:'auto'});var h=e.querySelector('h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
 function add(nav,kind){
  var a=nav.querySelector(':scope > a[data-sr-fuel-navigation]');
  if(!a){a=document.createElement('a');a.dataset.srFuelNavigation=kind;a.textContent='Fuel prices';a.className=kind==='desktop'?'sr-nav-parent sr-site-fuel-link':'sr-site-fuel-link';
   a.addEventListener('click',function(event){if(event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;var url=new URL(a.href,location.origin);if(url.pathname!==location.pathname.replace(/\/$/,'')&&!(url.pathname==='/plan-a-trip'&&location.pathname==='/plan-a-trip/'))return;var p=panel(roots());if(!p)return;event.preventDefault();history.replaceState(history.state,'',url.pathname+url.search+url.hash);var menu=a.closest('details.burger');if(menu)menu.open=false;jump(p);});
   if(kind==='mobile')nav.prepend(a);else nav.append(a);
  }
  var href=target();if(a.getAttribute('href')!==href)a.setAttribute('href',href);
 }
 function scan(){
  queued=false;var all=roots();
  all.forEach(function(root){
   if(!watched.has(root)){watched.add(root);new MutationObserver(schedule).observe(root,{childList:true,subtree:true});}
   root.querySelectorAll('.masthead nav.menu').forEach(function(nav){add(nav,'desktop')});
   root.querySelectorAll('.masthead .burger>nav').forEach(function(nav){add(nav,'mobile')});
   root.querySelectorAll('nav[aria-label="Footer"],nav[aria-label="All categories"]').forEach(function(nav){add(nav,'footer')});
   if(!root.querySelector('#sr-site-fuel-link-style')){var style=document.createElement('style');style.id='sr-site-fuel-link-style';style.textContent='.masthead .menu>.sr-site-fuel-link{white-space:nowrap;color:#fff;font-weight:800;text-decoration:none}.masthead .menu>.sr-site-fuel-link:hover,.masthead .menu>.sr-site-fuel-link:focus-visible{color:#ffe455}.masthead .burger>nav>.sr-site-fuel-link{color:#ffe455;font-weight:800;border-bottom:1px solid #ffffff30;padding-bottom:12px;margin-bottom:8px}';(root===document?document.head:root).append(style);}
  });
  if(!destination()&&!/^\/plan-a-trip\/?$/.test(location.pathname))return;
  var p=panel(all);if(!p)return;p.id='fuel-prices';p.style.scrollMarginTop='100px';
  if(location.hash==='#fuel-prices'&&!jumped.has(p)){jumped.add(p);requestAnimationFrame(function(){requestAnimationFrame(function(){jump(p)})});}
 }
 function schedule(){if(!queued){queued=true;setTimeout(scan,100)}}
 addEventListener('hashchange',function(){var p=panel(roots());if(p&&location.hash==='#fuel-prices')jump(p);schedule()});
 addEventListener('popstate',schedule);addEventListener('sr:navigation',schedule);addEventListener('pageshow',schedule);
 var tries=0,timer=setInterval(function(){scan();if(++tries>=90)clearInterval(timer)},500);scan();
})();
