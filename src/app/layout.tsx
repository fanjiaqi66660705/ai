import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 科创孵化工作台",
  description: "科创项目全生命周期孵化：智能匹配 · BP 压测 · 资源检索",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-gradient-to-br from-indigo-50 via-white to-sky-100 text-zinc-900 antialiased dark:from-zinc-950 dark:via-zinc-950 dark:to-indigo-950/50 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
