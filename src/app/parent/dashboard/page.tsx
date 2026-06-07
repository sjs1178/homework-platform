import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PairingSection from "./PairingSection";

export default async function ParentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id, display_name")
    .eq("id", user.id)
    .single();

  let pair = null;
  let childProfile = null;

  if (profile?.pair_id) {
    const { data } = await supabase
      .from("pairs")
      .select("*")
      .eq("id", profile.pair_id)
      .single();
    pair = data;

    if (pair?.child_id) {
      const { data: cp } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", pair.child_id)
        .single();
      childProfile = cp;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">안녕하세요, {profile?.display_name ?? "부모"}님 👋</h1>
        </div>

        <PairingSection
          userId={user.id}
          pair={pair}
          childName={childProfile?.display_name ?? null}
        />

        {pair?.child_id && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <a
              href="/parent/homework/new"
              className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700"
            >
              <span className="text-3xl">✏️</span>
              <span className="font-semibold">숙제 입력</span>
            </a>
            <a
              href="/parent/rewards"
              className="flex flex-col items-center justify-center gap-2 p-6 bg-purple-600 text-white rounded-2xl hover:bg-purple-700"
            >
              <span className="text-3xl">🎁</span>
              <span className="font-semibold">리워드 설정</span>
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
