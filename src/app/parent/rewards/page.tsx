import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RewardsSettingForm from "./RewardsSettingForm";

export default async function ParentRewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id")
    .eq("id", user.id)
    .single();

  if (!profile?.pair_id) redirect("/parent/dashboard");

  const { data: settings } = await supabase
    .from("reward_settings")
    .select("*")
    .eq("pair_id", profile.pair_id)
    .single();

  const { data: logs } = await supabase
    .from("reward_logs")
    .select("*, homeworks(subject, description)")
    .eq("pair_id", profile.pair_id)
    .order("created_at", { ascending: false })
    .limit(20);

  const totalEarned = (logs ?? []).filter((l) => l.type === "earn").reduce((s, l) => s + l.amount, 0);
  const totalSpent = (logs ?? []).filter((l) => l.type === "spend").reduce((s, l) => s + l.amount, 0);
  const unit = settings?.point_reward_unit ?? "P";

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/parent/dashboard" className="text-gray-400 hover:text-gray-600">←</a>
          <h1 className="text-xl font-bold">리워드 관리</h1>
        </div>

        {/* 현황 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <p className="text-sm font-semibold text-gray-500 mb-2">자녀 리워드 현황</p>
          <div className="flex gap-4">
            <div className="flex-1 text-center p-3 bg-green-50 rounded-xl">
              <p className="text-xs text-gray-400">총 적립</p>
              <p className="text-xl font-bold text-green-500">{totalEarned.toLocaleString()}{unit}</p>
            </div>
            <div className="flex-1 text-center p-3 bg-red-50 rounded-xl">
              <p className="text-xs text-gray-400">총 사용</p>
              <p className="text-xl font-bold text-red-400">{totalSpent.toLocaleString()}{unit}</p>
            </div>
            <div className="flex-1 text-center p-3 bg-yellow-50 rounded-xl">
              <p className="text-xs text-gray-400">잔액</p>
              <p className="text-xl font-bold text-yellow-500">{(totalEarned - totalSpent).toLocaleString()}{unit}</p>
            </div>
          </div>
        </div>

        {/* 설정 */}
        <RewardsSettingForm pairId={profile.pair_id} settings={settings} />

        {/* 내역 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mt-4">
          <p className="text-sm font-semibold text-gray-500 mb-3">최근 내역</p>
          {!logs?.length ? (
            <p className="text-gray-400 text-sm text-center py-4">내역이 없어요</p>
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
