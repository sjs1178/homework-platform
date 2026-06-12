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

  const { data: checks, error } = await admin
    .from("homework_checks")
    .select("id, homework_id, pair_id, results, score, total_problems, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 숙제 정보
  const homeworkIds = [...new Set((checks ?? []).map((c) => c.homework_id))];
  const { data: homeworks } = await admin
    .from("homeworks")
    .select("id, subject, description, due_date")
    .in("id", homeworkIds);

  // 페어 정보
  const pairIds = [...new Set((checks ?? []).map((c) => c.pair_id))];
  const { data: pairs } = await admin
    .from("pairs")
    .select("id, parent_id, child_id")
    .in("id", pairIds);

  // 유저 프로필
  const userIds = [...new Set([
    ...(pairs ?? []).map((p) => p.parent_id),
    ...(pairs ?? []).map((p) => p.child_id).filter(Boolean),
  ])];
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, display_name")
    .in("id", userIds);

  const hwMap = Object.fromEntries((homeworks ?? []).map((h) => [h.id, h]));
  const pairMap = Object.fromEntries((pairs ?? []).map((p) => [p.id, p]));
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const result = (checks ?? []).map((c) => {
    const hw = hwMap[c.homework_id];
    const pair = pairMap[c.pair_id];
    return {
      ...c,
      subject: hw?.subject ?? null,
      description: hw?.description ?? null,
      due_date: hw?.due_date ?? null,
      parent_name: pair ? (profileMap[pair.parent_id]?.display_name ?? null) : null,
      child_name: pair?.child_id ? (profileMap[pair.child_id]?.display_name ?? null) : null,
    };
  });

  return NextResponse.json({ checks: result });
}
