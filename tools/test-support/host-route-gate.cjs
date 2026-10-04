const ORIGIN='https://www.spin-raiders.com';
function ruleIntercepts(path,rule){return rule?.from===path||(rule?.options?.groupRedirect===true&&typeof rule.from==='string'&&path.startsWith(rule.from.replace(/\/$/,'')+'/'));}
function auditRootAcceptance({canonicalRoots,redirectRules,probes=[],expectedBuildFingerprint}){
 const issues=[];
 if(!Array.isArray(canonicalRoots)||!canonicalRoots.length||!Array.isArray(redirectRules)||!/^[a-f0-9]{64}$/.test(expectedBuildFingerprint||''))return{accepted:false,issues:[{code:'incomplete_host_acceptance_input'}]};
 for(const root of [...new Set(canonicalRoots)]){
  if(typeof root!=='string'||!/^\/[a-z0-9-]+$/.test(root)){issues.push({root,code:'invalid_canonical_root'});continue;}
  for(const rule of redirectRules.filter(rule=>ruleIntercepts(root,rule)))issues.push({root,code:'canonical_root_still_redirected',from:rule.from,to:rule.to});
  const matches=probes.filter(probe=>probe.path===root);
  if(matches.length!==1){issues.push({root,code:'missing_or_ambiguous_root_probe'});continue;}
  const probe=matches[0];
  if(probe.status!==200||probe.finalUrl!==ORIGIN+root||!Array.isArray(probe.redirects)||probe.redirects.length)issues.push({root,code:'root_not_direct_200'});
  if(probe.nativeCanonical!==ORIGIN+root)issues.push({root,code:'native_root_canonical_mismatch'});
  if(probe.buildFingerprint!==expectedBuildFingerprint)issues.push({root,code:'root_probe_build_mismatch'});
 }
 return {accepted:issues.length===0,issues};
}
module.exports={ruleIntercepts,auditRootAcceptance};
