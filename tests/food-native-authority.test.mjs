import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBackend } from '../tools/test-support/wix-backend-harness.mjs';
const slug='fixture-cafe-york';
const record={_id:'fixture-food',title:'Fixture Cafe',routeSlug:slug,urlName:'fixture-cafe',town:'York',townSlug:'york',seoTitle:'A reviewed title',seoDescription:'A reviewed description.'};
const manifest={entries:[{key:'FoodAndDrink:fixture-food',path:'/food-and-drink/'+slug,evidence:'fixture'}],endpoints:{food:{native:true,renderer:true,revision:'FIXTURE',evidence:'fixture',pageName:'Food and Drink (Item)'}}};
const request=()=>({prefix:'food-and-drink',path:[slug],pages:['Food and Drink (Item)'],query:{}});
const load=()=>loadBackend('backend/dynamicRoutingService',{FoodAndDrink:[record]},{},manifest);

test('a native Food query retains its original dataset filters, options and synchronous identity',async()=>{
 const m=await load(),native=Object.freeze({dataset:'native FoodAndDrink',filters:['routeSlug='+slug],options:{language:'en'},find:async()=>({items:[record]})});
 const actual=m.foodCustomizeQuery(request(),'/{routeSlug}',native);
 assert.equal(actual,native);assert.equal(actual.then,undefined);assert.equal((await actual.find()).items[0],record);
});
test('the native Food response retains its complete dataset payload and configured SEO without mutation',async()=>{
 const m=await load(),data=Object.freeze({nativeDataset:{item:record},pageContext:'preserved'}),head=Object.freeze({title:'Native resolved title',metaTags:[{name:'description',content:'Native resolved description'},{name:'robots',content:'noindex,nofollow'}],links:[{rel:'canonical',href:'https://www.spin-raiders.com/food-and-drink/'+slug}]});
 const native=Object.freeze({status:200,page:'Food and Drink (Item)',data,head}),before=JSON.stringify(native);
 const actual=await m.foodAfterRouter(request(),native);
 assert.equal(actual,native);assert.equal(actual.data,data);assert.equal(actual.head,head);assert.equal(JSON.stringify(actual),before);
});
test('a native Food error or deferred response is not converted into a fabricated successful page',async()=>{
 const m=await load();
 for(const native of [{status:404,message:'Native item unavailable'},{status:503,message:'Native data temporarily unavailable'},undefined])assert.equal(await m.foodAfterRouter(request(),native),native);
});
test('canonical Food addresses and malformed-path protection remain while temporary trace logging is removed',async()=>{
 const original=console.info,logs=[];console.info=(...args)=>logs.push(args);
 try{
  const m=await load();assert.equal((await m.foodBeforeRouter(request())).status,'next');
  assert.equal((await m.foodBeforeRouter({...request(),path:['fixture%2Fcafe']})).status,404);
  const native={status:200,data:{}};m.foodCustomizeQuery(request(),'/{routeSlug}',{});await m.foodAfterRouter(request(),native);
  assert.equal(logs.length,0);
 }finally{console.info=original;}
});
