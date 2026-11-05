import test from 'node:test';
import assert from 'node:assert/strict';
import {loadBackend} from '../tools/test-support/wix-backend-harness.mjs';
const slug='masala-malt-grimsby';
const record={_id:'fixture-food',title:'Fixture café',routeSlug:slug,urlName:'masala-n-malt',town:'Fixture town',townSlug:'grimsby',seoTitle:'Fixture food guide',seoDescription:'A fixture description for the native response test.'};
const manifest={entries:[{key:'FoodAndDrink:fixture-food',path:'/food-and-drink/'+slug,evidence:'test fixture'}],endpoints:{food:{native:true,renderer:true,revision:'FIXTURE',evidence:'test fixture',pageName:'Food and Drink (Item)'}}};
const request=traced=>({prefix:'food-and-drink',path:[slug],pages:['Food and Drink (Item)'],query:traced?{srFoodTrace:'20261105'}:{},user:{email:'PRIVATE_EMAIL_NEVER_LOG'}});
const response=()=>({status:200,page:'Food and Drink (Item)',data:{boundDataset:'PRIVATE_DATA_NEVER_LOG'},head:{links:[{rel:'author',href:'/about-us'}],metaTags:[{name:'robots',content:'noindex,nofollow'}]}});
async function withLogs(run,throwing=false){const original=console.info,logs=[];console.info=(...args)=>{logs.push(args);if(throwing)throw Error('logger unavailable');};try{return await run(logs);}finally{console.info=original;}}

test('normal food routing remains silent and preserves native dataset response and synchronous query contract',async()=>withLogs(async logs=>{
 const m=await loadBackend('backend/dynamicRoutingService',{FoodAndDrink:[record]}, {},manifest),req=request(false),native=response();
 assert.equal((await m.foodBeforeRouter(req)).status,'next');
 const query=m.foodCustomizeQuery(req,'/{routeSlug}',{});assert.equal(typeof query.find,'function');assert.equal(query.then,undefined);assert.equal((await query.find()).items[0]._id,record._id);
 const data=native.data;const result=await m.foodAfterRouter(req,native);assert.equal(result,native);assert.equal(result.data,data);assert.equal(result.head.title,record.seoTitle);assert.equal(logs.length,0);
}));

test('opt-in diagnostics show actual hook order and head availability without record or visitor values',async()=>withLogs(async logs=>{
 const m=await loadBackend('backend/dynamicRoutingService',{FoodAndDrink:[record]}, {},manifest),req=request(true),native=response();
 await m.foodBeforeRouter(req);const query=m.foodCustomizeQuery(req,'/{routeSlug}',{});assert.equal(query.then,undefined);await m.foodAfterRouter(req,native);
 const rows=logs.map(args=>{assert.equal(args[0],'SR_FOOD_ROUTER_TRACE');return JSON.parse(args[1]);});
 assert.deepEqual(rows.map(r=>r.phase),['before:enter','query:enter','query:return','after:enter','after:return']);
 assert.equal(rows.at(-1).titlePresent,true);assert.equal(rows.at(-1).descriptionPresent,true);assert.deepEqual(rows[3].dataKeys,['boundDataset']);
 const all=JSON.stringify(logs);for(const value of ['PRIVATE_EMAIL_NEVER_LOG','PRIVATE_DATA_NEVER_LOG',record.seoTitle,record.seoDescription])assert.equal(all.includes(value),false);
}));

test('logging service failure cannot break an opted-in native page response',async()=>withLogs(async()=>{
 const m=await loadBackend('backend/dynamicRoutingService',{FoodAndDrink:[record]}, {},manifest),native=response();
 assert.equal((await m.foodBeforeRouter(request(true))).status,'next');assert.equal(typeof m.foodCustomizeQuery(request(true),'/{routeSlug}',{}).find,'function');assert.equal(await m.foodAfterRouter(request(true),native),native);
},true));

test('native response failures retain the same error object and log only its type',async()=>withLogs(async logs=>{
 const m=await loadBackend('backend/dynamicRoutingService',{FoodAndDrink:[record]}, {},manifest),native=response(),failure=new TypeError('PRIVATE_EXCEPTION_NEVER_LOG');
 Object.defineProperty(native,'head',{get(){throw failure;}});await assert.rejects(m.foodAfterRouter(request(true),native),error=>error===failure);
 assert.equal(JSON.stringify(logs).includes('PRIVATE_EXCEPTION_NEVER_LOG'),false);assert.equal(JSON.parse(logs.at(-1)[1]).errorType,'TypeError');
}));
