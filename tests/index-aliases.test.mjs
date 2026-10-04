import test from 'node:test';import assert from 'node:assert/strict';
import {resolveIndexAlias} from '../src/public/routes/indexAliases.js';
test('index aliases are one-way semantic outputs with explicit client versus server method',()=>{
 for(const [from,to,method]of [['/classic-fruit-machine-archive','/classic-fruit-machines','server301'],['/?explore=classic-arcades','/arcade?type=classic','clientReplace'],['/?explore=family-arcades','/arcade?type=family','clientReplace'],['/?view=trip','/plan-a-trip','clientReplace'],['/destination-recommendations?view=offers','/offers','clientReplace']]){
 const result=resolveIndexAlias(from);assert.equal(result.to,to);assert.equal(result.method,method);assert.equal(resolveIndexAlias(to).ok,false);
 }
});
test('index alias filters survive without allowing record identity or arbitrary root queries',()=>{
 assert.equal(resolveIndexAlias('/?explore=fishing&q=trout&type=coarse').to,'/fishing-lakes?q=trout&type=coarse');
 for(const input of ['/?explore=fishing&place=123','/?view=account','/?q=arcade','/?explore=fishing&explore=arcades','https://evil.test/?view=trip'])assert.equal(resolveIndexAlias(input).ok,false);
});
