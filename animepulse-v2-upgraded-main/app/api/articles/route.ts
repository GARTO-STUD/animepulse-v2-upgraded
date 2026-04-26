/**
 * GET /api/articles — Articles listing with pagination, filtering, caching
 * Edge Runtime (Cloudflare Pages compatible)
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseToken, fsQuery, fsVal } from '@/lib/firebase-rest';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Cache TTL: 2 minutes for article lists
const CACHE_TTL = 120;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const limit  = Math.min(parseInt(searchParams.get('limit')  || '20'), 100);
  const page   = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const source = searchParams.get('source');
  const tag    = searchParams.get('tag');
  const type   = searchParams.get('type');
  const status = searchParams.get('status') || 'published'; // default: only published

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson)
    return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY not set' }, { status: 500 });

  try {
    const sa = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const pid = sa.project_id;
    const base = `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents`;

    // ── Trending endpoint ──────────────────────────────────────────────────
    if (type === 'trending') {
      const r = await fetch(`${base}/meta/trending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json() as { fields?: Record<string, unknown> };
        const data = d.fields
          ? Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fsVal(v)]))
          : { anime: [], updatedAt: null };
        return NextResponse.json(data, {
          headers: { ...CORS, 'Cache-Control': `public, max-age=${CACHE_TTL}` },
        });
      }
      return NextResponse.json({ anime: [], updatedAt: null }, { headers: CORS });
    }

    // ── Autopilot status endpoint ──────────────────────────────────────────
    if (type === 'autopilot-status') {
      const r = await fetch(`${base}/meta/autopilot-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json() as { fields?: Record<string, unknown> };
        const data = d.fields
          ? Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fsVal(v)]))
          : null;
        return NextResponse.json({ status: data }, { headers: CORS });
      }
      return NextResponse.json({ status: null }, { headers: CORS });
    }

    // ── Article listing ────────────────────────────────────────────────────
    // Fetch a larger set for client-side filtering + pagination
    const fetchLimit = (source || tag || status !== 'published') ? 300 : limit * page + limit;
    const rows = await fsQuery(pid, token, 'articles', fetchLimit);

    let articles = rows;

    // Filter by status (default: only show published)
    if (status === 'published') {
      articles = articles.filter(a => !a.status || a.status === 'published');
    } else if (status === 'all') {
      // Admin endpoint — return all
    } else {
      articles = articles.filter(a => a.status === status);
    }

    // Filter by source type
    if (source) articles = articles.filter(a => a.sourceType === source);

    // Filter by tag
    if (tag) articles = articles.filter(a => Array.isArray(a.tags) && (a.tags as string[]).includes(tag));

    const total = articles.length;

    // Pagination
    const offset = (page - 1) * limit;
    const paginated = articles.slice(offset, offset + limit);

    return NextResponse.json(
      {
        articles: paginated,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
      {
        headers: {
          ...CORS,
          'Cache-Control': `public, max-age=${CACHE_TTL}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
