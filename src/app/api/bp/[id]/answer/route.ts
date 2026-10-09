import { NextRequest, NextResponse } from "next/server";
import { bpStore } from "@/lib/bp-store";
import { askQuestion, DIMENSIONS } from "@/lib/bp-judge";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = bpStore.get(id);
  if (!session) {
    return NextResponse.json({ error: "会话不存在或已过期" }, { status: 404 });
  }
  const { answer, question } = await req.json();
  if (!answer || typeof answer !== "string") {
    return NextResponse.json({ error: "回答不能为空" }, { status: 400 });
  }

  // 记录当前轮次的问答（rounds 长度即已完成轮数）
  session.rounds.push({
    dimension: DIMENSIONS[session.rounds.length],
    question: String(question ?? ""),
    answer: String(answer),
  });

  if (session.rounds.length >= 5) {
    session.done = true;
    return NextResponse.json({ done: true });
  }

  const { comment, question: nextQuestion } = await askQuestion(session, session.rounds.length);
  return NextResponse.json({
    done: false,
    comment,
    question: nextQuestion,
    dimension: DIMENSIONS[session.rounds.length],
    round: session.rounds.length + 1,
    totalRounds: 5,
  });
}
