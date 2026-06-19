import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import Icon from "@/components/ui/Icon";

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
      <div style={{ minHeight: "100svh", background: "var(--bg)", maxWidth: 430, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 88, height: 88, borderRadius: 26, background: "#E9F4EC",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <Icon name="clock" size={46} color="#9DB3A6" stroke={1.9} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--muted)" }}>아직 채점이 완료되지 않았어요.</p>
          <a
            href="/child/calendar"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              marginTop: 16, fontSize: 14, fontWeight: 700,
              color: "var(--green-d)", textDecoration: "none",
            }}
          >
            <Icon name="arrow-left" size={16} color="var(--green-d)" stroke={2.2} />
            캘린더로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  const result = check.results;
  const pct = Math.round((check.score / check.total_problems) * 100);
  const scoreGrad = pct >= 80
    ? "linear-gradient(150deg,#34D399,#16A34A)"
    : pct >= 60
    ? "linear-gradient(150deg,#FBBF24,#F59E0B)"
    : "linear-gradient(150deg,#FB7185,#E11D48)";

  return (
    <div style={{ minHeight: "100svh", background: "var(--bg)", maxWidth: 430, margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 18px 14px", flexShrink: 0 }}>
        <BackButton />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>채점 결과</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
            {hw?.subject} — {hw?.description}
          </p>
        </div>
      </div>

      <div style={{ padding: "0 20px 40px" }}>
        {/* 점수 카드 */}
        <div
          style={{
            borderRadius: 24, padding: "22px 22px 20px",
            background: scoreGrad, color: "#fff",
            boxShadow: "var(--sh-hero-green)", marginBottom: 20,
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", right: -26, top: -26, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.12)", pointerEvents: "none" }} />
          <p style={{ fontSize: 13.5, fontWeight: 700, opacity: 0.9 }}>내 점수</p>
          <p style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 4 }}>
            {pct}<span style={{ fontSize: 24 }}>점</span>
          </p>
          <p style={{ fontSize: 13.5, fontWeight: 700, opacity: 0.9, marginTop: 4 }}>
            {check.score}/{check.total_problems} 문제 맞음
          </p>
          <p style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.9, marginTop: 10, lineHeight: 1.6 }}>
            {result.feedback}
          </p>
        </div>

        {/* 문제별 결과 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {result.problems.map((p: {
            number: number;
            question: string;
            studentAnswer: string;
            isCorrect: boolean;
            explanation: string | null;
          }) => (
            <div
              key={p.number}
              style={{
                background: "#fff", borderRadius: "var(--r-card)", padding: 16,
                boxShadow: "var(--sh-sm)",
                borderLeft: `4px solid ${p.isCorrect ? "var(--green)" : "var(--red)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: p.isCorrect ? "var(--green)" : "var(--red)" }}>
                  {p.isCorrect ? "O" : "X"}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                    {p.number}번. {p.question}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                    내 답: <span style={{ fontWeight: 700 }}>{p.studentAnswer}</span>
                  </p>
                  {!p.isCorrect && p.explanation && (
                    <div style={{
                      marginTop: 8, background: "var(--green-50)", borderRadius: 12, padding: "10px 12px",
                      border: "1px solid var(--green-200)",
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: "var(--green-d)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon name="sparkles" size={13} color="var(--green-d)" stroke={2} />
                        이렇게 풀어봐요
                      </p>
                      <p style={{ fontSize: 13, color: "var(--text-soft)", lineHeight: 1.6 }}>{p.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
