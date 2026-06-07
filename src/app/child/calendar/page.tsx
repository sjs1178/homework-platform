import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CalendarView from "./CalendarView";
import NotificationSetup from "@/components/NotificationSetup";

export default async function ChildCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id")
    .eq("id", user.id)
    .single();

  if (!profile?.pair_id) redirect("/child/dashboard");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const { data: homeworks } = await supabase
    .from("homeworks")
    .select("*")
    .eq("pair_id", profile.pair_id)
    .gte("due_date", from)
    .lte("due_date", to)
    .order("due_date");

  // 채점 완료된 숙제 ID 조회
  const hwIds = (homeworks ?? []).map((h) => h.id);
  let checkedIds = new Set<string>();
  if (hwIds.length) {
    const { data: checks } = await supabase
      .from("homework_checks")
      .select("homework_id")
      .in("homework_id", hwIds);
    checkedIds = new Set(checks?.map((c) => c.homework_id) ?? []);
  }

  const homeworksWithCheck = (homeworks ?? []).map((h) => ({
    ...h,
    hasCheck: checkedIds.has(h.id),
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/child/dashboard" className="text-gray-400 hover:text-gray-600">←</a>
          <h1 className="text-xl font-bold">{year}년 {month}월 숙제</h1>
        </div>
        <NotificationSetup homeworks={homeworksWithCheck} />
        <CalendarView
          year={year}
          month={month}
          homeworks={homeworksWithCheck}
          childId={user.id}
        />
      </div>
    </main>
  );
}
