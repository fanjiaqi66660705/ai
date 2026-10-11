"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ShieldQuestion,
  Search,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "总览", icon: LayoutDashboard },
  { href: "/projects", label: "项目库", icon: FolderKanban },
  { href: "/mentors", label: "导师库", icon: Users },
  { href: "/bp", label: "BP 压力测试", icon: ShieldQuestion },
  { href: "/assistant", label: "资源检索助手", icon: Search },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* 移动端顶部栏 */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-sm font-bold">AI 科创孵化</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-600 dark:text-zinc-400"
          aria-label="切换菜单"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* 移动端抽屉菜单 */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <nav
            className="absolute left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-white p-4 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* 桌面端侧边栏 */}
      <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white p-4 md:block dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 px-2">
          <h1 className="text-sm font-bold leading-tight">AI 科创孵化</h1>
          <p className="text-xs text-zinc-500">全生命周期工作台</p>
        </div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 主内容区：移动端留出顶部栏高度，桌面端正常内边距 */}
      <main className="flex-1 overflow-y-auto p-4 pt-18 md:p-8">
        {children}
      </main>
    </div>
  );
}
