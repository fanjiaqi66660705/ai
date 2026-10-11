"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { MatchCard } from "@/components/match-card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, X } from "lucide-react";
import type { MatchResult } from "@/lib/matching";
import { clientApi } from "@/lib/client-api";

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  tags: string[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<ProjectItem | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matching, setMatching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");

  const refresh = useCallback(async () => {
    setProjects(await clientApi.listProjects());
  }, []);

  async function submitProject() {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    const project = await clientApi.createProject({
      title: title.trim(),
      description: description.trim(),
      techStack: techStack.split(/[,，\s]+/).filter(Boolean),
    });
    setSubmitting(false);
    setShowForm(false);
    setTitle("");
    setDescription("");
    setTechStack("");
    await refresh();
    await runMatch(project);
  }

  async function runMatch(project: ProjectItem) {
    setSelected(project);
    setMatching(true);
    setMatches([]);
    const matches = await clientApi.matchProject(project.id);
    setMatches(matches);
    setMatching(false);
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">项目库</h2>
          <p className="text-sm text-zinc-500">
            登记科创项目，AI 自动抽取技术标签并推荐对口导师
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {showForm ? "取消" : "+ 新建项目"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-medium">新建项目</h3>
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="项目名称，如：智农天眼——基于视觉的农作物病虫害监测系统"
              className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="项目简介：要解决的痛点、核心技术、应用场景（写得越具体，AI 匹配越精准）"
              rows={4}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-transparent p-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
            />
            <input
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="技术栈，用逗号分隔，如：YOLOv8, PyTorch, 边缘计算"
              className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
            />
            <button
              onClick={submitProject}
              disabled={submitting || !title.trim() || !description.trim()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Sparkles className="h-3.5 w-3.5" />
              提交并 AI 匹配导师
            </button>
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => runMatch(p)}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                selected?.id === p.id
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <span className="font-medium">{p.title}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{selected.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{selected.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {selected.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <button onClick={() => { setSelected(null); setMatches([]); }} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {matching && (
        <div className="flex items-center gap-2 py-10 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          AI 正在双路召回并精排导师…
        </div>
      )}

      {!matching && matches.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} direction="mentor" />
          ))}
        </div>
      )}

      {!selected && projects.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-400 dark:border-zinc-700">
          暂无项目，点击右上角「新建项目」开始登记
        </div>
      )}
    </AppShell>
  );
}
