import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Wifi, WifiOff } from 'lucide-react';
import { searchStocks } from '../../api/client';
import { useMarketStore } from '../../store/marketStore';
import type { StockSearch } from '../../types';

export default function Header() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearch[]>([]);
  const [showResults, setShowResults] = useState(false);
  const isConnected = useMarketStore((s) => s.isConnected);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await searchStocks(query);
        setResults(data);
        setShowResults(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (symbol: string) => {
    setQuery('');
    setShowResults(false);
    navigate(`/chart?symbol=${symbol}`);
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-4 justify-between">
      <div ref={searchRef} className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search stocks... (e.g. RELIANCE, TCS)"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.symbol}
                onClick={() => handleSelect(r.symbol)}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between"
              >
                <span className="font-medium text-sm text-slate-200">{r.symbol}</span>
                <span className="text-xs text-slate-400 truncate ml-2">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm">
        {isConnected ? (
          <span className="flex items-center gap-1 text-green-400">
            <Wifi className="w-4 h-4" /> Live
          </span>
        ) : (
          <span className="flex items-center gap-1 text-slate-500">
            <WifiOff className="w-4 h-4" /> Offline
          </span>
        )}
      </div>
    </header>
  );
}
