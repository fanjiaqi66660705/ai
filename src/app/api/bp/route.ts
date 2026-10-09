import { NextRequest, NextResponse } from "next/server";
import { bpStore } from "@/lib/bp-store";
import { askQuestion, DIMENSIONS } from "@/lib/bp-judge";

export async function POST(req: NextRequest) {
  const { title, bpText } = await req.json();
  if (!bpText || !title) {
    return NextResponse.json({ error: "标题和 BP 内容必填" }, { status: 400 });
  }
  const session = bpStore.create(String(title), String(bpText));
  const { comment, question } = await askQuestion(session, 0);
  return NextResponse.json({
    sessionId: session.id,
    comment,
    question,
    dimension: DIMENSIONS[0],
    round: 1,
    totalRounds: 5,
  });
}
