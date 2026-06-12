import { NextResponse } from "next/server";
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

export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = adminClient();

  const { data: homeworks, error } = await admin
    .from("homeworks")
    .select("id, pair_id, subject, description, due_date, due_time, reward_amount, is_completed, completed_at, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 페어 정보 조회
  const pairIds = [...new Set((homeworks ?? []).map((h) => h.pair_id))];
  const { data: pairs } = await admin
    .from("pairs")
    .select("id, parent_id, child_id, pair_name")
    .in("id", pairIds);

  // 유저 프로필 조회
  const userIds = [...new Set([
    ...(pairs ?? []).map((p) => p.parent_id),
    ...(pairs ?? []).map((p) => p.child_id).filter(Boolean),
  ])];
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, display_name, role")
    .in("id", userIds);

  const pairMap = Object.fromEntries((pairs ?? []).map((p) => [p.id, p]));
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const result = (homeworks ?? []).map((h) => {
    const pair = pairMap[h.pair_id];
    return {
      ...h,
      pair_name: pair?.pair_name ?? null,
      parent_name: pair ? (profileMap[pair.parent_id]?.display_name ?? null) : null,
      child_name: pair?.child_id ? (profileMap[pair.child_id]?.display_name ?? null) : null,
    };
  });

  return NextResponse.json({ homeworks: result });
}
