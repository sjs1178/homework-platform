import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ParentCalendarView from "./ParentCalendarView";
import BottomNav from "@/components/ui/BottomNav";

export default async function ParentCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: pairs } = await supabase
    .from("pairs")
    .select("id, child_id, user_profiles!pairs_child_id_fkey(display_name)")
    .eq("parent_id", user.id)
    .eq("status", "active");

  const allPairIds = (pairs ?? []).map((p) => p.id);
  if (allPairIds.length === 0) {
    return (
      <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", gap: 12 }}>
          <div style={{ fontSize: 40 }}>📅</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", textAlign: "center" }}>연결된 자녀가 없어요</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
            설정에서 자녀를 먼저 추가해주세요.
          </p>
        </div>
        <BottomNav active="캘린더" role="parent" />
      </div>
    );
  }

  // Build child name map: pair_id → childName
  const childNameByPairId: Record<string, string | null> = {};
  (pairs ?? []).forEach((p) => {
    const profile = Array.isArray(p.user_profiles) ? p.user_profiles[0] : p.user_profiles;
    childNameByPairId[p.id] = (profile as { display_name: string | null } | null)?.display_name ?? null;
  });

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

  const homeworksWithMeta = (homeworks ?? []).map((h) => ({
    ...h,
    hasCheck: checkedIds.has(h.id),
    childName: childNameByPairId[h.pair_id] ?? null,
  }));

  return (
    <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ padding: "16px 20px 8px", flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>숙제 캘린더</h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
        <ParentCalendarView
          year={year}
          month={month}
          homeworks={homeworksWithMeta}
          pairIds={allPairIds}
        />
      </div>

      <BottomNav active="캘린더" role="parent" />
    </div>
  );
}
