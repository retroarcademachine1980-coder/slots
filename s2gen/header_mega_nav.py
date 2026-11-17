import re
D='/user-code/packages/site-app/src/global/components/Header_mb7ogqqn/'
s=open(D+'structure.jsx').read()
i=s.index('<Menu\n'); 
# find end of Menu element: the line '                />' that closes it, i.e. first occurrence of '\n                />\n' after i
j=s.index('\n                />\n', i)+len('\n                />\n')
s=s[:i]+'<MegaNav id="mnav" className="mnav" />\n'+s[j:]
s=s.replace("import { Menu } from '@origami-wrappers/wixEditorElements/menu'\n","")
s=s.replace("import CUSTOM_MAIN_MENU from '../../../global/menus/CUSTOM_MAIN_MENU'\n","import MegaNav from '@site/site-code/MegaNav'\n")
open(D+'structure.jsx','w').write(s)
def strip(css, pat):
    out=[];k=0;n=len(css)
    # tokenise top-level and inside @media blocks
    res=''
    i=0
    while i<n:
        b=css.find('{',i)
        if b<0: res+=css[i:]; break
        sel=css[i:b]
        # find matching brace
        d=0;e=b
        while True:
            if css[e]=='{': d+=1
            elif css[e]=='}':
                d-=1
                if d==0: break
            e+=1
        body=css[b+1:e]
        if sel.strip().startswith('@media'):
            inner=strip(body,pat)
            res+=sel+'{'+inner+'}'
        elif re.search(pat,sel):
            pass
        else:
            res+=sel+'{'+body+'}'
        i=e+1
    return res
L=open(D+'layout.css').read()
L=strip(L,r'comp-mu1byz6q[23]')
L=L.replace('.comp-mu1byz6d {','.mnav {')
L=re.sub(r'(\.mnav \{[^}]*?)width: --spx\(900\);', r'\1width: auto;', L)
L=re.sub(r'(\.mnav \{[^}]*?)align-self: start;', r'\1align-self: center;', L, count=1)
L=L.replace('margin-top: --spx(14);\n    margin-bottom: --spx(10);\n    margin-left: --spx(0);','margin-top: --spx(0);\n    margin-bottom: --spx(0);\n    margin-left: --spx(270);')
L=L.replace('width: 8.78%;','width: auto;')
L=L.replace('margin-top: --spx(21.375);\n        margin-bottom: --spx(21.375);','margin-top: --spx(0);\n        margin-bottom: --spx(0);')
open(D+'layout.css','w').write(L)
S=open(D+'style.css').read()
S=strip(S,r'comp-mu1byz6')
open(D+'style.css','w').write(S)
print(open(D+'structure.jsx').read()[-900:])
print([m.start() for m in re.finditer('mnav',L)], L[L.find('.mnav'):L.find('.mnav')+700])
