'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PicksData, Song } from '@/lib/types';
import SearchModal from './SearchModal';

const LS_KEY = 'nijigaku_mypicks';

interface PicksContextValue {
  songsByBucket: Record<string, Song[]>;
  songsBySlug: Record<string, Song>;
  picks: PicksData;
  readOnly: boolean;
  flashId: string | null; // slot that just changed (close-the-loop flash)
  open: (bucket: string, slotId: string, headerLabel: string, color: string) => void;
  clear: (slotId: string) => void;
  clearAll: () => void;
}

const PicksContext = createContext<PicksContextValue | null>(null);

export function usePicks(): PicksContextValue {
  const ctx = useContext(PicksContext);
  if (!ctx) throw new Error('usePicks must be used within <PicksProvider>');
  return ctx;
}

interface ActivePicker {
  bucket: string;
  slotId: string;
  headerLabel: string;
  color: string;
}

interface Props {
  songsByBucket: Record<string, Song[]>;
  initialPicks?: PicksData;
  readOnly?: boolean;
  children: ReactNode;
}

export function PicksProvider({ songsByBucket, initialPicks, readOnly = false, children }: Props) {
  const [picks, setPicks] = useState<PicksData>(initialPicks ?? {});
  const [active, setActive] = useState<ActivePicker | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  // briefly mark a slot as just-changed so its card can flash
  const flash = useCallback((slotId: string) => {
    setFlashId(slotId);
    setTimeout(() => setFlashId((cur) => (cur === slotId ? null : cur)), 700);
  }, []);

  const songsBySlug = useMemo(() => {
    const m: Record<string, Song> = {};
    for (const list of Object.values(songsByBucket)) for (const s of list) m[s.slug] = s;
    return m;
  }, [songsByBucket]);

  // load persisted picks (editable mode only; a shared view keeps initialPicks)
  useEffect(() => {
    if (readOnly || initialPicks) return;
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        setPicks(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, [readOnly, initialPicks]);

  const persist = (next: PicksData) => {
    if (!readOnly) localStorage.setItem(LS_KEY, JSON.stringify(next));
    return next;
  };

  const open = useCallback(
    (bucket: string, slotId: string, headerLabel: string, color: string) => {
      if (readOnly) return;
      setActive({ bucket, slotId, headerLabel, color });
    },
    [readOnly],
  );

  const clear = useCallback((slotId: string) => {
    setPicks((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return persist(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAll = useCallback(() => setPicks(() => persist({})), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (song: Song) => {
    if (!active) return;
    const slotId = active.slotId;
    setPicks((prev) => persist({ ...prev, [slotId]: song.slug }));
    setActive(null);
    flash(slotId);
  };

  const handleClearActive = () => {
    if (!active) return;
    clear(active.slotId);
    setActive(null);
  };

  return (
    <PicksContext.Provider
      value={{ songsByBucket, songsBySlug, picks, readOnly, flashId, open, clear, clearAll }}
    >
      {children}
      {active && (
        <SearchModal
          headerLabel={active.headerLabel}
          color={active.color}
          songs={songsByBucket[active.bucket] ?? []}
          currentSlug={picks[active.slotId]}
          onClose={() => setActive(null)}
          onSelect={handleSelect}
          onClear={picks[active.slotId] ? handleClearActive : undefined}
        />
      )}
    </PicksContext.Provider>
  );
}
