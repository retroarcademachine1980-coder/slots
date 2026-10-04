// Compatibility command. Current venue/hotel/food/cinema lifecycle coverage has one owner.
require('node:child_process').execFileSync(process.execPath,[require('node:path').join(__dirname,'verify-canonical-details.cjs')],{stdio:'inherit'});
