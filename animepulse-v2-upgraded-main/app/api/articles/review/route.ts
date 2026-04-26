/**
 * POST /api/articles/review — Admin: update article status, delete, edit
 * Requires x-review-password or Authorization header.
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import {
  getFirebaseToken, fsPatch, fsDelete, fsGet, fsSet,
  verifyAdminPassword,
} from '@/lib/firebase-rest';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-review-password, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function POST(req: NextRequest) {
  // Auth check
  const password =
    req.headers.get('x-review-password') ||
    req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson)
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500, headers: CORS });

  try {
    const sa = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const pid = sa.project_id;

    const body = await req.json() as {
      action?: string;
      id?: string;
      status?: 'published' | 'rejected' | 'draft';
      // Edit fields
      title?: string;
      content?: string;
      summary?: string;
      tags?: string[];
    };

    const { id, action = 'updateStatus', status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing article id' }, { status: 400, headers: CORS });
    }

    // ── Delete ─────────────────────────────────────────────────────────────
    if (action === 'delete') {
      await fsDelete(pid, token, `articles/${id}`);
      return NextResponse.json({ ok: true, action: 'deleted', id }, { headers: CORS });
    }

    // ── Update Status ──────────────────────────────────────────────────────
    if (action === 'updateStatus' || action === 'publish' || action === 'reject') {
      if (!status || !['published', 'rejected', 'draft'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400, headers: CORS });
      }

      // Verify article exists
      const existing = await fsGet(pid, token, `articles/${id}`);
      if (!existing) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: CORS });
      }

      await fsPatch(pid, token, `articles/${id}`, {
        status,
        reviewedAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, id, status }, { headers: CORS });
    }

    // ── Edit Article ───────────────────────────────────────────────────────
    if (action === 'edit') {
      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (body.title)   updates.title   = body.title;
      if (body.content) updates.content = body.content;
      if (body.summary) updates.summary = body.summary;
      if (body.tags)    updates.tags    = body.tags;

      await fsPatch(pid, token, `articles/${id}`, updates);
      return NextResponse.json({ ok: true, id, action: 'edited' }, { headers: CORS });
    }

    // ── Toggle AutoPilot ───────────────────────────────────────────────────
    if (action === 'toggleAutopilot') {
      const current = await fsGet(pid, token, 'meta/autopilot-config');
      const enabled = !(current?.enabled as boolean ?? true);
      await fsSet(pid, token, 'meta/autopilot-config', {
        enabled,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, autopilotEnabled: enabled }, { headers: CORS });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}
