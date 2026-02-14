import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useMarketWebSocket } from '../../hooks/useWebSocket';

export default function MainLayout() {
  useMarketWebSocket();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
