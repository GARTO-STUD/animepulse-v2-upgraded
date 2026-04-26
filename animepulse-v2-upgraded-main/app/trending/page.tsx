'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Anime {
  mal_id: number;
  title: string;
  episodes: number | null;
  score: number | null;
  scored_by: number | null;
  members: number;
  studios: { name: string }[];
  genres: { name: string }[];
  synopsis: string | null;
  images: { jpg: { image_url: string; large_image_url: string } };
  rank: number | null;
  popularity: number | null;
  status: string;
}

const TABS = ['Airing Now', 'All Time Top', 'Most Popular'];

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

function ShareButton({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
  function copyLink() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => { setCopied(false); setOpen(false); }, 1500); });
  }
  return (
    <div className="relative">
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="text-xs text-[#8892a4] hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
        Share
      </button>
      {open && (
        <div className="absolute bottom-8 right-0 z-50 bg-[#0d1117] border border-[#1a2235] rounded-xl shadow-xl overflow-hidden min-w-[150px]"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#8892a4] hover:text-white hover:bg-white/5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Twitter / X
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#8892a4] hover:text-white hover:bg-white/5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.547l5.835-1.53A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.365l-.358-.214-3.72.975.991-3.63-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
            WhatsApp
          </a>
          <button onClick={copyLink}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#8892a4] hover:text-white hover:bg-white/5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TrendingPage() {
  const [tab, setTab] = useState(0);
  const [lists, setLists] = useState<Anime[][]>([[], [], []]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch3() {
      try {
        const [airing, top, popular] = await Promise.all([
          fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=20').then(r => r.json()),
          fetch('https://api.jikan.moe/v4/top/anime?limit=20').then(r => r.json()),
          fetch('https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=20').then(r => r.json()),
        ]);
        setLists([airing.data || [], top.data || [], popular.data || []]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch3();
  }, []);

  const current = lists[tab];
  const featured = current[0];
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://animepulse.online';

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#1a2235] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white mb-1">Trending Anime</h1>
          <p className="text-[#8892a4]">Live rankings from MyAnimeList. Updated daily.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === i
                  ? 'bg-[#e85d04] text-white'
                  : 'bg-[#0d1117] border border-[#1a2235] text-[#8892a4] hover:text-white hover:border-[#e85d04]/30'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-[#0d1117] rounded-xl h-64 animate-pulse border border-[#1a2235]" />
            ))}
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <Link href={`/anime/${featured.mal_id}`} className="block relative rounded-2xl overflow-hidden mb-8 border border-[#1a2235] hover:border-[#e85d04]/40 transition-colors">
                <div className="absolute inset-0">
                  <Image src={featured.images.jpg.large_image_url} alt={featured.title} fill className="object-cover opacity-20" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#080b14] via-[#080b14]/90 to-transparent" />
                </div>
                <div className="relative flex flex-col md:flex-row gap-6 p-8">
                  <div className="relative w-32 h-44 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                    <Image src={featured.images.jpg.large_image_url} alt={featured.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1">
                    <span className="inline-block bg-[#e85d04] text-white text-xs font-bold px-2 py-0.5 rounded mb-3">#1 {TABS[tab]}</span>
                    <h2 className="text-2xl font-black text-white mb-2">{featured.title}</h2>
                    <p className="text-[#8892a4] text-sm mb-4 line-clamp-3 max-w-2xl">{featured.synopsis}</p>
                    <div className="flex flex-wrap gap-4 text-sm items-center">
                      {featured.score && (
                        <span className="text-yellow-400 font-bold">
                          ★ {featured.score}
                          {featured.scored_by && <span className="text-[#8892a4] font-normal ml-1">({fmt(featured.scored_by)})</span>}
                        </span>
                      )}
                      <span className="text-[#8892a4]">{fmt(featured.members)} members</span>
                      <span className="text-[#8892a4]">{featured.genres.slice(0, 3).map(g => g.name).join(' · ')}</span>
                      <span className="text-[#8892a4]">{featured.episodes ? `${featured.episodes} eps` : featured.status}</span>
                      <ShareButton
                        title={`${featured.title} — Trending on AnimePulse`}
                        url={`${siteUrl}/trending`}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {current.slice(1).map((anime, i) => (
                <Link key={anime.mal_id} href={`/anime/${anime.mal_id}`} className="group block">
                  <div className="relative rounded-xl overflow-hidden bg-[#0d1117] border border-[#1a2235]">
                    <div className="relative h-56">
                      <Image src={anime.images.jpg.large_image_url} alt={anime.title} fill className="object-cover" unoptimized />
                      <span className="absolute top-2 left-2 w-6 h-6 bg-[#e85d04] rounded-full flex items-center justify-center text-white text-xs font-black z-10">
                        {i + 2}
                      </span>
                      {anime.score && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded z-10">
                          ★ {anime.score}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-white text-xs font-bold line-clamp-2">{anime.title}</h3>
                      <p className="text-[#8892a4] text-xs mt-1">{anime.genres[0]?.name || '—'}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[#8892a4] text-xs">{anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}</p>
                        <ShareButton
                          title={`${anime.title} — Trending on AnimePulse`}
                          url={`${siteUrl}/trending`}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
