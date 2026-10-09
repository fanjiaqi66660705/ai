import { chat } from "./llm";
import { cosineSimilarity, jaccard } from "./embedding";
import { store, type Project, type Mentor } from "./store";

/** 用 LLM 从自由文本中抽取结构化标签 */
export async function extractTags(text: string): Promise<{
  domain: string;
  techStack: string[];
  needs: string[];
}> {
  const res = await chat(
    [
      {
        role: "system",
        content:
          "你是科创项目分析助手。从用户输入中提取：领域(domain，一个词)、技术栈(techStack，数组)、需求(needs，数组)。只输出 JSON。",
      },
      { role: "user", content: text },
    ],
    { json: true, temperature: 0.1 },
  );
  try {
    const parsed = JSON.parse(res);
    return {
      domain: parsed.domain ?? "未分类",
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
      needs: Array.isArray(parsed.needs) ? parsed.needs : [],
    };
  } catch {
    return { domain: "未分类", techStack: [], needs: [] };
  }
}

export interface MatchResult {
  id: string;
  name: string;
  title: string;
  score: number;
  semanticScore: number;
  tagScore: number;
  reasons: string[];
  suggestions: string[];
}

/**
 * 双向匹配核心：给项目推荐导师，或给导师推荐项目。
 * query: 查询方（项目或导师）的文本与标签
 * candidates: 候选列表
 */
export async function matchMentorsForProject(project: Project): Promise<MatchResult[]> {
  const mentors = await store.listMentors();
  return runMatch(project.embedding, project.tags, mentors, (m) => ({
    id: m.id,
    name: m.name,
    title: m.title,
    embedding: m.embedding,
    tags: m.tags,
    bio: m.bio,
  }));
}

export async function matchProjectsForMentor(mentor: Mentor): Promise<MatchResult[]> {
  const projects = await store.listProjects();
  return runMatch(mentor.embedding, mentor.tags, projects, (p) => ({
    id: p.id,
    name: p.title,
    title: p.description.slice(0, 60),
    embedding: p.embedding,
    tags: p.tags,
    bio: p.description,
  }));
}

interface Candidate {
  id: string;
  name: string;
  title: string;
  embedding: number[];
  tags: string[];
  bio: string;
}

async function runMatch(
  queryEmbedding: number[],
  queryTags: string[],
  list: Candidate[],
  pick: (c: any) => Candidate,
): Promise<MatchResult[]> {
  const candidates = list.map(pick);

  // ① 双路召回：语义 Top-20 ∪ 标签 Top-20
  const withSemantic = candidates.map((c) => ({
    ...c,
    semanticScore: cosineSimilarity(queryEmbedding, c.embedding),
  }));
  const semanticTop = [...withSemantic].sort((a, b) => b.semanticScore - a.semanticScore).slice(0, 20);

  const withTag = candidates.map((c) => ({
    ...c,
    tagScore: jaccard(queryTags, c.tags),
  }));
  const tagTop = [...withTag].sort((a, b) => b.tagScore - a.tagScore).slice(0, 20);

  const idSet = new Set([...semanticTop.map((s) => s.id), ...tagTop.map((t) => t.id)]);

  // ② 加权融合粗排：0.5 语义 + 0.3 标签 + 0.2 规则
  const rough = candidates
    .filter((c) => idSet.has(c.id))
    .map((c) => {
      const semanticScore = cosineSimilarity(queryEmbedding, c.embedding);
      const tagScore = jaccard(queryTags, c.tags);
      const ruleScore = 0.5; // 演示阶段固定，接库后可叠加容量、院系等规则
      const score = 0.5 * semanticScore + 0.3 * tagScore + 0.2 * ruleScore;
      return { ...c, semanticScore, tagScore, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // ③ LLM 精排：生成可解释的推荐理由
  const reranked = await rerankWithLLM(queryTags, rough);
  return reranked;
}

async function rerankWithLLM(
  queryTags: string[],
  candidates: (Candidate & { score: number; semanticScore: number; tagScore: number })[],
): Promise<MatchResult[]> {
  if (candidates.length === 0) return [];
  const res = await chat(
    [
      {
        role: "system",
        content:
          "你是科创项目导师匹配助手。根据查询方标签和候选导师信息，为每个候选生成推荐理由(reasons，2-3条具体理由)和建议(suggestions)。只输出 JSON 数组，每项包含 id、match_score、reasons、suggestions。",
      },
      {
        role: "user",
        content: `查询方标签：${JSON.stringify(queryTags)}\n候选：${JSON.stringify(
          candidates.map((c) => ({ id: c.id, name: c.name, title: c.title, bio: c.bio, score: c.score })),
        )}`,
      },
    ],
    { json: true, temperature: 0.3 },
  );
  let llmResults: Record<string, any> = {};
  try {
    const arr = JSON.parse(res);
    if (Array.isArray(arr)) {
      arr.forEach((r) => (llmResults[r.id] = r));
    }
  } catch {
    // 解析失败时降级
  }

  return candidates.map((c) => ({
    id: c.id,
    name: c.name,
    title: c.title,
    score: llmResults[c.id]?.match_score ?? Math.round(c.score * 100) / 100,
    semanticScore: Math.round(c.semanticScore * 100) / 100,
    tagScore: Math.round(c.tagScore * 100) / 100,
    reasons: llmResults[c.id]?.reasons ?? [`标签重合度 ${(c.tagScore * 100).toFixed(0)}%`, `语义相似度 ${(c.semanticScore * 100).toFixed(0)}%`],
    suggestions: llmResults[c.id]?.suggestions ?? ["可进一步沟通项目细节"],
  }));
}
