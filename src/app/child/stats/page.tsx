import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getEffectiveGrade, getGradeLabel } from "@/lib/grade";
import StatsView from "./StatsView";

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

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/child/dashboard" className="text-gray-400 hover:text-gray-600">←</a>
          <div>
            <h1 className="text-xl font-bold">내 학습 통계</h1>
            {gradeLabel && <p className="text-xs text-gray-400">{gradeLabel} 기준</p>}
          </div>
        </div>
        <StatsView
          pairId={profile.pair_id}
          effectiveGrade={effectiveGrade ?? 0}
          gradeLabel={gradeLabel}
          childName={profile.display_name ?? ""}
        />
      </div>
    </main>
  );
}
