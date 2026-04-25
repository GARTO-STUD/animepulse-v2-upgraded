// Server component wrapper for /anime/[id]
import type { Metadata } from 'next';
import AnimeDetailClient from './AnimeDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.pages.dev';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Anime | AnimePulse' };
    const data = await res.json();
    const anime = data.data;
    const title = `${anime.title} | AnimePulse`;
    const description = anime.synopsis?.slice(0, 160) || `Watch ${anime.title} on AnimePulse`;
    const image = anime.images?.jpg?.large_image_url || `${BASE_URL}/og-default.jpg`;
    const genres: string[] = (anime.genres || []).map((g: { name: string }) => g.name);
    return {
      title,
      description,
      keywords: [anime.title, anime.title_english, ...genres, 'anime', 'AnimePulse'].filter(Boolean).join(', '),
      openGraph: {
        title, description,
        url: `${BASE_URL}/anime/${id}`,
        siteName: 'AnimePulse',
        images: [{ url: image, width: 1200, height: 630, alt: anime.title }],
        type: 'website',
      },
      twitter: { card: 'summary_large_image', title, description, images: [image] },
      alternates: { canonical: `${BASE_URL}/anime/${id}` },
    };
  } catch { return { title: 'Anime | AnimePulse' }; }
}

export default function AnimeDetailPage() {
  return <AnimeDetailClient />;
}
