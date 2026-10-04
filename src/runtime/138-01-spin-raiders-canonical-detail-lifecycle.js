/* Shared current-record detail lifecycle. URL identity belongs to SR_ROUTES only. */
(function(){'use strict';
 if(window.SR_DETAIL_PAGES)return;
 const owners=new Map();let active=null,generation=0,scheduled=false,observedNavigation=null;
 const navigationKey=()=>location.pathname+location.search;
 const path=()=>location.pathname.replace(/\/$/,'')||'/';
 const text=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const STATUS_CSS=':host{all:initial;display:block;font-family:Roboto,"Helvetica Neue",Arial,sans-serif;color:#0b2545}.wrap{max-width:1180px;margin:0 auto;padding:60px 20px}.panel{background:white;border-radius:18px;padding:26px;box-shadow:0 10px 26px #0b254514}h1{font-size:clamp(28px,4vw,42px);margin:0 0 16px}p{font-size:17px;line-height:1.6}a{display:inline-block;background:#ff2e88;color:white;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:11px}a:focus-visible{outline:3px solid #1d6fd8;outline-offset:3px}';
 function dispose(state){if(!state)return;state.controller.abort();state.pending?.remove();state.pendingStyle?.remove();for(const cleanup of state.cleanups.splice(0).reverse())try{cleanup();}catch{}state.hosts.clear();}
 function current(state){return active===state&&generation===state.version&&path()===state.path&&navigationKey()===state.navigationKey&&!state.controller.signal.aborted;}
 function status(state,failed=false){
  if(!current(state)||!document.body)return;
  state.committed=false;
  if(!state.pending){state.pending=document.createElement('section');state.pending.id='sr-detail-route-status';state.pending.attachShadow({mode:'open'});const header=document.getElementById('sr-brand-header');header?header.after(state.pending):document.body.prepend(state.pending);state.pendingStyle=document.createElement('style');state.pendingStyle.textContent='body:has(#sr-detail-route-status) #SITE_CONTAINER,body:has(#sr-detail-route-status) #sr-seaside-root,body:has(#sr-detail-route-status) #sr-seaside-related,body:has(#sr-detail-route-status) #sr-location-directory{display:none!important}';document.head.append(state.pendingStyle);}
  const label=state.kind==='hotel'?'hotel guide':state.kind==='food'?'food and drink guide':state.kind==='machine'?'machine guide':'place';
  state.pending.shadowRoot.innerHTML='<style>'+STATUS_CSS+'</style><div class="wrap"><div class="panel" role="'+(failed?'alert':'status')+'">'+(failed?'<h1>This '+label+' could not load</h1><p>Please reload or choose another '+(state.kind==='hotel'?'place to stay':'guide')+'.</p><a href="'+(state.kind==='hotel'?'/places-to-stay':'/search')+'">'+(state.kind==='hotel'?'Browse places to stay':'Browse places')+'</a>':'<p>Loading '+label+'…</p>')+'</div></div>';
  if(failed)window.SR_RUNTIME?.failed('detail',state.navigationKey);
 }
 function recordNotice(state){const notice=state.result?.route?.contentNotice;if(typeof notice!=='string'||!notice.trim())return;for(const host of state.hosts){const root=host.shadowRoot,heading=root?.querySelector('h1');if(!heading)continue;if(root.querySelector('[data-record-notice]'))return;const node=document.createElement('p');node.dataset.recordNotice='1';node.setAttribute('role','status');node.style.cssText='display:block;padding:14px 18px;border-left:4px solid #ffd23f;border-radius:8px;background:#fff2cd;color:#0b2545;font:700 16px/1.5 Arial,sans-serif';node.textContent=notice;heading.insertAdjacentElement('afterend',node);return;}}
 function context(state){return {
  current:()=>current(state),signal:state.controller.signal,
  own(node){state.hosts.add(node);state.cleanups.push(()=>node.remove());return node;},
  cleanup(fn){state.cleanups.push(fn);},
  className(name){const existed=document.documentElement.classList.contains(name);document.documentElement.classList.add(name);if(!existed)state.cleanups.push(()=>document.documentElement.classList.remove(name));},
  setTitle(title){if(!current(state))return;const previous=document.title;document.title=title;state.cleanups.push(()=>{if(document.title===title)document.title=previous;});},
  commit({loading=false}={}){if(!current(state))return;if(!loading)recordNotice(state);state.pending?.remove();state.pendingStyle?.remove();state.pending=state.pendingStyle=null;state.committed=true;if(!loading)window.SR_RUNTIME?.ready('detail',state.navigationKey);},
  async waitFor(predicate,timeout=15000){const start=Date.now();while(current(state)){if(predicate())return true;if(Date.now()-start>=timeout)throw Error('Detail dependencies unavailable');await new Promise(resolve=>{const timer=setTimeout(done,50);function done(){clearTimeout(timer);state.controller.signal.removeEventListener('abort',done);resolve();}state.controller.signal.addEventListener('abort',done,{once:true});});}return false;}
 };}
 async function dispatch(state){
  if(!current(state)||state.rendering||!state.result)return;
  const result=state.result,owner=owners.get(result.collection);
  if(result.status!==200||!result.row||!result.route?.ok||result.route.path!==state.path||result.route.kind!==state.kind||result.route.key!==result.collection+':'+result.row._id||result.row._collection!==result.collection||!owner||!owner.kinds.includes(state.kind)){status(state,true);return;}
  state.rendering=true;
  try{await owner.render(result,context(state));if(current(state)&&!state.committed)throw Error('Detail did not finish mounting');}
  catch(error){if(!current(state))return;for(const cleanup of state.cleanups.splice(0).reverse())try{cleanup();}catch{}state.hosts.clear();status(state,true);}
 }
 function sync(){
  scheduled=false;window.SR_RUNTIME?.navigation?.();const next=path(),nextNavigation=navigationKey();observedNavigation=nextNavigation;const parsed=window.SR_ROUTES?.parse(next);
  const supported=!window.SR_ALIAS_REQUESTED&&parsed?.ok&&[...owners.values()].some(owner=>owner.kinds.includes(parsed.kind));
  if(active?.navigationKey===nextNavigation&&supported){if([...active.hosts].some(node=>!node.isConnected)||(!active.committed&&active.pending&&!active.pending.isConnected)){dispose(active);active=null;}else return;}
  if(active){dispose(active);active=null;}
  if(!supported||!document.body)return;
  const state={path:next,navigationKey:nextNavigation,kind:parsed.kind,version:++generation,controller:new AbortController(),cleanups:[],hosts:new Set(),pending:null,pendingStyle:null,result:null,rendering:false,committed:false};active=state;status(state);
  Promise.resolve().then(()=>window.SR_CURRENT_ROUTE(next)).then(result=>{if(!current(state))return;state.result=result;return dispatch(state);}).catch(()=>{if(current(state))status(state,true);});
 }
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(sync);}}
 window.SR_DETAIL_PAGES=Object.freeze({register(owner){if(!owner?.collection||!Array.isArray(owner.kinds)||typeof owner.render!=='function')throw Error('Invalid detail renderer');if(owners.has(owner.collection))return;owners.set(owner.collection,owner);schedule();},sync:schedule});
 addEventListener('sr:runtime-failure',event=>{if(!active||!current(active)||event.detail?.navigationKey!==active.navigationKey)return;status(active,true);for(const cleanup of active.cleanups.splice(0).reverse())try{cleanup();}catch{}active.hosts.clear();active.controller.abort();});
 addEventListener('popstate',schedule);addEventListener('pageshow',schedule);document.addEventListener('DOMContentLoaded',schedule,{once:true});
 // Observe only route changes or removal of owned hosts. Ordinary DOM mutations do no work.
 new MutationObserver(()=>{if(navigationKey()!==observedNavigation||(active&&([...active.hosts].some(node=>!node.isConnected)||(!active.committed&&active.pending&&!active.pending.isConnected))))schedule();}).observe(document.documentElement,{childList:true,subtree:true});
})();

