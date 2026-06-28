import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getReminderItems } from "@/lib/notify";

// 네이티브 앱이 온디바이스 로컬 알림을 예약하기 위한 데이터.
// 앱은 각 항목의 (dueAt - reminderMin) 시점에 로컬 알림을 예약/취소한다.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const items = await getReminderItems(admin, user.id);
  const now = Date.now();

  const reminders = items
    .filter((it) => it.dueAtMs > now)
    .map((it) => ({
      homeworkId: it.homeworkId,
      subject: it.subject,
      dueAt: new Date(it.dueAtMs).toISOString(),
      reminderMin: it.reminderMin,
      childName: it.childName,
    }));

  return NextResponse.json({ reminders });
}
