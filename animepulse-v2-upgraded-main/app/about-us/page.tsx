import type { Metadata } from 'next';
import Link from 'next/link';
import { Flame } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About AnimePulse — Your Premier Anime News Source',
  description: 'AnimePulse is a dedicated anime news and discovery platform serving the global anime community with real-time news, reviews, and rankings.',
};

export default function AboutUs() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#080b14] py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,93,4,0.10),transparent_55%)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-7">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#e85d04] to-[#f48c06] flex items-center justify-center shadow-lg shadow-[#e85d04]/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">Anime<span className="text-[#e85d04]">Pulse</span></span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            The Pulse of the<br />
            <span className="text-[#e85d04]">Anime World</span>
          </h1>
          <p className="text-[#8892a4] text-lg max-w-2xl mx-auto leading-relaxed">
            AnimePulse is a dedicated platform for the global anime community — bringing together real-time news, community-sourced rankings, in-depth reviews, and curated seasonal guides in one fast, beautiful experience.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#1a2235] bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '100K+', label: 'Monthly Readers',    color: 'text-[#e85d04]' },
              { value: '25K+',  label: 'Anime Tracked',      color: 'text-blue-400'  },
              { value: '1K+',   label: 'Published Articles', color: 'text-green-400' },
              { value: '100+',  label: 'Countries Reached',  color: 'text-purple-400'},
            ].map(({ value, label, color }) => (
              <div key={label} className="py-4">
                <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
                <div className="text-[#8892a4] text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-[#e85d04] rounded-full" />
              <span className="text-[#e85d04] text-sm font-bold uppercase tracking-wider">Our Story</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-6">Built for fans who want more</h2>
            <div className="space-y-5 text-[#8892a4] leading-relaxed">
              <p>
                AnimePulse was created out of a simple frustration: there was no single place for anime fans to get accurate, fast, and beautifully presented news alongside real-time rankings and honest reviews.
              </p>
              <p>
                We set out to build the platform we always wanted to use ourselves. Every design decision, every data source, every feature exists to serve one goal — helping anime fans discover, follow, and talk about the shows they love.
              </p>
              <p>
                Our content pipeline pulls from dozens of the most trusted anime news sources, processes it into readable summaries, and surfaces it alongside live rankings from the world&apos;s largest anime database. We update multiple times per day so you never miss a story.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/news" className="px-6 py-3 bg-[#e85d04] hover:bg-[#f48c06] text-white font-bold rounded-xl transition-all text-sm glow-orange">
                Read the News
              </Link>
              <Link href="/contact-us" className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/10 transition-all text-sm">
                Get in Touch
              </Link>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1a2235] rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(232,93,4,0.07),transparent_60%)]" />
            <div className="relative space-y-1">
              {[
                { label: 'Anime tracked',    value: '25,000+',     bar: 'w-full' },
                { label: 'News sources',     value: '12+',         bar: 'w-2/5'  },
                { label: 'Updated every',    value: '4 hours',     bar: 'w-3/4'  },
                { label: 'Countries served', value: '100+',        bar: 'w-4/5'  },
                { label: 'Data provider',    value: 'MyAnimeList', bar: 'w-full' },
              ].map(({ label, value, bar }) => (
                <div key={label} className="py-4 border-b border-[#1a2235] last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#8892a4] text-sm">{label}</span>
                    <span className="text-white font-black text-sm">{value}</span>
                  </div>
                  <div className="w-full h-1 bg-[#1a2235] rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r from-[#e85d04] to-[#f48c06] rounded-full ${bar}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="bg-[#0d1117] border-y border-[#1a2235] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-1 h-5 bg-[#e85d04] rounded-full" />
              <span className="text-[#e85d04] text-sm font-bold uppercase tracking-wider">What We Offer</span>
              <div className="w-1 h-5 bg-[#e85d04] rounded-full" />
            </div>
            <h2 className="text-3xl font-black text-white">Everything in One Place</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Real-Time News',   desc: 'Pulled from 12+ trusted anime news sources and updated every few hours.',           accent: '#e85d04' },
              { label: 'Live Rankings',    desc: 'Top 10 lists and trending anime sourced directly from MyAnimeList\'s live database.', accent: '#3b82f6' },
              { label: 'Honest Reviews',   desc: 'Community-driven scores and editorial reviews for thousands of anime titles.',       accent: '#22c55e' },
              { label: 'Seasonal Guides',  desc: 'Every season previewed and curated so you always know what\'s worth watching.',     accent: '#a855f7' },
            ].map(({ label, desc, accent }) => (
              <div
                key={label}
                className="bg-[#080b14] rounded-2xl p-6 border border-[#1a2235]"
                style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
              >
                <h3 className="text-white font-black mb-3 text-base">{label}</h3>
                <p className="text-[#8892a4] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-2xl overflow-hidden border border-[#e85d04]/20 bg-gradient-to-br from-[#e85d04]/10 via-[#0d1117] to-[#0d1117] p-10 sm:p-14 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(232,93,4,0.12),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Start Exploring</h2>
            <p className="text-[#8892a4] mb-8 max-w-lg mx-auto leading-relaxed">
              Dive into trending anime, catch up on the latest news, or explore our top rankings. AnimePulse is always updated and always free.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/trending" className="px-7 py-3.5 bg-[#e85d04] hover:bg-[#f48c06] text-white font-bold rounded-xl transition-all glow-orange">
                Trending Anime
              </Link>
              <Link href="/blog" className="px-7 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/10 transition-all">
                Read the Blog
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
