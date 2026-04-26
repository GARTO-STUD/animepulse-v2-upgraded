import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top 10 Anime 2025',
  description: 'The best anime of 2025 ranked by score, popularity, and community votes. Discover the top-rated anime of all time on AnimePulse.',
  keywords: ['top 10 anime 2025', 'best anime 2025', 'highest rated anime', 'top anime all time', 'anime rankings 2025'],
  alternates: { canonical: '/top-10' },
  openGraph: {
    title: 'Top 10 Anime 2025 | AnimePulse',
    description: 'The best anime ranked by score and popularity. Updated from MyAnimeList data.',
    type: 'website',
  },
};

export default function Top10Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
