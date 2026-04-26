/**
 * lib/firebase-rest.ts
 * Edge-runtime Firebase REST API utilities (no firebase-admin needed).
 * Used by all server-side API routes on Cloudflare Pages edge runtime.
 */

export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  editorialNote: string;
  verdict: string;
  source: string;
  sourceType: 'rss' | 'mal' | 'reddit';
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  tags: string[];
  readTime: number;
  status: 'draft' | 'published' | 'rejected';
  qualityScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  titleHash?: string;
  views?: number;
}

export interface ScoreBreakdown {
  sourceCredibility: number;
  recency: number;
  keywords: number;
  titleQuality: number;
  total: number;
}

// ─── JWT / Token ──────────────────────────────────────────────────────────────

export async function getFirebaseToken(saJson: string): Promise<string> {
  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);
  const b64 = (s: string) =>
    btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64(
    JSON.stringify({
      iss: sa.client_email, sub: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now, exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/datastore',
    })
  );
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const key = await crypto.subtle.importKey(
    'pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = b64(
    String.fromCharCode(
      ...new Uint8Array(
        await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${h}.${p}`)) as ArrayBuffer
      )
    )
  );
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${h}.${p}.${sig}`,
  });
  return ((await res.json()) as { access_token: string }).access_token;
}

// ─── Firestore value serializers ──────────────────────────────────────────────

export function fsVal(v: unknown): unknown {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if ('stringValue' in o)  return o.stringValue;
  if ('integerValue' in o) return Number(o.integerValue);
  if ('doubleValue' in o)  return o.doubleValue;
  if ('booleanValue' in o) return o.booleanValue;
  if ('nullValue' in o)    return null;
  if ('arrayValue' in o)   return ((o.arrayValue as { values?: unknown[] }).values || []).map(fsVal);
  if ('mapValue' in o) {
    const f = (o.mapValue as { fields?: Record<string, unknown> }).fields || {};
    return Object.fromEntries(Object.entries(f).map(([k, x]) => [k, fsVal(x)]));
  }
  return null;
}

export function toFsVal(v: unknown): unknown {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string')  return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number')
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsVal) } };
  if (typeof v === 'object')
    return { mapValue: { fields: Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, toFsVal(x)])) } };
  return { stringValue: String(v) };
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

export async function fsGet(
  projectId: string, token: string, path: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const d = await res.json() as { fields?: Record<string, unknown> };
  if (!d.fields) return null;
  return Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fsVal(v)]));
}

export async function fsSet(
  projectId: string, token: string, path: string, data: Record<string, unknown>
) {
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, toFsVal(v)])) }),
    }
  );
}

export async function fsPatch(
  projectId: string, token: string, docPath: string, fields: Record<string, unknown>
) {
  const mask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}?${mask}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, toFsVal(v)])) }),
    }
  );
}

export async function fsDelete(projectId: string, token: string, path: string) {
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function fsQuery(
  projectId: string, token: string, collection: string, limitN: number
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collection }],
          orderBy: [{ field: { fieldPath: 'publishedAt' }, direction: 'DESCENDING' }],
          limit: limitN,
        },
      }),
    }
  );
  const rows = await res.json() as Array<{ document?: { fields: Record<string, unknown> } }>;
  return rows
    .filter(r => r.document?.fields)
    .map(r => Object.fromEntries(Object.entries(r.document!.fields).map(([k, v]) => [k, fsVal(v)])));
}

export async function fsBatchWrite(
  projectId: string, token: string, collection: string, docs: Record<string, unknown>[]
) {
  const writes = docs.map(d => ({
    update: {
      name: `projects/${projectId}/databases/(default)/documents/${collection}/${d.id}`,
      fields: Object.fromEntries(Object.entries(d).map(([k, v]) => [k, toFsVal(v)])),
    },
  }));
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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function verifyAdminPassword(provided: string | null | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_REVIEW_PASSWORD || 'animepulse-admin';
  return provided === expected;
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
