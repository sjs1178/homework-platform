import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import MissionSettings from "./MissionSettings";
import BackButton from "@/components/ui/BackButton";
import BottomNav from "@/components/ui/BottomNav";

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    from: mon.toISOString().split("T")[0],
    to: sun.toISOString().split("T")[0],
  };
}

export default async function ParentMissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pairs } = await admin
    .from("pairs")
    .select("id, child_id")
    .eq("parent_id", user.id)
    .eq("status", "active")
    .order("created_at")
    .limit(1);

  const activePair = pairs?.[0];
  if (!activePair?.child_id) redirect("/parent/dashboard");
  const pairId = activePair.id;
  const childId = activePair.child_id;

  let childName = "자녀";
  const { data: cp } = await admin
    .from("user_profiles")
    .select("display_name")
    .eq("id", childId)
    .single();
  childName = cp?.display_name ?? "자녀";

  const { data: missionSettings } = await supabase
    .from("mission_settings")
    .select("*")
    .eq("pair_id", pairId)
    .maybeSingle();

  const { data: rewardSettings } = await supabase
    .from("reward_settings")
    .select("point_reward_unit")
    .eq("pair_id", pairId)
    .maybeSingle();

  const unit = rewardSettings?.point_reward_unit ?? "P";

  // 현재 미션 진행 현황
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const { from: weekFrom, to: weekTo } = getWeekRange();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthTo = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
    admin.from("homeworks").select("id, is_completed").eq("pair_id", pairId).eq("due_date", todayStr),
    admin.from("homeworks").select("id, is_completed").eq("pair_id", pairId).gte("due_date", weekFrom).lte("due_date", weekTo),
    admin.from("homeworks").select("id, is_completed").eq("pair_id", pairId).gte("due_date", monthFrom).lte("due_date", monthTo),
  ]);

  const progress = {
    daily: { total: (dailyRes.data ?? []).length, done: (dailyRes.data ?? []).filter((h) => h.is_completed).length },
    weekly: { total: (weeklyRes.data ?? []).length, done: (weeklyRes.data ?? []).filter((h) => h.is_completed).length },
    monthly: { total: (monthlyRes.data ?? []).length, done: (monthlyRes.data ?? []).filter((h) => h.is_completed).length },
  };

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
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>미션 관리</h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <MissionSettings
          pairId={pairId}
          childName={childName}
          unit={unit}
          dailyReward={missionSettings?.daily_reward ?? 5}
          weeklyReward={missionSettings?.weekly_reward ?? 30}
          monthlyReward={missionSettings?.monthly_reward ?? 100}
          progress={progress}
        />
      </div>

      <BottomNav active="홈" role="parent" />
    </div>
  );
}
