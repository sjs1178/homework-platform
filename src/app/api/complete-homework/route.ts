import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { notifyUsers, getPrefsMap, getParentIdsOfChild } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const { homeworkId } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { data: hw } = await supabase
    .from("homeworks")
    .select("*")
    .eq("id", homeworkId)
    .single();

  if (!hw || hw.is_completed) {
    return NextResponse.json({ error: "이미 완료됐거나 존재하지 않음" }, { status: 400 });
  }

  await supabase
    .from("homeworks")
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq("id", homeworkId);

  // 리워드는 부모가 검사 완료할 때만 지급 (자녀 완료 시 자동 지급하지 않음)

  // 검사 요청 알림: 자녀와 연결된 부모 중 check_request 켠 사람에게
  try {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: childProfile } = await admin
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    const childName = childProfile?.display_name ?? "자녀";
    const parentIds = await getParentIdsOfChild(admin, user.id);
    if (parentIds.length) {
      const prefs = await getPrefsMap(admin, parentIds);
      const targets = parentIds.filter((pid) => prefs[pid].check_request);
      if (targets.length) {
        await notifyUsers(admin, targets, {
          title: "숙제 검사 요청",
          body: `${childName}님이 '${hw.subject}' 숙제를 완료했어요. 검사해 주세요.`,
          type: "check_request",
          link: "/parent/dashboard",
        });
      }
    }
  } catch (e) {
    console.error("[complete-homework] notify failed:", e);
  }

  return NextResponse.json({ ok: true });
}
