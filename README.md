# SCI Bingo

Two song-guessing games for String Cheese Incident shows, both built around
a shared idea: a **game** (Bingo or Pick 3) covers one or more real **shows**
(a single night, or a 2-3 night run), everyone enters once for the whole
game, and it stays open across every show it covers until the admin manually
completes it and declares a winner.

- **Bingo** — build a 5x5 card by picking a unique SCI song per square
  (center is free).
- **Pick 3** — pick 3 songs; you hit once all 3 get played.

Shows are shared across games: if a Bingo game and a Pick 3 game both cover
the same actual concert, the admin marks a song played **once** and both
games update — no double entry during a live show.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL via Prisma
- Custom auth: bcrypt-hashed passwords + signed JWT session cookies (`jose`) —
  no third-party auth provider
- Song catalog seeded from `phantasytour.com`'s public SCI songs API (1,247
  songs, in `prisma/seed-data/sci-songs.json`)

## How access works

There are two independent layers:

1. **Site gate** — one shared keyword + password (`GATE_KEYWORD` /
   `GATE_PASSWORD` env vars) that anyone needs to get past `/gate` before
   seeing anything else. This just keeps randoms off the site; it's not tied
   to an account.
2. **Accounts** — real registration (username, email, password) for players,
   and a separate `/admin/login` (nickname + password) for whoever's running
   the board. The very first admin is created via the seed script (see
   below); after that, any admin can promote other registered users to admin
   from `/admin/users` — no need to track a separate list or touch the seed
   script again.

## Local setup

> **On Windows:** if `npm install`/`next dev` fail with `EACCES` on network
> calls, it's usually endpoint-security software blocking `node.exe`
> specifically (not a proxy/DNS issue — `curl` still works fine). The
> reliable fix is developing inside WSL2 instead: install Node there via
> [nvm](https://github.com/nvm-sh/nvm) (`nvm install --lts`), and either
> install Docker Desktop with WSL integration for step 2 below, or install
> Postgres directly in the distro (`sudo apt install postgresql`). This repo
> was built and fully verified end-to-end (build, lint, tests, and live runs
> of both game types, including two simultaneous games sharing a show)
> inside WSL2 Ubuntu.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start Postgres** (or point `DATABASE_URL` at any Postgres instance you
   already have):

   ```bash
   docker compose up -d db
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Fill in `SESSION_SECRET` (a long random string — the `.env.example`
   comment shows a one-liner to generate one), and set `GATE_KEYWORD` /
   `GATE_PASSWORD` to whatever you want your crew to type in. Set
   `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD` to create your first admin
   login.

4. **Create the database schema and seed data**

   ```bash
   npm run db:setup
   ```

   This runs the Prisma migration and seeds all ~1,247 SCI songs plus your
   admin account (if the `ADMIN_SEED_*` vars are set).

5. **Run it**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` — you'll land on `/gate` first.

## Running a game

1. Sign in at `/admin/login` with the admin account from the seed step.
2. `/admin` → **New game** → pick Bingo or Pick 3, give it a name and entry
   fee, and optionally your Venmo handle (editable later too). It starts in
   `DRAFT`.
3. Hit **Activate** when you want players to be able to enter. Only one game
   of each type can be `ACTIVE` at a time (a Bingo game and a Pick 3 game can
   both be active together).
4. Players sign up / sign in, land on `/`, and build their card or entry (one
   per game; entering also creates their payment record, defaulted to
   **unpaid** — it only flips once you mark it paid yourself after collecting
   the money however you actually collect it. If you set a Venmo handle on
   the game, the player sees a "next step" prompt right after entering — a
   tap-to-pay Venmo link plus a generated QR code — which disappears once
   you mark them paid. The dashboard and the game's admin page both show the
   **pot** — entries × entry fee, regardless of who's paid yet).
5. On the game's manage page (`/admin/games/[id]`), add each show it covers
   (label, venue, date) — or attach a show that already exists if another
   game covers the same night — and mark songs played against whichever show
   is selected. Every player's card/entry updates automatically (polling,
   every ~5-7s), and so does every *other* active game that also includes
   that show. Mark players as **Paid** there too once you've actually
   collected from them.
6. The game keeps running across all its shows — nothing ends it
   automatically. When it's actually over, use **Complete game…** to pick the
   winner (the admin's call — the page suggests whoever hit first, but
   you're not locked into that) and close it out. It'll then show up on
   everyone's `/history` with the winner called out.

## Managing admins

`/admin/users` lists everyone who's registered. Click **Make admin** next to
anyone who should be running the board — no separate list to maintain, and
no re-seeding needed. (An admin can't remove their own access, just to avoid
locking everyone out by accident.)

## Tests

`src/lib/bingo.ts` (win-line detection, first-to-bingo timing) and
`src/lib/pick3.ts` (all-3-hit timing) are pure logic with unit tests:

```bash
npm test
```

## Deploying

- `Dockerfile` builds a standalone production image (works on Railway,
  Render, Fly.io, a plain VPS with Docker, etc). `docker-compose.yml` is for
  local Postgres only — bring your own Postgres in production (or add a `db`
  service to a compose file on your host) and point `DATABASE_URL` at it.
- Whatever you use, set the same env vars as `.env.example` in production,
  run `prisma migrate deploy` once against the prod database, and
  `npm run prisma:seed` once to load the songs + create the admin account.
- The site gate keyword/password are meant to be low-stakes (deterring
  strangers, not securing anything sensitive) — real security comes from the
  hashed-password accounts and JWT sessions.

## Design

The background (`src/components/PosterBackground.tsx`) is an original,
hand-built psychedelic jam-band-poster-style collage (gradients + SVG
mountains/mandala/mushrooms/swirls) — inspired by the general vibe of SCI's
poster art, not a reproduction of any specific real poster. Treat it as a v1
to tweak once you've seen it running. The favicon (`src/app/icon.png`) is a
cheese-wedge icon.
