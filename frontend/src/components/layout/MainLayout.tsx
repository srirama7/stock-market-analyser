import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomTabNav from './BottomTabNav';
import { useMarketWebSocket } from '../../hooks/useWebSocket';

export default function MainLayout() {
  useMarketWebSocket();

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-dark">
      {/* Ambient glow */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />

      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 pb-20 md:pb-4">
          <Outlet />
        </main>
      </div>
      <BottomTabNav />
    </div>
  );
}
