import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getAvatar } from "@/lib/avatars";
import { getEffectiveGradeLabel } from "@/lib/grade";
import SettingsView from "./SettingsView";
import Icon from "@/components/ui/Icon";
import BackButton from "@/components/ui/BackButton";

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

  const pairsWithChild = (pairs ?? []).map((p) => ({
    id: p.id,
    invite_code: p.invite_code as string,
    pair_name: p.pair_name as string | null,
    child_id: p.child_id as string | null,
    childName: p.child_id ? (childProfiles[p.child_id]?.name ?? "자녀") : null,
    childAvatar: p.child_id ? (childProfiles[p.child_id]?.avatarEmoji ?? "🧒") : null,
    childGrade: p.child_id ? (childProfiles[p.child_id]?.gradeLabel ?? "") : "",
  }));

  // 리워드 설정
  const pairId = pairsWithChild[0]?.id ?? null;
  const { data: rwSettings } = pairId
    ? await supabase
        .from("reward_settings")
        .select("point_reward_name, point_reward_unit")
        .eq("pair_id", pairId)
        .single()
    : { data: null };

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

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 32px" }}>
        <SettingsView
          parentId={user.id}
          displayName={profile?.display_name ?? ""}
          pairs={pairsWithChild}
          pairId={pairId}
          rewardName={rwSettings?.point_reward_name ?? "리워드"}
          rewardUnit={rwSettings?.point_reward_unit ?? "P"}
          pendingApprovals={pendingApprovals ?? []}
        />
      </div>
    </div>
  );
}
