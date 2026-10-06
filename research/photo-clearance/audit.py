"""Read-only evidence collection. Never uploads, patches CMS or publishes Wix."""
import concurrent.futures as cf
import hashlib
import io
import json
import re
import threading
import time
import urllib.parse as up
import urllib.robotparser
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageOps

OUT = Path('photo-evidence')
OUT.mkdir(exist_ok=True)
(OUT / 'images').mkdir(exist_ok=True)
START = time.monotonic()
DEADLINE = START + 900
UA = 'SpinRaidersPhotoAudit/1.0 (+https://www.spin-raiders.com)'
LOCK = threading.Lock()
HOST_LOCKS = {}
HOST_NEXT = {}
CACHE = {}
ROBOTS = {}
ERRORS = []


def norm(value):
    return re.sub(r'[^a-z0-9]+', ' ', str(value or '').lower()).strip()


def words(value):
    return set(norm(value).split())


def http(url, image=False):
    if time.monotonic() > DEADLINE:
        raise TimeoutError('Audit time budget reached')
    parts = up.urlsplit(url)
    if parts.scheme not in ('https', 'http') or not parts.hostname:
        raise ValueError('Not a public HTTP URL')
    host = parts.hostname.lower()
    if host in ('localhost', '127.0.0.1', '169.254.169.254') or re.match(r'^\d+\.\d+\.\d+\.\d+$', host):
        raise ValueError('IP-address URL excluded')
    with LOCK:
        gate = HOST_LOCKS.setdefault(host, threading.Lock())
    with gate:
        time.sleep(max(0, HOST_NEXT.get(host, 0) - time.monotonic()))
        HOST_NEXT[host] = time.monotonic() + (0.15 if image else 0.8)
    response = requests.get(url, headers={'User-Agent': UA}, timeout=(8, 18), stream=True)
    response.raise_for_status()
    chunks = []
    size = 0
    for chunk in response.iter_content(65536):
        size += len(chunk)
        if size > (18000000 if image else 5000000):
            response.close()
            raise ValueError('Response exceeds size limit')
        chunks.append(chunk)
    return response.url, b''.join(chunks), response.headers.get('Content-Type', '')


def allowed(url):
    p = up.urlsplit(url)
    base = p.scheme + '://' + p.netloc
    with LOCK:
        cached = ROBOTS.get(base)
    if cached is None:
        parser = urllib.robotparser.RobotFileParser()
        try:
            _, raw, _ = http(base + '/robots.txt')
            parser.parse(raw.decode('utf-8', 'replace').splitlines())
            cached = parser
        except requests.HTTPError as exc:
            code = exc.response.status_code
            cached = True if code == 404 else False
        except Exception:
            cached = False
        with LOCK:
            ROBOTS[base] = cached
    return cached if isinstance(cached, bool) else cached.can_fetch(UA, url)


def page(url):
    with LOCK:
        cached = CACHE.get(url)
    if cached is not None:
        return cached
    result = {'url': url, 'images': [], 'links': []}
    try:
        if not allowed(url):
            raise ValueError('Robots policy unavailable or disallows this page')
        final, raw, content_type = http(url)
        if 'html' not in content_type:
            raise ValueError('Not an HTML source page')
        soup = BeautifulSoup(raw, 'html.parser')
        result['url'] = final
        result['title'] = soup.title.get_text(' ', strip=True) if soup.title else ''
        result['headings'] = [h.get_text(' ', strip=True) for h in soup.select('h1,h2')][:12]
        if re.search(r'just a moment|one moment, please|verify you are human|access denied', result['title'], re.I):
            raise ValueError('Access challenge; not bypassed')
        candidates = []
        for tag in soup.select('img'):
            src = tag.get('data-src') or tag.get('data-lazy-src') or tag.get('src') or ''
            srcset = tag.get('data-srcset') or tag.get('srcset') or ''
            if srcset and not 'data:' in srcset:
                options = re.findall(r'(\S+)\s+(\d+)w', srcset)
                choices = [(int(width), address) for address, width in options if int(width) <= 2000]
                if choices:
                    src = max(choices)[1]
            src = up.urljoin(final, src)
            if not src.startswith(('http://', 'https://')):
                continue
            alt = str(tag.get('alt') or '')[:350]
            fig = tag.find_parent('figure')
            caption = fig.find('figcaption').get_text(' ', strip=True)[:350] if fig and fig.find('figcaption') else ''
            candidates.append({'url': src, 'alt': alt, 'caption': caption, 'kind': 'img'})
        meta = soup.find('meta', property='og:image')
        if meta and meta.get('content'):
            candidates.append({'url': up.urljoin(final, meta['content']), 'alt': '', 'caption': '', 'kind': 'og'})
        seen = set()
        for item in candidates:
            if item['url'] not in seen:
                result['images'].append(item)
                seen.add(item['url'])
        for tag in soup.select('a[href]'):
            href = up.urljoin(final, tag['href']).split('#')[0]
            if up.urlsplit(href).hostname == up.urlsplit(final).hostname and not re.search(r'\.(?:pdf|zip|mp4|jpg|png|webp)(?:\?|$)', href, re.I):
                result['links'].append({'url': href, 'text': tag.get_text(' ', strip=True)[:200]})
        result['links'] = list({item['url']: item for item in result['links']}.values())
    except Exception as exc:
        result['error'] = str(exc)[:300]
    with LOCK:
        CACHE[url] = result
    return result


def image_url(value):
    if isinstance(value, dict):
        value = value.get('url') or value.get('src') or ''
    if not isinstance(value, str):
        return ''
    if value.startswith('wix:image://v1/'):
        return 'https://static.wixstatic.com/media/' + value[15:].split('/')[0]
    return value if value.startswith(('https://', 'http://')) else ''


def photo(url):
    result = {'url': url}
    try:
        final, raw, _ = http(url, image=True)
        im = Image.open(io.BytesIO(raw))
        im.load()
        im = ImageOps.exif_transpose(im).convert('RGB')
        result.update(width=im.width, height=im.height, sha256=hashlib.sha256(raw).hexdigest(), resolved_url=final)
        small = im.resize((16, 16), Image.Resampling.LANCZOS)
        result['fingerprint'] = list(small.getdata())
        im.thumbnail((900, 650), Image.Resampling.LANCZOS)
        name = hashlib.sha256(url.encode()).hexdigest()[:20] + '.jpg'
        im.save(OUT / 'images' / name, quality=85)
        result['file'] = 'images/' + name
    except Exception as exc:
        result['error'] = str(exc)[:300]
    return result


FIELDS = ['title','locationName','heroImage','mainImage','image','cardImage','coverImage','exteriorImage','heroImageBackup20261005','galleryImage1','galleryImage2','imageResearchStatus','imageVerified','imageRightsStatus','imageCredit','imageSourceUrl','imageSourceUrls','exteriorPhotoSource','shortUrl','slug','website','officialWebsite','sourceUrl','imageAltText','exteriorImageAlt']
response = requests.post('https://www.wixapis.com/oauth2/token', json={'clientId': '5296d1b3-888a-4d2e-bdd2-a8a8dd0018d8', 'grantType': 'anonymous'}, timeout=30)
response.raise_for_status()
token = response.json()['access_token']
headers = {'Authorization': token, 'Content-Type': 'application/json'}
records = []
for collection in ['Venues', 'NearbyAttractions', 'HotelGuides']:
    offset = 0
    while True:
        body = {'dataCollectionId': collection, 'query': {'fields': FIELDS, 'paging': {'limit': 100, 'offset': offset}}, 'returnTotalCount': True}
        response = requests.post('https://www.wixapis.com/wix-data/v2/items/query', headers=headers, json=body, timeout=40)
        response.raise_for_status()
        data = response.json()
        batch = data.get('dataItems', [])
        for item in batch:
            records.append({'collection': collection, 'id': item['id'], **item['data']})
        offset += len(batch)
        if not batch or offset >= data.get('pagingMetadata', {}).get('total', offset + 1):
            break
    print('Read public collection', collection, offset, flush=True)

old_targets = json.loads(Path('backups/photo-audit-cards-20261006.json').read_text())
target_ids = {item['id'] for item in old_targets if isinstance(item, dict) and item.get('id')}
selected = [item for item in records if item['id'] in target_ids or re.search(r'illustrative|stock|town photo|name card|recovered|imported 2026-10-06', str(item.get('imageResearchStatus', '')), re.I)]
# This is evidence gathering, not automatic approval. Local comparison supplies the exact original row scope.
(OUT / 'public_records.json').write_text(json.dumps(records, ensure_ascii=False))
(OUT / 'selected_records.json').write_text(json.dumps(selected, ensure_ascii=False))
print('Selected records for evidence', len(selected), flush=True)

media_ids = []
for item in selected:
    current = next((image_url(item.get(key)) for key in ['heroImage','mainImage','image','cardImage','coverImage','exteriorImage'] if image_url(item.get(key))), '')
    item['current_url'] = current
    match = re.search(r'static\.wixstatic\.com/media/([^/]+)', current)
    if match:
        media_ids.append(match.group(1))
media_ids = list(dict.fromkeys(media_ids))
media = {}
for start in range(0, len(media_ids), 100):
    response = requests.post('https://www.wixapis.com/site-media/v1/files/get-files', headers=headers, json={'fileIds': media_ids[start:start+100]}, timeout=40)
    if response.status_code in (401, 403):
        ERRORS.append('Public Media Manager descriptor permission unavailable; no access bypass attempted')
        break
    if not response.ok:
        ERRORS.append('Media descriptor request failed: ' + str(response.status_code))
        break
    for item in response.json().get('files', []):
        media[item['id']] = {key: item.get(key) for key in ['id','displayName','url','sourceUrl','operationStatus','sizeInBytes']}
(OUT / 'media.json').write_text(json.dumps(media, ensure_ascii=False))
headers = None
token = None

SEEDS = {'teamsport': 'https://www.team-sport.co.uk/go-kart-tracks', 'lane7': 'https://lane7.com/', 'roxy': 'https://roxyleisure.co.uk/venues/'}
seed_pages = {key: page(url) for key, url in SEEDS.items()}
STOP = {'the','and','at','in','of','uk','arcade','arcades','centre','center','leisure','amusements','london','upon','on','room','ball','lanes','active','max','entertainment'}
BAD_IMAGE = re.compile(r'logo|icon|sprite|avatar|placeholder|trustpilot|tripadvisor|rating|payment|\.svg(?:\?|$)|track.map|map.of', re.I)
BAD_PAGE = re.compile(r'google\.com|facebook\.com|instagram\.com|tripadvisor\.|youtube\.com|spin-raiders\.com|unsplash\.com|maps\.', re.I)


def inspect(item):
    result = {'collection': item['collection'], 'id': item['id'], 'title': item.get('title'), 'town': item.get('locationName'), 'current_url': item['current_url'], 'candidates': [], 'source_pages': []}
    try:
        title_words = words(item.get('title')) - STOP
        town_words = words(item.get('locationName')) - STOP
        required = title_words | town_words
        urls = []
        for field in ['website','officialWebsite','sourceUrl','imageSourceUrl','exteriorPhotoSource']:
            value = item.get(field)
            if isinstance(value, str) and value.startswith(('http://','https://')) and not BAD_PAGE.search(value) and not re.search(r'\.(jpg|jpeg|png|webp)(\?|$)|static.wixstatic.com/media/', value, re.I):
                urls.append(value)
        for family, seed in seed_pages.items():
            if family in norm(item.get('title')):
                ranked = []
                for link in seed.get('links', []):
                    present = words(up.unquote(link['url']) + ' ' + link['text'])
                    score = len(required & present)
                    if score >= min(2, len(required)) and (not town_words or town_words <= present):
                        ranked.append((score, link['url']))
                urls = [url for _, url in sorted(ranked, reverse=True)[:1]] + urls
        urls = list(dict.fromkeys(urls))[:2]
        for url in urls:
            evidence = page(url)
            result['source_pages'].append({key: evidence.get(key) for key in ['url','title','headings','error']})
            if evidence.get('error'):
                continue
            context = words(evidence.get('title', '') + ' ' + ' '.join(evidence.get('headings', [])) + ' ' + up.unquote(evidence['url']))
            if town_words and not town_words <= context:
                # Follow one exact locality link, rather than use generic chain imagery.
                links = []
                for link in evidence.get('links', []):
                    present = words(up.unquote(link['url']) + ' ' + link['text'])
                    if town_words <= present:
                        links.append((len(required & present), link['url']))
                if links:
                    evidence = page(max(links)[1])
                    result['source_pages'].append({key: evidence.get(key) for key in ['url','title','headings','error']})
                    context = words(evidence.get('title', '') + ' ' + ' '.join(evidence.get('headings', [])) + ' ' + up.unquote(evidence['url']))
            for candidate in evidence.get('images', []):
                label = candidate.get('alt', '') + ' ' + candidate.get('caption', '') + ' ' + up.unquote(up.urlsplit(candidate['url']).path)
                if BAD_IMAGE.search(label) or re.search(r'unsplash|pexels|pixabay|oaiusercontent', candidate['url'], re.I):
                    continue
                present = words(label)
                explicit = len(required & present)
                if explicit == 0:
                    continue
                source_scope = len(required & context)
                if town_words and not town_words <= context:
                    continue
                score = explicit * 4 + source_scope
                if candidate['kind'] == 'og':
                    score -= 2
                result['candidates'].append({**candidate, 'source_page': evidence['url'], 'page_title': evidence.get('title'), 'score': score, 'explicit_words': sorted(required & present), 'review_status': 'UNAPPROVED_CANDIDATE'})
        result['candidates'] = sorted({c['url']: c for c in result['candidates']}.values(), key=lambda c: c['score'], reverse=True)[:2]
        media_id = re.search(r'static\.wixstatic\.com/media/([^/]+)', item['current_url'])
        if media_id and media_id.group(1) in media:
            result['current_original_source'] = media[media_id.group(1)].get('sourceUrl')
    except Exception as exc:
        result['error'] = str(exc)[:300]
    return result

results = []
with cf.ThreadPoolExecutor(max_workers=12) as pool:
    for index, result in enumerate(pool.map(inspect, selected)):
        results.append(result)
        if index % 50 == 0:
            print('Source records examined', index, flush=True)
(OUT / 'source_evidence.json').write_text(json.dumps(results, ensure_ascii=False))

image_urls = list(dict.fromkeys([r['current_url'] for r in results if r['current_url']] + [c['url'] for r in results for c in r['candidates']]))
photos = {}
with cf.ThreadPoolExecutor(max_workers=12) as pool:
    for index, result in enumerate(pool.map(photo, image_urls)):
        photos[result['url']] = result
        if index % 100 == 0:
            print('Images inspected', index, flush=True)
(OUT / 'photos.json').write_text(json.dumps(photos, ensure_ascii=False))
# No automated approval, CMS changes or inferred licence claims.
summary = {'records': len(records), 'selected': len(selected), 'source_records': len(results), 'candidate_records': sum(bool(r['candidates']) for r in results), 'images_requested': len(image_urls), 'images_downloaded': sum('file' in p for p in photos.values()), 'errors': ERRORS, 'seconds': round(time.monotonic()-START, 1), 'live_writes': 0, 'automatically_cleared': 0}
(OUT / 'summary.json').write_text(json.dumps(summary, indent=2))
print(json.dumps(summary), flush=True)
