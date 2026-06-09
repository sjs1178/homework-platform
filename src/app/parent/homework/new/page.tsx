import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeworkInputForm from "./HomeworkInputForm";
import { getEffectiveGrade, getEffectiveGradeLabel } from "@/lib/grade";

export default async function NewHomeworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id")
    .eq("id", user.id)
    .single();

  if (!profile?.pair_id) redirect("/parent/dashboard");

  const { data: rulesRaw } = await supabase
    .from("subject_rules")
    .select("subject, rule_content")
    .eq("pair_id", profile.pair_id);

  const rules = (rulesRaw ?? []).map((r) => ({
    subject: r.subject,
    ruleContent: r.rule_content,
  }));

  const { data: pair } = await supabase
    .from("pairs")
    .select("child_id")
    .eq("id", profile.pair_id)
    .single();

  const { data: settings } = await supabase
    .from("reward_settings")
    .select("point_reward_unit, point_reward_name")
    .eq("pair_id", profile.pair_id)
    .single();

  let childGrade: number | null = null;
  let childName = "자녀";
  let childInitial = "자";
  let gradeLabel = "";

  if (pair?.child_id) {
    const { data: cp } = await supabase
      .from("user_profiles")
      .select("display_name, grade, grade_school_year")
      .eq("id", pair.child_id)
      .single();
    childGrade = getEffectiveGrade(cp?.grade ?? null, cp?.grade_school_year ?? null);
    childName = cp?.display_name ?? "자녀";
    childInitial = (cp?.display_name ?? "자")[0];
    gradeLabel = getEffectiveGradeLabel(cp?.grade ?? null, cp?.grade_school_year ?? null) ?? "";
  }

  return (
    <div style={{ maxWidth: 430, margin: "0 auto" }}>
      <HomeworkInputForm
        pairId={profile.pair_id}
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
