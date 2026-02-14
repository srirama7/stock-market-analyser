import { useEffect, useState } from 'react';
import { useMarketStore } from '../store/marketStore';
import { getIndices, getGainersLosers, getMarketBreadth, getSectorPerformance } from '../api/client';
import IndexCard from '../components/dashboard/IndexCard';
import MarketBreadthBar from '../components/dashboard/MarketBreadthBar';
import GainersLosersTable from '../components/dashboard/GainersLosersTable';
import SectorHeatmap from '../components/dashboard/SectorHeatmap';
import type { MarketBreadth, GainerLoser, SectorPerformance, IndexData } from '../types';

export default function Dashboard() {
  const wsIndices = useMarketStore((s) => s.indices);
  const [restIndices, setRestIndices] = useState<IndexData[]>([]);
  const [breadth, setBreadth] = useState<MarketBreadth | null>(null);
  const [gainers, setGainers] = useState<GainerLoser[]>([]);
  const [losers, setLosers] = useState<GainerLoser[]>([]);
  const [sectors, setSectors] = useState<SectorPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const indices = wsIndices.length > 0 ? wsIndices : restIndices;

  useEffect(() => {
    async function loadData() {
      try {
        const [idx, gl, br, sec] = await Promise.allSettled([
          getIndices(),
          getGainersLosers(5),
          getMarketBreadth(),
          getSectorPerformance(),
        ]);

        if (idx.status === 'fulfilled') setRestIndices(idx.value);
        if (gl.status === 'fulfilled') {
          setGainers(gl.value.gainers || []);
          setLosers(gl.value.losers || []);
        }
        if (br.status === 'fulfilled') setBreadth(br.value);
        if (sec.status === 'fulfilled') setSectors(sec.value);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading market data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-100">Market Overview</h1>

      {/* Index Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {indices.map((idx) => (
          <IndexCard key={idx.name} index={idx} />
        ))}
      </div>

      {/* Breadth */}
      {breadth && <MarketBreadthBar breadth={breadth} />}

      {/* Gainers/Losers + Sectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GainersLosersTable title="Top Gainers" data={gainers} />
        <GainersLosersTable title="Top Losers" data={losers} />
        <SectorHeatmap sectors={sectors} />
      </div>
    </div>
  );
}
