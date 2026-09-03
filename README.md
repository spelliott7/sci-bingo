# SCI Bingo

Song bingo for String Cheese Incident shows. A **run** is one bingo game that
can span a handful of **shows** (a 2-3 night run, say) — everyone builds a
single 5x5 card for the whole run by picking a unique SCI song per square
(center is free), pays once to play, and watches their card fill in live as
the admin marks off songs at whichever show they're at. The run stays open
across every show in it until the admin manually completes it and declares a
winner.

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
   the board. Admin accounts are created via the seed script, not public
   registration — see below.

## Local setup

> **On Windows:** if `npm install`/`next dev` fail with `EACCES` on network
> calls, it's usually endpoint-security software blocking `node.exe`
> specifically (not a proxy/DNS issue — `curl` still works fine). The
> reliable fix is developing inside WSL2 instead: install Node there via
> [nvm](https://github.com/nvm-sh/nvm) (`nvm install --lts`), and either
> install Docker Desktop with WSL integration for step 2 below, or install
> Postgres directly in the distro (`sudo apt install postgresql`). This repo
> was built and fully verified end-to-end (build, lint, tests, and a live
> gate → register → build-a-card → mark-songs-played → payments → history
> run) inside WSL2 Ubuntu.

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

## Running a run

1. Sign in at `/admin/login` with the admin account from the seed step.
2. `/admin` → **New run** → give it a name and entry fee. It starts in
   `DRAFT`.
3. Hit **Activate** when you want players to be able to build cards. Only one
   run can be `ACTIVE` at a time.
4. Players sign up / sign in, land on `/`, and build their card (one per run;
   card creation also creates their payment record, defaulted to unpaid).
5. On the run's manage page (`/admin/runs/[id]`), add each show as it comes up
   (label, venue, date) and mark songs played against whichever show is
   selected — every player's card updates automatically (polling, every
   ~5-7s) and circles the matching squares regardless of which show a song
   was played at. Mark players as **Paid** there too; the page shows total
   collected vs. outstanding.
6. The run keeps running across all its shows — nothing ends it automatically.
   When it's actually over, use **Complete run…** to pick the winner (the
   admin's call — the page suggests whoever completed a line first, but
   you're not locked into that) and close it out. It'll then show up on
   everyone's `/history` with the winner called out.

## Tests

`src/lib/bingo.ts` (win-line detection, first-to-bingo timing) has unit
tests:

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
to tweak once you've seen it running.
