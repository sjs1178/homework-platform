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
  if (jar.get(ADMIN_COOKIE)?.value !== ADMIN_TOKEN) return false;
  return true;
}

// GET /api/admin/users — list all users with profile info
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = adminClient();

  // All auth users
  const { data: authData, error } = await admin.auth.admin.listUsers({ perPage: 500 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // All profiles
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, role, display_name, pair_id, created_at");

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const users = (authData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at,
    profile: profileMap[u.id] ?? null,
  }));

  return NextResponse.json({ users });
}

// DELETE /api/admin/users — delete a user entirely
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const admin = adminClient();

  // If parent: delete their pairs (cascades homeworks/rewards)
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role, pair_id")
    .eq("id", userId)
    .single();

  if (profile?.role === "parent") {
    const { data: ownedPairs } = await admin
      .from("pairs")
      .select("id")
      .eq("parent_id", userId);
    for (const p of ownedPairs ?? []) {
      await admin.from("reward_logs").delete().eq("pair_id", p.id);
      await admin.from("reward_settings").delete().eq("pair_id", p.id);
      await admin.from("homeworks").delete().eq("pair_id", p.id);
      await admin.from("pairs").delete().eq("id", p.id);
    }
  } else if (profile?.role === "child") {
    // Nullify child_id in any pairs
    await admin.from("pairs").update({ child_id: null }).eq("child_id", userId);
  }

  // Delete user profile
  await admin.from("user_profiles").delete().eq("id", userId);

  // Delete from auth
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
