import { NextResponse, type NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { revalidateRequestSchema } from '@alcha/shared';
import { env } from '@/lib/env';

/**
 * On-demand ISR endpoint. The API calls this on publish with the affected cache
 * tags, protected by REVALIDATE_SECRET (sent as the x-revalidate-secret header).
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');
  if (!env.revalidateSecret || secret !== env.revalidateSecret) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = revalidateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid body', errors: parsed.error.issues }, { status: 400 });
  }

  for (const tag of parsed.data.tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true, tags: parsed.data.tags, now: Date.now() });
}
