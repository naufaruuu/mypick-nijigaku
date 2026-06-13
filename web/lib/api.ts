import type { PicksData } from './types';

// Client-side: save picks via the same-origin Next route handler.
export async function createPick(data: PicksData): Promise<{ id: string }> {
  const res = await fetch('/api/picks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = (await res.json()).error ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(`save failed: ${msg}`);
  }
  return res.json();
}
