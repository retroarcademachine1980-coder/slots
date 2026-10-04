const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {ruleIntercepts,auditRootAcceptance}=require('./test-support/host-route-gate.cjs');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'../tests/fixtures/backward-root-redirects.json'))),rules=fixture.rules,roots=rules.map(rule=>rule.from),fingerprint='a'.repeat(64);
const good=root=>({path:root,status:200,finalUrl:'https://www.spin-raiders.com'+root,redirects:[],nativeCanonical:'https://www.spin-raiders.com'+root,buildFingerprint:fingerprint});
assert.equal(rules.length,17);assert(rules.every(rule=>rule.options.groupRedirect===false));
const blocked=auditRootAcceptance({canonicalRoots:roots,redirectRules:rules,probes:roots.map(good),expectedBuildFingerprint:fingerprint});
assert.equal(blocked.accepted,false);assert.equal(blocked.issues.filter(issue=>issue.code==='canonical_root_still_redirected').length,17,'Even apparently rendered client pages cannot clear host redirects');
assert(rules.every(rule=>!ruleIntercepts(rule.from+'/example/town',rule)),'Exact index redirects do not establish a detail-route blocker');
const clean=auditRootAcceptance({canonicalRoots:roots,redirectRules:[],probes:roots.map(good),expectedBuildFingerprint:fingerprint});assert.equal(clean.accepted,true,'Exact post-cutover host evidence should be accepted');
for(const mutation of [{status:301},{finalUrl:'https://www.spin-raiders.com/?explore=arcades'},{redirects:[{status:301}]},{nativeCanonical:'https://www.spin-raiders.com/classic-fruit-machine-archive'},{buildFingerprint:'b'.repeat(64)}]){const probes=roots.map(good);Object.assign(probes[0],mutation);assert.equal(auditRootAcceptance({canonicalRoots:roots,redirectRules:[],probes,expectedBuildFingerprint:fingerprint}).accepted,false,JSON.stringify(mutation));}
assert.equal(auditRootAcceptance({canonicalRoots:roots,redirectRules:[],probes:[],expectedBuildFingerprint:fingerprint}).accepted,false);
assert(ruleIntercepts('/classic-fruit-machines/maygay/donkey-kong',{from:'/classic-fruit-machines',options:{groupRedirect:true}}));
console.log('PASS captured17 reverse-root rules remain a production-acceptance blocker; exact rules do not block details; only direct200/self-canonical/exact-build root evidence clears the gate');
