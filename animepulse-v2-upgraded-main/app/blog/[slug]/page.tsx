import Link from 'next/link';
import { ChevronLeft, Calendar, Clock, Tag } from 'lucide-react';
import { notFound } from 'next/navigation';

const POSTS: Record<string, {
  title: string; summary: string; category: string; date: string;
  readTime: number; image: string; content: string; tags: string[];
}> = {
  'best-anime-2024': {
    title: 'The 20 Best Anime of 2024: A Complete Year in Review',
    summary: 'From demon slayers to isekai heroes, 2024 was an incredible year for anime.',
    category: 'Year in Review', date: '2024-12-28', readTime: 12,
    image: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
    tags: ['2024', 'Top Anime', 'Year Review', 'Best Of'],
    content: `## Introduction

2024 proved to be one of the most exciting years in recent anime history. From long-awaited sequels to stunning originals, the industry delivered hit after hit across every genre.

## The Standouts

Dungeon Meshi (Delicious in Dungeon) led the charge as one of the most inventively creative series in years — part cooking show, part dungeon crawler, entirely unforgettable. Studio Trigger's adaptation did justice to Ryoko Kui's beloved manga, bringing food-focused fantasy to a global audience.

Frieren: Beyond Journey's End continued from its 2023 debut into early 2024, winning countless awards for its meditative exploration of grief, time, and what it means to be human through the lens of an elven mage.

## The Surprises

Solo Leveling finally made it to screens, and the adaptation from A-1 Pictures mostly lived up to years of fan hype. The action sequences were genuinely jaw-dropping, and Sung Jinwoo quickly became one of the year's most talked-about protagonists.

## Looking Ahead

With several major titles confirmed for 2025 and animation studios continuing to push the craft forward, the future of anime looks brighter than ever.`,
  },
  'beginner-anime-guide': {
    title: 'Complete Beginner\'s Guide to Anime: Where to Start in 2025',
    summary: 'Never watched anime before? This guide tells you exactly which shows to start with.',
    category: 'Guides', date: '2025-03-01', readTime: 9,
    image: 'https://cdn.myanimelist.net/images/anime/1517/100633l.jpg',
    tags: ['Beginner', 'Guide', 'Getting Started', 'Recommendations'],
    content: `## Where to Begin

Starting anime in 2025 has never been easier — or more overwhelming. With thousands of titles available across dozens of streaming platforms, newcomers often freeze up before even pressing play.

## Your First Three Shows

For most people, the best entry points into anime are shows that blend accessibility with quality. Attack on Titan is gripping, cinematic, and has the kind of plot twists that make you forget you're watching animation. My Hero Academia eases you in with a more upbeat shonen energy. Death Note is cerebral, short, and perfect if you want a thriller.

## Understanding Genres

Anime covers every genre imaginable. Shonen titles like Naruto and Bleach focus on young heroes growing through battle. Slice-of-life shows like Your Lie in April prioritize emotional storytelling. Isekai titles like Re:Zero drop heroes into fantasy worlds. Knowing what you enjoy in other media helps enormously.

## Where to Watch

Crunchyroll remains the gold standard for legal anime streaming, with the largest catalog. Netflix has made major investments in anime and has some exclusives worth watching. Many classic titles are also available on free services like Tubi and YouTube.

## Practical Advice

Watch with subtitles, not dubbed — at least at first. The original Japanese voice performances are often significantly better, and you'll pick up common phrases quickly. Don't force yourself through shows you're not enjoying; anime is a medium, not a genre, and your perfect entry point exists.`,
  },
  'top-isekai-anime-all-time': {
    title: 'Top 15 Isekai Anime of All Time — Ranked by Quality',
    summary: 'The isekai genre gets a bad reputation, but beneath the flood of copycat shows are genuinely great stories.',
    category: 'Top Lists', date: '2025-01-18', readTime: 10,
    image: 'https://cdn.myanimelist.net/images/anime/1968/110330l.jpg',
    tags: ['Isekai', 'Top List', 'Rankings', 'Fantasy'],
    content: `## What Makes a Great Isekai?

The isekai genre — stories about characters transported to another world — has exploded over the last decade. With so many titles flooding the market, quality has become harder to find. Here we separate the genre-defining works from the noise.

## The Top Tier

Re:Zero − Starting Life in Another World earns its place at the top through sheer emotional commitment. Subaru's ability to respawn creates genuine tension, and the show isn't afraid to put its protagonist through psychological torment.

Mushoku Tensei: Jobless Reincarnation set a new standard for world-building in isekai. Despite its controversial protagonist, the depth of its fantasy setting and the quality of its animation are unmatched.

Sword Art Online, whatever its flaws, deserves credit for popularizing the genre globally. The first arc remains some of the most propulsive anime storytelling of its era.

## The Hidden Gems

The Rising of the Shield Hero offers a darker take on isekai tropes. Ascendance of a Bookworm is a slow-burn intellectual delight. Overlord, for all its power-fantasy trappings, is genuinely interested in political machination and moral ambiguity.

## The Modern Greats

Frieren shows what isekai-adjacent fantasy can achieve when freed from the genre's formulaic shackles. Dungeon Meshi proves that creative worldbuilding still has room to surprise us.`,
  },
  'shonen-vs-seinen': {
    title: 'Shonen vs Seinen: What Really Makes an Anime "Mature"?',
    summary: 'The demographic labels in anime often create confusion about what these categories actually mean.',
    category: 'Analysis', date: '2025-01-10', readTime: 8,
    image: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
    tags: ['Analysis', 'Demographics', 'Shonen', 'Seinen'],
    content: `## The Label Problem

Anime demographics — shonen, seinen, shojo, josei — are publishing categories, not content ratings. They indicate the target magazine or anthology where a manga was serialized, which roughly corresponds to the intended readership age and gender.

## What Shonen Actually Means

Shonen literally means "young boy." Jump Comics, home of One Piece, Naruto, and Dragon Ball, targets teenage boys. This doesn't mean the content can't be dark — Chainsaw Man, one of the most violent and psychologically disturbing manga in years, is a shonen title.

## What Seinen Offers

Seinen targets adult men, usually 18-40. This demographic tends to allow more explicit content, moral ambiguity, and slower, more deliberate storytelling. Berserk, Vagabond, and Vinland Saga are all seinen titles, known for their graphic violence and philosophical depth.

## The Reality

The lines blur constantly. Attack on Titan's grimness surprises many who assume shonen means lighthearted. Meanwhile, some seinen titles are more accessible than any shonen. The demographic label is useful context, but it says nothing definitive about content.

## What to Actually Look For

Rather than relying on demographic labels, look at actual content warnings and read community reviews. AnimeNewsNetwork and MyAnimeList both provide content advisories. The demographic label is a starting point, not a guide.`,
  },
  'one-piece-explained': {
    title: 'One Piece 1000 Episodes Later: Why It\'s Still the Greatest',
    summary: 'It has taken 25 years and over 1000 episodes, but One Piece has never been more popular.',
    category: 'Deep Dive', date: '2025-02-20', readTime: 15,
    image: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
    tags: ['One Piece', 'Deep Dive', 'Shonen', 'Manga'],
    content: `## A Quarter Century of Straw Hats

In 1997, Eiichiro Oda began publishing One Piece in Weekly Shonen Jump. What he created is not just the best-selling manga in history — it is one of the most extraordinary pieces of popular storytelling ever produced.

## The World-Building Achievement

The Grand Line, the Devil Fruits, the Haki system, the Void Century — Oda constructed a world so intricate that fans dedicate entire careers to theorizing about its secrets. Every island in the story feels distinct, every crew member has a layered backstory, and every villain has understandable motivations.

## Why It Keeps Growing

One Piece's global popularity has never been higher. The Netflix live-action adaptation surprised everyone by actually being good. New readers are discovering the manga daily. Veteran fans are still encountering revelations they didn't see coming after 25 years.

## The Emotional Core

What separates One Piece from other long-running shonen is its emotional commitment. The "Marineford arc" remains one of the most devastating sequences in manga history. Oda earns every tear he draws from his readers.

## The Road to the End

Oda has said he knows how the story ends. The final saga is underway. Whether it takes 3 years or 10, when One Piece concludes, it will leave a permanent mark on what popular storytelling can achieve.`,
  },
  'anime-streaming-guide-2025': {
    title: 'Where to Watch Anime in 2025: The Complete Streaming Guide',
    summary: 'Which streaming platform has the best anime catalog? We compare them all.',
    category: 'Guides', date: '2025-02-05', readTime: 7,
    image: 'https://cdn.myanimelist.net/images/anime/1170/124312l.jpg',
    tags: ['Streaming', 'Guide', 'Crunchyroll', 'Netflix'],
    content: `## The Streaming Landscape

The days of hunting for illegal streams are behind most anime fans. In 2025, the legal streaming landscape is richer than ever — but also more fragmented, with titles spread across multiple services.

## Crunchyroll: The Standard

Crunchyroll remains the largest dedicated anime streaming service with over 1,000 titles. It simulcasts most major new releases within an hour of Japanese broadcast. The library is unmatched, and the service has improved dramatically since its Sony acquisition. It's the one subscription every anime fan should have.

## Netflix: Premium Originals

Netflix has invested heavily in anime, producing high-quality originals like Cyberpunk: Edgerunners, Arcane (Western animation with anime DNA), and the Castlevania franchise. Its licensed catalog is smaller, but the exclusives are often exceptional. The main downside: Netflix doesn't simulcast.

## HIDIVE: The Deep Catalog

HIDIVE is the specialty service for older and more obscure titles. If you want to watch 90s classics, mecha deep cuts, or niche genres, HIDIVE often has what Crunchyroll doesn't. The interface is rougher, but the catalog is a treasure trove.

## Disney+: The Ghibli Archive

If you want Studio Ghibli, Disney+ is where you go. The entire Ghibli catalog, masterfully curated, lives here. Beyond that, Disney's anime offerings are limited but growing.

## The Free Option

Legally free options include Tubi (large catalog with ads), the official YouTube channels of several studios, and Crunchyroll's free tier (with ads and delayed simulcasts). Quality varies, but for those on a budget, these are viable starting points.`,
  },
};

export async function generateStaticParams() {
  return Object.keys(POSTS).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) return { title: 'Post Not Found | AnimePulse' };
  return {
    title: `${post.title} | AnimePulse Blog`,
    description: post.summary,
    openGraph: { title: post.title, description: post.summary, images: [{ url: post.image }] },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  const otherPosts = Object.entries(POSTS)
    .filter(([s]) => s !== slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen">

      {/* Hero Image */}
      <div className="relative h-[340px] overflow-hidden">
        <img src={post.image} alt={post.title} className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/60 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <Link href="/blog" className="inline-flex items-center gap-1.5 text-[#8892a4] hover:text-white text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Meta */}
        <div className="mb-8">
          <span className="inline-block bg-[#e85d04]/15 border border-[#e85d04]/30 text-[#e85d04] text-xs font-bold px-3 py-1 rounded-full mb-4">
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{post.title}</h1>
          <p className="text-[#8892a4] text-lg mb-5">{post.summary}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#8892a4]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readTime} min read
            </span>
          </div>
        </div>

        {/* Cover */}
        <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-[#1a2235] mb-10">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="space-y-4 mb-12">
          {post.content.split('\n').map((para, i) => {
            if (!para.trim()) return null;
            if (para.startsWith('## ')) return (
              <h2 key={i} className="text-white text-2xl font-black mt-10 mb-3 flex items-center gap-2">
                <div className="w-1 h-6 bg-[#e85d04] rounded-full flex-shrink-0" />
                {para.replace('## ', '')}
              </h2>
            );
            if (para.startsWith('### ')) return <h3 key={i} className="text-white text-xl font-bold mt-6 mb-2">{para.replace('### ', '')}</h3>;
            return <p key={i} className="text-[#8892a4] leading-relaxed text-[1.05rem]">{para}</p>;
          })}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-8 border-t border-[#1a2235] mb-14">
          <Tag className="w-4 h-4 text-[#8892a4] mt-0.5" />
          {post.tags.map(tag => (
            <span key={tag} className="text-xs bg-[#0d1117] border border-[#1a2235] text-[#8892a4] px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* More Posts */}
        <div>
          <h2 className="text-white text-xl font-black mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-[#e85d04] rounded-full" /> More from the Blog
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherPosts.map(([slug, p]) => (
              <Link key={slug} href={`/blog/${slug}`}
                className="bg-[#0d1117] border border-[#1a2235] rounded-xl overflow-hidden group hover:border-[#e85d04]/30 transition-colors">
                <div className="h-32 overflow-hidden">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" />
                </div>
                <div className="p-4">
                  <p className="text-[#e85d04] text-xs font-bold mb-1">{p.category}</p>
                  <h3 className="text-white text-sm font-bold line-clamp-2 group-hover:text-[#e85d04] transition-colors">{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
