import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toKSTDateString } from "@/lib/date";

export async function POST(req: NextRequest) {
  const { homeworkId } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { data: hw } = await supabase
    .from("homeworks")
    .select("*")
    .eq("id", homeworkId)
    .single();

  if (!hw || !hw.is_completed) {
    return NextResponse.json({ error: "완료 상태가 아니거나 존재하지 않음" }, { status: 400 });
  }

  const todayStr = toKSTDateString();
  if (hw.due_date !== todayStr) {
    return NextResponse.json({ error: "오늘 날짜의 숙제만 취소할 수 있어요" }, { status: 400 });
  }

  await supabase
    .from("homeworks")
    .update({ is_completed: false, completed_at: null })
    .eq("id", homeworkId);

  // 완료 시 리워드를 지급하지 않으므로 취소 시 차감도 없음 (지급은 부모 검사 완료 시에만)

  return NextResponse.json({ ok: true });
}
