import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeworkInputForm from "./HomeworkInputForm";
import { getEffectiveGrade } from "@/lib/grade";

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

  // 자녀 학년 조회 (curriculum 태깅용)
  const { data: pair } = await supabase
    .from("pairs")
    .select("child_id")
    .eq("id", profile.pair_id)
    .single();

  let childGrade: number | null = null;
  if (pair?.child_id) {
    const { data: childProfile } = await supabase
      .from("user_profiles")
      .select("grade, grade_school_year")
      .eq("id", pair.child_id)
      .single();
    childGrade = getEffectiveGrade(
      childProfile?.grade as number | null,
      childProfile?.grade_school_year as number | null
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/parent/dashboard" className="text-gray-400 hover:text-gray-600">←</a>
          <h1 className="text-xl font-bold">숙제 입력</h1>
        </div>
        <HomeworkInputForm pairId={profile.pair_id} rules={rules} childGrade={childGrade} />
      </div>
    </main>
  );
}
