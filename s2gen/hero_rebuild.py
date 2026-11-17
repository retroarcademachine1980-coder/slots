# Rebuild the home hero at the original sign size: clean beach background + Jamie's sign and signpost cut from the current hero.
import urllib.request
from PIL import Image
from rembg import remove, new_session
def get(u, f):
    urllib.request.urlretrieve(u, f); return Image.open(f).convert('RGB')
h = get('https://static.wixstatic.com/media/3a517e_c00db68d44ed453e96b9547639584056~mv2.jpg', '/tmp/hero_old.jpg')
bg = get('https://static.wixstatic.com/media/3a517e_2a371140a3304bfbb7a908a165057aa8~mv2.jpg', '/tmp/hero_bg.jpg').crop((0, 300, 2752, 1400))
s = new_session('isnet-general-use')
sign = remove(h.crop((0, 0, 1420, 1100)), session=s)
post = remove(h.crop((2250, 0, 2752, 1100)), session=s)
k = 0.6; s2 = sign.resize((int(sign.width * k), int(sign.height * k)), Image.LANCZOS)
kp = 0.85; p2 = post.resize((int(post.width * kp), int(post.height * kp)), Image.LANCZOS)
c = bg.copy(); c.paste(s2, (24, 1100 - s2.height), s2); c.paste(p2, (2752 - p2.width - 30, 1100 - p2.height), p2)
c.save('/tmp/hero_new.jpg', quality=90)
print('ok', c.size)
