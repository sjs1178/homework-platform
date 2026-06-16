import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createClient as createAdmin } from "@supabase/supabase-js";
import RewardsManager from "./RewardsManager";
import Icon from "@/components/ui/Icon";

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
    .single();

  const unit = settings?.point_reward_unit ?? "P";
  const rewardName = settings?.point_reward_name ?? "리워드";

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

  const { data: logs } = await supabase
    .from("reward_logs")
    .select("*, homeworks(subject, description)")
    .eq("pair_id", pairId)
    .order("created_at", { ascending: false })
    .limit(50);

  const totalEarned = (logs ?? []).filter((l) => l.type === "earn").reduce((s, l) => s + l.amount, 0);
  const totalSpent = (logs ?? []).filter((l) => l.type === "spend").reduce((s, l) => s + l.amount, 0);
  const balance = totalEarned - totalSpent;

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
        <a
          href="/parent/dashboard"
          style={{
            width: 40, height: 40, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <Icon name="arrow-left" size={23} color="var(--text)" stroke={2.2} />
        </a>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>리워드 관리</h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 32px" }}>
        <RewardsManager
          pairId={pairId}
          childId={childId ?? ""}
          childName={childName}
          unit={unit}
          rewardName={rewardName}
          balance={balance}
          totalEarned={totalEarned}
          totalSpent={totalSpent}
          logs={(logs ?? []).map((l) => ({
            id: l.id,
            type: l.type,
            amount: l.amount,
            note: l.note,
            created_at: l.created_at,
          }))}
        />
      </div>
    </div>
  );
}
