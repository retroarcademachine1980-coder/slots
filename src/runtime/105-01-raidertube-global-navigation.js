(function(){try{
(function(){
  var TARGET='/?raidertube=1';
  function patchVideoButtons(root){
    var nodes=(root||document).querySelectorAll('a,button,[role="button"]');
    nodes.forEach(function(el){
      if(el.id==='raidertube-global-button') return;
      var txt=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      var aria=(el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().toLowerCase();
      var href=(el.getAttribute('href')||'').trim().toLowerCase();
      var exactVideoLabel=(txt==='videos'||txt==='video'||txt==='watch videos'||aria==='videos'||aria==='video');
      var videoHref=(href==='/videos'||href.endsWith('/videos')||href.indexOf('/videos?')>=0||href.indexOf('/videos#')>=0);
      if(exactVideoLabel||videoHref){
        if(el.tagName==='A') el.setAttribute('href',TARGET);
        if(exactVideoLabel) el.textContent='RaiderTube';
        if(aria==='videos'||aria==='video') el.setAttribute('aria-label','RaiderTube');
        el.setAttribute('data-raidertube-link','1');
      }
    });
  }
  function ensureGlobalButton(){
    if(document.getElementById('raidertube-global-button')) return;
    var a=document.createElement('a');
    a.id='raidertube-global-button';
    a.href=TARGET;
    a.setAttribute('aria-label','Open RaiderTube');
    a.innerHTML='<span class="rt-play">▶</span><span>RaiderTube</span>';
    document.body.appendChild(a);
  }
  function apply(){if(new URLSearchParams(location.search).get('raidertube')==='1')return;patchVideoButtons(document);ensureGlobalButton();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true}); else apply();
  var q=false;var mo=new MutationObserver(function(){if(q)return;q=true;setTimeout(function(){q=false;apply();},150);}); mo.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('popstate',apply);
  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target.closest('[data-raidertube-link="1"]'):null;
    if(t&&t.tagName!=='A'){e.preventDefault();location.href=TARGET;}
  },true);
})();
}catch(e){console.warn('SR snippet failed: RaiderTube Global Navigation',e)}})();

