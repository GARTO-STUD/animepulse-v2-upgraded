# AnimePulse — Cloudflare Pages Deployment Guide

## What Changed (vs Netlify/Firebase version)

| Before (Netlify) | After (Cloudflare) |
|---|---|
| `firebase-admin` SDK | Firebase REST API (edge-compatible) |
| `@netlify/functions` | Cloudflare Pages Functions (`/functions/`) |
| `netlify.toml` | `wrangler.toml` |
| `output: undefined` (SSR) | `output: 'export'` (static) |
| Node.js runtime | Edge runtime everywhere |

---

## Step 1 — Install & Login

```bash
npm install
npm install -g wrangler
wrangler login
```

---

## Step 2 — Create KV Namespace

```bash
wrangler kv:namespace create ANIMEPULSE_KV
```

Copy the `id` from the output and paste it into `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "ANIMEPULSE_KV"
id = "PASTE_YOUR_ID_HERE"
```

---

## Step 3 — Add Secrets

```bash
wrangler secret put CRON_SECRET
wrangler secret put GEMINI_API_KEY
wrangler secret put FIREBASE_SERVICE_ACCOUNT_KEY
# Paste the entire service account JSON as ONE line

# Optional Telegram
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHANNEL_ID
```

---

## Step 4 — Set Environment Variables in Cloudflare Dashboard

Pages → animepulse → Settings → Environment Variables (Production):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_APP_URL=https://animepulse.pages.dev
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-...
```

---

## Step 5 — Deploy via Git (Recommended)

```bash
git init && git add . && git commit -m "AnimePulse v8 Cloudflare"
git remote add origin https://github.com/YOUR_USERNAME/animepulse.git
git push -u origin main
```

Cloudflare Dashboard → Pages → Create project → Connect to Git
- Build command: `npm run pages:build`
- Build output directory: `.vercel/output/static`

### Or deploy directly:
```bash
npm run pages:build
wrangler pages deploy .vercel/output/static --project-name animepulse
```

---

## Step 6 — Deploy Cron Worker (Auto-Pilot)

```bash
wrangler deploy
```

This deploys `worker.ts` as a standalone Cloudflare Worker that runs every 6 hours.

---

## Trigger Auto-Pilot Manually

```bash
curl -X POST https://animepulse.pages.dev/api/autopilot \
  -H "x-cron-secret: YOUR_CRON_SECRET"

# Status check:
curl https://animepulse.pages.dev/api/autopilot
```

---

## Environment Variables Reference

| Variable | Where | Required |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | CF Pages Env Vars | Yes |
| `NEXT_PUBLIC_APP_URL` | CF Pages Env Vars | Yes |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `wrangler secret put` | Yes |
| `GEMINI_API_KEY` | `wrangler secret put` | Yes |
| `CRON_SECRET` | `wrangler secret put` | Yes |
| `TELEGRAM_BOT_TOKEN` | `wrangler secret put` | Optional |
| `TELEGRAM_CHANNEL_ID` | `wrangler secret put` | Optional |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` | CF Pages Env Vars | Optional |

---

## Troubleshooting

**"firebase-admin" build error** — Fixed. Removed from project.

**Dynamic routes 404** — Fixed. `public/_redirects` handles `/news/*` and `/anime/*`.

**"@netlify/functions" not found** — Fixed. Removed from package.json.

**API returns 500** — Check `FIREBASE_SERVICE_ACCOUNT_KEY` is set: `wrangler secret list`
