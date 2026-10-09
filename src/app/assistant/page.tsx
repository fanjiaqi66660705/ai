"use client";

import { useRef, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, BookOpen, ExternalLink } from "lucide-react";

interface Source {
  id: string;
  title: string;
  category: string;
  source: string;
  content: string;
  tags: string[];
  score: number;
}

interface ChatItem {
  role: "user" | "ai";
  text: string;
  sources?: Source[];
}

const SUGGESTIONS = [
  "想做基于视觉的农业监测，有哪些开源框架和往届国赛金奖案例？",
  "大模型 RAG 应用怎么搭？推荐哪些框架和向量数据库？",
  "互联网+国赛 BP 怎么写？评委怎么打分？",
];

export default function AssistantPage() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSources, setOpenSources] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, loading]);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    const query = q.trim();
    setItems((prev) => [...prev, { role: "user", text: query }]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) {
      setItems((prev) => [...prev, { role: "ai", text: data.error }]);
      return;
    }
    setItems((prev) => [
      ...prev,
      { role: "ai", text: data.answer, sources: data.sources },
    ]);
  }

  function toggleSource(idx: number) {
    setOpenSources((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "金奖案例":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
      case "开源框架":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
      case "赛事经验":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";
      default:
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">科创资源智能检索助手</h2>
        <p className="text-sm text-zinc-500">
          自然语言提问，RAG 检索往届金奖案例、开源框架、赛事经验，回答附引用来源
        </p>
      </div>

      <div className="flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="max-h-[480px] min-h-[320px] space-y-4 overflow-y-auto p-5">
          {items.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-3 h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-400">向科创知识库提问，试试下面的例子：</p>
              <div className="mt-4 grid w-full max-w-2xl gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="rounded-lg border border-zinc-200 px-4 py-2.5 text-left text-xs text-zinc-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-emerald-950/30"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {items.map((item, i) => (
            <div key={i} className={item.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  item.role === "user"
                    ? "rounded-br-sm bg-emerald-600 text-white"
                    : "rounded-bl-sm bg-zinc-50 text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-100"
                }`}
              >
                {item.text}

                {item.sources && item.sources.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                      <ExternalLink className="h-3 w-3" />
                      引用来源（点击展开）
                    </p>
                    {item.sources.map((src, idx) => (
                      <div key={src.id}>
                        <button
                          onClick={() => toggleSource(i * 100 + idx)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-zinc-700 text-[10px] font-medium text-white dark:bg-zinc-500">
                            {idx + 1}
                          </span>
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium ${categoryColor(src.category)}`}>
                            {src.category}
                          </span>
                          <span className="truncate text-xs text-zinc-600 dark:text-zinc-300">{src.title}</span>
                        </button>
                        {openSources.has(i * 100 + idx) && (
                          <div className="ml-7 mt-1 rounded-md bg-white p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                            <p className="leading-relaxed">{src.content}</p>
                            <p className="mt-2 text-[10px] text-zinc-400">来源：{src.source}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {src.tags.map((t) => (
                                <Badge key={t} variant="outline" className="text-[9px]">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              AI 正在检索知识库并生成回答…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t border-zinc-100 p-4 dark:border-zinc-800">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask(input);
            }}
            placeholder="向科创知识库提问，如：想做农业视觉监测有哪些开源框架和金奖案例？"
            className="flex-1 rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
          />
          <button
            onClick={() => ask(input)}
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <Search className="h-3.5 w-3.5" />
            提问
          </button>
        </div>
      </div>
    </AppShell>
  );
}
