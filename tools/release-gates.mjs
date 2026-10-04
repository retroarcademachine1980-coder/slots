import { releaseIdentity } from '../src/public/routes/releaseIdentity.js';
import { createRouteContext, parseCanonical } from '../src/public/routes/canonicalRoutes.js';
import { INDEX_ROUTES } from '../src/public/routes/indexRoutes.js';
export function auditReleaseManifest(manifest) {
  const issues = [];
  if (manifest.deploymentBlocked !== false) issues.push(manifest.blockingReason || 'deployment gate closed');
  const identity = releaseIdentity(manifest);
  if (!identity.complete || !identity.deployable) issues.push('immutable release identity is not deployable');
  const context = createRouteContext(manifest); issues.push(...context.issues.map(issue => issue.code));
  if (!manifest.entries?.length) issues.push('complete reviewed route index not installed');
  const kinds = new Set();
  for (const entry of manifest.entries || []) {
    const parsed = parseCanonical(entry.path);
    if (!parsed.ok) issues.push('invalid canonical entry ' + entry.key);
    else kinds.add(parsed.kind);
  }
  for (const [path, landing] of Object.entries(manifest.landings || {})) {
    const kind = landing.kind;
    if (INDEX_ROUTES[kind] && INDEX_ROUTES[kind].prefix !== path) issues.push('index path mismatch ' + path);
    kinds.add(kind);
  }
  for (const kind of kinds) {
    const endpoint = manifest.endpoints?.[kind];
    if (!endpoint?.native || !endpoint?.renderer || !endpoint?.evidence || !endpoint?.revision) issues.push('native/renderer evidence missing for ' + kind);
  }
  return { deployable: issues.length === 0, issues, identity };
}
