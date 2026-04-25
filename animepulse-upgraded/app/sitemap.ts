/**
 * app/sitemap.ts — Dynamic XML sitemap
 * Includes static pages + all published articles
 */
import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL,             lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${APP_URL}/news`,   lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${APP_URL}/trending`,lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/anime`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${APP_URL}/reviews`,lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
  ];

  // Fetch published articles from API
  try {
    const res = await fetch(`${APP_URL}/api/articles?limit=200&status=published`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const articleRoutes: MetadataRoute.Sitemap = (data.articles || []).map(
        (a: { id: string; publishedAt: string; updatedAt?: string }) => ({
          url: `${APP_URL}/news/${a.id}`,
          lastModified: new Date(a.updatedAt || a.publishedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })
      );
      return [...staticRoutes, ...articleRoutes];
    }
  } catch { /**/ }

  return staticRoutes;
}
