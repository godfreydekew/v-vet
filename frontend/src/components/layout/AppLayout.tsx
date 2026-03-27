import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import MobileNav from './MobileNav';
import DesktopSidebar from './DesktopSidebar';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <DesktopSidebar />
      <main className="flex-1 min-h-screen pb-20 md:pb-0">
        {/* Mobile top header — logo only, hidden on desktop */}
        <header className="md:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-2.5">
          <img src="/logo.png" alt="V-Vet" className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-base font-bold text-foreground">V-Vet</span>
        </header>
        <div key={location.pathname} className="animate-fade-in">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
