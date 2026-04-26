/**
 * Cloudflare Pages Function: GET /api/articles
 * Replaces the Next.js /app/api/articles/route.ts
 *
 * Uses Firebase REST API instead of firebase-admin SDK
 * (firebase-admin does NOT work in Cloudflare Workers)
 *
 * Query params:
 *   ?limit=20        — number of articles (default 20, max 100)
 *   ?source=reddit   — filter by sourceType (rss | mal | reddit)
 *   ?tag=action      — filter by tag
 *   ?type=trending   — return trending data instead
 */

interface Env {
  FIREBASE_SERVICE_ACCOUNT_KEY: string;
  ANIMEPULSE_KV: KVNamespace;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/datastore',
    })
  );

  // Sign using Web Crypto
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
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sigBytes = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, data) as ArrayBuffer;
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  const jwt = `${header}.${payload}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = (await tokenRes.json()) as { access_token: string };
  return tokenData.access_token;
}

async function firestoreQuery(
  projectId: string,
  token: string,
  collection: string,
  orderField: string,
  limitCount: number
) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      orderBy: [{ field: { fieldPath: orderField }, direction: 'DESCENDING' }],
      limit: limitCount,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<Array<{ document?: { fields: Record<string, unknown> } }>>;
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
    const arr = (val.arrayValue as { values?: unknown[] }).values || [];
    return arr.map(fsValue);
  }
  if ('mapValue' in val) {
    const fields = (val.mapValue as { fields?: Record<string, unknown> }).fields || {};
    return Object.fromEntries(Object.entries(fields).map(([k, fv]) => [k, fsValue(fv)]));
  }
  return null;
}

function parseDoc(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fsValue(v)]));
}

// ── Handler ────────────────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const source = url.searchParams.get('source');
  const tag = url.searchParams.get('tag');
  const type = url.searchParams.get('type');

  // ── 1. Check direct KV keys (written by Auto-Pilot worker) ────────────────
  if (type === 'trending') {
    const trending = await env.ANIMEPULSE_KV.get('trending');
    if (trending) {
      return new Response(trending, {
        headers: { 'Content-Type': 'application/json', 'X-Source': 'KV-DIRECT', ...CORS },
      });
    }
  } else if (!source && !tag) {
    // If asking for generic news, check the 'news' key
    const news = await env.ANIMEPULSE_KV.get('news');
    if (news) {
      const articles = JSON.parse(news);
      const published = articles.filter((a: Record<string, any>) => !a.status || a.status === 'published');
      const result = JSON.stringify({ articles: published.slice(0, limit), total: published.length });
      return new Response(result, {
        headers: { 'Content-Type': 'application/json', 'X-Source': 'KV-DIRECT', ...CORS },
      });
    }
  }

  // ── 2. Check cache for filtered requests ──────────────────────────────────
  const cacheKey = `articles_${type || 'list'}_${source || 'all'}_${tag || 'all'}_${limit}`;
  const cached = await env.ANIMEPULSE_KV.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT', ...CORS },
    });
  }

  // ── 3. Fallback to Firestore ──────────────────────────────────────────────
  try {
    if (!env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return json({ articles: [], total: 0, warning: 'Firebase key missing' });
    }

    const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const token = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const projectId = sa.project_id;

    if (type === 'trending') {
      const docRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/meta/trending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (docRes.ok) {
        const doc = (await docRes.json()) as { fields?: Record<string, unknown> };
        const result = JSON.stringify(doc.fields ? parseDoc(doc.fields) : { anime: [], analysis: '', updatedAt: null });
        await env.ANIMEPULSE_KV.put(cacheKey, result, { expirationTtl: 1800 });
        return new Response(result, { headers: { 'Content-Type': 'application/json', ...CORS } });
      }
    }

    // Articles query
    const fetchLimit = source || tag ? 200 : limit;
    const rows = await firestoreQuery(projectId, token, 'articles', 'publishedAt', fetchLimit);
    let articles = rows
      .filter(r => r.document?.fields)
      .map(r => parseDoc(r.document!.fields));

    if (source) articles = articles.filter((a: Record<string, any>) => a.sourceType === source);
    if (tag) articles = articles.filter((a: Record<string, any>) => Array.isArray(a.tags) && (a.tags as string[]).includes(tag));
    // Hide draft and rejected articles from public feed
    articles = articles.filter((a: Record<string, any>) => !a.status || a.status === 'published');

    const result = JSON.stringify({ articles: articles.slice(0, limit), total: articles.length });
    await env.ANIMEPULSE_KV.put(cacheKey, result, { expirationTtl: 300 });
    return new Response(result, { headers: { 'Content-Type': 'application/json', ...CORS } });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });
