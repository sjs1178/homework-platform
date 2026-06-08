import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeworkCheckForm from "./HomeworkCheckForm";

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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/parent/dashboard" className="text-gray-400 hover:text-gray-600">←</a>
          <div>
            <h1 className="text-xl font-bold">숙제 검사</h1>
            <p className="text-sm text-gray-500">{hw.subject} — {hw.description}</p>
          </div>
        </div>
        <HomeworkCheckForm
          homeworkId={homeworkId}
          checkId={existing?.id ?? null}
          existingResult={existing?.results ?? null}
          existingScore={existing ? { score: existing.score, total: existing.total_problems } : null}
          isReviewed={existing?.is_reviewed ?? false}
        />
      </div>
    </main>
  );
}
