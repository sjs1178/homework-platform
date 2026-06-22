import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toKSTDateString, getKSTWeekRange, getKSTYearMonth } from "@/lib/date";
import MissionBoard from "./MissionBoard";
import BackButton from "@/components/ui/BackButton";
import BottomNav from "@/components/ui/BottomNav";

function getWeekKey(): string {
  const todayStr = toKSTDateString();
  const d = new Date(todayStr + "T12:00:00Z");
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export default async function ChildMissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: pairs } = await supabase
    .from("pairs")
    .select("id")
    .eq("child_id", user.id)
    .eq("status", "active");

  const allPairIds = (pairs ?? []).map((p) => p.id);
  if (allPairIds.length === 0) redirect("/child/dashboard");
  const primaryPairId = allPairIds[0];

  const todayStr = toKSTDateString();
  const { mondayStr: weekFrom, sundayStr: weekTo } = getKSTWeekRange();
  const { year, month } = getKSTYearMonth();
  const monthFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthTo = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const [dailyRes, weeklyRes, monthlyRes, settingsRes, claimsRes] = await Promise.all([
    supabase
      .from("homeworks")
      .select("id, is_completed")
      .in("pair_id", allPairIds)
      .eq("due_date", todayStr),
    supabase
      .from("homeworks")
      .select("id, is_completed")
      .in("pair_id", allPairIds)
      .gte("due_date", weekFrom)
      .lte("due_date", weekTo),
    supabase
      .from("homeworks")
      .select("id, is_completed")
      .in("pair_id", allPairIds)
      .gte("due_date", monthFrom)
      .lte("due_date", monthTo),
    supabase
      .from("mission_settings")
      .select("daily_reward, weekly_reward, monthly_reward")
      .eq("pair_id", primaryPairId)
      .maybeSingle(),
    supabase
      .from("mission_claims")
      .select("mission_type, period_key")
      .eq("child_id", user.id)
      .in("pair_id", allPairIds),
  ]);

  const dailyHws = dailyRes.data ?? [];
  const weeklyHws = weeklyRes.data ?? [];
  const monthlyHws = monthlyRes.data ?? [];
  const settings = settingsRes.data;
  const claims = claimsRes.data ?? [];

  const weekKey = getWeekKey();
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const claimedSet = new Set(claims.map((c) => `${c.mission_type}:${c.period_key}`));

  const missions = [
    {
      type: "daily" as const,
      label: "데일리 미션",
      desc: "오늘의 숙제를 모두 완료하세요",
      total: dailyHws.length,
      done: dailyHws.filter((h) => h.is_completed).length,
      reward: settings?.daily_reward ?? 5,
      claimed: claimedSet.has(`daily:${todayStr}`),
      periodKey: todayStr,
    },
    {
      type: "weekly" as const,
      label: "위클리 미션",
      desc: "이번 주 숙제를 모두 완료하세요",
      total: weeklyHws.length,
      done: weeklyHws.filter((h) => h.is_completed).length,
      reward: settings?.weekly_reward ?? 30,
      claimed: claimedSet.has(`weekly:${weekKey}`),
      periodKey: weekKey,
    },
    {
      type: "monthly" as const,
      label: "먼슬리 미션",
      desc: "이번 달 숙제를 모두 완료하세요",
      total: monthlyHws.length,
      done: monthlyHws.filter((h) => h.is_completed).length,
      reward: settings?.monthly_reward ?? 100,
      claimed: claimedSet.has(`monthly:${monthKey}`),
      periodKey: monthKey,
    },
  ];

  // 리워드 단위
  const { data: rewardSettings } = await supabase
    .from("reward_settings")
    .select("point_reward_unit")
    .eq("pair_id", primaryPairId)
    .maybeSingle();

  const unit = rewardSettings?.point_reward_unit ?? "P";

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#F1F7F3",
        display: "flex",
        flexDirection: "column",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "16px 18px 8px", flexShrink: 0 }}>
        <BackButton />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>미션</h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <MissionBoard missions={missions} pairId={primaryPairId} unit={unit} />
      </div>

      <BottomNav active="홈" role="child" />
    </div>
  );
}
