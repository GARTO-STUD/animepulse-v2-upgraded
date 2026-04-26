import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anime News 2025',
  description: 'Latest anime news, announcements, and updates from MyAnimeList, Crunchyroll, Anime News Network, and Reddit. Stay up to date with the anime world.',
  keywords: ['anime news', 'anime announcements 2025', 'new anime season', 'crunchyroll news', 'anime news network', 'manga news 2025'],
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'Anime News 2025 | AnimePulse',
    description: 'Latest anime news and announcements from all major sources. Updated daily.',
    type: 'website',
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
