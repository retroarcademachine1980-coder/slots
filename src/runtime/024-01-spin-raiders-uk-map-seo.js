(function(){try{
(function(){
var BASE='https://www.spin-raiders.com';
var TITLE='UK Amusement Arcade Map & Gaming Venues | Spin Raiders';
var DESC='Explore the Spin Raiders interactive UK map of amusement arcades, classic fruit machine venues, retro video game arcades, casinos, bowling and nearby attractions.';
function meta(sel,attrs){var e=document.head.querySelector(sel);if(!e){e=document.createElement(attrs.tag||'meta');document.head.appendChild(e)}Object.keys(attrs).forEach(function(k){if(k!=='tag')e.setAttribute(k,attrs[k])});return e}
function apply(){var q=new URLSearchParams(location.search),isMap=q.get('raidertube')!=='1'&&(location.pathname.replace(new RegExp('/+$'),'')==='/map'||q.get('sr')==='map');if(!isMap)return;if(location.pathname==='/'&&q.get('sr')==='map'){try{var u=new URL(location.href);u.pathname='/map';u.searchParams.delete('sr');history.replaceState(history.state,'',u.pathname+u.search+u.hash)}catch(e){}}
document.title=TITLE;
meta('meta[name="description"]',{name:'description',content:DESC});
meta('meta[name="robots"]',{name:'robots',content:'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'});
meta('link[rel="canonical"]',{tag:'link',rel:'canonical',href:BASE+'/map'});
meta('meta[property="og:title"]',{property:'og:title',content:TITLE});
meta('meta[property="og:description"]',{property:'og:description',content:DESC});
meta('meta[property="og:type"]',{property:'og:type',content:'website'});
meta('meta[property="og:url"]',{property:'og:url',content:BASE+'/map'});
meta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
meta('meta[name="twitter:title"]',{name:'twitter:title',content:TITLE});
meta('meta[name="twitter:description"]',{name:'twitter:description',content:DESC});
var s=document.getElementById('sr-map-jsonld');if(!s){s=document.createElement('script');s.id='sr-map-jsonld';s.type='application/ld+json';document.head.appendChild(s)}s.textContent=JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'CollectionPage','@id':BASE+'/map#page','url':BASE+'/map','name':'UK Amusement Arcade & Gaming Venue Map','description':DESC,'isPartOf':{'@type':'WebSite','@id':BASE+'/#website','name':'Spin Raiders','url':BASE+'/'},'about':[{'@type':'Thing','name':'Amusement arcades'},{'@type':'Thing','name':'Classic fruit machines'},{'@type':'Thing','name':'Retro video game arcades'},{'@type':'Thing','name':'Land-based casinos'},{'@type':'Thing','name':'Family attractions'}]},{'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Spin Raiders','item':BASE+'/'},{'@type':'ListItem','position':2,'name':'UK Venue Map','item':BASE+'/map'}]}]});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();setTimeout(apply,500);window.addEventListener('popstate',apply);})();
}catch(e){console.warn('SR snippet failed: Spin Raiders UK Map SEO',e)}})();

