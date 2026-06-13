import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from './index';
import { songs, characters, picks } from './schema';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';
import { GROUP, OTHER, SUBUNITS, headerBg, isLightColor } from '@/lib/layout';
import { dict, type Lang } from '@/lib/i18n';
import type { SongsResponse, PicksData, Song, Character } from '@/lib/types';

const SONGS_KEY = 'songs:v3'; // bumped: image back to the direct CDN url
const SONGS_TTL = 300; // 5 min — songs change only on reseed
const PICK_TTL = 86400; // 1 day — picks are immutable once created
const COMMUNITY_KEY = 'community:v3'; // bumped: added diverseMembers
const COMMUNITY_TTL = 60; // recompute at most once a minute
const LANGS = Object.keys(dict) as Lang[]; // every locale's community cache key

async function loadSongs(): Promise<SongsResponse> {
  const db = getDb();
  const [songRows, charRows] = await Promise.all([
    db.select().from(songs).orderBy(asc(songs.bucket), asc(songs.sort)),
    db.select().from(characters).orderBy(asc(characters.id)),
  ]);

  const buckets: Record<string, Song[]> = {};
  for (const s of songRows) {
    (buckets[s.bucket] ??= []).push({
      id: s.id,
      slug: s.slug,
      name: s.name,
      jpName: s.jpName,
      image: s.image, // direct R2/CDN url (CORS handled by the CF transform rule)
      bucket: s.bucket,
      sort: s.sort,
    });
  }

  const chars: Character[] = charRows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    fullName: c.fullName,
    jpName: c.jpName,
    color: c.color,
    image: c.image,
  }));

  return { songs: buckets, characters: chars };
}

export async function getSongs(): Promise<SongsResponse> {
  const cached = await cacheGet<SongsResponse>(SONGS_KEY);
  if (cached) return cached;
  const data = await loadSongs();
  await cacheSet(SONGS_KEY, data, SONGS_TTL);
  return data;
}

export interface SavedPick {
  data: PicksData;
}

export async function getPick(id: string): Promise<SavedPick | null> {
  const key = `pick:${id}`;
  const cached = await cacheGet<SavedPick>(key);
  if (cached) return cached;

  const [row] = await getDb().select().from(picks).where(eq(picks.id, id)).limit(1);
  if (!row) return null;
  const saved: SavedPick = { data: row.data as PicksData };
  await cacheSet(key, saved, PICK_TTL);
  return saved;
}

export async function createPick(data: PicksData): Promise<string> {
  const id = nanoid(10);
  // Author names are never stored — picks are anonymous by design.
  await getDb().insert(picks).values({ id, data });
  await cacheSet(`pick:${id}`, { data } satisfies SavedPick, PICK_TTL);
  // Bust the community-stats cache (both locales) so the new board is reflected
  // on the next /community-picks load instead of waiting out the 60s TTL.
  await cacheDel(...LANGS.map((l) => `${COMMUNITY_KEY}:${l}`));
  return id;
}

// ---- community aggregation ----

export interface SongStat {
  slug: string;
  name: string;
  subtitle: string; // which bucket it's filed under (group / unit / member)
  image: string;
  count: number; // # of boards that picked it
  pct: number; // count / boards
  color: string; // bar fill CSS — category/unit/member identity (solid hex or gradient)
  light: boolean; // true when `color` is a light solid hex (needs a contrast safeguard)
}

// Per-member diversity: how varied the community's picks of THAT member's solo
// songs are — measured by how many distinct songs of theirs got picked.
export interface MemberDiversity {
  slug: string;
  name: string;
  image: string;
  color: string;
  distinct: number; // # of different songs of theirs picked (the sort key)
  available: number; // # of songs in their solo catalog (bar denominator)
  picks: number; // total picks of their songs across all boards
  light: boolean; // light member color → bar needs a contrast safeguard
}

export interface CommunityStats {
  boards: number; // # of saved pick boards
  picks: number; // total individual selections across all boards
  group: SongStat[];
  units: SongStat[];
  solo: SongStat[];
  others: SongStat[];
  diverseMembers: MemberDiversity[]; // all 12 members, most-diverse first
}

type Cat = 'group' | 'units' | 'solo' | 'others';

export async function getCommunityStats(lang: Lang = 'en'): Promise<CommunityStats> {
  const cacheKey = `${COMMUNITY_KEY}:${lang}`;
  const cached = await cacheGet<CommunityStats>(cacheKey);
  if (cached) return cached;

  const [rows, { songs: byBucket, characters: chars }] = await Promise.all([
    getDb().select({ data: picks.data }).from(picks),
    getSongs(),
  ]);

  const bySlug: Record<string, Song> = {};
  for (const list of Object.values(byBucket)) for (const s of list) bySlug[s.slug] = s;

  const charName: Record<string, string> = {};
  const charColor: Record<string, string> = {};
  for (const c of chars) {
    charName[c.slug] = lang === 'ja' ? c.jpName : c.name;
    charColor[c.slug] = c.color;
  }
  const subunit = new Map(SUBUNITS.map((s) => [s.bucket, s.label]));
  // each unit's corrected color (DiverDiva resolves to its logo gradient)
  const unitBar = new Map(SUBUNITS.map((s) => [s.bucket, headerBg(s)]));

  // bar fill for a song, by its home bucket: group→gold, units→unit color,
  // solo→member image-color, others→neutral gray.
  const barColor = (bucket: string): string => {
    if (bucket === GROUP.bucket) return GROUP.color;
    if (bucket === OTHER.bucket) return '#b8b6ad';
    return unitBar.get(bucket) ?? charColor[bucket] ?? '#b8b6ad';
  };

  const t = dict[lang];
  const labelFor = (bucket: string): string => {
    if (bucket === GROUP.bucket) return t.groupLabel;
    if (bucket === OTHER.bucket) return t.othersLabel;
    return subunit.get(bucket) ?? charName[bucket] ?? bucket;
  };
  const catFor = (bucket: string): Cat => {
    if (bucket === GROUP.bucket) return 'group';
    if (bucket === OTHER.bucket) return 'others';
    if (subunit.has(bucket)) return 'units';
    return 'solo';
  };

  const boards = rows.length;
  let picksTotal = 0;
  const tally: Record<Cat, Record<string, number>> = {
    group: {},
    units: {},
    solo: {},
    others: {},
  };
  // per-member solo-song tally: memberTally[memberSlug][songSlug] = count
  const memberTally: Record<string, Record<string, number>> = {};

  for (const row of rows) {
    for (const [slotId, slug] of Object.entries(row.data as PicksData)) {
      picksTotal++;
      const bucket = slotId.split('#')[0];
      const cat = catFor(bucket);
      tally[cat][slug] = (tally[cat][slug] ?? 0) + 1;
      if (cat === 'solo') {
        (memberTally[bucket] ??= {})[slug] = (memberTally[bucket][slug] ?? 0) + 1;
      }
    }
  }

  // diversity for every member that has a solo bucket (drops Yu Takasaki → 12),
  // most distinct songs first; ties broken by total picks.
  const diverseMembers: MemberDiversity[] = chars
    .filter((c) => (byBucket[c.slug]?.length ?? 0) > 0)
    .map((c) => {
      const m = memberTally[c.slug] ?? {};
      const picksOfMember = Object.values(m).reduce((a, b) => a + b, 0);
      const color = charColor[c.slug] ?? '#b8b6ad';
      return {
        slug: c.slug,
        name: charName[c.slug] ?? c.name,
        image: c.image,
        color,
        distinct: Object.keys(m).length,
        available: byBucket[c.slug].length,
        picks: picksOfMember,
        light: color.startsWith('#') && isLightColor(color),
      };
    })
    .sort((a, b) => b.distinct - a.distinct || b.picks - a.picks);

  const top = (m: Record<string, number>): SongStat[] =>
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([slug, count]) => {
        const s = bySlug[slug];
        const color = s ? barColor(s.bucket) : '#b8b6ad';
        return {
          slug,
          name: s?.name ?? slug,
          subtitle: s ? labelFor(s.bucket) : '',
          image: s?.image ?? '',
          count,
          pct: boards ? count / boards : 0,
          color,
          light: color.startsWith('#') && isLightColor(color),
        };
      });

  const stats: CommunityStats = {
    boards,
    picks: picksTotal,
    group: top(tally.group),
    units: top(tally.units),
    solo: top(tally.solo),
    others: top(tally.others),
    diverseMembers,
  };
  await cacheSet(cacheKey, stats, COMMUNITY_TTL);
  return stats;
}
