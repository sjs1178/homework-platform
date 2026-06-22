import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toKSTDateString, getKSTWeekRange, getKSTYearMonth } from "@/lib/date";

function getWeekKey(): string {
  const todayStr = toKSTDateString();
  const d = new Date(todayStr + "T12:00:00Z");
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { pairId, missionType } = await req.json() as {
    pairId: string;
    missionType: "daily" | "weekly" | "monthly";
  };

  // 자녀의 모든 페어 조회 (다른 부모 포함)
  const { data: pairs } = await supabase
    .from("pairs")
    .select("id")
    .eq("child_id", user.id)
    .eq("status", "active");
  const allPairIds = (pairs ?? []).map((p) => p.id);
  if (!allPairIds.includes(pairId)) allPairIds.push(pairId);

  const todayStr = toKSTDateString();
  let periodKey: string;
  let from: string;
  let to: string;

  if (missionType === "daily") {
    periodKey = todayStr;
    from = todayStr;
    to = todayStr;
  } else if (missionType === "weekly") {
    periodKey = getWeekKey();
    const range = getKSTWeekRange();
    from = range.mondayStr;
    to = range.sundayStr;
  } else {
    const { year, month } = getKSTYearMonth();
    periodKey = `${year}-${String(month).padStart(2, "0")}`;
    from = `${year}-${String(month).padStart(2, "0")}-01`;
    to = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;
  }

  const { data: hws } = await supabase
    .from("homeworks")
    .select("id, is_completed")
    .in("pair_id", allPairIds)
    .gte("due_date", from)
    .lte("due_date", to);

  if (!hws?.length) {
    return NextResponse.json({ error: "해당 기간에 숙제가 없어요" }, { status: 400 });
  }
  if (hws.some((h) => !h.is_completed)) {
    return NextResponse.json({ error: "아직 완료하지 않은 숙제가 있어요" }, { status: 400 });
  }

  const { data: settings } = await supabase
    .from("mission_settings")
    .select("daily_reward, weekly_reward, monthly_reward")
    .eq("pair_id", pairId)
    .single();

  const rewardField = `${missionType}_reward` as keyof typeof settings;
  const rewardAmount = settings?.[rewardField] ?? (missionType === "daily" ? 5 : missionType === "weekly" ? 30 : 100);

  const { error: claimErr } = await supabase.from("mission_claims").insert({
    pair_id: pairId,
    child_id: user.id,
    mission_type: missionType,
    period_key: periodKey,
    reward_amount: rewardAmount,
  });

  if (claimErr) {
    if (claimErr.code === "23505") {
      return NextResponse.json({ error: "이미 받은 미션이에요" }, { status: 409 });
    }
    return NextResponse.json({ error: claimErr.message }, { status: 500 });
  }

  await supabase.from("reward_logs").insert({
    pair_id: pairId,
    child_id: user.id,
    type: "earn",
    reward_type: "point",
    amount: rewardAmount,
    note: `미션 달성: ${missionType === "daily" ? "데일리" : missionType === "weekly" ? "위클리" : "먼슬리"}`,
  });

  return NextResponse.json({ ok: true, reward: rewardAmount });
}
