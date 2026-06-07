import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ChildRewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id")
    .eq("id", user.id)
    .single();

  if (!profile?.pair_id) redirect("/child/dashboard");

  const { data: logs } = await supabase
    .from("reward_logs")
    .select("*")
    .eq("pair_id", profile.pair_id)
    .eq("child_id", user.id)
    .order("created_at", { ascending: false });

  const { data: settings } = await supabase
    .from("reward_settings")
    .select("*")
    .eq("pair_id", profile.pair_id)
    .single();

  const totalEarned = (logs ?? []).filter((l) => l.type === "earn").reduce((s, l) => s + l.amount, 0);
  const totalSpent = (logs ?? []).filter((l) => l.type === "spend").reduce((s, l) => s + l.amount, 0);
  const balance = totalEarned - totalSpent;

  const unit = settings?.point_reward_unit ?? "P";
  const name = settings?.point_reward_name ?? "리워드";

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/child/dashboard" className="text-gray-400 hover:text-gray-600">←</a>
          <h1 className="text-xl font-bold">내 {name}</h1>
        </div>

        {/* 잔액 카드 */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl p-6 text-white mb-4 shadow-sm">
          <p className="text-sm opacity-80">현재 잔액</p>
          <p className="text-4xl font-bold mt-1">{balance.toLocaleString()}{unit}</p>
          <div className="flex gap-4 mt-4 text-sm opacity-80">
            <span>총 적립 {totalEarned.toLocaleString()}{unit}</span>
            <span>총 사용 {totalSpent.toLocaleString()}{unit}</span>
          </div>
        </div>

        {/* 내역 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-500 mb-3">내역</p>
          {!logs?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">아직 내역이 없어요</p>
          ) : (
            <div className="flex flex-col gap-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm">{log.note ?? (log.type === "earn" ? "적립" : "사용")}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className={`font-bold ${log.type === "earn" ? "text-green-500" : "text-red-400"}`}>
                    {log.type === "earn" ? "+" : "-"}{log.amount.toLocaleString()}{unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
