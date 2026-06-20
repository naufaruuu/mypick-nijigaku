'use client';

import { useEffect, useState } from 'react';
import type { RaceFrame } from '@/db/queries';

// ---- view payloads (all strings pre-formatted server-side; no functions cross
//      the RSC boundary) ----

export type IconKind = 'bars' | 'line' | 'movers' | 'layergroup' | 'chartbar';

export interface RankRow {
  key: string;
  image?: string; // cover/portrait; falls back to a color block
  color: string; // bar + thumb identity
  light: boolean;
  title: string;
  sub?: string;
  picks: string; // formatted, e.g. "2,408"
  denom?: string; // "7,839" or omitted
  pct: number; // 0-100 bar width
  pctText: string; // "30.7%"
}

export interface ByUnitSongView {
  rank: string;
  title: string;
  pct: number; // 0-100
  pctText: string;
  leader: boolean;
}
export interface ByUnitGroupView {
  unit: string;
  color: string;
  light: boolean;
  meta: string; // "3 songs · top 49.5%"
  songs: ByUnitSongView[];
}

export interface MoverView {
  title: string;
  sub: string;
  rankText: string; // "#18 → #11"
  delta: string; // "+3.1%"
}

export interface DiversityRowView {
  key: string;
  image?: string;
  color: string;
  light: boolean;
  name: string;
  topLabel: string;
  spread: number; // 0-100
}

export type ViewBody =
  | { kind: 'rows'; rows: RankRow[]; defaultCount?: number; expandLabel?: string; collapseLabel?: string }
  | { kind: 'byunit'; groups: ByUnitGroupView[] }
  | { kind: 'race'; frames: RaceFrame[]; boardsWord: string; empty: string; playLabel: string; pauseLabel: string }
  | {
      kind: 'movers';
      rising: MoverView[];
      falling: MoverView[];
      risingLabel: string;
      fallingLabel: string;
      windowLabel: string;
      empty: string;
    }
  | {
      kind: 'diversity';
      rows: DiversityRowView[];
      spreadLabel: string;
      legend: string;
      defaultCount?: number;
      expandLabel?: string;
      collapseLabel?: string;
    };

export interface ViewDef {
  id: string;
  label: string;
  desc: string;
  icon: IconKind;
  subtitle: string;
  body: ViewBody;
}

export interface CardData {
  id: string;
  name: string;
  sqA: string;
  sqB: string;
  accent: string;
  menuHeader: string; // "Show in this card"
  views: ViewDef[];
}

// ---- icons (filled SVGs, sized to 1em) ----
function Icon({ kind }: { kind: IconKind }) {
  const c = { width: '1em', height: '1em', viewBox: '0 0 32 32', fill: 'currentColor', style: { display: 'block' } } as const;
  if (kind === 'line')
    return (
      <svg {...c} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,22 12,13 18,18 29,5" />
      </svg>
    );
  if (kind === 'movers')
    return (
      <svg {...c}>
        <path d="M9 3l5 7H11v6H7v-6H4l5-7z" />
        <path d="M23 29l-5-7h3v-6h4v6h3l-5 7z" />
      </svg>
    );
  if (kind === 'layergroup')
    return (
      <svg {...c}>
        <path d="M2.9 6.6 13.1 1.4a6 6 0 0 1 5.7 0L29 6.6c1.2.6 1.2 2.3 0 2.9l-10.2 5.1a6 6 0 0 1-5.7 0L2.9 9.5c-1.2-.6-1.2-2.3 0-2.9z" />
        <path d="M4.8 13.6l-1.9 1c-1.2.6-1.2 2.3 0 2.9l10.3 5.1a6 6 0 0 0 5.7 0l10.3-5.1c1.2-.6 1.2-2.3 0-2.9l-1.9-1-8.3 4.2a6 6 0 0 1-5.7 0l-8.3-4.2z" />
        <path d="M4.8 21.6l-1.9 1c-1.2.6-1.2 2.3 0 2.9l10.3 5.1a6 6 0 0 0 5.7 0l10.3-5.1c1.2-.6 1.2-2.3 0-2.9l-1.9-1-8.3 4.2a6 6 0 0 1-5.7 0l-8.3-4.2z" />
      </svg>
    );
  if (kind === 'chartbar')
    return (
      <svg {...c}>
        <path d="M4.8 3.2c.9 0 1.6.7 1.6 1.6v19.2c0 .9.7 1.6 1.6 1.6h19.2c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6H8c-2.7 0-4.8-2.1-4.8-4.8V4.8c0-.9.7-1.6 1.6-1.6z" />
        <path d="M9.6 11.2c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v9.6c0 .9-.7 1.6-1.6 1.6s-1.6-.7-1.6-1.6v-9.6zM16.8 8c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v12.8c0 .9-.7 1.6-1.6 1.6s-1.6-.7-1.6-1.6V8zM24 4.8c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v16c0 .9-.7 1.6-1.6 1.6s-1.6-.7-1.6-1.6v-16z" />
      </svg>
    );
  // bars
  return (
    <svg {...c}>
      <path d="M3.2 4.8c0-.9.7-1.6 1.6-1.6h22.4c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6H4.8c-.9 0-1.6-.7-1.6-1.6zM3.2 16c0-.9.7-1.6 1.6-1.6h22.4c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6H4.8c-.9 0-1.6-.7-1.6-1.6zM3.2 27.2c0-.9.7-1.6 1.6-1.6h22.4c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6H4.8c-.9 0-1.6-.7-1.6-1.6z" />
    </svg>
  );
}

function SwitcherIcon() {
  return (
    <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" style={{ display: 'block' }}>
      <path d="M0 9.6v12.8c0 5.3 4.3 9.6 9.6 9.6h12.8c5.3 0 9.6-4.3 9.6-9.6V9.6c0-5.3-4.3-9.6-9.6-9.6H9.6C4.3 0 0 4.3 0 9.6zM20.8 8c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v9.6c0 .9-.7 1.6-1.6 1.6s-1.6-.7-1.6-1.6V8zM14.4 11.2c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v6.4c0 .9-.7 1.6-1.6 1.6s-1.6-.7-1.6-1.6v-6.4zM8 14.4c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v3.2c0 .9-.7 1.6-1.6 1.6S8 18.5 8 17.6v-3.2zM6.4 24c0-.9.7-1.6 1.6-1.6h16c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6h-16c-.9 0-1.6-.7-1.6-1.6z" />
    </svg>
  );
}

function rankColor(i: number) {
  return i === 0 ? '#D6A52C' : '#6E6A5F';
}

// ---- shared row primitives ----
function Thumb({ image, color, light, alt }: { image?: string; color: string; light: boolean; alt: string }) {
  if (image)
    return (
      <img
        src={image}
        alt={alt}
        loading="lazy"
        className="h-11 w-11 flex-shrink-0 rounded-[9px] object-cover"
        style={{ boxShadow: 'inset 0 0 0 .5px rgba(0,0,0,.08)' }}
      />
    );
  return (
    <span
      className="h-11 w-11 flex-shrink-0 rounded-[9px]"
      style={{ background: color, boxShadow: light ? 'inset 0 0 0 1px rgba(0,0,0,.18)' : 'inset 0 0 0 .5px rgba(0,0,0,.08)' }}
    />
  );
}

function Bar({ pct, color, light }: { pct: number; color: string; light: boolean }) {
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: '#EEEAE0' }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(pct, pct ? 1.5 : 0)}%`,
          background: color,
          boxShadow: light ? 'inset 0 0 0 1px rgba(0,0,0,.22)' : undefined,
        }}
      />
    </div>
  );
}

function RankRowItem({ r, i }: { r: RankRow; i: number }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3" style={{ borderTop: '.5px solid #F1EDE4' }}>
      <span className="w-6 flex-shrink-0 text-center text-[13.5px] font-extrabold tabular-nums" style={{ color: rankColor(i) }}>
        {i + 1}
      </span>
      <Thumb image={r.image} color={r.color} light={r.light} alt={r.title} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold" style={{ color: '#26221A' }}>
              {r.title}
            </div>
            {r.sub && (
              <div className="truncate text-[12.5px] font-semibold" style={{ color: r.color }}>
                {r.sub}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-[14px] leading-tight tabular-nums" style={{ color: '#26221A' }}>
              <span className="font-extrabold">{r.picks}</span>
              {r.denom && <span style={{ color: '#C6C0B2', fontWeight: 600 }}>/{r.denom}</span>}
            </div>
            <div className="text-[11.5px] font-semibold tabular-nums" style={{ color: '#8A857A' }}>
              {r.pctText}
            </div>
          </div>
        </div>
        <Bar pct={r.pct} color={r.color} light={r.light} />
      </div>
    </div>
  );
}

// ---- view bodies ----
function RowsView({ rows, expanded }: { rows: RankRow[]; expanded: boolean }) {
  return (
    <div className="px-1.5">
      {rows.map((r, i) => (
        <RankRowItem key={r.key} r={r} i={i} />
      ))}
      {!rows.length && <div className="px-4 py-8 text-center text-xs text-stone-400">—</div>}
    </div>
  );
}

function ByUnitView({ groups }: { groups: ByUnitGroupView[] }) {
  return (
    <div className="px-4 pb-3.5">
      {groups.map((g) => (
        <div key={g.unit} style={{ borderTop: '.5px solid #F1EDE4', padding: '12px 0 8px' }}>
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 flex-shrink-0 rounded-[5px]" style={{ background: g.color, boxShadow: 'inset 0 0 0 .5px rgba(0,0,0,.08)' }} />
            <span className="text-[14.5px] font-extrabold" style={{ color: g.color }}>
              {g.unit}
            </span>
            <span className="ml-auto text-[11.5px] font-semibold" style={{ color: '#A8A294' }}>
              {g.meta}
            </span>
          </div>
          {g.songs.map((s) => (
            <div key={s.rank} className="flex items-center gap-2.5 py-1.5">
              <span className="w-4 flex-shrink-0 text-center text-[12px] font-bold" style={{ color: '#BDB8AC' }}>
                {s.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2.5">
                  <span
                    className="min-w-0 flex-1 truncate text-[14px]"
                    style={{ fontWeight: s.leader ? 700 : 600, color: s.leader ? '#26221A' : '#6E6A5F' }}
                  >
                    {s.title}
                  </span>
                  <span className="flex-shrink-0 text-[13px] font-extrabold" style={{ color: s.leader ? '#26221A' : '#8A857A' }}>
                    {s.pctText}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: '#EEEAE0' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(s.pct, s.pct ? 1.5 : 0)}%`, background: s.leader ? g.color : g.color + '88' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ display: 'block' }}>
      {playing ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M7 4.5v15l13-7.5z" />}
    </svg>
  );
}

const RACE_ROW = 34; // px per bar row

function PickRace({
  frames,
  boardsWord,
  empty,
  playLabel,
  pauseLabel,
  accent,
}: {
  frames: RaceFrame[];
  boardsWord: string;
  empty: string;
  playLabel: string;
  pauseLabel: string;
  accent: string;
}) {
  const [idx, setIdx] = useState(frames.length ? frames.length - 1 : 0); // start at "now"
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (idx >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setIdx((i) => Math.min(i + 1, frames.length - 1)), 140);
    return () => clearTimeout(id);
  }, [playing, idx, frames.length]);

  if (frames.length < 2)
    return <div style={{ borderTop: '.5px solid #F1EDE4' }} className="px-4 py-10 text-center text-xs text-stone-400">{empty}</div>;

  const frame = frames[idx];
  const maxCount = frame.bars[0]?.count || 1;
  const rows = Math.max(...frames.map((f) => f.bars.length), 1);

  const togglePlay = () => {
    if (idx >= frames.length - 1) setIdx(0); // replay from the start
    setPlaying((p) => !p);
  };

  return (
    <div className="px-4 pb-4 pt-3" style={{ borderTop: '.5px solid #F1EDE4' }}>
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={togglePlay}
          aria-label={playing ? pauseLabel : playLabel}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-white"
          style={{ background: accent }}
        >
          <PlayPauseIcon playing={playing} />
        </button>
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={idx}
          onChange={(e) => {
            setPlaying(false);
            setIdx(+e.target.value);
          }}
          className="h-1 flex-1 cursor-pointer"
          style={{ accentColor: accent }}
        />
        <span className="flex-none text-right text-[11.5px] font-semibold tabular-nums" style={{ color: '#A39E92', minWidth: 86 }}>
          {frame.atBoards.toLocaleString()} {boardsWord}
        </span>
      </div>

      <div className="relative" style={{ height: rows * RACE_ROW }}>
        {frame.bars.map((b, i) => (
          <div
            key={b.slug}
            className="absolute left-0 right-0 flex items-center gap-2"
            style={{ top: i * RACE_ROW, height: RACE_ROW - 6, transition: 'top .4s cubic-bezier(.4,0,.2,1)' }}
          >
            <span className="w-4 flex-none text-center text-[12px] font-extrabold tabular-nums" style={{ color: rankColor(i) }}>
              {i + 1}
            </span>
            <span className="w-[92px] flex-none truncate text-[12.5px] font-semibold" style={{ color: '#26221A' }}>
              {b.title}
            </span>
            <div className="relative h-[18px] flex-1 overflow-hidden rounded-[5px]" style={{ background: '#EEEAE0' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-[5px]"
                style={{
                  width: `${Math.max((b.count / maxCount) * 100, 2)}%`,
                  background: b.color,
                  boxShadow: b.light ? 'inset 0 0 0 1px rgba(0,0,0,.18)' : undefined,
                  transition: 'width .4s cubic-bezier(.4,0,.2,1)',
                }}
              />
            </div>
            <span className="w-[46px] flex-none text-right text-[12px] font-bold tabular-nums" style={{ color: '#26221A' }}>
              {b.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoverRow({ m, rising }: { m: MoverView; rising: boolean }) {
  const color = rising ? '#5B8E50' : '#C9544B';
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderTop: '.5px solid #F1EDE4' }}>
      <span
        className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px]"
        style={{ background: rising ? '#E9F2E4' : '#F8E7E5', color }}
      >
        <svg viewBox="0 0 32 32" width="14" height="14" fill="currentColor" style={{ display: 'block' }}>
          {rising ? (
            <path d="M23.7 7.1 17.1.5a1.6 1.6 0 0 0-2.3 0L8.3 7.1a1.6 1.6 0 1 0 2.3 2.3l3.8-3.9V30a1.6 1.6 0 1 0 3.2 0V5.5l3.9 3.9a1.6 1.6 0 1 0 2.2-2.3z" />
          ) : (
            <path d="M17.6 1.6a1.6 1.6 0 1 0-3.2 0v24.9l-3.9-3.9a1.6 1.6 0 0 0-2.2 2.3l6.5 6.6a1.6 1.6 0 0 0 2.3 0l6.6-6.6a1.6 1.6 0 0 0-2.3-2.3l-3.8 3.9V1.6z" />
          )}
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-bold" style={{ color: '#26221A' }}>
          {m.title}
        </div>
        <div className="truncate text-[12px] font-semibold" style={{ color: '#A8A294' }}>
          {m.sub}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-[14px] font-extrabold tabular-nums" style={{ color }}>
          {m.rankText}
        </div>
        <div className="text-[11px] tabular-nums" style={{ color: '#A8A294' }}>
          {m.delta}
        </div>
      </div>
    </div>
  );
}

function MoversView({
  rising,
  falling,
  risingLabel,
  fallingLabel,
  windowLabel,
  empty,
}: {
  rising: MoverView[];
  falling: MoverView[];
  risingLabel: string;
  fallingLabel: string;
  windowLabel: string;
  empty: string;
}) {
  if (!rising.length && !falling.length)
    return <div style={{ borderTop: '.5px solid #F1EDE4' }} className="px-4 py-10 text-center text-xs text-stone-400">{empty}</div>;
  return (
    <div className="px-4 pb-3">
      <SectionHead dot="#5B8E50" label={risingLabel} caption={windowLabel} mt="12px" />
      {rising.map((m, i) => (
        <MoverRow key={`r${i}`} m={m} rising />
      ))}
      <SectionHead dot="#C9544B" label={fallingLabel} caption={windowLabel} mt="16px" />
      {falling.map((m, i) => (
        <MoverRow key={`f${i}`} m={m} rising={false} />
      ))}
    </div>
  );
}
function SectionHead({ dot, label, caption, mt }: { dot: string; label: string; caption: string; mt: string }) {
  return (
    <div className="flex items-center gap-2" style={{ margin: `${mt} 2px 2px` }}>
      <span className="h-[7px] w-[7px] rounded-sm" style={{ background: dot }} />
      <span className="text-[11.5px] font-extrabold uppercase tracking-wide" style={{ color: dot }}>
        {label}
      </span>
      <span className="ml-auto text-[11px] font-semibold" style={{ color: '#ADA89C' }}>
        {caption}
      </span>
    </div>
  );
}

function DiversityView({ rows, spreadLabel, expanded }: { rows: DiversityRowView[]; spreadLabel: string; expanded: boolean }) {
  return (
    <div className="px-1.5">
      {rows.map((m, i) => (
        <div key={m.key} className="flex items-center gap-3 px-3 py-2.5" style={{ borderTop: '.5px solid #F1EDE4' }}>
          <span className="w-6 flex-shrink-0 text-center text-[13.5px] font-extrabold tabular-nums" style={{ color: rankColor(i) }}>
            {i + 1}
          </span>
          <Thumb image={m.image} color={m.color} light={m.light} alt={m.name} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold" style={{ color: '#26221A' }}>
              {m.name}
            </div>
            <div className="truncate text-[12.5px] font-semibold" style={{ color: '#A8A294' }}>
              {m.topLabel}
            </div>
            <Bar pct={m.spread} color={m.color} light={m.light} />
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-[15px] font-extrabold tabular-nums" style={{ color: '#26221A' }}>
              {m.spread}%
            </div>
            <div className="text-[10px]" style={{ color: '#A8A294' }}>
              {spreadLabel}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: up ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ---- a single card ----
function Card({
  card,
  view,
  menuOpen,
  expanded,
  onToggleMenu,
  onClose,
  onPick,
  onToggleExpand,
}: {
  card: CardData;
  view: string;
  menuOpen: boolean;
  expanded: boolean;
  onToggleMenu: () => void;
  onClose: () => void;
  onPick: (v: string) => void;
  onToggleExpand: () => void;
}) {
  const active = card.views.find((v) => v.id === view) ?? card.views[0];
  const accent = card.accent;
  const body = active.body;

  // collapse handling for rows / diversity
  const collapsible =
    (body.kind === 'rows' || body.kind === 'diversity') &&
    body.defaultCount != null &&
    (body.kind === 'rows' ? body.rows.length : body.rows.length) > body.defaultCount;
  const sliceN = collapsible && !expanded ? (body as { defaultCount: number }).defaultCount : undefined;

  return (
    <div
      className="relative bg-white"
      style={{ border: '.5px solid #ECE6DA', borderRadius: 16, boxShadow: '0 1px 2px rgba(40,33,15,.04),0 6px 18px rgba(40,33,15,.05)' }}
    >
      <div className="flex items-center gap-3" style={{ padding: '17px 18px 13px' }}>
        <div
          className="h-[22px] w-[22px] flex-none rounded-[7px]"
          style={{ background: `linear-gradient(135deg,${card.sqA},${card.sqB})`, boxShadow: 'inset 0 0 0 .5px rgba(0,0,0,.06)' }}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[19px] font-black leading-tight tracking-tight" style={{ color: '#23201A' }}>
            {card.name}
          </div>
          <div className="text-[13px] font-semibold" style={{ color: '#A39E92' }}>
            {active.subtitle}
          </div>
        </div>
        <div className="relative flex-none">
          <button
            onClick={onToggleMenu}
            aria-label="Choose what to show"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]"
            style={{
              background: menuOpen ? accent + '1E' : '#fff',
              border: `.5px solid ${menuOpen ? accent : '#E6E0D4'}`,
              color: menuOpen ? accent : '#7C7768',
              transition: 'background .15s,border-color .15s,color .15s',
            }}
          >
            <SwitcherIcon />
          </button>
          {menuOpen && (
            <>
              <div onClick={onClose} className="fixed inset-0 z-40" />
              <div
                className="absolute right-0 top-[46px] z-50 w-64 bg-white p-1.5"
                style={{ border: '.5px solid #E6E0D4', borderRadius: 13, boxShadow: '0 12px 30px rgba(40,33,15,.16)', animation: 'apPop .14s cubic-bezier(.4,0,.2,1)' }}
              >
                <div className="px-2.5 pb-1.5 pt-[7px] text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: '#B6B0A3' }}>
                  {/* localized header passed via card? use a static-ish per-card label */}
                  {card.menuHeader}
                </div>
                {card.views.map((v) => {
                  const on = v.id === view;
                  return (
                    <button
                      key={v.id}
                      onClick={() => onPick(v.id)}
                      className="flex w-full items-center gap-2.5 rounded-[9px] p-2.5 text-left"
                      style={{ background: on ? accent + '1E' : 'transparent', transition: 'background .12s' }}
                    >
                      <span
                        className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg text-[15px]"
                        style={{ background: on ? accent + '26' : '#F2EEE5', color: on ? accent : '#9A958A' }}
                      >
                        <Icon kind={v.icon} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-bold" style={{ color: '#2B2820' }}>
                          {v.label}
                        </span>
                        <span className="block text-[11.5px]" style={{ color: '#A39E92' }}>
                          {v.desc}
                        </span>
                      </span>
                      {on && (
                        <span className="flex-none text-[14px] font-black" style={{ color: accent }}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* body */}
      {body.kind === 'rows' && <RowsView rows={sliceN != null ? body.rows.slice(0, sliceN) : body.rows} expanded={expanded} />}
      {body.kind === 'byunit' && <ByUnitView groups={body.groups} />}
      {body.kind === 'race' && (
        <PickRace
          frames={body.frames}
          boardsWord={body.boardsWord}
          empty={body.empty}
          playLabel={body.playLabel}
          pauseLabel={body.pauseLabel}
          accent={accent}
        />
      )}
      {body.kind === 'movers' && (
        <MoversView
          rising={body.rising}
          falling={body.falling}
          risingLabel={body.risingLabel}
          fallingLabel={body.fallingLabel}
          windowLabel={body.windowLabel}
          empty={body.empty}
        />
      )}
      {body.kind === 'diversity' && (
        <>
          <DiversityView rows={sliceN != null ? body.rows.slice(0, sliceN) : body.rows} spreadLabel={body.spreadLabel} expanded={expanded} />
          <p className="px-4 py-2.5 text-[11px] leading-snug" style={{ borderTop: '.5px solid #F1EDE4', color: '#A8A294' }}>
            {body.legend}
          </p>
        </>
      )}

      {collapsible && (
        <button
          onClick={onToggleExpand}
          className="flex w-full items-center justify-center gap-1.5 py-3 text-[13px] font-bold"
          style={{ borderTop: '.5px solid #F0ECE3', background: '#FBF8F2', color: '#7E7A6E', borderRadius: '0 0 16px 16px' }}
        >
          {expanded ? (body as { collapseLabel?: string }).collapseLabel : (body as { expandLabel?: string }).expandLabel}
          <Chevron up={expanded} />
        </button>
      )}
    </div>
  );
}

// ---- top-level: manages all 4 cards' state ----
export default function CommunityCards({ cards }: { cards: CardData[] }) {
  const [view, setView] = useState<Record<string, string>>(() =>
    Object.fromEntries(cards.map((c) => [c.id, c.views[0]?.id ?? 'top'])),
  );
  const [menu, setMenu] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col gap-4">
      {cards.map((c) => (
        <Card
          key={c.id}
          card={c}
          view={view[c.id]}
          menuOpen={menu === c.id}
          expanded={!!expanded[c.id]}
          onToggleMenu={() => setMenu((m) => (m === c.id ? null : c.id))}
          onClose={() => setMenu(null)}
          onPick={(v) => {
            setView((s) => ({ ...s, [c.id]: v }));
            setMenu(null);
            setExpanded((s) => ({ ...s, [c.id]: false }));
          }}
          onToggleExpand={() => setExpanded((s) => ({ ...s, [c.id]: !s[c.id] }))}
        />
      ))}
    </div>
  );
}
