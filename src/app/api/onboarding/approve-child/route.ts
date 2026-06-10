import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { approvalId } = await req.json();
  if (!approvalId) return NextResponse.json({ error: "승인 ID 누락" }, { status: 400 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 승인 요청 조회 (service role로 이메일 매칭)
  const { data: approval, error: fetchErr } = await admin
    .from("pending_approvals")
    .select("*")
    .eq("id", approvalId)
    .eq("parent_email", user.email!.toLowerCase())
    .eq("status", "pending")
    .single();

  if (fetchErr || !approval) {
    return NextResponse.json({ error: "유효하지 않은 승인 요청입니다" }, { status: 404 });
  }

  // 만료 확인
  if (new Date(approval.expires_at) < new Date()) {
    await admin.from("pending_approvals").update({ status: "expired" }).eq("id", approvalId);
    return NextResponse.json({ error: "만료된 요청입니다. 자녀에게 재요청을 부탁하세요." }, { status: 410 });
  }

  // 자녀 프로필 생성
  const childName = approval.child_name;

  await admin.from("user_profiles").upsert({
    id: approval.child_auth_id,
    role: approval.child_role ?? "child",
    display_name: childName,
    birthday: approval.child_birthday,
    consent_at: new Date().toISOString(),
    terms_version: "v1.0",
  });

  // 부모 프로필 확인 (부모도 이미 등록되어 있어야 함)
  const { data: parentProfile } = await admin
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!parentProfile) {
    return NextResponse.json({ error: "부모 프로필이 없습니다. 먼저 가입을 완료해주세요." }, { status: 400 });
  }

  // 초대 코드 생성 + 페어 자동 생성
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data: pair, error: pairErr } = await admin.from("pairs").insert({
    parent_id: user.id,
    child_id: approval.child_auth_id,
    invite_code: inviteCode,
    pair_name: childName,
    status: "active",
  }).select("id").single();

  if (pairErr) {
    return NextResponse.json({ error: "페어 생성 실패: " + pairErr.message }, { status: 500 });
  }

  // 자녀 프로필에 pair_id 기록 (primary pair)
  await admin.from("user_profiles")
    .update({ pair_id: pair.id })
    .eq("id", approval.child_auth_id)
    .is("pair_id", null);

  // 승인 완료 처리 + 동의 기록
  await admin.from("pending_approvals").update({
    status: "approved",
    approved_at: new Date().toISOString(),
    parent_consent_data: {
      parent_id: user.id,
      agreed_to_terms: true,
      agreed_to_privacy: true,
      agreed_on_behalf_of_minor: true,
      terms_version: "v1.0",
      timestamp: new Date().toISOString(),
    },
  }).eq("id", approvalId);

  return NextResponse.json({ ok: true, pairId: pair.id });
}
