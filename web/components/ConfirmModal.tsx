'use client';

import { useEffect } from 'react';

interface ConfirmModalProps {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** red confirm button for irreversible actions (e.g. Clear all) */
  destructive?: boolean;
}

// Small centered confirm dialog — same design language as PreviewModal
// (rounded-2xl white card, dimmed/blurred backdrop, stone-50 action footer).
export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive,
}: ConfirmModalProps) {
  // Escape cancels, like the native dialog it replaces.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div onClick={onCancel} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pb-5 pt-6 text-center">
          <h3 className="text-lg font-bold text-stone-900">{title}</h3>
          {message && <p className="mt-2 text-sm leading-relaxed text-stone-500">{message}</p>}
        </div>

        <div className="flex gap-2 border-t border-black/5 bg-stone-50 p-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[10px] border border-stone-300 bg-white py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-[10px] py-2.5 text-sm font-semibold text-white transition hover:brightness-95 ${
              destructive ? 'bg-[#c0392b]' : 'bg-[#D85A30]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
