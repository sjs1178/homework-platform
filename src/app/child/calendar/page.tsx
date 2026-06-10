import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CalendarView from "./CalendarView";
import BackButton from "@/components/ui/BackButton";
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
    <div
      style={{
        minHeight: "100svh",
        background: "#F1F7F3",
        display: "flex",
        flexDirection: "column",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: "flex", alignItems: "center",
          padding: "4px 18px 12px", gap: 6, flexShrink: 0,
        }}
      >
        <BackButton />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>숙제 캘린더</h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
        <NotificationSetup homeworks={homeworksWithCheck} />
        <CalendarView
          year={year}
          month={month}
          homeworks={homeworksWithCheck}
          childId={user.id}
          pairId={profile.pair_id}
        />
      </div>
    </div>
  );
}
