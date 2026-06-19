import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, parentApprovalRequestEmail } from "@/lib/send-email";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { childName, childBirthday, parentEmail, role, termsAgreed, privacyAgreed } = await req.json();

  if (!childName || !childBirthday || !parentEmail) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }
  if (!termsAgreed || !privacyAgreed) {
    return NextResponse.json({ error: "이용약관 및 개인정보처리방침에 모두 동의해야 합니다." }, { status: 400 });
  }

  // 이미 pending 요청이 있는 경우 재사용
  const { data: existing } = await supabase
    .from("pending_approvals")
    .select("id, approval_code, status")
    .eq("child_auth_id", user.id)
    .eq("status", "pending")
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, approvalCode: existing.approval_code });
  }

  const { data, error } = await supabase.from("pending_approvals").insert({
    child_auth_id: user.id,
    child_name: childName,
    child_birthday: childBirthday,
    parent_email: parentEmail.toLowerCase().trim(),
    child_role: role ?? "child",
  }).select("approval_code").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const approvalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://kiddoloop.com"}/parent/approve`;
  const email = parentApprovalRequestEmail(childName, approvalUrl);
  sendEmail({ to: parentEmail.toLowerCase().trim(), ...email }).catch(console.error);

  return NextResponse.json({ ok: true, approvalCode: data.approval_code });
}
