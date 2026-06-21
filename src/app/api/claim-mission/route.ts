import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    from: mon.toISOString().split("T")[0],
    to: sun.toISOString().split("T")[0],
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { pairId, missionType } = await req.json() as {
    pairId: string;
    missionType: "daily" | "weekly" | "monthly";
  };

  const now = new Date();
  let periodKey: string;
  let from: string;
  let to: string;

  if (missionType === "daily") {
    periodKey = now.toISOString().split("T")[0];
    from = periodKey;
    to = periodKey;
  } else if (missionType === "weekly") {
    periodKey = getWeekKey(now);
    const range = getWeekRange(now);
    from = range.from;
    to = range.to;
  } else {
    periodKey = getMonthKey(now);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    from = `${year}-${String(month).padStart(2, "0")}-01`;
    to = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;
  }

  const { data: hws } = await supabase
    .from("homeworks")
    .select("id, is_completed")
    .eq("pair_id", pairId)
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
