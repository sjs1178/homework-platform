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

// GET — list all pairs with parent/child info
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = adminClient();

  const { data: pairs } = await admin
    .from("pairs")
    .select("id, invite_code, pair_name, parent_id, child_id, created_at")
    .order("created_at", { ascending: false });

  // Collect all user IDs
  const ids = new Set<string>();
  (pairs ?? []).forEach((p) => {
    if (p.parent_id) ids.add(p.parent_id);
    if (p.child_id) ids.add(p.child_id);
  });

  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, display_name, role")
    .in("id", [...ids]);

  const pm = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 500 });
  const emails = Object.fromEntries(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  const result = (pairs ?? []).map((p) => ({
    id: p.id,
    inviteCode: p.invite_code,
    pairName: p.pair_name,
    createdAt: p.created_at,
    parent: p.parent_id
      ? { id: p.parent_id, name: pm[p.parent_id]?.display_name ?? "—", email: emails[p.parent_id] ?? "—" }
      : null,
    child: p.child_id
      ? { id: p.child_id, name: pm[p.child_id]?.display_name ?? "—", email: emails[p.child_id] ?? "—" }
      : null,
  }));

  return NextResponse.json({ pairs: result });
}

// PATCH — update pair: change child_id
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pairId, childId } = await req.json();
  if (!pairId) return NextResponse.json({ error: "pairId required" }, { status: 400 });

  const admin = adminClient();

  // Remove this child from any other pair first
  if (childId) {
    await admin.from("pairs").update({ child_id: null }).eq("child_id", childId).neq("id", pairId);
    // Update child's pair_id in user_profiles
    await admin.from("user_profiles").update({ pair_id: pairId }).eq("id", childId);
  }

  const { error } = await admin
    .from("pairs")
    .update({ child_id: childId ?? null })
    .eq("id", pairId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE — delete a pair entirely
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pairId } = await req.json();
  if (!pairId) return NextResponse.json({ error: "pairId required" }, { status: 400 });

  const admin = adminClient();
  await admin.from("reward_logs").delete().eq("pair_id", pairId);
  await admin.from("reward_settings").delete().eq("pair_id", pairId);
  await admin.from("homeworks").delete().eq("pair_id", pairId);
  await admin.from("pairs").delete().eq("id", pairId);

  return NextResponse.json({ ok: true });
}
