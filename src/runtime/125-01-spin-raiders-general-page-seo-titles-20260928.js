(function(){try{
(()=>{'use strict';
// Days-out titles for general (non-arcade) pages. Same wording as src/public/seo.js GENERAL_PAGE_SEO, which puts it
// in the server HTML; this keeps later page designs from swapping the title back after load.
const G={
'/':['UK Days Out, Road Trips & Family Adventures | Spin Raiders','Your next big day out starts here. Plan UK road trips, family days out, beaches, museums, zoos and attractions, with food, places to stay and arcades nearby.'],
'/seaside':['UK Seaside Days Out: Towns, Beaches & Piers | Spin Raiders','Plan a UK seaside day out: resort towns, beaches, piers, fish and chips and family fun, with places to eat and stay nearby. Your next big day out starts here.'],
'/beaches':['Best UK Beaches for a Family Day Out | Spin Raiders','Find UK beaches for a family day out, with what is nearby: food, attractions, places to stay and seaside fun. Your next big day out starts here.'],
'/piers':['UK Piers & Promenades: Seaside Days Out | Spin Raiders',"Plan a seaside day out around the UK's piers and promenades, with food, attractions and family fun nearby. Your next big day out starts here."],
'/outdoors':['UK Outdoor Days Out: Parks, Walks & Nature | Spin Raiders','Outdoor days out across the UK: country parks, walks, nature spots and adventure parks for the whole family. Your next big day out starts here.'],
'/cinemas':['UK Cinemas for a Family Day or Night Out | Spin Raiders','Find cinemas for a family day or night out across the UK, with food and other things to do nearby. Your next big day out starts here.'],
'/bowling':['Bowling Alleys for a Family Day Out in the UK | Spin Raiders','Find UK bowling alleys for a family day out, with arcades, food and other things to do nearby. Your next big day out starts here.'],
'/food-and-drink':['Where to Eat on a UK Day Out | Spin Raiders','Places to eat on your day out: cafes, pubs, fish and chips and family-friendly restaurants near UK attractions and seaside towns.'],
'/food-and-drink-hub':['Where to Eat on a UK Day Out | Spin Raiders','Places to eat on your day out: cafes, pubs, fish and chips and family-friendly restaurants near UK attractions and seaside towns.'],
'/map':['UK Days Out Map: Attractions, Beaches & Arcades | Spin Raiders','Plan your next big day out on the map: attractions, beaches, museums, food, places to stay and arcades across the UK.'],
'/about-us':['About Spin Raiders | UK Days Out, Road Trips & Arcades','Spin Raiders plans real UK days out and road trips: family attractions, seaside towns, food and places to stay, plus arcades and classic fruit machines.'],
'/blog':['Spin Raiders Blog | UK Days Out, Road Trips & Arcade Guides','Ideas for your next big day out: UK road trips, family days out, seaside towns and attractions, plus arcade and fruit machine guides.']};
const p=location.pathname.replace(/\/+$/,'')||'/',q=new URLSearchParams(location.search);
if(p==='/'&&[...q.keys()].length)return;
if(p==='/map'&&q.get('raidertube')==='1')return;
const v=G[p];if(!v)return;
const set=(attr,key,val)=>{let m=document.head.querySelector('meta['+attr+'="'+key+'"]');if(!m){m=document.createElement('meta');m.setAttribute(attr,key);document.head.append(m)}if(m.content!==val)m.content=val};
let n=0;const run=()=>{if(document.title!==v[0])document.title=v[0];if(document.head){set('name','description',v[1]);set('property','og:title',v[0]);set('property','og:description',v[1]);set('name','twitter:title',v[0]);set('name','twitter:description',v[1])}};
run();const iv=setInterval(()=>{run();if(++n>50)clearInterval(iv)},300);
})();
}catch(e){console.warn('SR snippet failed: Spin Raiders general page SEO titles 20260928',e)}})();

