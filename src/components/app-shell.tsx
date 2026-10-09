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
  { href: "/projects", label: "项目库", icon: FolderKanban },
  { href: "/mentors", label: "导师库", icon: Users },
  { href: "/bp", label: "BP 压力测试", icon: ShieldQuestion },
  { href: "/assistant", label: "资源检索助手", icon: Search },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
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
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
