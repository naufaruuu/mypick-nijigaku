'use client';

interface PreviewModalProps {
  previews: { units: string; chars: string };
  generating: boolean;
  showTitles: boolean;
  transparentBg: boolean;
  /** /p/<id> for the saved pick set, or null if the save didn't happen */
  shareHref?: string | null;
  shareLabel?: string;
  onToggleTitles: (v: boolean) => void;
  onToggleTransparent: (v: boolean) => void;
  onClose: () => void;
}

function download(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const checker = 'repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 16px 16px';

export default function PreviewModal({
  previews,
  generating,
  showTitles,
  transparentBg,
  shareHref,
  shareLabel = 'Share link',
  onToggleTitles,
  onToggleTransparent,
  onClose,
}: PreviewModalProps) {
  const images = [
    { key: 'units', label: 'Group · Subunits · Other', file: 'my-pick-nijigasaki-units.webp', url: previews.units },
    { key: 'chars', label: 'Members', file: 'my-pick-nijigasaki-characters.webp', url: previews.chars },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h3 className="text-base font-semibold text-stone-900">Your picks — 2 images</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-stone-500 transition hover:bg-stone-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* both previews side-by-side (stacks on mobile) */}
        <div className="grid flex-1 gap-4 overflow-auto p-4 sm:grid-cols-2">
          {images.map((img) => (
            <div key={img.key} className="flex flex-col gap-2">
              <div className="text-center text-xs font-semibold tracking-wide text-stone-500">
                {img.label}
              </div>
              <div className="rounded-lg p-2" style={{ background: checker }}>
                <img src={img.url} alt={img.label} className="w-full rounded shadow" />
              </div>
              <button
                onClick={() => download(img.url, img.file)}
                disabled={generating}
                className="rounded-xl bg-[#D85A30] py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
              >
                Download
              </button>
            </div>
          ))}
        </div>

        {/* shared options + download-both */}
        <div className="space-y-3 border-t border-black/5 bg-stone-50 p-4">
          <div className="flex items-center justify-center gap-5 text-xs text-stone-600">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={showTitles}
                onChange={(e) => onToggleTitles(e.target.checked)}
              />
              Show titles
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={transparentBg}
                onChange={(e) => onToggleTransparent(e.target.checked)}
              />
              Transparent background
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => images.forEach((img) => download(img.url, img.file))}
              disabled={generating}
              className="flex-1 rounded-[10px] border border-stone-300 bg-white py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
            >
              {generating ? 'Generating…' : 'Download both'}
            </button>
            {shareHref && (
              <a
                href={shareHref}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#F8D657] py-2.5 text-sm font-semibold text-[#6b5a00] transition hover:brightness-95"
              >
                🔗 {shareLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
