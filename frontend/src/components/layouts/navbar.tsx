"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Menu, Moon, Sun, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/store/sidebar";
import { useUserStore } from "@/store/user";

export function Navbar() {
  const pathname = usePathname();
  const { toggleOpen } = useSidebarStore();
  const { user } = useUserStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDarkMode = document.documentElement.classList.contains("dark");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(isDarkMode);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleOpen}
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <span className="font-secondary text-lg font-bold text-foreground">
              Ecommerce<span className="text-primary">Hub</span>
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={`transition-colors hover:text-primary ${
              pathname === "/"
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            Platform Home
          </Link>
          <Link
            href="/dashboard"
            className={`transition-colors hover:text-primary ${
              pathname.startsWith("/dashboard")
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-full"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {user ? (
            <Link href="/dashboard">
              <Button variant="outline" size="md" className="gap-2">
                <UserIcon className="h-4 w-4" />
                <span>{user.name || user.full_name}</span>
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="md">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="md">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
