import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Film, Image, Users, Wrench, BookOpen,
  GitBranch, MessageSquare, Leaf, Phone, AlignLeft, LogOut, GalleryHorizontal,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/media", label: "Media Library", icon: GalleryHorizontal },
  { to: "/hero", label: "Hero Section", icon: Film },
  { to: "/logos", label: "Client Logos", icon: Image },
  { to: "/about", label: "Studio (About)", icon: Users },
  { to: "/services", label: "Services", icon: Wrench },
  { to: "/projects", label: "Projects", icon: BookOpen },
  { to: "/process", label: "Process Steps", icon: GitBranch },
  { to: "/testimonials", label: "Testimonials", icon: MessageSquare },
  { to: "/sustainability", label: "Sustainability", icon: Leaf },
  { to: "/contact", label: "Contact / CTA", icon: Phone },
  { to: "/footer", label: "Footer", icon: AlignLeft },
  { to: "/bio", label: "Bio Page", icon: Users },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <span className="font-semibold tracking-tight">
          Construct<span className="text-sidebar-accent-foreground opacity-60">/</span>Scenery
        </span>
        <span className="ml-2 rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-accent-foreground">
          ADMIN
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 px-1 text-xs text-sidebar-foreground/50">{user?.email}</div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
