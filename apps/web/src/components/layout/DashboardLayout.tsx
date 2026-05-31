"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Map,
  Bell,
  User,
  Users,
  Plus,
  Search,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const navItems = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/map", icon: Map, label: "Map" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed h-full z-20">
        {/* Logo */}
        <div className="p-6">
          <Link href="/feed" className="flex items-center gap-2">
            <span className="text-2xl">☀️</span>
            <span className="text-xl font-bold gradient-summer bg-clip-text text-transparent">
              SummerMate
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Create Activity CTA */}
        <div className="p-4">
          <Link
            href="/activities/create"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-summer text-white font-semibold shadow-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create Activity
          </Link>
        </div>

        {/* User */}
        {user && (
          <div className="p-4 border-t border-border">
            <Link href="/profile" className="flex items-center gap-3 hover:opacity-80">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full gradient-summer flex items-center justify-center text-white font-bold text-sm">
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user.city ?? "Explorer"}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        {/* Top bar — mobile */}
        <header className="lg:hidden sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <Link href="/feed" className="flex items-center gap-2">
            <span>☀️</span>
            <span className="font-bold text-primary">SummerMate</span>
          </Link>
          <Link href="/search">
            <Search className="w-5 h-5 text-muted-foreground" />
          </Link>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Bottom nav — mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border flex items-center justify-around px-2 py-2 safe-area-bottom">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[48px]",
              pathname === href || pathname.startsWith(href + "/")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
        <Link
          href="/activities/create"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-primary"
        >
          <div className="w-8 h-8 rounded-full gradient-summer flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-medium text-primary">New</span>
        </Link>
      </nav>
    </div>
  );
}
