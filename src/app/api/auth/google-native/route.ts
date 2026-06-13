import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { idToken, nonce } = await req.json();

  if (!idToken) {
    return NextResponse.json({ ok: false, error: "idToken required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    ...(nonce ? { nonce } : {}),
  });

  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: error?.message ?? "auth failed" }, { status: 401 });
  }

  // 프로필 확인 → 온보딩 미완료면 /onboarding, 완료면 역할별 대시보드
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, consent_at")
    .eq("id", data.user.id)
    .single();

  let redirectTo = "/onboarding";
  if (profile?.role && profile?.consent_at) {
    redirectTo = `/${profile.role}/dashboard`;
  }

  return NextResponse.json({ ok: true, redirectTo });
}
