'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Lang } from '@/lib/i18n';

function cookieLang(): Lang {
  if (typeof document === 'undefined') return 'en';
  return /(?:^|;\s*)lang=ja/.test(document.cookie) ? 'ja' : 'en';
}

export default function LangToggle() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => setLang(cookieLang()), []);

  const set = (l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; SameSite=Lax`;
    setLang(l);
    router.refresh(); // re-render server components with the new locale
  };

  return (
    <div className="lang-toggle-row">
      <div className="lang-toggle" role="group" aria-label="Language">
        <button
          type="button"
          className={lang === 'en' ? 'active' : ''}
          aria-pressed={lang === 'en'}
          onClick={() => set('en')}
        >
          EN
        </button>
        <button
          type="button"
          className={lang === 'ja' ? 'active' : ''}
          aria-pressed={lang === 'ja'}
          onClick={() => set('ja')}
        >
          日本語
        </button>
      </div>
    </div>
  );
}
