'use client';

import { useState } from 'react';
import type { MemberDiversity } from '@/db/queries';

// MemberDiversity + the pre-formatted anchor line (formatted on the server, since
// i18n formatter functions can't be passed across the server→client boundary).
export type DiversityItem = MemberDiversity & { topLabel: string };

// indent so the bar starts under the title: rank(28) + gap(12) + thumb(40) + gap(12)
const BAR_INDENT = 92;

// #1 = the story (gold numeral); #2–3 mid-gray; the rest fade to tertiary gray
function numColor(rank: number): string {
  if (rank === 0) return '#C9A20A';
  if (rank <= 2) return '#6b6a64';
  return '#a8a69e';
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      width="13"
      height="13"
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

function Row({
  rank,
  m,
  spreadLabel,
}: {
  rank: number;
  m: DiversityItem;
  spreadLabel: string;
}) {
  return (
    <div className="px-4 py-2.5 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="w-7 flex-shrink-0 text-sm font-bold tabular-nums" style={{ color: numColor(rank) }}>
          #{rank + 1}
        </span>
        {m.image ? (
          <img
            src={m.image}
            alt={m.name}
            loading="lazy"
            className="h-10 w-10 flex-shrink-0 rounded-md border border-stone-200 object-cover"
          />
        ) : (
          // sub-units have no portrait — solid identity-color thumb
          <span
            className="h-10 w-10 flex-shrink-0 rounded-md"
            style={{ background: m.color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-stone-900">{m.name}</div>
          <div className="truncate text-xs text-stone-500">{m.topLabel}</div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-bold text-stone-800 tabular-nums">{m.spread}%</div>
          <div className="text-[10px] text-stone-400">{spreadLabel}</div>
        </div>
      </div>

      {/* bar width = spread score (how evenly their picks split across songs) */}
      <div
        className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-stone-200/70"
        style={{ marginLeft: BAR_INDENT }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(m.spread, m.spread ? 1.5 : 0)}%`,
            background: m.color,
            boxShadow: m.light ? 'inset 0 0 0 1px rgba(0,0,0,0.22)' : undefined,
          }}
        />
      </div>
    </div>
  );
}

interface CollapseCfg {
  defaultCount: number;
  expandLabel: string;
  collapseLabel: string;
}

export default function DiversityPanel({
  title,
  subhead,
  legend,
  swatch,
  spreadLabel,
  items,
  collapse,
}: {
  title: string;
  subhead: string;
  legend: string;
  swatch: string; // CSS background for the header swatch
  spreadLabel: string;
  items: DiversityItem[];
  collapse?: CollapseCfg;
}) {
  const [expanded, setExpanded] = useState(false);
  const canCollapse = !!collapse && items.length > collapse.defaultCount;
  const visible = canCollapse && !expanded ? items.slice(0, collapse!.defaultCount) : items;

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <span className="h-3.5 w-3.5 flex-shrink-0 rounded-[4px]" style={{ background: swatch }} />
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight text-stone-900">{title}</h2>
          <p className="text-xs text-stone-500">{subhead}</p>
        </div>
      </div>

      <div className="border-t border-stone-100">
        {visible.length ? (
          visible.map((m, i) => (
            <Row key={m.slug} rank={i} m={m} spreadLabel={spreadLabel} />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-xs text-stone-400">—</div>
        )}
      </div>

      {canCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-stone-100 bg-[#f4f2ec] px-4 py-3 text-sm font-medium text-stone-600 transition hover:bg-[#ebe8df]"
        >
          {expanded ? collapse!.collapseLabel : collapse!.expandLabel}
          <Chevron up={expanded} />
        </button>
      )}

      {/* legend explaining the score */}
      <p className="border-t border-stone-100 px-4 py-2.5 text-[11px] leading-snug text-stone-400">
        {legend}
      </p>
    </section>
  );
}
