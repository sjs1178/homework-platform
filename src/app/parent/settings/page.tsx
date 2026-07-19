import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getAvatar } from "@/lib/avatars";
import { getEffectiveGradeLabel } from "@/lib/grade";
import SettingsView from "./SettingsView";
import Icon from "@/components/ui/Icon";
import BackButton from "@/components/ui/BackButton";
import BottomNav from "@/components/ui/BottomNav";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "parent") redirect("/child/dashboard");

  // 페어 목록
  const { data: pairs } = await supabase
    .from("pairs")
    .select("id, invite_code, pair_name, child_id")
    .eq("parent_id", user.id)
    .order("created_at");

  const childIds = (pairs ?? []).map((p) => p.child_id).filter(Boolean) as string[];

  let childProfiles: Record<string, { name: string; avatarEmoji: string; gradeLabel: string }> = {};
  if (childIds.length) {
    // RLS 우회: 부모는 자녀 프로필을 service role로 읽음
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: cps } = await admin
      .from("user_profiles")
      .select("id, display_name, avatar_id, grade, grade_school_year")
      .in("id", childIds);
    childProfiles = Object.fromEntries(
      (cps ?? []).map((p) => [
        p.id,
        {
          name: p.display_name ?? "자녀",
          avatarEmoji: getAvatar(p.avatar_id as string | null).emoji,
          gradeLabel: getEffectiveGradeLabel(
            p.grade as number | null,
            p.grade_school_year as number | null
          ) ?? "",
        },
      ])
    );
  }

  // 자녀별 리워드 설정 (pair_id 기준)
  const allPairIds = (pairs ?? []).map((p) => p.id);
  const { data: rwSettingsAll } = allPairIds.length
    ? await supabase
        .from("reward_settings")
        .select("pair_id, primary_kind, secondary_enabled, time_reward_name, time_reward_unit, point_reward_name, point_reward_unit")
        .in("pair_id", allPairIds)
    : { data: [] };
  const rwMap = Object.fromEntries(
    (rwSettingsAll ?? []).map((s) => [s.pair_id, s])
  );

  // 자녀별 습관 목표 (child_id 기준)
  const { data: goalsAll } = childIds.length
    ? await supabase
        .from("habit_goals")
        .select("child_id, kind, daily_limit, weekly_limit, monthly_budget, saving_goal")
        .in("child_id", childIds)
    : { data: [] };
  const goalMap: Record<string, Record<string, {
    daily_limit: number | null; weekly_limit: number | null;
    monthly_budget: number | null; saving_goal: number | null;
  }>> = {};
  for (const g of goalsAll ?? []) {
    if (!goalMap[g.child_id]) goalMap[g.child_id] = {};
    goalMap[g.child_id][g.kind] = {
      daily_limit: g.daily_limit, weekly_limit: g.weekly_limit,
      monthly_budget: g.monthly_budget, saving_goal: g.saving_goal,
    };
  }

  const pairsWithChild = (pairs ?? []).map((p) => ({
    id: p.id,
    invite_code: p.invite_code as string,
    pair_name: p.pair_name as string | null,
    child_id: p.child_id as string | null,
    childName: p.child_id ? (childProfiles[p.child_id]?.name ?? "자녀") : null,
    childAvatar: p.child_id ? (childProfiles[p.child_id]?.avatarEmoji ?? "🧒") : null,
    childGrade: p.child_id ? (childProfiles[p.child_id]?.gradeLabel ?? "") : "",
    primaryKind: (rwMap[p.id]?.primary_kind === "time" ? "time" : "money") as "time" | "money",
    secondaryEnabled: !!rwMap[p.id]?.secondary_enabled,
    timeName: rwMap[p.id]?.time_reward_name ?? "게임시간",
    timeUnit: rwMap[p.id]?.time_reward_unit ?? "분",
    moneyName: rwMap[p.id]?.point_reward_name ?? "리워드",
    moneyUnit: rwMap[p.id]?.point_reward_unit ?? "P",
    goals: p.child_id ? (goalMap[p.child_id] ?? {}) : {},
  }));

  const pairId = pairsWithChild[0]?.id ?? null;

  // 자녀 가입 승인 대기 목록 (service role로 이메일 기반 조회)
  const pendingAdminClient = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: pendingApprovals } = await pendingAdminClient
    .from("pending_approvals")
    .select("id, child_name, child_birthday, approval_code, created_at, expires_at")
    .eq("parent_email", user.email?.toLowerCase() ?? "")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // 자녀 탈퇴 요청 목록
  const pairIds = pairsWithChild.map((p) => p.id);
  let withdrawalRequests: { id: string; childName: string; childAvatar: string; createdAt: string }[] = [];
  if (pairIds.length > 0) {
    const { data: wrs } = await pendingAdminClient
      .from("withdrawal_requests")
      .select("id, child_id, pair_id, created_at")
      .in("pair_id", pairIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    withdrawalRequests = (wrs ?? []).map((wr) => {
      const pair = pairsWithChild.find((p) => p.id === wr.pair_id);
      return {
        id: wr.id,
        childName: pair?.childName ?? "자녀",
        childAvatar: pair?.childAvatar ?? "🧒",
        createdAt: wr.created_at,
      };
    });
  }

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
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>설정</h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <SettingsView
          parentId={user.id}
          displayName={profile?.display_name ?? ""}
          pairs={pairsWithChild}
          pairId={pairId}
          pendingApprovals={pendingApprovals ?? []}
          withdrawalRequests={withdrawalRequests}
        />
      </div>

      <BottomNav active="내정보" role="parent" />
    </div>
  );
}
