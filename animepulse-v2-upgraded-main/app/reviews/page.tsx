'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, User, Filter, MessageCircle } from 'lucide-react';

interface Anime {
  mal_id: number;
  title: string;
  score: number | null;
  scored_by: number | null;
  members: number;
  episodes: number | null;
  genres: { name: string }[];
  studios: { name: string }[];
  synopsis: string | null;
  images: { jpg: { image_url: string; large_image_url: string } };
  rank: number | null;
}

function Stars({ score }: { score: number | null }) {
  const s = score ? Math.round(score / 2) : 0;
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= s ? 'fill-yellow-400 text-yellow-400' : 'text-[#1a2235]'}`} />
      ))}
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

const FILTERS = ['All', 'Action', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi'];

export default function ReviewsPage() {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'members'>('score');

  useEffect(() => {
    fetch('https://api.jikan.moe/v4/top/anime?limit=24')
      .then(r => r.json())
      .then(d => { setAnime(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = anime
    .filter(a => filter === 'All' || a.genres.some(g => g.name === filter))
    .sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
      return b.members - a.members;
    });

  const avgScore = anime.length ? (anime.reduce((s, a) => s + (a.score || 0), 0) / anime.filter(a => a.score).length).toFixed(1) : '—';

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#1a2235] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-7 h-7 text-[#e85d04]" />
            <h1 className="text-3xl font-black text-white section-title">Anime Reviews</h1>
          </div>
          <p className="text-[#8892a4]">Community ratings &amp; scores from MyAnimeList &mdash; the world&apos;s largest anime database.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Anime Reviewed', value: `${anime.length}+`, color: 'text-[#e85d04]' },
            { label: 'Avg Score', value: avgScore, color: 'text-yellow-400' },
            { label: 'Total Ratings', value: fmt(anime.reduce((s, a) => s + (a.scored_by || 0), 0)), color: 'text-green-400' },
            { label: 'Source', value: 'MAL', color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#0d1117] border border-[#1a2235] rounded-xl p-5 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[#8892a4] text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-[#e85d04] text-white'
                    : 'bg-[#0d1117] border border-[#1a2235] text-[#8892a4] hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#8892a4]" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'score' | 'members')}
              className="bg-[#0d1117] border border-[#1a2235] text-[#8892a4] text-sm rounded-lg px-3 py-1.5 outline-none"
            >
              <option value="score">Sort by Score</option>
              <option value="members">Sort by Popularity</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#0d1117] rounded-xl h-36 animate-pulse border border-[#1a2235]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((a) => (
              <Link key={a.mal_id} href={`/anime/${a.mal_id}`} className="anime-card flex gap-4 bg-[#0d1117] border border-[#1a2235] rounded-xl p-4 group block">
                <div className="relative w-16 flex-shrink-0 rounded-lg overflow-hidden" style={{ height: '88px' }}>
                  <Image src={a.images.jpg.image_url} alt={a.title} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#e85d04] transition-colors mb-1">
                    {a.title}
                  </h3>
                  <Stars score={a.score} />
                  <p className="text-[#8892a4] text-xs mt-1 line-clamp-2">{a.synopsis?.slice(0, 100) + '...' || '—'}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {a.score && (
                      <span className="text-yellow-400 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-400" />{a.score}
                      </span>
                    )}
                    {a.scored_by && (
                      <span className="text-[#8892a4] flex items-center gap-0.5">
                        <User className="w-3 h-3" />{fmt(a.scored_by)}
                      </span>
                    )}
                    <span className="text-[#8892a4]">{a.genres[0]?.name || '—'}</span>
                  </div>
                </div>
                {a.rank && (
                  <div className="flex-shrink-0 text-right">
                    <div className="text-[#8892a4] text-xs">Rank</div>
                    <div className="text-[#e85d04] font-black text-lg">#{a.rank}</div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
