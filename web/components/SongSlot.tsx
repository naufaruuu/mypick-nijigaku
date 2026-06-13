'use client';

import type { CSSProperties } from 'react';
import { usePicks } from './PicksProvider';

interface SongSlotProps {
  bucket: string;
  slotId: string;
  headerLabel: string;
  color: string;
  placeholder?: string;
  style?: CSSProperties;
}

/** A clickable pick slot: shows the chosen song's cover, or a placeholder. */
export default function SongSlot({
  bucket,
  slotId,
  headerLabel,
  color,
  placeholder = 'PICK',
  style,
}: SongSlotProps) {
  const { picks, songsBySlug, open, clear, readOnly, flashId } = usePicks();
  const song = picks[slotId] ? songsBySlug[picks[slotId]] : undefined;
  const flash = flashId === slotId ? ' slot--flash' : '';

  const handleOpen = () => open(bucket, slotId, headerLabel, color);

  if (!song) {
    return (
      <div
        className={`slot${readOnly ? ' readonly' : ''}`}
        style={style}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
      >
        {readOnly ? '' : placeholder}
      </div>
    );
  }

  return (
    <div
      className={`slot slot--filled${readOnly ? ' readonly' : ''}${flash}`}
      style={style}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
    >
      {/* eager (not lazy): the off-screen export sheets must load their covers
          or modern-screenshot waits on them. */}
      <img className="slot-cover" src={song.image} alt={song.name} crossOrigin="anonymous" />
      <div className="slot-overlay">
        <div className="slot-title" title={song.name}>
          {song.name}
        </div>
        {song.jpName && (
          <div className="slot-jp" title={song.jpName}>
            {song.jpName}
          </div>
        )}
      </div>
      {!readOnly && (
        <button
          className="slot-clear"
          title="Clear pick"
          onClick={(e) => {
            e.stopPropagation();
            clear(slotId);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
