'use client';

import { useState } from 'react';
import type { SongStat } from '@/db/queries';

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

// rank tiers: #1 = the story (gold numeral, full-strength bar); #2–3 mid; the
// rest fade to a neutral bar + tertiary-gray numeral so the top reads first.
function rowStyle(rank: number) {
  if (rank === 0) return { num: '#C9A20A', fill: undefined as string | undefined, opacity: 1 };
  if (rank <= 2) return { num: '#6b6a64', fill: undefined as string | undefined, opacity: 0.72 };
  return { num: '#a8a69e', fill: '#cbc9bf', opacity: 1 };
}

// indent so the bar starts under the title: rank(28) + gap(12) + thumb(40) + gap(12)
const BAR_INDENT = 92;

function Row({
  rank,
  s,
  boards,
  showSource,
}: {
  rank: number;
  s: SongStat;
  boards: number;
  showSource: boolean;
}) {
  const tier = rowStyle(rank);
  const fillBg = tier.fill ?? s.color;
  // light identity colors (e.g. Lanzhu, QU4RTZ) can wash out against the track —
  // give the fill a faint inset border so it stays legible. Skip on neutral tiers.
  const safeguard = !tier.fill && s.light;

  return (
    <div className="px-4 py-2.5 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-3">
        <span
          className="w-7 flex-shrink-0 text-sm font-bold tabular-nums"
          style={{ color: tier.num }}
        >
          #{rank + 1}
        </span>
        <img
          src={s.image}
          alt={s.name}
          loading="lazy"
          className="h-10 w-10 flex-shrink-0 rounded-md border border-stone-200 object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-stone-900">{s.name}</div>
          {showSource && <div className="truncate text-xs text-stone-500">{s.subtitle}</div>}
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-bold text-stone-800 tabular-nums">
            {s.count}
            <span className="font-medium text-stone-400">/{boards}</span>
          </div>
          <div className="text-[10px] text-stone-400 tabular-nums">{pct(s.pct)}</div>
        </div>
      </div>

      {/* absolute-scaled bar: width = percentage, so bar and label agree */}
      <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-stone-200/70" style={{ marginLeft: BAR_INDENT }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(s.pct * 100, 1.5)}%`,
            background: fillBg,
            opacity: tier.opacity,
            boxShadow: safeguard ? 'inset 0 0 0 1px rgba(0,0,0,0.22)' : undefined,
          }}
        />
      </div>
    </div>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${up ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function CommunitySection({
  title,
  subhead,
  swatch,
  items,
  boards,
  showSource,
  expandLabel,
  collapseLabel,
  defaultCount = 3,
}: {
  title: string;
  subhead: string;
  swatch: string;
  items: SongStat[];
  boards: number;
  showSource: boolean;
  expandLabel: string;
  collapseLabel: string;
  defaultCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > defaultCount;
  const visible = expanded ? items : items.slice(0, defaultCount);

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <span className="h-3.5 w-3.5 flex-shrink-0 rounded-[4px]" style={{ background: swatch }} />
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight text-stone-900">{title}</h2>
          <p className="truncate text-xs text-stone-500">{subhead}</p>
        </div>
      </div>

      <div className="border-t border-stone-100">
        {items.length ? (
          visible.map((s, i) => (
            <Row key={s.slug} rank={i} s={s} boards={boards} showSource={showSource} />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-xs text-stone-400">—</div>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-stone-100 bg-[#f4f2ec] px-4 py-3 text-sm font-medium text-stone-600 transition hover:bg-[#ebe8df]"
        >
          {expanded ? collapseLabel : expandLabel}
          <Chevron up={expanded} />
        </button>
      )}
    </section>
  );
}
