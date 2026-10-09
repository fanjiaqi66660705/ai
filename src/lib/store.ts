import { embed } from "./embedding";

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  tags: string[];
  embedding: number[];
  createdAt: string;
}

export interface Mentor {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  bio: string;
  capacity: number;
  tags: string[];
  embedding: number[];
}

// 内存存储，演示用。后续接入 Prisma 时替换为数据库查询。
let projects: Project[] = [];
let mentors: Mentor[] = [];

// 预置几位示例导师，开箱即可演示匹配
const seedMentors: Omit<Mentor, "embedding" | "tags">[] = [
  {
    id: "m1",
    name: "张明教授",
    title: "计算机学院 · 人工智能研究所",
    expertise: ["计算机视觉", "深度学习", "目标检测"],
    bio: "深耕 CV 领域 12 年，指导过 5 个互联网+国赛项目获奖，擅长 YOLO 系列模型优化与边缘部署。",
    capacity: 3,
  },
  {
    id: "m2",
    name: "李华研究员",
    title: "农业信息化工程中心",
    expertise: ["智慧农业", "物联网", "传感器"],
    bio: "农业信息化方向资深专家，主持多项省部级智慧农业课题，有丰富的产业落地资源。",
    capacity: 2,
  },
  {
    id: "m3",
    name: "王芳副教授",
    title: "经济管理学院",
    expertise: ["商业模式", "创新创业", "市场分析"],
    bio: "连续 6 年担任互联网+省赛评委，擅长商业计划书打磨与商业模式画布设计。",
    capacity: 4,
  },
  {
    id: "m4",
    name: "陈强工程师",
    title: "某头部 AI 公司 · 技术总监",
    expertise: ["大模型应用", "RAG", "向量数据库"],
    bio: "10 年工业界经验，主导过多个亿级用户 AI 产品落地，擅长 RAG 系统设计与性能优化。",
    capacity: 1,
  },
  {
    id: "m5",
    name: "刘洋教授",
    title: "电子工程学院",
    expertise: ["嵌入式", "硬件设计", "FPGA"],
    bio: "硬件方向资深导师，指导学生获得挑战杯国赛金奖 2 次，擅长软硬协同设计。",
    capacity: 2,
  },
];

async function initSeeds() {
  if (mentors.length > 0) return;
  for (const m of seedMentors) {
    const embedding = await embed(`${m.name} ${m.title} ${m.expertise.join(" ")} ${m.bio}`);
    mentors.push({ ...m, tags: [...m.expertise], embedding });
  }
}

// 模块加载时异步初始化种子数据
initSeeds();

export const store = {
  async listProjects(): Promise<Project[]> {
    return projects;
  },
  async createProject(data: Omit<Project, "id" | "createdAt" | "embedding">): Promise<Project> {
    const embedding = await embed(`${data.title} ${data.description} ${data.techStack.join(" ")}`);
    const p: Project = {
      ...data,
      id: "p" + Date.now(),
      createdAt: new Date().toISOString(),
      embedding,
    };
    projects.unshift(p);
    return p;
  },
  async listMentors(): Promise<Mentor[]> {
    await initSeeds();
    return mentors;
  },
  async createMentor(data: Omit<Mentor, "embedding" | "tags">): Promise<Mentor> {
    const embedding = await embed(`${data.name} ${data.title} ${data.expertise.join(" ")} ${data.bio}`);
    const m: Mentor = { ...data, tags: [...data.expertise], embedding };
    mentors.unshift(m);
    return m;
  },
};
