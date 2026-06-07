import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PairInput from "./PairInput";

export default async function ChildDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id, display_name")
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

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">안녕하세요, {profile?.display_name ?? "자녀"}님 👋</h1>
        </div>

        {!profile?.pair_id ? (
          <PairInput />
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
              <p className="text-green-700 font-semibold">✅ {parentName ?? "부모"}와 연결되었어요!</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/child/calendar"
                className="flex flex-col items-center justify-center gap-2 p-6 bg-green-500 text-white rounded-2xl hover:bg-green-600"
              >
                <span className="text-3xl">📅</span>
                <span className="font-semibold">숙제 캘린더</span>
              </a>
              <a
                href="/child/rewards"
                className="flex flex-col items-center justify-center gap-2 p-6 bg-yellow-500 text-white rounded-2xl hover:bg-yellow-600"
              >
                <span className="text-3xl">⭐</span>
                <span className="font-semibold">내 리워드</span>
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
