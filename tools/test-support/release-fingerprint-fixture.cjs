'use strict';
const assert=require('node:assert/strict');
/** Match the real pinned build identity in simulated route-service responses.
 * Does not change runtime source, success/error status, route outcomes or existing
 * explicit fingerprints; wrong/missing identity negatives remain separately tested.
 */
function installFingerprintFixture(w,source){const text=Array.isArray(source)?source.join('\n'):source,match=text.match(/expectedReleaseFingerprint:(null|"[a-f0-9]{64}")/);assert(match,'compiled route authority fingerprint configuration missing');const releaseFingerprint=JSON.parse(match[1]),transport=w.fetch;w.fetch=async function(url,options){const response=await transport.call(this,url,options);if(!String(url).startsWith('/_functions/canonical')||!response?.json)return response;return{...response,json:async()=>{const payload=await response.json();return Object.hasOwn(payload,'fingerprint')?payload:{...payload,fingerprint:{releaseFingerprint}};}};};return releaseFingerprint;}
module.exports={installFingerprintFixture};
