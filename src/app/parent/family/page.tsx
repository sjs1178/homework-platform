import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyManager from "./FamilyManager";
import { getAvatar } from "@/lib/avatars";
import { getEffectiveGradeLabel } from "@/lib/grade";

export default async function FamilyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "parent") redirect("/child/dashboard");

  const { data: pairs } = await supabase
    .from("pairs")
    .select("id, invite_code, pair_name, child_id")
    .eq("parent_id", user.id)
    .order("created_at");

  const childIds = (pairs ?? []).map((p) => p.child_id).filter(Boolean) as string[];
  let childProfiles: Record<string, { name: string; avatarEmoji: string; gradeLabel: string }> = {};
  if (childIds.length) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_id, grade, grade_school_year")
      .in("id", childIds);
    childProfiles = Object.fromEntries(
      (profiles ?? []).map((p) => [
        p.id,
        {
          name: p.display_name,
          avatarEmoji: getAvatar(p.avatar_id as string | null).emoji,
          gradeLabel: getEffectiveGradeLabel(p.grade as number | null, p.grade_school_year as number | null),
        },
      ])
    );
  }

  const pairsWithChild = (pairs ?? []).map((p) => ({
    ...p,
    childName: p.child_id ? (childProfiles[p.child_id]?.name ?? "자녀") : null,
    childAvatar: p.child_id ? (childProfiles[p.child_id]?.avatarEmoji ?? "🧒") : null,
    childGrade: p.child_id ? (childProfiles[p.child_id]?.gradeLabel ?? "") : "",
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/parent/dashboard" className="text-gray-400 hover:text-gray-600">←</a>
          <h1 className="text-xl font-bold">패밀리 관리</h1>
        </div>
        <FamilyManager parentId={user.id} pairs={pairsWithChild} />
      </div>
    </main>
  );
}
