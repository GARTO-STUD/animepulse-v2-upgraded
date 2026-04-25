/**
 * lib/scoring.ts
 * Smart News Scoring System for AnimePulse AutoPilot.
 *
 * Each article gets scored 0–100 based on:
 *  - Source credibility (who published it)
 *  - Recency (how fresh it is)
 *  - Keywords (episode, season, trailer = high signal)
 *  - Title quality (length, clarity)
 *
 * Only articles scoring >= PUBLISH_THRESHOLD are published automatically.
 */

export const PUBLISH_THRESHOLD = 55;
export const MAX_DAILY_ARTICLES = 5;

export interface ScoreBreakdown {
  sourceCredibility: number; // 0–30
  recency: number;           // 0–25
  keywords: number;          // 0–30
  titleQuality: number;      // 0–15
  total: number;             // 0–100
}

// Source credibility weights — higher = more trusted
const SOURCE_WEIGHTS: Record<string, number> = {
  'Anime News Network': 30,
  'Crunchyroll News':   28,
  'MyAnimeList News':   25,
  'Otaku USA':          22,
  'Anime Corner':       20,
  'Anime Trending':     18,
  // Default for unknown sources
  'default':            15,
};

// High-value keywords that signal important news
const HIGH_VALUE_KEYWORDS = [
  'season', 'release date', 'premiere', 'announcement',
  'trailer', 'pv', 'teaser', 'episode', 'finale', 'confirmed',
  'movie', 'film', 'sequel', 'prequel', 'new anime',
  'adaptation', 'manga', 'light novel', 'renewal', 'cancelled',
  'streaming', 'crunchyroll', 'netflix', 'disney+',
];

// Medium-value keywords
const MEDIUM_VALUE_KEYWORDS = [
  'update', 'news', 'reveals', 'announced', 'debuts',
  'preview', 'visual', 'cast', 'staff', 'director',
  'studio', 'character', 'review', 'rating',
];

// Low-value / spam-like terms that reduce score
const SPAM_KEYWORDS = [
  'click here', 'buy now', 'limited time', 'discount',
  'sponsored', 'advertisement', 'poll', 'quiz',
];

/**
 * Score an article candidate before publishing.
 */
export function scoreArticle(params: {
  title: string;
  description: string;
  source: string;
  publishedAt?: string;
}): ScoreBreakdown {
  const { title, description, source, publishedAt } = params;
  const text = `${title} ${description}`.toLowerCase();

  // 1. Source credibility (0–30)
  const sourceCredibility = SOURCE_WEIGHTS[source] ?? SOURCE_WEIGHTS['default'];

  // 2. Recency (0–25) — articles older than 48 hrs score 0
  let recency = 0;
  if (publishedAt) {
    const ageHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours <= 6)  recency = 25;
    else if (ageHours <= 12) recency = 22;
    else if (ageHours <= 24) recency = 18;
    else if (ageHours <= 48) recency = 12;
    else recency = 4;
  } else {
    recency = 15; // No date = assume recent-ish
  }

  // 3. Keywords (0–30)
  let keywordScore = 0;
  let highHits = 0;
  let medHits = 0;

  for (const kw of HIGH_VALUE_KEYWORDS) {
    if (text.includes(kw)) highHits++;
  }
  for (const kw of MEDIUM_VALUE_KEYWORDS) {
    if (text.includes(kw)) medHits++;
  }
  for (const kw of SPAM_KEYWORDS) {
    if (text.includes(kw)) keywordScore -= 10;
  }

  keywordScore += Math.min(highHits * 8, 24);
  keywordScore += Math.min(medHits * 3, 12);
  keywordScore = Math.max(0, Math.min(30, keywordScore));

  // 4. Title quality (0–15)
  let titleQuality = 0;
  const titleLen = title.trim().length;
  if (titleLen >= 30 && titleLen <= 100) titleQuality += 8;
  else if (titleLen >= 15) titleQuality += 4;

  // Title starts with article name (high signal)
  if (/^[A-Z"']/.test(title)) titleQuality += 4;

  // Has a colon or dash (structured title)
  if (title.includes(':') || title.includes(' — ')) titleQuality += 3;

  titleQuality = Math.min(15, titleQuality);

  const total = Math.min(100, sourceCredibility + recency + keywordScore + titleQuality);

  return { sourceCredibility, recency, keywords: keywordScore, titleQuality, total };
}

/**
 * Generate a simple hash from a title for deduplication.
 * Normalises title (lowercase, strip punctuation, collapse spaces).
 */
export function titleHash(title: string): string {
  const normalised = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Simple FNV-like hash
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalised.length; i++) {
    hash ^= normalised.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16);
}

/**
 * Check similarity between two titles using Jaccard similarity on word sets.
 * Returns true if articles are too similar (>= 60% word overlap).
 */
export function areTitlesSimilar(a: string, b: string): boolean {
  const words = (s: string) =>
    new Set(
      s.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
    );
  const wa = words(a);
  const wb = words(b);
  const intersection = [...wa].filter(w => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  if (union === 0) return false;
  return intersection / union >= 0.6;
}

/**
 * Filter new RSS items against existing articles.
 * Removes duplicates by URL, titleHash, and title similarity.
 */
export function deduplicateArticles(
  candidates: { title: string; link: string }[],
  existing: { url?: unknown; titleHash?: unknown; title?: unknown }[]
): typeof candidates {
  const existingUrls = new Set(existing.map(a => a.url as string));
  const existingHashes = new Set(existing.map(a => a.titleHash as string).filter(Boolean));
  const existingTitles = existing.map(a => a.title as string).filter(Boolean);

  return candidates.filter(c => {
    // URL exact match
    if (existingUrls.has(c.link)) return false;

    // Hash match (normalised title)
    const hash = titleHash(c.title);
    if (existingHashes.has(hash)) return false;

    // Similarity check against recent 50 titles
    const recent = existingTitles.slice(0, 50);
    if (recent.some(t => areTitlesSimilar(c.title, t))) return false;

    return true;
  });
}
