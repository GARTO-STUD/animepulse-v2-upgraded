'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Star, Eye, Medal, TrendingUp } from 'lucide-react';

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
  year: number | null;
  status: string;
}

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

export default function Top10Page() {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.jikan.moe/v4/top/anime?limit=10')
      .then(r => r.json())
      .then(d => { setAnime(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const top = anime[0];

  const rankStyle = (i: number) => {
    if (i === 0) return 'bg-yellow-500 text-black';
    if (i === 1) return 'bg-gray-300 text-black';
    if (i === 2) return 'bg-amber-600 text-white';
    return 'bg-[#1a2235] text-[#8892a4]';
  };

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#1a2235] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-7 h-7 text-yellow-400" />
            <h1 className="text-3xl font-black text-white section-title">Top 10 Anime</h1>
          </div>
          <p className="text-[#8892a4]">The definitive rankings from MyAnimeList — updated in real-time.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-[#0d1117] rounded-xl h-24 animate-pulse border border-[#1a2235]" />
            ))}
          </div>
        ) : (
          <>
            {/* #1 Hero */}
            {top && (
              <Link href={`/anime/${top.mal_id}`} className="block relative rounded-2xl overflow-hidden mb-8 border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-[#0d1117] to-[#0d1117] hover:border-yellow-500/50 transition-colors">
                <div className="flex flex-col md:flex-row gap-6 p-8">
                  <div className="relative w-40 h-56 rounded-xl overflow-hidden flex-shrink-0 border border-yellow-500/20">
                    <Image src={top.images.jpg.large_image_url} alt={top.title} fill className="object-cover" unoptimized />
                    <div className="absolute top-2 left-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Medal className="w-4 h-4 text-black" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 mb-3 inline-block">#1 BEST ANIME OF ALL TIME</span>
                    <h2 className="text-3xl font-black text-white mb-2">{top.title}</h2>
                    <p className="text-[#8892a4] mb-4 line-clamp-3 max-w-2xl">{top.synopsis}</p>
                    <div className="flex flex-wrap gap-5 text-sm">
                      {top.score && (
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-yellow-400 font-black text-xl">
                            <Star className="w-5 h-5 fill-yellow-400" />{top.score}
                          </div>
                          {top.scored_by && <div className="text-[#8892a4] text-xs">{fmt(top.scored_by)} ratings</div>}
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-white font-black text-xl">{fmt(top.members)}</div>
                        <div className="text-[#8892a4] text-xs">members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-black text-xl">{top.episodes || '—'}</div>
                        <div className="text-[#8892a4] text-xs">episodes</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {top.genres.map(g => (
                        <span key={g.name} className="badge bg-white/5 border border-white/10 text-[#8892a4]">{g.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* List #2-10 */}
            <div className="space-y-3">
              {anime.slice(1).map((a, i) => (
                <Link
                  key={a.mal_id}
                  href={`/anime/${a.mal_id}`}
                  className="anime-card flex items-center gap-4 bg-[#0d1117] border border-[#1a2235] rounded-xl p-4 cursor-pointer group block"
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 ${rankStyle(i + 1)}`}>
                    {i + 2}
                  </div>

                  {/* Cover */}
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={a.images.jpg.image_url} alt={a.title} fill className="object-cover" unoptimized />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm group-hover:text-[#e85d04] transition-colors line-clamp-1">{a.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#8892a4]">
                      <span>{a.genres.slice(0, 2).map(g => g.name).join(' · ')}</span>
                      {a.studios[0] && <span className="text-[#e85d04]">{a.studios[0].name}</span>}
                      <span>{a.episodes ? `${a.episodes} eps` : a.status}</span>
                      {a.year && <span>{a.year}</span>}
                    </div>
                  </div>

                  {/* Score */}
                  {a.score && (
                    <div className="flex items-center gap-1 text-yellow-400 font-black text-sm flex-shrink-0">
                      <Star className="w-4 h-4 fill-yellow-400" />{a.score}
                    </div>
                  )}

                  {/* Members */}
                  <div className="hidden sm:flex items-center gap-1 text-[#8892a4] text-xs flex-shrink-0">
                    <Eye className="w-3 h-3" />{fmt(a.members)}
                  </div>
                </Link>
              ))}
            </div>

            {/* Criteria box */}
            <div className="mt-10 bg-[#0d1117] border border-[#1a2235] rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#e85d04]" /> How Rankings Work
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-[#8892a4]">
                <div><span className="text-white font-semibold">Score</span> — Community ratings from millions of anime fans on MyAnimeList.</div>
                <div><span className="text-white font-semibold">Popularity</span> — Number of members who tracked this anime.</div>
                <div><span className="text-white font-semibold">Real-time</span> — Data pulled live from Jikan API, always up to date.</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
