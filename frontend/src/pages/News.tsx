import { useEffect, useState } from 'react';
import { getNews } from '../api/client';
import { timeAgo } from '../utils/formatters';
import { Newspaper, ExternalLink, Search } from 'lucide-react';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import type { NewsArticle } from '../types';

const sourceColors: Record<string, { bg: string; text: string; border: string }> = {
  'Economic Times': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-l-blue-500' },
  'Moneycontrol': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-l-purple-500' },
  'LiveMint': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-l-green-500' },
};

const defaultSource = { bg: 'bg-slate-700/30', text: 'text-slate-400', border: 'border-l-slate-500' };

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews(q?: string) {
    setLoading(true);
    try {
      const data = await getNews(q, 30);
      setArticles(data);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadNews(query || undefined);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text animate-fade-in-up flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-blue-400" /> Market News
        </h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by stock or keyword..."
            className="w-full glass-input pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:glass-input-focus focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all"
        >
          Search
        </button>
      </form>

      {/* Articles */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SkeletonLoader variant="card" count={6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {articles.map((article, i) => {
            const colors = sourceColors[article.source] || defaultSource;
            return (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block glass-card border-l-2 ${colors.border} p-4 hover:translate-x-1 transition-all duration-200 group animate-fade-in-up`}
                style={{ animationDelay: `${120 + i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text} border border-current/10`}>
                        {article.source}
                      </span>
                      {article.published_at && (
                        <span className="text-[11px] text-slate-600">
                          {timeAgo(article.published_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors" />
                </div>
              </a>
            );
          })}
          {articles.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Newspaper className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <div className="text-sm text-slate-500">No news articles found</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
