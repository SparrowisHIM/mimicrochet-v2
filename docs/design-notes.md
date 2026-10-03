# Mimi Crochet v2: design notes (moved out of Figma)

These notes used to sit beside the frames in the Figma file. They were moved here on 3 Oct 2026 so the Figma file can be submitted clean. They are the reasoning and motion specs to build from in code.

Figma file: https://www.figma.com/design/Mf27rvRJ5qfphZ7mLUtx1X

---

## Home

### v1 audit
The blank stretch in the desktop capture is a scroll-pinned section, not a bug.

**Keep**
- Warm cream colours and serif headlines feel on-brand
- Real photos of Mimi's pieces
- The step-by-step custom order section and its order-ID card, the seed of v2
- Reviews that say what each customer ordered

**Fix**
- The hero photo shows yarn, not Mimi's finished pieces
- Three similar product grids in a row: Available now, New arrivals, Made before
- Two photo styles share the same grids (mannequin shots and pieces worn outdoors); v2 gives every photo one shared frame
- The pinned section costs about two screens of scrolling
- Lots of tiny all-caps labels

### v2 decisions
- Fonts: Young Serif + Figtree (Direction 1). Agbalumo + Onest (Direction 2) was dropped on 3 Oct.
- Hero: the Ruby Dress still. The page's one big motion moment is the order story.
- One product grid with filters replaces v1's three similar grids.
- Every photo gets the same 3:4 frame, so mannequin and outdoor shots sit together.
- Colours from the Tailwind palette: orange-50 canvas, stone ink.
- Order story replaces the three text steps: one real custom order (the Ruby Dress, MIMI-2406), from the customer's idea to delivery, told through the tracking card in 5 stages.
- Shop comes straight after the hero. The WhatsApp banner became the order story's second button.
- Worn, loved, re-worn: real customers only (Favour, the Olive Bloom Shirt customer, the Emerald Everyday Shirt customer). A customer with several photos opens an editorial story (see "Customer stories" below).

### References used
- Glossy toggle: the "Ready to wear only" switch on the shop grid, the page's one tactile control. On glows emerald, like the ready-to-wear tags.
- Dawn (finance app concept): the warm off-white canvas and serif headings that run through the whole site.
- The rest of Home was designed from the v1 audit. The order story is my own idea, built on v1's scroll sequence.

### Motion: order story
The section stays on screen for about two scrolls, on desktop and phone. Each stage swaps the photo with a soft 0.4s crossfade and moves the card forward; on desktop the thread beside the stage names fills as you go. No confetti: the payoff is the customer wearing the finished piece. With reduced motion the section doesn't pin, and the five stages stack.

| Stage | Photo | Latest from Mimi |
|---|---|---|
| 1 Idea received | Homepage Ruby image (the customer saw it and sent it) | Got your photo. I love this one! |
| 2 Price agreed | Ruby's red yarn (video 54) | Price agreed and yarn picked. |
| 3 In progress | Ruby skirt panel half made (video 54) | Top done, starting the skirt. |
| 4 Ready | Ruby on the mannequin | All done! Photos on WhatsApp. |
| 5 Delivered | Stand-in (skirt crop) until a customer photo exists | Delivered. Enjoy wearing it! |

### Customer stories (code)
- Desktop: hovering a card crossfades through that customer's photos.
- Tap: the card photo expands into the story's main photo (shared-element transition); the name sets in letter by letter; the gallery drags/swipes with the thumbnail ring sliding along; arrow keys + Esc on desktop, swipe down to close on phones; "Next story" goes to the next customer. Reduced motion: simple fades.
- Data: one customers list (first name, city, real words, pieces, photos, consent). Only customers with an OK are shown.
- Product pages get a "Worn by customers" row that opens the same story.

---

## Site-wide
- Socials everywhere (footer, Contact): Instagram, WhatsApp (wa.me/2349157669182), TikTok, Facebook, Pinterest. Use the real URLs in v1's lib/socials.ts.
- No categories section on Home; "View all 31 pieces" and the Shop's chips handle browsing.

## Shop

### v1 audit
**Keep:** category tabs with counts; colour dots on each card; "Available now" and "Made before" tags.
**Fix:** on a phone, the title, search, filters and sort push products far down; a heavy "View piece" button repeats on every card; 66 pieces shown 8 at a time; favourites existed only as an empty state.

### v2 decisions
- Mimi's real pieces lead: 22 clothes with her own photos plus her 9 earrings (real pieces on a studio backdrop, confirmed 3 Oct). In code, v1's concept pieces (bags and other ideas) also appear, clearly marked as ideas you can request. Monochrome Crochet Shirt and Purple Cloud Crop Sweater are references, never shown as her work or customers. Green Garden carries another maker's watermark: leave it out unless Mimi says it's hers.
- **Collection (3 Oct): 41 real pieces.** 21 ready to wear + Striped shirt + 9 earrings (₦8,000, made in 3 days) + the Noir Bloom shirt (Mimi's own) + 9 pieces from her Pinterest: black ribbed beanie, green ribbed beanie, brown button beanie, kids granny vest, bloomer shorts, heart sweater, pink top + granny-square shorts set, the hot body set, pink stripe set. New pieces are made to order with **"Price on request"** until Mimi gives prices. Photos: design-assets/incoming/pinterest/new-pieces/. Use Mimi's own names where she has them (Cocoa Stripe Beach Set = "Terra set").
- Categories: Dresses 6, Sets & shorts 8, Shirts 5, Hats 9, Tops & knits 4, Earrings 9.
- Buttons never show counts ("View more pieces", "Show more"). Filter chips keep their counts.
- Products start on the first screen on a phone: a one-line title, category chips with counts, then the "Ready to wear only" toggle.
- Cards have no button: the whole card opens the piece. No colour dots: the 3:4 photo already shows the colours.
- A "Don't see your size or colour?" tile sits in the grid like a product and leads to a custom order.
- Earrings: made to order, about 3 days to make, at the door within a week, ₦8,000 each. Normal flow (open, pay, delivery details). Tag "Made in 3 days" in the made-to-order amber.
- Filters live in one sheet: type, category, price, colour and sort; the button shows the live count. Desktop keeps categories as chips and puts price and colour behind one button.
- "Show more" with a progress line replaces v1's 9 pages of 8.
- Favourites: being brought back (3 Oct). Heart on cards and product pages, a heart with a count in the header, a Saved list on the device (no login) that marks sold pieces "Sold, Mimi can make it for you" and can be sent to Mimi on WhatsApp.

### References used
- Glossy toggle: "Ready to wear only", shared with Home.
- Clerk users table: filter chips with counts.
- Component sheet: the filter sheet's grouped options.
- Kept from v1: category tabs with counts and the ready / made-to-order tags.

---

## Product

### v1 audit
**Keep:** colour and size pickers; the "Made just for you" note on request-only pieces; the split between buying now and requesting.
**Fix:** on desktop the photo is small; on a phone "Request this piece" appears twice; the link and the name don't match (candy-bloom-ruffle-set shows "Sasha Ruffle Set"); generic promise sections make the page long.

### v2 decisions
- Photo first: 600–700px wide on desktop, full width on phones. Thumbnails only when there's more than one photo.
- Honest stock: v2 shows the one size in stock (v1's rule: M for dresses, sets and tops; XL for shirts). Any other size turns into a request.
- Colour is a fact, not a picker. Choices like size and colours live in the custom order flow.
- One main button. On phones a floating bar shows it only after it scrolls away.
- Removed: the "promise" section, trust badges ("Secure checkout" while payments were off), share icon. (Wishlist/favourites is coming back, see Shop.)
- Made to order gets a "Made for you" box: time, how the price is agreed, and the tracking stages.

### References used
- Dawn: the phone's floating bar (thumbnail, price, Add to bag) floats like Dawn's "Add new" pill.

---

## Custom order

### v1 audit
**Keep:** a guided brief, not a checkout; honest chips ("No payment now", "WhatsApp follow-up"); the "View order brief 0/7" summary.
**Fix:** on a phone the sticky brief bar covers the options; after submitting the trail goes cold (no tracking); the success page can show "Order summary unavailable".

### v2 decisions
- 3 steps instead of 5: what to make, make it yours, where to reach you.
- Start from a picture: add a photo, pick one of Mimi's pieces, or describe it. From a product page, the piece and size arrive filled in.
- Only ask what Mimi needs: budget only when there's no price yet. Email is gone; WhatsApp is the channel.
- Nothing covers the options. On phones the summary becomes the review in step 3; on desktop it's a live card on the right.
- The end is a tracking link: the order card at step 1, a link to save, and a WhatsApp button with the order number filled in.
- Built from components: Chip, Field, Choice row, Tracking card.
- Sizes stay as XS–XL chips. "Not sure of your size?" opens optional bust, waist, hips and length, with a how-to-measure guide.
- Before sending: a "My size is right" checkbox (wrong measurements can't be remade for free).
- "Need ideas?" opens a sheet of concept pictures (labelled "Concept") and a Pinterest search link. Replaces v1's Mimi Stylist chat.
- Delivery only, anywhere in Nigeria. Price and timeline are agreed on WhatsApp: 60% deposit, 40% when ready.

- Ideas sheet: "More ideas on Pinterest" opens Mimi's own Pinterest first (https://pin.it/1qFPQb6Ru → pinterest.com/Mimicrochetng, all her crochet work); the search below always prefixes "crochet" (https://www.pinterest.com/search/pins/?q=crochet%20<words>).

### References used
- Edit product upload: added photos as rows with a thumbnail, a "Main" tag and a dashed "Add another photo".
- Chat box with a + menu: one box to type, add a photo, or record.
- "Hold to speak": a voice-note button.
- AI analysing documents (Found / Missing) and the Quota checklist: "3 of 5 ready".
- Component sheet date picker: "By a date" with quick picks.
- Quota drafted message: "Sent" previews the WhatsApp message before it opens.

### Motion
Taken from v1 (filmed 2 Oct). Kept nearly all of it; one part changed so it stays honest.

| Moment | What moves | Timing | From v1 |
|---|---|---|---|
| Moving between steps | Next step slides in from the side you're heading; title, text and options rise in one after another | 0.42s, 0.08s between items | Kept |
| Picking a chip | Lifts on hover, squashes on tap, a tick pops in with a small overshoot | 0.25s | Kept |
| Progress | Bar springs forward with a soft shine at its tip; step counter updates | spring (stiffness 90, damping 18) | Kept |
| Your request card | The row you just filled flashes amber and fades back; "3 of 5 ready" ticks up | 0.95s fade | Kept |
| Everything filled | "Ready to send" stamp lands oversized and tilted, then settles | spring with overshoot | Kept (renamed from "Brief ready") |
| Send | Sheet rises; spinner; three checkpoints: saving the request, creating the tracking link, writing the WhatsApp message | ~1.5s, never longer than the real work | Changed (v1's checkpoints didn't really happen) |
| Sent | Check draws itself, one confetti pop, the order card's first stage fills in | 0.5s draw, confetti once | Kept, moved to the real order moment |
| Reduced motion | No sliding, bouncing or confetti; short fades | 0.2s | Kept |

---

## Order tracking (new in v2)
v1 had no tracking; customers had to ask on WhatsApp.

- Answers "where is my order, and what's next?" in 3 seconds: heading in words, the stepper, "Expected ready" date.
- Mimi's progress photo is the heart of the page.
- Every update is dated, so nobody has to send "any news?".
- Money is clear: what's left to pay, and the rows that add up to it.
- Private link: a short random code (mimicrochet.ng/t/k7x2p9), not the order number. The page shows the area, never the full address or phone number.
- Delivered closes the loop: Mimi's finished photo, then "Send Mimi a photo" (can feed Worn, loved, re-worn with their OK).
- One WhatsApp action at a time. Phones get a floating "Message Mimi" pill with space under the content.
- "Price agreed" state: price, ready-by, 40% balance, the 60% deposit with Mimi's bank details, and "I've paid". Mimi confirms from the same link.

### References used
- Dawn: centred serif heading, the order pill, soft collapsible sections, the floating pill.
- DoorDash order screens: the status sentence, order details, contact and money rows; don't let a floating button cover content.
- Shipment tracking dashboard: the icon stepper with labels.
- "Run details" timeline: a dated vertical history.
- Clerk checkout: one big amount, then the rows that add up to it.
- Designer names still to add when crediting publicly.

---

## Cart & checkout

### v1 audit
Payments were off in v1, so only empty states existed. Keep: clear empty states with one action. v2 needed the full flow.

### v2 decisions
- Each piece is one of a kind: no quantity steppers; each row says "the only one". Another size goes through a custom order.
- The bag is a drawer: add, see it, then checkout or keep shopping. No cart page.
- One-page checkout in three numbered parts. Email is required because Paystack sends the receipt there.
- Delivery is paid to the rider on arrival; checkout charges only the pieces.
- Paystack (card, bank transfer, USSD). The prototype uses test mode.
- "Paid" mirrors the custom order's "Sent": an order card (Paid, Packing, On its way, Delivered), the tracking link and the receipt.

### References used
- Clerk checkout: one big total, the itemised list, the form in a card beside it.
- DoorDash: order details and the rider note.
- Component sheet: the amber info strip.

### Motion

| Moment | What moves | Timing | From v1 |
|---|---|---|---|
| Add to bag | Bag slides up (phones) or in from the right (desktop); the new row glows green | 0.36s ease-out | Kept |
| Remove a piece | Row slides out right; the list closes the gap | 0.3s | Kept |
| Page load | Summary and form rise in one after the other | 0.45s, 0.08s apart | Kept |
| A field is wrong | Small side-to-side shake, then the message | 0.3s | Kept |
| Pay | Button spinner while Paystack opens | until Paystack responds | New |
| Paid | Check draws itself, one confetti pop | 0.5s draw, confetti once | New |
| Reduced motion | Short fades only | 0.2s | Kept |

---

## About & contact

### v1 audit
**Keep:** the "Port Harcourt energy" voice and the maker's story; every contact channel in one place.
**Fix:** the artist photo was missing (blank space); five contact ways compete (WhatsApp should lead); a floating AI "Mimi" button on every page.

### v2 decisions
- Kept v1's voice: "Port Harcourt energy" and the studio standard quote.
- One portrait instead of three from the same shoot; real making-of stills in "How a piece comes to life" (yarn: video 31; stitching: video 40).
- Five generic value cards became three facts: one of one, made to your size, anywhere in Nigeria.
- Contact leads with WhatsApp: four ready questions open WhatsApp already typed. v1's form is gone.
- "Before you ask" answers Mimi's real rules: delivery, 60/40, timing, sizes, returns, payment.
- Track an order sits on Contact too.
- The floating AI "Mimi" button is removed site-wide.

### References used
- Dawn: warm canvas and big serif headings.
- "Hold to speak" list: the ready-made questions on the WhatsApp card.
- Quota's drafted message.
- Component sheet: the FAQ accordion.
- Kept from v1: the headline, the marquee, the thread rail and the stitched cards.

### Motion

| Moment | What moves | Timing | From v1 |
|---|---|---|---|
| Thread rail | A yarn thread on the left edge draws down as you scroll; knots light up per section. Large screens only | follows scroll (spring) | Kept |
| Headline | Words rise in one by one, then the hand-drawn underline draws under "Port Harcourt" | 0.055s between words, 0.6s line | Kept |
| Sections | Each section wipes in from the top | 0.95s | Kept |
| Photos | The portrait drifts slowly inside its frame; the tan frame stays put | follows scroll | Kept |
| Marquee | Drifts, speeds up and reverses with scroll, leans with speed | continuous | Changed ("Fit-tested before release" left out until Mimi confirms) |
| Fact cards | Stitched border draws in, warm sheen follows the cursor, lift on hover | spring | Kept |
| Contact questions | Lift on hover and nudge the arrow; tap opens WhatsApp with it typed | 0.2s | New |
| FAQ | Answers open and close smoothly; + turns into – | 0.3s | New |
| Reduced motion | No thread, marquee, drift or wipes | none | Kept |

---

## Mimi's orders (new in v2)
v1 had no page for Mimi; requests arrived as WhatsApp messages.

- Mimi never retypes: requests arrive filled in from the custom order form. Orders that start on WhatsApp or Instagram go in with "Add an order".
- Today answers "what do I do now?": a greeting, one line, two numbers, and a "Needs you" list (verb, who, when, one button).
- Orders grouped by stage, dates in plain words: "2 days late" in red, "Start by Thu" in amber.
- Each order suggests its next step. One tap updates the customer's tracking page.
- Post an update: a photo, a short note, an optional "mark as ready". About ten seconds.
- "Deposit paid" is the glossy toggle.
- Private: a passcode in the prototype, a real login later. Orders and names are made-up samples.
- One link, two views: the customer's tracking link is also Mimi's order page when she's signed in.
- After agreeing on WhatsApp, Mimi taps "Set price": price, ready-by date, rush extra. The site splits 60/40 and writes the WhatsApp message with her bank details.
- The customer pays the deposit and taps "I've paid"; Mimi checks her bank and taps "Deposit received". The order moves to In progress.

### References used
- "Good afternoon" and "Good morning, Rico": a greeting, one line, then the list.
- "Hi Sarah" to-dos: tasks as verb, who and when.
- Invoices table: plain-word due dates, "Next action" column, number cards above.
- Clerk users table: filter chips with counts.
- Quota: the "Suggested" next step.
- Glossy toggle: "Deposit paid".
- Dawn: soft stage groups and the floating "Add an order" pill.
- Edit product upload: photo tiles in "Post an update".


---

## Motion and details taken from the 3 Oct references (Fitag concept + Google cart)

Source videos: `design-assets/incoming/refs-oct3/v1–v4.mp4` and `img-7…11.webp`. Purple, fit scores and first-visit tips were not taken.

| Idea | From | Where on Mimi's site | How it moves |
|---|---|---|---|
| **Spotlight a change** (the signature) | Google cart (v1) | Tracking page when something changed since the last visit; Saved when a piece sells; Mimi's orders after she posts an update | The changed card lifts (scale 1.04, shadow) while the rest blurs 6px and dims; the stage/status swaps in place (crossfade); a warm gradient outline (amber-400 → rose-400 → emerald-400) traces around the new part once (~0.8s) and fades; card settles back (~0.4s spring). Whole moment ≤2.5s, once per change, skipped with reduced motion. |
| Outline-trace badge | v1 | "Ready", "Sold", "Made in 3 days" pills when they first appear | An empty pill outline draws left→right, then fills solid and the text fades in (~0.6s). |
| Photos join the message | Fitag (v2) | Custom order: added photo rows; Sent: the WhatsApp preview's attached photos | Each thumbnail fades in from blur and scale 0.6, 0.12s apart, nudging earlier ones aside. |
| Value-first chip pop | v2 | Size chip on product photos | Chip grows from a dot (scale 0 → 1.06 → 1, ~0.35s) when the card enters view; text fades in last. |
| Centre-out stagger | v2 | Product size buttons (XS–XL) | The in-stock size appears first, then neighbours outward, 0.05s apart, so the eye lands on the size that exists. |
| Ruler picker | img 9/11 | Measurements sheet (new Figma screen "2 Make it yours · Measuring") | Drag/scroll the ticks with snap per cm (or ½ in); the big number counts with the drag; ticks fade/shrink with distance (bell curve); light haptic on phones (navigator.vibrate(5)) per step; arrow keys ±1, Shift ±5. Unit toggle converts in place. "Next: Waist" walks through Bust → Waist → Hips → Length. |
| Sheet spring | v3 | All bottom sheets (bag, filters, ideas, measuring) | Rise with a soft overshoot (spring stiffness ~260, damping ~26); page behind dims to 45%; drag the handle down to close. |

New in Figma (3 Oct): size chip on ready-to-wear product cards (component property "Size label": M, XL for shirts), photo thumbnails in the WhatsApp message preview on Sent, and the Measuring screen.
