// 大模型调用层（浏览器端可运行）
// - 未配置 Key 时使用本地 mock，保证静态部署可零配置演示
// - 可在浏览器 localStorage 写入 llm_api_key（及可选 llm_base_url）启用真实模型
//   例如在控制台执行：localStorage.setItem("llm_api_key", "你的Key")
// - 本地 dev 也支持服务端环境变量 LLM_API_KEY / LLM_BASE_URL

const DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
const model = "glm-4-flash";

interface RuntimeConfig {
  key?: string;
  base: string;
}

function getConfig(): RuntimeConfig {
  if (typeof window !== "undefined") {
    return {
      key: window.localStorage.getItem("llm_api_key") ?? undefined,
      base: window.localStorage.getItem("llm_base_url") ?? DEFAULT_BASE_URL,
    };
  }
  return {
    key: process.env.LLM_API_KEY,
    base: process.env.LLM_BASE_URL ?? DEFAULT_BASE_URL,
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * 调用大模型聊天接口（OpenAI 兼容协议，原生 fetch，无 SDK 依赖）。
 * 未配置 API Key 或调用失败时返回 mock 内容，保证演示不中断。
 */
export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; json?: boolean } = {},
): Promise<string> {
  const { key, base } = getConfig();
  if (!key) return mockChat(messages);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.3,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("LLM 空响应");
    return String(content);
  } catch {
    return mockChat(messages);
  }
}

function mockChat(messages: ChatMessage[]): string {
  const last = messages[messages.length - 1]?.content ?? "";
  const system = messages[0]?.content ?? "";
  // 只依据系统提示词路由（系统提示词由我们控制，避免被用户内容中的词误匹配）
  if (system.includes("科创项目分析助手")) {
    return JSON.stringify({
      domain: last.includes("农业") || last.includes("农") ? "智慧农业" : "人工智能",
      techStack: last.includes("视觉") || last.includes("YOLO")
        ? ["计算机视觉", "目标检测", "深度学习"]
        : last.includes("大模型") || last.includes("RAG")
          ? ["大模型", "RAG", "向量数据库"]
          : ["软件开发", "算法"],
      needs: last.includes("农业") || last.includes("农")
        ? ["农业场景对接", "硬件落地指导"]
        : ["技术方案指导", "商业模式打磨"],
    });
  }
  if (system.includes("匹配助手")) {
    // 根据候选内容动态生成，让不同项目的演示都有合理输出
    const isAgri = last.includes("农业") || last.includes("病虫害") || last.includes("农");
    return JSON.stringify([
      { id: "m1", match_score: isAgri ? 0.93 : 0.88, reasons: ["深耕计算机视觉 12 年，熟悉目标检测全链路", "指导过多个国赛获奖项目，擅长边缘部署优化"], suggestions: ["可重点请教模型轻量化与部署方案"] },
      { id: "m2", match_score: isAgri ? 0.89 : 0.72, reasons: ["农业信息化方向资深专家", "有丰富的智慧农业产业落地资源"], suggestions: ["可探讨场景落地与数据获取"] },
      { id: "m3", match_score: 0.76, reasons: ["连续多年担任国赛评委", "擅长商业模式与 BP 打磨"], suggestions: ["可在商业计划书阶段重点对接"] },
      { id: "m4", match_score: isAgri ? 0.68 : 0.84, reasons: ["RAG 与大模型应用工业经验丰富"], suggestions: ["若项目引入大模型能力可重点请教"] },
      { id: "m5", match_score: 0.61, reasons: ["硬件设计与嵌入式方向资深导师"], suggestions: ["硬件选型阶段可寻求指导"] },
    ]);
  }
  if (last.includes("视觉") || last.includes("农业")) {
    return JSON.stringify({
      answer: "基于视觉的农业监测是国赛热门方向，推荐以下技术栈和案例：",
      resources: [
        { title: "YOLOv8 病虫害检测", source: "GitHub", tags: ["CV", "农业"] },
        { title: "2023 互联网+金奖：智农天眼", source: "往届案例", tags: ["金奖", "农业"] },
      ],
    });
  }
  return JSON.stringify({ content: "（模拟回复）请配置 LLM_API_KEY 后获取真实 AI 回答。" });
}
