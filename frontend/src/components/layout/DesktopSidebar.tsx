import { Home, Stethoscope, ClipboardList, CalendarCheck, Settings, LayoutDashboard, Users, Building2, Bug as Cow, ShieldCheck, Sun, Moon, LogOut } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const farmerNav = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/farms', icon: Building2, label: 'My Farms' },
  { to: '/vet-requests', icon: Stethoscope, label: 'Vet Requests' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const vetNav = [
  { to: '/vet/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/vet/cases', icon: ClipboardList, label: 'Cases' },
  { to: '/vet/followups', icon: CalendarCheck, label: 'Follow-ups' },
  { to: '/vet/settings', icon: Settings, label: 'Settings' },
];

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/farmers', icon: Users, label: 'Farmers' },
  { to: '/admin/vets', icon: Stethoscope, label: 'Vets' },
  { to: '/admin/farms', icon: Building2, label: 'Farms' },
  { to: '/admin/livestock', icon: Cow, label: 'Livestock' },
  { to: '/admin/requests', icon: ShieldCheck, label: 'Requests' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function DesktopSidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const items = user?.role === 'admin' ? adminNav : user?.role === 'vet' ? vetNav : farmerNav;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            V
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">V-Vet</h1>
            <p className="text-[10px] text-muted-foreground tracking-wide">Livestock health intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = item.to === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive ? 'text-primary bg-primary-subtle' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-0.5">
        <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 w-full">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
            {(user?.full_name ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.full_name ?? user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
