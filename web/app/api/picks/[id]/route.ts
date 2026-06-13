import { NextResponse } from 'next/server';
import { getPick } from '@/db/queries';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pick = await getPick(id);
  if (!pick) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ id, data: pick.data });
}
