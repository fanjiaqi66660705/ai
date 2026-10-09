"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { MatchCard } from "@/components/match-card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import type { MatchResult } from "@/lib/matching";

interface MentorItem {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  bio: string;
  capacity: number;
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [selected, setSelected] = useState<MentorItem | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matching, setMatching] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [mTitle, setMTitle] = useState("");
  const [expertise, setExpertise] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/mentors");
    setMentors(await res.json());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function runMatch(mentor: MentorItem) {
    setSelected(mentor);
    setMatching(true);
    setMatches([]);
    const res = await fetch(`/api/mentors/${mentor.id}/match`);
    setMatches(await res.json());
    setMatching(false);
  }

  async function submitMentor() {
    if (!name.trim() || !mTitle.trim()) return;
    setSubmitting(true);
    await fetch("/api/mentors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        title: mTitle.trim(),
        expertise: expertise.split(/[,，\s]+/).filter(Boolean),
        bio: bio.trim(),
      }),
    });
    setSubmitting(false);
    setShowForm(false);
    setName("");
    setMTitle("");
    setExpertise("");
    setBio("");
    await refresh();
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">导师库</h2>
          <p className="text-sm text-zinc-500">
            校内外导师与专家档案，点击查看 AI 为其推荐的对口项目
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {showForm ? "取消" : "+ 新增导师"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-medium">新增导师档案</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="姓名"
              className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
            />
            <input
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              placeholder="职称 / 单位，如：教授 · 计算机学院"
              className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
            />
          </div>
          <input
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            placeholder="擅长领域，用逗号分隔，如：机器人, 控制工程"
            className="mt-3 w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="个人简介：研究经历、带教成绩、产业资源"
            rows={3}
            className="mt-3 w-full resize-none rounded-lg border border-zinc-200 bg-transparent p-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
          />
          <button
            onClick={submitMentor}
            disabled={submitting || !name.trim() || !mTitle.trim()}
            className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            保存导师档案
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {mentors.map((m) => (
          <button
            key={m.id}
            onClick={() => runMatch(m)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              selected?.id === m.id
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <h4 className="text-sm font-semibold">{m.name}</h4>
            <p className="mt-0.5 text-xs text-zinc-500">{m.title}</p>
            <p className="mt-2 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">{m.bio}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {m.expertise.slice(0, 4).map((e) => (
                <Badge key={e} variant="secondary" className="text-[10px]">
                  {e}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-zinc-400">剩余带教名额：{m.capacity}</p>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium">
              AI 为「{selected.name}」推荐的对口项目
            </h3>
          </div>
          {matching && (
            <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 正在匹配项目…
            </div>
          )}
          {!matching && matches.length > 0 && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} direction="project" />
              ))}
            </div>
          )}
          {!matching && matches.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 py-12 text-center text-sm text-zinc-400 dark:border-zinc-700">
              暂无对口项目。先去项目库登记一个项目，再回来查看匹配结果。
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
