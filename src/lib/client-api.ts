// 浏览器端服务层：静态部署时代替 /api 路由，直接在浏览器内运行全部 AI 逻辑。
// 匹配 / BP 评审 / RAG 均为纯计算模块（store/matching/bp-judge/retrieval），
// 数据存于页面内存，刷新重置，零后端依赖。
import { store, type Project, type Mentor } from "./store";
import {
  extractTags,
  matchMentorsForProject,
  matchProjectsForMentor,
  type MatchResult,
} from "./matching";
import { bpStore } from "./bp-store";
import { askQuestion, generateReport, DIMENSIONS } from "./bp-judge";
import { retrieve, type RetrievalResult } from "./retrieval";
import { chat } from "./llm";

/** 去掉 embedding 字段后返回给 UI */
function stripEmbedding<T extends { embedding?: number[] }>(list: T[]) {
  return list.map((item) => {
    const { embedding: _e, ...rest } = item;
    return rest;
  });
}

export const clientApi = {
  // ---------- 项目 ----------
  async listProjects() {
    return stripEmbedding(await store.listProjects());
  },

  async createProject(input: { title: string; description: string; techStack: string[] }) {
    const { domain, techStack: aiTags, needs } = await extractTags(
      `${input.title} ${input.description} ${input.techStack.join(" ")}`,
    );
    const tags = Array.from(new Set([domain, ...input.techStack, ...aiTags, ...needs]));
    const project = await store.createProject({ ...input, tags });
    return stripEmbedding([project])[0];
  },

  async matchProject(id: string): Promise<MatchResult[]> {
    const project = (await store.listProjects()).find((p) => p.id === id);
    if (!project) throw new Error("项目不存在");
    return matchMentorsForProject(project);
  },

  // ---------- 导师 ----------
  async listMentors() {
    return stripEmbedding(await store.listMentors());
  },

  async createMentor(input: {
    name: string;
    title: string;
    expertise: string[];
    bio: string;
    capacity?: number;
  }) {
    const mentor = await store.createMentor({ ...input, capacity: input.capacity ?? 3 });
    return stripEmbedding([mentor])[0];
  },

  async matchMentor(id: string): Promise<MatchResult[]> {
    const mentor = (await store.listMentors()).find((m) => m.id === id);
    if (!mentor) throw new Error("导师不存在");
    return matchProjectsForMentor(mentor);
  },

  // ---------- BP 压力测试 ----------
  async bpStart(title: string, bpText: string) {
    const session = bpStore.create(title, bpText);
    const { comment, question } = await askQuestion(session, 0);
    return {
      sessionId: session.id,
      comment,
      question,
      dimension: DIMENSIONS[0],
      round: 1,
      totalRounds: 5,
    };
  },

  async bpAnswer(sessionId: string, answer: string, question: string) {
    const session = bpStore.get(sessionId);
    if (!session) throw new Error("会话不存在或已过期");
    session.rounds.push({
      dimension: DIMENSIONS[session.rounds.length],
      question,
      answer,
    });
    if (session.rounds.length >= 5) {
      session.done = true;
      return { done: true as const };
    }
    const { comment, question: nextQuestion } = await askQuestion(
      session,
      session.rounds.length,
    );
    return {
      done: false as const,
      comment,
      question: nextQuestion,
      dimension: DIMENSIONS[session.rounds.length],
      round: session.rounds.length + 1,
      totalRounds: 5,
    };
  },

  async bpReport(sessionId: string) {
    const session = bpStore.get(sessionId);
    if (!session) throw new Error("会话不存在或已过期");
    return generateReport(session);
  },

  // ---------- RAG 资源检索 ----------
  async askAssistant(query: string) {
    const results = await retrieve(query, 5);
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
        { role: "user", content: `用户问题：${query}\n\n参考资料：\n${context}` },
      ],
      { temperature: 0.3 },
    );

    const finalAnswer = isMockAnswer(answer)
      ? buildAnswerFromSources(results)
      : answer;

    return {
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
    };
  },
};

function isMockAnswer(answer: string): boolean {
  if (!answer) return true;
  const t = answer.trim();
  if (t.startsWith("{") && t.endsWith("}")) return true;
  if (t.includes("模拟回复") || t.includes("请配置")) return true;
  return false;
}

/** mock 模式下基于检索结果动态生成结构化回答 */
function buildAnswerFromSources(results: RetrievalResult[]): string {
  const cases = results.filter((r) => r.resource.category === "金奖案例");
  const frameworks = results.filter((r) => r.resource.category === "开源框架");
  const experience = results.filter((r) => r.resource.category === "赛事经验");
  const docs = results.filter((r) => r.resource.category === "技术文档");

  const lines: string[] = ["根据知识库检索，为你整理以下资源："];
  const pushGroup = (title: string, group: RetrievalResult[], brief = true) => {
    if (group.length === 0) return;
    lines.push(`\n**${title}**`);
    for (const r of group) {
      const idx = results.indexOf(r) + 1;
      const desc = brief ? `：${r.resource.content.slice(0, 60)}…` : "";
      lines.push(`- 《${r.resource.title}》[${idx}]${desc}`);
    }
  };
  pushGroup("往届金奖案例", cases);
  pushGroup("推荐开源框架", frameworks);
  pushGroup("赛事经验", experience, false);
  pushGroup("技术文档", docs, false);
  lines.push(
    "\n建议：先精读金奖案例的技术路线和落地数据，再对照开源框架快速搭建原型，最后用赛事经验打磨 BP 与答辩。点击下方引用来源可查看完整内容。",
  );
  return lines.join("\n");
}

export type { Project, Mentor };
