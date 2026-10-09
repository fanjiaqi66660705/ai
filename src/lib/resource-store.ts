import { embed } from "./embedding";

export interface Resource {
  id: string;
  title: string;
  content: string;
  category: "金奖案例" | "开源框架" | "赛事经验" | "技术文档";
  source: string;
  tags: string[];
  embedding: number[];
}

// 种子资源库：往届金奖案例、开源框架、赛事经验、技术文档
const SEED: Omit<Resource, "embedding">[] = [
  {
    id: "r1",
    title: "2023 互联网+金奖：智农天眼——基于视觉的农作物病虫害监测",
    content:
      "项目以无人机搭载边缘计算设备，基于 YOLOv8 实时识别 20 余种农作物病虫害，准确率 94.6%。已在 3 省 12 县部署，服务面积超 8 万亩。技术核心：自研小样本数据增强算法、边缘端模型轻量化（INT8 量化后体积减少 75%）。商业模式：SaaS 订阅（8 元/亩/年）+ 硬件销售。答辩亮点：现场演示 1 分钟识别 5 种病害，评委高度认可落地数据。",
    category: "金奖案例",
    source: "第九届中国国际「互联网+」大学生创新创业大赛",
    tags: ["计算机视觉", "YOLOv8", "智慧农业", "边缘计算", "病虫害", "国赛金奖"],
  },
  {
    id: "r2",
    title: "2022 挑战杯金奖：智泊——基于视觉的地下车库智能导航系统",
    content:
      "针对地下车库 GPS 无信号的痛点，用单目视觉 + IMU 融合定位，在车辆前装摄像头即可实现厘米级导航。核心技术：VIO 视觉惯性里程计、稀疏图优化。落地：与 3 家车企达成前装合作，覆盖 200+ 车库。团队配置：5 名跨学科成员（算法/硬件/商业），指导老师为 SLAM 方向教授。",
    category: "金奖案例",
    source: "第十七届「挑战杯」全国大学生课外学术科技作品竞赛",
    tags: ["计算机视觉", "SLAM", "VIO", "智能导航", "挑战杯金奖", "车联网"],
  },
  {
    id: "r3",
    title: "2024 互联网+金奖：碳核算智能体——面向中小企业的碳排放自动核算平台",
    content:
      "基于大模型 + RAG 构建碳排放核算智能体，自动解析企业财务与生产数据生成合规碳报告。技术栈：LangChain + 向量数据库 + GLM-4。创新点：行业知识库覆盖 15 个细分行业的排放因子，报告自动对标 ISO 14064。已服务 80+ 中小企业，单客年费 1.2 万元。",
    category: "金奖案例",
    source: "第十届中国国际「互联网+」大学生创新创业大赛",
    tags: ["大模型", "RAG", "LangChain", "碳核算", "企业服务", "国赛金奖"],
  },
  {
    id: "r4",
    title: "YOLOv8 — Ultralytics 开源目标检测框架",
    content:
      "Ultralytics 出品的最新一代 YOLO 系列，支持目标检测、分割、分类、姿态估计四合一任务。精度超越 YOLOv5，推理速度提升 1.8 倍。支持 ONNX/TensorRT/OpenVINO 多平台部署，社区活跃、文档完善。推荐用于：实时目标检测、边缘部署。安装：pip install ultralytics。",
    category: "开源框架",
    source: "GitHub: ultralytics/ultralytics",
    tags: ["计算机视觉", "目标检测", "YOLOv8", "深度学习", "开源", "边缘部署"],
  },
  {
    id: "r5",
    title: "Segment Anything (SAM) — Meta 通用图像分割模型",
    content:
      "Meta 开源的通用分割基础模型，零样本泛化能力强，支持点/框/掩码三种交互方式。预训练模型在 1100 万张图像上训练，可直接用于医学影像、农业、遥感等领域的分割任务。配合自定义微调可达到 SOTA。适合快速原型验证。",
    category: "开源框架",
    source: "GitHub: facebookresearch/segment-anything",
    tags: ["计算机视觉", "图像分割", "SAM", "深度学习", "零样本", "开源"],
  },
  {
    id: "r6",
    title: "LangChain — 大模型应用开发框架",
    content:
      "主流 LLM 应用编排框架，内置 RAG、Agent、Memory 等模块。支持 70+ 模型提供商、30+ 向量数据库。核心概念：Chain 链式调用、Retriever 检索器、Tool 工具调用。适合快速搭建 RAG 问答、智能体等应用。文档：python.langchain.com。",
    category: "开源框架",
    source: "GitHub: langchain-ai/langchain",
    tags: ["大模型", "RAG", "LangChain", "Agent", "LLM", "开源"],
  },
  {
    id: "r7",
    title: "LlamaIndex — 面向数据的 LLM 框架",
    content:
      "专为数据接入和检索设计的 LLM 框架，强调文档索引与查询引擎。内置丰富的数据连接器（PDF/Word/网页/数据库）、多种索引结构（向量/树/关键词）。相比 LangChain 更聚焦 RAG 场景，上手简单。推荐用于企业知识库问答。",
    category: "开源框架",
    source: "GitHub: run-llama/llama_index",
    tags: ["大模型", "RAG", "LlamaIndex", "知识库", "LLM", "开源"],
  },
  {
    id: "r8",
    title: "国赛 BP 结构模板（互联网+/挑战杯通用）",
    content:
      "标准结构：1. 项目概述（一句话价值主张）；2. 痛点分析（数据+访谈，量化痛点）；3. 解决方案（核心技术+产品形态）；4. 技术壁垒（专利/论文/独有数据集）；5. 商业模式（单位经济模型：客单价/获客成本/毛利）；6. 市场规模（TAM/SAM/SOM）；7. 竞争分析（竞品对比矩阵）；8. 团队介绍（成员与岗位匹配）；9. 落地进展（真实数据>意向）；10. 财务预测（3 年，关键假设）。",
    category: "赛事经验",
    source: "校赛集训营内部资料",
    tags: ["BP", "商业计划书", "赛事经验", "互联网+", "挑战杯", "模板"],
  },
  {
    id: "r9",
    title: "国赛评委评分权重与扣分点",
    content:
      "互联网+评分权重：创新性 25%、商业性 20%、团队 20%、引领教育 15%、社会效益 20%。高频扣分点：① 痛点无数据支撑（扣 3-5 分）；② 技术用开源却不说壁垒（扣 2-4 分）；③ 商业模式算不清单位经济（扣 3 分）；④ 只有「意向合作」无真实落地（扣 3-5 分）；⑤ 路演超时（直接扣 1 分）。挑战杯更侧重技术深度与学术价值。",
    category: "赛事经验",
    source: "往届评委访谈整理",
    tags: ["赛事经验", "评分标准", "互联网+", "挑战杯", "答辩", "扣分点"],
  },
  {
    id: "r10",
    title: "技术文档：PyTorch 模型轻量化与边缘部署",
    content:
      "边缘部署三步法：① 模型剪枝（结构化剪枝，移除冗余通道，精度损失<2%）；② 量化（INT8 量化，体积减少 75%，推理加速 2-4 倍）；③ 编译优化（ONNX → TensorRT 或 OpenVINO）。工具：torch.onnx.export、onnxruntime、tensorrt。经验：量化后用校准数据集验证精度，优先量化后几层。",
    category: "技术文档",
    source: "PyTorch 官方文档 + 实践整理",
    tags: ["PyTorch", "模型轻量化", "边缘部署", "量化", "ONNX", "TensorRT"],
  },
  {
    id: "r11",
    title: "技术文档：向量数据库选型与 pgvector 实践",
    content:
      "数据量<100 万：pgvector（PostgreSQL 扩展）足够，运维零成本，支持余弦/欧氏/内积三种距离，可与业务表联合查询。数据量>100 万或高并发：考虑 Milvus/Qdrant/Weaviate。pgvector 用法：CREATE EXTENSION vector; CREATE TABLE items (embedding vector(1536)); SELECT * FROM items ORDER BY embedding <=> '[...]' LIMIT 5; 配合 IVFFlat 索引加速。",
    category: "技术文档",
    source: "pgvector 官方文档 + 工程实践",
    tags: ["向量数据库", "pgvector", "PostgreSQL", "RAG", "检索", "技术文档"],
  },
  {
    id: "r12",
    title: "2023 挑战杯金奖：灵枢——中医智能辅助诊断系统",
    content:
      "基于中医古籍知识库 + 大模型构建的辨证论治辅助系统，覆盖 200+ 常见证候。技术：RAG 检索《伤寒论》等古籍 + 知识图谱推理。落地：与 3 家中医院合作试点，辅助诊断准确率 89%。创新点：首个将古籍知识图谱与大模型结合的中医 AI 系统。",
    category: "金奖案例",
    source: "第十八届「挑战杯」全国大学生课外学术科技作品竞赛",
    tags: ["大模型", "RAG", "知识图谱", "中医", "医疗AI", "挑战杯金奖"],
  },
  {
    id: "r13",
    title: "开源框架：OpenMMLab 计算机视觉算法库",
    content:
      "商汤开源的 CV 算法全家桶，覆盖目标检测（MMDetection）、分割（MMSegmentation）、姿态（MMPose）等 30+ 方向。统一配置系统，模型复现率高，适合学术研究和工程落地。推荐用于：需要标准 benchmark 对比的论文复现、多算法对比选型。",
    category: "开源框架",
    source: "GitHub: open-mmlab",
    tags: ["计算机视觉", "OpenMMLab", "目标检测", "分割", "开源", "学术"],
  },
  {
    id: "r14",
    title: "赛事经验：路演答辩 3 分钟黄金结构",
    content:
      "3 分钟路演结构：0-30s 痛点（用一句话+一个数字打动人）；30s-1min 方案（你的产品是什么，一句话说清）；1-2min 技术壁垒（凭什么是你，1-2 个核心数据）；2-2.5min 落地进展（真实用户/收入/试点数据）；2.5-3min 团队+愿景（为什么能做成）。技巧：每页只讲一个点，数字比形容词有说服力，结尾留一句记忆点。",
    category: "赛事经验",
    source: "国赛路演教练整理",
    tags: ["赛事经验", "路演", "答辩", "互联网+", "挑战杯", "技巧"],
  },
  {
    id: "r15",
    title: "开源框架：Qdrant — 高性能向量数据库",
    content:
      "Rust 编写的向量数据库，性能优异，支持过滤+向量混合检索、量化、分片。REST/gRPC 双 API，部署简单（单二进制或 Docker）。适合中大型 RAG 系统。相比 pgvector：独立部署，写入吞吐更高，支持复杂过滤。官网：qdrant.tech。",
    category: "开源框架",
    source: "GitHub: qdrant/qdrant",
    tags: ["向量数据库", "Qdrant", "RAG", "检索", "开源", "高性能"],
  },
];

let resources: Resource[] = [];
let initialized = false;

async function init() {
  if (initialized) return;
  initialized = true;
  for (const r of SEED) {
    const embedding = await embed(`${r.title} ${r.content} ${r.tags.join(" ")}`);
    resources.push({ ...r, embedding });
  }
}

export const resourceStore = {
  async list(): Promise<Resource[]> {
    await init();
    return resources;
  },
  async search(): Promise<Resource[]> {
    await init();
    return resources;
  },
};
