/**
 * /news/[id] — Article detail page
 * Server Component with dynamic metadata + JSON-LD structured data
 */
export const runtime = 'edge';
import { Metadata } from 'next';
import NewsDetailClient from './NewsDetailClient';
import { getFirebaseToken, fsVal } from '@/lib/firebase-rest';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';

async function getArticle(id: string) {
  try {
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!saJson) return null;

    const sa = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/articles/${id}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const d = await res.json() as { fields?: Record<string, unknown> };
    if (!d.fields) return null;

    return Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fsVal(v)]));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const article = await getArticle(params.id);
  if (!article) {
    return { title: 'Article Not Found | AnimePulse' };
  }

  const title   = article.title as string;
  const summary = article.summary as string;
  const image   = (article.imageUrl as string) || `${APP_URL}/og-image.jpg`;
  const url     = `${APP_URL}/news/${params.id}`;
  const tags    = (article.tags as string[]) || [];

  return {
    title,
    description: summary,
    keywords: tags.join(', '),
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description: summary,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      publishedTime: article.publishedAt as string,
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: summary,
      images: [image],
    },
  };
}

export default async function NewsDetailPage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);

  // JSON-LD Article schema
  const articleSchema = article ? {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: article.imageUrl || `${APP_URL}/og-image.jpg`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    url: `${APP_URL}/news/${params.id}`,
    author: { '@type': 'Organization', name: 'AnimePulse', url: APP_URL },
    publisher: {
      '@type': 'Organization',
      name: 'AnimePulse',
      logo: { '@type': 'ImageObject', url: `${APP_URL}/logo.png` },
    },
    keywords: (article.tags as string[] || []).join(', '),
  } : null;

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      <NewsDetailClient id={params.id} initialArticle={article} />
    </>
  );
}
