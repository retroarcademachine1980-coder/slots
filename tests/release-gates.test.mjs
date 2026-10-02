import test from 'node:test';
import assert from 'node:assert/strict';
import { auditReleaseManifest } from '../tools/release-gates.mjs';
const hash = 'a'.repeat(64);
const manifest = {deploymentBlocked:false,identity:{releaseFingerprint:hash,manifestFingerprint:hash,rendererFingerprint:hash}, entries:[{key:'NearbyAttractions:c',path:'/cinemas/cinema/town',evidence:'fixture'}],endpoints:{cinema:{native:true,renderer:true,revision:'verified-test',evidence:'fixture'}}};
test('release gate matches parsed kind, not URL-prefix spelling',()=>assert.equal(auditReleaseManifest(manifest).deployable,true));
test('release gate rejects missing native kind evidence',()=>assert.equal(auditReleaseManifest({...manifest,endpoints:{}}).deployable,false));
test('release gate requires index native proof separately',()=>assert.equal(auditReleaseManifest({...manifest,landings:{'/offers':{kind:'offersIndex'}}}).deployable,false));
