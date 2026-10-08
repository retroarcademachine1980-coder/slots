import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const names=fs.readdirSync(new URL('../src/runtime/',import.meta.url));
const source=n=>fs.readFileSync(new URL('../src/runtime/'+names.find(name=>name.startsWith(String(n).padStart(3,'0')+'-')),import.meta.url),'utf8');
function setup(url='/search?q=coffee'){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM('<body></body>',{url:'https://www.spin-raiders.com'+url,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window;
 w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.eval(source(79));return {w,errors,close:()=>w.close()};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
test('Food search matches coffee aliases, burgers and all location words without dropping the activity',()=>{
 const c=setup(),w=c.w;
 const cafe={_collection:'FoodAndDrink',title:'Harbour Café',town:'York',category:'Café'};
 assert(w.SR_MATCH_PLACE_SEARCH(cafe,w.SR_PARSE_PLACE_SEARCH('coffee York')));
 assert(!w.SR_MATCH_PLACE_SEARCH(cafe,w.SR_PARSE_PLACE_SEARCH('coffee Leeds')));
 const burger={_collection:'FoodAndDrink',title:'Burger Kitchen',town:'York'};
 assert(w.SR_MATCH_PLACE_SEARCH(burger,w.SR_PARSE_PLACE_SEARCH('burgers near me')));
 assert(!w.SR_MATCH_PLACE_SEARCH(cafe,w.SR_PARSE_PLACE_SEARCH('burger near me')));
 for(const q of ['bowling near me','nearest bowling','bowling nearby']){const intent=w.SR_PARSE_PLACE_SEARCH(q);assert(intent.nearMe);assert.equal(intent.category,'bowling');assert.equal(intent.query,'');assert(!w.SR_MATCH_PLACE_SEARCH(cafe,intent));}
 c.close();
});
test('Duplicate provider deals collapse while different offers at an identical price stay distinct',()=>{
 const c=setup(),C=c.w.SR_CANONICAL;
 const a={_collection:'HotelOffers',_id:'a',dealPrice:99,affiliateUrl:'https://www.wowcher.co.uk/deal/travel/uk-city-breaks/12345/hotel?utm_source=one'};
 const b={...a,_id:'b',affiliateUrl:'https://www.wowcher.co.uk/deal/travel/uk-city-breaks/12345/hotel?utm_source=two'};
 const d={...a,_id:'d',affiliateUrl:'https://www.wowcher.co.uk/deal/travel/uk-city-breaks/67890/hotel'};
 assert.equal(C.offerKey(a),C.offerKey(b));assert.notEqual(C.offerKey(a),C.offerKey(d));c.close();
});
test('Near-me search requests location once and retains only the requested activity',async()=>{
 for(const q of ['bowling near me','nearest bowling','bowling nearby','coffee']){
  const c=setup('/search?q='+encodeURIComponent(q)),w=c.w;let geoCalls=0;
  w.SR_ICON=()=>'';w.SR_ROUTE_UI={ready:()=>true,discoverable:()=>true,notice:()=>''};w.SR_ROUTES={viewPaths:{trip:'/plan-a-trip'},href:row=>row.path};w.SR_SEARCH_VIEW_CSS='';
  const near={_id:'b',_collection:'NearbyAttractions',title:'Local Bowling',category:'Bowling',latitude:53,longitude:-1,path:'/bowling/local/york'},cafe={_id:'c',_collection:'FoodAndDrink',title:'Coffee Shop',latitude:53,longitude:-1,path:'/food-and-drink/coffee/york'};
  w.SR_SEARCH_DATA={rows:async()=>[near,cafe]};Object.defineProperty(w.navigator,'geolocation',{value:{getCurrentPosition(ok){geoCalls++;ok({coords:{latitude:53,longitude:-1}})}}});
  w.eval(source(68));const host=w.document.createElement('div');w.document.body.append(host);const root=host.attachShadow({mode:'open'}),view=w.SR_SEARCH_VIEW(root,{S:{e:String},q,category:w.SR_PARSE_PLACE_SEARCH(q).category});view.setRecords([near]);await tick();view.setRecords([near]);
  assert.equal(geoCalls,q==='coffee'?0:1);if(q!=='coffee'){assert.match(root.querySelector('[data-results]').textContent,/Local Bowling/);assert.doesNotMatch(root.querySelector('[data-results]').textContent,/Coffee Shop/);}assert.equal(c.errors.length,0,c.errors.join('\n'));c.close();
 }
});
test('Location refusal leaves a usable town-search instruction',()=>{
 const c=setup(),w=c.w;w.SR_ICON=()=>'';w.SR_ROUTE_UI={ready:()=>true,discoverable:()=>true,notice:()=>''};w.SR_ROUTES={viewPaths:{trip:'/plan-a-trip'},href:()=>'/'};w.SR_SEARCH_VIEW_CSS='';Object.defineProperty(w.navigator,'geolocation',{value:{getCurrentPosition(ok,fail){fail()}}});w.eval(source(68));const host=w.document.createElement('div');w.document.body.append(host);const root=host.attachShadow({mode:'open'});w.SR_SEARCH_VIEW(root,{S:{e:String},q:'coffee near me'}).setRecords([]);assert.match(root.querySelector('[data-location-status]').textContent,/Search by town/);c.close();
});
test('Vault renders real thumbnail shelves and can find a video beyond its first page',()=>{
 const c=setup('/raidertube'),w=c.w;w.document.body.innerHTML='<div id="raidertube-root"><input id="rt-search"><div id="rt-main"></div></div>';w.eval(source(35));const videos=Array.from({length:608},(_,i)=>({id:'vid'+String(i).padStart(8,'0'),title:i===607?'Rare final machine':'Arcade session '+i,views:i,thumb:'https://i.ytimg.com/vi/vid'+String(i).padStart(8,'0')+'/hqdefault.jpg'}));let played='';w.RT_CINEMA.render({videos,hasMore:false,onPlay:id=>played=id});assert(w.document.querySelector('.vv-hero'));assert(w.document.querySelectorAll('[data-shelf]').length>1);assert.equal(w.document.querySelectorAll('.vv-tabs svg').length,0);const input=w.document.getElementById('rt-search');input.value='Rare final machine';input.dispatchEvent(new w.Event('input'));assert.equal(w.document.querySelectorAll('.vv-grid [data-watch]').length,1);w.document.querySelector('.vv-grid [data-watch]').click();assert.equal(played,videos[607].id);c.close();
});
test('Vault automatically loads every page and does not reset a playing video',async()=>{
 const c=setup('/raidertube'),w=c.w;const rows=Array.from({length:208},(_,i)=>({id:String(i),data:{youtubeVideoId:'vid'+String(i).padStart(8,'0'),title:'Video '+i,active:true}}));let calls=[],release,playCount=0;const pending=new Promise(resolve=>release=resolve);
 w.SR_ROUTES={categoryPaths:{},viewPaths:{}};w.YT={Player:function(){playCount++;}};
 w.fetch=async(url,opts)=>{if(url.includes('oauth2'))return {ok:true,json:async()=>({access_token:'fixture'})};const body=JSON.parse(opts.body),collection=body.dataCollectionId;if(collection==='SpinRaidersVideos'){const offset=body.query.paging.offset||0;calls.push(offset);if(offset===100)await pending;return {ok:true,json:async()=>({dataItems:rows.slice(offset,offset+100)})};}return {ok:true,json:async()=>({dataItems:[]})};};
 w.eval(source(35));w.eval(source(104));await tick();w.document.querySelector('[data-watch]').click();await tick();const player=w.document.getElementById('rt-player');assert(player);release();await tick();await tick();assert.equal(w.document.getElementById('rt-player'),player);assert.equal(playCount,1);assert.deepEqual(calls,[0,100,200]);w.history.replaceState({},'','/raidertube');w.dispatchEvent(new w.PopStateEvent('popstate'));assert.match(w.document.querySelector('.vv-load').textContent,/208 videos/);c.close();
});
test('Vault load failure offers a retry and successfully recovers',async()=>{
 const c=setup('/raidertube'),w=c.w;let fail=true;w.SR_ROUTES={categoryPaths:{},viewPaths:{}};w.fetch=async(url,opts)=>{if(url.includes('oauth2'))return {ok:true,json:async()=>({access_token:'fixture'})};const request=JSON.parse(opts.body);if(request.dataCollectionId==='SpinRaidersVideos'&&fail)throw Error('offline');return {ok:true,json:async()=>({dataItems:request.dataCollectionId==='SpinRaidersVideos'?[{data:{youtubeVideoId:'abcdefghijk',title:'Recovered video'}}]:[]})};};w.eval(source(35));w.eval(source(104));await tick();assert.match(w.document.querySelector('.vv-load').textContent,/could not load/);fail=false;w.document.querySelector('[data-retry]').click();await tick();assert.match(w.document.querySelector('.vv-hero').textContent,/Recovered video/);assert.equal(w.document.querySelector('[data-retry]'),null);c.close();
});
