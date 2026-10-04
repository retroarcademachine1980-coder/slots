export const CONTRACT_VERSION = 'spin-raiders-canonical-v1';
export function releaseIdentity(manifest) {
  const identity = manifest?.identity || {};
  const complete = ['releaseFingerprint','manifestFingerprint','rendererFingerprint'].every(field => /^[a-f0-9]{64}$/.test(identity[field] || ''));
  return Object.freeze({ contractVersion: CONTRACT_VERSION,
    releaseFingerprint: identity.releaseFingerprint || null,
    manifestFingerprint: identity.manifestFingerprint || null,
    rendererFingerprint: identity.rendererFingerprint || null,
    stage:manifest?.stage||'unprepared', productionAccepted:manifest?.productionAccepted===true,
    complete, deployable: complete && manifest?.deploymentBlocked === false });
}
