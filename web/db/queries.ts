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
const COMMUNITY_KEY = 'community:v6'; // bumped: sub-unit thumb = top song cover
const COMMUNITY_TTL = 60; // recompute at most once a minute
const PICKCOUNTS_KEY = 'pickcounts:v1'; // per-song pick totals (locale-agnostic)
const PICKCOUNTS_TTL = 60;
const TRENDS_KEY = 'trends:v3'; // heavy race+movers (windowed rank movers)
const TRENDS_TTL = 300; // 5 min — trends move slowly; the scan is the expensive bit
const LANGS = Object.keys(dict) as Lang[]; // every locale's community cache key

// ---- shared bucket classification (locale-independent) ----
type Cat = 'group' | 'units' | 'solo' | 'others';
const SUBUNIT_SET = new Set(SUBUNITS.map((s) => s.bucket));
const UNIT_LABEL = new Map(SUBUNITS.map((s) => [s.bucket, s.label]));
function catForBucket(bucket: string): Cat {
  if (bucket === GROUP.bucket) return 'group';
  if (bucket === OTHER.bucket) return 'others';
  if (SUBUNIT_SET.has(bucket)) return 'units';
  return 'solo';
}

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
  // Bust the community caches (both locales) so the new board is reflected on the
  // next /community-picks load instead of waiting out the TTLs.
  await cacheDel(
    ...LANGS.map((l) => `${COMMUNITY_KEY}:${l}`),
    ...LANGS.map((l) => `${TRENDS_KEY}:${l}`),
    PICKCOUNTS_KEY,
  );
  return id;
}

// slug -> how many boards picked it, across all picks. Locale-agnostic, so a
// single cache key. Used by /songs to badge each cover.
export async function getSongPickCounts(): Promise<Record<string, number>> {
  const cached = await cacheGet<Record<string, number>>(PICKCOUNTS_KEY);
  if (cached) return cached;
  const rows = await getDb().select({ data: picks.data }).from(picks);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const slug of Object.values(row.data as PicksData)) {
      counts[slug] = (counts[slug] ?? 0) + 1;
    }
  }
  await cacheSet(PICKCOUNTS_KEY, counts, PICKCOUNTS_TTL);
  return counts;
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

// Diversity (member or sub-unit): how EVENLY the community's picks spread across
// that entity's songs (normalized entropy). 100 = perfectly even; low = one song
// dominates. `topSong`/`topShare` are the human anchor for the score.
export interface MemberDiversity {
  slug: string;
  name: string;
  image?: string; // member portrait; omitted for sub-units (a color thumb is used)
  color: string;
  spread: number; // 0-100 evenness score (the sort key)
  topSong: string; // their most-picked song (display name)
  topShare: number; // 0-100 % of their picks that landed on topSong
  light: boolean; // light identity color → bar needs a contrast safeguard
}

// One unit's internal ranking (By Unit view).
export interface ByUnitSong {
  slug: string;
  title: string;
  pct: number; // 0-100, share of boards
}
export interface ByUnitGroup {
  unit: string;
  color: string; // solid identity color (alpha-able for non-leader bars)
  light: boolean;
  songCount: number;
  topPct: number; // leader's % (the group sort key)
  songs: ByUnitSong[]; // sorted by pct desc, capped
}

export interface CommunityStats {
  boards: number; // # of saved pick boards
  picks: number; // total individual selections across all boards
  group: SongStat[];
  units: SongStat[];
  solo: SongStat[];
  others: SongStat[];
  byUnit: ByUnitGroup[]; // each sub-unit ranked on its own
  unitLeaders: SongStat[]; // each sub-unit's #1 song
  memberLeaders: SongStat[]; // each member's #1 song
  diverseMembers: MemberDiversity[]; // all 12 members, most-diverse first
  diverseUnits: MemberDiversity[]; // all 4 sub-units, most-diverse first
}

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
  const songName = (slug: string) => {
    const s = bySlug[slug];
    return s ? (lang === 'ja' ? (s.jpName ?? s.name) : s.name) : slug;
  };

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
  // per-bucket song tallies: tally[bucketSlug][songSlug] = count, for the member
  // (solo) and sub-unit (units) diversity scores.
  const memberTally: Record<string, Record<string, number>> = {};
  const unitTally: Record<string, Record<string, number>> = {};

  for (const row of rows) {
    for (const [slotId, slug] of Object.entries(row.data as PicksData)) {
      picksTotal++;
      const bucket = slotId.split('#')[0];
      const cat = catFor(bucket);
      tally[cat][slug] = (tally[cat][slug] ?? 0) + 1;
      if (cat === 'solo') {
        (memberTally[bucket] ??= {})[slug] = (memberTally[bucket][slug] ?? 0) + 1;
      } else if (cat === 'units') {
        (unitTally[bucket] ??= {})[slug] = (unitTally[bucket][slug] ?? 0) + 1;
      }
    }
  }

  // "Most diverse" = how evenly picks spread across an entity's OWN songs, via
  // normalized Shannon entropy over catalog songs only (stray off-catalog picks
  // ignored). spread% = H / log2(N) · 100. Returns the spread + the dominant
  // ("top") song as the human anchor.
  const diversityOf = (bucketSlug: string, tally: Record<string, number>) => {
    const catalog = byBucket[bucketSlug] ?? [];
    const n = catalog.length;
    let total = 0;
    let topSlug = '';
    let topCount = 0;
    const counts = catalog.map((s) => {
      const cnt = tally[s.slug] ?? 0;
      total += cnt;
      if (cnt > topCount) {
        topCount = cnt;
        topSlug = s.slug;
      }
      return cnt;
    });
    let spread = 0;
    if (total > 0 && n > 1) {
      let h = 0;
      for (const cnt of counts) {
        if (cnt > 0) {
          const p = cnt / total;
          h -= p * Math.log2(p);
        }
      }
      spread = Math.round((h / Math.log2(n)) * 100);
    }
    const top = bySlug[topSlug];
    const topSong = top ? (lang === 'ja' ? (top.jpName ?? top.name) : top.name) : '';
    return {
      spread,
      topSong,
      topImage: top?.image ?? '',
      topShare: total > 0 ? Math.round((topCount / total) * 100) : 0,
    };
  };

  // 12 members (drops Yu Takasaki — no bucket); sorted by spread desc, ties →
  // lower top-song share first.
  const diverseMembers: MemberDiversity[] = chars
    .filter((c) => (byBucket[c.slug]?.length ?? 0) > 0)
    .map((c) => {
      const color = charColor[c.slug] ?? '#b8b6ad';
      const { spread, topSong, topShare } = diversityOf(c.slug, memberTally[c.slug] ?? {});
      return {
        slug: c.slug,
        name: charName[c.slug] ?? c.name,
        image: c.image, // member portrait
        color,
        spread,
        topSong,
        topShare,
        light: color.startsWith('#') && isLightColor(color),
      };
    })
    .sort((a, b) => b.spread - a.spread || a.topShare - b.topShare);

  // 4 sub-units; same metric. Thumb = their dominant song's cover (no portrait).
  const diverseUnits: MemberDiversity[] = SUBUNITS.filter(
    (u) => (byBucket[u.bucket]?.length ?? 0) > 0,
  )
    .map((u) => {
      const { spread, topSong, topShare, topImage } = diversityOf(u.bucket, unitTally[u.bucket] ?? {});
      return {
        slug: u.bucket,
        name: u.label, // brand name — stays as-is in both locales
        image: topImage || undefined,
        color: u.color,
        spread,
        topSong,
        topShare,
        light: u.color.startsWith('#') && isLightColor(u.color),
      };
    })
    .sort((a, b) => b.spread - a.spread || a.topShare - b.topShare);

  // --- Units: each sub-unit ranked on its own (By Unit) ---
  const byUnit: ByUnitGroup[] = SUBUNITS.filter((u) => byBucket[u.bucket]?.length)
    .map((u) => {
      const t = unitTally[u.bucket] ?? {};
      const songs: ByUnitSong[] = byBucket[u.bucket]
        .map((s) => ({
          slug: s.slug,
          title: songName(s.slug),
          pct: boards ? +(((t[s.slug] ?? 0) / boards) * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5);
      return {
        unit: u.label,
        color: u.color,
        light: u.color.startsWith('#') && isLightColor(u.color),
        songCount: byBucket[u.bucket].length,
        topPct: songs[0]?.pct ?? 0,
        songs,
      };
    })
    .sort((a, b) => b.topPct - a.topPct);

  // leader row (an entity's #1 song) — shared by Unit Leaders & Member Leaders
  const leaderRow = (
    bucket: string,
    tally: Record<string, number>,
    subtitle: string,
    color: string,
  ): SongStat => {
    let topSlug = '';
    let topCount = 0;
    for (const [slug, c] of Object.entries(tally)) {
      if (c > topCount) {
        topCount = c;
        topSlug = slug;
      }
    }
    if (!topSlug) topSlug = byBucket[bucket]?.[0]?.slug ?? '';
    const s = bySlug[topSlug];
    return {
      slug: topSlug,
      name: songName(topSlug),
      subtitle,
      image: s?.image ?? '',
      count: topCount,
      pct: boards ? topCount / boards : 0,
      color,
      light: color.startsWith('#') && isLightColor(color),
    };
  };

  const unitLeaders: SongStat[] = SUBUNITS.filter((u) => byBucket[u.bucket]?.length)
    .map((u) => leaderRow(u.bucket, unitTally[u.bucket] ?? {}, u.label, headerBg(u)))
    .sort((a, b) => b.pct - a.pct);

  const memberLeaders: SongStat[] = chars
    .filter((c) => byBucket[c.slug]?.length)
    .map((c) =>
      leaderRow(
        c.slug,
        memberTally[c.slug] ?? {},
        charName[c.slug] ?? c.name,
        charColor[c.slug] ?? '#b8b6ad',
      ),
    )
    .sort((a, b) => b.pct - a.pct);

  const top = (m: Record<string, number>): SongStat[] =>
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([slug, count]) => {
        const s = bySlug[slug];
        const color = s ? barColor(s.bucket) : '#b8b6ad';
        return {
          slug,
          name: songName(slug),
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
    byUnit,
    unitLeaders,
    memberLeaders,
    diverseMembers,
    diverseUnits,
  };
  await cacheSet(cacheKey, stats, COMMUNITY_TTL);
  return stats;
}

// ---- timeline + movers (heavier: replays boards in created_at order) ----

// A single frame of the Pick Race: the standings after `atBoards` boards.
export interface RaceBar {
  slug: string;
  title: string;
  color: string;
  light: boolean;
  count: number; // cumulative picks at this frame
  pct: number; // share of boards counted so far
}
export interface RaceFrame {
  atBoards: number;
  bars: RaceBar[]; // top-K, sorted desc
}
export interface Mover {
  title: string;
  name: string; // unit/character name (units/solo); '' for group/others
  rankNow: number; // 1-based rank within the last 3,000 picks
  rankPrev: number; // 1-based rank within the previous 3,000 picks
  rankDelta: number; // rankPrev - rankNow (positive = climbed)
  deltaPct: number; // share-recent minus share-prior, in points (secondary context)
  nowPct: number; // share within the recent window
}
export interface MoversData {
  rising: Mover[];
  falling: Mover[];
}
export interface CatTrend {
  race: RaceFrame[];
  movers: MoversData;
}
export type CommunityTrends = Record<Cat, CatTrend>;

const CATS: Cat[] = ['group', 'units', 'solo', 'others'];
const RACE_FRAMES = 60; // animation keyframes across the whole history
const RACE_TOPK = 10; // bars per frame
const MV_WINDOW = 3000; // movers compare now vs the state this many boards ago

export async function getCommunityTrends(lang: Lang = 'en'): Promise<CommunityTrends> {
  const cacheKey = `${TRENDS_KEY}:${lang}`;
  const cached = await cacheGet<CommunityTrends>(cacheKey);
  if (cached) return cached;

  const [rows, { songs: byBucket, characters: chars }] = await Promise.all([
    getDb().select({ data: picks.data }).from(picks).orderBy(asc(picks.createdAt)),
    getSongs(),
  ]);

  const bySlug: Record<string, Song> = {};
  for (const list of Object.values(byBucket)) for (const s of list) bySlug[s.slug] = s;
  const charColor: Record<string, string> = {};
  const charName: Record<string, string> = {};
  for (const c of chars) {
    charColor[c.slug] = c.color;
    charName[c.slug] = lang === 'ja' ? c.jpName : c.name;
  }
  const unitColor = new Map(SUBUNITS.map((s) => [s.bucket, headerBg(s)]));
  const barColorFor = (bucket: string): string =>
    bucket === GROUP.bucket
      ? GROUP.color
      : bucket === OTHER.bucket
        ? '#b8b6ad'
        : unitColor.get(bucket) ?? charColor[bucket] ?? '#b8b6ad';
  const title = (slug: string) => {
    const s = bySlug[slug];
    return s ? (lang === 'ja' ? (s.jpName ?? s.name) : s.name) : slug;
  };

  const total = rows.length;
  const step = Math.max(1, Math.floor(total / RACE_FRAMES));
  // movers windows: last MV_WINDOW picks (recent) vs the MV_WINDOW before it (prior)
  const recentStart = Math.max(0, total - MV_WINDOW);
  const priorStart = Math.max(0, total - 2 * MV_WINDOW);
  const recentN = total - recentStart;
  const priorN = recentStart - priorStart;

  // category song sets (catalog), used to rank within each window
  const catSongs: Record<Cat, string[]> = { group: [], units: [], solo: [], others: [] };
  for (const [bucket, list] of Object.entries(byBucket)) {
    const cat = catForBucket(bucket);
    for (const s of list) catSongs[cat].push(s.slug);
  }

  const empty = (): Record<Cat, Record<string, number>> => ({ group: {}, units: {}, solo: {}, others: {} });
  const overall = empty(); // cumulative, snapshotted into race frames
  const countRecent = empty(); // picks in the last MV_WINDOW boards
  const countPrior = empty(); // picks in the MV_WINDOW boards before that
  const frames: Record<Cat, RaceFrame[]> = { group: [], units: [], solo: [], others: [] };

  const snapshot = (cat: Cat, atBoards: number) => {
    const bars: RaceBar[] = Object.entries(overall[cat])
      .sort((a, b) => b[1] - a[1])
      .slice(0, RACE_TOPK)
      .map(([slug, count]) => {
        const color = barColorFor(bySlug[slug]?.bucket ?? '');
        return {
          slug,
          title: title(slug),
          color,
          light: color.startsWith('#') && isLightColor(color),
          count,
          pct: +((count / atBoards) * 100).toFixed(1),
        };
      });
    frames[cat].push({ atBoards, bars });
  };

  rows.forEach((row, i) => {
    const zone = i >= recentStart ? 'recent' : i >= priorStart ? 'prior' : null;
    for (const [slot, slug] of Object.entries(row.data as PicksData)) {
      const cat = catForBucket(slot.split('#')[0]);
      overall[cat][slug] = (overall[cat][slug] ?? 0) + 1;
      if (zone === 'recent') countRecent[cat][slug] = (countRecent[cat][slug] ?? 0) + 1;
      else if (zone === 'prior') countPrior[cat][slug] = (countPrior[cat][slug] ?? 0) + 1;
    }
    const atBoards = i + 1;
    if (atBoards % step === 0 || atBoards === total) {
      for (const cat of CATS) snapshot(cat, atBoards);
    }
  });

  // rank a category's songs by their count in a window (1 = most-picked)
  const ranksIn = (cat: Cat, counts: Record<string, number>) => {
    const order = catSongs[cat].slice().sort((x, y) => (counts[y] ?? 0) - (counts[x] ?? 0));
    const rank = new Map<string, number>();
    order.forEach((slug, i) => rank.set(slug, i + 1));
    return rank;
  };

  const buildMovers = (cat: Cat): MoversData => {
    if (recentN <= 0 || priorN <= 0) return { rising: [], falling: [] };
    const rNow = ranksIn(cat, countRecent[cat]);
    const rPrev = ranksIn(cat, countPrior[cat]);
    const movers: Mover[] = catSongs[cat]
      .map((slug) => {
        const cn = countRecent[cat][slug] ?? 0;
        const cp = countPrior[cat][slug] ?? 0;
        if (cn === 0 && cp === 0) return null; // never picked in either window
        const rankNow = rNow.get(slug) ?? 0;
        const rankPrev = rPrev.get(slug) ?? 0;
        const bucket = bySlug[slug]?.bucket ?? '';
        const name =
          cat === 'units' ? (UNIT_LABEL.get(bucket) ?? '') : cat === 'solo' ? (charName[bucket] ?? '') : '';
        return {
          title: title(slug),
          name,
          rankNow,
          rankPrev,
          rankDelta: rankPrev - rankNow,
          deltaPct: +((cn / recentN) * 100 - (cp / priorN) * 100).toFixed(1),
          nowPct: +((cn / recentN) * 100).toFixed(1),
        };
      })
      .filter((m): m is Mover => m !== null);
    return {
      rising: movers
        .filter((m) => m.rankDelta > 0)
        .sort((a, b) => b.rankDelta - a.rankDelta || b.deltaPct - a.deltaPct)
        .slice(0, 3),
      falling: movers
        .filter((m) => m.rankDelta < 0)
        .sort((a, b) => a.rankDelta - b.rankDelta || a.deltaPct - b.deltaPct)
        .slice(0, 3),
    };
  };

  const trends: CommunityTrends = {
    group: { race: frames.group, movers: buildMovers('group') },
    units: { race: frames.units, movers: buildMovers('units') },
    solo: { race: frames.solo, movers: buildMovers('solo') },
    others: { race: frames.others, movers: buildMovers('others') },
  };
  await cacheSet(cacheKey, trends, TRENDS_TTL);
  return trends;
}
