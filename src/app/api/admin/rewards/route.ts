import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { ADMIN_COOKIE, ADMIN_TOKEN } from "@/lib/admin-auth";

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === ADMIN_TOKEN;
}

// GET — reward overview for all pairs, or detail for one pair
// ?pairId=xxx for detail
export async function GET(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = adminClient();
  const pairId = new URL(req.url).searchParams.get("pairId");

  if (pairId) {
    const { data: logs } = await admin
      .from("reward_logs")
      .select("id, type, amount, note, created_at")
      .eq("pair_id", pairId)
      .order("created_at", { ascending: false })
      .limit(200);
    return NextResponse.json({ logs: logs ?? [] });
  }

  // Summary for all pairs
  const { data: pairs } = await admin
    .from("pairs")
    .select("id, parent_id, child_id")
    .order("created_at", { ascending: false });

  const allPairIds = (pairs ?? []).map((p) => p.id);
  const { data: logs } = await admin
    .from("reward_logs")
    .select("pair_id, type, amount")
    .in("pair_id", allPairIds);

  const { data: settings } = await admin
    .from("reward_settings")
    .select("pair_id, point_reward_name, point_reward_unit")
    .in("pair_id", allPairIds);

  const ids = new Set<string>();
  (pairs ?? []).forEach((p) => {
    if (p.parent_id) ids.add(p.parent_id);
    if (p.child_id) ids.add(p.child_id);
  });
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, display_name")
    .in("id", [...ids]);
  const pm = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.display_name]));

  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.pair_id, s]));

  const summary = (pairs ?? []).map((p) => {
    const pairLogs = (logs ?? []).filter((l) => l.pair_id === p.id);
    const earned = pairLogs.filter((l) => l.type === "earn").reduce((s, l) => s + l.amount, 0);
    const spent = pairLogs.filter((l) => l.type === "spend").reduce((s, l) => s + l.amount, 0);
    const cfg = settingsMap[p.id];
    return {
      pairId: p.id,
      parentName: pm[p.parent_id] ?? "—",
      childName: pm[p.child_id] ?? "—",
      rewardName: cfg?.point_reward_name ?? "리워드",
      unit: cfg?.point_reward_unit ?? "P",
      balance: earned - spent,
      totalEarned: earned,
      totalSpent: spent,
    };
  });

  return NextResponse.json({ summary });
}

// POST — admin adjust reward for a pair
export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pairId, type, amount, note } = await req.json();
  if (!pairId || !type || !amount)
    return NextResponse.json({ error: "pairId, type, amount required" }, { status: 400 });

  const admin = adminClient();

  const { data: pair } = await admin.from("pairs").select("child_id").eq("id", pairId).single();

  const { error } = await admin.from("reward_logs").insert({
    pair_id: pairId,
    child_id: pair?.child_id,
    type,
    amount,
    note: note || (type === "earn" ? "어드민 지급" : "어드민 차감"),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
