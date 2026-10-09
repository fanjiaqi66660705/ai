import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { matchMentorsForProject } from "@/lib/matching";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const projects = await store.listProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  const matches = await matchMentorsForProject(project);
  return NextResponse.json(matches);
}
