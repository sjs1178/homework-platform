import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import ParentCalendarView from "./ParentCalendarView";
import BottomNav from "@/components/ui/BottomNav";
import EmptyState from "@/components/ui/EmptyState";

export default async function ParentCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pairs } = await admin
    .from("pairs")
    .select("id, child_id")
    .eq("parent_id", user.id)
    .order("created_at");

  const connectedPairs = (pairs ?? []).filter((p) => p.child_id);
  const allPairIds = connectedPairs.map((p) => p.id);
  if (allPairIds.length === 0) {
    return (
      <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 80px" }}>
          <EmptyState
            icon="calendar"
            title="연결된 자녀가 없어요"
            actionLabel="자녀 추가하기"
            actionIcon="user-plus"
            actionHref="/parent/settings"
          />
        </div>
        <BottomNav active="캘린더" role="parent" />
      </div>
    );
  }

  // Build child name map: pair_id → childName
  const childIds = connectedPairs.map((p) => p.child_id!);
  const { data: childProfiles } = await admin
    .from("user_profiles")
    .select("id, display_name")
    .in("id", childIds);

  const profileMap = Object.fromEntries(
    (childProfiles ?? []).map((p) => [p.id, p.display_name])
  );
  const childNameByPairId: Record<string, string | null> = {};
  connectedPairs.forEach((p) => {
    childNameByPairId[p.id] = profileMap[p.child_id!] ?? null;
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

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
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
