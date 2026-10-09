import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { matchProjectsForMentor } from "@/lib/matching";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const mentors = await store.listMentors();
  const mentor = mentors.find((m) => m.id === id);
  if (!mentor) {
    return NextResponse.json({ error: "导师不存在" }, { status: 404 });
  }
  const matches = await matchProjectsForMentor(mentor);
  return NextResponse.json(matches);
}
