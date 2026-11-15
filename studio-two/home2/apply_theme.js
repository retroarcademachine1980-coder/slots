const fs=require('fs');const p='packages/site-app/src/global/themes/theme.css';let s=fs.readFileSync(p,'utf8');const t=JSON.parse(fs.readFileSync('/tmp/theme.json','utf8'));
for(const [k,v] of Object.entries(t.colors)){const re=new RegExp('(\\n\\s*'+k+':\\s*)#[0-9A-Fa-f]{6};');if(!re.test(s))throw k;s=s.replace(re,'$1'+v+';');}
const mi=s.indexOf('@media (--variants-mqxfr2bo1)');let a=s.slice(0,mi),b=s.slice(mi);
const R=k=>new RegExp('(--wst-'+k+'-font:\\s*)normal normal \\d+ --spx\\([0-9.]+\\)/[0-9.]+em [a-z0-9 -]+?;');
for(const [k,v] of Object.entries(t.fd)){if(!R(k).test(a))throw k;a=a.replace(R(k),'$1'+v+';');}
for(const [k,v] of Object.entries(t.fm)){if(!R(k).test(b))throw 'm'+k;b=b.replace(R(k),'$1'+v+';');}
fs.writeFileSync(p,a+b);console.log('theme ok');
