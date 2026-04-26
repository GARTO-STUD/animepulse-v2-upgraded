/** * Cloudflare Worker for AnimePulse Auto-Pilot */
export interface Env {
  ANIMEPULSE_KV: KVNamespace;
  CRON_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHANNEL_ID: string;
  GEMINI_API_KEY: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  tags: string[];
  postedToTelegram: boolean;
  editorialNote?: string;
  verdict?: string;
  status?: 'draft' | 'published' | 'rejected';
  qualityScore?: number;
}

// RSS Sources
const RSS_SOURCES = [
  { name: 'Crunchyroll News', url: 'https://feeds.feedburner.com/crunchyroll/animenews', category: 'News' },
  { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/news/rss.xml', category: 'News' },
  { name: 'MyAnimeList News', url: 'https://myanimelist.net/rss/news.xml', category: 'News' },
  { name: 'Otaku USA', url: 'https://otakuusamagazine.com/feed/', category: 'News' },
  { name: 'Anime UK News', url: 'https://animeuknews.net/feed/', category: 'News' },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    const secret = url.searchParams.get('secret');

    // PUBLIC endpoint - no auth required (for website)
    if (url.pathname === '/news') {
      const news = await getStoredNews(env);
      return jsonResponse({ news, total: news.length });
    }

    // PUBLIC endpoint - trending anime
    if (url.pathname === '/trending') {
      const stored = await env.ANIMEPULSE_KV.get('trending');
      if (stored) return jsonResponse(JSON.parse(stored));
      const anime = await fetchTrendingAnime();
      return jsonResponse({ anime, updatedAt: new Date().toISOString() });
    }

    // Health check endpoint
    if (url.pathname === '/') {
      return jsonResponse({ message: 'AnimePulse Worker Running', version: '1.0.0' });
    }

    // PROTECTED endpoints - require secret
    if (secret !== env.CRON_SECRET) {
      return jsonResponse({ error: 'Unauthorized - valid secret required' }, 401);
    }

    if (url.pathname === '/auto-pilot') {
      const result = await runAutoPilot(env);
      return jsonResponse(result);
    }

    if (url.pathname === '/fetch-rss') {
      const result = await fetchAllRSS();
      return jsonResponse(result);
    }

    return jsonResponse({ error: 'Not Found' }, 404);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runAutoPilot(env).catch(console.error));
  },
};

async function runAutoPilot(env: Env) {
  const results = {
    newsFetched: 0,
    articlesGenerated: 0,
    skippedDuplicate: 0,
    skippedLowQuality: 0,
    telegramPosted: 0,
  };

  try {
    const rssItems = await fetchAllRSS();
    results.newsFetched = rssItems.length;
    if (rssItems.length === 0) return { success: true, message: 'No RSS items', ...results };

    const existingNews = await getStoredNews(env);

    // ── Deduplication: exact URL + fuzzy title fingerprint ─────────────────
    const existingUrls  = new Set(existingNews.map(n => n.url));
    const existingFingerprints = new Set(
      existingNews.map(n => n.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40))
    );

    // ── Scoring: rank items by importance before processing ────────────────
    const HIGH_VALUE_KEYWORDS = [
      'season 2','season 3','confirmed','announced','release date','trailer',
      'renewal','cancelled','adaptation','studio','premiere','exclusive',
      'award','record','million','top','ranked','official','new anime',
    ];
    const LOW_VALUE_KEYWORDS = ['rumor','leak','fan theory','reddit','meme','clickbait'];

    function scoreItem(item: { title: string; description: string; source: string }): number {
      const text = (item.title + ' ' + item.description).toLowerCase();
      let score = 50; // base score
      for (const kw of HIGH_VALUE_KEYWORDS) if (text.includes(kw)) score += 15;
      for (const kw of LOW_VALUE_KEYWORDS) if (text.includes(kw)) score -= 20;
      if (item.title.length < 15) score -= 10; // too short = low quality
      if (item.title.length > 120) score -= 5; // too long = likely spam
      if (item.source === 'Anime News Network') score += 10; // trusted source bonus
      if (item.source === 'Crunchyroll News') score += 8;
      return score;
    }

    // Filter & rank — only process items scoring >= 40
    const candidates = rssItems
      .filter(item => {
        const url_fp = item.link;
        const title_fp = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
        if (existingUrls.has(url_fp) || existingFingerprints.has(title_fp)) {
          (results as any).skippedDuplicate++;
          return false;
        }
        const score = scoreItem(item);
        if (score < 40) {
          (results as any).skippedLowQuality++;
          return false;
        }
        return true;
      })
      .map(item => ({ ...item, score: scoreItem(item) }))
      .sort((a, b) => b.score - a.score) // highest score first
      .slice(0, 5); // max 5 per run

    let newItemsCount = 0;
    for (const item of candidates) {
      const article = await generateArticle(item, env);
      const newsItem: NewsItem = {
        id: generateId(),
        title: article.title,
        content: article.content,
        summary: article.summary,
        source: item.source,
        url: item.link,
        imageUrl: item.imageUrl,
        publishedAt: new Date().toISOString(),
        tags: article.tags,
        postedToTelegram: false,
        editorialNote: article.editorialNote || '',
        verdict: article.verdict || '',
        status: 'draft',
        qualityScore: item.score,
      };

      existingNews.unshift(newsItem);
      newItemsCount++;
      results.articlesGenerated++;

      if (env.TELEGRAM_BOT_TOKEN && newItemsCount <= 2 && item.score >= 70) {
        const posted = await postToTelegram(newsItem, env);
        if (posted) results.telegramPosted++;
      }
    }

    await env.ANIMEPULSE_KV.put('news', JSON.stringify(existingNews.slice(0, 100)));

    const trending = await fetchTrendingAnime();
    await env.ANIMEPULSE_KV.put('trending', JSON.stringify({ updatedAt: new Date().toISOString(), anime: trending }));

    if (env.TELEGRAM_BOT_TOKEN) {
      const lastTrending = await env.ANIMEPULSE_KV.get('last_trending_post');
      const now = Date.now();
      if (!lastTrending || now - parseInt(lastTrending) > 23 * 60 * 60 * 1000) {
        await postTrendingToTelegram(trending, env);
        await env.ANIMEPULSE_KV.put('last_trending_post', String(now));
      }
    }

    return {
      success: true,
      message: `Fetched ${rssItems.length} items → scored → added ${newItemsCount} quality articles`,
      ...results,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return { success: false, error: String(error), ...results };
  }
}

// Fetch RSS from all sources
async function fetchAllRSS(): Promise<Array<{title: string, description: string, link: string, source: string, imageUrl?: string}>> {
  const allNews: Array<{title: string, description: string, link: string, source: string, imageUrl?: string}> = [];
  
  for (const source of RSS_SOURCES) {
    try {
      console.log(`📡 Fetching from ${source.name}...`);
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'AnimePulse Bot/1.0' },
      });
      
      if (!response.ok) {
        console.warn(`⚠️ ${source.name} returned ${response.status}`);
        continue;
      }
      
      const xml = await response.text();
      const items = parseRSSXML(xml, source.name);
      
      for (const item of items.slice(0, 3)) {
        allNews.push({
          title: item.title,
          description: item.description,
          link: item.link,
          source: source.name,
          imageUrl: item.imageUrl,
        });
      }
    } catch (error) {
      console.error(`❌ Failed to fetch from ${source.name}:`, error);
    }
  }
  
  // Sort by date (newest first) and return unique items
  return allNews.slice(0, 10);
}

// Parse RSS XML with image extraction
function parseRSSXML(xml: string, sourceName: string) {
  const items: Array<{title: string, link: string, description: string, pubDate: Date, imageUrl?: string}> = [];
  
  // Extract items
  const itemRegex = /<item>[\s\S]*?<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/title>/i;
  const linkRegex = /<link>([^<]*)<\/link>/i;
  const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/description>/i;
  const dateRegex = /<pubDate>([^<]*)<\/pubDate>/i;
  
  // Image patterns in RSS
  const mediaThumbnailRegex = /<media:thumbnail[^>]+url="([^"]+)"/i;
  const mediaContentRegex = /<media:content[^>]+url="([^"]+)"[^>]*>.*?<\/media:content>/is;
  const imgSrcRegex = /<img[^>]+src="([^"]+)[^>]*>/i;
  const enclosureRegex = /<enclosure[^>]+url="([^"]+)"[^>]*type="image[^"]*"/i;
  
  const matches = xml.match(itemRegex) || [];
  
  for (const item of matches.slice(0, 5)) {
    const title = item.match(titleRegex)?.[1]?.trim() || '';
    const link = item.match(linkRegex)?.[1]?.trim() || '';
    const description = item.match(descRegex)?.[1]?.trim() || '';
    const dateStr = item.match(dateRegex)?.[1]?.trim() || '';
    
    // Extract image from various RSS formats
    let imageUrl: string | undefined;
    
    // Try media:thumbnail first
    const mediaMatch = item.match(mediaThumbnailRegex);
    if (mediaMatch) imageUrl = mediaMatch[1];
    
    // Try media:content
    if (!imageUrl) {
      const contentMatch = item.match(mediaContentRegex);
      if (contentMatch) imageUrl = contentMatch[1];
    }
    
    // Try enclosure
    if (!imageUrl) {
      const enclosureMatch = item.match(enclosureRegex);
      if (enclosureMatch) imageUrl = enclosureMatch[1];
    }
    
    // Try img tag in description
    if (!imageUrl) {
      const imgMatch = description.match(imgSrcRegex);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    
    if (title && link) {
      // Clean up CDATA and HTML
      const cleanTitle = title.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
      const cleanDesc = description
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '')
        .replace(/<[^>]*>/g, '')
        .substring(0, 250) + '...';
      
      items.push({
        title: cleanTitle,
        link,
        description: cleanDesc,
        pubDate: dateStr ? new Date(dateStr) : new Date(),
        imageUrl,
      });
    }
  }
  
  return items;
}

async function getStoredNews(env: Env): Promise<NewsItem[]> {
  const stored = await env.ANIMEPULSE_KV.get('news');
  return stored ? JSON.parse(stored) : [];
}

async function generateArticle(
  item: { title: string; description: string },
  env: Env
) {
  if (!env.GEMINI_API_KEY) {
    return { title: item.title, content: `# ${item.title}\n\n${item.description}`, summary: item.description, tags: ['anime', 'news'], editorialNote: '', verdict: '' };
  }

  const prompt = `You are Alex Chen, lead editor at AnimePulse — an anime news site known for sharp opinions, deep analysis, and a conversational tone that feels like a knowledgeable friend talking to you, not a robot summarizing headlines.

AnimePulse Voice Rules:
- Write like you CARE about this story — excitement, frustration, hype are all valid
- Use contractions (we're, it's, don't) — never sound formal or stiff  
- Reference the anime community ("fans are losing it", "the fandom exploded")
- Include a surprising or counterintuitive observation per article
- NEVER start sentences with "In conclusion", "It is worth noting", or "This article"
- Short punchy sentences mixed with longer analytical ones

Title: ${item.title}
Description: ${item.description}

Write in Markdown with these EXACT sections:

## What Happened
(2-3 paragraphs — factual but vivid. Open with the most striking detail, not background.)

## Why Anime Fans Should Care
(1-2 paragraphs — real context and stakes. What does this mean for the fandom? Be specific.)

## AnimePulse Take 🔥
(1 paragraph — this is YOUR opinion as lead editor. First person "I think...", "Honestly...", "Here's the thing...". Take a clear stance. Be bold. Disagree with the consensus if you believe it.)

## Community Pulse
(2-3 bullet points — realistic fan reactions. Mix hype, skepticism, and humor.)

## What Comes Next
(1 short paragraph — concrete next steps or things to watch for.)

---EDITORIAL_NOTE---
(One tweet-length hot take. Max 280 chars. Be spicy, funny, or provocative.)
---VERDICT---
(Pick ONE: 🔥 Must Watch | ⭐ Looks Promising | 😐 Wait and See | ❌ Skip It — then 1 punchy sentence why.)
---SUMMARY---
(2-3 clean sentences optimized for Google. Include the anime name and key details.)
---TAGS---
(6-8 tags: anime titles, studio, genre, season year, relevant topics — comma separated)`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 3000 },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const [contentRaw, rest1]   = text.split('---EDITORIAL_NOTE---');
    const [editorialNote, rest2] = (rest1 || '').split('---VERDICT---');
    const [verdict, rest3]       = (rest2 || '').split('---SUMMARY---');
    const [summary, tagsStr]     = (rest3 || '').split('---TAGS---');

    return {
      title: item.title,
      content: contentRaw?.trim() || `# ${item.title}`,
      editorialNote: editorialNote?.trim() || '',
      verdict: verdict?.trim() || '',
      summary: summary?.trim() || item.description,
      tags: tagsStr?.split(',').map((t: string) => t.trim()).filter((t: string) => t) || ['anime', 'news'],
    };
  } catch {
    return { title: item.title, content: `# ${item.title}\n\n${item.description}`, summary: item.description, tags: ['anime', 'news'], editorialNote: '', verdict: '' };
  }
}

async function postToTelegram(newsItem: NewsItem, env: Env): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN) return false;

  const message = `🎌 **${newsItem.title}**\n\n${newsItem.summary}\n\n🔗 ${newsItem.url}\n\n📢 @AnimePulseChannel`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHANNEL_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const data = await response.json();
    return data.ok;
  } catch {
    return false;
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Fetch real trending anime from Jikan API (MyAnimeList)
async function fetchTrendingAnime(): Promise<any[]> {
  try {
    const response = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10');
    if (!response.ok) throw new Error('Jikan API error');
    const data: any = await response.json();
    return (data.data || []).slice(0, 10);
  } catch {
    console.warn('⚠️ Jikan API failed, returning empty');
    return [];
  }
}

// Post trending list to Telegram
async function postTrendingToTelegram(trendingAnime: any[], env: Env): Promise<void> {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  let message = `📈 **Trending Anime - ${today}**\n\n`;
  trendingAnime.forEach((anime, i) => { message += `${i + 1}. ${anime.title}\n`; });
  message += `\n🔥 What are you watching?\n📢 @AnimePulseChannel`;

  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHANNEL_ID, text: message, parse_mode: 'Markdown' }),
  });
}

// CORS headers for cross-origin requests
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}