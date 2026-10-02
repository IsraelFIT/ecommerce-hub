"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Layers,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/store/sidebar";
import { useUserStore } from "@/store/user";
import { clearAuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Orders & Volume", href: "/dashboard", icon: ShoppingBag },
  { title: "Settings", href: "/dashboard", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleCollapsed, isOpen, setOpen } = useSidebarStore();
  const { user, clearUser } = useUserStore();

  const handleLogout = () => {
    clearAuthSession();
    clearUser();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out md:static",
          isCollapsed ? "w-18" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/60">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm tracking-tight truncate">
                Hub Console
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="hidden md:flex ml-auto text-muted-foreground"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isCollapsed && "justify-center px-2",
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-3">
          {user && !isCollapsed && (
            <div className="mb-2 px-2 py-1">
              <p className="text-xs font-semibold truncate">{user.name || user.full_name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive gap-2",
              isCollapsed && "justify-center px-0",
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Log out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
