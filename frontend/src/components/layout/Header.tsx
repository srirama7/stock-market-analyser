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

  // Check if market is open (IST: 9:15 AM - 3:30 PM, Mon-Fri)
  const now = new Date();
  const istOffset = 5.5 * 60;
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMin = utcMin + istOffset;
  const day = now.getUTCDay();
  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = istMin >= 555 && istMin <= 930; // 9:15 to 15:30
  const marketOpen = isWeekday && isMarketHours;

  return (
    <header
      className="h-14 bg-slate-900/40 backdrop-blur-xl border-b border-slate-700/50 flex items-center px-4 justify-between shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div ref={searchRef} className="relative w-64 sm:w-80" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search stocks... (e.g. RELIANCE, TCS)"
          className="w-full glass-input pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:glass-input-focus focus:outline-none"
        />
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 glass-card shadow-2xl z-50 max-h-64 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.symbol}
                onClick={() => handleSelect(r.symbol)}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-700/30 flex items-center justify-between transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <span className="font-medium text-sm text-slate-200">{r.symbol}</span>
                <span className="text-xs text-slate-500 truncate ml-2">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Market status */}
        <span className={`hidden sm:inline text-xs px-2 py-1 rounded-full ${
          marketOpen
            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'bg-slate-700/30 text-slate-500 border border-slate-700/30'
        }`}>
          {marketOpen ? 'Market Open' : 'Market Closed'}
        </span>

        {/* Connection status */}
        {isConnected ? (
          <span className="flex items-center gap-1.5 text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 animate-live-pulse" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Live</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-600" />
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Offline</span>
          </span>
        )}
      </div>
    </header>
  );
}
