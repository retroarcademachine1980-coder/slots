import test from 'node:test';import assert from 'node:assert/strict';
import {runtimeOwns} from '../src/public/routes/runtimeOwnership.js';
test('loader owns only final-renderer routes and documented inbound aliases',()=>{
 for(const input of ['/', '/search?q=arcade', '/map', '/arcade?type=classic','/food-and-drink/masala-malt-grimsby','/classic-fruit-machines/barcrest/each-way-nudge','/plan-a-trip','/blog/categories/arcade-guides','/classic-fruit-machine-archive','/hotels/old','/?collection=Venues&place=old'])assert.equal(runtimeOwns(input),true,input);
 for(const input of ['/terms','/privacy-policy','/members','/about-us','/search?view=articles','/?view=account','/?report=1','/?raidertube=1','/post/unverified','/imaginary/item/town','https://evil.test/arcade'])assert.equal(runtimeOwns(input),false,input);
});
test('transitional root inputs are removable without losing final native routes',()=>{
 assert.equal(runtimeOwns('/?explore=places-to-stay'),true);assert.equal(runtimeOwns('/?explore=places-to-stay',{transitionalIndexInputs:false}),false);
 assert.equal(runtimeOwns('/places-to-stay',{transitionalIndexInputs:false}),true);
 assert.equal(runtimeOwns('/destination-recommendations?view=offers'),true);
});
const fs=await import('node:fs'),vm=await import('node:vm');
test('dependency-light loader artifact exactly matches authority classifier',()=>{
 const source=fs.readFileSync(new URL('../generated/runtime-ownership.js',import.meta.url),'utf8'),window={};
 vm.runInNewContext(source,{window,URL,Object,RegExp});
 for(const input of ['/', '/?view=trip','/?view=account','/arcade/a1a4b487/town','/arcade/cafe/town','/classic-fruit-machines/maygay/the-italian-job','/classic-fruit-machines/maygay/unknown','/search?view=articles','/terms','/post/blackpool-world-fireworks-10-october-final-arcades','/hotels/old','/?collection=Venues&place=x'])for(const transitionalIndexInputs of [true,false])assert.equal(window.SR_RUNTIME_OWNERSHIP.owns(input,{transitionalIndexInputs}),runtimeOwns(input,{transitionalIndexInputs}),input);
 assert.ok(source.length<15000,'Ownership artifact must fit native embed limit before dispatcher budgeting');
});
