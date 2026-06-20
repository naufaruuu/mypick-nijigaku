import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getCommunityStats,
  getCommunityTrends,
  type SongStat,
  type ByUnitGroup,
  type MemberDiversity,
  type Mover,
} from '@/db/queries';
import { getLang } from '@/lib/lang';
import { dict, type Dict } from '@/lib/i18n';
import CommunityCards, {
  type CardData,
  type RankRow,
  type ByUnitGroupView,
  type MoverView,
  type DiversityRowView,
} from '@/components/CommunityCards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Community Picks — My Pick Nijigasaki',
  description: 'What songs the community is picking most.',
};

// design per-card identity tokens (squircle gradient + accent)
const THEME = {
  group: { sqA: '#F4D24A', sqB: '#E3B019', accent: '#D6A52C' },
  units: { sqA: '#4A4FB0', sqB: '#2E3270', accent: '#4145A0' },
  solo: { sqA: '#B7B2A6', sqB: '#928D81', accent: '#C77D9B' },
  others: { sqA: '#ADA89C', sqB: '#8C8779', accent: '#8C8779' },
} as const;

function Stat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="flex flex-1 flex-col justify-center rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <div className={`font-bold text-[#6b5a00] ${small ? 'text-sm leading-tight' : 'text-2xl'}`}>{value}</div>
      <div className="mt-0.5 text-xs text-stone-500">{label}</div>
    </div>
  );
}

// ---- backend → view-payload converters (all strings formatted here, server-side) ----
const toRankRows = (items: SongStat[], boards: number, showSub: boolean): RankRow[] =>
  items.map((s, i) => ({
    key: `${s.slug}-${i}`,
    image: s.image || undefined,
    color: s.color,
    light: s.light,
    title: s.name,
    sub: showSub ? s.subtitle : undefined,
    picks: s.count.toLocaleString(),
    denom: boards.toLocaleString(),
    pct: +(s.pct * 100).toFixed(1),
    pctText: `${(s.pct * 100).toFixed(1)}%`,
  }));

const toByUnit = (groups: ByUnitGroup[], a: Dict['analytics']): ByUnitGroupView[] =>
  groups.map((g) => ({
    unit: g.unit,
    color: g.color,
    light: g.light,
    meta: a.unitMeta(g.songCount, g.topPct),
    songs: g.songs.map((s, i) => ({
      rank: String(i + 1),
      title: s.title,
      pct: s.pct,
      pctText: `${s.pct.toFixed(1)}%`,
      leader: i === 0,
    })),
  }));

const toMovers = (m: Mover[], a: Dict['analytics']): MoverView[] =>
  m.map((x) => ({
    title: x.title,
    sub: x.name || a.nowShare(x.nowPct),
    rankText: `#${x.rankPrev} → #${x.rankNow}`,
    delta: `${x.deltaPct > 0 ? '+' : ''}${x.deltaPct}%`,
  }));

const toDiversity = (items: MemberDiversity[], t: Dict): DiversityRowView[] =>
  items.map((m) => ({
    key: m.slug,
    image: m.image,
    color: m.color,
    light: m.light,
    name: m.name,
    topLabel: m.topShare > 0 ? t.topPick(m.topSong, m.topShare) : '—',
    spread: m.spread,
  }));

export default async function CommunityPicks() {
  const lang = await getLang();
  const t = dict[lang];
  const a = t.analytics;
  const [stats, trends] = await Promise.all([getCommunityStats(lang), getCommunityTrends(lang)]);
  const boards = stats.boards;

  const updated =
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date())
      .replace(',', '') + ' JST';

  const raceView = (cat: 'group' | 'units' | 'solo' | 'others') =>
    ({
      id: 'race',
      label: a.pickRace,
      desc: a.descRace,
      icon: 'line' as const,
      subtitle: a.subRace,
      body: {
        kind: 'race' as const,
        frames: trends[cat].race,
        boardsWord: a.boardsWord,
        empty: a.raceEmpty,
        playLabel: a.play,
        pauseLabel: a.pause,
      },
    });
  const moversView = (cat: 'group' | 'units' | 'solo' | 'others') =>
    ({
      id: 'movers',
      label: a.risingFalling,
      desc: a.descMovers,
      icon: 'movers' as const,
      subtitle: a.subMovers,
      body: {
        kind: 'movers' as const,
        rising: toMovers(trends[cat].movers.rising, a),
        falling: toMovers(trends[cat].movers.falling, a),
        risingLabel: a.rising,
        fallingLabel: a.falling,
        windowLabel: a.moversWindow,
        empty: a.moversEmpty,
      },
    });

  const cards: CardData[] = [
    {
      id: 'group',
      name: t.catNiji,
      ...THEME.group,
      menuHeader: a.menuHeader,
      views: [
        {
          id: 'top',
          label: a.topSongs,
          desc: a.descTopGroup,
          icon: 'bars',
          subtitle: a.subTopGroup,
          body: {
            kind: 'rows',
            rows: toRankRows(stats.group, boards, false),
            defaultCount: 5,
            expandLabel: t.showAll(stats.group.length, t.nounSongs),
            collapseLabel: t.showLess,
          },
        },
        raceView('group'),
        moversView('group'),
      ],
    },
    {
      id: 'units',
      name: t.catUnits,
      ...THEME.units,
      menuHeader: a.menuHeader,
      views: [
        {
          id: 'top',
          label: a.topSongs,
          desc: a.descTopUnits,
          icon: 'bars',
          subtitle: a.subTopUnits,
          body: {
            kind: 'rows',
            rows: toRankRows(stats.units, boards, true),
            defaultCount: 5,
            expandLabel: t.showAll(stats.units.length, t.nounUnitSongs),
            collapseLabel: t.showLess,
          },
        },
        raceView('units'),
        { id: 'byunit', label: a.byUnit, desc: a.descByUnit, icon: 'layergroup', subtitle: a.subByUnit, body: { kind: 'byunit', groups: toByUnit(stats.byUnit, a) } },
        {
          id: 'leaders',
          label: a.unitLeaders,
          desc: a.descUnitLeaders,
          icon: 'chartbar',
          subtitle: a.subUnitLeaders,
          body: { kind: 'rows', rows: toRankRows(stats.unitLeaders, boards, true) },
        },
        {
          id: 'diverse',
          label: a.mostDiverse,
          desc: a.descDiverse,
          icon: 'chartbar',
          subtitle: a.subDiverseUnits,
          body: { kind: 'diversity', rows: toDiversity(stats.diverseUnits, t), spreadLabel: t.spreadLabel, legend: t.diverseUnitLegend },
        },
        moversView('units'),
      ],
    },
    {
      id: 'solo',
      name: t.catSolo,
      ...THEME.solo,
      menuHeader: a.menuHeader,
      views: [
        {
          id: 'top',
          label: a.topSongs,
          desc: a.descTopSolo,
          icon: 'bars',
          subtitle: a.subTopSolo,
          body: {
            kind: 'rows',
            rows: toRankRows(stats.solo, boards, true),
            defaultCount: 5,
            expandLabel: t.showAll(stats.solo.length, t.nounCharSongs),
            collapseLabel: t.showLess,
          },
        },
        raceView('solo'),
        {
          id: 'leaders',
          label: a.memberLeaders,
          desc: a.descMemberLeaders,
          icon: 'chartbar',
          subtitle: a.subMemberLeaders,
          body: {
            kind: 'rows',
            rows: toRankRows(stats.memberLeaders, boards, true),
            defaultCount: 5,
            expandLabel: t.showAll(stats.memberLeaders.length, t.nounMembers),
            collapseLabel: t.showLess,
          },
        },
        {
          id: 'diverse',
          label: a.mostDiverse,
          desc: a.descDiverse,
          icon: 'chartbar',
          subtitle: a.subDiverseMembers,
          body: {
            kind: 'diversity',
            rows: toDiversity(stats.diverseMembers, t),
            spreadLabel: t.spreadLabel,
            legend: t.diverseLegend,
            defaultCount: 5,
            expandLabel: t.showAll(stats.diverseMembers.length, t.nounMembers),
            collapseLabel: t.showLess,
          },
        },
        moversView('solo'),
      ],
    },
    {
      id: 'others',
      name: t.catOthers,
      ...THEME.others,
      menuHeader: a.menuHeader,
      views: [
        {
          id: 'top',
          label: a.topSongs,
          desc: a.descTopOthers,
          icon: 'bars',
          subtitle: a.subTopOthers,
          body: {
            kind: 'rows',
            rows: toRankRows(stats.others, boards, false),
            defaultCount: 5,
            expandLabel: t.showAll(stats.others.length, t.nounSongs),
            collapseLabel: t.showLess,
          },
        },
        raceView('others'),
        moversView('others'),
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-2 pt-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#26215c] sm:text-4xl">
          {t.communityTitle} <span className="text-[#b8860b]">{t.communityAccent}</span>
        </h1>
        <span className="text-xs font-semibold text-stone-400">{a.hint}</span>
      </div>
      <div className="mt-2 h-1 w-16 rounded bg-[#F8D657]" />

      <Link
        href="/"
        className="mt-4 inline-block rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm text-stone-600 transition hover:border-[#f3cd3c] hover:bg-[#fdf6da]"
      >
        {t.back}
      </Link>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat value={boards.toLocaleString()} label={t.pickBoards} />
        <Stat value={stats.picks.toLocaleString()} label={t.picksLabel} />
        <Stat value={updated} label={t.updated} small />
      </div>

      <div className="mt-6">
        <CommunityCards cards={cards} />
      </div>

      <p className="mt-6 text-center text-xs text-stone-400">{t.communityNote}</p>
    </div>
  );
}
