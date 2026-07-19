import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getEffectiveGrade, getGradeLabel } from "@/lib/grade";
import StatsView from "@/app/child/stats/StatsView";
import StatsTabs from "@/components/StatsTabs";
import { currenciesFrom } from "@/lib/reward";
import BackButton from "@/components/ui/BackButton";
import BottomNav from "@/components/ui/BottomNav";

export const dynamic = "force-dynamic";

export default async function ParentStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "parent") redirect("/child/stats");

  const { data: pairs } = await supabase
    .from("pairs")
    .select("id, child_id")
    .eq("parent_id", user.id)
    .eq("status", "active")
    .order("created_at")
    .limit(1);

  const activePair = pairs?.[0];
  if (!activePair?.child_id) redirect("/parent/dashboard");
  const pairId = activePair.id;

  const { data: childProfile } = await supabase
    .from("user_profiles")
    .select("display_name, grade, grade_school_year")
    .eq("id", activePair.child_id)
    .single();

  const effectiveGrade = getEffectiveGrade(
    childProfile?.grade as number | null,
    childProfile?.grade_school_year as number | null
  );
  const gradeLabel = getGradeLabel(effectiveGrade);

  // 리워드 사용 통계용 데이터 (child_id 기준)
  const [settingsRes, logsRes, goalsRes] = await Promise.all([
    supabase
      .from("reward_settings")
      .select("primary_kind, secondary_enabled, time_reward_name, time_reward_unit, point_reward_name, point_reward_unit")
      .eq("pair_id", pairId)
      .maybeSingle(),
    supabase
      .from("reward_logs")
      .select("type, reward_type, entry_kind, category, amount, created_at")
      .eq("child_id", activePair.child_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("habit_goals")
      .select("kind, daily_limit, weekly_limit, monthly_budget, saving_goal")
      .eq("child_id", activePair.child_id),
  ]);

  const currencies = currenciesFrom(settingsRes.data);
  const logs = logsRes.data;
  const goals = Object.fromEntries((goalsRes.data ?? []).map((g) => [g.kind, g]));

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
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>
            {childProfile?.display_name ?? "자녀"} 통계
          </h1>
          {gradeLabel && <p style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600, margin: "2px 0 0" }}>{gradeLabel} 기준</p>}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <StatsTabs
          currencies={currencies}
          logs={logs ?? []}
          goals={goals}
          learning={
            <StatsView
              pairId={pairId}
              effectiveGrade={effectiveGrade ?? 0}
              gradeLabel={gradeLabel}
              childName={childProfile?.display_name ?? ""}
            />
          }
        />
      </div>

      <BottomNav active="홈" role="parent" />
    </div>
  );
}
