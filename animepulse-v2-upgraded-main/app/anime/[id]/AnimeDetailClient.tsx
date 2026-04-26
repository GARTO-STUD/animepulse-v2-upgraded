'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Play, Calendar, Clock, Users, ChevronLeft, Tv, Award } from 'lucide-react';

interface AnimeDetail {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  episodes: number | null;
  status: string;
  aired: { string: string };
  season: string | null;
  year: number | null;
  duration: string;
  rating: string;
  source: string;
  genres: { name: string }[];
  studios: { name: string }[];
  images: { jpg: { large_image_url: string; image_url: string } };
  trailer: { youtube_id: string | null };
  background: string | null;
  type: string;
}

interface RelatedAnime {
  mal_id: number;
  title: string;
  images: { jpg: { image_url: string } };
  score: number | null;
}

export default function AnimeDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [related, setRelated] = useState<RelatedAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);

    fetch(`https://api.jikan.moe/v4/anime/${id}/full`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setAnime(data.data);
          return fetch(`https://api.jikan.moe/v4/anime/${id}/recommendations`);
        } else {
          setError(true);
          return null;
        }
      })
      .then(r => r?.json())
      .then(rec => {
        if (rec?.data) {
          setRelated(rec.data.slice(0, 6).map((r: { entry: RelatedAnime }) => r.entry));
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#e85d04] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#8892a4]">Loading anime details...</p>
      </div>
    </div>
  );

  if (error || !anime) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-xl font-bold mb-2">Anime not found</p>
        <p className="text-[#8892a4] mb-6">We couldn&apos;t load this anime&apos;s details.</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-[#e85d04] text-white font-bold rounded-xl">
          Go Back
        </button>
      </div>
    </div>
  );

  const scoreColor = anime.score
    ? anime.score >= 8 ? 'text-green-400' : anime.score >= 7 ? 'text-yellow-400' : 'text-orange-400'
    : 'text-[#8892a4]';

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden min-h-[420px] flex items-end">
        <div className="absolute inset-0">
          <Image
            src={anime.images.jpg.large_image_url}
            alt={anime.title}
            fill
            className="object-cover object-top opacity-20"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080b14]/90 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-20 w-full">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[#8892a4] hover:text-white text-sm mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex flex-col sm:flex-row gap-8">
            {/* Cover */}
            <div className="relative w-44 h-64 rounded-2xl overflow-hidden border-2 border-[#1a2235] flex-shrink-0 shadow-2xl">
              <Image src={anime.images.jpg.large_image_url} alt={anime.title} fill className="object-cover" unoptimized />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {anime.genres.slice(0, 4).map(g => (
                  <span key={g.name} className="text-xs px-2.5 py-1 bg-[#e85d04]/15 border border-[#e85d04]/30 text-[#e85d04] rounded-full font-semibold">
                    {g.name}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-1">{anime.title}</h1>
              {anime.title_english && anime.title_english !== anime.title && (
                <p className="text-[#8892a4] text-lg mb-1">{anime.title_english}</p>
              )}
              {anime.title_japanese && (
                <p className="text-[#8892a4] text-sm mb-4">{anime.title_japanese}</p>
              )}

              <div className="flex flex-wrap gap-5 mb-5">
                {anime.score && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className={`text-xl font-black ${scoreColor}`}>{anime.score}</span>
                    {anime.scored_by && (
                      <span className="text-[#8892a4] text-xs">({(anime.scored_by / 1000).toFixed(0)}K)</span>
                    )}
                  </div>
                )}
                {anime.rank && (
                  <div className="flex items-center gap-1.5 text-[#8892a4]">
                    <Award className="w-4 h-4" />
                    <span className="text-sm">Rank <span className="text-white font-bold">#{anime.rank}</span></span>
                  </div>
                )}
                {anime.members && (
                  <div className="flex items-center gap-1.5 text-[#8892a4]">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{(anime.members / 1000).toFixed(0)}K members</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: Tv, label: anime.type || 'TV' },
                  { icon: Play, label: anime.episodes ? `${anime.episodes} eps` : 'Ongoing' },
                  { icon: Clock, label: anime.duration?.replace(' per ep', '') || '—' },
                  { icon: Calendar, label: anime.aired?.string || '—' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs bg-[#0d1117] border border-[#1a2235] text-[#8892a4] px-3 py-1.5 rounded-lg">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </span>
                ))}
              </div>

              {anime.studios.length > 0 && (
                <p className="text-[#8892a4] text-sm mb-5">
                  Studio:{' '}
                  {anime.studios.map((s, i) => (
                    <span key={s.name} className="text-[#e85d04] font-semibold">
                      {s.name}{i < anime.studios.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                {anime.trailer?.youtube_id && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" /> Watch Trailer
                  </button>
                )}
                <Link
                  href="/trending"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/10 transition-all"
                >
                  More Trending
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRAILER MODAL ── */}
      {showTrailer && anime.trailer?.youtube_id && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div className="relative w-full max-w-3xl aspect-video" onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${anime.trailer.youtube_id}?autoplay=1`}
              className="w-full h-full rounded-2xl"
              allowFullScreen
              allow="autoplay"
            />
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-white text-sm hover:text-[#e85d04] transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          <div className="lg:col-span-2 space-y-8">
            {anime.synopsis && (
              <div>
                <h2 className="text-white text-xl font-black mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-[#e85d04] rounded-full" /> Synopsis
                </h2>
                <p className="text-[#8892a4] leading-relaxed">{anime.synopsis}</p>
              </div>
            )}
            {anime.background && (
              <div>
                <h2 className="text-white text-xl font-black mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full" /> Background
                </h2>
                <p className="text-[#8892a4] leading-relaxed">{anime.background}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-white text-xl font-black flex items-center gap-2">
              <div className="w-1 h-6 bg-purple-500 rounded-full" /> Details
            </h2>
            <div className="bg-[#0d1117] border border-[#1a2235] rounded-2xl p-5 space-y-3">
              {[
                { label: 'Status', value: anime.status },
                { label: 'Source', value: anime.source },
                { label: 'Rating', value: anime.rating },
                { label: 'Season', value: anime.season && anime.year ? `${anime.season} ${anime.year}` : anime.year?.toString() || null },
                { label: 'Popularity', value: anime.popularity ? `#${anime.popularity}` : null },
              ].filter(x => x.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm border-b border-[#1a2235] pb-2 last:border-0 last:pb-0">
                  <span className="text-[#8892a4]">{label}</span>
                  <span className="text-white font-semibold text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-white text-xl font-black mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#e85d04] rounded-full" /> You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {related.map(r => (
                <Link key={r.mal_id} href={`/anime/${r.mal_id}`} className="anime-card group block">
                  <div className="relative rounded-xl overflow-hidden border border-[#1a2235] bg-[#0d1117]">
                    <div className="relative h-44">
                      <Image src={r.images.jpg.image_url} alt={r.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-white text-xs font-bold line-clamp-2 leading-snug">{r.title}</h3>
                      {r.score && <p className="text-yellow-400 text-xs mt-1">★ {r.score}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
