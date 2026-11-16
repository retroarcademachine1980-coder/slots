# cat_500-jackpot-slots.json: the live page's banner + category buttons + CTA (prep_cat), plus the AGC venue filter panel.
import json,subprocess,sys
subprocess.run(['python3','/tmp/gen/prep_cat.py','/tmp/gen/scr/scraped_500-jackpot-slots.json','/tmp/gen/assets.json','/tmp/gen/cat_500-jackpot-slots.json','500-jackpot-slots'],check=True)
C=json.load(open('/tmp/gen/cat_500-jackpot-slots.json'))
tops=[i['label'] for x in C['blocks'] if x['type']=='iconbtns' for i in x['items']]
T=json.load(open('/tmp/gen/towns_agc.json'))['500-jackpot-slots']
al={'type':'all2','title':'Adult gaming centres','collection':'Venues','filter':'urlAgcA','sub':'town','words':'Adult Gaming|AGC','topics':tops,'towns':T}
at=[n for n,b in enumerate(C['blocks']) if b['type']=='cta']
C['blocks'].insert(at[0] if at else len(C['blocks']),al)
json.dump(C,open('/tmp/gen/cat_500-jackpot-slots.json','w'),ensure_ascii=False,indent=1)
print([b['type'] for b in C['blocks']],len(T),'towns')
