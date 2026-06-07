import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ChildResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: homeworkId } = await searchParams;
  if (!homeworkId) redirect("/child/dashboard");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: hw } = await supabase
    .from("homeworks")
    .select("subject, description")
    .eq("id", homeworkId)
    .single();

  const { data: check } = await supabase
    .from("homework_checks")
    .select("*")
    .eq("homework_id", homeworkId)
    .single();

  if (!check) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">아직 채점이 완료되지 않았어요.</p>
          <a href="/child/calendar" className="text-blue-500 text-sm mt-2 block">← 캘린더로</a>
        </div>
      </main>
    );
  }

  const result = check.results;
  const pct = Math.round((check.score / check.total_problems) * 100);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/child/calendar" className="text-gray-400 hover:text-gray-600">←</a>
          <div>
            <h1 className="text-xl font-bold">채점 결과</h1>
            <p className="text-sm text-gray-500">{hw?.subject} — {hw?.description}</p>
          </div>
        </div>

        {/* 점수 카드 */}
        <div className={`rounded-2xl p-6 text-white mb-4 shadow-sm ${pct >= 80 ? "bg-gradient-to-br from-green-400 to-emerald-500" : pct >= 60 ? "bg-gradient-to-br from-yellow-400 to-orange-400" : "bg-gradient-to-br from-red-400 to-pink-500"}`}>
          <p className="text-sm opacity-80">내 점수</p>
          <p className="text-5xl font-bold mt-1">{pct}<span className="text-2xl">점</span></p>
          <p className="text-sm opacity-90 mt-2">{check.score}/{check.total_problems} 문제 맞음</p>
          <p className="text-sm mt-3 opacity-90">{result.feedback}</p>
        </div>

        {/* 문제별 결과 — 정답 없이 */}
        <div className="flex flex-col gap-3">
          {result.problems.map((p: {
            number: number;
            question: string;
            studentAnswer: string;
            isCorrect: boolean;
            explanation: string | null;
          }) => (
            <div key={p.number} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${p.isCorrect ? "border-green-400" : "border-red-400"}`}>
              <div className="flex items-start gap-2">
                <span className={`text-xl font-bold ${p.isCorrect ? "text-green-500" : "text-red-500"}`}>
                  {p.isCorrect ? "O" : "X"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">{p.number}번. {p.question}</p>
                  <p className="text-sm text-gray-500 mt-1">내 답: <span className="font-medium">{p.studentAnswer}</span></p>
                  {!p.isCorrect && p.explanation && (
                    <div className="mt-2 bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-600 mb-1">💡 이렇게 풀어봐요</p>
                      <p className="text-sm text-gray-700">{p.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
