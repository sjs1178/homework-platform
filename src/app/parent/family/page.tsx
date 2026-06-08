import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyManager from "./FamilyManager";

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

  // 이 부모의 모든 페어 조회
  const { data: pairs } = await supabase
    .from("pairs")
    .select("id, invite_code, pair_name, child_id")
    .eq("parent_id", user.id)
    .order("created_at");

  // 자녀 프로필 조회
  const childIds = (pairs ?? []).map((p) => p.child_id).filter(Boolean) as string[];
  let childProfiles: Record<string, string> = {};
  if (childIds.length) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name")
      .in("id", childIds);
    childProfiles = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.display_name]));
  }

  const pairsWithChild = (pairs ?? []).map((p) => ({
    ...p,
    childName: p.child_id ? (childProfiles[p.child_id] ?? "자녀") : null,
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
