(function(){'use strict';
 window.SR_ROUTE_HTML=Object.freeze({async prepare(rawHtml){
  const template=document.createElement('template');template.innerHTML=String(rawHtml||'');
  const internal=[];
  for(const anchor of template.content.querySelectorAll('a[href]')){
   const raw=anchor.getAttribute('href')||'';if(!raw||raw.startsWith('#'))continue;
   let url;try{url=new URL(raw,location.origin);}catch{continue;}
   if(url.origin!==location.origin)continue;
   if(!/^https?:$/.test(url.protocol)||url.username||url.password){anchor.replaceWith(...anchor.childNodes);continue;}
   internal.push({anchor,input:url.pathname+url.search+url.hash});
  }
  if(!internal.length)return template.innerHTML;
  let results=[];
  try{const response=await window.SR_ROUTES.canonicalLinks([...new Set(internal.map(item=>item.input))]);results=Array.isArray(response?.results)?response.results:[];}catch{}
  const resolved=new Map(results.map(result=>[result.input,result]));let unavailable=false;
  for(const {anchor,input}of internal){const result=resolved.get(input);if(result?.ok&&typeof result.href==='string'){
    const safe=new URL(result.href,location.origin);if(safe.origin===location.origin&&/^https?:$/.test(safe.protocol)&&!safe.username&&!safe.password){anchor.setAttribute('href',safe.href);anchor.removeAttribute('target');continue;}
   }
   anchor.replaceWith(...anchor.childNodes);unavailable=true;
  }
  /* unresolved internal links are shown as plain text */
  return template.innerHTML;
 }});
})();

