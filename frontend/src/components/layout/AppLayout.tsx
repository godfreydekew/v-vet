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
        <div key={location.pathname} className="animate-fade-in">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
