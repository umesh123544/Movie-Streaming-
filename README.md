# ReelHouse — Movie Streaming Site

Next.js (App Router) + MongoDB. Admin can upload movies; visitors stream them
online. Downloading is discouraged but **not cryptographically prevented**
(see the caveat at the bottom — important to read).

## 1. Install

```bash
cd movie-streaming
npm install
```

## 2. Set up MongoDB

Easiest option: free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
Copy the connection string.

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
- `MONGODB_URI` — your Atlas (or local) connection string
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32` and paste the output
- `ADMIN_EMAIL` — the email you'll log into `/admin/login` with
- `ADMIN_PASSWORD_HASH` — generate it:
  ```bash
  node scripts/hash-password.js "your-chosen-password"
  ```
  Paste the printed hash into `.env.local`.
- `UPLOAD_DIR` — leave as `./storage/videos` unless you want it elsewhere

## 4. Run

```bash
npm run dev
```

- Public site: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

## Two separate account systems

- **Admin** (`/admin/login` → dashboard/upload) — a single account whose
  credentials live only in `.env.local` (`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`).
  There is no admin signup page, by design.
- **Viewers** (`/signup`, `/login` → `/account`) — anyone can create an
  account to watch movies, save a **watchlist**, and see their **watch
  history**. Stored in the `User` MongoDB collection, completely separate
  from the admin account.

`middleware.js` enforces the split: a signed-in viewer is redirected away
from `/admin/*`, and a signed-in admin is redirected away from `/account`.

## How it's built

- **Admin panel** (`/admin/dashboard`, `/admin/upload`) — protected by
  NextAuth + `middleware.js`. Only your one admin account (from `.env.local`)
  can sign in; there's no public signup.
- **Viewer accounts** (`/api/auth/signup`) — regular visitors register with
  name/email/password; passwords are hashed with bcrypt before storage.
- **Watchlist** (`/api/watchlist`) — add/remove/list saved movies for the
  signed-in viewer. The "+ Add to watchlist" button on each movie page
  redirects a signed-out visitor to `/login` first.
- **Watch history** (`/api/history`) — recorded automatically the moment
  a signed-in viewer presses play (see `VideoPlayer.js`'s `onPlay` handler).
  Visitors who aren't signed in can still watch — it just isn't tracked.
- **Upload** (`/api/upload`) — saves the video file to `storage/videos/`,
  a folder **outside** `/public`, under a random UUID filename. It's never
  linked to directly.
- **Streaming** (`/api/stream/[id]`) — the `<video>` tag on the movie page
  points here, using the movie's database ID (not the real filename). This
  route reads the file with Node's `fs.createReadStream` and supports HTTP
  `Range` requests, which is what lets the browser seek/scrub smoothly.
- **Metadata** (`/api/movies`) — title, description, poster, genre etc. live
  in MongoDB via the `Movie` model.

## About "no download" — please read

This app makes casual downloading harder:
- No direct file URL is ever exposed (only `/api/stream/<mongo-id>`).
- The video element hides the built-in "download" button and blocks
  right-click "Save video as".
- Content is served `inline`, never as an `attachment`.

**But it cannot make video fully undownloadable.** Anyone who can play a
video in a browser can, with enough effort, capture it (screen recording,
browser devtools network tab, etc.). No JavaScript-level trick changes that.
The only way to meaningfully raise that bar further is real DRM (Widevine
on Chrome, FairPlay on Safari, PlayReady on Edge) via a service like
Shaka Packager + a license server, or a hosted provider (Mux, Cloudflare
Stream, api.video, etc.) that handles DRM for you. That's a materially
bigger, often paid, integration — happy to help you wire one up if you get
to that point.

## Legal note

Only upload content you own or are licensed to distribute. Uploading
copyrighted movies you don't have rights to (most commercial films) is
copyright infringement regardless of how the site is built.
