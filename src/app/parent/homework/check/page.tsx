import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import HomeworkCheckForm from "./HomeworkCheckForm";
import Icon from "@/components/ui/Icon";
import BackButton from "@/components/ui/BackButton";

export default async function ParentHomeworkCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: homeworkId } = await searchParams;
  if (!homeworkId) redirect("/parent/dashboard");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 숙제 조회 (다른 부모가 등록한 숙제도 검사 가능)
  const { data: hw } = await admin
    .from("homeworks")
    .select("*, pairs(child_id)")
    .eq("id", homeworkId)
    .single();

  if (!hw) redirect("/parent/dashboard");

  // 이 부모가 해당 자녀와 연결되어 있는지 확인
  const childId = hw.pairs?.child_id;
  if (childId) {
    const { data: parentPair } = await admin
      .from("pairs")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", childId)
      .single();
    if (!parentPair) redirect("/parent/dashboard");
  }

  const { data: existing } = await admin
    .from("homework_checks")
    .select("*")
    .eq("homework_id", homeworkId)
    .single();

  // 부모의 pair_id와 리워드 설정 조회
  const parentPairForChild = childId
    ? (await admin.from("pairs").select("id").eq("parent_id", user.id).eq("child_id", childId).single()).data
    : null;
  const parentPairId = parentPairForChild?.id ?? hw.pair_id;

  const { data: rwSettings } = await admin
    .from("reward_settings")
    .select("point_reward_name, point_reward_unit")
    .eq("pair_id", parentPairId)
    .single();

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
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          padding: "16px 18px 14px",
          gap: 8,
        }}
      >
        <BackButton />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", lineHeight: 1.1 }}>
            숙제 검사
          </h1>
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "calc(100vw - 120px)" }}>
            {hw.subject} · {hw.description}
          </div>
        </div>
      </div>

      {/* 폼 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 26px" }}>
        <HomeworkCheckForm
          homeworkId={homeworkId}
          checkId={existing?.id ?? null}
          existingResult={existing?.results ?? null}
          existingScore={existing ? { score: existing.score, total: existing.total_problems } : null}
          isReviewed={existing?.is_reviewed ?? false}
          subject={hw.subject}
          pairId={parentPairId}
          childId={childId ?? null}
          rewardName={rwSettings?.point_reward_name ?? "리워드"}
          rewardUnit={rwSettings?.point_reward_unit ?? "P"}
          defaultRewardAmount={hw.reward_amount ?? 0}
        />
      </div>
    </div>
  );
}
