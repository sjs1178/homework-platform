import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  if (!hw || hw.is_completed) {
    return NextResponse.json({ error: "이미 완료됐거나 존재하지 않음" }, { status: 400 });
  }

  await supabase
    .from("homeworks")
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq("id", homeworkId);

  // 완료 시 지급 설정일 때만 바로 적립
  if (hw.reward_trigger !== "score" && hw.reward_amount > 0) {
    await supabase.from("reward_logs").insert({
      pair_id: hw.pair_id,
      child_id: user.id,
      homework_id: hw.id,
      type: "earn",
      reward_type: "point",
      amount: hw.reward_amount,
      note: `${hw.subject} 완료`,
    });
  }

  return NextResponse.json({ ok: true });
}
