import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anime Reviews 2025',
  description: 'In-depth anime reviews and ratings for the best and most popular anime series. Find your next anime to watch with our detailed reviews.',
  keywords: ['anime reviews 2025', 'anime ratings', 'best anime to watch', 'anime review site', 'is this anime worth watching'],
  alternates: { canonical: '/reviews' },
  openGraph: {
    title: 'Anime Reviews 2025 | AnimePulse',
    description: 'Detailed anime reviews and ratings. Find your next watch.',
    type: 'website',
  },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
