/**
 * Cloudflare Pages Function: GET/POST /api/autopilot
 * Replaces Next.js /app/api/autopilot/route.ts
 *
 * GET  — status check
 * POST — run the full auto-pilot pipeline
 *
 * All Firebase access is done via REST API (firebase-admin SDK is Node.js only)
 * Secrets are injected by Cloudflare Pages at runtime.
 */

interface Env {
  FIREBASE_SERVICE_ACCOUNT_KEY: string;
  GEMINI_API_KEY: string;
  CRON_SECRET: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHANNEL_ID?: string;
  ANIMEPULSE_KV: KVNamespace;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-cron-secret',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ── Firebase REST helpers ──────────────────────────────────────────────────

async function getFirebaseToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const toBase64Url = (str: string) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/datastore',
    })
  );

  const pemKey = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyBytes = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(`${header}.${payload}`)
  ) as ArrayBuffer;
  const sig = toBase64Url(String.fromCharCode(...new Uint8Array(sigBytes)));
  const jwt = `${header}.${payload}.${sig}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = (await tokenRes.json()) as { access_token: string };
  return tokenData.access_token;
}

function fsValue(v: unknown): unknown {
  if (!v || typeof v !== 'object') return null;
  const val = v as Record<string, unknown>;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    const arr = ((val.arrayValue as Record<string, unknown>).values as unknown[]) || [];
    return arr.map(fsValue);
  }
  if ('mapValue' in val) {
    const fields = ((val.mapValue as Record<string, unknown>).fields as Record<string, unknown>) || {};
    return Object.fromEntries(Object.entries(fields).map(([k, fv]) => [k, fsValue(fv)]));
  }
  return null;
}

function parseDoc(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fsValue(v)]));
}

function toFsValue(v: unknown): unknown {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsValue) } };
  if (typeof v === 'object') {
    return { mapValue: { fields: Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, toFsValue(val)])) } };
  }
  return { stringValue: String(v) };
}

function toFsDoc(obj: Record<string, unknown>) {
  return { fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFsValue(v)])) };
}

async function firestoreGetDoc(projectId: string, token: string, path: string) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const doc = (await res.json()) as { fields?: Record<string, unknown> };
  return doc.fields ? parseDoc(doc.fields) : null;
}

async function firestoreSetDoc(projectId: string, token: string, path: string, data: Record<string, unknown>) {
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(toFsDoc(data)),
    }
  );
}

async function firestoreQuery(projectId: string, token: string, collection: string, limitCount: number) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        orderBy: [{ field: { fieldPath: 'publishedAt' }, direction: 'DESCENDING' }],
        limit: limitCount,
      },
    }),
  });
  const rows = (await res.json()) as Array<{ document?: { name: string; fields: Record<string, unknown> } }>;
  return rows.filter(r => r.document?.fields).map(r => parseDoc(r.document!.fields));
}

async function firestoreBatchWrite(
  projectId: string,
  token: string,
  collection: string,
  docs: Record<string, unknown>[]
) {
  const writes = docs.map(doc => ({
    update: {
      name: `projects/${projectId}/databases/(default)/documents/${collection}/${doc.id}`,
      ...toFsDoc(doc),
    },
  }));
  // Firestore batch limit = 500
  for (let i = 0; i < writes.length; i += 500) {
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:batchWrite`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ writes: writes.slice(i, i + 500) }),
      }
    );
  }
}

// ── RSS Parser ─────────────────────────────────────────────────────────────

const RSS_SOURCES = [
  { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/news/rss.xml' },
  { name: 'Crunchyroll News', url: 'https://feeds.feedburner.com/crunchyroll/animenews' },
  { name: 'MyAnimeList News', url: 'https://myanimelist.net/rss/news.rss' },
  { name: 'Otaku USA', url: 'https://otakuusamagazine.com/feed/' },
  { name: 'AniTrendz', url: 'https://anitrendz.net/rss' },
];

function parseRSSXML(xml: string, sourceName: string) {
  const items: { title: string; link: string; description: string; imageUrl?: string; source: string }[] = [];
  const itemRegex = /<item>[\s\S]*?<\/item>/g;

  for (const item of (xml.match(itemRegex) || []).slice(0, 6)) {
    const title = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/title>/i)?.[1]
      ?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';
    const link = item.match(/<link>([^<]*)<\/link>/i)?.[1]?.trim() || '';
    if (!title || !link) continue;

    const rawDesc = (item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/description>/i)?.[1] || '')
      .replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim();

    let imageUrl: string | undefined;
    const mediaMatch = item.match(/<media:thumbnail[^>]+url="([^"]+)"/i) ||
      item.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="image/i) ||
      rawDesc.match(/<img[^>]+src="([^"]+)/i);
    if (mediaMatch) imageUrl = mediaMatch[1];

    items.push({
      title,
      link,
      description: rawDesc.length > 250 ? rawDesc.slice(0, 247) + '...' : rawDesc,
      imageUrl,
      source: sourceName,
    });
  }
  return items;
}

async function fetchAllRSS() {
  const all: { title: string; link: string; description: string; imageUrl?: string; source: string; sourceType: 'rss' }[] = [];
  for (const src of RSS_SOURCES) {
    try {
      const res = await fetch(src.url, { headers: { 'User-Agent': 'AnimePulse/2.0' } });
      if (!res.ok) continue;
      const xml = await res.text();
      parseRSSXML(xml, src.name).forEach(i => all.push({ ...i, sourceType: 'rss' }));
    } catch { /* skip failed sources */ }
  }
  return all;
}

// ── Gemini AI ──────────────────────────────────────────────────────────────

async function generateArticle(item: { title: string; description: string }, geminiKey: string) {
  if (!geminiKey) {
    return {
      title: item.title,
      content: `# ${item.title}\n\n${item.description}`,
      summary: item.description,
      tags: ['anime', 'news'],
      readTime: 2,
    };
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are an expert anime journalist. Write an engaging article:\n\nTitle: ${item.title}\nDescription: ${item.description}\n\nWrite in Markdown. End with ---SUMMARY--- (2-3 sentences) then ---TAGS--- (comma list).` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );
    const data = (await res.json()) as { candidates?: Array<{ content: { parts: Array<{ text: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const [content, rest] = text.split('---SUMMARY---');
    const [summary, tagsStr] = (rest || '').split('---TAGS---');
    const tags = (tagsStr || '').split(',').map((t: string) => t.trim()).filter(Boolean);
    const wordCount = (content || '').split(/\s+/).length;
    return {
      title: item.title,
      content: content?.trim() || `# ${item.title}\n\n${item.description}`,
      summary: summary?.trim() || item.description,
      tags: tags.length ? tags : ['anime', 'news'],
      readTime: Math.max(1, Math.ceil(wordCount / 200)),
    };
  } catch {
    return { title: item.title, content: `# ${item.title}\n\n${item.description}`, summary: item.description, tags: ['anime', 'news'], readTime: 2 };
  }
}

async function fetchTrendingAnime() {
  try {
    const res = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10');
    if (!res.ok) throw new Error('Jikan error');
    const data = (await res.json()) as { data: Array<{ title: string; images?: { jpg?: { large_image_url?: string } }; mal_id?: number }> };
    return (data.data || []).slice(0, 8).map(a => ({
      title: a.title,
      imageUrl: a.images?.jpg?.large_image_url,
      mal_id: a.mal_id,
    }));
  } catch {
    return [{ title: 'Solo Leveling' }, { title: 'Jujutsu Kaisen' }, { title: 'Demon Slayer' }];
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Auto-Pilot Pipeline ────────────────────────────────────────────────────

async function runAutoPilot(env: Env) {
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
  const projectId = sa.project_id;
  const token = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT_KEY);

  const errors: string[] = [];
  let added = 0;

  const existing = await firestoreQuery(projectId, token, 'articles', 200);
  const existingUrls = new Set(existing.map(a => a.url as string));

  const rssItems = await fetchAllRSS();
  const newItems = rssItems.filter(i => !existingUrls.has(i.link)).slice(0, 15);

  for (const item of newItems) {
    try {
      const generated = await generateArticle({ title: item.title, description: item.description }, env.GEMINI_API_KEY);
      // Jikan enrich
      let imageUrl = item.imageUrl;
      try {
        await new Promise(r => setTimeout(r, 400));
        const q = item.title.replace(/[^\w\s]/g, ' ').trim().split(' ').slice(0, 4).join(' ');
        const jr = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`);
        if (jr.ok) {
          const jd = (await jr.json()) as { data?: Array<{ images?: { jpg?: { large_image_url?: string } } }> };
          imageUrl = imageUrl || jd.data?.[0]?.images?.jpg?.large_image_url;
        }
      } catch { /* skip */ }

      const article = {
        id: genId(),
        title: generated.title,
        content: generated.content,
        summary: generated.summary,
        source: item.source,
        sourceType: item.sourceType,
        url: item.link,
        imageUrl: imageUrl || null,
        publishedAt: new Date().toISOString(),
        tags: generated.tags,
        readTime: generated.readTime,
      };

      existing.unshift(article as unknown as Record<string, unknown>);
      added++;

      if (env.TELEGRAM_BOT_TOKEN && added <= 3) {
        const msg = `🎌 *${article.title}*\n\n${article.summary}\n\n🔗 ${article.url}`;
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: env.TELEGRAM_CHANNEL_ID, text: msg, parse_mode: 'Markdown' }),
        }).catch(() => null);
      }
    } catch (e) {
      errors.push(`Article error for "${item.title}": ${e}`);
    }
  }

  await firestoreBatchWrite(projectId, token, 'articles', existing.slice(0, 200) as Record<string, unknown>[]);

  // Update trending
  const trending = await fetchTrendingAnime();
  await firestoreSetDoc(projectId, token, 'meta/trending', {
    updatedAt: new Date().toISOString(),
    anime: trending,
    analysis: '',
  });

  const status = {
    lastRun: new Date().toISOString(),
    articlesAdded: added,
    trendingUpdated: true,
    sources: { rss: rssItems.length, mal: 0, reddit: 0 },
    errors,
  };
  await firestoreSetDoc(projectId, token, 'meta/autopilot-status', status);

  // Invalidate KV cache
  await env.ANIMEPULSE_KV.delete('articles_list_all_all_20').catch(() => null);
  await env.ANIMEPULSE_KV.delete('articles_trending_all_all_20').catch(() => null);

  return { ok: true, added, sources: { rss: rssItems.length }, errors };
}

// ── Handlers ───────────────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const token = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const [status, articles] = await Promise.all([
      firestoreGetDoc(sa.project_id, token, 'meta/autopilot-status'),
      firestoreQuery(sa.project_id, token, 'articles', 5),
    ]);
    return json({
      ok: true,
      lastRun: (status as Record<string, unknown>)?.lastRun ?? null,
      totalArticles: articles.length,
      latestArticles: articles.slice(0, 5).map(a => ({ id: a.id, title: a.title, publishedAt: a.publishedAt })),
      status,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const secret = request.headers.get('x-cron-secret') || url.searchParams.get('secret');
  if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }
  try {
    const result = await runAutoPilot(env);
    return json(result);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });

// ── Cron scheduled handler (Cloudflare Pages Cron) ────────────────────────
// Cloudflare Pages doesn't support scheduled handlers in the functions/ folder
// Use the separate worker (worker.ts) with wrangler deploy for cron jobs
