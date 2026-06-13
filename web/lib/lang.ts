import 'server-only';
import { cookies } from 'next/headers';
import type { Lang } from './i18n';

// Read the locale from the `lang` cookie (set by the header toggle). Default en.
export async function getLang(): Promise<Lang> {
  const c = await cookies();
  return c.get('lang')?.value === 'ja' ? 'ja' : 'en';
}
