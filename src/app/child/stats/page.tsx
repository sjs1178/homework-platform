import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getEffectiveGrade, getGradeLabel } from "@/lib/grade";
import StatsView from "./StatsView";
import StatsTabs from "@/components/StatsTabs";
import { currenciesFrom } from "@/lib/reward";
import BackButton from "@/components/ui/BackButton";
import BottomNav from "@/components/ui/BottomNav";

export const dynamic = "force-dynamic";

export default async function ChildStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id, display_name, avatar_id, grade, grade_school_year")
    .eq("id", user.id)
    .single();

  if (!profile?.pair_id) redirect("/child/dashboard");

  const effectiveGrade = getEffectiveGrade(
    profile?.grade as number | null,
    profile?.grade_school_year as number | null
  );
  const gradeLabel = getGradeLabel(effectiveGrade);

  // 리워드 사용 통계용 데이터
  const [settingsRes, logsRes, goalsRes] = await Promise.all([
    supabase
      .from("reward_settings")
      .select("primary_kind, secondary_enabled, time_reward_name, time_reward_unit, point_reward_name, point_reward_unit")
      .eq("pair_id", profile.pair_id)
      .maybeSingle(),
    supabase
      .from("reward_logs")
      .select("type, reward_type, entry_kind, category, amount, created_at")
      .eq("child_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("habit_goals")
      .select("kind, daily_limit, weekly_limit, monthly_budget, saving_goal")
      .eq("child_id", user.id),
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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>내 통계</h1>
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
              pairId={profile.pair_id}
              effectiveGrade={effectiveGrade ?? 0}
              gradeLabel={gradeLabel}
              childName={profile.display_name ?? ""}
            />
          }
        />
      </div>

      <BottomNav active="홈" role="child" />
    </div>
  );
}
