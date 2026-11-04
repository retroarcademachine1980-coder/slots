!function(){"use strict";if(!window.SR_PHOTO_INFORMATION_20261024){window.SR_PHOTO_INFORMATION_20261024=!0;var t=!1,e=new WeakSet;document.body?o():document.addEventListener("DOMContentLoaded",o,{once:!0}),addEventListener("popstate",r),addEventListener("sr:navigation",r)}function o(){t=!1;for(var o=[document],a=0;a<o.length;a++){var n=o[a];n.querySelectorAll("*").forEach(function(t){t.shadowRoot&&o.push(t.shadowRoot)}),placeCredits(n),n.querySelectorAll('[aria-label="Cinema photographs"]>p').forEach(function(t){var e=t.textContent.match(/^Jamie Farrar\s*·\s*(\d+ photos?\..*)$/);e&&(t.textContent=e[1])}),n.querySelectorAll("[data-sr-restored-banner-credit],[data-sr-grimsby-photo-credit],[data-sr-portsmouth-photo-credit],[data-sr-card-photo-credit],.sr-image-credits .credit,.sr-town-guide .fact p,.sr-town-guide small,.card .copy>small,.bl article p").forEach(function(t){if(!t.closest("[data-sr-photo-information]")){var e=t.textContent.trim();if(t.matches(".bl article p")&&/^Photo information$/i.test(t.previousElementSibling?.textContent.trim()||"")&&t.querySelector('a[href^="https://creativecommons.org/licenses/by"]')||/^(?:Banner photograph:|Destination photograph:|Photo(?:graph)?s?:|Location photo:|Earlier location photograph source:)/i.test(e)||t.matches(".sr-image-credits .credit")||t.matches(".card .copy>small")&&t.querySelector('a[href^="https://creativecommons.org/licenses/by"]')){var o="SMALL"===t.tagName&&"P"===t.parentElement?.tagName?t.parentElement:t;if(/^(?:Photo(?:graph)?s?:\s*){0,2}Jamie Farrar\s*\/\s*Spin Raiders\b/i.test(e))o.remove();else if(!/\b(?:Public domain|CC0)\b/i.test(e)||/\bCC BY(?:-SA)?\b/i.test(e)){if(/\bCC BY(?:-SA)?\b/i.test(e)||o.querySelector('a[href*="creativecommons.org/licenses/by"]')){var r=o.closest(".fact"),a=r?.querySelector("h3"),n=r&&1===r.querySelectorAll("p").length&&/^(Getting around|Photograph credit)$/i.test(a?.textContent.trim()||""),i=n?r:o,s=document.createElement("details"),c=document.createElement("summary");t.matches(".bl article p")&&/^Photo information$/i.test(t.previousElementSibling?.textContent.trim()||"")&&t.previousElementSibling.remove(),s.dataset.srPhotoInformation="1",s.style.cssText="font:400 12px/1.6 Arial;color:#526981;margin:14px 0;overflow-wrap:anywhere;word-break:break-word",c.textContent="Photo information",c.style.cursor="pointer",s.append(c),i.before(s),s.append(o),n&&r.remove()}}else o.remove()}}}),e.has(n)||(e.add(n),new MutationObserver(r).observe(n,{childList:!0,subtree:!0}))}}
function placeCredits(root) {
 const known={
  '/zoos/fife-zoo/cupar':{image:'3a517e_2a06b09c29e7496fb8878c52ddbc0ad0~mv2.jpg',author:'Bill Harrison / Geograph Britain and Ireland',title:'Ring-tailed lemurs, Fife Zoo',date:'16 April 2023',source:'https://www.geograph.org.uk/photo/7477513'},
  '/zoos/amazon-world-zoo-park/isle-of-wight':{image:'3a517e_fd29a905ef8b4ab1a04b48a76de749b1~mv2.jpg',author:'Lewis Clarke / Geograph Britain and Ireland',title:'South Wight : Amazon World Zoo',date:'1 April 2012',source:'https://www.geograph.org.uk/photo/2882229'}
 };
 root.querySelectorAll('article h3').forEach(heading=>{
  if(heading.textContent.trim()!=='Photograph credits')return;
  const credit=heading.nextElementSibling;
  if(!credit?.classList.contains('credit')||!/^Photo:/i.test(credit.textContent.trim()))return;
  const text=credit.textContent.trim();
  if(!heading.closest('[data-sr-photo-information]')&&(/^Photo:\s*Jamie Farrar\s*\/\s*Spin Raiders\b/i.test(text)||(/\b(?:Public domain|CC0)\b/i.test(text)&&!/\bCC BY(?:-SA)?\b/i.test(text)))){heading.remove();credit.remove();return;}
  const match=known[location.pathname.replace(/\/$/,'')];
  if(match&&text==='Photo: '+match.author&&[...root.querySelectorAll('img')].some(img=>(img.getAttribute('src')||'').split('/v1/')[0]==='https://static.wixstatic.com/media/'+match.image)){
   credit.append(' · '+match.title+' · '+match.date+' · Image resized for display. ');
   for(const [url,label] of [[match.source,'Photo source'],['https://creativecommons.org/licenses/by-sa/2.0/','CC BY-SA 2.0']]){
    if(credit.querySelector('a[href="'+url+'"]'))continue;
    const link=document.createElement('a');link.href=url;link.textContent=label;link.target='_blank';link.rel='noopener';credit.append(' · ',link);
   }
  }
  if(heading.closest('[data-sr-photo-information]'))return;
  const details=document.createElement('details'),summary=document.createElement('summary');
  details.dataset.srPhotoInformation='1';details.style.cssText='font:400 12px/1.6 Arial;color:#526981;margin:14px 0;overflow-wrap:anywhere;word-break:break-word';summary.textContent='Photo information';summary.style.cursor='pointer';heading.before(details);details.append(summary,heading,credit);
 });
}
function r(){t||(t=!0,setTimeout(o,120))}}();