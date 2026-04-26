// JSON-LD structured data for articles — boosts Google rich snippets
interface Props {
  title: string;
  description: string;
  publishedAt: string;
  imageUrl?: string;
  tags?: string[];
  articleId: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.pages.dev';

export default function ArticleSchema({ title, description, publishedAt, imageUrl, tags, articleId }: Props) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    image: imageUrl ? [imageUrl] : [`${BASE_URL}/og-default.jpg`],
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: { '@type': 'Organization', name: 'AnimePulse', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'AnimePulse',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/news/${articleId}` },
    keywords: tags?.join(', '),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
