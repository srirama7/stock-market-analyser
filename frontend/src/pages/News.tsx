import { useEffect, useState } from 'react';
import { getNews } from '../api/client';
import { timeAgo } from '../utils/formatters';
import { Newspaper, ExternalLink, Search } from 'lucide-react';
import type { NewsArticle } from '../types';

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

  const sourceColors: Record<string, string> = {
    'Economic Times': 'bg-blue-500/20 text-blue-400',
    'Moneycontrol': 'bg-purple-500/20 text-purple-400',
    'LiveMint': 'bg-green-500/20 text-green-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Newspaper className="w-5 h-5" /> Market News
        </h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by stock or keyword..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">
          Search
        </button>
      </form>

      {/* Articles */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading news...</div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${sourceColors[article.source] || 'bg-slate-700 text-slate-400'}`}>
                      {article.source}
                    </span>
                    {article.published_at && (
                      <span className="text-xs text-slate-500">
                        {timeAgo(article.published_at)}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0 mt-1" />
              </div>
            </a>
          ))}
          {articles.length === 0 && (
            <div className="text-center py-8 text-slate-500">No news articles found</div>
          )}
        </div>
      )}
    </div>
  );
}
