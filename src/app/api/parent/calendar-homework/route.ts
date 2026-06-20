import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  if (!year || !month) return NextResponse.json({ error: "year, month 필요" }, { status: 400 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pairs } = await admin
    .from("pairs")
    .select("id, child_id")
    .eq("parent_id", user.id);

  const childIds = (pairs ?? []).filter((p) => p.child_id).map((p) => p.child_id!);
  if (childIds.length === 0) return NextResponse.json({ homeworks: [] });

  const { data: allChildPairs } = await admin
    .from("pairs")
    .select("id, child_id")
    .in("child_id", childIds);

  const allPairIds = [...new Set((allChildPairs ?? []).map((p) => p.id))];

  const { data: childProfiles } = await admin
    .from("user_profiles")
    .select("id, display_name")
    .in("id", childIds);
  const nameMap = Object.fromEntries((childProfiles ?? []).map((p) => [p.id, p.display_name]));
  const pairChildName: Record<string, string | null> = {};
  (allChildPairs ?? []).forEach((p) => { pairChildName[p.id] = nameMap[p.child_id] ?? null; });

  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const { data: homeworks } = await admin
    .from("homeworks")
    .select("*")
    .in("pair_id", allPairIds)
    .gte("due_date", from)
    .lte("due_date", to)
    .order("due_date");

  const hwIds = (homeworks ?? []).map((h) => h.id);
  let checkedIds = new Set<string>();
  if (hwIds.length) {
    const { data: checks } = await admin
      .from("homework_checks")
      .select("homework_id")
      .in("homework_id", hwIds);
    checkedIds = new Set(checks?.map((c) => c.homework_id) ?? []);
  }

  const result = (homeworks ?? []).map((h) => ({
    ...h,
    hasCheck: checkedIds.has(h.id),
    childName: pairChildName[h.pair_id] ?? null,
  }));

  return NextResponse.json({ homeworks: result });
}
