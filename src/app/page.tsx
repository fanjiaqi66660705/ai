import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Users, ShieldQuestion, Search, ArrowRight } from "lucide-react";

const cards = [
  { title: "收录项目", value: "--", desc: "科创项目总数", accent: "from-indigo-500 to-sky-500" },
  { title: "入库导师", value: "--", desc: "校内外导师 / 专家", accent: "from-emerald-500 to-teal-500" },
  { title: "匹配推荐", value: "--", desc: "AI 已完成的双向推荐", accent: "from-violet-500 to-purple-500" },
  { title: "BP 压测", value: "--", desc: "已完成模拟评审场次", accent: "from-orange-500 to-rose-500" },
];

const modules = [
  {
    href: "/projects",
    title: "师生双向智能匹配",
    desc: "AI 语义理解，为项目推荐最合适的导师",
    icon: Users,
    grad: "from-indigo-600 to-sky-500",
  },
  {
    href: "/bp",
    title: "赛事 BP 压力测试",
    desc: "AI 扮演挑剔国赛评委，五轮灵魂拷问",
    icon: ShieldQuestion,
    grad: "from-orange-500 to-rose-500",
  },
  {
    href: "/assistant",
    title: "科创资源检索助手",
    desc: "自然语言提问，混合检索带引用回答",
    icon: Search,
    grad: "from-emerald-600 to-teal-500",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      {/* Hero 横幅 */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 p-6 text-white shadow-lg shadow-indigo-500/25">
        <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl" />
        <h2 className="relative text-xl font-bold sm:text-2xl">AI 科创项目孵化工作台</h2>
        <p className="relative mt-1 text-sm text-indigo-100">
          挖掘优质科创项目 · 对接校内外导师 · 打磨竞赛作品
        </p>
      </div>

      {/* 三大 AI 模块入口 */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${m.grad} text-white shadow-md`}
            >
              <m.icon className="h-5 w-5" />
            </div>
            <p className="font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {m.title}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{m.desc}</p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              进入模块
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </p>
          </Link>
        ))}
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.title}
            className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.accent}`} />
            <p className="text-sm text-zinc-500">{c.title}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{c.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{c.desc}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
