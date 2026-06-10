import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { role, displayName, birthday } = await req.json();

  if (!role || !displayName || !birthday) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }
  if (!["parent", "child"].includes(role)) {
    return NextResponse.json({ error: "올바른 역할이 아닙니다" }, { status: 400 });
  }

  const { error } = await supabase.from("user_profiles").upsert({
    id: user.id,
    role,
    display_name: displayName,
    birthday,
    consent_at: new Date().toISOString(),
    terms_version: "v1.0",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role });
}
