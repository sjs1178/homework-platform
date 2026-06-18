import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getEffectiveGrade, getGradeLabel } from "@/lib/grade";
import { getAvatar } from "@/lib/avatars";
import StatsView from "@/app/child/stats/StatsView";
import BackButton from "@/components/ui/BackButton";

export default async function ParentStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "parent") redirect("/child/stats");

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

  const { data: childProfile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_id, grade, grade_school_year")
    .eq("id", activePair.child_id)
    .single();

  const effectiveGrade = getEffectiveGrade(
    childProfile?.grade as number | null,
    childProfile?.grade_school_year as number | null
  );
  const gradeLabel = getGradeLabel(effectiveGrade);
  const avatar = getAvatar(childProfile?.avatar_id as string | null);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="text-2xl">{avatar.emoji}</span>
            <div>
              <h1 className="text-xl font-bold">{childProfile?.display_name ?? "자녀"} 학습 통계</h1>
              {gradeLabel && <p className="text-xs text-gray-400">{gradeLabel} 기준</p>}
            </div>
          </div>
        </div>
        <StatsView
          pairId={pairId}
          effectiveGrade={effectiveGrade ?? 0}
          gradeLabel={gradeLabel}
          childName={childProfile?.display_name ?? ""}
        />
      </div>
    </main>
  );
}
