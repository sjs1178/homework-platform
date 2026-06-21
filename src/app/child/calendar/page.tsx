import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CalendarView from "./CalendarView";
import BackButton from "@/components/ui/BackButton";
import BottomNav from "@/components/ui/BottomNav";
import NotificationSetup from "@/components/NotificationSetup";

export default async function ChildCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 다:다 지원: 자녀가 연결된 모든 페어 조회
  const { data: pairs } = await supabase
    .from("pairs")
    .select("id")
    .eq("child_id", user.id)
    .eq("status", "active");

  const allPairIds = (pairs ?? []).map((p) => p.id);
  if (allPairIds.length === 0) redirect("/child/dashboard");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const { data: homeworks } = await supabase
    .from("homeworks")
    .select("*")
    .in("pair_id", allPairIds)
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

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <NotificationSetup homeworks={homeworksWithCheck} />
        <CalendarView
          year={year}
          month={month}
          homeworks={homeworksWithCheck}
          childId={user.id}
          pairIds={allPairIds}
        />
      </div>

      <BottomNav active="캘린더" role="child" />
    </div>
  );
}
