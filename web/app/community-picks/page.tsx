import type { Metadata } from 'next';
import Link from 'next/link';
import { getCommunityStats } from '@/db/queries';
import { getLang } from '@/lib/lang';
import { dict } from '@/lib/i18n';
import CommunitySection from '@/components/CommunitySection';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Community Picks — My Pick Nijigasaki',
  description: 'What songs the community is picking most.',
};

function Stat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="flex flex-1 flex-col justify-center rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <div className={`font-bold text-[#6b5a00] ${small ? 'text-sm leading-tight' : 'text-2xl'}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-stone-500">{label}</div>
    </div>
  );
}

export default async function CommunityPicks() {
  const lang = await getLang();
  const t = dict[lang];
  const stats = await getCommunityStats(lang);

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

  // four parallel, non-overlapping category sections — every song appears once
  const sections = [
    {
      title: t.catNiji,
      subhead: t.subNiji,
      swatch: '#F8D657', // Nijigasaki gold
      items: stats.group,
      showSource: false, // source is always "Nijigasaki" here — redundant
      noun: t.nounSongs,
    },
    {
      title: t.catUnits,
      subhead: t.subUnits,
      swatch: '#3D4291', // units indigo
      items: stats.units,
      showSource: true,
      noun: t.nounUnitSongs,
    },
    {
      title: t.catSolo,
      subhead: t.subSolo,
      swatch: '#888780',
      items: stats.solo,
      showSource: true,
      noun: t.nounCharSongs,
    },
    {
      title: t.catOthers,
      subhead: t.subOthers,
      swatch: '#b8b6ad',
      items: stats.others,
      showSource: true,
      noun: t.nounSongs,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-2 pt-3">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#26215c] sm:text-4xl">
        {t.communityTitle} <span className="text-[#b8860b]">{t.communityAccent}</span>
      </h1>
      <div className="mt-2 h-1 w-16 rounded bg-[#F8D657]" />

      <Link
        href="/"
        className="mt-4 inline-block rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm text-stone-600 transition hover:border-[#f3cd3c] hover:bg-[#fdf6da]"
      >
        {t.back}
      </Link>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat value={stats.boards.toLocaleString()} label={t.pickBoards} />
        <Stat value={stats.picks.toLocaleString()} label={t.picksLabel} />
        <Stat value={updated} label={t.updated} small />
      </div>

      <div className="mt-6 space-y-6">
        {sections.map((sec) => (
          <CommunitySection
            key={sec.title}
            title={sec.title}
            subhead={sec.subhead}
            swatch={sec.swatch}
            items={sec.items}
            boards={stats.boards}
            showSource={sec.showSource}
            expandLabel={t.showAll(sec.items.length, sec.noun)}
            collapseLabel={t.showLess}
          />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-stone-400">{t.communityNote}</p>
    </div>
  );
}
