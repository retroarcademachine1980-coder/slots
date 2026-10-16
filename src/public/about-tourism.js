// Original About text is retained in the restoration backup. Match only reviewed page content.
export const tourismAboutReplacements = [
  {
    "prefix": "Spin Raiders: From Classic Arcade Quest to Your Expert Casino Of",
    "text": "About Spin Raiders: make a proper day of it"
  },
  {
    "prefix": "For years, Spin Raiders was driven by a single mission: to uncov",
    "text": "Fancy getting out for the day? You might have one place in mind, or you might just want a change of scenery. Spin Raiders brings the ideas together: a town to explore, something exciting to do, somewhere good to eat and a place to stay if one afternoon is not enough. The aim is to help you picture the visit before you set off. You should be able to open a guide, get a feel for the place and start turning that first idea into a day you will actually enjoy."
  },
  {
    "prefix": "Our Evolution: From Fruit Machine Nostalgia to Modern Casino Exp",
    "text": "From the arcades to a whole day out"
  },
  {
    "prefix": "Our travels chronicled the golden age of fruit machines, seeking",
    "text": "Arcades and classic fruit machines are a big part of the Spin Raiders story. The sounds, the machines, the seaside atmosphere and the places behind them still matter here. But a trip rarely ends at one front door. Blackpool has its piers, the Golden Mile, the Tower, Pleasure Beach and the Illuminations. Scarborough gives you two bays, a castle, the harbour and plenty to explore between them. You might come for the amusements and end up staying for food, a show or a weekend by the sea. That is the wider adventure this site is built around."
  },
  {
    "prefix": "Spin Raiders Casino Offer Hub is your trusted source for:",
    "text": "Choose the day that suits you"
  },
  {
    "prefix": "Expert Casino Reviews: Honest, in-depth analysis of the best onl",
    "text": "Browse destinations when you know where you want to go. Browse attractions when you know what you want to do. There are ideas for theme parks, wildlife, historic places, museums, cinema, bowling, beaches, fishing and time outdoors. Food and accommodation guides help you build around the main event. Pick the stops that suit your group and leave room to enjoy them. A good day does not have to mean racing from one booking to the next."
  },
  {
    "prefix": "Lights, Camera, Slots! Join the Entertainment on YouTube",
    "text": "Take a look around before you go"
  },
  {
    "prefix": "The spirit of the arcade is still alive and well on our sister c",
    "text": "A photograph of the outside helps you recognise the venue when you arrive. Open the guide and look further: the atmosphere, the things to try, the photographs and any recorded visit or video. RaiderTube brings the SPINBLITZ and Spin Raiders footage into that journey, especially for arcade visits and classic machines. Photographs and videos are snapshots of a place at a particular time, so check the dates and the venue's own information when a specific feature is the reason for your trip."
  },
  {
    "prefix": "Why Trust Spin Raiders?",
    "text": "What makes a personal review different"
  },
  {
    "prefix": "We didn't just jump into the casino world; we grew into it. Our ",
    "text": "The personal reviews are the heart of this site. Read about Masala n Malt and Pizza Parlour in Grimsby, Reel Vegas in Blackpool and Silcock's Southport, and explore the town guides around them. Where a review records a real visit, that experience belongs in the writing: what stood out, what was enjoyed and the details worth passing on. Researched guides must keep that distinction clear. A personal Raider Score is also different from a public review rating; check the source and context so you know whose opinion you are reading."
  },
  {
    "prefix": "Join Our Community",
    "text": "Keep exploring with us"
  },
  {
    "prefix": "Stay updated on the latest news, events, and exclusive offers by",
    "text": "Discover another town, watch a venue visit or send a useful correction when something changes."
  },
  {
    "prefix": "5 Reasons to Choose Spin Raiders: Your Ultimate Guide to Classic",
    "text": "Turn one idea into a proper trip"
  },
  {
    "prefix": "For serious slot machine enthusiasts and players seeking genuine",
    "text": "You do not need a complicated itinerary to get started. Choose the part of the day you are most excited about, then build around it. A little planning can leave you with more time to enjoy the place once you arrive."
  },
  {
    "prefix": "1. Expert Authority Rooted in Gaming History",
    "text": "1. Start with the fun"
  },
  {
    "prefix": "While we now specialize in modern online casino offers, our expe",
    "text": "Choose the attraction, activity or town you really want to experience. Open its guide and check who it suits, what is there and any booking or age restrictions. A family ride day, a quiet afternoon fishing and a retro arcade visit need different plans."
  },
  {
    "prefix": "2. We Deliver the Highest Value Casino Offers",
    "text": "2. Make time for something tasty"
  },
  {
    "prefix": "Stop wasting time searching through endless online promotions. S",
    "text": "Look at the food stops around your main attraction. A proper meal, a café break or chips by the harbour can be part of the pleasure of getting out. Read the guide before deciding and use the venue's current menu for today's choices and prices."
  },
  {
    "prefix": "3. Unbeatable Slots Entertainment on YouTube",
    "text": "3. Give yourself time to explore"
  },
  {
    "prefix": "Our sister channel, SpinRaiders Slots Entertainment, brings the ",
    "text": "Leave space for a wander, another arcade, a beach stop or a museum you have spotted along the way. If the town has more to offer than you can fit into one visit, look at staying over rather than squeezing everything into a rushed afternoon."
  },
  {
    "prefix": "4. Exclusive Access & Nostalgic Arcade Content",
    "text": "4. Check the practical details"
  },
  {
    "prefix": "Our famous classic arcade tours are proof of our passion. We con",
    "text": "Check opening dates, accessibility, parking, travel and ticket details before you leave. Our fuel panel shows dated reported station prices where the feed has local coverage. Choose the right fuel grade and use a price in your trip estimate, or enter your own. The planner also offers a dated UK weekly average. Check the actual pump price when you arrive; your vehicle's consumption still matters."
  },
  {
    "prefix": "5. Join a Trusted Community for Responsible Gaming",
    "text": "5. Understand the offers"
  },
  {
    "prefix": "Spin Raiders is more than just an offer hub—it’s a growing movem",
    "text": "Some booking links may earn Spin Raiders a commission. Those links should be identified, and the useful guide should help you decide whether the place suits you before you book. Check the provider's price, dates, inclusions and cancellation terms. Adult gaming content and areas have their own age restrictions."
  },
  {
    "prefix": "Ready for the Ultimate Slot Adventure?",
    "text": "Ready to make a day of it?"
  },
  {
    "prefix": "Discover Top Offers: Visit the Spin Raiders Casino Offer Hub tod",
    "text": "Explore a destination, open a venue guide and start building your day. If you spot an incorrect detail, use Report a change to contact Spin Raiders with the place name and the information that needs checking. The privacy policy explains how submitted details are handled. Places change, and useful corrections help the next visitor."
  }
];
export function restoreTourismAbout(elements) {
  let changed = 0;
  for (const element of elements) {
    const current = String(element.text || '').replace(/\s+/g, ' ').trim();
    const replacement = tourismAboutReplacements.find(row => current.startsWith(row.prefix));
    if (replacement) { element.text = replacement.text; changed++; }
  }
  return changed;
}
