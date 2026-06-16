import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeworkInputForm from "./HomeworkInputForm";
import { getEffectiveGrade, getEffectiveGradeLabel } from "@/lib/grade";

export default async function NewHomeworkPage() {
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

  const { data: rulesRaw } = await supabase
    .from("subject_rules")
    .select("subject, rule_content")
    .eq("pair_id", pairId);

  const rules = (rulesRaw ?? []).map((r) => ({
    subject: r.subject,
    ruleContent: r.rule_content,
  }));

  const { data: settings } = await supabase
    .from("reward_settings")
    .select("point_reward_unit, point_reward_name")
    .eq("pair_id", pairId)
    .single();

  let childGrade: number | null = null;
  let childName = "자녀";
  let childInitial = "자";
  let gradeLabel = "";

  const { data: cp } = await supabase
    .from("user_profiles")
    .select("display_name, grade, grade_school_year")
    .eq("id", activePair.child_id)
    .single();
  childGrade = getEffectiveGrade(cp?.grade ?? null, cp?.grade_school_year ?? null);
  childName = cp?.display_name ?? "자녀";
  childInitial = (cp?.display_name ?? "자")[0];
  gradeLabel = getEffectiveGradeLabel(cp?.grade ?? null, cp?.grade_school_year ?? null) ?? "";

  return (
    <div style={{ maxWidth: 430, margin: "0 auto" }}>
      <HomeworkInputForm
        pairId={pairId}
        rules={rules}
        childGrade={childGrade}
        childName={childName}
        childInitial={childInitial}
        gradeLabel={gradeLabel}
        rewardUnit={settings?.point_reward_unit ?? "P"}
        rewardName={settings?.point_reward_name ?? "리워드"}
      />
    </div>
  );
}
