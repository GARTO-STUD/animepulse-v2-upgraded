import Link from 'next/link';
import { Calendar, Clock, ChevronRight, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Blog | AnimePulse — Anime Guides, Lists & Deep Dives',
  description: 'Explore in-depth anime guides, top lists, character analyses, and expert opinions from the AnimePulse team.',
};

const POSTS = [
  {
    slug: 'best-anime-2024',
    title: 'The 20 Best Anime of 2024: A Complete Year in Review',
    summary: 'From demon slayers to isekai heroes, 2024 was an incredible year for anime. We break down every standout title, hidden gem, and disappointment of the year.',
    category: 'Year in Review',
    date: '2024-12-28',
    readTime: 12,
    image: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
    featured: true,
  },
  {
    slug: 'shonen-vs-seinen',
    title: 'Shonen vs Seinen: What Really Makes an Anime "Mature"?',
    summary: 'The demographic labels in anime often create confusion. Is Attack on Titan really a shonen? Is Demon Slayer too violent for kids? We dig into what these labels actually mean.',
    category: 'Analysis',
    date: '2025-01-10',
    readTime: 8,
    image: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
    featured: false,
  },
  {
    slug: 'top-isekai-anime-all-time',
    title: 'Top 15 Isekai Anime of All Time — Ranked by Quality',
    summary: 'The isekai genre gets a bad reputation, but beneath the flood of copycat shows are genuinely great stories. Here are the 15 that stand above the rest.',
    category: 'Top Lists',
    date: '2025-01-18',
    readTime: 10,
    image: 'https://cdn.myanimelist.net/images/anime/1968/110330l.jpg',
    featured: false,
  },
  {
    slug: 'anime-streaming-guide-2025',
    title: 'Where to Watch Anime in 2025: The Complete Streaming Guide',
    summary: 'Crunchyroll, Netflix, Hidive, Disney+, and more — which platform has the best anime catalog? We compare them all so you know exactly where to subscribe.',
    category: 'Guides',
    date: '2025-02-05',
    readTime: 7,
    image: 'https://cdn.myanimelist.net/images/anime/1170/124312l.jpg',
    featured: false,
  },
  {
    slug: 'one-piece-explained',
    title: 'One Piece 1000 Episodes Later: Why It\'s Still the Greatest',
    summary: 'It has taken 25 years and over 1000 episodes, but One Piece has never been more popular. We explore what makes Oda\'s masterpiece so enduring.',
    category: 'Deep Dive',
    date: '2025-02-20',
    readTime: 15,
    image: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
    featured: false,
  },
  {
    slug: 'beginner-anime-guide',
    title: 'Complete Beginner\'s Guide to Anime: Where to Start in 2025',
    summary: 'Never watched anime before? This guide tells you exactly which shows to start with based on your tastes, and what to avoid until you\'re ready.',
    category: 'Guides',
    date: '2025-03-01',
    readTime: 9,
    image: 'https://cdn.myanimelist.net/images/anime/1517/100633l.jpg',
    featured: false,
  },
];

const CATEGORIES = ['All', 'Guides', 'Analysis', 'Top Lists', 'Deep Dive', 'Year in Review'];

export default function BlogPage() {
  const featured = POSTS.find(p => p.featured) || POSTS[0];
  const rest = POSTS.filter(p => !p.featured);

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#1a2235] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-7 h-7 text-[#e85d04]" />
            <h1 className="text-3xl font-black text-white">AnimePulse Blog</h1>
          </div>
          <p className="text-[#8892a4]">In-depth guides, top lists, and expert analysis from the world of anime.</p>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mt-6">
            {CATEGORIES.map(cat => (
              <span key={cat}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#080b14] border border-[#1a2235] text-[#8892a4] cursor-default hover:text-[#e85d04] hover:border-[#e85d04]/30 transition-colors">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Featured Post */}
        <Link href={`/blog/${featured.slug}`}
          className="block relative rounded-2xl overflow-hidden mb-12 border border-[#1a2235] group hover:border-[#e85d04]/30 transition-colors">
          <div className="absolute inset-0">
            <img src={featured.image} alt={featured.title} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080b14] via-[#080b14]/85 to-transparent" />
          </div>
          <div className="relative p-8 sm:p-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="bg-[#e85d04] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">Featured</span>
              <span className="text-[#e85d04] text-xs font-bold">{featured.category}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 group-hover:text-[#f48c06] transition-colors leading-tight">
              {featured.title}
            </h2>
            <p className="text-[#8892a4] text-lg mb-6 max-w-2xl">{featured.summary}</p>
            <div className="flex items-center gap-5 text-sm text-[#8892a4]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {featured.readTime} min read
              </span>
              <span className="flex items-center gap-1 text-[#e85d04] font-semibold group-hover:gap-2 transition-all">
                Read More <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="bg-[#0d1117] border border-[#1a2235] rounded-xl overflow-hidden group hover:border-[#e85d04]/30 transition-colors">
              <div className="relative h-48 overflow-hidden">
                <img src={post.image} alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" />
                <div className="absolute top-3 left-3">
                  <span className="bg-[#080b14]/90 border border-[#1a2235] text-[#e85d04] text-xs font-bold px-2.5 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-white font-black text-base mb-2 line-clamp-2 group-hover:text-[#e85d04] transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-[#8892a4] text-sm line-clamp-2 mb-4">{post.summary}</p>
                <div className="flex items-center justify-between text-xs text-[#8892a4] pt-3 border-t border-[#1a2235]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime} min
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
