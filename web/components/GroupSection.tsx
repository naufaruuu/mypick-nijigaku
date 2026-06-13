'use client';

import SongSlot from './SongSlot';
import { GROUP, headerBg, headerText } from '@/lib/layout';

/** The Nijigasaki group card: header + the top-3 song slots in a row. */
export default function GroupSection({ label }: { label?: string }) {
  const c = GROUP.color;
  const header = label ?? GROUP.label;
  const slots = [1, 2, 3];

  return (
    <div className="card" style={{ border: `3px solid ${c}` }}>
      <div
        className="chead"
        style={{ background: headerBg(GROUP), color: headerText(GROUP), fontSize: 13, padding: '6px 4px' }}
      >
        {header}
      </div>
      <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {slots.map((n) => (
          <SongSlot
            key={n}
            bucket={GROUP.bucket}
            slotId={`${GROUP.bucket}#${n - 1}`}
            headerLabel={`${header} · #${n}`}
            color={c}
            placeholder={`#${n}`}
          />
        ))}
      </div>
    </div>
  );
}
