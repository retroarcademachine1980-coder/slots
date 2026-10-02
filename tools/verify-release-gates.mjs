import fs from 'node:fs';
import { routeManifest } from '../src/public/routes/routeManifest.generated.js';
import { auditReleaseManifest } from './release-gates.mjs';
const result = auditReleaseManifest(routeManifest);
fs.writeFileSync(new URL('../generated/release-gates.json',import.meta.url), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2)); if (!result.deployable) process.exitCode=1;
