'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { domToBlob } from 'modern-screenshot';
import { PicksProvider, usePicks } from './PicksProvider';
import GroupSection from './GroupSection';
import Card from './Card';
import PreviewModal from './PreviewModal';
import ConfirmModal from './ConfirmModal';
import { UnitsBoard, CharsBoard } from './Export';
import { GROUP, OTHER, SUBUNITS, membersFromCharacters, type BucketConfig } from '@/lib/layout';
import type { Character, PicksData, Song } from '@/lib/types';
import { dict, type Lang } from '@/lib/i18n';
import { createPick } from '@/lib/api';

interface PosterProps {
  songs: Record<string, Song[]>;
  characters: Character[];
  lang?: Lang;
  initialPicks?: PicksData;
  initialName?: string;
  readOnly?: boolean;
}

const NAME_KEY = 'nijigaku_name';

const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 } as const;

function MembersGrid({ members, mt }: { members: BucketConfig[]; mt?: number }) {
  return (
    <div style={{ ...grid3, marginTop: mt }}>
      {members.map((m) => (
        <Card key={m.bucket} bucket={m.bucket} label={m.label} color={m.color} />
      ))}
    </div>
  );
}

function UnitsGrid({
  mt,
  othersLabel,
  othersSuffix,
}: {
  mt?: number;
  othersLabel: string;
  othersSuffix: string;
}) {
  return (
    <div style={{ ...grid3, marginTop: mt }}>
      {SUBUNITS.map((s) => (
        <Card
          key={s.bucket}
          bucket={s.bucket}
          label={s.label}
          color={s.color}
          bg={s.bg}
          textColor={s.textColor}
        />
      ))}
      <Card
        bucket={OTHER.bucket}
        label={othersLabel}
        color={OTHER.color}
        countLabel={othersSuffix}
        slots={OTHER.slots}
        placeholders={['#1', '#2']}
        style={{ gridColumn: 'span 2' }}
      />
    </div>
  );
}

// ---- top-level app ----

function PosterApp({ songs, characters, lang = 'en', initialName, readOnly }: PosterProps) {
  const { picks, clearAll } = usePicks();
  const t = dict[lang];

  const members = membersFromCharacters(characters, songs, lang);
  const pickedCount = Object.keys(picks).length;
  const hasPicks = pickedCount > 0;
  const totalSlots = GROUP.slots + members.length + SUBUNITS.length + OTHER.slots;

  const [name, setName] = useState(initialName ?? '');
  // restore the locally-remembered name (editable mode only)
  useEffect(() => {
    if (readOnly || initialName) return;
    const saved = localStorage.getItem(NAME_KEY);
    if (saved) setName(saved);
  }, [readOnly, initialName]);
  const onName = (v: string) => {
    setName(v);
    if (!readOnly) localStorage.setItem(NAME_KEY, v);
  };

  const [previews, setPreviews] = useState<{ units: string; chars: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showTitles, setShowTitles] = useState(true);
  const [transparentBg, setTransparentBg] = useState(false);
  // id of the saved pick set for this exact selection (so the modal can link to
  // /p/<id>). Reset whenever the selection changes so a new set re-saves.
  const [shareId, setShareId] = useState<string | null>(null);
  useEffect(() => setShareId(null), [picks]);

  // "Copy link" feedback on the read-only share page
  const [copied, setCopied] = useState(false);
  const copyLink = useCallback(async () => {
    const url = window.location.href;
    let ok = false;
    // navigator.clipboard only exists in a secure context (https / localhost).
    // Over plain-HTTP LAN it's undefined, so fall back to a hidden textarea.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        ok = true;
      }
    } catch {
      /* fall through to the execCommand path */
    }
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // last resort: let the user copy it themselves
      window.prompt('Copy this link:', url);
    }
  }, []);

  // object URLs for the generated blobs; revoke when replaced/closed
  const urlsRef = useRef<{ units: string; chars: string } | null>(null);
  const revokeUrls = useCallback(() => {
    if (urlsRef.current) {
      URL.revokeObjectURL(urlsRef.current.units);
      URL.revokeObjectURL(urlsRef.current.chars);
      urlsRef.current = null;
    }
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      // ensure the embedded font is loaded so it gets inlined into the image
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 80)); // let toggle classes paint
      // WebP at q0.9: ~5-10x smaller than PNG, no visible loss, keeps alpha
      // (so the transparent-bg toggle still works). timeout = safety guard.
      const opts = { scale: 2, timeout: 15000, type: 'image/webp', quality: 0.9 } as const;
      // Blob + object URL (not a multi-MB base64 data URL) — small href, and
      // downloads reliably on mobile where huge data: URLs fail.
      const unitsBlob = await domToBlob(document.getElementById('export-units')!, opts);
      const charsBlob = await domToBlob(document.getElementById('export-chars')!, opts);
      revokeUrls();
      const next = {
        units: URL.createObjectURL(unitsBlob),
        chars: URL.createObjectURL(charsBlob),
      };
      urlsRef.current = next;
      setPreviews(next);
    } catch (e) {
      console.error('export failed', e);
      alert(`Could not generate the images: ${(e as Error)?.message ?? e}`);
    } finally {
      setGenerating(false);
    }
  }, [revokeUrls]);

  // regenerate when a toggle changes while the preview is open
  useEffect(() => {
    if (!previews) return;
    const t = setTimeout(generate, 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTitles, transparentBg]);

  // "Download images" also saves the pick (like Share) so the modal can offer a
  // /p/<id> link. We save at most once per selection: createPick runs only when
  // there's no shareId yet (the picks-change effect clears it). The image
  // regeneration in generate() — re-run on every toggle — never re-saves.
  const onExport = useCallback(async () => {
    if (hasPicks && !shareId) {
      try {
        // name is intentionally NOT sent — it stays client-side for the image only
        const { id } = await createPick(picks);
        setShareId(id);
      } catch (e) {
        console.error('save failed', e);
      }
    }
    await generate();
  }, [hasPicks, shareId, picks, generate]);

  return (
    <div className="page">
      {/* controls (global title + rainbow header is rendered by the layout) */}
      <div className="controls">
        {readOnly ? (
          <div className="controls-panel">
            <div className="action-row">
              <a href="/" className="btn btn-download">
                {t.makeYourOwn}
              </a>
              <button type="button" onClick={copyLink} className="btn btn-secondary">
                {copied ? t.copied : t.copyLink}
              </button>
            </div>
            <div className="nav-row">
              <a href="/community-picks" className="btn btn-secondary">
                {t.community}
              </a>
              <a href="/songs" className="btn btn-secondary">
                {t.allSongs}
              </a>
            </div>
          </div>
        ) : (
          <div className="controls-panel">
            {/* produce-my-output cluster: name + export actions */}
            <div className="name-field">
              <input
                type="text"
                value={name}
                onChange={(e) => onName(e.target.value)}
                placeholder={t.namePlaceholder}
                maxLength={40}
                className="name-input"
                aria-label={t.namePlaceholder}
              />
              <div className="name-help">
                {t.nameHelp} <span className="name-privacy">{t.namePrivacy}</span>
              </div>
            </div>

            <div className="action-row">
              <button onClick={onExport} disabled={generating} className="btn btn-download">
                {generating ? t.generating : t.download}
              </button>
            </div>

            <div className="nav-row">
              <a href="/community-picks" className="btn btn-secondary">
                {t.community}
              </a>
              <a href="/songs" className="btn btn-secondary">
                {t.allSongs}
              </a>
            </div>

            {/* destructive action separated below a divider */}
            <div className="controls-divider" />
            <div className="controls-foot">
              <span className="pick-count">{t.picked(pickedCount, totalSlots)}</span>
              {hasPicks && (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="btn-clear"
                >
                  {t.clearAll}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* interactive on-screen sheet — just the pick grids (title is now on top) */}
      <div className="sheet" id="mypick-poster">
        <GroupSection label={t.groupLabel} />
        <MembersGrid members={members} mt={16} />
        <UnitsGrid mt={16} othersLabel={t.othersLabel} othersSuffix={t.othersSuffix} />
      </div>

      {/* off-screen 9:16 export boards — image 1: group+units+other, image 2: chars */}
      <div aria-hidden style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }}>
        <UnitsBoard members={members} name={name} lang={lang} showTitles={showTitles} transparentBg={transparentBg} />
        <CharsBoard members={members} name={name} lang={lang} showTitles={showTitles} transparentBg={transparentBg} />
      </div>

      {previews && (
        <PreviewModal
          previews={previews}
          generating={generating}
          showTitles={showTitles}
          transparentBg={transparentBg}
          shareHref={shareId ? `/p/${shareId}` : null}
          shareLabel={t.openShare}
          onToggleTitles={setShowTitles}
          onToggleTransparent={setTransparentBg}
          onClose={() => {
            revokeUrls();
            setPreviews(null);
          }}
        />
      )}

      {confirmClear && (
        <ConfirmModal
          title={t.clearConfirm}
          message={t.clearConfirmBody}
          confirmLabel={t.clearAll}
          cancelLabel={t.cancel}
          destructive
          onConfirm={() => {
            clearAll();
            setConfirmClear(false);
          }}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}

export default function Poster({
  songs,
  characters,
  lang,
  initialPicks,
  initialName,
  readOnly,
}: PosterProps) {
  return (
    <PicksProvider songsByBucket={songs} initialPicks={initialPicks} readOnly={readOnly}>
      <PosterApp
        songs={songs}
        characters={characters}
        lang={lang}
        initialPicks={initialPicks}
        initialName={initialName}
        readOnly={readOnly}
      />
    </PicksProvider>
  );
}
