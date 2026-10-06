"""Read-only media/source audit for the owner-approved image recovery list.

This utility never patches CMS data, uploads media, publishes, or changes routes.
Only compact public photo metadata and review thumbnails enter the run artifact.
An existing Wix API key is used only against the two explicitly allowed read APIs.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import io
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
import threading
import time
from urllib.parse import urljoin, urlsplit, urlunsplit

import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageFont, ImageOps

SITE = '517c2402-3182-4b3f-a2f1-be5611e7e22f'
OUT = Path('image-clearance-review')
OUT.mkdir(exist_ok=True)
(OUT / 'thumbs').mkdir(exist_ok=True)
KEY = os.environ.get('WIX_CLI_API_KEY', '')
UA = 'SpinRaiders-OwnerImageAudit/1.0 (+https://www.spin-raiders.com/)'
LOCK = threading.Lock()
HOST_LOCKS: dict[str, threading.Semaphore] = {}
READ_PATHS = {
    '/wix-data/v2/items/query': 'POST',
    '/site-media/v1/files/search': 'POST',
}
FIELDS = [
    'title', 'locationName', 'heroImage', 'mainImage', 'image', 'imageResearchStatus',
    'imageRightsStatus', 'imageCredit', 'imageAltText', 'imageSourceUrl',
    'imageSourceUrls', 'exteriorPhotoSource', 'heroImageBackup20261005',
    'galleryImage1', 'galleryImage2', 'interiorGallery', 'shortUrl', 'slug',
    'website', 'websiteUrl', 'officialWebsite', 'officialWebsiteUrl', 'sourceUrl',
    'bookingUrl', 'ticketUrl', 'externalUrl', '_updatedDate',
]


def norm(value: str) -> str:
    return re.sub('[^a-z0-9]', '', str(value).lower())


def title_hash(value: str) -> int:
    result = 2166136261
    for char in norm(value):
        result = ((result ^ ord(char)) * 16777619) & 0xffffffff
    return result


def wix_read(path: str, body: dict) -> dict:
    if not KEY:
        raise RuntimeError('Existing Wix read credential unavailable; no site data changed')
    if path not in READ_PATHS:
        raise ValueError('Not an allowlisted read endpoint')
    response = requests.post(
        'https://www.wixapis.com' + path,
        headers={'Authorization': KEY, 'wix-site-id': SITE},
        json=body, timeout=40,
    )
    if response.status_code != 200:
        raise RuntimeError(f'Wix read returned HTTP {response.status_code}')
    return response.json()


def image_url(value) -> str:
    if isinstance(value, dict):
        value = value.get('url', '')
    value = str(value or '')
    if value.startswith('wix:image://v1/'):
        return 'https://static.wixstatic.com/media/' + value.split('/')[3]
    return value


def media_id(value) -> str:
    match = re.search(r'(?:/media/|wix:image://v1/)([^/]+)', image_url(value))
    return match.group(1) if match else ''


def public_get(url: str, maximum: int = 8_000_000) -> tuple[bytes, str, str]:
    """No credentials/cookies, bounded content, public hosts and redirects only."""
    for _ in range(5):
        parsed = urlsplit(url)
        if parsed.scheme not in ('http', 'https') or not parsed.hostname:
            raise ValueError('Not a public web URL')
        if parsed.username or parsed.password or parsed.port not in (None, 80, 443):
            raise ValueError('Credentials or non-web port rejected')
        addresses = socket.getaddrinfo(parsed.hostname, parsed.port or 443)
        if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):
            raise ValueError('Non-public address rejected')
        with LOCK:
            gate = HOST_LOCKS.setdefault(parsed.hostname, threading.Semaphore(2))
        with gate:
            response = requests.get(url, headers={'User-Agent': UA}, timeout=(8, 15),
                                    allow_redirects=False, stream=True)
            if response.status_code in (301, 302, 303, 307, 308):
                url = urljoin(url, response.headers.get('Location', ''))
                response.close()
                continue
            if response.status_code != 200:
                status = response.status_code
                response.close()
                raise RuntimeError(f'HTTP {status}')
            chunks, size = [], 0
            for chunk in response.iter_content(65536):
                size += len(chunk)
                if size > maximum:
                    response.close()
                    raise ValueError('Content exceeds audit size limit')
                chunks.append(chunk)
            content_type = response.headers.get('Content-Type', '')
            response.close()
            return b''.join(chunks), content_type, url
    raise RuntimeError('Too many redirects')


def thumbnail(url: str, key: str) -> dict:
    raw, content_type, final_url = public_get(url)
    with Image.open(io.BytesIO(raw)) as original:
        if original.width * original.height > 45_000_000:
            raise ValueError('Image dimensions exceed audit limit')
        original.load()
        width, height = original.size
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((340, 210))
        canvas = Image.new('RGB', (340, 210), 'white')
        canvas.paste(image, ((340 - image.width) // 2, (210 - image.height) // 2))
        path = OUT / 'thumbs' / (key + '.jpg')
        canvas.save(path, quality=85)
    return {'url': url, 'resolvedUrl': final_url, 'http': 200,
            'width': width, 'height': height, 'sha256': hashlib.sha256(raw).hexdigest(),
            'thumbnail': str(path.relative_to(OUT)), 'contentType': content_type}


def page_candidates(url: str, title: str, town: str) -> tuple[list[dict], str]:
    raw, content_type, final_url = public_get(url, maximum=5_000_000)
    if 'html' not in content_type.lower():
        return [], 'Not an HTML source page'
    soup = BeautifulSoup(raw, 'html.parser')
    heading = ' '.join(x.get_text(' ', strip=True) for x in soup.select('h1')[:2])
    city = norm(town)
    meaningful = [x for x in re.findall('[a-z0-9]+', title.lower())
                  if len(x) > 3 and x not in ('the', 'with', 'from', 'centre', 'center',
                     'arcade', 'arcades', 'adventure', 'entertainment', 'park')]
    images = []
    for node in soup.select('img, meta[property="og:image"], meta[name="twitter:image"]'):
        raw_url = (node.get('data-src') or node.get('data-lazy-src') or node.get('src')
                   or node.get('content') or '')
        srcset = node.get('data-srcset') or node.get('srcset') or ''
        if srcset:
            parts = [part.strip().split()[0] for part in srcset.split(',') if part.strip()]
            if parts:
                raw_url = parts[-1]
        candidate_url = urljoin(final_url, raw_url)
        alt = node.get('alt', '')
        text = candidate_url + ' ' + alt
        if not raw_url or not candidate_url.startswith(('http://', 'https://')):
            continue
        if re.search(r'logo|sprite|icon|placeholder|favicon|\.svg(?:\?|$)|\.gif(?:\?|$)', text, re.I):
            continue
        score = sum(2 for token in meaningful if token in norm(text))
        if city and len(city) >= 4 and city in norm(text):
            score += 8
        if node.name == 'meta':
            score += 3
        if re.search(r'hero|banner|venue|exterior|interior|gallery', str(node.get('class', '')) + text, re.I):
            score += 2
        if city and city in norm(heading):
            score += 2
        images.append({'url': candidate_url, 'alt': alt, 'sourcePage': final_url,
                       'pageHeading': heading, 'heuristicScore': score})
    dedup = {item['url']: item for item in sorted(images, key=lambda x: x['heuristicScore'])}
    return sorted(dedup.values(), key=lambda x: x['heuristicScore'], reverse=True)[:5], heading


def source_pages(data: dict) -> list[str]:
    values = []
    for key in ('officialWebsiteUrl', 'officialWebsite', 'websiteUrl', 'website',
                'imageSourceUrl', 'exteriorPhotoSource', 'sourceUrl', 'bookingUrl'):
        value = data.get(key)
        if isinstance(value, str):
            values.append(value)
    values.extend(x for x in data.get('imageSourceUrls', []) if isinstance(x, str))
    output = []
    for value in values:
        parsed = urlsplit(value)
        if parsed.scheme not in ('https', 'http') or not parsed.hostname:
            continue
        if re.search(r'google\.|facebook\.|instagram\.|unsplash|oaiusercontent|wixstatic|\.jpg|\.jpeg|\.png|\.webp', value, re.I):
            continue
        if value not in output:
            output.append(value)
    return output[:2]


def inspect(item: dict, catalogue: dict) -> dict:
    data = item['data']
    title, town = data.get('title', ''), data.get('locationName', '')
    key = item['collection'] + '-' + str(title_hash(title))
    url = image_url(data.get('heroImage') or data.get('image') or data.get('mainImage'))
    descriptor = catalogue.get(media_id(url), {})
    result = {'collection': item['collection'], 'id': item['id'], 'title': title, 'town': town,
              'currentImage': url, 'mediaStatus': descriptor.get('operationStatus'),
              'mediaName': descriptor.get('displayName'), 'originalSource': descriptor.get('sourceUrl'),
              'oldImageFlag': data.get('imageResearchStatus'), 'sourcePages': source_pages(data),
              'candidateStatus': 'UNREVIEWED: heuristic candidates are not approved replacements'}
    try:
        result['currentDownload'] = thumbnail(url, key + '-current')
    except Exception as error:
        result['currentError'] = str(error)
    candidates = []
    result['pageErrors'] = []
    for page_url in result['sourcePages']:
        try:
            found, heading = page_candidates(page_url, title, town)
            candidates.extend(found)
        except Exception as error:
            result['pageErrors'].append({'url': page_url, 'error': str(error)})
    candidates.sort(key=lambda x: x['heuristicScore'], reverse=True)
    seen = set()
    result['candidates'] = []
    for candidate in candidates:
        if candidate['url'] in seen:
            continue
        seen.add(candidate['url'])
        try:
            download = thumbnail(candidate['url'], key + '-candidate-' + str(len(result['candidates'])))
            if download['width'] < 400 or download['height'] < 200:
                continue
            candidate['download'] = download
            result['candidates'].append(candidate)
            if len(result['candidates']) == 2:
                break
        except Exception as error:
            candidate['error'] = str(error)
    return result


def contact_sheets(records: list[dict]) -> None:
    font = ImageFont.load_default(size=16)
    entries = []
    for number, record in enumerate(records, 1):
        current = record.get('currentDownload', {})
        entries.append((number, 'CURRENT', record, current))
        for index, candidate in enumerate(record.get('candidates', []), 1):
            entries.append((number, 'CANDIDATE ' + str(index), record, candidate.get('download', {})))
    for page in range(0, len(entries), 20):
        sheet = Image.new('RGB', (1400, 1550), 'white')
        draw = ImageDraw.Draw(sheet)
        for index, (number, kind, record, download) in enumerate(entries[page:page + 20]):
            x, y = (index % 4) * 350, (index // 4) * 310
            path = OUT / download.get('thumbnail', 'absent')
            if path.is_file():
                with Image.open(path) as thumb:
                    sheet.paste(thumb, (x + 5, y + 5))
            label = f'{number} {kind}\n{record["title"]}\n{record["town"]}'
            lines = []
            for line in label.splitlines():
                while len(line) > 38:
                    lines.append(line[:38])
                    line = line[38:]
                lines.append(line)
            draw.multiline_text((x + 5, y + 218), '\n'.join(lines[:5]), font=font, fill='black', spacing=2)
        sheet.save(OUT / f'review-{page // 20 + 1:03d}.jpg', quality=88)


def main() -> None:
    targets = json.loads(Path('research/image-clearance-targets-20261006.json').read_text())
    records = []
    for collection, hashes in targets.items():
        wanted, offset = set(hashes), 0
        while True:
            result = wix_read('/wix-data/v2/items/query', {
                'dataCollectionId': collection, 'consistentRead': True, 'returnTotalCount': True,
                'query': {'fields': FIELDS, 'paging': {'limit': 100, 'offset': offset}},
            })
            page = result.get('dataItems', [])
            records.extend({'collection': collection, 'id': item['id'], 'data': item['data']}
                           for item in page if title_hash(item['data'].get('title', '')) in wanted)
            offset += len(page)
            if not page or offset >= result['pagingMetadata']['total']:
                break
    catalogue, cursor = {}, None
    while True:
        paging = {'limit': 100}
        if cursor:
            paging['cursor'] = cursor
        result = wix_read('/site-media/v1/files/search', {
            'rootFolder': 'MEDIA_ROOT', 'mediaTypes': ['IMAGE'], 'paging': paging,
        })
        catalogue.update({item['id']: item for item in result.get('files', [])})
        cursor = result.get('nextCursor', {}).get('cursors', {}).get('next')
        if not cursor:
            break
    print(f'Read {len(records)} matching CMS records and {len(catalogue)} media descriptors. No writes enabled.')
    reviewed = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(inspect, item, catalogue): item for item in records}
        for future in concurrent.futures.as_completed(futures):
            item = futures[future]
            try:
                reviewed.append(future.result())
            except Exception as error:
                reviewed.append({'collection': item['collection'], 'id': item['id'],
                                 'title': item['data'].get('title', ''), 'town': '', 'error': str(error)})
            if len(reviewed) % 25 == 0:
                print(f'Review downloads processed: {len(reviewed)}/{len(records)}')
                (OUT / 'records.json').write_text(json.dumps(reviewed, indent=2))
    reviewed.sort(key=lambda x: (x['collection'], x['title']))
    counts = {}
    for record in reviewed:
        for candidate in record.get('candidates', []):
            digest = candidate['download']['sha256']
            counts.setdefault(digest, set()).add(norm(record['title']))
    for record in reviewed:
        for candidate in record.get('candidates', []):
            candidate['distinctVenueReuseCount'] = len(counts[candidate['download']['sha256']])
    (OUT / 'records.json').write_text(json.dumps(reviewed, indent=2))
    summary = {'readAtUnix': time.time(), 'matchedRecords': len(records), 'catalogueImages': len(catalogue),
               'imageDownloadsOk': sum('currentDownload' in row for row in reviewed),
               'imageDownloadsFailed': sum('currentError' in row for row in reviewed),
               'recordsWithCandidates': sum(bool(row.get('candidates')) for row in reviewed),
               'mutations': 0, 'note': 'Read-only audit. Candidate identity, rights and final public rendering need human/assistant review.'}
    (OUT / 'summary.json').write_text(json.dumps(summary, indent=2))
    contact_sheets(reviewed)
    print(json.dumps(summary))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        (OUT / 'error.json').write_text(json.dumps({'error': str(error), 'mutations': 0}))
        print(f'Read-only audit stopped: {error}')
        raise SystemExit(1)
