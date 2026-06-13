# Database

PostgreSQL (host `192.168.18.37:5432`), database **`mypick-nijigasaku`**.
Schema is defined with Drizzle in [`web/db/schema.ts`](web/db/schema.ts) and
applied with `bun run db:push`. Seeded from `songs-data/` with `bun run seed`.

Current row counts: `songs` 194 · `characters` 13 · `picks` (grows with shares).

---

## `songs`
One row per song. `bucket` + `sort` denormalize `songs-final.json` — each song
sits in exactly one bucket.

| column       | type                        | notes |
|--------------|-----------------------------|-------|
| `id`         | `integer` PK                | idol.st song id (manual entries not on idol.st use ids ≥ 90000, e.g. `Cheer-Mode`) |
| `slug`       | `text` NOT NULL, UNIQUE     | join key everywhere |
| `name`       | `text` NOT NULL             | romaji/English title |
| `jp_name`    | `text` NULL                 | Japanese title (may be null) |
| `image`      | `text` NOT NULL             | R2 CDN url (`.../nijigasaki-album/<slug>.webp`) |
| `bucket`     | `text` NOT NULL             | see **Buckets** below |
| `sort`       | `integer` NOT NULL          | position within the bucket |
| `created_at` | `timestamp` NOT NULL def now |       |

Index: `songs_bucket_idx` on `(bucket, sort)` — drives the grouped `getSongs()` read.

### Buckets
`bucket` is one of:
- **Group:** `Nijigaku` (38)
- **Subunits:** `AZUNA` (11), `QU4RTZ` (11), `DiverDiva` (11), `R3BIRTH` (5)
- **Members (character slugs):** `Ayumu-Uehara`, `Kasumi-Nakasu`, `Shizuku-Osaka`,
  `Karin-Asaka`, `Ai-Miyashita`, `Kanata-Konoe`, `Setsuna-Yuki`, `Emma-Verde`,
  `Rina-Tennoji`, `Shioriko-Mifune`, `Lanzhu-Zhong`, `Mia-Taylor`
- **Catch-all:** `Others` (14)

---

## `characters`
Drives member-card color/label. 13 rows (gen_id=2 Nijigasaki).

| column      | type                    | notes |
|-------------|-------------------------|-------|
| `id`        | `integer` PK            | sort order (1..13) |
| `slug`      | `text` NOT NULL, UNIQUE | matches a song `bucket` |
| `name`      | `text` NOT NULL         | short, e.g. `Ayumu` |
| `full_name` | `text` NOT NULL         | e.g. `Ayumu Uehara` |
| `jp_name`   | `text` NOT NULL         | e.g. `上原歩夢` |
| `color`     | `text` NOT NULL         | hex, card accent |
| `image`     | `text` NOT NULL         | character image url |

> Yu-Takasaki exists upstream but is **not** seeded (no song bucket), so members
> resolve to 12 cards.

---

## `picks`
A saved, shareable pick set (served at `/p/:id`).

| column       | type                         | notes |
|--------------|------------------------------|-------|
| `id`         | `text` PK                    | 10-char nanoid (the share id) |
| `data`       | `jsonb` NOT NULL             | `{ "<slotId>": "<songSlug>" }` |
| `created_at` | `timestamp` NOT NULL def now |       |

Picks are **anonymous** — the author name is used only client-side for the
exported image and is never sent to or stored on the server.

`data` example:
```json
{ "Nijigaku#0": "TOKIMEKI-Runners", "Ayumu-Uehara#0": "Dream-with-You" }
```

---

## Pipeline & seeding
```
songs-data/  (Python pipeline: songs-final.json + songs-details.json + characters.json)
      │  bun run seed   (web/db/seed.ts)
      ▼
Postgres: songs (image → CDN url), characters
```
- `songs.image` is rewritten to the CDN url at seed time (`coverUrl(slug)`).
- Seed is **idempotent**: it truncates `songs` + `characters` then re-inserts.
  It does **not** touch `picks`.
- After regenerating data in `songs-data/`, re-run `bun run seed`.
