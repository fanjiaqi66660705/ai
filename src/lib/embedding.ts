const apiKey = process.env.EMBEDDING_API_KEY;
const baseURL = process.env.EMBEDDING_BASE_URL;
const model = process.env.EMBEDDING_MODEL || "embedding-3";
const dim = Number(process.env.EMBEDDING_DIM || 1024);

/**
 * 生成文本向量。未配置 API Key 时返回确定性伪向量（基于文本哈希），
 * 保证相同文本产生相同向量，使相似度计算在演示阶段仍有意义。
 */
export async function embed(text: string): Promise<number[]> {
  if (!apiKey || !baseURL) {
    return pseudoVector(text, dim);
  }
  const res = await fetch(`${baseURL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: text }),
  });
  const data = await res.json();
  return data.data[0].embedding as number[];
}

/**
 * 特征哈希伪向量（演示降级方案）：
 * 抽取「字符二元组（中文相似度经典特征）+ 拉丁词」作为特征，
 * 每个特征哈希到某一维度并带符号累加，再 L2 归一化。
 * 共享词汇/子串的文本余弦相似度自然偏高——无 API Key 时匹配仍真实可信。
 */
function pseudoVector(text: string, dim: number): number[] {
  const normalized = text.toLowerCase();
  const features: string[] = [];

  // 拉丁/数字单词
  const words = normalized.match(/[a-z0-9]+/g) ?? [];
  for (const w of words) {
    features.push(w);
    // 词内字符二元组，捕捉 yolo/yolov8 等近似词
    for (let i = 0; i < w.length - 1; i++) features.push(w.slice(i, i + 2));
  }

  // 中文字符二元组
  const cjk = normalized.match(/[\u4e00-\u9fff]+/g) ?? [];
  for (const seg of cjk) {
    for (let i = 0; i < seg.length - 1; i++) features.push(seg.slice(i, i + 2));
  }

  const vec = new Array<number>(dim).fill(0);
  for (const f of features) {
    const h = hashStr(f);
    const idx = Math.abs(h) % dim;
    // 用独立哈希决定符号，缓解哈希碰撞
    const sign = hashStr(f + "#sign") & 1 ? 1 : -1;
    vec[idx] += sign;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return norm === 0 ? vec : vec.map((v) => v / norm);
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const x of setA) if (setB.has(x)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}
