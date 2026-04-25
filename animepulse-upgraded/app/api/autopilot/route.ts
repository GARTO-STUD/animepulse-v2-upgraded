/**
 * POST /api/autopilot  — Smart AutoPilot v2
 * GET  /api/autopilot  — Status check
 *
 * Improvements over v1:
 *  - News scoring system: only publishes articles scoring >= PUBLISH_THRESHOLD
 *  - Deduplication: URL, titleHash, and Jaccard similarity checks
 *  - Rate limiting: max MAX_DAILY_ARTICLES per run
 *  - Articles saved as 'draft' so admin can review before publishing
 *  - Groq AI (primary) + Gemini (fallback)
 *  - Structured content: hook, context, highlights, opinion, next steps
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import {
  getFirebaseToken, fsQuery, fsSet, fsBatchWrite, genId, fsVal,
  type Article,
} from '@/lib/firebase-rest';
import {
  scoreArticle, deduplicateArticles, titleHash,
  PUBLISH_THRESHOLD, MAX_DAILY_ARTICLES,
} from '@/lib/scoring';
import { generateArticle } from '@/lib/articleGenerator';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-cron-secret',
};

// ─── RSS Sources (scored by credibility) ─────────────────────────────────────

const RSS_SOURCES = [
  { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/news/rss.xml',      credibility: 30 },
  { name: 'Crunchyroll News',   url: 'https://feeds.feedburner.com/crunchyroll/animenews',  credibility: 28 },
  { name: 'MyAnimeList News',   url: 'https://myanimelist.net/rss/news.rss',                credibility: 25 },
  { name: 'Otaku USA',          url: 'https://otakuusamagazine.com/feed/',                  credibility: 22 },
];

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  imageUrl?: string;
  source: string;
}

function parseRSS(xml: string, srcName: string): RSSItem[] {
  const items: RSSItem[] = [];
  for (const item of (xml.match(/<item>[\s\S]*?<\/item>/g) || []).slice(0, 8)) {
    const title = item
      .match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/title>/i)?.[1]
      ?.replace(/<!\[CDATA\[|\]\]>/g, '')
      .trim() || '';
    const link = item.match(/<link>([^<]*)<\/link>/i)?.[1]?.trim() || '';
    if (!title || !link) continue;

    const rawDesc = (
      item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/description>/i)?.[1] || ''
    )
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    const pubDate =
      item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ||
      item.match(/<dc:date>([\s\S]*?)<\/dc:date>/i)?.[1]?.trim();

    const imgMatch =
      item.match(/<media:thumbnail[^>]+url="([^"]+)"/i) ||
      item.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="image/i);

    items.push({
      title,
      link,
      description: rawDesc.length > 300 ? rawDesc.slice(0, 297) + '...' : rawDesc,
      pubDate,
      imageUrl: imgMatch?.[1],
      source: srcName,
    });
  }
  return items;
}

async function fetchAllRSS(): Promise<RSSItem[]> {
  const all: RSSItem[] = [];
  await Promise.allSettled(
    RSS_SOURCES.map(async src => {
      try {
        const r = await fetch(src.url, {
          headers: { 'User-Agent': 'AnimePulse/2.0 (+https://animepulse.online)' },
        });
        if (!r.ok) return;
        parseRSS(await r.text(), src.name).forEach(i => all.push(i));
      } catch { /**/ }
    })
  );
  return all;
}

// ─── Fetch anime image from Jikan ────────────────────────────────────────────

async function fetchAnimeImage(title: string): Promise<string | null> {
  try {
    await new Promise(r => setTimeout(r, 300));
    const q = title.replace(/[^\w\s]/g, ' ').trim().split(' ').slice(0, 4).join(' ');
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`);
    if (!res.ok) return null;
    const data = await res.json() as {
      data?: Array<{ images?: { jpg?: { large_image_url?: string } } }>;
    };
    return data.data?.[0]?.images?.jpg?.large_image_url || null;
  } catch {
    return null;
  }
}

// ─── Count today's published articles ────────────────────────────────────────

function countTodayArticles(articles: Record<string, unknown>[]): number {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return articles.filter(a => {
    const d = new Date(a.publishedAt as string);
    return d >= todayStart;
  }).length;
}

// ─── Main AutoPilot logic ─────────────────────────────────────────────────────

async function runAutoPilot(saJson: string, groqKey: string, geminiKey: string) {
  const sa = JSON.parse(saJson);
  const token = await getFirebaseToken(saJson);
  const pid = sa.project_id;

  const errors: string[] = [];
  let added = 0;
  let skippedScore = 0;
  let skippedDuplicate = 0;

  // 1. Load existing articles (for deduplication)
  const existing = await fsQuery(pid, token, 'articles', 300);

  // 2. Check daily limit
  const todayCount = countTodayArticles(existing);
  const canPublish = Math.max(0, MAX_DAILY_ARTICLES - todayCount);

  if (canPublish === 0) {
    return {
      ok: true,
      added: 0,
      message: `Daily limit reached (${MAX_DAILY_ARTICLES} articles/day)`,
      todayCount,
      errors: [],
    };
  }

  // 3. Fetch RSS items
  const rssItems = await fetchAllRSS();

  // 4. Deduplicate candidates
  const candidates = deduplicateArticles(rssItems, existing);
  skippedDuplicate = rssItems.length - candidates.length;

  // 5. Score all candidates
  const scored = candidates
    .map(item => ({
      item,
      score: scoreArticle({
        title: item.title,
        description: item.description,
        source: item.source,
        publishedAt: item.pubDate,
      }),
    }))
    .sort((a, b) => b.score.total - a.score.total); // Best scores first

  // 6. Process top-scoring articles up to daily limit
  const toProcess = scored.filter(s => s.score.total >= PUBLISH_THRESHOLD).slice(0, canPublish);
  skippedScore = scored.filter(s => s.score.total < PUBLISH_THRESHOLD).length;

  for (const { item, score } of toProcess) {
    try {
      const gen = await generateArticle(
        { title: item.title, description: item.description },
        groqKey,
        geminiKey
      );

      // Try to get an anime image
      let imageUrl = item.imageUrl;
      if (!imageUrl) {
        imageUrl = await fetchAnimeImage(item.title) || null;
      }

      const article: Article = {
        id: genId(),
        title: gen.title,
        content: gen.content,
        summary: gen.summary,
        editorialNote: gen.editorialNote,
        verdict: gen.verdict,
        source: item.source,
        sourceType: 'rss',
        url: item.link,
        imageUrl: imageUrl || null,
        publishedAt: new Date().toISOString(),
        tags: gen.tags,
        readTime: gen.readTime,
        // Articles start as 'draft' — admin can review and publish
        // Change to 'published' here if you want fully automatic publishing
        status: 'draft',
        qualityScore: score.total,
        scoreBreakdown: score,
        titleHash: titleHash(item.title),
        views: 0,
      };

      existing.unshift(article as unknown as Record<string, unknown>);
      added++;
    } catch (e) {
      errors.push(`Error processing "${item.title}": ${String(e)}`);
    }
  }

  // 7. Save updated articles back to Firestore (keep latest 300)
  await fsBatchWrite(pid, token, 'articles', existing.slice(0, 300) as Record<string, unknown>[]);

  // 8. Update trending data from Jikan
  try {
    const tr = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10').then(
      r => r.ok ? r.json() : { data: [] }
    ).catch(() => ({ data: [] }));
    await fsSet(pid, token, 'meta/trending', {
      updatedAt: new Date().toISOString(),
      anime: (tr.data || []).map((a: { title: string; images?: { jpg?: { image_url?: string } }; score?: number }) => ({
        title: a.title,
        imageUrl: a.images?.jpg?.image_url || null,
        score: a.score || null,
      })),
    });
  } catch { /**/ }

  // 9. Update autopilot status
  await fsSet(pid, token, 'meta/autopilot-status', {
    lastRun: new Date().toISOString(),
    articlesAdded: added,
    skippedScore,
    skippedDuplicate,
    todayCount: todayCount + added,
    dailyLimit: MAX_DAILY_ARTICLES,
    publishThreshold: PUBLISH_THRESHOLD,
    totalCandidates: candidates.length,
    errors,
  });

  return {
    ok: true,
    added,
    skippedScore,
    skippedDuplicate,
    todayCount: todayCount + added,
    dailyLimit: MAX_DAILY_ARTICLES,
    errors,
  };
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET() {
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson)
    return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY not set' }, { status: 500, headers: CORS });
  try {
    const sa = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const pid = sa.project_id;

    const statusDoc = await fetch(
      `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/meta/autopilot-status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let status = null;
    if (statusDoc.ok) {
      const d = await statusDoc.json() as { fields?: Record<string, unknown> };
      if (d.fields) {
        status = Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fsVal(v)]));
      }
    }

    const articles = await fsQuery(pid, token, 'articles', 5);

    return NextResponse.json(
      {
        ok: true,
        status,
        publishThreshold: PUBLISH_THRESHOLD,
        dailyLimit: MAX_DAILY_ARTICLES,
        latestArticles: articles.slice(0, 5).map(a => ({
          id: a.id, title: a.title, publishedAt: a.publishedAt, status: a.status, qualityScore: a.qualityScore,
        })),
      },
      { headers: CORS }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}

export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const secret = req.headers.get('x-cron-secret') || url.searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson)
    return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY not set' }, { status: 500, headers: CORS });

  try {
    const result = await runAutoPilot(
      saJson,
      process.env.GROQ_API_KEY || '',
      process.env.GEMINI_API_KEY || ''
    );
    return NextResponse.json(result, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
