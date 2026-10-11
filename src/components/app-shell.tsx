"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ShieldQuestion,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "总览", icon: LayoutDashboard },
  { href: "/projects", label: "项目", icon: FolderKanban },
  { href: "/mentors", label: "导师", icon: Users },
  { href: "/bp", label: "BP", icon: ShieldQuestion },
  { href: "/assistant", label: "检索", icon: Search },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* 移动端顶部标题栏 */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-zinc-200 bg-white px-4 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-sm font-bold">AI 科创孵化</h1>
        <span className="ml-2 text-xs text-zinc-500">全生命周期工作台</span>
      </header>

      {/* 桌面端侧边栏 */}
      <aside className="hidden w-40 shrink-0 border-r border-zinc-200 bg-white p-3 md:block dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 px-1">
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
                  "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 主内容区：移动端留出顶部栏与底部标签栏高度 */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 pt-16 md:p-8 md:pb-8">
        {children}
      </main>

      {/* 移动端底部标签栏 */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-zinc-200 bg-white md:hidden dark:border-zinc-800 dark:bg-zinc-900">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400 dark:text-zinc-500",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              {label}
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
