# My Pick Nijigasaki

Pick your favorite Love Live! Nijigasaki songs (group / member / sub-unit /
others), export two shareable 9:16 images, save your grid behind a short URL,
and browse community stats. Bilingual — English / 日本語.

🔗 **Live:** https://mypick-nijigaku.naufalalfa.com

> Unofficial fan project. Inspired by
> [MyPickHasunosora](https://mypick.rurino.dev/) and
> [MyPickAqours](https://aqours-mypick.ccwu.cc/).

**Monolith:** one Next.js app is frontend + API + direct DB access in a single
process/deploy, self-hosted on Bun so it can reach a LAN Postgres.

## Tech stack

| Area | Tech |
|------|------|
| Runtime | [Bun](https://bun.sh) 1.3 |
| Framework | [Next.js](https://nextjs.org) 16 (App Router, standalone output), [React](https://react.dev) 19 |
| Language | [TypeScript](https://www.typescriptlang.org) 6 |
| Styling | [Tailwind CSS](https://tailwindcss.com) 4 (`@tailwindcss/postcss`), Poppins via `next/font` |
| Database | [PostgreSQL](https://www.postgresql.org) via [Drizzle ORM](https://orm.drizzle.team) 0.45 + `drizzle-kit`, [`postgres`](https://github.com/porsager/postgres) driver |
| Cache | [Redis](https://redis.io) (optional) via [`ioredis`](https://github.com/redis/ioredis) |
| Validation | [Zod](https://zod.dev) 4 |
| Image export | [`modern-screenshot`](https://github.com/qq15725/modern-screenshot) → WebP; OG cards via `next/og` |
| IDs | [`nanoid`](https://github.com/ai/nanoid) (10-char share ids) |
| Assets | Cloudflare R2 + CDN (cover images) |
| Data pipeline | Python 3 (standard library only) — scrape/build under `songs-data/` |
| Deploy | Docker Compose (web + nginx sidecar + redis) or Helm chart (Kubernetes); images on GHCR |

## Project layout

```
mypick-nijigasaki/
  web/            the app (Next.js 16, App Router, Bun, Tailwind 4)
    app/          routes (home, /p/[id], /community-picks, /songs, /api/picks)
    components/   Poster, Export (9:16 boards), Card, SongSlot, *Modal,
                  CommunityCards (analytics switcher), PicksProvider,
                  SiteHeader/Footer, LangToggle
    db/           schema.ts, queries.ts, seed.ts, index.ts (drizzle client)
    lib/          api, types, layout (colors/labels), i18n (en/ja), redis, site
    Dockerfile, .env.example
  chart/          Helm chart (web + nginx sidecar + redis); values.yaml.example
  songs-data/     source data + Python scrape/build pipeline (seed reads it)
  docker-compose.yml · nginx/ · Makefile
  API.md (routes) · DATA.md (DB schema) · CLAUDE.md (working notes)
```

## Architecture

- **Songs / characters** live in Postgres; Server Components query the DB
  directly via `db/queries.ts` (no internal HTTP). `songs.bucket`+`sort`
  denormalize `songs-data/songs-final.json`.
- **Picks** (`picks` table: `id`, `jsonb` of `slotId → songSlug`) created by
  `POST /api/picks`, rendered read-only at `/p/<id>`. **Anonymous** — no author
  name is sent or stored; the name a user types stays local, drawn only on the
  downloaded image.
- **Community analytics** (`/community-picks`) — 4 category cards (Nijigasaki /
  Units / Solo / Others), each with a **squircle switcher** that swaps the card
  body between views (`CommunityCards.tsx`, client). Views: Top Songs · By Unit ·
  Unit Leaders · Member Leaders · Most Diverse (spread score) · Pick Race ·
  Rising & Falling (Race + Movers on every card).
  - `getCommunityStats(lang)` — cheap aggregates (top songs w/ identity bar
    colors, by-unit, unit/member leaders, diversity); Redis `community:v6:<lang>`,
    60s.
  - `getCommunityTrends(lang)` — heavier: replays boards in `created_at` order to
    build the **Pick Race** (~60 cumulative keyframes of the top-8 standings, for
    an animated bar-chart race played 0→now) and **Rising & Falling** (current
    share vs the state 3,000 boards ago); Redis `trends:v2:<lang>`, 5 min.
  - `createPick` busts both, per-locale, on write. All view strings are formatted
    server-side (the client component takes plain data — no functions cross RSC).
- **All songs** (`/songs`) lists every song grouped by bucket; each cover is
  badged with its community pick count via `getSongPickCounts()` (slug→count,
  cached `pickcounts:v1`, also busted by `createPick`).
- **Redis** (`lib/redis.ts`) is an optional best-effort cache; if `REDIS_URL` is
  unset it silently no-ops (falls back to the DB).
- **i18n**: cookie `lang` (`en`|`ja`), read server-side via `lib/lang.ts`,
  toggled by `LangToggle`. `lib/i18n.ts` holds the dict. Japanese localizes
  **character names**; brand names (units, wordmark, URL) stay as-is.
- **Export**: `Export.tsx` renders two off-screen 900×1600 (9:16) boards with a
  split 12-color rainbow; `modern-screenshot` → WebP object URLs (small,
  mobile-safe). Embedded Poppins is inlined; covers load eagerly.
- **Share previews (OG)**: `metadataBase` comes from `SITE_URL`;
  `app/opengraph-image.tsx` renders a branded 1200×630 card so every route (and
  each `/p/<id>`) unfurls on Discord/X/LINE.
- **Cover images** are hot-linked from the R2 CDN
  (`https://<CDN_ENDPOINT>/nijigasaki-album/<slug>.webp`), which needs a
  permissive GET CORS header so canvas export can inline them.

## Configuration

All app config lives in **one** file, `web/.env` (gitignored). It is the single
source used by both local dev and docker-compose:

```bash
cp web/.env.example web/.env   # Postgres, CDN_ENDPOINT, SITE_URL
```

Runtime-only knobs (`NODE_ENV`, `HOSTNAME`, `PORT`, `REDIS_URL`) are set by the
deployment (compose `environment:` / Helm), not the env file.

## Develop

```bash
cd web
cp .env.example .env
bun install
bun run db:push      # create/sync tables
bun run seed         # load songs + characters from ../songs-data
bun run dev          # http://localhost:3000
```

`bunx tsc --noEmit` to typecheck. Postgres must be reachable at `POSTGRES_HOST`.

## Deploy — Docker Compose (web + redis + nginx)

```bash
cp web/.env.example web/.env   # fill in, then:
make build && make up          # nginx → http://localhost:8088
```

- **web** — Next standalone on Bun (`bun server.js`, binds `0.0.0.0:3000`).
- **redis** — ephemeral LRU cache (no persistence).
- **nginx** — public entry, reverse-proxies to `web:3000`.

Postgres is **not** in compose — it stays on the LAN (`POSTGRES_HOST`),
reachable from the `web` container. `make push` tags + pushes the web image to
GHCR.

## Deploy — Kubernetes (Helm)

```bash
cd chart
cp values.yaml.example values.yaml   # edit Postgres host/password + ingress host
make install                          # helm upgrade --install (namespace: nijigasaki)
```

`REDIS_URL`, `PORT`, and `SITE_URL` are injected by the chart (the last derived
from `ingress.hosts.web`) so they can't drift. See [chart/README.md](chart/README.md).

## Data refresh

Song data comes from `songs-data/` (a standard-library Python pipeline that
scrapes idol.st → `songs-final.json`). After regenerating it there, re-run
`bun run seed` in `web/`. See [songs-data/](songs-data/).

## Docs

[API.md](API.md) (endpoints) · [DATA.md](DATA.md) (Postgres schema) ·
[CLAUDE.md](CLAUDE.md) (working notes). Keep them in sync with code changes.

## Disclaimer

Non-commercial fan project. Song titles, logos, and images belong to their
respective rights holders (© プロジェクトラブライブ！虹ヶ咲学園スクールアイドル同好会).
Not affiliated with or endorsed by the rights holders.
