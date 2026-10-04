(function(){try{
(()=>{'use strict';
const LOGO='https://static.wixstatic.com/media/3a517e_f00e5a18805c4337b938ce71379c0f50~mv2.jpg/v1/fit/w_1400,h_1400,q_70,enc_auto/file.webp';
const CONTRAST_IDS=['comp-lunurbwh','comp-me4boe4q','hqyya','hh4vk','z00kr','comp-lunurbwo','l8fi0','z73my','nsqbc','h6104','zwn1e'];
const visible=x=>!!(x&&x.getClientRects().length);
function replaceHeading(el,level){
 const tag='H'+level;if(el.tagName===tag){el.removeAttribute('aria-level');return el}
 const n=document.createElement(tag.toLowerCase());
 [...el.attributes].forEach(a=>n.setAttribute(a.name,a.value));
 n.innerHTML=el.innerHTML;el.replaceWith(n);return n
}
function patchSchema(){
 document.querySelectorAll('script[type="application/ld+json"]').forEach(s=>{
  try{
   const data=JSON.parse(s.textContent||'null');let changed=false;
   const walk=v=>{
    if(!v||typeof v!=='object')return;
    if(Array.isArray(v)){v.forEach(walk);return}
    const t=v['@type'];const org=t==='Organization'||(Array.isArray(t)&&t.includes('Organization'));
    if(org&&!v.logo){v.logo=LOGO;changed=true}
    Object.values(v).forEach(walk)
   };
   walk(data);if(changed)s.textContent=JSON.stringify(data).replace(/</g,'\u003c')
  }catch(e){}
 })
}
function patchHeadings(){
 const root=document.getElementById('sr-seaside-root')||document.getElementById('PAGES_CONTAINER')||document.body;
 let hs=[...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible);
 if(!hs.length)return;
 hs=hs.map((h,i)=>i===0?replaceHeading(h,1):h);
 let prev=1;
 for(let i=1;i<hs.length;i++){
  let h=hs[i];let lvl=Number(h.tagName.slice(1))||2;
  if(lvl<2)lvl=2;
  if(lvl>prev+1)lvl=prev+1;
  h=replaceHeading(h,lvl);hs[i]=h;prev=lvl
 }
}
function patchAlts(){
 document.querySelectorAll('img:not([alt])').forEach(img=>{
  const card=img.closest('article,section,li,[class*="card"],[class*="tile"]');
  const h=card&&card.querySelector('h1,h2,h3,h4,[aria-label]');
  const txt=(img.getAttribute('title')||h?.textContent||h?.getAttribute?.('aria-label')||document.title||'Spin Raiders').replace(/\s+/g,' ').trim();
  img.setAttribute('alt',txt.slice(0,160))
 })
}
function bgFor(el){
 let n=el;
 while(n&&n!==document.documentElement){
  const c=getComputedStyle(n).backgroundColor;
  const m=c&&c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if(m&&Number(m[4]??1)>0.05)return [Number(m[1]),Number(m[2]),Number(m[3])];
  n=n.parentElement
 }
 return [255,255,255]
}
function patchContrast(){
 CONTRAST_IDS.forEach(id=>{
  const el=document.getElementById(id);if(!el)return;
  if(id==='comp-lunurbwh'){
   el.style.setProperty('background-color','#ffffff','important');
   el.style.setProperty('color','#111111','important');
   el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li').forEach(x=>{
    x.style.setProperty('color','#111111','important');
    const bg=getComputedStyle(x).backgroundColor;
    if(!bg||bg==='rgba(0, 0, 0, 0)'||bg==='transparent')x.style.setProperty('background-color','transparent','important')
   });
   return
  }
  const [r,g,b]=bgFor(el);const lum=(0.2126*r+0.7152*g+0.0722*b);const c=lum>140?'#111111':'#ffffff';
  el.style.setProperty('color',c,'important');
  el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li').forEach(x=>{
   const bg=getComputedStyle(x).backgroundColor;
   if(!bg||bg==='rgba(0, 0, 0, 0)'||bg==='transparent')x.style.setProperty('color',c,'important')
  })
 })
}
function removeRetiredBookmakerLinks(){
 document.querySelectorAll('a[href]').forEach(a=>{
  let u;try{u=new URL(a.href,location.href)}catch{return}
  const text=(a.textContent||'').replace(/\s+/g,' ').trim();
  if(u.origin===location.origin&&(u.pathname.replace(/\/$/,'')==='/general-1-1'||/bookmakers with fruit machines|^uk bookmakers$|^bookmakers$/i.test(text))){
   const li=a.closest('li');
   if(li&&li.querySelectorAll('a').length===1)li.remove();else a.remove();
  }
 })
}
function run(){patchSchema();patchHeadings();patchAlts();patchContrast();removeRetiredBookmakerLinks()}
let queued=false;
const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})};
let n=0;const t=setInterval(()=>{run();if(++n>24)clearInterval(t)},250);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
addEventListener('pageshow',run);addEventListener('popstate',()=>setTimeout(run,100));
})();
}catch(e){console.warn('SR snippet failed: Spin Raiders SEO DOM Cleanup 20260918',e)}})();

