/**
 * /news — News listing page with pagination, filters, and sections
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Newspaper, Star, Zap, Filter } from 'lucide-react';
import ArticleCard, { type ArticleCardData } from '@/components/ArticleCard';
import Pagination from '@/components/Pagination';
import AdBanner from '@/components/AdBanner';

const ITEMS_PER_PAGE = 12;

const SOURCE_TABS = [
  { key: 'all',    label: 'All News',    icon: Newspaper },
  { key: 'rss',    label: 'RSS Feeds',   icon: Zap },
] as const;

type SourceKey = typeof SOURCE_TABS[number]['key'];

export default function NewsPage() {
  const [articles, setArticles]     = useState<ArticleCardData[]>([]);
  const [featured, setFeatured]     = useState<ArticleCardData[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<SourceKey>('all');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [popularTags, setPopularTags] = useState<string[]>([]);

  const loadArticles = useCallback(async (tab: SourceKey = activeTab, p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        page: String(p),
        status: 'published',
      });
      if (tab !== 'all') params.set('source', tab);
      if (selectedTag)   params.set('tag', selectedTag);

      const res  = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      const all: ArticleCardData[] = data.articles || [];

      setArticles(all);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);

      // Build popular tags from current results
      if (p === 1 && !selectedTag) {
        const tagCounts: Record<string, number> = {};
        all.forEach(a => (a.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
        setPopularTags(
          Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([t]) => t)
        );

        // First 2 articles become featured
        setFeatured(all.slice(0, 2));
      }
    } catch { /**/ }
    finally { setLoading(false); }
  }, [activeTab, page, selectedTag]);

  useEffect(() => {
    loadArticles(activeTab, page);
  }, [activeTab, page, selectedTag, loadArticles]);

  function handleTabChange(tab: SourceKey) {
    setActiveTab(tab);
    setPage(1);
    setSelectedTag(null);
  }

  function handleTagClick(tag: string) {
    setSelectedTag(prev => prev === tag ? null : tag);
    setPage(1);
  }

  // Grid articles = all except featured (on first page without tag filter)
  const gridArticles = (page === 1 && !selectedTag) ? articles.slice(2) : articles;

  return (
    <div className="min-h-screen bg-[#080b14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#e85d04]/10 border border-[#e85d04]/20 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-[#e85d04]" />
            </div>
            <h1 className="text-white font-black text-2xl sm:text-3xl" style={{ fontFamily: 'var(--font-syne)' }}>
              Anime News
            </h1>
          </div>
          <p className="text-[#8892a4] text-sm">
            {total > 0 ? `${total} articles` : 'Latest'} from the anime world — updated daily
          </p>
        </div>

        {/* Top Ad Banner */}
        <AdBanner format="horizontal" className="mb-8" />

        {/* Source Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {SOURCE_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activeTab === key
                  ? 'bg-[#e85d04] text-white shadow-lg shadow-[#e85d04]/20'
                  : 'bg-[#0d1117] border border-[#1a2235] text-[#8892a4] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}

          {/* Tag filter indicator */}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-purple-500/20 border border-purple-500/30 text-purple-400"
            >
              <Filter className="w-4 h-4" />
              #{selectedTag} ×
            </button>
          )}
        </div>

        {loading ? (
          // Skeleton loader
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#0d1117] border border-[#1a2235] overflow-hidden animate-pulse">
                <div className="h-48 bg-[#1a2235]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#1a2235] rounded-lg w-3/4" />
                  <div className="h-3 bg-[#1a2235] rounded-lg w-full" />
                  <div className="h-3 bg-[#1a2235] rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24">
            <span className="text-6xl mb-4 block">🎌</span>
            <p className="text-white font-bold text-lg mb-2">No articles found</p>
            <p className="text-[#8892a4] text-sm">Try a different filter or check back soon</p>
          </div>
        ) : (
          <>
            {/* Featured Articles (page 1, no tag filter) */}
            {page === 1 && !selectedTag && featured.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-[#e85d04]" />
                  <h2 className="text-white font-black text-lg" style={{ fontFamily: 'var(--font-syne)' }}>Featured</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featured.map(a => (
                    <ArticleCard key={a.id} article={a} variant="featured" />
                  ))}
                </div>
              </div>
            )}

            {/* Popular Tags */}
            {page === 1 && popularTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selectedTag === tag
                        ? 'bg-[#e85d04]/20 border-[#e85d04]/40 text-[#e85d04]'
                        : 'bg-[#0d1117] border-[#1a2235] text-[#8892a4] hover:border-[#e85d04]/30 hover:text-white'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Mid-page ad */}
            {page === 1 && gridArticles.length > 3 && (
              <AdBanner format="horizontal" className="mb-8" />
            )}

            {/* Trending Now Sidebar layout */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main Grid */}
              <div className="flex-1">
                {gridArticles.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-[#e85d04]" />
                      <h2 className="text-white font-black text-lg" style={{ fontFamily: 'var(--font-syne)' }}>
                        {selectedTag ? `#${selectedTag}` : 'Latest News'}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                      {gridArticles.map(a => (
                        <ArticleCard key={a.id} article={a} variant="default" />
                      ))}
                    </div>
                  </>
                )}

                {/* Pagination */}
                <Pagination
                  page={page}
                  pages={totalPages}
                  onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              </div>

              {/* Sidebar */}
              <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
                <AdBanner format="rectangle" className="w-full" sticky />
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
