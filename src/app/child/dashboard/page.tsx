import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PairInput from "./PairInput";
import { getAvatar } from "@/lib/avatars";
import { getEffectiveGradeLabel } from "@/lib/grade";

export default async function ChildDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id, display_name, avatar_id, grade, grade_school_year")
    .eq("id", user.id)
    .single();

  let parentName = null;
  if (profile?.pair_id) {
    const { data: pair } = await supabase
      .from("pairs")
      .select("parent_id")
      .eq("id", profile.pair_id)
      .single();
    if (pair?.parent_id) {
      const { data: pp } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", pair.parent_id)
        .single();
      parentName = pp?.display_name;
    }
  }

  const avatar = getAvatar(profile?.avatar_id);
  const gradeLabel = getEffectiveGradeLabel(
    profile?.grade as number | null,
    profile?.grade_school_year as number | null
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        {/* 프로필 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{avatar.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{profile?.display_name ?? "자녀"}님 안녕!</h1>
                {gradeLabel && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {gradeLabel}
                  </span>
                )}
              </div>
              {profile?.pair_id && (
                <p className="text-xs text-gray-400">{parentName ?? "부모"}와 연결됨</p>
              )}
            </div>
          </div>
          <a
            href="/child/profile"
            className="text-sm text-blue-500 border border-blue-200 rounded-xl px-3 py-1.5 hover:bg-blue-50"
          >
            프로필 편집
          </a>
        </div>

        {!profile?.pair_id ? (
          <PairInput />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <a href="/child/calendar" className="flex flex-col items-center justify-center gap-2 p-6 bg-green-500 text-white rounded-2xl hover:bg-green-600">
              <span className="text-3xl">📅</span>
              <span className="font-semibold">숙제 캘린더</span>
            </a>
            <a href="/child/rewards" className="flex flex-col items-center justify-center gap-2 p-6 bg-yellow-500 text-white rounded-2xl hover:bg-yellow-600">
              <span className="text-3xl">⭐</span>
              <span className="font-semibold">내 리워드</span>
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
