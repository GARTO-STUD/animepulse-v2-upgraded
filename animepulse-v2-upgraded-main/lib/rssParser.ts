/**
 * AnimePulse RSS Parser - Enhanced v2
 * Sources: RSS Feeds + MyAnimeList API + Reddit r/anime
 */

export interface AnimeNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  source: string;
  imageUrl?: string;
  categories?: string[];
}

const RSS_SOURCES = [
  { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/news/rss.xml' },
  { name: 'Crunchyroll News',   url: 'https://feeds.feedburner.com/crunchyroll/animenews' },
  { name: 'MyAnimeList News',   url: 'https://myanimelist.net/rss/news.rss' },
  { name: 'Otaku USA',         url: 'https://otakuusamagazine.com/feed/' },
  { name: 'AniTrendz',         url: 'https://anitrendz.net/rss' },
];

function parseRSSXML(xml: string, sourceName: string): AnimeNewsItem[] {
  const items: AnimeNewsItem[] = [];
  const itemRegex  = /<item>[\s\S]*?<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/title>/i;
  const linkRegex  = /<link>([^<]*)<\/link>/i;
  const descRegex  = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/description>/i;
  const dateRegex  = /<pubDate>([^<]*)<\/pubDate>/i;

  for (const item of (xml.match(itemRegex) || []).slice(0, 8)) {
    const title = item.match(titleRegex)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';
    const link  = item.match(linkRegex)?.[1]?.trim() || '';
    if (!title || !link) continue;
    const rawDesc = (item.match(descRegex)?.[1] || '')
      .replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim();
    items.push({
      title, link,
      description: rawDesc.length > 250 ? rawDesc.slice(0, 247) + '...' : rawDesc,
      pubDate: new Date(item.match(dateRegex)?.[1] || Date.now()),
      source: sourceName,
      categories: ['anime', 'news'],
    });
  }
  return items;
}

export async function fetchAnimeRSS(): Promise<AnimeNewsItem[]> {
  const all: AnimeNewsItem[] = [];
  await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      try {
        const res = await fetch(src.url, { headers: { 'User-Agent': 'AnimePulse-Bot/2.0' } });
        if (res.ok) all.push(...parseRSSXML(await res.text(), src.name));
      } catch { /* skip */ }
    })
  );
  return all.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime()).slice(0, 30);
}

export interface MALAnime {
  mal_id: number;
  title: string;
  synopsis: string | null;
  score: number | null;
  members: number;
  genres: { name: string }[];
  images: { jpg: { large_image_url: string } };
  status: string;
  episodes: number | null;
  rank: number | null;
}

export async function fetchMALTrending(): Promise<MALAnime[]> {
  try {
    const [airing, top] = await Promise.all([
      fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10').then(r => r.json()),
      fetch('https://api.jikan.moe/v4/top/anime?limit=10').then(r => r.json()),
    ]);
    const merged = [...(airing.data || []), ...(top.data || [])];
    const seen = new Set<number>();
    return merged.filter((a: MALAnime) => seen.has(a.mal_id) ? false : (seen.add(a.mal_id), true)).slice(0, 30);
  } catch { return []; }
}

export async function fetchMALNewsAsItems(): Promise<AnimeNewsItem[]> {
  try {
    const res = await fetch('https://api.jikan.moe/v4/news?limit=10');
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((item: {
      title: string; url: string; excerpt: string; date: string;
      images?: { jpg?: { image_url: string } };
    }) => ({
      title: item.title,
      link: item.url,
      description: item.excerpt?.replace(/<[^>]*>/g, '').slice(0, 250) || '',
      pubDate: new Date(item.date),
      source: 'MyAnimeList',
      imageUrl: item.images?.jpg?.image_url,
      categories: ['anime', 'news', 'mal'],
    }));
  } catch { return []; }
}

export interface RedditPost {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  source: string;
  upvotes: number;
  imageUrl?: string;
  categories: string[];
}

export async function fetchRedditAnime(): Promise<RedditPost[]> {
  try {
    const [hot, rising] = await Promise.all([
      fetch('https://www.reddit.com/r/anime/hot.json?limit=10', {
        headers: { 'User-Agent': 'AnimePulse-Bot/2.0' },
      }).then(r => r.json()),
      fetch('https://www.reddit.com/r/anime/rising.json?limit=5', {
        headers: { 'User-Agent': 'AnimePulse-Bot/2.0' },
      }).then(r => r.json()),
    ]);
    const posts = [...(hot?.data?.children || []), ...(rising?.data?.children || [])];
    return posts
      .map((p: { data: {
        title: string; permalink: string; selftext: string; created_utc: number;
        score: number; preview?: { images?: { source?: { url?: string } }[] };
        link_flair_text?: string;
      } }) => ({
        title: p.data.title,
        link: `https://reddit.com${p.data.permalink}`,
        description: p.data.selftext?.slice(0, 250) || p.data.title,
        pubDate: new Date(p.data.created_utc * 1000),
        source: 'Reddit r/anime',
        upvotes: p.data.score,
        imageUrl: p.data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&'),
        categories: ['anime', 'reddit', p.data.link_flair_text || 'discussion'].filter(Boolean),
      }))
      .filter(p => p.upvotes > 100)
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 10);
  } catch { return []; }
}

export async function fetchAllSources() {
  const [rss, mal, reddit, trending] = await Promise.all([
    fetchAnimeRSS(),
    fetchMALNewsAsItems(),
    fetchRedditAnime(),
    fetchMALTrending(),
  ]);
  return { rss, mal, reddit, trending };
}

export function getSampleAnimeNews(): AnimeNewsItem[] {
  return [
    {
      title: 'Solo Leveling Season 2 Confirmed for 2025',
      link: 'https://example.com/solo-leveling-s2',
      description: 'A-1 Pictures officially confirms the second season of the smash-hit Solo Leveling.',
      pubDate: new Date(),
      source: 'Sample',
      categories: ['anime', 'announcement'],
    },
  ];
}
