'use client';

/**
 * /admin — AnimePulse Admin Dashboard
 * 
 * Features:
 *  - Password-protected login
 *  - Article management: list, approve, reject, edit, delete
 *  - AutoPilot controls: run, toggle on/off, view stats
 *  - Real-time stats: total, pending, published, avg quality score
 *  - Filter by status
 *  - Inline content editing
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle, XCircle, Eye, Clock, RefreshCw, Lock,
  Trash2, BarChart2, Zap, Newspaper, TrendingUp, AlertCircle,
  Edit3, Save, X, Play, Pause, ChevronDown, ChevronUp,
  Shield, Activity, Settings, Star,
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  publishedAt: string;
  tags: string[];
  readTime?: number;
  status?: 'draft' | 'published' | 'rejected';
  editorialNote?: string;
  verdict?: string;
  qualityScore?: number;
  scoreBreakdown?: {
    sourceCredibility: number;
    recency: number;
    keywords: number;
    titleQuality: number;
    total: number;
  };
}

interface AutopilotStatus {
  lastRun?: string;
  articlesAdded?: number;
  skippedScore?: number;
  skippedDuplicate?: number;
  todayCount?: number;
  dailyLimit?: number;
  publishThreshold?: number;
  errors?: string[];
}

interface Stats {
  total: number;
  draft: number;
  published: number;
  rejected: number;
  avgScore: number;
}

type FilterType = 'draft' | 'published' | 'rejected' | 'all';

// ─── Score Badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-green-500/15 text-green-400 border-green-500/30' :
    score >= 55 ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
    'bg-red-500/15 text-red-400 border-red-500/30';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}
    </span>
  );
}

// ─── Score Tooltip ────────────────────────────────────────────────────────────

function ScoreDetails({ breakdown }: { breakdown: Article['scoreBreakdown'] }) {
  const [open, setOpen] = useState(false);
  if (!breakdown) return null;
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-[#8892a4] hover:text-white flex items-center gap-1"
      >
        <BarChart2 className="w-3 h-3" /> breakdown {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="absolute top-6 left-0 z-50 bg-[#0d1117] border border-[#1a2235] rounded-xl p-3 min-w-[200px] text-xs shadow-xl">
          <div className="space-y-1.5">
            {[
              { label: 'Source', value: breakdown.sourceCredibility, max: 30 },
              { label: 'Recency', value: breakdown.recency, max: 25 },
              { label: 'Keywords', value: breakdown.keywords, max: 30 },
              { label: 'Title Quality', value: breakdown.titleQuality, max: 15 },
            ].map(({ label, value, max }) => (
              <div key={label}>
                <div className="flex justify-between text-[#8892a4] mb-0.5">
                  <span>{label}</span>
                  <span>{value}/{max}</span>
                </div>
                <div className="h-1.5 bg-[#1a2235] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#e85d04] rounded-full"
                    style={{ width: `${(value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-1 border-t border-[#1a2235] flex justify-between font-bold text-white">
              <span>Total</span>
              <span>{breakdown.total}/100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  article,
  password,
  onSave,
  onClose,
}: {
  article: Article;
  password: string;
  onSave: (updated: Partial<Article>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(article.title);
  const [summary, setSummary] = useState(article.summary);
  const [tags, setTags] = useState((article.tags || []).join(', '));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-review-password': password },
        body: JSON.stringify({
          action: 'edit',
          id: article.id,
          title,
          summary,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      onSave({ title, summary, tags: tags.split(',').map(t => t.trim()).filter(Boolean) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-[#1a2235] rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold">Edit Article</h2>
          <button onClick={onClose} className="text-[#8892a4] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#8892a4] mb-1 block">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#080b14] border border-[#1a2235] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e85d04]/50"
            />
          </div>
          <div>
            <label className="text-xs text-[#8892a4] mb-1 block">Summary (SEO)</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={3}
              className="w-full bg-[#080b14] border border-[#1a2235] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e85d04]/50 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-[#8892a4] mb-1 block">Tags (comma separated)</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full bg-[#080b14] border border-[#1a2235] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e85d04]/50"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#e85d04] to-[#f48c06] text-white font-bold rounded-xl disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          <button onClick={onClose} className="px-5 bg-[#080b14] border border-[#1a2235] text-[#8892a4] rounded-xl">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [articles, setArticles]         = useState<Article[]>([]);
  const [loading, setLoading]           = useState(true);
  const [password, setPassword]         = useState('');
  const [authed, setAuthed]             = useState(false);
  const [filter, setFilter]             = useState<FilterType>('draft');
  const [updating, setUpdating]         = useState<string | null>(null);
  const [runningPilot, setRunningPilot] = useState(false);
  const [pilotResult, setPilotResult]   = useState<string | null>(null);
  const [autopilotStatus, setAutopilotStatus] = useState<AutopilotStatus | null>(null);
  const [stats, setStats]               = useState<Stats>({ total: 0, draft: 0, published: 0, rejected: 0, avgScore: 0 });
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);

  function checkAuth() {
    const expected = 'ABCDEFGH@@';
    if (password === expected) {
      setAuthed(true);
    } else {
      alert('Wrong password');
    }
  }

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const [articlesRes, statusRes] = await Promise.all([
        fetch('/api/articles?limit=300&status=all'),
        fetch('/api/articles?type=autopilot-status'),
      ]);
      const articlesData = await articlesRes.json();
      const statusData = await statusRes.json();

      const all: Article[] = articlesData.articles || [];
      setArticles(all);
      setAutopilotStatus(statusData.status);

      const draft     = all.filter(a => a.status === 'draft').length;
      const published = all.filter(a => !a.status || a.status === 'published').length;
      const rejected  = all.filter(a => a.status === 'rejected').length;
      const scores    = all.map(a => a.qualityScore || 0).filter(s => s > 0);
      const avgScore  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      setStats({ total: all.length, draft, published, rejected, avgScore });
    } catch { /**/ }
    finally { setLoading(false); }
  }, []);

  async function updateStatus(id: string, status: 'published' | 'rejected') {
    setUpdating(id);
    try {
      await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-review-password': password },
        body: JSON.stringify({ action: 'updateStatus', id, status }),
      });
      setArticles(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { /**/ }
    finally { setUpdating(null); }
  }

  async function deleteArticle(id: string) {
    if (!confirm('Permanently delete this article?')) return;
    setUpdating(id);
    try {
      await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-review-password': password },
        body: JSON.stringify({ action: 'delete', id }),
      });
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch { /**/ }
    finally { setUpdating(null); }
  }

  async function triggerAutoPilot() {
    setRunningPilot(true);
    setPilotResult(null);
    try {
      const res = await fetch('/api/autopilot', {
        method: 'POST',
        headers: { 'x-cron-secret': password },
      });
      const data = await res.json();
      if (data.ok) {
        setPilotResult(
          `✅ Added ${data.added ?? 0} articles as drafts | Skipped: ${data.skippedScore ?? 0} (low score) + ${data.skippedDuplicate ?? 0} (duplicate)`
        );
      } else {
        setPilotResult(`❌ ${data.error || data.message || 'Unknown error'}`);
      }
      await loadArticles();
    } catch (e) {
      setPilotResult(`❌ ${String(e)}`);
    } finally {
      setRunningPilot(false);
    }
  }

  async function toggleAutopilot() {
    try {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-review-password': password },
        body: JSON.stringify({ action: 'toggleAutopilot', id: 'config' }),
      });
      const data = await res.json();
      setAutopilotEnabled(data.autopilotEnabled);
    } catch { /**/ }
  }

  function handleEditSave(updated: Partial<Article>) {
    if (!editingArticle) return;
    setArticles(prev =>
      prev.map(a => a.id === editingArticle.id ? { ...a, ...updated } : a)
    );
    setEditingArticle(null);
  }

  useEffect(() => { if (authed) loadArticles(); }, [authed, loadArticles]);

  // ── Login Screen ──────────────────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#e85d04] to-[#f48c06] flex items-center justify-center mb-3 shadow-lg shadow-orange-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-white font-black text-2xl" style={{ fontFamily: 'var(--font-syne)' }}>
            AnimePulse Admin
          </h1>
          <p className="text-[#8892a4] text-sm mt-1">Editorial Control Dashboard</p>
        </div>

        <div className="bg-[#0d1117] border border-[#1a2235] rounded-2xl p-6">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkAuth()}
            placeholder="Enter admin password"
            className="w-full bg-[#080b14] border border-[#1a2235] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e85d04]/50 mb-4 transition-colors"
          />
          <button
            onClick={checkAuth}
            className="w-full py-3 bg-gradient-to-r from-[#e85d04] to-[#f48c06] hover:opacity-90 text-white font-bold rounded-xl transition-opacity shadow-lg shadow-orange-500/20"
          >
            Access Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  const filtered = articles.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'published') return !a.status || a.status === 'published';
    return a.status === filter;
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080b14]">
      {editingArticle && (
        <EditModal
          article={editingArticle}
          password={password}
          onSave={handleEditSave}
          onClose={() => setEditingArticle(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white font-black text-2xl" style={{ fontFamily: 'var(--font-syne)' }}>
              Content Dashboard
            </h1>
            <p className="text-[#8892a4] text-sm mt-0.5">
              AnimePulse Admin · {articles.length} total articles
            </p>
          </div>
          <div className="flex gap-2">
            {/* AutoPilot Toggle */}
            <button
              onClick={toggleAutopilot}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                autopilotEnabled
                  ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                  : 'bg-[#0d1117] border-[#1a2235] text-[#8892a4] hover:text-white'
              }`}
            >
              {autopilotEnabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              AutoPilot {autopilotEnabled ? 'ON' : 'OFF'}
            </button>

            {/* Run AutoPilot */}
            <button
              onClick={triggerAutoPilot}
              disabled={runningPilot}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#e85d04] to-[#f48c06] hover:opacity-90 text-white text-sm font-bold rounded-xl transition-opacity disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
              {runningPilot ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {runningPilot ? 'Running…' : 'Run AutoPilot'}
            </button>

            <button
              onClick={loadArticles}
              className="flex items-center gap-2 px-3 py-2.5 bg-[#0d1117] border border-[#1a2235] rounded-xl text-[#8892a4] hover:text-white text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AutoPilot Result */}
        {pilotResult && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
            pilotResult.startsWith('✅')
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {pilotResult}
          </div>
        )}

        {/* AutoPilot Status Card */}
        {autopilotStatus && (
          <div className="mb-6 bg-[#0d1117] border border-[#1a2235] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#e85d04]" />
              <span className="text-white text-sm font-bold">AutoPilot Intelligence</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#080b14] rounded-xl p-3">
                <div className="text-[#8892a4] mb-1">Today's Articles</div>
                <div className="text-white font-bold">{autopilotStatus.todayCount ?? 0} / {autopilotStatus.dailyLimit ?? 5}</div>
              </div>
              <div className="bg-[#080b14] rounded-xl p-3">
                <div className="text-[#8892a4] mb-1">Quality Threshold</div>
                <div className="text-[#e85d04] font-bold">Score ≥ {autopilotStatus.publishThreshold ?? 55}</div>
              </div>
              <div className="bg-[#080b14] rounded-xl p-3">
                <div className="text-[#8892a4] mb-1">Low Score Skipped</div>
                <div className="text-yellow-400 font-bold">{autopilotStatus.skippedScore ?? 0}</div>
              </div>
              <div className="bg-[#080b14] rounded-xl p-3">
                <div className="text-[#8892a4] mb-1">Duplicates Skipped</div>
                <div className="text-blue-400 font-bold">{autopilotStatus.skippedDuplicate ?? 0}</div>
              </div>
            </div>
            {autopilotStatus.lastRun && (
              <p className="text-[#8892a4] text-xs mt-2">
                Last run: {new Date(autopilotStatus.lastRun).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total',     value: stats.total,     icon: Newspaper,   color: 'text-white' },
            { label: 'Pending',   value: stats.draft,     icon: AlertCircle, color: 'text-yellow-400' },
            { label: 'Published', value: stats.published, icon: TrendingUp,  color: 'text-green-400' },
            { label: 'Avg Score', value: `${stats.avgScore}`, icon: Star, color: 'text-[#e85d04]' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#0d1117] border border-[#1a2235] rounded-2xl p-4 hover:border-[#e85d04]/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-[#8892a4] text-xs font-medium">{label}</span>
              </div>
              <p className={`text-2xl font-black ${color}`} style={{ fontFamily: 'var(--font-syne)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {([
            { key: 'draft',     label: 'Pending Review', count: stats.draft },
            { key: 'published', label: 'Published',      count: stats.published },
            { key: 'rejected',  label: 'Rejected',       count: stats.rejected },
            { key: 'all',       label: 'All',            count: stats.total },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                filter === key
                  ? 'bg-[#e85d04] text-white'
                  : 'bg-[#0d1117] border border-[#1a2235] text-[#8892a4] hover:text-white'
              }`}
            >
              {label} <span className="ml-1 opacity-60">({count})</span>
            </button>
          ))}
        </div>

        {/* Article List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#e85d04] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#8892a4]">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nothing here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(article => (
              <div
                key={article.id}
                className="bg-[#0d1117] border border-[#1a2235] rounded-2xl p-5 hover:border-[#e85d04]/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        article.status === 'draft'    ? 'bg-yellow-500/10 text-yellow-400' :
                        article.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {article.status === 'draft' ? '⏳ Pending' : article.status === 'rejected' ? '❌ Rejected' : '✅ Published'}
                      </span>
                      {article.qualityScore !== undefined && (
                        <ScoreBadge score={article.qualityScore} />
                      )}
                      <span className="text-[#8892a4] text-xs">{article.source}</span>
                      {article.readTime && (
                        <span className="text-[#8892a4] text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />{article.readTime}m read
                        </span>
                      )}
                    </div>

                    <h3 className="text-white font-bold text-sm leading-snug mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-[#8892a4] text-xs line-clamp-2 mb-2">{article.summary}</p>

                    {article.verdict && (
                      <p className="text-xs text-[#e85d04] mb-2">{article.verdict}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {article.tags?.slice(0, 4).map(tag => (
                        <span key={tag} className="text-xs bg-[#080b14] border border-[#1a2235] text-[#8892a4] px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {article.scoreBreakdown && (
                        <ScoreDetails breakdown={article.scoreBreakdown} />
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link
                      href={`/news/${article.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#080b14] border border-[#1a2235] rounded-xl text-[#8892a4] hover:text-white text-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </Link>

                    <button
                      onClick={() => setEditingArticle(article)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#080b14] border border-[#1a2235] rounded-xl text-[#8892a4] hover:text-blue-400 hover:border-blue-500/20 text-xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>

                    {article.status !== 'published' && (
                      <button
                        onClick={() => updateStatus(article.id, 'published')}
                        disabled={!!updating}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 hover:bg-green-500/20 text-xs transition-colors disabled:opacity-40"
                      >
                        {updating === article.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <CheckCircle className="w-3.5 h-3.5" />
                        }
                        Publish
                      </button>
                    )}

                    {article.status !== 'rejected' && (
                      <button
                        onClick={() => updateStatus(article.id, 'rejected')}
                        disabled={!!updating}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 text-xs transition-colors disabled:opacity-40"
                      >
                        {updating === article.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <XCircle className="w-3.5 h-3.5" />
                        }
                        Reject
                      </button>
                    )}

                    <button
                      onClick={() => deleteArticle(article.id)}
                      disabled={!!updating}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#080b14] border border-[#1a2235] rounded-xl text-[#8892a4] hover:text-red-400 hover:border-red-500/20 text-xs transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
