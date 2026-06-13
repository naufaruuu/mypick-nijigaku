import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPick } from '@/db/queries';

// The grid has ~21 real slots (group 3 + others 2 + 4 subunits + 12 members).
// Cap keys and string lengths so an unauthenticated POST can't write an
// arbitrarily large jsonb row / pollute the cache. slotId is "<bucket>#<n>";
// the value is a song slug.
const MAX_SLOTS = 30;
const schema = z.object({
  data: z
    .record(z.string().max(40), z.string().max(80))
    .refine((d) => {
      const n = Object.keys(d).length;
      return n > 0 && n <= MAX_SLOTS;
    }, { message: `picks must be between 1 and ${MAX_SLOTS}` }),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const id = await createPick(parsed.data.data);
  return NextResponse.json({ id }, { status: 201 });
}
