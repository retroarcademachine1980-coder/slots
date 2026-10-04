import fs from 'node:fs';
import { register } from 'node:module';
register('./wix-test-loader.mjs',import.meta.url);
const {RUNTIME_OWNERSHIP,classifyRuntimeOwnership}=await import('../src/public/routes/runtimeOwnership.js');
const classifier=classifyRuntimeOwnership.toString();
const source="/* Generated from the single canonical registry; no independent loader routing policy. */\n(function(){'use strict';const registry="+JSON.stringify(RUNTIME_OWNERSHIP)+";const classify="+classifier+";const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}};freeze(registry);Object.defineProperty(window,'SR_RUNTIME_OWNERSHIP',{value:Object.freeze({registry,owns:(value,options)=>classify(value,registry,options)}),writable:false,configurable:false});})();\n";
fs.writeFileSync(new URL('../generated/runtime-ownership.js',import.meta.url),source);
console.log('Dependency-light ownership artifact: '+source.length+' characters');
