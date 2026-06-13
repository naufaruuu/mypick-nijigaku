import Poster from '@/components/Poster';
import { getSongs } from '@/db/queries';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [{ songs, characters }, lang] = await Promise.all([getSongs(), getLang()]);
  return <Poster songs={songs} characters={characters} lang={lang} />;
}
