# API & Routes

The app is a single Next.js monolith. **Song data is read server-side** (Server
Components query Postgres directly — there is no `/api/songs` endpoint). Only
pick creation/lookup is exposed over HTTP.

Base URL in dev: `http://localhost:3000`

---

## Page routes (SSR)

### `GET /`
Home grid. Server Component calls `getSongs()` (direct DB query) and renders the
editable poster. No client fetch for songs — data arrives in the SSR HTML.

### `GET /p/:id`
A shared, **read-only** pick set. Server Component calls `getPick(id)` +
`getSongs()`. Returns the Next `not-found` (404) page if the id doesn't exist.

### `GET /community-picks`
Aggregated community stats (SSR). Calls `getCommunityStats(lang)` — most-picked
songs overall + per category (Nijigasaki / units / solo / others), with counts
and percentages.

### `GET /songs`
Every song, grouped by bucket (SSR), via `getSongs()`.

All page routes read the `lang` cookie (`en`|`ja`) for locale.

---

## API routes (`app/api/...`)

### `POST /api/picks`
Create a shareable pick set.

**Request body**
```json
{ "data": { "Ayumu-Uehara#0": "Dream-with-You", "QU4RTZ#0": "Twinkle-Town" } }
```
- `data` — object mapping `slotId` → song `slug`. 1–30 entries; keys ≤40 / values ≤80 chars.
- `slotId` format: `"<bucket>#<index>"` (e.g. `Nijigaku#0..2`, `Others#0..1`,
  `Ayumu-Uehara#0`, `AZUNA#0`).
- **Picks are anonymous** — there is no author-name field. The name a user types
  stays purely client-side (drawn onto the downloaded image only); it is never
  sent to or stored on the server.

**Responses**
| status | body | when |
|--------|------|------|
| `201`  | `{ "id": "kua06Lsycm" }` | created (id = 10-char nanoid) |
| `400`  | `{ "error": "invalid body" }` | missing/empty `data` or bad shape |

```bash
curl -X POST localhost:3000/api/picks \
  -H 'content-type: application/json' \
  -d '{"data":{"Ayumu-Uehara#0":"Dream-with-You"}}'
```

### `GET /api/picks/:id`
Fetch a saved pick set.

**Responses**
| status | body |
|--------|------|
| `200`  | `{ "id": "kua06Lsycm", "data": { "<slotId>": "<slug>" } }` |
| `404`  | `{ "error": "not found" }` |

```bash
curl localhost:3000/api/picks/kua06Lsycm
```

---

## Notes
- Validation: `POST /api/picks` uses a zod schema (`data` = record of string→string,
  1–30 keys).
- Cover images are not served by the app — they're hot-linked from the R2 CDN
  (`https://<CDN_ENDPOINT>/nijigasaki-album/<slug>.webp`); the URL is stored as
  the song's `image`.
- Picks store song **slugs**; the client resolves slug → song via the songs map
  passed from the server.
