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

  if (hw.reward_trigger !== "score" && hw.reward_amount > 0) {
    await supabase.from("reward_logs").insert({
      pair_id: hw.pair_id,
      child_id: user.id,
      homework_id: hw.id,
      type: "spend",
      reward_type: "point",
      amount: hw.reward_amount,
      note: `${hw.subject} 완료 취소`,
    });
  }

  return NextResponse.json({ ok: true });
}
