import test from 'node:test';import assert from 'node:assert/strict';
import {createDynamicQueryHook} from '../src/public/routes/dynamicQueryAdapter.js';
import {createRouteContext} from '../src/public/routes/canonicalRoutes.js';
const query=collection=>({collection,filters:[],eq(field,value){this.filters.push([field,value]);return this;},limit(limit){this.limitValue=limit;return this;}});
const entries=[{key:'FoodAndDrink:food',path:'/food-and-drink/cafe/york',evidence:'fixture'},{key:'AffiliateOffers:source',path:'/food-and-drink/restaurant/looe',evidence:'fixture'}];
const context=createRouteContext({entries,venueRouteKinds:{'AffiliateOffers:source':'food'}});
const hook=createDynamicQueryHook({kind:'food',prefix:'/food-and-drink',context,queryFor:query});
test('food dynamic query selects exact original ID in new name/town order without CMS mutation',()=>{
 const result=hook({path:['cafe','york']},'/{townSlug}/{urlName}',query('FoodAndDrink'));
 assert.equal(result.collection,'FoodAndDrink');assert.deepEqual(result.filters,[['_id','food']]);assert.equal(result.limitValue,1);
});
test('food multi-source query preserves original collection and ID, no binding row duplication',()=>{
 const result=hook({path:['restaurant','looe']},'/{townSlug}/{urlName}',query('FoodAndDrink'));
 assert.equal(result.collection,'AffiliateOffers');assert.deepEqual(result.filters,[['_id','source']]);
});
test('unmapped or malformed food paths cannot fall back to old positional row matching',()=>{
 for(const path of [['york','cafe'],['unknown','town'],['restaurant','looe/other']])assert.deepEqual(hook({path},'',query('FoodAndDrink')).filters,[['_id','']]);
 const original=query('FoodAndDrink');assert.equal(hook({path:[]},'/',original),original);
});
