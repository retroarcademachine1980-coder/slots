(function(){try{
(() => {
  'use strict';
  const GOV = 'https://www.gov.uk/government/statistics/weekly-road-fuel-prices';
  const num = value => Math.max(0, Number(value) || 0);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const safeUrl = value => { try { const u = new URL(value, location.origin); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } };
  const isStay = text => /hotel|holiday|accommodation|guest|b&b|self-catering|apartment|stay|lodge|cottage|\binn\b|caravan|glamping|room/i.test(text || '');
  const priceOf = text => { const m = String(text || '').replace(/,/g, '').match(/£\s*(\d+(?:\.\d+)?)/); return m ? Number(m[1]) : 0; };
  const expired = d => { if (!d) return false; const t = Date.parse(String(d.$date || d)); return !isNaN(t) && t < Date.now() - 864e5; };
  const railDate = value => { const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[3] + m[2] + m[1].slice(2) : ''; };
  let stationsPromise;
  const loadStations = () => stationsPromise ||= (async () => {
    const src = document.querySelector('script[src*="/dist/sr.core.min.js"], script[src*="/dist/sr.min.js"], script[src*="/dist/sr.js"]')?.src || '';
    const urls = [src ? src.replace(/\/dist\/sr(?:\.core)?(?:\.min)?\.js.*$/, '/dist/stations.json') : '', 'https://cdn.jsdelivr.net/gh/retroarcademachine1980-coder/slots@main/dist/stations.json'].filter(Boolean);
    for (const url of urls) { try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {} }
    return [];
  })();
  const norm = value => String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const PREFERRED = ['central', 'town', 'north', 'piccadilly', 'new street', 'lime street', 'temple meads', 'waverley', 'paragon', 'interchange'];
  function findStation(stations, text) {
    const q = norm(text).replace(/\b(station|railway|rail|train)\b/g, '').trim();
    if (!q || !stations.length) return null;
    const crs = stations.find(st => st[1].toLowerCase() === q);
    if (crs) return crs;
    const exact = stations.find(st => norm(st[0]) === q);
    if (exact) return exact;
    const starts = stations.filter(st => norm(st[0]).startsWith(q + ' '));
    if (starts.length) {
      for (const suffix of PREFERRED) { const hit = starts.find(st => norm(st[0]) === q + ' ' + suffix); if (hit) return hit; }
      return starts.sort((a, b) => a[0].length - b[0].length)[0];
    }
    const contains = stations.filter(st => norm(st[0]).includes(q));
    return contains.sort((a, b) => a[0].length - b[0].length)[0] || null;
  }
  const matchingStations = (stations, text) => { const q = norm(text); return q ? stations.filter(st => norm(st[0]).includes(q)).slice(0, 12) : []; };
  const CSS = `[data-extra-costs]{display:grid;gap:8px;margin-top:8px}
[data-extra-costs] label,[data-extra-costs] .row{display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:14px}
[data-extra-costs] input,[data-extra-costs] select{width:85px;border:1px solid #d2e2f6;border-radius:4px;padding:5px;text-align:right;font:inherit;font-size:14px}
[data-extra-costs] input[type=text]{width:150px;text-align:left}
[data-extra-costs] select[name=toStation]{width:190px;text-align:left}
[data-extra-costs] .row a,[data-hotel-offers]{font-size:13px;white-space:nowrap}
@media(max-width:600px){[data-extra-costs] label,[data-extra-costs] .row{flex-wrap:wrap}[data-extra-costs] input,[data-extra-costs] select{max-width:100%;font-size:16px}[data-extra-costs] .row a,[data-hotel-offers]{white-space:normal}}
[data-fuel-source]{margin:0;font-size:12px}
[data-fuel-refresh]{justify-self:start}
[data-stay-offers]{margin-top:10px;display:grid;gap:8px}
[data-stay-offers] h3{margin:0;font-size:14px}
[data-stay-offers] .offer{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;border:1px solid #d2e2f6;border-radius:8px;padding:8px 10px;font-size:13px}
[data-stay-offers] .offer strong{display:block;font-size:14px;line-height:1.2}
[data-stay-offers] .offer .price{font-weight:900;font-size:15px;text-align:right}
[data-stay-offers] .offer .actions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
[data-stay-offers] .offer button{border:1px solid #071b58;background:#071b58;color:#fff;border-radius:6px;padding:4px 9px;font:inherit;font-size:12px;cursor:pointer}
.stop [data-stop-price]{font-size:13px;font-weight:800;margin-left:6px}`;
  window.SR_TRIP_COSTS = (root, plan, recalculate, save, money) => {
    const budget = root.querySelector('.budget');
    if (!budget) return;
    plan.fuelType ||= 'petrol';
    plan.mpg = num(plan.mpg) || 40;
    if (!root.querySelector('#sr-trip-costs-css')) {
      const style = document.createElement('style');
      style.id = 'sr-trip-costs-css';
      style.textContent = CSS;
      budget.before(style);
    }
    let extras = root.querySelector('[data-extra-costs]');
    if (!extras) {
      extras = document.createElement('div');
      extras.dataset.extraCosts = '';
      budget.after(extras);
    }
    const startDate = root.querySelector('[name=start]')?.value || '';
    const endDate = root.querySelector('[name=end]')?.value || '';
    const people = num(plan.people) || 1;
    const rooms = num(plan.rooms) || 1;
    const towns = [...new Set(plan.stops.map(stop => (stop.town || (/town|destination/i.test(stop.category || '') ? stop.name : '')).trim()).filter(Boolean))];
    const firstTown = towns[0] || '';
    // Travelling from + train fares
    if (!extras.querySelector('[name="from"]')) {
      const row = document.createElement('label');
      row.innerHTML = 'Travelling from (town or station)<input type="text" name="from" maxlength="60" placeholder="e.g. Grimsby" list="sr-station-list" autocomplete="off">';
      extras.append(row);
      const dl = document.createElement('datalist'); dl.id = 'sr-station-list'; extras.append(dl);
      const to = document.createElement('label'); to.innerHTML = 'Arrive by train at<select name="toStation"><option value="">Choose station…</option></select>'; extras.append(to);
    }
    extras.querySelector('[name="from"]').value = plan.from || '';
    if (!root._stations) { root._stations = []; loadStations().then(list => { root._stations = list; recalculate(); }); }
    const stations = root._stations || [];
    const fromStation = findStation(stations, plan.from);
    const toSelect = extras.querySelector('[name="toStation"]');
    const candidates = matchingStations(stations, firstTown);
    const autoTo = findStation(stations, firstTown);
    if (plan.toStation && !stations.some(st => st[1] === plan.toStation)) plan.toStation = '';
    const toCode = plan.toStation || autoTo?.[1] || '';
    toSelect.innerHTML = '<option value="">' + (firstTown ? 'Choose station…' : 'Add a town first') + '</option>' + [...new Map([...candidates, ...(autoTo ? [autoTo] : [])].map(st => [st[1], st])).values()].map(st => `<option value="${esc(st[1])}"${st[1] === toCode ? ' selected' : ''}>${esc(st[0])} (${esc(st[1])})</option>`).join('');
    toSelect.parentElement.hidden = !firstTown;
    const dl = extras.querySelector('#sr-station-list');
    if (dl && dl.dataset.for !== norm(plan.from)) { dl.dataset.for = norm(plan.from); dl.innerHTML = matchingStations(stations, plan.from).map(st => `<option value="${esc(st[0])}">`).join(''); }
    for (const [name, label, step] of [
      ['train', 'Train tickets £ / person (whole trip)', '.01'],
      ['bus', 'Bus & tram fares £ / person (whole trip)', '.01'],
      ['taxi', 'Taxis £ / whole trip', '.01'],
      ['rental', 'Car hire £ / whole trip', '.01']
    ]) {
      if (!extras.querySelector(`[name="${name}"]`)) {
        const row = document.createElement('label');
        row.innerHTML = `${label}<input type="number" name="${name}" min="0" max="100000" step="${step}">`;
        extras.append(row);
        if (name === 'train') {
          const link = document.createElement('div');
          link.className = 'row';
          link.innerHTML = '<span class="muted">Fares change by date and time, so check the live price and type it in.</span><a data-train-link target="_blank" rel="noopener">Check train fares ↗</a>';
          extras.append(link);
        }
        if (name === 'bus') {
          const link = document.createElement('div');
          link.className = 'row';
          link.innerHTML = '<span class="muted">Check local bus and tram fares and times.</span><a data-bus-link target="_blank" rel="noopener">Check bus fares ↗</a>';
          extras.append(link);
        }
        if (name === 'taxi') {
          const link = document.createElement('div');
          link.className = 'row';
          link.innerHTML = '<span class="muted">Taxi firms quote by distance — check the route, then ring or use an app for a price.</span><a data-taxi-link target="_blank" rel="noopener">Taxi route ↗</a>';
          extras.append(link);
        }
        if (name === 'rental') {
          const link = document.createElement('div');
          link.className = 'row';
          link.innerHTML = '<span class="muted">Compare hire cars for your dates.</span><a data-hire-link target="_blank" rel="noopener">Check car hire ↗</a>';
          extras.append(link);
        }
      }
      extras.querySelector(`[name="${name}"]`).value = num(plan[name]);
    }
    const firstStop = plan.stops[0], lastStop = plan.stops.at(-1);
    const stopLabel = stop => stop ? [stop.name, stop.town].filter(Boolean).join(', ') : '';
    const busLink = extras.querySelector('[data-bus-link]');
    if (plan.from && firstTown) busLink.href = 'https://www.google.com/maps/dir/?api=1&travelmode=transit&origin=' + encodeURIComponent(plan.from) + '&destination=' + encodeURIComponent(firstTown);
    else busLink.href = 'https://www.traveline.info/';
    busLink.textContent = firstTown ? `Check bus fares to ${firstTown} ↗` : 'Check bus fares ↗';
    const taxiLink = extras.querySelector('[data-taxi-link]');
    taxiLink.href = firstStop && lastStop && firstStop !== lastStop ? 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(stopLabel(firstStop)) + '&destination=' + encodeURIComponent(stopLabel(lastStop)) : plan.from && firstTown ? 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(plan.from) + '&destination=' + encodeURIComponent(firstTown) : 'https://www.google.com/maps';
    const hireLink = extras.querySelector('[data-hire-link]');
    const hire = new URL('https://www.rentalcars.com/');
    if (firstTown) hire.searchParams.set('locationName', firstTown);
    if (startDate) hire.searchParams.set('puDay', startDate.slice(8, 10)), hire.searchParams.set('puMonth', startDate.slice(5, 7)), hire.searchParams.set('puYear', startDate.slice(0, 4));
    if (endDate) hire.searchParams.set('doDay', endDate.slice(8, 10)), hire.searchParams.set('doMonth', endDate.slice(5, 7)), hire.searchParams.set('doYear', endDate.slice(0, 4));
    hireLink.href = hire.href;
    const trainLink = extras.querySelector('[data-train-link]');
    const rail = new URL('https://www.nationalrail.co.uk/journey-planner/');
    if (fromStation) rail.searchParams.set('origin', fromStation[1]);
    if (toCode) rail.searchParams.set('destination', toCode);
    rail.searchParams.set('type', endDate && endDate > startDate ? 'return' : 'single');
    rail.searchParams.set('leavingType', 'departing');
    if (railDate(startDate)) { rail.searchParams.set('leavingDate', railDate(startDate)); rail.searchParams.set('leavingHour', '09'); rail.searchParams.set('leavingMin', '00'); }
    if (endDate && endDate > startDate && railDate(endDate)) { rail.searchParams.set('returnType', 'departing'); rail.searchParams.set('returnDate', railDate(endDate)); rail.searchParams.set('returnHour', '16'); rail.searchParams.set('returnMin', '00'); }
    rail.searchParams.set('adults', String(people));
    trainLink.href = fromStation && toCode ? rail.href : 'https://www.nationalrail.co.uk/journey-planner/';
    const toName = stations.find(st => st[1] === toCode)?.[0] || firstTown;
    trainLink.textContent = fromStation && toCode ? `Check fares ${fromStation[0]} → ${toName} ↗` : !plan.from ? 'Enter where you\'re travelling from to check fares ↗' : !fromStation && stations.length ? 'No station found for that — try a station name ↗' : `Check train fares to ${firstTown || '…'} ↗`;
    // Hotel quote + offers link
    const roomRow = budget.querySelector('[name="roomRate"]').parentElement;
    roomRow.firstChild.textContent = 'Hotel offer quote £ / room / night';
    let offerLink = root.querySelector('[data-hotel-offers]');
    if (!offerLink) {
      offerLink = document.createElement('a');
      offerLink.dataset.hotelOffers = '';
      offerLink.target = '_blank';
      offerLink.rel = 'noopener';
      roomRow.after(offerLink);
    }
    offerLink.href = firstTown ? '/destination/' + encodeURIComponent(slug(firstTown)) : '/offers';
    offerLink.textContent = firstTown ? `Check hotel offers in ${firstTown} ↗` : 'Check hotel offers and availability ↗';
    // Fuel controls
    if (!root.querySelector('[data-fuel-controls]')) {
      const controls = document.createElement('div');
      controls.dataset.fuelControls = '';
      controls.style.display = 'contents';
      controls.innerHTML = '<label>Fuel type<select name="fuelType"><option value="petrol">Petrol</option><option value="diesel">Diesel</option></select></label><label>Vehicle MPG (UK)<input type="number" name="mpg" min="5" max="150" step="1"></label><label>Average fuel price p / litre<input type="number" name="fuelPence" min="0" max="400" step=".01"></label><p class="muted" data-fuel-source role="status">Loading UK average fuel prices…</p><button type="button" class="button white" data-fuel-refresh>Use latest average</button>';
      extras.append(controls);
      budget.querySelector('[name="mileCost"]').parentElement.hidden = true;
    }
    root.querySelector('[name="fuelType"]').value = plan.fuelType;
    root.querySelector('[name="mpg"]').value = plan.mpg;
    root.querySelector('[name="fuelPence"]').value = num(plan.fuelPence);
    const source = root.querySelector('[data-fuel-source]');
    const data = root._fuelData;
    if (data) {
      source.innerHTML = `${plan.fuelAuto === false ? 'Custom price in use. ' : ''}UK weekly average ${esc(data.date)}${data.stale ? ' (last known)' : ''}: petrol ${esc(Number(data.petrolPence).toFixed(2))}p · diesel ${esc(Number(data.dieselPence).toFixed(2))}p. <a href="${GOV}" target="_blank" rel="noopener">Source ↗</a>`;
    } else if (!source.dataset.failed) {
      source.textContent = 'Loading UK average fuel prices…';
    }
    if (num(plan.fuelPence)) {
      plan.mileCost = +(num(plan.fuelPence) * 4.54609 / (100 * plan.mpg)).toFixed(3);
      root.querySelector('[name="mileCost"]').value = plan.mileCost;
    }
    // Per-stop cost boxes and hotel offer prices
    const offers = root._stayOffers || [];
    for (const article of root.querySelectorAll('.stop')) {
      const index = Number(article.querySelector('[data-remove]')?.dataset.remove);
      const stop = plan.stops[index];
      if (!stop) continue;
      if (!article.querySelector('[data-place-cost]')) {
        const label = document.createElement('label');
        label.textContent = 'Place cost £ / person';
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.max = '100000';
        input.step = '.01';
        input.dataset.placeCost = index;
        label.append(input);
        article.append(label);
      }
      article.querySelector('[data-place-cost]').value = num(stop.cost);
      if (isStay(stop.category) && stop.url && !article.querySelector('[data-stop-offer]')) {
        const link = document.createElement('a');
        link.dataset.stopOffer = '';
        const offerUrl = new URL(stop.url, location.origin); if (offerUrl.origin === location.origin && offerUrl.pathname === '/destination-recommendations') offerUrl.pathname = '/'; link.href = offerUrl.href;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Check offer ↗';
        article.append(link);
      }
      if (!article.querySelector('[data-stop-price]') && slug(stop.name).length > 3 && !/town|destination/i.test(stop.category || '')) {
        const match = offers.find(offer => slug(offer.name) === slug(stop.name) || slug(offer.name).includes(slug(stop.name)) || slug(stop.name).includes(slug(offer.name)));
        if (match && match.dealPrice) {
          const tag = document.createElement('a');
          tag.dataset.stopPrice = '';
          tag.href = match.url;
          tag.target = '_blank';
          tag.rel = 'sponsored noopener';
          tag.textContent = `Offer: ${match.dealPrice}${match.offerTitle ? ' · ' + match.offerTitle : ''} ↗`;
          article.append(tag);
        }
      }
    }
    // Stay offers panel under the hotel quote
    let panel = root.querySelector('[data-stay-offers]');
    if (!panel) {
      panel = document.createElement('div');
      panel.dataset.stayOffers = '';
      offerLink.after(panel);
    }
    if (root._stayOffersTowns !== towns.join('|')) {
      root._stayOffersTowns = towns.join('|');
      root._stayOffers = null;
      loadOffers(towns);
    }
    if (root._stayOffers && root._stayOffers.length) {
      const all = root._stayOffers;
      const card = (offer, i) => `<div class="offer"><div><strong>${esc(offer.name)}</strong>${offer.offerTitle ? esc(offer.offerTitle) : ''}</div><div class="price">${esc(offer.dealPrice || '')}${offer.wasPrice ? `<br><s class="muted">${esc(offer.wasPrice)}</s>` : ''}</div><div class="actions">${offer.price ? `<button type="button" data-use-offer="${i}">${offer.stay ? `Use £${offer.price} as room quote` : `Add £${offer.price} to activities`}</button>` : ''}<a href="${esc(offer.url)}" target="_blank" rel="sponsored noopener">View deal ↗</a>${offer.validUntil ? `<span class="muted">until ${esc(offer.validUntil)}</span>` : ''}</div></div>`;
      const stays = all.map((o, i) => [o, i]).filter(([o]) => o.stay).slice(0, 6), fun = all.map((o, i) => [o, i]).filter(([o]) => !o.stay).slice(0, 6);
      panel.innerHTML = (stays.length ? `<h3>Places to stay${firstTown ? ' in ' + esc(firstTown) : ''} — live offers</h3>` + stays.map(([o, i]) => card(o, i)).join('') : '') + (fun.length ? `<h3>Things to do${firstTown ? ' in ' + esc(firstTown) : ''} — ticket deals</h3>` + fun.map(([o, i]) => card(o, i)).join('') : '') + '<p class="muted">Partner links — we may earn a small commission at no extra cost to you. Stay prices are usually per room or per stay, tickets per person; check the deal page before booking.</p>';
    } else if (root._stayOffers && towns.length) {
      panel.innerHTML = `<p class="muted">No live stay offers for ${esc(firstTown)} right now — <a href="/offers">browse all offers</a> or enter a quote from the hotel above.</p>`;
    } else if (!towns.length) {
      panel.innerHTML = '<p class="muted">Add a town or hotel to your itinerary to see live stay offers here.</p>';
    } else panel.innerHTML = '<p class="muted">Looking for stay offers…</p>';
    // Totals
    const lines = [
      ['Hotels', num(plan.nights) * rooms * num(plan.roomRate)],
      ['Food', num(plan.days) * people * num(plan.food)],
      ['Activities allowance', num(plan.days) * people * num(plan.activities)],
      ['Added places', people * plan.stops.reduce((sum, stop) => sum + num(stop.cost), 0)],
      ['Fuel', num(plan.miles) * num(plan.mileCost)],
      ['Train', people * num(plan.train)],
      ['Bus & tram', people * num(plan.bus)],
      ['Taxis', num(plan.taxi)],
      ['Car hire', num(plan.rental)],
      ['Other', num(plan.extras)]
    ];
    const total = lines.reduce((sum, line) => sum + line[1], 0);
    root.querySelector('[data-total]').innerHTML = `<div class="total"><span>Estimated Total</span><strong>${money(total)}</strong></div><p class="muted">${money(total / people)} per person · Estimate; check provider prices before booking.</p><div class="muted">${lines.filter(line => line[1]).map(line => `<div>${line[0]}: ${money(line[1])}</div>`).join('')}</div>`;
    if (!root._tripCostsBound) {
      root._tripCostsBound = true;
      root.addEventListener('change', event => {
        const input = event.target;
        if (input.dataset.placeCost !== undefined) {
          const stop = plan.stops[+input.dataset.placeCost];
          if (stop) stop.cost = num(input.value);
        } else if (input.name === 'from') {
          plan.from = input.value.trim().slice(0, 60);
        } else if (input.name === 'toStation') {
          plan.toStation = input.value;
        } else if (['train', 'bus', 'taxi', 'rental', 'mpg', 'fuelPence', 'fuelType'].includes(input.name)) {
          plan[input.name] = input.name === 'fuelType' ? input.value : num(input.value);
          if (input.name === 'fuelPence') plan.fuelAuto = false;
          if (input.name === 'fuelType') plan.fuelAuto = true;
        } else return;
        recalculate();
        save();
      });
      root.addEventListener('input', event => {
        if (event.target.name !== 'from') return;
        const dl = root.querySelector('#sr-station-list');
        if (dl) dl.innerHTML = matchingStations(root._stations || [], event.target.value).map(st => `<option value="${esc(st[0])}">`).join('');
      });
      root.addEventListener('click', event => {
        const use = event.target.closest('[data-use-offer]');
        if (use) {
          const offer = (root._stayOffers || [])[+use.dataset.useOffer];
          if (offer && offer.price) {
            if (offer.stay) {
              plan.roomRate = offer.price;
              budget.querySelector('[name="roomRate"]').value = offer.price;
            } else {
              plan.activities = +(num(plan.activities) + offer.price / (num(plan.days) || 1)).toFixed(2);
              budget.querySelector('[name="activities"]').value = plan.activities;
            }
            recalculate();
            save();
          }
          return;
        }
        if (!event.target.closest('[data-fuel-refresh]')) return;
        plan.fuelAuto = true;
        root._fuelStarted = false;
        loadFuel();
      });
    }
    async function loadFuel() {
      if (root._fuelStarted) return;
      root._fuelStarted = true;
      try {
        delete source.dataset.failed;
        const response = await fetch('/_functions/fuelAverage', {signal: AbortSignal.timeout(12000)});
        if (!response.ok) throw new Error('unavailable');
        const data = await response.json();
        const price = Number(plan.fuelType === 'diesel' ? data.dieselPence : data.petrolPence);
        if (!(price >= 80 && price <= 400)) throw new Error('invalid price');
        root._fuelData = data;
        if (plan.fuelAuto !== false) plan.fuelPence = price;
        recalculate();
        save();
      } catch {
        source.dataset.failed = '1';
        source.textContent = 'Average fuel price unavailable right now. Enter pence per litre from your local forecourt.';
      }
    }
    async function loadOffers(list) {
      const key = list.join('|');
      const Q = () => window.SR_PUBLIC_DIRECTORY?.S?.archiveQuery || window.SR_SEASIDE?.archiveQuery;
      if (!list.length) { root._stayOffers = []; return; }
      let tries = 0;
      while (!Q() && tries++ < 100) await new Promise(r => setTimeout(r, 100));
      if (!Q()) { root._stayOffers = []; recalculate(); return; }
      let rows = [];
      try {
        const slugs = list.map(slug).filter(Boolean);
        const filter = { $or: slugs.flatMap(s => [{ locationSlug: { $eq: s } }, { destinationSlug: { $eq: s } }]) };
        const res = await Q()({ filter, paging: { limit: 100 } }, null, false, 'DestinationRecommendations');
        rows = (res.dataItems || []).map(x => x.data || x)
          .filter(r => (r.affiliateUrl || r.affiliate) && r.cardReady !== false && !expired(r.offerValidUntil) && r.dealPrice)
          .map(r => ({
            stay: isStay([r.category, r.offerType, r.offerTitle].join(' ')),
            name: r.displayTitle || r.name || r.title || 'Offer',
            offerTitle: r.offerTitle || '',
            dealPrice: String(r.dealPrice || '').replace(/^FROM\s*/i, 'From '),
            wasPrice: r.wasPrice || '',
            price: priceOf(r.dealPrice),
            url: safeUrl(r.affiliateUrl || r.offerUrl || r.bookingUrl),
            validUntil: r.offerValidUntil ? new Date(Date.parse(String(r.offerValidUntil.$date || r.offerValidUntil))).toLocaleDateString('en-GB') : ''
          }))
          .filter(r => r.url);
        rows.sort((a, b) => (+!!b.price) - (+!!a.price) || a.price - b.price);
      } catch { rows = []; }
      if (root._stayOffersTowns !== key) return;
      root._stayOffers = rows;
      recalculate();
    }
    if (root._fuelData && plan.fuelAuto !== false) {
      const price = Number(plan.fuelType === 'diesel' ? root._fuelData.dieselPence : root._fuelData.petrolPence);
      if (num(plan.fuelPence) !== price) { plan.fuelPence = price; recalculate(); save(); }
    } else if (!root._fuelData) loadFuel();
  };
  let attempts = 0;
  const timer = setInterval(() => {
    if (window.SR_TRIP_ATTACH) { clearInterval(timer); window.SR_TRIP_ATTACH(); }
    else if (++attempts > 600) clearInterval(timer);
  }, 100);
})();
}catch(e){console.warn('SR snippet failed: Spin Raiders trip cost estimator',e)}})();

