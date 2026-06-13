'use client';

import type { CSSProperties } from 'react';
import SongSlot from './SongSlot';
import { headerBg, headerText } from '@/lib/layout';

interface CardProps {
  bucket: string;
  label: string;
  color: string;
  bg?: string;
  textColor?: string;
  /** appended to the header, e.g. "(11)" */
  countLabel?: string;
  /** number of pick slots (default 1) */
  slots?: number;
  /** per-slot placeholder text, e.g. ["#1", "#2"] */
  placeholders?: string[];
  /** extra style on the card root (e.g. grid-column span) */
  style?: CSSProperties;
}

/** A bordered card with a colored header and one or more pick slots. */
export default function Card({
  bucket,
  label,
  color,
  bg,
  textColor,
  countLabel,
  slots = 1,
  placeholders,
  style,
}: CardProps) {
  const header = countLabel ? `${label} ${countLabel}` : label;
  const headBg = headerBg({ color, bg });
  const headText = headerText({ color, textColor });

  // background = the accent (matches the 3px border) so the only bg pixels that
  // can show — the antialiased rounded-corner rim between border and content —
  // blend into the border instead of leaking white. The empty slot is squared
  // off (radius 0) so it fills the body flush and can't expose accent notches.
  return (
    <div className="card" style={{ border: `3px solid ${color}`, background: color, ...style }}>
      <div className="chead" style={{ background: headBg, color: headText }}>
        {header}
      </div>
      {slots === 1 ? (
        <div className="cbody">
          <SongSlot
            bucket={bucket}
            slotId={`${bucket}#0`}
            headerLabel={header}
            color={color}
            placeholder={placeholders?.[0]}
          />
        </div>
      ) : (
        <div
          className="cbody"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${slots},1fr)`, gap: 8 }}
        >
          {Array.from({ length: slots }, (_, i) => (
            <SongSlot
              key={i}
              bucket={bucket}
              slotId={`${bucket}#${i}`}
              headerLabel={`${header} · #${i + 1}`}
              color={color}
              placeholder={placeholders?.[i] ?? 'PICK'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
