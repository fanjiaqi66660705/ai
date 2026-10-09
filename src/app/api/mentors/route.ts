import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const mentors = await store.listMentors();
  // 不返回 embedding，减少响应体
  const safe = mentors.map(({ embedding, ...rest }) => rest);
  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, title, expertise, bio, capacity } = body;
  if (!name || !title) {
    return NextResponse.json({ error: "姓名和职称必填" }, { status: 400 });
  }
  const mentor = await store.createMentor({
    name,
    title,
    expertise: expertise ?? [],
    bio: bio ?? "",
    capacity: capacity ?? 3,
  });
  const { embedding, ...safe } = mentor;
  return NextResponse.json(safe);
}
