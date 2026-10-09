import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { extractTags } from "@/lib/matching";

export async function GET() {
  const projects = await store.listProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, techStack } = body;
  if (!title || !description) {
    return NextResponse.json({ error: "标题和简介必填" }, { status: 400 });
  }
  // 用 LLM 抽取结构化标签
  const { domain, techStack: aiTags, needs } = await extractTags(
    `${title} ${description} ${(techStack ?? []).join(" ")}`,
  );
  const tags = Array.from(new Set([domain, ...(techStack ?? []), ...aiTags, ...needs]));
  const project = await store.createProject({
    title,
    description,
    techStack: techStack ?? [],
    tags,
  });
  return NextResponse.json(project);
}
