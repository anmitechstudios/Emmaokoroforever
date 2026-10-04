# Memorial

A digital memorial: a quiet, editorial walk through one person's life, with tributes, memories, a guestbook and a family dashboard for looking after it all.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4 and Motion. Content lives in a database — a local file store out of the box, Supabase in production.

## Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The dashboard is at `/admin`; the sign-in email and password are in `.env.local` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Change the password under **Settings** once you are in.

Without Supabase configured, the site keeps its data in `.data/` (a JSON file plus uploaded files), starting from the content in [`src/lib/db/seed.ts`](src/lib/db/seed.ts).

## What the family can do

Everything on the public page is edited from `/admin`:

| Dashboard page | Controls |
| --- | --- |
| Overview | What is waiting for review |
| Tributes · Memories · Guestbook · Candles | Approve, reject, edit, delete, search, filter by status |
| Name & portrait | Name, dates, portrait, quote, introduction, closing message |
| Life story | Chapters with photographs and pull quotes, re-orderable |
| Timeline · Family · Favourite things | Add, edit, delete, order |
| Photographs | Upload many at once, captions, dates, albums |
| Video & audio | YouTube/Vimeo links or uploaded files (up to 4 MB) — the public section is currently commented out in `src/app/(site)/page.tsx` |
| Service | Date, venue, map, schedule, dress code, livestream |
| Settings | Theme, accent colour, which sections appear, share text, family contact, sign-in email and password |

Tributes are published as soon as they are sent; the family can unpublish or delete any of them, and a tribute reported by three different visitors is hidden until someone looks at it. Memories and candle names wait for approval.

## Going live on Vercel

The site needs Supabase in production — Vercel's file system is read-only, and the site refuses to start there without it.

1. **Supabase** — if you haven't already, run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor of your Supabase project.
2. **Put the code on GitHub** — create an empty private repository and push this folder to it (`.env.local` is ignored and stays on your machine).
3. **Import it in Vercel** — vercel.com → Add New → Project → choose the repository. The framework is detected as Next.js; no build settings need changing.
4. **Environment variables** (Project → Settings → Environment Variables), before the first deploy:

   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | the secret key from Supabase → Project Settings → API |
   | `SESSION_SECRET` | a new random string: `openssl rand -hex 32` |
   | `SITE_URL` | the public address, e.g. `https://emmanuelokoro.com` (defaults to the Vercel domain) |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | only used if the database has no administrator yet |

5. **Deploy.** Add a custom domain under Project → Settings → Domains if you have one, then update `SITE_URL` and redeploy so share previews use it.

Uploads go through Vercel's 4.5 MB request limit: photographs are shrunk in the browser first, and recordings are capped at 4 MB — use a YouTube or Vimeo link for anything longer.

## How it is put together

```
src/
  app/
    (site)/            public pages — home, /tributes/[id], /privacy, social preview image
    admin/             dashboard — sign-in, and (dash)/ behind authentication
    api/               tribute search & paging, photograph downloads
    media/[name]/      serves locally stored uploads (with range requests for audio/video)
    memorial.pdf/      the printable memorial booklet
  components/
    ui/                motion primitives, modal, form fields, icons
    site/              one component per section of the memorial
    admin/             forms, repeater, moderation list, uploader
  lib/
    db/                types, driver interface, local + Supabase drivers, starting content
    actions/           server actions — public.ts (visitors), admin.ts (family)
    auth/              password hashing, signed session cookie
    security/          rate limiting, bot checks, visitor hashing
    storage/           image and media uploads
    queries.ts         everything the public pages read
    validation.ts      Zod schemas for every form
```

**Data.** `Memorial`, `TimelineEvent`, `GalleryImage`, `Tribute`, `Memory`, `GuestbookEntry`, `Candle`, `FamilyMember`, `ServiceInfo`, `MediaItem`, `AdminUser`, `Report` — see [`src/lib/db/types.ts`](src/lib/db/types.ts). Every row carries a `memorial_id`, so one database can hold several memorials; a deployment picks its memorial with `MEMORIAL_SLUG`.

**Design system.** Tokens, type scale, buttons, fields, dialogs and print styles are in [`src/app/globals.css`](src/app/globals.css). Three themes (Ivory, Stone, Evening) and one accent colour, both chosen in Settings.

**Motion.** One easing curve, slow durations, every reveal plays once ([`src/components/ui/motion.tsx`](src/components/ui/motion.tsx)). The first screen animates in CSS so it never waits for JavaScript. `prefers-reduced-motion` removes movement throughout.

**Caching.** Public pages are prerendered and refreshed in the background; any change in the dashboard revalidates them immediately.

## Privacy and safety

- Visitor emails are optional, shown only in the dashboard, and stripped in `queries.ts` before anything reaches a browser.
- Submissions are validated, checked for automation (hidden field, minimum time), limited per visitor, and held for moderation.
- Uploaded photographs are decoded and re-encoded: non-images are rejected and embedded metadata, including GPS location, is removed.
- IP addresses are never stored — only a salted one-way hash, used for rate limiting.
- The dashboard checks the session on every page and every action. Passwords are hashed with scrypt; sign-in attempts are limited.
- With Supabase, Row Level Security is on with no public policies: only the server can read or write.

Known limits: the short-window limits on hearts, reports and sign-in attempts are held in memory per server instance (submission limits are database-backed). There is no Content-Security-Policy header yet. Changing a password does not sign out other sessions.
