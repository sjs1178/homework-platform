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
  let completedHomeworks: { id: string; subject: string; description: string; due_date: string; checked: boolean }[] = [];

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

      const { data: hws } = await supabase
        .from("homeworks")
        .select("id, subject, description, due_date")
        .eq("pair_id", profile.pair_id)
        .eq("is_completed", true)
        .order("due_date", { ascending: false })
        .limit(10);

      if (hws?.length) {
        const { data: checks } = await supabase
          .from("homework_checks")
          .select("homework_id")
          .in("homework_id", hws.map((h) => h.id));

        const checkedIds = new Set(checks?.map((c) => c.homework_id) ?? []);
        completedHomeworks = hws.map((h) => ({ ...h, checked: checkedIds.has(h.id) }));
      }
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
          <>
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

            {completedHomeworks.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm p-4">
                <p className="text-sm font-semibold text-gray-500 mb-3">✅ 완료된 숙제 — 검사하기</p>
                <div className="flex flex-col gap-2">
                  {completedHomeworks.map((hw) => (
                    <a
                      key={hw.id}
                      href={`/parent/homework/check?id=${hw.id}`}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${hw.checked ? "border-green-200 bg-green-50" : "border-gray-100 hover:bg-gray-50"}`}
                    >
                      <div>
                        <span className="text-xs font-semibold text-blue-500 mr-2">{hw.subject}</span>
                        <span className="text-sm">{hw.description}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{hw.due_date}</p>
                      </div>
                      <span className={`text-sm font-semibold ${hw.checked ? "text-green-500" : "text-blue-500"}`}>
                        {hw.checked ? "결과보기" : "검사하기"} →
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
