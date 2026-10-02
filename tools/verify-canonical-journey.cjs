// Compatibility command. Shared current-route/detail fixtures replace retired legacy URL assumptions.
const {execFileSync}=require('node:child_process'),path=require('node:path');
for(const suite of ['verify-business-contracts.cjs','verify-canonical-details.cjs','verify-visitor-journey.cjs'])execFileSync(process.execPath,[path.join(__dirname,suite)],{stdio:'inherit'});
