// Seed songs + characters from ../../songs-data, with cover images on the R2
// CDN. Idempotent. Run: bun run seed
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { dbEnv, coverUrl } from './env';
import { songs, characters } from './schema';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', '..', 'songs-data');
const read = (f: string) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));

const final = read('songs-final.json')['songs-final'] as Record<string, string[]>;
const details = Object.fromEntries(
  (read('songs-details.json')['songs-details'] as any[]).map((s) => [s.slug, s]),
);
const chars = read('characters.json')['characters'] as any[];

const songRows = Object.entries(final).flatMap(([bucket, slugs]) =>
  slugs.map((slug, i) => {
    const d = details[slug];
    if (!d) throw new Error(`no details for ${slug}`);
    return {
      id: d.id as number,
      slug,
      name: d.name as string,
      jpName: (d.jp_name ?? null) as string | null,
      image: coverUrl(slug),
      bucket,
      sort: i,
    };
  }),
);

const charRows = chars.map((c) => ({
  id: c.id as number,
  slug: c.slug as string,
  name: (c.en_name as string).split(' ')[0],
  fullName: c.en_name as string,
  jpName: c.jp_name as string,
  color: c.color as string,
  image: c.image as string,
}));

const sql = postgres(dbEnv());
const db = drizzle(sql);

await db.delete(songs);
await db.delete(characters);
await db.insert(songs).values(songRows);
await db.insert(characters).values(charRows);

console.log(
  `seeded ${songRows.length} songs across ${Object.keys(final).length} buckets, ${charRows.length} characters`,
);
await sql.end();
