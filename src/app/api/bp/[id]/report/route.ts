import { NextRequest, NextResponse } from "next/server";
import { bpStore } from "@/lib/bp-store";
import { generateReport } from "@/lib/bp-judge";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = bpStore.get(id);
  if (!session) {
    return NextResponse.json({ error: "会话不存在或已过期" }, { status: 404 });
  }
  if (!session.done) {
    return NextResponse.json({ error: "拷问尚未完成" }, { status: 400 });
  }
  const report = await generateReport(session);
  return NextResponse.json(report);
}
