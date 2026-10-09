"use client";

import type { MatchResult } from "@/lib/matching";
import { Badge } from "@/components/ui/badge";

export function MatchCard({ match, direction }: { match: MatchResult; direction: "mentor" | "project" }) {
  const percent = Math.round(match.score * 100);
  const color =
    percent >= 80 ? "text-emerald-600" : percent >= 60 ? "text-amber-600" : "text-zinc-500";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold">{match.name}</h4>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{match.title}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-xl font-bold tabular-nums ${color}`}>{percent}</p>
          <p className="text-[10px] text-zinc-400">匹配度</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-[10px]">
          语义 {(match.semanticScore * 100).toFixed(0)}%
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          标签 {(match.tagScore * 100).toFixed(0)}%
        </Badge>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-[11px] font-medium text-zinc-400">推荐理由</p>
        <ul className="space-y-1">
          {match.reasons.slice(0, 3).map((r, i) => (
            <li key={i} className="flex gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
              {r}
            </li>
          ))}
        </ul>
      </div>

      {match.suggestions.length > 0 && (
        <div className="mt-2">
          <p className="mb-1 text-[11px] font-medium text-zinc-400">对接建议</p>
          <ul className="space-y-1">
            {match.suggestions.slice(0, 2).map((s, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
