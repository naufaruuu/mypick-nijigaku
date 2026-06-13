import type { MemberDiversity } from '@/db/queries';
import { MEMBER_COLORS } from '@/lib/layout';

// indent so the bar starts under the title: rank(28) + gap(12) + thumb(40) + gap(12)
const BAR_INDENT = 92;

// #1 = the story (gold numeral); #2–3 mid-gray; the rest fade to tertiary gray
function numColor(rank: number): string {
  if (rank === 0) return '#C9A20A';
  if (rank <= 2) return '#6b6a64';
  return '#a8a69e';
}

function Row({
  rank,
  m,
  pickCount,
  unit,
}: {
  rank: number;
  m: MemberDiversity;
  pickCount: (n: number) => string;
  unit: string;
}) {
  const ratio = m.available ? m.distinct / m.available : 0;
  return (
    <div className="px-4 py-2.5 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="w-7 flex-shrink-0 text-sm font-bold tabular-nums" style={{ color: numColor(rank) }}>
          #{rank + 1}
        </span>
        <img
          src={m.image}
          alt={m.name}
          loading="lazy"
          className="h-10 w-10 flex-shrink-0 rounded-md border border-stone-200 object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-stone-900">{m.name}</div>
          <div className="truncate text-xs text-stone-500">{pickCount(m.picks)}</div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-bold text-stone-800 tabular-nums">
            {m.distinct}
            <span className="font-medium text-stone-400">/{m.available}</span>
          </div>
          <div className="text-[10px] text-stone-400">{unit}</div>
        </div>
      </div>

      {/* bar = distinct / catalog: how much of their songbook the community spans */}
      <div
        className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-stone-200/70"
        style={{ marginLeft: BAR_INDENT }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(ratio * 100, m.distinct ? 1.5 : 0)}%`,
            background: m.color,
            boxShadow: m.light ? 'inset 0 0 0 1px rgba(0,0,0,0.22)' : undefined,
          }}
        />
      </div>
    </div>
  );
}

export default function DiverseMembers({
  title,
  subhead,
  items,
  pickCount,
  unit,
}: {
  title: string;
  subhead: string;
  items: MemberDiversity[];
  pickCount: (n: number) => string;
  unit: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        {/* rainbow swatch (all members) */}
        <span
          className="h-3.5 w-3.5 flex-shrink-0 rounded-[4px]"
          style={{ background: `linear-gradient(135deg, ${MEMBER_COLORS.join(', ')})` }}
        />
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight text-stone-900">{title}</h2>
          <p className="truncate text-xs text-stone-500">{subhead}</p>
        </div>
      </div>

      <div className="border-t border-stone-100">
        {items.length ? (
          items.map((m, i) => <Row key={m.slug} rank={i} m={m} pickCount={pickCount} unit={unit} />)
        ) : (
          <div className="px-4 py-8 text-center text-xs text-stone-400">—</div>
        )}
      </div>
    </section>
  );
}
