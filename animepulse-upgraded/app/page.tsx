'use client';

/**
 * app/page.tsx — AnimePulse Homepage
 * 
 * Sections:
 *  1. Hero — latest featured article + trending anime background
 *  2. Breaking News — 3 latest articles in horizontal cards
 *  3. Trending Now — top airing anime from Jikan
 *  4. Editor's Picks — manually scored top articles
 *  5. Latest News grid — full article grid with sidebar ad
 *  6. Top Anime sidebar cards
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Flame, TrendingUp, Star, Newspaper,
  ChevronRight, Zap, Clock,
} from 'lucide-react';
import ArticleCard, { type ArticleCardData } from '@/components/ArticleCard';
import AdBanner from '@/components/AdBanner';

interface Anime {
  mal_id: number;
  title: string;
  score: number | null;
  images: { jpg: { large_image_url: string; image_url: string } };
  genres?: { name: string }[];
}

function SectionHeader({
  icon: Icon,
  title,
  href,
  accentColor = 'text-[#e85d04]',
}: {
  icon: React.ElementType;
  title: string;
  href?: string;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-current/10 border border-current/20 flex items-center justify-center ${accentColor}`}
          style={{ backgroundColor: 'currentColor', opacity: 1 }}>
          <div className="w-8 h-8 rounded-lg bg-[#e85d04]/10 border border-[#e85d04]/20 flex items-center justify-center">
            <Icon className={`w-4 h-4 ${accentColor}`} />
          </div>
        </div>
        <h2
          className="text-white font-black text-xl"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className={`flex items-center gap-1 text-sm font-medium ${accentColor} hover:opacity-80 transition-opacity`}
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const [trending,  setTrending]  = useState<Anime[]>([]);
  const [articles,  setArticles]  = useState<ArticleCardData[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [animeRes, articlesRes] = await Promise.all([
          fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=6').catch(() => null),
          fetch('/api/articles?limit=16&status=published'),
        ]);
        if (animeRes?.ok) {
          const d = await animeRes.json();
          setTrending(d.data || []);
        }
        const articlesData = await articlesRes.json();
        setArticles(articlesData.articles || []);
      } catch { /**/ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const heroArticle   = articles[0];
  const breakingNews  = articles.slice(1, 4);
  const editorPicks   = articles.filter(a => (a.qualityScore || 0) >= 70).slice(0, 3);
  const latestArticles = articles.slice(4, 13);

  return (
    <div className="min-h-screen bg-[#080b14]">

      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[500px] sm:min-h-[600px] flex items-end">
        {/* Background — trending anime image */}
        {trending[0] && (
          <div className="absolute inset-0">
            <Image
              src={trending[0].images.jpg.large_image_url}
              alt={trending[0].title}
              fill
              className="object-cover object-top opacity-20"
              priority
              unoptimized
            />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080b14] via-[#080b14]/50 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-20 w-full">
          <div className="max-w-2xl">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e85d04]/10 border border-[#e85d04]/20 mb-5">
              <span className="w-2 h-2 rounded-full bg-[#e85d04] animate-pulse" />
              <span className="text-xs font-bold text-[#e85d04] uppercase tracking-wide">
                Breaking Anime News
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-10 bg-[#1a2235] rounded-xl w-3/4 animate-pulse" />
                <div className="h-5 bg-[#1a2235] rounded-xl w-full animate-pulse" />
                <div className="h-5 bg-[#1a2235] rounded-xl w-2/3 animate-pulse" />
              </div>
            ) : heroArticle ? (
              <>
                {heroArticle.verdict && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e85d04]/15 border border-[#e85d04]/25 text-[#e85d04] text-sm font-bold mb-3">
                    <Flame className="w-3.5 h-3.5" />
                    {heroArticle.verdict}
                  </div>
                )}
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4"
                  style={{ fontFamily: 'var(--font-syne)' }}
                >
                  {heroArticle.title}
                </h1>
                <p className="text-[#c8d0de] text-lg leading-relaxed mb-6 line-clamp-2">
                  {heroArticle.summary}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/news/${heroArticle.id}`}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e85d04] to-[#f48c06] hover:opacity-90 text-white font-bold rounded-xl transition-opacity shadow-lg shadow-orange-500/20"
                  >
                    Read Story <ChevronRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/news"
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors"
                  >
                    All News
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-syne)' }}>
                  Your Pulse on<br />
                  <span className="text-[#e85d04]">Anime News</span>
                </h1>
                <p className="text-[#c8d0de] text-lg mb-6">
                  AI-curated anime news, trending shows, and editorial analysis — daily.
                </p>
                <Link href="/news" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e85d04] to-[#f48c06] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20">
                  Read News <ChevronRight className="w-5 h-5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

        {/* ── BREAKING NEWS ─────────────────────────────────────────────── */}
        {breakingNews.length > 0 && (
          <section>
            <SectionHeader icon={Zap} title="Breaking News" href="/news" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {breakingNews.map(a => (
                <ArticleCard key={a.id} article={a} variant="horizontal" />
              ))}
            </div>
          </section>
        )}

        {/* ── TOP AD ────────────────────────────────────────────────────── */}
        <AdBanner format="horizontal" />

        {/* ── TRENDING ANIME ────────────────────────────────────────────── */}
        {trending.length > 0 && (
          <section>
            <SectionHeader icon={TrendingUp} title="Trending Now" href="/trending" accentColor="text-purple-400" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {trending.slice(0, 6).map((anime, i) => (
                <div
                  key={anime.mal_id}
                  className="group relative rounded-2xl overflow-hidden bg-[#0d1117] border border-[#1a2235] hover:border-purple-500/30 transition-all"
                >
                  <div className="relative h-44">
                    <Image
                      src={anime.images.jpg.large_image_url}
                      alt={anime.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] to-transparent" />
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#e85d04] flex items-center justify-center text-white text-xs font-black">
                      {i + 1}
                    </div>
                    {anime.score && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-xs font-bold">{anime.score}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs font-bold line-clamp-2 leading-snug">
                      {anime.title}
                    </p>
                    {anime.genres?.[0] && (
                      <p className="text-[#8892a4] text-[10px] mt-1">{anime.genres[0].name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── MAIN CONTENT + SIDEBAR ─────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left: Latest News Grid */}
          <div className="flex-1">
            <SectionHeader icon={Newspaper} title="Latest News" href="/news" />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-[#0d1117] border border-[#1a2235] overflow-hidden animate-pulse">
                    <div className="h-48 bg-[#1a2235]" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-[#1a2235] rounded w-3/4" />
                      <div className="h-3 bg-[#1a2235] rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : latestArticles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  {latestArticles.map(a => (
                    <ArticleCard key={a.id} article={a} variant="default" />
                  ))}
                </div>
                <div className="text-center">
                  <Link
                    href="/news"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0d1117] border border-[#1a2235] hover:border-[#e85d04]/30 text-[#8892a4] hover:text-white text-sm font-medium rounded-xl transition-all"
                  >
                    View All News <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-[#8892a4]">
                <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No articles yet. Run AutoPilot to get started.</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">

            {/* Ad */}
            <AdBanner format="rectangle" />

            {/* Editor's Picks */}
            {editorPicks.length > 0 && (
              <div className="bg-[#0d1117] border border-[#1a2235] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <h3 className="text-white font-black text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
                    Editor's Picks
                  </h3>
                </div>
                <div className="space-y-1">
                  {editorPicks.map(a => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* Top Airing Quick List */}
            {trending.length > 0 && (
              <div className="bg-[#0d1117] border border-[#1a2235] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="text-white font-black text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
                    Top Airing
                  </h3>
                </div>
                <ol className="space-y-3">
                  {trending.slice(0, 5).map((anime, i) => (
                    <li key={anime.mal_id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#e85d04]/10 border border-[#e85d04]/20 flex items-center justify-center text-[#e85d04] text-xs font-black flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium line-clamp-1">{anime.title}</p>
                        {anime.score && (
                          <p className="text-[#8892a4] text-[10px] flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                            {anime.score}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                <Link
                  href="/trending"
                  className="flex items-center justify-center gap-1 mt-4 text-xs text-[#8892a4] hover:text-white transition-colors"
                >
                  View Full Rankings <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Newsletter placeholder */}
            <div className="bg-gradient-to-br from-[#e85d04]/10 to-[#f48c06]/5 border border-[#e85d04]/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-[#e85d04]" />
                <span className="text-white font-black text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
                  Stay Updated
                </span>
              </div>
              <p className="text-[#8892a4] text-xs mb-4 leading-relaxed">
                Get the hottest anime news delivered daily.
              </p>
              <Link
                href="https://t.me/AnimePulseChannel"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#e85d04] hover:bg-[#f48c06] text-white text-sm font-bold rounded-xl transition-colors"
              >
                <Clock className="w-4 h-4" />
                Join Telegram
              </Link>
            </div>
          </aside>
        </div>

        {/* ── BOTTOM AD ─────────────────────────────────────────────────── */}
        <AdBanner format="horizontal" />
      </div>
    </div>
  );
}
