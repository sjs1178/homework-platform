import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import RewardBody from "./RewardBody";
import { currenciesFrom } from "@/lib/reward";

export const dynamic = "force-dynamic";

export default async function ChildRewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile?.pair_id) redirect("/child/dashboard");

  // 연결된 모든 부모(공동양육자)의 pair를 포함해 리워드를 child_id 기준으로 집계
  const { data: myPairs } = await supabase
    .from("pairs")
    .select("id")
    .eq("child_id", user.id)
    .eq("status", "active");
  const pairIds = (myPairs ?? []).map((p) => p.id);

  const { data: logs } = await supabase
    .from("reward_logs")
    .select("id, type, reward_type, entry_kind, category, amount, note, created_at")
    .eq("child_id", user.id)
    .order("created_at", { ascending: false });

  const { data: settings } = await supabase
    .from("reward_settings")
    .select("primary_kind, secondary_enabled, time_reward_name, time_reward_unit, point_reward_name, point_reward_unit")
    .eq("pair_id", profile.pair_id)
    .maybeSingle();

  const { data: goalRows } = await supabase
    .from("habit_goals")
    .select("kind, daily_limit, weekly_limit, monthly_budget, saving_goal")
    .eq("child_id", user.id);

  const goals = Object.fromEntries((goalRows ?? []).map((g) => [g.kind, g]));

  const { data: catalogRaw } = await supabase
    .from("reward_catalog")
    .select("*")
    .in("pair_id", pairIds.length ? pairIds : [profile.pair_id])
    .order("cost", { ascending: true });

  const { data: pendingReqs } = await supabase
    .from("reward_requests")
    .select("*")
    .eq("child_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

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
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <RewardBody
          childName={profile.display_name ?? "자녀"}
          pairId={profile.pair_id}
          currencies={currenciesFrom(settings)}
          logs={logs ?? []}
          goals={goals}
          catalog={catalogRaw ?? []}
          pendingRequests={(pendingReqs ?? []).map((r) => ({
            id: r.id,
            amount: r.amount,
            reason: r.reason,
            created_at: r.created_at,
          }))}
        />
      </div>
      <BottomNav active="리워드" />
    </div>
  );
}
