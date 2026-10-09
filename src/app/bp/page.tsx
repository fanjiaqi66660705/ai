"use client";

import { useRef, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RadarChart } from "@/components/radar-chart";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flame, User, FileCheck2, Gavel } from "lucide-react";

interface JudgeMsg {
  role: "judge" | "me";
  text: string;
  dimension?: string;
}

interface Report {
  scores: Record<string, number>;
  suggestions: Record<string, string>;
  verdict: string;
  total: number;
}

const DIMENSIONS = ["痛点分析", "技术壁垒", "商业模式", "团队配置", "落地验证"];

export default function BpPage() {
  const [bpTitle, setBpTitle] = useState("");
  const [bpText, setBpText] = useState("");
  const [session, setSession] = useState<{ id: string; round: number; dimension: string } | null>(null);
  const [messages, setMessages] = useState<JudgeMsg[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<"" | "start" | "answer" | "report">("");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function startTest() {
    if (!bpTitle.trim() || !bpText.trim()) return;
    setLoading("start");
    setReport(null);
    setMessages([]);
    const res = await fetch("/api/bp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: bpTitle.trim(), bpText: bpText.trim() }),
    });
    const data = await res.json();
    setLoading("");
    setSession({ id: data.sessionId, round: data.round, dimension: data.dimension });
    setMessages([
      { role: "judge", text: data.comment },
      { role: "judge", text: data.question, dimension: data.dimension },
    ]);
  }

  async function sendAnswer() {
    if (!input.trim() || !session || loading) return;
    const answer = input.trim();
    const lastQuestion = messages.filter((m) => m.role === "judge").slice(-1)[0]?.text ?? "";
    setMessages((m) => [...m, { role: "me", text: answer }]);
    setInput("");
    setLoading("answer");

    const res = await fetch(`/api/bp/${session.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, question: lastQuestion }),
    });
    const data = await res.json();
    setLoading("");

    if (data.done) {
      setMessages((m) => [
        ...m,
        { role: "judge", text: "五轮拷问结束。你的回答我都记下了——现在出具终局评审报告，看看你到底几斤几两。" },
      ]);
      await genReport(session.id);
    } else {
      setSession({ ...session, round: data.round, dimension: data.dimension });
      setMessages((m) => [
        ...m,
        { role: "judge", text: data.comment },
        { role: "judge", text: data.question, dimension: data.dimension },
      ]);
    }
  }

  async function genReport(id: string) {
    setLoading("report");
    const res = await fetch(`/api/bp/${id}/report`, { method: "POST" });
    const data = await res.json();
    setLoading("");
    if (!data.error) setReport(data);
  }

  const questioning = session && !report && loading !== "report";

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">BP 压力测试模拟器</h2>
        <p className="text-sm text-zinc-500">
          AI 扮演挑剔的国赛评委，五轮灵魂拷问，出具五维雷达评分与修改建议
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        {/* 左：对话区 */}
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {!session ? (
            <div className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                导入项目 BP
              </h3>
              <input
                value={bpTitle}
                onChange={(e) => setBpTitle(e.target.value)}
                placeholder="项目名称，如：智农天眼——病虫害视觉监测系统"
                className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
              />
              <textarea
                value={bpText}
                onChange={(e) => setBpText(e.target.value)}
                rows={10}
                placeholder="粘贴商业计划书摘要：痛点、方案、技术路线、商业模式、团队、进展…写得越全，评委拷问越狠"
                className="mt-3 w-full resize-none rounded-lg border border-zinc-200 bg-transparent p-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
              />
              <button
                onClick={startTest}
                disabled={loading === "start" || !bpTitle.trim() || !bpText.trim()}
                className="mt-3 flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
              >
                {loading === "start" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
                开始压力测试
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Gavel className="h-4 w-4 text-rose-600" />
                  国赛评委 · 拷问室
                </span>
                <Badge variant="outline" className="text-xs">
                  第 {Math.min(session.round, 5)} / 5 轮 · {session.dimension}
                </Badge>
              </div>
              <div className="max-h-[440px] min-h-[320px] space-y-3 overflow-y-auto p-5">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "me" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === "me"
                          ? "rounded-br-sm bg-emerald-600 text-white"
                          : "rounded-bl-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                      }`}
                    >
                      {m.role === "judge" && (
                        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-rose-500">
                          <Gavel className="h-3 w-3" />
                          {m.dimension ?? "评委"}
                        </p>
                      )}
                      {m.role === "me" && (
                        <p className="mb-1 flex items-center justify-end gap-1.5 text-[10px] text-emerald-100">
                          <User className="h-3 w-3" />
                          我
                        </p>
                      )}
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading === "answer" && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    评委正在酝酿下一轮拷问…
                  </div>
                )}
                {loading === "report" && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    评委正在撰写终局评审报告…
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              {questioning && (
                <div className="flex gap-2 border-t border-zinc-100 p-4 dark:border-zinc-800">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAnswer();
                      }
                    }}
                    rows={2}
                    placeholder="回答评委的拷问（有数据、有证据才能拿高分）… Enter 发送"
                    className="flex-1 resize-none rounded-lg border border-zinc-200 bg-transparent p-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
                  />
                  <button
                    onClick={sendAnswer}
                    disabled={loading === "answer" || !input.trim()}
                    className="self-end rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
                  >
                    回答
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 右：进度 / 报告面板 */}
        <div className="space-y-4">
          {!report ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-medium">拷问进度</h3>
              <div className="space-y-3">
                {DIMENSIONS.map((d, i) => {
                  const reached = session ? session.round > i || (session.round === i + 1 && true) : false;
                  const current = session?.round === i + 1;
                  const passed = session ? session.round > i + 1 : false;
                  return (
                    <div key={d} className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                          passed
                            ? "bg-emerald-600 text-white"
                            : current
                              ? "border-2 border-rose-500 text-rose-500"
                              : "border border-zinc-300 text-zinc-400 dark:border-zinc-600"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className={`text-sm ${current ? "font-medium text-rose-600" : passed ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}`}>
                        {d}
                      </span>
                      {current && <Loader2 className="h-3 w-3 animate-spin text-rose-500" />}
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 border-t border-zinc-100 pt-3 text-xs leading-relaxed text-zinc-400 dark:border-zinc-800">
                评委将从五个维度逐轮发难。回答越具体、数据越充分，评分越高。
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-1 text-sm font-medium">终局评审报告</h3>
              <p className="mb-2 text-xs text-zinc-400">五维雷达 · 综合得分 {report.total}/10</p>
              <RadarChart scores={report.scores} />
              <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                {report.verdict}
              </p>
              <div className="mt-4 space-y-3">
                <p className="text-[11px] font-medium text-zinc-400">逐维度修改建议</p>
                {DIMENSIONS.map((d) => (
                  <div key={d} className="flex gap-2 text-xs">
                    <Badge
                      variant={report.scores[d] >= 7 ? "default" : report.scores[d] >= 5 ? "secondary" : "destructive"}
                      className="h-5 shrink-0 px-1.5 text-[10px]"
                    >
                      {report.scores[d]}
                    </Badge>
                    <p className="leading-relaxed text-zinc-600 dark:text-zinc-300">
                      <span className="font-medium text-zinc-800 dark:text-zinc-100">{d}：</span>
                      {report.suggestions[d]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
