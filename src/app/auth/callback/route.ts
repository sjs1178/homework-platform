import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 로그인 후 역할 확인 → 역할 없으면 역할 선택 페이지로
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role, consent_at")
          .eq("id", user.id)
          .single();

        // 프로필 없거나 온보딩 미완료(consent_at 없음) → 온보딩으로
        if (!profile?.role || !profile?.consent_at) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
        return NextResponse.redirect(`${origin}/${profile.role}/dashboard`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
