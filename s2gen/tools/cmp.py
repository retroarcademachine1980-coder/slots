# python3 cmp.py new.png live.png out.jpg [width] : live on the left, new on the right
from PIL import Image, ImageDraw
import sys
n,l,o=sys.argv[1:4]; W=int(sys.argv[4]) if len(sys.argv)>4 else 1100
a=Image.open(n).convert('RGB'); b=Image.open(l).convert('RGB')
H=min(max(a.height,b.height),9000)
c=Image.new('RGB',(2600,H+60),'white'); d=ImageDraw.Draw(c)
d.text((20,15),'LIVE spin-raiders.com',fill='black'); d.text((1340,15),'NEW Studio Two',fill='black')
c.paste(b.crop((0,0,1280,min(b.height,H))),(0,60)); c.paste(a.crop((0,0,1280,min(a.height,H))),(1320,60))
c=c.resize((W,int((H+60)*W/2600))); c.save(o,quality=50)
print(a.size,b.size,c.size)
