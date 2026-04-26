/**
 * NewsDetailClient.tsx — Article reader client component
 */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock, Calendar, ChevronLeft, Share2, Copy, Check,
  ExternalLink, Flame, BookOpen,
} from 'lucide-react';
import AdBanner from '@/components/AdBanner';

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  sourceType: string;
  url: string;
  imageUrl?: string | null;
  publishedAt: string;
  tags?: string[];
  readTime?: number;
  editorialNote?: string;
  verdict?: string;
  views?: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

/** Convert Markdown to basic HTML (no external dep needed) */
function markdownToHtml(md: string): string {
  return md
    .replace(/^#{1} (.+)$/gm, '<h1 class="text-2xl font-black text-white mt-8 mb-4" style="font-family:var(--font-syne)">$1</h1>')
    .replace(/^#{2} (.+)$/gm, '<h2 class="text-xl font-black text-white mt-8 mb-3" style="font-family:var(--font-syne)">$1</h2>')
    .replace(/^#{3} (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-6 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#8892a4]">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-[#1a2235] text-[#e85d04] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^\- (.+)$/gm, '<li class="flex items-start gap-2 text-[#c8d0de] leading-relaxed py-1"><span class="text-[#e85d04] mt-1.5 flex-shrink-0">▸</span><span>$1</span></li>')
    .replace(/(<li.*<\/li>\n?)+/g, (match) => `<ul class="my-4 space-y-1 pl-2">${match}</ul>`)
    .replace(/^(?!<[h|u|l])(.+)$/gm, '<p class="text-[#c8d0de] leading-relaxed my-3">$1</p>')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/<p class="[^"]*"><\/p>/g, '');
}

export default function NewsDetailClient({
  id,
  initialArticle,
}: {
  id: string;
  initialArticle: Record<string, unknown> | null;
}) {
  const [article, setArticle] = useState<Article | null>(initialArticle as Article | null);
  const [loading, setLoading] = useState(!initialArticle);
  const [copied, setCopied]   = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!initialArticle) {
      fetch(`/api/articles/${id}`)
        .then(r => r.json())
        .then(data => setArticle(data.article || null))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, initialArticle]);

  // Load related articles
  useEffect(() => {
    if (!article?.tags?.length) return;
    fetch(`/api/articles?limit=4&tag=${encodeURIComponent(article.tags[0])}&status=published`)
      .then(r => r.json())
      .then(data => {
        const related = (data.articles || []).filter((a: Article) => a.id !== id);
        setRelatedArticles(related.slice(0, 3));
      })
      .catch(() => {});
  }, [article, id]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b14] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#e85d04] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#080b14] flex flex-col items-center justify-center gap-4">
        <span className="text-6xl">😔</span>
        <h1 className="text-white font-black text-2xl">Article Not Found</h1>
        <Link href="/news" className="flex items-center gap-2 text-[#e85d04] hover:underline">
          <ChevronLeft className="w-4 h-4" /> Back to News
        </Link>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="min-h-screen bg-[#080b14]">
      {/* Hero Image */}
      {article.imageUrl && (
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080b14]/50 to-[#080b14]" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#8892a4] mb-6">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>›</span>
          <Link href="/news" className="hover:text-white transition-colors">News</Link>
          <span>›</span>
          <span className="text-white line-clamp-1">{article.title}</span>
        </div>

        {/* Top Ad */}
        <AdBanner format="horizontal" className="mb-8" />

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Article */}
          <article className="flex-1 min-w-0">
            {/* Verdict */}
            {article.verdict && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e85d04]/10 border border-[#e85d04]/20 text-[#e85d04] text-sm font-bold mb-4">
                <Flame className="w-4 h-4" />
                {article.verdict}
              </div>
            )}

            {/* Title */}
            <h1 className="text-white font-black text-2xl sm:text-3xl lg:text-4xl leading-tight mb-4" style={{ fontFamily: 'var(--font-syne)' }}>
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#8892a4] mb-6 pb-6 border-b border-[#1a2235]">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded bg-[#e85d04]/10 border border-[#e85d04]/20 flex items-center justify-center">
                  <Flame className="w-3 h-3 text-[#e85d04]" />
                </span>
                <span className="font-medium text-[#e85d04]">{article.source}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(article.publishedAt)}
              </span>
              {article.readTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {article.readTime} min read
                </span>
              )}
              {article.url && (
                <a href={article.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" /> Source
                </a>
              )}
            </div>

            {/* Summary Callout */}
            <div className="bg-[#0d1117] border-l-4 border-[#e85d04] rounded-r-xl p-4 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-[#e85d04]" />
                <span className="text-xs font-bold text-[#e85d04] uppercase tracking-wide">TL;DR</span>
              </div>
              <p className="text-[#c8d0de] text-sm leading-relaxed">{article.summary}</p>
            </div>

            {/* Article Body */}
            <div
              className="prose-custom mb-10"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content) }}
            />

            {/* Editorial Hot Take */}
            {article.editorialNote && (
              <div className="bg-gradient-to-r from-[#e85d04]/10 to-transparent border border-[#e85d04]/20 rounded-2xl p-5 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-[#e85d04]" />
                  <span className="text-[#e85d04] font-black text-sm uppercase tracking-wide">AnimePulse Hot Take</span>
                </div>
                <p className="text-white text-sm leading-relaxed italic">"{article.editorialNote}"</p>
              </div>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {article.tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/news?tag=${encodeURIComponent(tag)}`}
                    className="text-xs bg-[#0d1117] border border-[#1a2235] text-[#8892a4] px-3 py-1.5 rounded-full hover:border-[#e85d04]/30 hover:text-white transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Share Bar */}
            <div className="flex flex-wrap items-center gap-3 py-5 border-y border-[#1a2235] mb-10">
              <span className="text-sm text-[#8892a4] font-medium">Share:</span>
              <a
                href={twitterShare}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0d1117] border border-[#1a2235] text-sm text-[#8892a4] hover:text-white hover:border-[#e85d04]/30 transition-colors"
              >
                <Share2 className="w-4 h-4" /> Twitter/X
              </a>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0d1117] border border-[#1a2235] text-sm text-[#8892a4] hover:text-white hover:border-[#e85d04]/30 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Bottom Ad */}
            <AdBanner format="horizontal" className="mb-10" />

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section>
                <h2 className="text-white font-black text-xl mb-5" style={{ fontFamily: 'var(--font-syne)' }}>
                  Related Articles
                </h2>
                <div className="space-y-4">
                  {relatedArticles.map(rel => (
                    <Link
                      key={rel.id}
                      href={`/news/${rel.id}`}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-[#0d1117] border border-[#1a2235] hover:border-[#e85d04]/30 transition-colors group"
                    >
                      {rel.imageUrl && (
                        <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={rel.imageUrl} alt={rel.title} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <div>
                        <h3 className="text-white text-sm font-bold line-clamp-2 group-hover:text-[#f48c06] transition-colors">
                          {rel.title}
                        </h3>
                        <p className="text-[#8892a4] text-xs mt-1">
                          {new Date(rel.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <AdBanner format="rectangle" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
