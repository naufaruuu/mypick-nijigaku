import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Poster from '@/components/Poster';
import { getSongs, getPick } from '@/db/queries';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const title = 'Someone’s Nijigasaki picks';
  const description = 'A shared set of favorite Nijigasaki songs — make your own.';
  return {
    title,
    description,
    openGraph: { type: 'article', siteName: 'My Pick Nijigasaki', title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function SharedPick({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const pick = await getPick(id);
  if (!pick) notFound();

  const [{ songs, characters }, lang] = await Promise.all([getSongs(), getLang()]);
  return (
    <Poster
      songs={songs}
      characters={characters}
      lang={lang}
      initialPicks={pick.data}
      readOnly
    />
  );
}
