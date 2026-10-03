# Mimi Crochet v2

A redesign of [MIMICROCHET.NG](https://www.instagram.com/mimicrochet.ng), a handmade crochet studio in Port Harcourt, Nigeria. Every piece is made by hand by Mimi, and most are one of one.

The first version (5/10) was built straight in code. This version was rebuilt properly: real references, a full Figma design for every page, then code. The two sites live side by side so they can be compared.

## What's in it

- **Shop**: 41 real pieces with honest stock (the one size in stock, everything else made for you), saved pieces, filters, and a bag drawer.
- **Custom orders**: start from a photo, one of Mimi's pieces, an idea or your own words (including a hold-to-record voice note), add sizes or measurements with a drag ruler, and send it to Mimi. Every order gets a private tracking link.
- **Order tracking**: five stages from idea to doorstep, Mimi's progress photos, and a spotlight moment when something has changed since your last visit.
- **Mimi's orders** (`/studio`): her one-tap page to set prices (automatic 60/40 deposit split), confirm deposits and post updates. Each change appears on the customer's tracking page: one link, two views.
- **Worn, loved, re-worn**: real customers, each opening as an editorial story.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS v4, Motion. No backend yet: orders, saved pieces and the bag live on the device, and payments run in test mode.

```bash
npm install
npm run dev
```

## Credits

Pieces, photos and videos by Mimi. Customer photos were sent to Mimi by her customers; two customers' names and quotes are placeholders until they confirm. Concept pictures in "Ideas to have made" are labelled as ideas, not Mimi's finished work.
