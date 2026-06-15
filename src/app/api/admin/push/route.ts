import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { ADMIN_COOKIE, ADMIN_TOKEN } from "@/lib/admin-auth";
import { sendFcmToUser } from "@/lib/fcm";

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

// GET: 디바이스 토큰이 등록된 사용자 목록
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();

  const { data: tokens } = await admin
    .from("device_tokens")
    .select("user_id, platform, updated_at");

  const userIds = [...new Set((tokens ?? []).map((t) => t.user_id))];

  if (userIds.length === 0) {
    return NextResponse.json({ users: [] });
  }

  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 500 });
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, display_name, role")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const authMap = Object.fromEntries(
    (authData?.users ?? []).map((u) => [u.id, u])
  );

  const tokensByUser: Record<string, number> = {};
  for (const t of tokens ?? []) {
    tokensByUser[t.user_id] = (tokensByUser[t.user_id] ?? 0) + 1;
  }

  const users = userIds.map((uid) => ({
    id: uid,
    email: authMap[uid]?.email ?? "—",
    displayName: profileMap[uid]?.display_name ?? "—",
    role: profileMap[uid]?.role ?? null,
    tokenCount: tokensByUser[uid] ?? 0,
  }));

  return NextResponse.json({ users });
}

// POST: 푸쉬 발송
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, title, body, imageUrl } = await req.json();

  if (!userId || !title || !body) {
    return NextResponse.json(
      { error: "userId, title, body 필수" },
      { status: 400 }
    );
  }

  const admin = adminClient();
  const { data: tokens } = await admin
    .from("device_tokens")
    .select("fcm_token")
    .eq("user_id", userId);

  if (!tokens?.length) {
    return NextResponse.json(
      { error: "해당 사용자의 등록된 디바이스 토큰이 없습니다" },
      { status: 404 }
    );
  }

  const fcmTokens = tokens.map((t) => t.fcm_token);
  const results = await sendFcmToUser(fcmTokens, title, body, imageUrl || undefined);

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success);

  return NextResponse.json({
    ok: true,
    sent: succeeded,
    failed: failed.length,
    errors: failed.map((f) => f.error),
  });
}
