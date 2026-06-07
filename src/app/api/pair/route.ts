import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  // 현재 로그인한 유저 확인
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  // service role로 초대 코드 조회 (RLS 우회)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pair } = await admin
    .from("pairs")
    .select("*")
    .eq("invite_code", code.toUpperCase())
    .is("child_id", null)
    .single();

  if (!pair) {
    return NextResponse.json({ error: "유효하지 않은 코드입니다. 다시 확인해주세요." }, { status: 404 });
  }

  // pair에 child_id 등록
  await admin.from("pairs").update({ child_id: user.id }).eq("id", pair.id);
  await admin.from("user_profiles").update({ pair_id: pair.id }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
