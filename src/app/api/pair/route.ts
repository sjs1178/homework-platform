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

  // 이미 이 부모와 연결되어 있는지 확인
  const { data: existingLink } = await admin
    .from("pairs")
    .select("id")
    .eq("parent_id", pair.parent_id)
    .eq("child_id", user.id)
    .single();

  if (existingLink) {
    return NextResponse.json({ error: "이미 연결된 부모님입니다." }, { status: 409 });
  }

  // pair에 child_id 등록 (다:다 지원 - 기존 pair_id 유지, primary 없으면 설정)
  await admin.from("pairs").update({ child_id: user.id, status: "active" }).eq("id", pair.id);

  const { data: childProfile } = await admin
    .from("user_profiles")
    .select("pair_id")
    .eq("id", user.id)
    .single();

  // primary pair가 없는 경우에만 설정
  if (!childProfile?.pair_id) {
    await admin.from("user_profiles").update({ pair_id: pair.id }).eq("id", user.id);
  }

  return NextResponse.json({ ok: true });
}
