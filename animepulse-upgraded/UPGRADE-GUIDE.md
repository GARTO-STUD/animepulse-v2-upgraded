# AnimePulse v2.0 — Upgrade Guide

## What's New

### 1. Smart AutoPilot System
The autopilot is now intelligent, not random.

**How it works:**
- Fetches RSS from 4 premium anime news sources
- Scores each article 0–100 across 4 dimensions:
  - **Source credibility** (0–30): ANN = 30, Crunchyroll = 28, MAL = 25...
  - **Recency** (0–25): < 6h = 25, < 12h = 22, < 24h = 18...
  - **Keywords** (0–30): "season 2", "trailer", "confirmed", "premiere" = high score
  - **Title quality** (0–15): length, structure, capitalisation
- Only articles scoring **≥ 55** get processed (change `PUBLISH_THRESHOLD` in `lib/scoring.ts`)
- Saves as **draft** first — you approve in the admin dashboard
- **Max 5 articles/day** by default (change `MAX_DAILY_ARTICLES`)

**Deduplication:**
- URL exact match (instant reject)
- Title hash (normalised lowercase)
- Jaccard similarity ≥ 60% word overlap = rejected

### 2. Admin Dashboard (`/admin`)
Full editorial control at `/admin`.

- **Login**: password from `ADMIN_PASSWORD` env var
- **Review queue**: all drafts waiting for approval
- **One-click publish/reject** per article
- **Inline edit**: title, summary, tags
- **Delete** articles permanently
- **AutoPilot toggle**: pause/resume automated publishing
- **Run AutoPilot manually**: trigger fetch + generate cycle
- **Score breakdown**: see why each article scored what it did

**Hidden admin access**: Triple-click the AnimePulse logo to navigate to `/admin`

### 3. SEO Optimisation
- Dynamic `<title>` + `<description>` per article (via `generateMetadata`)
- OpenGraph + Twitter Card per article
- **JSON-LD Article schema** on every article page
- **sitemap.xml** auto-generated from all published articles
- **robots.txt** blocks `/admin` and `/api/` from crawlers
- Canonical URLs on every page

### 4. Article Quality
Every AI-generated article now follows this structure:
1. **What Happened** — striking lead, not background
2. **Why Anime Fans Should Care** — real stakes
3. **Key Highlights** — 3–5 bullet points
4. **AnimePulse Take 🔥** — opinionated editorial stance
5. **What Comes Next** — next steps for fans

Plus: `verdict`, `editorialNote` (280-char hot take), `summary` (SEO text), `tags`

### 5. Monetisation-Ready
- `AdBanner` component in `components/AdBanner.tsx`
- Place `<AdBanner format="horizontal" />` anywhere
- Formats: `horizontal` (728×90), `rectangle` (300×250), `vertical` (160×600)
- Set `NEXT_PUBLIC_ADSENSE_CLIENT` env var to activate real ads
- `AffiliateLink` component for in-article affiliate links

### 6. New Pages
- `/search` — full-text search across all articles
- `/admin` — admin dashboard
- `/news/[id]` — upgraded article detail with related articles, share buttons, JSON-LD

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY=...    # Required
GROQ_API_KEY=gsk_...                # Required for AI generation
GEMINI_API_KEY=AIza...              # Optional (fallback)
ADMIN_PASSWORD=your-password        # Required for /admin
NEXT_PUBLIC_REVIEW_PASSWORD=...     # Same as ADMIN_PASSWORD
CRON_SECRET=...                     # For scheduled autopilot
NEXT_PUBLIC_APP_URL=https://...     # Your domain
```

---

## AutoPilot Tuning

Edit `lib/scoring.ts` to tune the scoring system:

```ts
export const PUBLISH_THRESHOLD = 55;  // Minimum score to process (0–100)
export const MAX_DAILY_ARTICLES = 5;  // Max articles per day

// Source credibility weights (0–30):
const SOURCE_WEIGHTS = {
  'Anime News Network': 30,
  'Crunchyroll News':   28,
  // Add your sources here
};

// High-value keywords (8 pts each, max 24):
const HIGH_VALUE_KEYWORDS = ['season', 'trailer', 'premiere', ...];
```

To make articles **auto-publish** instead of going to draft, change in `app/api/autopilot/route.ts`:
```ts
status: 'published',  // was: 'draft'
```

---

## Setting Up Scheduled AutoPilot

### Cloudflare Workers Cron (recommended for Cloudflare Pages)
In `wrangler.toml`:
```toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

### Vercel Cron
In `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/autopilot",
    "schedule": "0 */6 * * *"
  }]
}
```

Include the cron secret in the request header:
```
x-cron-secret: your-cron-secret
```

---

## New File Structure

```
lib/
  firebase-rest.ts      # Edge-runtime Firebase REST helpers
  scoring.ts            # News scoring + deduplication system
  articleGenerator.ts   # AI article generation (Groq + Gemini)

app/
  admin/
    page.tsx            # Admin dashboard
  api/
    articles/
      route.ts          # Enhanced: pagination, filtering, caching
      [id]/route.ts     # Single article + view counter
      review/route.ts   # Admin: update/delete/edit/toggle
    autopilot/
      route.ts          # Smart AutoPilot v2
  news/
    page.tsx            # Enhanced: pagination, tags, featured section
    [id]/
      page.tsx          # SEO metadata + JSON-LD
      NewsDetailClient.tsx  # Article reader UI
  search/
    page.tsx            # Full-text search
  sitemap.ts            # Dynamic sitemap
  robots.ts             # robots.txt

components/
  ArticleCard.tsx       # Reusable card: default/featured/compact/horizontal
  Pagination.tsx        # Reusable pagination
  AdBanner.tsx          # AdSense-ready ad placeholders + AffiliateLink
  Header.tsx            # Upgraded with search + admin link
```
