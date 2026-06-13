# MyPick Nijigasaki — working notes

A single Next.js 16 (App Router) monolith on **Bun**: frontend + API route
handlers + direct Postgres access in one process. Tailwind 4, Drizzle ORM,
optional Redis cache, R2/CDN cover images. Self-hosted (it reaches a LAN
Postgres, so it can't be a Cloudflare Worker).

## ⚠️ Always keep the docs in sync

When you change any of the following, **update the relevant `.md` in the same
change** (don't leave them stale):

- **Routes / API** (`app/**/route.ts`, new pages) → [API.md](API.md)
- **DB schema** (`web/db/schema.ts`, migrations) → [DATA.md](DATA.md)
- **Architecture / features / env / deploy** → [README.md](README.md)

Treat the docs as part of "done". A change isn't complete until the docs match.

## Orientation

- `web/` is the app. Run from there: `bun run dev`, `db:push`, `seed`,
  `typecheck`. `bun run build` then deploy via `docker compose` (`make up`).
- **Data flow:** Server Components read the DB directly (`db/queries.ts`); the
  only HTTP API is `POST/GET /api/picks`. Songs are seeded from `../songs-data`.
- **Colors/labels:** group/unit display config + `headerBg`/`headerText`/
  `MEMBER_COLORS` live in `lib/layout.ts`; member colors come from the DB
  `characters` table. The rainbow uses member colors only.
- **i18n:** cookie `lang` (`en`|`ja`); `lib/lang.ts` (server read) +
  `lib/i18n.ts` (dict) + `LangToggle`. Add new user-facing strings to the dict —
  don't hardcode English in components.
- **Export:** fixed 9:16 boards in `Export.tsx`, captured off-screen with
  `modern-screenshot` → WebP. Keep covers eager (off-screen lazy images stall
  capture) and `crossOrigin` set.
- **Env:** see `web/.env.example` (Postgres + CDN + optional `REDIS_URL`).
  Never commit real `.env`.

## Conventions

- Bun for everything (`bun run …`, `bunx …`), not npm/node.
- Verify changes with `bunx tsc --noEmit` and `bun run build` before claiming done.
- Brand names stay as-is in both locales (unit names, "MY PICK NIJIGASAKI"
  wordmark, the domain). Only character names + UI chrome localize.
