"""Additional finite read-only branch photo discovery for the approved image list.
No CMS updates, media uploads, or site publication. Review outputs are candidates.
"""
from pathlib import Path
import json
import re
from urllib.parse import unquote, urlsplit, urljoin
import concurrent.futures
from bs4 import BeautifulSoup
import image_branch_sources_20261006 as branch
import image_clearance_readonly_20261006 as audit

branch.ROOTS = {
    'Roxy': 'https://roxyleisure.co.uk/venues/',
    'TeamSport': 'https://www.team-sport.co.uk/go-kart-tracks',
    'BOOM BATTLE BAR': 'https://boombattlebar.com/uk/',
    'Gravity': 'https://gravity-global.com/active/hull',
    'Oxygen': 'https://oxygenactiveplay.co.uk/activity-parks/',
    'Rock Up': 'https://www.rock-up.co.uk/locations',
    'Mulligans': 'https://www.mrmulligan.com/venues',
    'Junkyard': 'https://www.junkyardgolfclub.co.uk/',
    'Planet Ice': 'https://planet-ice.co.uk/find-your-nearest-rink',
    'Treetop': 'https://adventuregolf.com/contact',
    'Escape Hunt': 'https://escapehunt.com/uk/',
    'Ninja Warrior': 'https://ninjawarrioruk.co.uk/locations/',
    'Immersive Gamebox': 'https://www.immersivegamebox.com/en-GB/venues/london',
}
branch.STOP.update('boom battle bar gravity active max oxygen rock up mulligans junkyard golf club planet ice treetop adventure escape hunt ninja warrior immersive gamebox'.split())
branch.EXTRAS = []
OUT = Path('additional-branch-review')
OUT.mkdir(exist_ok=True)
(OUT / 'thumbs').mkdir(exist_ok=True)
branch.OUT = OUT
audit.OUT = OUT

original_links = branch.links_at
original_candidates = branch.candidates_at
BAD = re.compile(r'logo|map(?:[_.-]|\b)|tracklayout|track-layout|track-map|floor.?plan|guide-?map|avatar|favicon|icon|birthday.?invite|competition|voucher|gift.?card|placeholder|coming.?soon', re.I)


def links_at(root):
    links = original_links(root)
    raw, kind, final = audit.public_get(root, 6_000_000)
    host = urlsplit(final).hostname.removeprefix('www.')
    text = raw.decode('utf-8', 'replace').replace('\\/', '/')
    for value in re.findall(r'[\"\x27](/[^\"\x27<>\s]{3,160})[\"\x27]', text):
        if re.search(r'\.(?:js|css|jpg|png|svg|webp|woff|ico)(?:\?|$)', value):
            continue
        url = urljoin(final, value)
        if urlsplit(url).hostname.removeprefix('www.') == host:
            links.setdefault(url, '')
    return links


def candidates_at(url, title, town):
    items = original_candidates(url, title, town)
    raw, kind, final = audit.public_get(url, 6_000_000)
    if 'html' not in kind:
        return []
    soup = BeautifulSoup(raw, 'html.parser')
    heading = ' '.join(n.get_text(' ', strip=True) for n in soup.select('h1')[:3])
    text = raw.decode('utf-8', 'replace').replace('\\/', '/').replace('&amp;', '&')
    # Include original image URLs in hydration data and video posters, which may
    # not exist in server-rendered img elements. No candidate is auto-approved.
    for match in re.finditer(r'https?://[^\s\"<>\\]{10,}', text):
        image = match.group(0).rstrip("',);}")
        if not re.search(r'\.(?:jpe?g|webp|png|avif)(?:\?|$)|images\.prismic\.io|cdn\.sanity\.io/images|datocms-assets', image, re.I):
            continue
        nearby = text[max(0, match.start()-240):match.end()+240]
        identity = audit.norm(unquote(image))
        specific = branch.tokens(title)
        score = sum(3 for token in specific if audit.norm(token) in identity)
        if audit.norm(town) and len(audit.norm(town)) > 3 and audit.norm(town) in identity:
            score += 8
        if re.search('hero|gallery|carousel|venue|banner|interior|exterior|poster', nearby, re.I):
            score += 4
        items.append({'url': image, 'alt': '', 'sourcePage': final, 'pageHeading': heading,
                      'heuristicScore': score, 'extraction': 'page hydration or image data'})
    output, seen = [], set()
    for item in sorted(items, key=lambda i: i.get('heuristicScore', 0), reverse=True):
        image = item['url']
        if BAD.search(unquote(image) + ' ' + item.get('alt', '')):
            continue
        base = urlsplit(image)._replace(query='', fragment='').geturl()
        if base in seen:
            continue
        seen.add(base)
        output.append(item)
        if len(output) >= 18:
            break
    return output

branch.links_at = links_at
branch.candidates_at = candidates_at

if __name__ == '__main__':
    try:
        branch.main()
    except Exception as error:
        (OUT / 'error.json').write_text(json.dumps({'error': str(error), 'mutations': 0}))
        print(str(error))
        raise SystemExit(1)
