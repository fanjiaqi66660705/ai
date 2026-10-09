import { NextRequest, NextResponse } from "next/server";
import { retrieve, type RetrievalResult } from "@/lib/retrieval";
import { chat } from "@/lib/llm";

/** 判断 LLM 返回的是否是 mock 兜底内容（JSON 或固定兜底文案） */
function isMockAnswer(answer: string): boolean {
  if (!answer) return true;
  const t = answer.trim();
  if (t.startsWith("{") && t.endsWith("}")) return true;
  if (t.includes("模拟回复") || t.includes("请配置")) return true;
  return false;
}

/** 基于检索结果动态生成结构化回答（mock 模式下使用） */
function buildAnswerFromSources(query: string, results: RetrievalResult[]): string {
  const cases = results.filter((r) => r.resource.category === "金奖案例");
  const frameworks = results.filter((r) => r.resource.category === "开源框架");
  const experience = results.filter((r) => r.resource.category === "赛事经验");
  const docs = results.filter((r) => r.resource.category === "技术文档");

  const lines: string[] = [];
  lines.push("根据知识库检索，为你整理以下资源：");

  if (cases.length > 0) {
    lines.push("\n**往届金奖案例**");
    cases.forEach((r, i) => {
      const idx = results.indexOf(r) + 1;
      lines.push(`- 《${r.resource.title}》[${idx}]：${r.resource.content.slice(0, 60)}…`);
    });
  }
  if (frameworks.length > 0) {
    lines.push("\n**推荐开源框架**");
    frameworks.forEach((r) => {
      const idx = results.indexOf(r) + 1;
      lines.push(`- 《${r.resource.title}》[${idx}]：${r.resource.content.slice(0, 60)}…`);
    });
  }
  if (experience.length > 0) {
    lines.push("\n**赛事经验**");
    experience.forEach((r) => {
      const idx = results.indexOf(r) + 1;
      lines.push(`- 《${r.resource.title}》[${idx}]`);
    });
  }
  if (docs.length > 0) {
    lines.push("\n**技术文档**");
    docs.forEach((r) => {
      const idx = results.indexOf(r) + 1;
      lines.push(`- 《${r.resource.title}》[${idx}]`);
    });
  }
  lines.push(
    "\n建议：先精读金奖案例的技术路线和落地数据，再对照开源框架快速搭建原型，最后用赛事经验打磨 BP 与答辩。点击下方引用来源可查看完整内容。",
  );
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "问题不能为空" }, { status: 400 });
  }

  const results = await retrieve(query, 5);

  // 构建上下文
  const context = results
    .map(
      (r, i) =>
        `[${i + 1}] 《${r.resource.title}》\n分类：${r.resource.category}\n来源：${r.resource.source}\n内容：${r.resource.content}\n标签：${r.resource.tags.join("、")}`,
    )
    .join("\n\n");

  const answer = await chat(
    [
      {
        role: "system",
        content:
          "你是科创资源检索助手。基于给定的参考资料回答用户问题，要求：1. 紧扣问题，分点回答；2. 必须在相关句子末尾标注来源编号，如 [1][3]；3. 如果资料不足以回答，明确说明并给出可探索方向；4. 推荐技术栈时说明适用场景。只输出最终回答。",
      },
      {
        role: "user",
        content: `用户问题：${query}\n\n参考资料：\n${context}`,
      },
    ],
    { temperature: 0.3 },
  );

  // mock 兜底：若 LLM 返回的是 JSON 或空内容，则基于检索结果动态生成结构化回答
  const finalAnswer = isMockAnswer(answer) ? buildAnswerFromSources(query, results) : answer;

  return NextResponse.json({
    answer: finalAnswer,
    sources: results.map((r) => ({
      id: r.resource.id,
      title: r.resource.title,
      category: r.resource.category,
      source: r.resource.source,
      content: r.resource.content,
      tags: r.resource.tags,
      score: Math.round(r.score * 100) / 100,
    })),
  });
}
