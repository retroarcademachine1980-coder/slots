"""Discover public official branch photos for the existing owner-approved list.
Read-only: no uploads, CMS changes, route changes or publication are possible.
All candidates remain unapproved until identity and image review are completed.
"""
from __future__ import annotations
import concurrent.futures
import json
from pathlib import Path
import re
from urllib.parse import urljoin, urlsplit, unquote
from bs4 import BeautifulSoup
import image_clearance_readonly_20261006 as audit

ROOTS = {
    'Lane7': 'https://lane7.com/venues/',
    'Roxy': 'https://roxyleisure.co.uk/',
    'TeamSport': 'https://www.team-sport.co.uk/',
    'Go Ape': 'https://goape.co.uk/locations/',
    'AirHop': 'https://www.airhop.co.uk/',
    'Flip Out': 'https://www.flipout.co.uk/',
}
EXTRAS = [
    ('Jurassic Pier', 'Clacton-on-Sea', 'https://www.clactonpier.co.uk/', 'https://static.wixstatic.com/media/3a517e_0771c809661c49c5b02da3cccb2a5746~mv2.jpg'),
    ('Carousel Amusements - Newquay', 'Newquay', 'https://www.visitnewquay.org/things-to-do/carousel-amusements-p2967773', 'https://static.wixstatic.com/media/3a517e_3a1b91d03248490da8c0536afa41ac2b~mv2.jpg'),
    ('meetspaceVR ft Zero Latency', 'Birmingham', 'https://www.dayoutwiththekids.co.uk/attractions/meetspacevr-birmingham-zjej3r8f', 'https://static.wixstatic.com/media/3a517e_4866588b6c8043f7a41d3e93001f4a7a~mv2.png'),
    ('Thrill Coaster - O2', 'London', 'https://d2z0yci0zsgoy6.cloudfront.net/activities/thrill-coaster-o2-london-0.jpg', 'https://static.wixstatic.com/media/3a517e_482b140c30d24408a1c5721a4c13e36d~mv2.jpg'),
    ('Premier Amusements', 'Colwyn Bay', 'https://www.gonorthwales.co.uk/things-to-do/premier-amusement-arcade-p365821', ''),
]
OUT = Path('branch-image-review')
OUT.mkdir(exist_ok=True)
(OUT / 'thumbs').mkdir(exist_ok=True)
audit.OUT = OUT
STOP = {'the','at','and','of','uk','kent','room','ball','lanes','lane7','roxy','go','ape','teamsport','airhop','flip','out'}


def tokens(text):
    return [t for t in re.findall('[a-z0-9]+', str(text).lower()) if t not in STOP and len(t) > 2]


def links_at(root):
    raw, kind, final = audit.public_get(root, 5_000_000)
    if 'html' not in kind:
        raise ValueError('Directory did not return HTML')
    soup = BeautifulSoup(raw, 'html.parser')
    host = urlsplit(final).hostname.removeprefix('www.')
    links = {}
    for element in soup.find_all(True):
        for key in ('href', 'data-url', 'data-href', 'data-link'):
            value = element.get(key)
            if not isinstance(value, str):
                continue
            url = urljoin(final, value).split('#')[0]
            if not url.startswith(('http://', 'https://')):
                continue
            parsed = urlsplit(url)
            if parsed.hostname and parsed.hostname.removeprefix('www.') == host and parsed.path not in ('', '/'):
                links[url] = element.get_text(' ', strip=True)[:140]
    text = raw.decode('utf-8', 'replace').replace('\\/', '/')
    for value in re.findall(r'https?://[^\s\"<>]+', text):
        url = value.split('#')[0].rstrip("',);")
        parsed = urlsplit(url)
        if parsed.hostname and parsed.hostname.removeprefix('www.') == host and re.search(r'/(venue|location|go-karting|adventure-trampoline-park)', parsed.path):
            links.setdefault(url, '')
    return links


def discover_pages(item, directories):
    family = item['family']
    title, town = item['title'], item['town']
    specific = tokens(title)
    scored = []
    for url, label in directories.get(family, {}).items():
        path = unquote(urlsplit(url).path).lower()
        if re.search(r'blog|news|faq|party|group|offer|careers|membership|privacy|christmas|product|book', path):
            continue
        text = audit.norm(path + ' ' + label)
        matches = sum(audit.norm(token) in text for token in specific)
        if not matches:
            continue
        score = matches / max(len(specific), 1) * 20
        if audit.norm(town) and audit.norm(town) in text:
            score += 5
        if re.search(r'/(venue|location|go-karting|adventure-trampoline-park)', path):
            score += 5
        if matches >= max(1, len(specific) - 1):
            scored.append((score, url, label))
    scored.sort(reverse=True)
    if not scored:
        return []
    return [{'url': url, 'linkLabel': label, 'score': score}
            for score, url, label in scored[:2] if score >= scored[0][0] - 2]


def candidates_at(url, title, town):
    raw, kind, final = audit.public_get(url, 5_000_000)
    if 'html' not in kind:
        return []
    soup = BeautifulSoup(raw, 'html.parser')
    heading = ' '.join(h.get_text(' ', strip=True) for h in soup.select('h1')[:3])
    rows = []
    for element in soup.find_all(True):
        values = []
        if element.name == 'img':
            values.append(element.get('data-src') or element.get('data-lazy-src') or element.get('src'))
            srcset = element.get('data-srcset') or element.get('srcset') or ''
            values.extend(part.strip().split()[0] for part in srcset.split(',') if part.strip())
        if element.name == 'meta' and element.get('property') in ('og:image', 'og:image:url'):
            values.append(element.get('content'))
        if element.name == 'video':
            values.append(element.get('poster'))
        for key in ('data-bg', 'data-background', 'data-background-image'):
            values.append(element.get(key))
        values.extend(re.findall(r'url\([\"\x27]?([^\)\"\x27]+)', element.get('style', '')))
        for value in values:
            if not value or not isinstance(value, str):
                continue
            image = urljoin(final, value)
            if not image.startswith(('http://', 'https://')):
                continue
            alt = element.get('alt', '')
            matchtext = image + ' ' + alt
            if re.search(r'logo|sprite|icon|placeholder|favicon|\.svg(?:\?|$)|\.gif(?:\?|$)|facebook\.com/tr|pixel', matchtext, re.I):
                continue
            identity = audit.norm(matchtext)
            specific = tokens(title)
            score = sum(3 for token in specific if audit.norm(token) in identity)
            if audit.norm(town) and len(audit.norm(town)) > 3 and audit.norm(town) in identity:
                score += 8
            if element.name in ('video', 'meta'):
                score += 3
            if re.search('hero|venue|interior|exterior|gallery|bowling|trampoline|kart', matchtext, re.I):
                score += 2
            parent = element.find_parent(['figure', 'article'])
            caption = parent.get_text(' ', strip=True)[:250] if parent else ''
            rows.append({'url': image, 'alt': alt, 'sourcePage': final, 'pageHeading': heading,
                         'caption': caption, 'heuristicScore': score})
    seen = set()
    output = []
    for row in sorted(rows, key=lambda row: row['heuristicScore'], reverse=True):
        base = row['url'].split('?')[0]
        if base not in seen:
            seen.add(base)
            output.append(row)
    return output[:10]


def inspect(item, directories):
    result = dict(item)
    result['sourcePages'] = discover_pages(item, directories) if item.get('family') else [{'url': item['source']}]
    result['candidates'] = []
    result['errors'] = []
    key = str(audit.title_hash(item['title']))
    if item.get('existingCandidate'):
        try:
            result['candidates'].append({'url': item['existingCandidate'], 'sourcePage': item['source'],
                                         'download': audit.thumbnail(item['existingCandidate'], key + '-saved')})
        except Exception as error:
            result['errors'].append(str(error))
    available = []
    for page in result['sourcePages']:
        try:
            available.extend(candidates_at(page['url'], item['title'], item['town']))
        except Exception as error:
            result['errors'].append({'url': page['url'], 'error': str(error)})
    seen = set()
    for candidate in sorted(available, key=lambda c: c['heuristicScore'], reverse=True):
        if candidate['url'] in seen:
            continue
        seen.add(candidate['url'])
        try:
            info = audit.thumbnail(candidate['url'], key + '-branch-' + str(len(result['candidates'])))
            if info['width'] < 500 or info['height'] < 240:
                continue
            candidate['download'] = info
            result['candidates'].append(candidate)
            if len(result['candidates']) >= 3:
                break
        except Exception as error:
            result['errors'].append({'url': candidate['url'], 'error': str(error)})
    result['status'] = 'CANDIDATES ONLY; NOT APPROVED; NO CMS CHANGES'
    return result


def main():
    targets = json.loads(Path('research/image-clearance-targets-20261006.json').read_text())
    selected = []
    for collection in ('Venues', 'NearbyAttractions'):
        offset = 0
        while True:
            result = audit.wix_read('/wix-data/v2/items/query', {
                'dataCollectionId': collection, 'consistentRead': True, 'returnTotalCount': True,
                'query': {'filter': {'$or': [{'title': {'$contains': family}} for family in ROOTS]},
                          'fields': ['title', 'locationName'], 'paging': {'limit': 100, 'offset': offset}}})
            page = result.get('dataItems', [])
            for row in page:
                data = row['data']
                family = next((name for name in ROOTS if data.get('title', '').lower().startswith(name.lower())), None)
                if family and audit.title_hash(data['title']) in targets[collection]:
                    selected.append({'collection': collection, 'id': row['id'], 'family': family,
                                     'title': data['title'], 'town': data.get('locationName', '')})
            offset += len(page)
            if not page or offset >= result['pagingMetadata']['total']:
                break
    directories = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(links_at, root): family for family, root in ROOTS.items()}
        for future in concurrent.futures.as_completed(futures):
            family = futures[future]
            try:
                directories[family] = future.result()
                print(f'{family}: {len(directories[family])} discovered links')
            except Exception as error:
                directories[family] = {}
                print(f'{family}: source unavailable: {error}')
    selected.extend({'title': title, 'town': town, 'source': source, 'existingCandidate': image}
                    for title, town, source, image in EXTRAS)
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(inspect, item, directories): item for item in selected}
        for future in concurrent.futures.as_completed(futures):
            item = futures[future]
            try:
                results.append(future.result())
            except Exception as error:
                results.append({**item, 'error': str(error)})
            if len(results) % 15 == 0:
                print(f'Processed {len(results)}/{len(selected)} branch source checks')
                (OUT / 'records.json').write_text(json.dumps(results, indent=2))
    results.sort(key=lambda row: row['title'])
    reused = {}
    for row in results:
        for candidate in row.get('candidates', []):
            reused.setdefault(candidate['download']['sha256'], set()).add(audit.norm(row['title']))
    for row in results:
        for candidate in row.get('candidates', []):
            candidate['distinctVenueReuseCount'] = len(reused[candidate['download']['sha256']])
    (OUT / 'records.json').write_text(json.dumps(results, indent=2))
    audit.contact_sheets(results)
    summary = {'records': len(results), 'withCandidates': sum(bool(r.get('candidates')) for r in results),
               'mutations': 0, 'status': 'Independent visual review and exact-venue verification required'}
    (OUT / 'summary.json').write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        (OUT / 'error.json').write_text(json.dumps({'error': str(error), 'mutations': 0}))
        print(str(error))
        raise SystemExit(1)
