import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeworkCheckForm from "./HomeworkCheckForm";
import Icon from "@/components/ui/Icon";

export default async function ParentHomeworkCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: homeworkId } = await searchParams;
  if (!homeworkId) redirect("/parent/dashboard");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: hw } = await supabase
    .from("homeworks")
    .select("*")
    .eq("id", homeworkId)
    .single();

  if (!hw) redirect("/parent/dashboard");

  const { data: existing } = await supabase
    .from("homework_checks")
    .select("*")
    .eq("homework_id", homeworkId)
    .single();

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          padding: "4px 18px 14px",
          gap: 8,
        }}
      >
        <a
          href="/parent/dashboard"
          style={{
            width: 40, height: 40, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <Icon name="arrow-left" size={23} color="var(--text)" stroke={2.2} />
        </a>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", lineHeight: 1.1 }}>
            숙제 검사
          </h1>
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 2, whiteSpace: "nowrap" }}>
            {hw.subject} · {hw.description}
          </div>
        </div>
      </div>

      {/* 폼 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 26px" }}>
        <HomeworkCheckForm
          homeworkId={homeworkId}
          checkId={existing?.id ?? null}
          existingResult={existing?.results ?? null}
          existingScore={existing ? { score: existing.score, total: existing.total_problems } : null}
          isReviewed={existing?.is_reviewed ?? false}
          subject={hw.subject}
        />
      </div>
    </div>
  );
}
