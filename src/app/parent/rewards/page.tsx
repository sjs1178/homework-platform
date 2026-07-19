import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createClient as createAdmin } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
import { currenciesFrom } from "@/lib/reward";
import RewardsManager from "./RewardsManager";
import Icon from "@/components/ui/Icon";
import BackButton from "@/components/ui/BackButton";
import BottomNav from "@/components/ui/BottomNav";

export default async function ParentRewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // pairs 테이블에서 부모의 첫 번째 연결된 페어 조회
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

  const { data: settings } = await supabase
    .from("reward_settings")
    .select("*")
    .eq("pair_id", pairId)
    .maybeSingle();

  const currencies = currenciesFrom(settings);

  // 자녀 이름 (service role — RLS 우회)
  let childName = "자녀";
  let childId: string | null = activePair.child_id ?? null;
  if (childId) {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: cp } = await admin
      .from("user_profiles")
      .select("display_name")
      .eq("id", childId)
      .single();
    childName = cp?.display_name ?? "자녀";
  }

  // 리워드는 child_id 기준으로 집계 — 공동양육자 모두 동일한 잔액·내역 조회.
  // 잔액은 전체 로그로 계산해야 하므로 limit 없이 조회하고, 표시만 잘라낸다.
  const { data: allLogs } = await supabase
    .from("reward_logs")
    .select("id, type, reward_type, entry_kind, category, amount, note, created_at")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });

  const { data: pendingReqs } = await supabase
    .from("reward_requests")
    .select("*")
    .eq("child_id", childId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: goalRows } = await supabase
    .from("habit_goals")
    .select("kind, daily_limit, weekly_limit, monthly_budget, saving_goal")
    .eq("child_id", childId);
  const goals = Object.fromEntries((goalRows ?? []).map((g) => [g.kind, g]));

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 18px 14px", flexShrink: 0 }}>
        <BackButton />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>리워드 관리</h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <RewardsManager
          pairId={pairId}
          childId={childId ?? ""}
          childName={childName}
          currencies={currencies}
          goals={goals}
          logs={(allLogs ?? []).map((l) => ({
            id: l.id,
            type: l.type,
            reward_type: l.reward_type,
            entry_kind: l.entry_kind,
            category: l.category,
            amount: l.amount,
            note: l.note,
            created_at: l.created_at,
          }))}
          pendingRequests={(pendingReqs ?? []).map((r) => ({
            id: r.id,
            amount: r.amount,
            reason: r.reason,
            status: r.status,
            created_at: r.created_at,
          }))}
        />
      </div>

      <BottomNav active="리워드" role="parent" />
    </div>
  );
}
