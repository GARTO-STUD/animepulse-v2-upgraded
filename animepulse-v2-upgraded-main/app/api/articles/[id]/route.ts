/**
 * GET /api/articles/[id] — Fetch single article + increment view counter
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseToken, fsGet, fsPatch } from '@/lib/firebase-rest';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson)
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });

  try {
    const sa    = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const pid   = sa.project_id;

    const article = await fsGet(pid, token, `articles/${params.id}`);
    if (!article)
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });

    // Increment view counter asynchronously (fire-and-forget)
    const currentViews = (article.views as number) || 0;
    fsPatch(pid, token, `articles/${params.id}`, { views: currentViews + 1 }).catch(() => {});

    return NextResponse.json(
      { article: { ...article, views: currentViews + 1 } },
      {
        headers: {
          ...CORS,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
