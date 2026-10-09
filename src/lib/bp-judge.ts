import { chat } from "./llm";
import { bpStore, type BpSession } from "./bp-store";

export const DIMENSIONS = ["痛点分析", "技术壁垒", "商业模式", "团队配置", "落地验证"] as const;

const QUESTION_BANK: Record<string, string[]> = {
  痛点分析: [
    "你说解决了人工效率低的痛点——这个痛点有数据支撑吗？目标用户现在是怎么解决的？他们真的愿意为改变现状掏钱吗？",
    "这个痛点是「锦上添花」还是「雪中送炭」？用户不用你的产品会损失什么？量化一下。",
  ],
  技术壁垒: [
    "你的技术壁垒到底是什么？如果大厂或竞品投入资源，多久能复制你的方案？有专利、论文或独有数据集吗？",
    "你用的都是开源方案吧？那你的核心创新点在哪里？抄你门槛有多高？",
  ],
  商业模式: [
    "谁付钱？凭什么付给你而不是竞品？把单位经济模型算给我听：一单收入多少、成本多少、毛利多少？",
    "你的获客成本算过吗？学校资源加持下的成功，离开校园后怎么规模化？",
  ],
  团队配置: [
    "这个赛道需要的能力你们团队齐了吗？缺的短板怎么补？凭什么是你们能做成？",
    "团队成员的技术和商业背景分别是什么？指导老师在本方向有实际产出吗？",
  ],
  落地验证: [
    "到目前为止有多少真实用户或试点？有没有可验证的数据——留存率、复购、试用反馈？别跟我说「预计」。",
    "你说有合作意向——有盖章的协议吗？「意向」和「落地」是两回事，拿出证据。",
  ],
};

const MOCK_COMMENTS_HIGH = [
  "回答得还算扎实，有数据意识。但我还没被说服，继续。",
  "这个回答勉强及格。不过说出来的和做出来的，往往是两回事。",
];
const MOCK_COMMENTS_LOW = [
  "这个回答太空了，全是形容词没有数字。国赛评委不会买账。",
  "我在问证据，你在给我讲故事。重新组织你的答案逻辑。",
];

/** 评委追问的简短毒舌点评（mock 模式根据回答质量选择） */
function mockComment(answer: string): string {
  const hasData = /\d|%|元|位|家|份|个/.test(answer) && answer.length > 30;
  return hasData ? MOCK_COMMENTS_HIGH[0] : MOCK_COMMENTS_LOW[0];
}

/** 生成第 N 轮拷问问题。round 从 0 开始。 */
export async function askQuestion(
  session: BpSession,
  round: number,
): Promise<{ comment: string; question: string }> {
  const dimension = DIMENSIONS[round];
  const comment =
    round === 0
      ? "BP 我看完了。表面上像模像样，但我要开始拷问了，别想蒙混过关。"
      : mockComment(session.rounds[round - 1]?.answer ?? "");

  const llm = await chat(
    [
      {
        role: "system",
        content:
          "你是互联网+/挑战杯国赛评委，以严苛和挑剔著称。这是第" +
          (round + 1) +
          "轮拷问，聚焦【" +
          dimension +
          "】维度。先给上一轮回答一句简短毒舌的点评（第一轮则点评BP本身），再发起本维度的灵魂拷问，问题要尖锐具体直击要害。只输出 JSON：{\"comment\":\"...\",\"question\":\"...\"}",
      },
      {
        role: "user",
        content:
          "BP标题：" +
          session.title +
          "\nBP内容：" +
          session.bpText.slice(0, 800) +
          "\n历史问答：" +
          JSON.stringify(session.rounds),
      },
    ],
    { json: true, temperature: 0.6 },
  );

  try {
    const parsed = JSON.parse(llm);
    if (parsed.comment && parsed.question) return parsed;
  } catch {
    // 降级到本地题库
  }
  const bank = QUESTION_BANK[dimension];
  return { comment, question: bank[round % bank.length] };
}

const SCORE_KEYWORDS: Record<string, string[]> = {
  痛点分析: ["调研", "数据", "访谈", "问卷", "用户反馈", "%", "报告"],
  技术壁垒: ["专利", "论文", "自研", "独家", "数据集", "壁垒", "软著"],
  商业模式: ["付费", "收入", "毛利", "成本", "定价", "客户", "元", "B端", "C端"],
  团队配置: ["团队", "老师", "经验", "获奖", "分工", "专业", "补"],
  落地验证: ["试点", "签约", "用户", "试用", "合作", "留存", "MOU", "上线"],
};

const SUGGESTION_BANK: Record<string, { low: string; mid: string; high: string }> = {
  痛点分析: {
    low: "补充一手调研数据：至少 30 份问卷或 5 次深度访谈，用数字证明痛点真实存在",
    mid: "增加竞品对比：现有方案为什么解决不了这个痛点，你的替代优势是什么",
    high: "痛点验证充分，建议补一条「痛点-方案-收益」的量化因果链",
  },
  技术壁垒: {
    low: "尽快申请 1-2 项专利或软著，整理出自研模块清单，把「用开源」升级为「改开源」",
    mid: "明确核心技术指标并与 SOTA 对比，用表格呈现领先幅度",
    high: "壁垒论述清晰，建议补充技术路线图的护城河演进规划",
  },
  商业模式: {
    low: "算清单位经济模型：客单价、获客成本、毛利率，缺一不可",
    mid: "设计分层定价策略，明确 B 端和 C 端各自的价值主张",
    high: "商业逻辑自洽，建议补充 3 年财务预测的关键假设",
  },
  团队配置: {
    low: "补齐商业/运营短板成员，明确每位成员与岗位的对应关系",
    mid: "为导师背景增加具体产出证据（项目、论文、产业资源）",
    high: "团队结构完整，建议补充股权与决策机制说明",
  },
  落地验证: {
    low: "先落地一个可量化的试点：哪怕 1 个班级、1 个大棚，拿出真实使用数据",
    mid: "把「合作意向」升级为盖章协议，补充试用期留存数据",
    high: "验证数据扎实，建议增加规模化复制的里程碑计划",
  },
};

function heuristicScore(dimension: string, answer: string): number {
  const keywords = SCORE_KEYWORDS[dimension] ?? [];
  const hits = keywords.filter((k) => answer.includes(k)).length;
  let score = 4 + hits * 1.2;
  if (answer.length > 80) score += 0.8;
  if (answer.length > 200) score += 0.5;
  if (answer.length < 25) score -= 1.5;
  return Math.max(3, Math.min(9, Math.round(score)));
}

export interface BpReport {
  scores: Record<string, number>;
  suggestions: Record<string, string>;
  verdict: string;
  total: number;
}

/** 终局报告：五维评分 + 逐维度修改建议 + 总评 */
export async function generateReport(session: BpSession): Promise<BpReport> {
  const llm = await chat(
    [
      {
        role: "system",
        content:
          "你是互联网+/挑战杯国赛评委。根据BP和五轮拷问记录，给出终局评审。只输出 JSON：{\"scores\":{\"痛点分析\":1-10整数,\"技术壁垒\":...,\"商业模式\":...,\"团队配置\":...,\"落地验证\":...},\"suggestions\":{\"痛点分析\":\"具体修改建议\",\"...\":\"...\"},\"verdict\":\"两句话总评，先肯定后指出最大短板\"}",
      },
      {
        role: "user",
        content:
          "BP标题：" +
          session.title +
          "\nBP内容：" +
          session.bpText.slice(0, 800) +
          "\n五轮拷问记录：" +
          JSON.stringify(session.rounds),
      },
    ],
    { json: true, temperature: 0.4 },
  );

  try {
    const parsed = JSON.parse(llm);
    // 结构校验：五个维度评分齐全才采用，否则落入启发式评分
    if (typeof parsed.scores !== "object" || parsed.scores === null) {
      throw new Error("invalid report schema");
    }
    const scores: Record<string, number> = {};
    const suggestions: Record<string, string> = {};
    for (const d of DIMENSIONS) {
      scores[d] = Math.max(1, Math.min(10, Number(parsed.scores?.[d]) || 5));
      suggestions[d] = String(parsed.suggestions?.[d] ?? SUGGESTION_BANK[d].mid);
    }
    return {
      scores,
      suggestions,
      verdict: String(parsed.verdict ?? ""),
      total: Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / 5) * 10) / 10,
    };
  } catch {
    // 降级：启发式评分
  }

  const scores: Record<string, number> = {};
  const suggestions: Record<string, string> = {};
  for (const round of session.rounds) {
    const score = heuristicScore(round.dimension, round.answer);
    scores[round.dimension] = score;
    const bank = SUGGESTION_BANK[round.dimension];
    suggestions[round.dimension] =
      score < 6 ? bank.low : score <= 7 ? bank.mid : bank.high;
  }
  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
  const verdict =
    avg < 5
      ? "项目方向尚可，但按国赛标准还差得远：数据支撑和落地证据是最大短板。先补证据，再谈打磨。"
      : avg <= 6.5
        ? "具备省赛竞争力，框架完整但细节经不起追问。按各维度建议逐项补强，国赛可以冲一冲。"
        : "已具备国赛水准的项目框架，论证链条完整。接下来重点是打磨路演表达和答辩细节。";
  return {
    scores,
    suggestions,
    verdict,
    total: Math.round(avg * 10) / 10,
  };
}
