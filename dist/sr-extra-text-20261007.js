/* Spin Raiders: extra guide text for pages whose description was short (2026-10-07).
   Text lives in dist/extra/<path>.json; shown under the existing description. Read-only. */
(function(){try{
if(window.__srExtraText)return;window.__srExtraText=true;
var me=document.currentScript&&document.currentScript.src;var BASE=me?me.replace(/sr-extra-text-[^\/]*$/,'extra/'):null;if(!BASE)return;
var cache={};function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function load(k){if(!(k in cache))cache[k]=fetch(BASE+encodeURIComponent(k)+'.json').then(function(r){return r.ok?r.json():null}).catch(function(){return null});return cache[k]}
function html(d,tag){return '<'+tag+' class="sr-extra-text"><h2>'+esc(d.h)+'</h2>'+d.p.map(function(x){return '<p>'+esc(x)+'</p>'}).join('')+'</'+tag+'>'}
function tick(){var path=location.pathname.replace(/\/+$/,'');if(path.split('/').length<4)return;var key=path.replace(/^\//,'').replace(/\//g,'__');
 var place=document.getElementById('sr-place-page'),shell=document.getElementById('sr-shell-page');
 var root=(place&&place.shadowRoot)||(shell&&shell.shadowRoot);if(!root||root.querySelector('.sr-extra-text'))return;
 var art=place&&root.querySelector('.body article');var about=shell&&root.querySelector('section.about');if(!art&&!about)return;
 load(key).then(function(d){if(!d||root.querySelector('.sr-extra-text'))return;
  if(art){var src=art.querySelector('p.src');var w=document.createElement('div');w.innerHTML=html(d,'div');var n=w.firstChild;art.insertBefore(n,src||null)}
  else{about.insertAdjacentHTML('afterend',html(d,'section').replace('class="sr-extra-text"','class="about vcard sr-extra-text"'))}})}
setInterval(tick,800);tick();
}catch(e){console.warn('SR extra text failed',e)}})();
