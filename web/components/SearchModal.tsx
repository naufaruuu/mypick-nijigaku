'use client';

import { useEffect, useRef, useState } from 'react';
import type { Song } from '@/lib/types';

interface SearchModalProps {
  headerLabel: string;
  color: string;
  songs: Song[];
  currentSlug?: string;
  onClose: () => void;
  onSelect: (song: Song) => void;
  onClear?: () => void;
}

const normalize = (s: string): string =>
  (s || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9぀-ゟ゠-ヿ一-龯]/g, '');

export default function SearchModal({
  headerLabel,
  color,
  songs,
  currentSlug,
  onClose,
  onSelect,
  onClear,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const currentRef = useRef<HTMLButtonElement>(null);

  // close on Esc / back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // scroll the currently-selected song into view on open
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  const q = normalize(query);
  const filtered = songs.filter(
    (s) =>
      !q ||
      normalize(s.name).includes(q) ||
      normalize(s.jpName ?? '').includes(q) ||
      normalize(s.slug).includes(q),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10 flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div
          className="flex items-center justify-between px-5 py-4 text-white"
          style={{ background: color }}
        >
          <div>
            <h3 className="text-base font-semibold tracking-wide">Select a song</h3>
            <p className="mt-0.5 text-xs text-white/85">
              {headerLabel} · {songs.length} songs
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-white/90 transition hover:bg-white/20"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="border-b border-black/5 bg-stone-50 p-4">
          <input
            type="text"
            placeholder="Search by title or romaji…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {filtered.length > 0 ? (
            filtered.map((song) => {
              const isCurrent = song.slug === currentSlug;
              return (
                <button
                  key={song.slug}
                  ref={isCurrent ? currentRef : undefined}
                  onClick={() => onSelect(song)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                    isCurrent
                      ? 'border-[#f3cd3c] bg-[#fdf6da] ring-1 ring-[#f3cd3c]'
                      : 'border-stone-100 bg-white hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <img
                    src={song.image}
                    alt={song.name}
                    loading="lazy"
                    className="h-12 w-12 flex-shrink-0 rounded-lg border border-stone-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm font-semibold ${isCurrent ? 'text-[#6b5a00]' : 'text-stone-900'}`}>
                      {song.name}
                    </div>
                    {isCurrent ? (
                      <div className="mt-0.5 text-xs font-medium text-[#8a6d00]">Currently selected</div>
                    ) : (
                      song.jpName && <div className="mt-0.5 truncate text-xs text-stone-500">{song.jpName}</div>
                    )}
                  </div>
                  {isCurrent && (
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F8D657] text-sm font-bold text-[#6b5a00]">
                      ✓
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-stone-400">No songs found.</div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/5 bg-stone-50 p-3">
          {onClear ? (
            <button
              onClick={onClear}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-red-300 hover:text-red-600"
            >
              ✕ Clear this pick
            </button>
          ) : (
            <span />
          )}
          <span className="text-[11px] text-stone-500">
            {filtered.length} of {songs.length} songs
          </span>
        </div>
      </div>
    </div>
  );
}
