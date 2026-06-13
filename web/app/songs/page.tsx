import type { Metadata } from 'next';
import Link from 'next/link';
import { getSongs } from '@/db/queries';
import { GROUP, OTHER, SUBUNITS, headerBg, headerText } from '@/lib/layout';
import { getLang } from '@/lib/lang';
import { dict } from '@/lib/i18n';
import type { Song } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'All Songs — My Pick Nijigasaki',
  description: 'Every Nijigasaki song, grouped by unit / member.',
};

interface HeaderCfg {
  color: string;
  bg?: string;
  textColor?: string;
}

function SongCard({ song }: { song: Song }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-stone-200 bg-white shadow-sm">
      <img src={song.image} alt={song.name} loading="lazy" className="aspect-square w-full object-cover" />
      <div className="p-2">
        <div className="truncate text-xs font-semibold text-stone-900" title={song.name}>
          {song.name}
        </div>
        {song.jpName && (
          <div className="truncate text-[10px] text-stone-500" title={song.jpName}>
            {song.jpName}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, cfg, songs }: { label: string; cfg: HeaderCfg; songs: Song[] }) {
  return (
    <section className="mt-7">
      <h2
        className="mb-3 inline-block rounded-[10px] px-4 py-1 text-sm font-semibold"
        style={{ background: headerBg(cfg), color: headerText(cfg) }}
      >
        {label} <span className="opacity-70">· {songs.length}</span>
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {songs.map((s) => (
          <SongCard key={s.slug} song={s} />
        ))}
      </div>
    </section>
  );
}

export default async function AllSongs() {
  const [{ songs, characters }, lang] = await Promise.all([getSongs(), getLang()]);
  const t = dict[lang];

  const sections: { key: string; label: string; cfg: HeaderCfg; songs: Song[] }[] = [];
  const add = (key: string, label: string, cfg: HeaderCfg) => {
    const list = songs[key];
    if (list?.length) sections.push({ key, label, cfg, songs: list });
  };

  add(GROUP.bucket, t.groupLabel, GROUP);
  for (const s of SUBUNITS) add(s.bucket, s.label, s);
  // members in id order — Japanese names when locale is ja
  for (const c of characters) add(c.slug, lang === 'ja' ? c.jpName : c.name, { color: c.color });
  add(OTHER.bucket, t.othersLabel, OTHER);

  const total = sections.reduce((n, s) => n + s.songs.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-3">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#26215c] sm:text-4xl">
        {t.allTitle} <span className="text-[#b8860b]">{t.allAccent}</span>{' '}
        <span className="align-middle text-base font-medium text-stone-400">({total})</span>
      </h1>
      <div className="mt-2 h-1 w-16 rounded bg-[#F8D657]" />

      <Link
        href="/"
        className="mt-4 inline-block rounded-[10px] border border-stone-300 bg-white px-4 py-1.5 text-sm text-stone-600 transition hover:border-[#f3cd3c] hover:bg-[#fdf6da]"
      >
        {t.back}
      </Link>

      {sections.map((s) => (
        <Section key={s.key} label={s.label} cfg={s.cfg} songs={s.songs} />
      ))}
    </div>
  );
}
