# Mimi Crochet v2

A redesign of [MIMICROCHET.NG](https://www.instagram.com/mimicrochet.ng), a handmade crochet studio in Port Harcourt, Nigeria. Every piece is made by hand by Mimi, and most are one of one.

The first version (5/10) was built straight in code. This version was rebuilt properly: real references, a full Figma design for every page, then code. The two sites live side by side so they can be compared.

## What's in it

- **Shop**: 42 real pieces with honest stock (the one size in stock, everything else made for you), saved pieces, filters and a bag drawer. One-of-ones are held for 15 minutes while someone pays; once sold, a piece stays in the shop as "made for you".
- **Custom orders**: start from a photo, one of Mimi's pieces, an idea or your own words (including a hold-to-record voice note), add sizes or measurements with a drag ruler, and send it to Mimi. Photos and voice notes are uploaded and re-checked on the server.
- **Order tracking**: every order gets its own private page, also found by order number + the last 4 digits of the phone. Five stages from idea to doorstep, Mimi's progress photos, a spotlight on what changed since your last visit, and a paid moment when you come back from Paystack.
- **Payments**: Paystack checkout (card, bank transfer, USSD) for shop orders and for custom orders (60% deposit + 40% balance, or pay in full). Every payment is confirmed with Paystack on return and by a signed webhook.
- **Delivery**: Mimi sends it to the rider, the customer taps "I've received it" (or Mimi marks it delivered).
- **Mimi's orders** (`/studio`): her password-protected, home-screen app to set prices, post updates and progress photos, handle payments and delivery, with push notifications on her iPhone and Android. One order, two views: each change appears on the customer's page.
- **Worn, loved, re-worn**: real customers, each opening as an editorial story.
- **Privacy**: a plain-words privacy page; customer photos and voice notes are deleted 2 months after delivery; spam limits on every customer action.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS v4, Motion. Backend on the `feat/backend` branch: Neon Postgres, Netlify (functions + Blobs for private files), Paystack, web push (VAPID). Cloudflare sits in front for speed from Nigeria.

| Branch | Where | What |
|---|---|---|
| `main` | Vercel | The front end only: orders live on the device, checkout is a test order |
| `feat/backend` | Netlify test site (+ Cloudflare link) | The full site with the backend, Paystack in test mode |
| `live` | Netlify main address | Go-live only |

```bash
npm install
npm run dev
npm run db:migrate     # apply db/migrations to the database in .env.local
npm run studio:setup   # set Mimi's studio password + push keys
```

See `.env.example` for the settings the backend needs.

## Status

Built and tested in Paystack test mode. Waiting on the domain; the bot check (Turnstile), a final security pass and go-live come after it.

## Credits

Pieces, photos and videos by Mimi. Customer photos were sent to Mimi by her customers. Concept pictures in "Ideas to have made" are labelled as ideas, not Mimi's finished work.
