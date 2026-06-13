'use client';

import { usePicks } from './PicksProvider';
import { SUBUNITS, OTHER, GROUP, headerBg, headerText, type BucketConfig } from '@/lib/layout';
import { dict, type Lang } from '@/lib/i18n';

// Fixed-size 9:16 export boards. Dimensions + fonts are fixed px and captured
// off-screen, so output is identical on every browser / zoom / screen size.
const W = 900;
const H = 1600; // 9:16 (mobile portrait)

const GHOST = 0.1; // opacity of the "other page" half of the rainbow
const STRIP_H = 8;

// near-white member colors blend into the cream bg → give them a faint border
function isLight(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.82;
}

// The 12-member spectrum split across the two pages. `half='first'` shows
// members 1-6 solid + 7-12 ghosted; `half='second'` inverts it. Side by side
// the two solid halves rejoin into one continuous, correctly-ordered band.
function Rainbow({ members, half }: { members: BucketConfig[]; half: 'first' | 'second' }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: STRIP_H, borderRadius: 4, overflow: 'hidden' }}>
      {members.map((m, i) => {
        const inFirst = i < 6;
        const solid = half === 'first' ? inFirst : !inFirst;
        return (
          <div
            key={m.bucket}
            style={{
              flex: 1,
              background: m.color,
              opacity: solid ? 1 : GHOST,
              boxShadow: solid && isLight(m.color) ? 'inset 0 0 0 1px rgba(0,0,0,0.10)' : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function Cover({
  slotId,
  placeholder,
  showTitles,
}: {
  slotId: string;
  placeholder?: string;
  showTitles: boolean;
}) {
  const { picks, songsBySlug } = usePicks();
  const slug = picks[slotId];
  const song = slug ? songsBySlug[slug] : undefined;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: song ? '#000' : '#fff',
        border: song ? 'none' : '2px dashed #b4b2a9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      {song ? (
        <>
          <img
            src={song.image}
            alt={song.name}
            crossOrigin="anonymous"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {showTitles && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                // scrim covers ~bottom 46%: dark at the base, smooth fade up, so
                // white text reads over light/busy art. Shared by every card.
                height: '50%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '0 12px 15px',
                textAlign: 'center',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.62) 42%, rgba(0,0,0,0) 100%)',
              }}
            >
              {/* up to 2 lines, no single-line ellipsis truncation */}
              <div
                style={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 26,
                  lineHeight: 1.12,
                  textShadow: '0 1px 3px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.5)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {song.name}
              </div>
              {song.jpName && (
                <div
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 17,
                    marginTop: 4,
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {song.jpName}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <span style={{ color: '#888780', fontSize: 24, letterSpacing: 1 }}>{placeholder ?? 'PICK'}</span>
      )}
    </div>
  );
}

// One card language everywhere: full-bleed art + bottom gradient title, with a
// colored label header. (Nijigasaki covers use the header-less variant.)
function ArtCard({
  bucket,
  slotIndex = 0,
  label,
  color,
  bg,
  textColor,
  placeholder,
  showTitles,
}: {
  bucket: string;
  slotIndex?: number;
  label: string;
  color: string;
  bg?: string;
  textColor?: string;
  placeholder?: string;
  showTitles: boolean;
}) {
  return (
    <div
      style={{
        border: `3px solid ${color}`,
        borderRadius: 14,
        overflow: 'hidden',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          background: headerBg({ color, bg }),
          color: headerText({ color, textColor }),
          textAlign: 'center',
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: 0.5,
          padding: '10px 6px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Cover slotId={`${bucket}#${slotIndex}`} placeholder={placeholder} showTitles={showTitles} />
      </div>
    </div>
  );
}

function Board({
  id,
  transparentBg,
  children,
}: {
  id: string;
  transparentBg: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      style={{
        width: W,
        height: H,
        boxSizing: 'border-box',
        padding: '36px 48px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: transparentBg ? 'transparent' : '#FAF7EF',
      }}
    >
      {children}
    </div>
  );
}

// Title + Japanese subtitle + (section label · page counter) baseline row.
function Header({ section, page }: { section: string; page: string }) {
  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 500, letterSpacing: 7, color: '#26215C' }}>
          MY PICK NIJIGASAKI
        </div>
        <div style={{ fontSize: 20, letterSpacing: 2, color: '#888780', marginTop: 7 }}>
          虹ヶ咲学園スクールアイドル同好会 お気に入り楽曲選
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: 12,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: 3,
          color: '#888780',
        }}
      >
        <span>{section}</span>
        <span>{page}</span>
      </div>
    </div>
  );
}

function Footer({ name, lang }: { name?: string; lang: Lang }) {
  const t = dict[lang];
  const credit = name?.trim() ? `${t.unofficial} · ${t.selectedBy(name.trim())}` : t.unofficial;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 23, letterSpacing: 5, color: '#26215C', fontWeight: 600 }}>
        MYPICK-NIJIGAKU.NAUFALALFA.COM
      </div>
      {/* secondary text color (#5f5e5a ~6:1 on cream) — legible but subordinate
          to the URL above via smaller size + letter-spacing. */}
      <div style={{ fontSize: 14, letterSpacing: 3, color: '#5f5e5a', marginTop: 6 }}>{credit}</div>
    </div>
  );
}

const grid = (extra: React.CSSProperties): React.CSSProperties => ({
  display: 'grid',
  gap: 14,
  minHeight: 0,
  ...extra,
});

// Image 1 (page 1/2): Nijigasaki group (top 3) + subunits + others.
export function UnitsBoard({
  members,
  name,
  lang,
  showTitles,
  transparentBg,
}: {
  members: BucketConfig[];
  name?: string;
  lang: Lang;
  showTitles: boolean;
  transparentBg: boolean;
}) {
  const t = dict[lang];
  return (
    <Board id="export-units" transparentBg={transparentBg}>
      <Header section={t.unitsSection} page="1 / 2" />
      <Rainbow members={members} half="first" />

      {/* Nijigasaki — 3 covers (header-less full-bleed) */}
      <div
        style={{
          flex: 1.1,
          minHeight: 0,
          border: `3px solid ${GROUP.color}`,
          borderRadius: 14,
          overflow: 'hidden',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: headerBg(GROUP),
            color: headerText(GROUP),
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 30,
            padding: '12px 6px',
            lineHeight: 1.15,
          }}
        >
          {t.groupLabel}
        </div>
        <div style={{ flex: 1, padding: 14, ...grid({ gridTemplateColumns: 'repeat(3,1fr)' }) }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ borderRadius: 10, overflow: 'hidden', minHeight: 0 }}>
              <Cover slotId={`${GROUP.bucket}#${i}`} placeholder={`#${i + 1}`} showTitles={showTitles} />
            </div>
          ))}
        </div>
      </div>

      {/* subunits + others — 6 cards, 3 × 2 */}
      <div style={{ flex: 1.9, ...grid({ gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(2,1fr)' }) }}>
        {SUBUNITS.map((s: BucketConfig) => (
          <ArtCard
            key={s.bucket}
            bucket={s.bucket}
            label={s.label}
            color={s.color}
            bg={s.bg}
            textColor={s.textColor}
            showTitles={showTitles}
          />
        ))}
        <ArtCard bucket={OTHER.bucket} slotIndex={0} label={`${t.othersLabel} #1`} color={OTHER.color} placeholder="#1" showTitles={showTitles} />
        <ArtCard bucket={OTHER.bucket} slotIndex={1} label={`${t.othersLabel} #2`} color={OTHER.color} placeholder="#2" showTitles={showTitles} />
      </div>

      <Footer name={name} lang={lang} />
    </Board>
  );
}

// Image 2 (page 2/2): the 12 member cards (3 × 4).
export function CharsBoard({
  members,
  name,
  lang,
  showTitles,
  transparentBg,
}: {
  members: BucketConfig[];
  name?: string;
  lang: Lang;
  showTitles: boolean;
  transparentBg: boolean;
}) {
  const t = dict[lang];
  return (
    <Board id="export-chars" transparentBg={transparentBg}>
      <Header section={t.membersSection} page="2 / 2" />
      <Rainbow members={members} half="second" />
      <div style={{ flex: 1, ...grid({ gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(4,1fr)' }) }}>
        {members.map((m) => (
          <ArtCard key={m.bucket} bucket={m.bucket} label={m.label} color={m.color} showTitles={showTitles} />
        ))}
      </div>
      <Footer name={name} lang={lang} />
    </Board>
  );
}
