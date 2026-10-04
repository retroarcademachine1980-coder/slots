"""Build researched Vue guides from checked operator facts and licensed photos.
Does not claim a personal visit or create ratings/showtime feeds.
"""
import json,re,html,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]/'research/vue-20260929'
facts=json.load(open(ROOT/'verified-facts.json'))
photos=json.load(open(ROOT/'uploaded-photos.json'))
E=html.escape
def para(s):return '<p>'+s+'</p>'
def section(h,s):return '<h2>'+h+'</h2>'+para(s)
special={
'vue-hull':"This is the Vue at Princes Quay. It is a different venue from the Cineworld at Kingswood that I reviewed after watching ScreenX. Make sure the booking confirmation says Princes Quay before setting off; the two Hull pages are kept separate for that reason.",
'vue-manchester-printworks':"Printworks is the one to compare if the screen itself is a big part of your night out: Vue lists IMAX GT Laser with dual 4K projection here. I’d check that the performance I’m paying for actually uses that screen. A film appearing in the same building does not automatically make every showing IMAX.",
'vue-manchester':"This is the Quayside cinema at Salford Quays, rather than Vue Manchester Printworks. I’d decide which part of the city the rest of the outing is based around before choosing the cinema. The address on the ticket matters more than simply searching for ‘Vue Manchester’.",
'vue-bedford':"The Riverside setting gives this branch a clear place in a town-centre outing. The practical detail I’d pay attention to is the route to wheelchair seating: Riverside’s venue information says those spaces are on the second floor and reached by lift. If that route is essential for your visit, check lift availability with the venue before travelling.",
'vue-bicester':"There is a parking detail here that can make a real difference: the published free allowance at Sainsbury’s needs extending for a longer cinema visit. I’d sort the cinema’s QR-code extension before settling into the film, rather than assuming a ticket automatically covers the car.",
'vue-leicester-square':"This is Vue West End in Leicester Square, London. It is not the Vue in Leicester. I’d use the postcode and the full venue name when sharing a booking with friends; a shortened ‘Leicester Vue’ message leaves far too much room for a mix-up.",
'vue-leicester':"This is the Leicester venue at Meridian Leisure Park, not Vue West End in London’s Leicester Square. For a group outing, I’d send the cinema address along with the film time so everyone arrives at the same place.",
'vue-westfield':"This is the Westfield London branch at Shepherd’s Bush. Vue also has a separate cinema at Westfield Stratford City, across London. Check the shopping centre and postcode on the booking rather than relying on the Westfield name alone.",
'vue-westfield-stratford-city':"This is the Westfield Stratford City branch in east London. It is separate from the cinema at Westfield London in Shepherd’s Bush. I’d include ‘Stratford City’ in the message when arranging to meet people here.",
'vue-bristol-longwell-green':"This is the Longwell Green branch, separate from Vue Bristol Cribbs Causeway. The dated photographs in this guide show the actual entrance, box office, concessions and corridor, so you can get a feel for the building before going. They are reference photographs, not a record of a Spin Raiders visit.",
'vue-bristol-cribbs-causeway':"This is the Cribbs Causeway branch at The Venue. It is separate from Vue Longwell Green. The EPIC auditorium and the seating choice are the details I’d compare when booking; the branch name alone does not tell you which screen a particular performance uses.",
'vue-poole':"The Ultra Lux seating and listed bar make Poole worth comparing when you want the cinema itself to be part of the evening. I’d still look at the exact seat category and final price before paying. A premium seat description tells you what is being sold, but it is not a first-hand verdict on comfort or service.",
}
updates=[]
for r in facts:
 slug=r['slug'];title=r['title'];url=r['website'];details=r.get('screenDetails',[])
 facilities=list(dict.fromkeys(r.get('facilities',[])+r.get('extraFacilities',[])))
 n=r.get('screens')
 for f in r.get('extraFacilities',[]):
  m=re.fullmatch(r'(\d+) screens',f,re.I)
  if m:n=int(m[1]);break
 text=' '.join(facilities+details)
 ultra='ultra lux' in text.lower();lux='lux' in text.lower();epic='EPIC' in text;imax='IMAX' in text
 seating='Ultra Lux and Lux seating' if ultra and 'Lux Seats' in text else 'Ultra Lux seating' if ultra else 'Lux reclining seating' if lux else 'VIP seat upgrades' if 'VIP' in text else 'the available seat categories'
 overview=f"{E(title)} is at {E(r['address'])}. "+(f"Vue lists {n} screens here. " if n else '')
 overview+=f"My starting point with this one would be the actual screening: the seat, the format and the total cost for everyone going. {('The published '+seating+' is worth comparing against the standard booking options. ') if (lux or 'VIP' in text) else ''}This is a researched venue guide in the Spin Raiders style, using the operator’s information; I have not personally reviewed a visit to this branch."
 angle=special.get(slug)
 if not angle:
  if epic:angle="The EPIC screen is the feature I’d look at first for a big-screen outing. I’d compare its available performances with the other screens, then decide whether the film and price justify the upgrade. Check the format against the actual showtime rather than assuming every ticket in the building includes it."
  elif imax:angle="The IMAX option is the obvious comparison for a film you really want to see on a larger-format screen. I’d check the performance label, seating plan and price together. Booking at a cinema with IMAX does not mean that every auditorium or every showing is IMAX."
  elif ultra:angle="The mix of seating is the detail that gives this branch its character on paper. I’d compare the Ultra Lux option with the other categories on the booking plan and decide what the extra comfort is worth for the length of the film. I cannot judge the condition of the seats from an operator description."
  elif n and n<=6:angle="With a smaller number of screens, I’d choose the film and performance before planning the rest of the outing. A smaller cinema can still be a useful local option, but the important thing is whether the showing you want fits your day. I would not judge picture quality, cleanliness or service from screen count alone."
  else:angle=f"For me, the useful comparison here is how {E(title)} fits the whole outing: getting there, picking a sensible seat and leaving without a last-minute parking rush. I’d choose the performance first, then work the rest of the evening around it. The number of screens alone does not tell us how a particular auditorium feels."
 body=section('The cinema adventure',overview)+section('What stands out here',angle)
 formatlabels=[x for x in ['IMAX','EPIC','Ultra Lux','Lux','VIP','Dolby','4K','3D','Laser'] if x.lower() in text.lower()]
 body+=section('Screens, seats and the view',f"The operator information for this branch lists {E(', '.join(formatlabels)) if formatlabels else 'the screens shown on its booking page'}. Availability can depend on the auditorium and performance. I’d open the seat plan before buying, check where the screen is, and choose a row that suits me. A named upgrade is not a promise that every seat has the same layout or recline.")
 if details:
  # Numeric capacity information is presented as factual reference, not copied review prose.
  body+='<h2>Auditorium reference</h2>'+para('The following screen and seating details were available from Vue when this guide was checked. The booking plan remains the place to confirm the exact performance and wheelchair position.')+'<ul>'+''.join('<li>'+E(d)+'</li>' for d in details)+'</ul>'
  body+=para('Where a wheelchair allocation is not stated above, that means it was not supplied in the information collected for this guide; it does not establish that the screen is inaccessible.')
 access="Wheelchair bay position matters as well as the number of spaces. "
 if any('rear' in s.lower() for s in details) and any('front' in s.lower() for s in details):access+="This branch’s published details include different front and rear positions across its screens. I’d check the particular screen before booking, especially if the viewing angle matters to you. "
 elif any('front' in s.lower() for s in details):access+="The published screen information includes front-position wheelchair spaces. I’d check the viewing position on the selected performance’s seat plan before paying. "
 elif details:access+="Use the auditorium reference above as a starting point, then confirm the route and seating arrangement for the performance you want. "
 access+='For step-free access, accessible toilets, assistance equipment or a companion ticket, <a href="https://www.myvue.com/legal/accessibility">check Vue’s accessibility information</a> and confirm your requirements with the branch. Adapted, subtitled and audio-described performances need to be selected explicitly; do not assume an ordinary showing provides them.'
 body+=section('Access and a comfortable visit',access)
 body+=section('Getting there and parking',E(r['parking'])+' I’d allow time between arriving and the advertised performance, particularly if I need to validate parking or find the correct entrance. Read the signs when you arrive: time limits, charges and validation arrangements can change. For an evening trip, check the return journey as well as the route there.')
 body+=section('Tickets, snacks and the real cost',"I’d price the whole trip before calling it a bargain: everyone’s tickets, seat upgrades, food and drink, plus travel or parking. The concessions board and final booking checkout are the useful prices to compare. I have not tested this branch’s food, queues or service, so there is no invented verdict on any of those. If you’re going with children or a group, agree the seats and snack budget before booking separately.")
 body+=section('Current films and booking',f'<a href="{E(url)}">Open current films, showtimes and tickets at {E(title)}</a>. Choose your date and check the film certificate, format, screen, seat category and final total before payment. The link goes to this branch’s official listings. Showtimes and Google reviews are not automatically imported into this page; no rating is displayed as a substitute for a connected review source.')
 body+=section('My planning take',"I’d use this guide to make the practical choices before going, then judge the cinema on the actual visit: the welcome, the view, the seat condition, the sound and whether the overall spend felt worthwhile. Those are the same things that matter in the Cineworld Hull review. Until there is a first-hand visit here, this remains a researched assessment rather than a personal Raider Score.")
 body+=section('Sources and photographs',f'Venue facts checked against <a href="{E(url)}">Vue’s official branch information</a> on 29 September 2026.'+(' Bedford access and parking were also checked against <a href="https://riversidebedford.co.uk/vue-cinema-bedford/">Riverside Bedford</a>.' if slug=='vue-bedford' else '')+' Photograph dates and credits are shown with each available image. Older photographs help identify a venue but do not confirm its present décor or condition.')
 data={'sourceFacts':body,'fullDescription':body,'sourceType':'Researched venue guide','reviewAuthor':'Spin Raiders','verifiedDate':'2026-09-29','sourceName':'Vue official branch information','cinemaScreenDetails':details,'cinemaGuideStatus':'RESEARCHED_NOT_VISITED','cinemaFeedStatus':'NOT_CONNECTED','publicRatingStatus':'NOT_VERIFIED','facilities':list(dict.fromkeys((([str(n)+' screens'] if n else [])+([x for x in ['IMAX','EPIC','Ultra Lux seating','Lux seating','VIP seats','Laser projection','3D'] if (x.split()[0].lower() in text.lower())])))),'openingHoursSummary':'Vue says this cinema normally opens around 15 minutes before its first performance. Check the day’s listings.' if r['opening'] else 'Opening times follow the performance schedule; check the official branch listings.','shortDescription':f"{title}: "+(f"{n} screens, " if n else '')+f"{seating}, practical arrival advice and the details to check before booking. Researched guide."}
 pp=[p for p in photos if p['slug']==slug]
 def meta(p):
  caption=('Cinema entrance inside the shopping centre' if slug in ['vue-hull','vue-edinburgh-omni-centre','vue-farnborough'] else 'Cinema interior' if slug=='vue-north-finchley' or p['role']=='interior' else 'Cinema exterior')
  if slug=='vue-leamington-spa':caption='Vue building viewed from Augusta Place'
  caption=p.get('caption',caption)
  return {'originalTitle':p.get('originalTitle',p.get('title','')),'src':p['wixUrl'],'originalSrc':p['src'],'alt':caption+' at '+title,'title':caption,'caption':caption,'credit':p['credit'],'date':p['date'],'sourceUrl':p['sourceUrl'],'license':p['license'],'licenseUrl':p['licenseUrl']}
 if pp:
  mapped=[meta(p) for p in pp];data.update({'gallery':mapped,'imageResearchStatus':'LICENSED_DATED_PHOTOS','imageCredit':mapped[0]['credit']})
  hero=next((meta(p) for p in pp if p['role']=='hero'),None)
  if hero:data.update({'heroImage':hero['src'],'image':hero['src'],'imageAltText':hero['alt'],'heroImageMetadata':hero})
 updates.append({'id':r['id'],'data':data})
(ROOT/'guide-updates.json').write_text(json.dumps(updates,ensure_ascii=False,indent=2))
print(json.dumps({'guides':len(updates),'photoVenues':sum(bool(x['data'].get('gallery')) for x in updates),'words':{'min':min(len(re.sub('<[^>]+>',' ',x['data']['sourceFacts']).split()) for x in updates),'max':max(len(re.sub('<[^>]+>',' ',x['data']['sourceFacts']).split()) for x in updates)}}))
