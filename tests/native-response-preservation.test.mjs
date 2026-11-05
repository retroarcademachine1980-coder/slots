import test from 'node:test';
import assert from 'node:assert/strict';
import { createDynamicDetailHook } from '../src/public/routes/dynamicPageAdapter.js';

const path='/food-and-drink/harbour-cafe-york';
const row={_id:'fixture-cafe',seoTitle:'Harbour Cafe, York',seoDescription:'A fixture description, not a published venue.'};
const route={path,canonicalUrl:'https://www.spin-raiders.com'+path};
function hook(){return createDynamicDetailHook({kind:'food',prefix:'/food-and-drink',resolve:async()=>({status:200,row,route}),ok:()=>{throw Error('Existing successful native response must not be rebuilt');},notFound:()=>404,sendStatus:s=>s});}

test('successful native detail retains the exact response, dataset data and platform fields',async()=>{
 const data={items:[{_id:row._id}],dataset:{opaque:'native-data'}};
 const response={status:200,page:'Native Item',data,platformField:{opaque:true},head:{title:'Old',metaTags:[{property:'og:image',content:'https://example.com/photo.jpg'},{name:'description',content:'Old'}],links:[{rel:'alternate',href:'https://example.com/alternative'},{rel:'canonical',href:'https://example.com/old'}],structuredData:[{'@type':'Restaurant'}]}};
 const result=await hook()({path:['harbour-cafe-york']},response);
 assert.equal(result,response);assert.equal(result.data,data);assert.deepEqual(result.platformField,{opaque:true});
 assert.equal(result.head.title,row.seoTitle);assert.deepEqual(result.head.metaTags,[{property:'og:image',content:'https://example.com/photo.jpg'},{name:'description',content:row.seoDescription}]);
 assert.deepEqual(result.head.links,[{rel:'alternate',href:'https://example.com/alternative'},{rel:'canonical',href:route.canonicalUrl}]);assert.deepEqual(result.head.structuredData,[{'@type':'Restaurant'}]);
});

test('native success preserves an existing indexing restriction',async()=>{
 const response={status:200,page:'Native Item',data:{_id:row._id},head:{noIndex:true}};
 assert.equal((await hook()({path:['harbour-cafe-york']},response)).head.noIndex,true);
});
