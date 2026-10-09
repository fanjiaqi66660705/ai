import { AppShell } from "@/components/app-shell";

const cards = [
  { title: "收录项目", value: "--", desc: "科创项目总数" },
  { title: "入库导师", value: "--", desc: "校内外导师 / 专家" },
  { title: "匹配推荐", value: "--", desc: "AI 已完成的双向推荐" },
  { title: "BP 压测", value: "--", desc: "已完成模拟评审场次" },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <h2 className="mb-1 text-xl font-semibold">工作台总览</h2>
      <p className="mb-6 text-sm text-zinc-500">
        挖掘优质科创项目 · 对接校内外导师 · 打磨竞赛作品
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.title}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">{c.title}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{c.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{c.desc}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
