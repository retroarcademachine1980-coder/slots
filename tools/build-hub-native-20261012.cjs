const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const original = fs.readFileSync(path.join(root, 'dist/sr-hub-guides-20261006.js'), 'utf8');
const start = original.indexOf('var G=') + 6;
const guides = JSON.parse(original.slice(start, original.indexOf(';\nvar p=', start)));
const pages = [
  {
    path: '/seaside', pageId: 'x4wr0', title: 'Seaside', heading: true,
    extra: `<h2>Make a seaside trip work for your group</h2><p>Start with the town, then work out what you want from the day. A beach and a bag of chips might be plenty. If you want to spend longer there, add an arcade, a pier, somewhere to eat or a place to stay. The destination guide is the place to bring those choices together before you set off.</p><p>Think about the people coming with you as well. A long walk along the front sounds lovely until somebody is tired, the weather changes or the thing they wanted to do is at the other end of town. Pick a main stop, leave time for a drink and something to eat, and keep an indoor option in mind. You can always fit another stop in if the day is going well.</p><p>For a starting point, open <a href="/destination/blackpool">Blackpool</a>, <a href="/destination/skegness">Skegness</a> or <a href="/destination/great-yarmouth">Great Yarmouth</a>, then see what else belongs in your day.</p>`
  },
  {
    path: '/places-to-stay', pageId: 'd4i0i', title: 'Places to Stay', heading: true,
    extra: `<h2>Choose the base before the booking</h2><p>A hotel deal only tells you part of the story. Work out where you actually want to spend your time, then look at how the accommodation fits around it. Somewhere close to your main stops can make a weekend much easier, especially when you want to go back out for food or an evening on the seafront.</p><p>Read the guide before following an offer. Think about the whole visit: getting there, where the car will go, the room you need and what you can do nearby. If you are travelling with children or somebody with access needs, check those details directly with the place before booking. Then use the <a href="/days-out">destination ideas</a> and <a href="/food-and-drink">food guides</a> to turn the stay into a trip you will actually enjoy.</p>`
  },
  {
    path: '/days-out', pageId: 'x2c0z', title: 'Days Out', heading: true,
    extra: `<h2>You do not have to fill every minute</h2><p>Start with the thing you are most looking forward to. Give that enough time, then add a food stop and another place nearby if it makes sense. A good day out should feel like a day off, not a race between car parks.</p><p>If you have picked a town, open its destination guide and see the choices together. If you have picked an activity, use the venue guide as the starting point instead. Keep the journey, the weather and the people coming with you in mind. Browse <a href="/seaside">seaside trips</a>, <a href="/attractions">attractions</a> and <a href="/places-to-stay">places to stay</a>, then decide which stops deserve a place in your day.</p>`
  },
  {
    path: '/food-and-drink', pageId: 'lyxzf', title: 'Food & Drink', heading: false,
    extra: `<h2>Put the food stop in the right place</h2><p>It is easy to spend all your time choosing the attraction and leave lunch until everybody is hungry. Have a look at the food options while you are putting the day together. A café near the beach, a chippy after the arcades or a proper sit-down meal at the end can change the whole feel of the trip.</p><p>Use the individual guide to see what sort of place you are considering, then check whether it fits around the other stops. Opening times, bookings, dietary needs and access are worth checking with the venue when they matter to your group. Some places suit a quick drink and a snack; others are somewhere to take your time. If you need the rest of the day as well, go back to the <a href="/days-out">day-out ideas</a>, <a href="/seaside">seaside guides</a> or <a href="/places-to-stay">places to stay</a> and build from there.</p>`
  }
];
for (const page of pages) {
  if (!guides[page.path]) throw new Error('Missing existing guide: ' + page.path);
  const heading = page.heading ? '<h1 id="sr-hub-native-heading">' + page.title + '</h1>' : '';
  const fragment = '<div id="sr-hub-native-source" data-sr-hub-path="' + page.path + '">' + heading + '<section id="sr-hub-native-guide" data-sr-native-hub class="sr-hub-guide">' + guides[page.path].html + page.extra + '</section></div>';
  if (fragment.length > 14000) throw new Error('Wix embed limit exceeded.');
  const file = 'dist/sr-hub-native-' + page.path.slice(1) + '-20261012.html';
  fs.writeFileSync(path.join(root, file), fragment + '\n');
  page.file = file;
  page.words = fragment.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
}
fs.writeFileSync(path.join(root, 'dist/sr-hub-native-pages-20261012.json'), JSON.stringify(pages.map(({extra,...page}) => page), null, 2) + '\n');
console.log(JSON.stringify(pages.map(page => ({path:page.path,words:page.words,characters:fs.statSync(path.join(root,page.file)).size}))));
