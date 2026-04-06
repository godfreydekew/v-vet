import {
  Home,
  Building2,
  Stethoscope,
  Settings,
  ClipboardList,
  CalendarCheck,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Bug as Cow,
  Menu,
  Mail,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const farmerNav = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/farms", icon: Building2, label: "Farms" },
  { to: "/vet-requests", icon: Stethoscope, label: "Requests" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const vetNav = [
  { to: "/vet/dashboard", icon: Home, label: "Home" },
  { to: "/vet/cases", icon: ClipboardList, label: "Cases" },
  { to: "/vet/followups", icon: CalendarCheck, label: "Follow-ups" },
  { to: "/vet/settings", icon: Settings, label: "Settings" },
];

const adminNav = [
  { to: "/admin", icon: LayoutDashboard, label: "Home" },
  { to: "/admin/farmers", icon: Users, label: "Farmers" },
  { to: "/admin/requests", icon: ShieldCheck, label: "Requests" },
  { to: "/admin/livestock", icon: Cow, label: "Livestock" },
  { to: "/admin/settings", icon: Menu, label: "More" },
];

export default function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();
  const items =
    user?.role === "admin"
      ? adminNav
      : user?.role === "vet"
        ? vetNav
        : farmerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around py-1">
        {items.map((item) => {
          const isActive =
            item.to === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[48px] min-h-[48px] justify-center rounded-lg transition-colors active:bg-accent"
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={`transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
