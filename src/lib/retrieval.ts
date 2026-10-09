import { embed, cosineSimilarity, jaccard } from "./embedding";
import { resourceStore, type Resource } from "./resource-store";
import { chat } from "./llm";

/**
 * 混合检索：
 * 1. LLM 查询改写（扩展关键词、提炼技术意图）
 * 2. 双路召回：向量 Top-K ∪ 关键词 BM25 Top-K
 * 3. 加权融合重排
 */
export interface RetrievalResult {
  resource: Resource;
  score: number;
  vectorScore: number;
  keywordScore: number;
}

/** BM25 简化版关键词评分 */
function bm25Score(queryTokens: string[], doc: Resource): number {
  const docTokens = tokenize(`${doc.title} ${doc.content} ${doc.tags.join(" ")}`);
  const docLen = docTokens.length;
  const avgLen = 100;
  const k1 = 1.5;
  const b = 0.75;
  let score = 0;
  for (const q of queryTokens) {
    const tf = docTokens.filter((t) => t === q).length;
    if (tf === 0) continue;
    const idf = Math.log(1 + (15 - 1) / 1); // 简化：假设词频出现在约 1 篇文档
    score +=
      idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * docLen) / avgLen)));
  }
  return score;
}

/** 中英文分词：中文按字二元组 + 拉丁词 */
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const lower = text.toLowerCase();
  const words = lower.match(/[a-z0-9]+/g) ?? [];
  tokens.push(...words);
  const cjk = lower.match(/[\u4e00-\u9fff]+/g) ?? [];
  for (const seg of cjk) {
    for (let i = 0; i < seg.length - 1; i++) tokens.push(seg.slice(i, i + 2));
    // 单字也加入
    for (let i = 0; i < seg.length; i++) tokens.push(seg[i]);
  }
  return tokens;
}

/** LLM 查询改写：扩展关键词 */
async function rewriteQuery(query: string): Promise<{ keywords: string[]; intent: string }> {
  const res = await chat(
    [
      {
        role: "system",
        content:
          "你是科创检索助手。将用户的自然语言问题改写为检索友好的关键词列表（中英文，含技术名词、应用场景、赛事名称），并提炼技术意图。只输出 JSON：{\"keywords\":[\"...\"],\"intent\":\"...\"}",
      },
      { role: "user", content: query },
    ],
    { json: true, temperature: 0.2 },
  );
  try {
    const parsed = JSON.parse(res);
    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      intent: String(parsed.intent ?? ""),
    };
  } catch {
    return { keywords: [], intent: "" };
  }
}

export async function retrieve(query: string, topK = 5): Promise<RetrievalResult[]> {
  const resources = await resourceStore.list();

  // ① 查询改写
  const { keywords } = await rewriteQuery(query);
  const queryTokens = tokenize(query);
  const allTokens = [...queryTokens, ...keywords.flatMap(tokenize)];

  // ② 向量检索
  const qEmb = await embed(query);
  const withVector = resources.map((r) => ({
    r,
    vectorScore: cosineSimilarity(qEmb, r.embedding),
  }));

  // ③ 关键词 BM25 + 标签 Jaccard
  const withKeyword = withVector.map(({ r, vectorScore }) => {
    const bm25 = bm25Score(allTokens, r);
    const tagJac = jaccard(allTokens, r.tags);
    // 归一化 BM25：取最大值的比例
    const keywordScore = bm25 > 0 ? Math.min(1, bm25 / 12) + 0.5 * tagJac : 0.5 * tagJac;
    return { r, vectorScore, keywordScore };
  });

  // ④ 加权融合：0.5 向量 + 0.5 关键词
  const fused = withKeyword
    .map(({ r, vectorScore, keywordScore }) => ({
      resource: r,
      vectorScore,
      keywordScore,
      score: 0.5 * vectorScore + 0.5 * keywordScore,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return fused;
}
