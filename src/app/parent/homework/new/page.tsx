import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeworkInputForm from "./HomeworkInputForm";

export default async function NewHomeworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id")
    .eq("id", user.id)
    .single();

  if (!profile?.pair_id) redirect("/parent/dashboard");

  const { data: rules } = await supabase
    .from("subject_rules")
    .select("subject, rule_content")
    .eq("pair_id", profile.pair_id);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/parent/dashboard" className="text-gray-400 hover:text-gray-600">←</a>
          <h1 className="text-xl font-bold">숙제 입력</h1>
        </div>
        <HomeworkInputForm pairId={profile.pair_id} rules={rules ?? []} />
      </div>
    </main>
  );
}
