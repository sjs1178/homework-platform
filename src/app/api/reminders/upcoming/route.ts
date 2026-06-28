import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getPrefsMap } from "@/lib/notify";
import { toKSTDateString } from "@/lib/date";

// 네이티브 앱이 온디바이스 로컬 알림을 예약하기 위한 데이터.
// 로그인 사용자에게 보여줄 "마감 N분 전" 리마인더 목록을 반환.
// 앱은 각 항목의 (dueAt - reminderMin) 시점에 로컬 알림을 예약/취소한다.
function kstToIso(dueDate: string, dueTime: string): string {
  const time = dueTime.length === 5 ? `${dueTime}:00` : dueTime;
  return new Date(`${dueDate}T${time}+09:00`).toISOString();
}

interface ReminderItem {
  homeworkId: string;
  subject: string;
  dueAt: string;       // ISO (UTC)
  reminderMin: number; // 마감 몇 분 전
  childName: string;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("user_profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  const todayStr = toKSTDateString();
  const weekLater = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const weekLaterStr = toKSTDateString(weekLater);
  const now = Date.now();

  async function homeworksForPairs(pairIds: string[]) {
    if (pairIds.length === 0) return [];
    const { data } = await admin
      .from("homeworks")
      .select("id, subject, due_date, due_time, is_completed")
      .in("pair_id", pairIds)
      .eq("is_completed", false)
      .not("due_time", "is", null)
      .gte("due_date", todayStr)
      .lte("due_date", weekLaterStr);
    return data ?? [];
  }

  const reminders: ReminderItem[] = [];

  if (profile?.role === "child") {
    const prefs = (await getPrefsMap(admin, [user.id]))[user.id];
    if (prefs.homework_reminder_min > 0) {
      const { data: pairs } = await admin
        .from("pairs").select("id").eq("child_id", user.id).eq("status", "active");
      const hws = await homeworksForPairs((pairs ?? []).map((p) => p.id));
      for (const hw of hws) {
        const dueAt = kstToIso(hw.due_date as string, hw.due_time as string);
        if (new Date(dueAt).getTime() <= now) continue;
        reminders.push({
          homeworkId: hw.id as string,
          subject: hw.subject as string,
          dueAt,
          reminderMin: prefs.homework_reminder_min,
          childName: profile.display_name ?? "자녀",
        });
      }
    }
  } else if (profile?.role === "parent") {
    // 부모: homework_notify_parent를 켠 자녀의 숙제만 (자녀가 설정한 분 단위)
    const { data: pairs } = await admin
      .from("pairs").select("child_id").eq("parent_id", user.id).eq("status", "active");
    const childIds = [...new Set((pairs ?? []).map((p) => p.child_id).filter(Boolean) as string[])];
    if (childIds.length) {
      const prefsMap = await getPrefsMap(admin, childIds);
      const { data: childProfiles } = await admin
        .from("user_profiles").select("id, display_name").in("id", childIds);
      const nameMap = Object.fromEntries((childProfiles ?? []).map((c) => [c.id, c.display_name]));

      for (const childId of childIds) {
        const pref = prefsMap[childId];
        if (!pref.homework_notify_parent || pref.homework_reminder_min <= 0) continue;
        const { data: cpairs } = await admin
          .from("pairs").select("id").eq("child_id", childId).eq("status", "active");
        const hws = await homeworksForPairs((cpairs ?? []).map((p) => p.id));
        for (const hw of hws) {
          const dueAt = kstToIso(hw.due_date as string, hw.due_time as string);
          if (new Date(dueAt).getTime() <= now) continue;
          reminders.push({
            homeworkId: hw.id as string,
            subject: hw.subject as string,
            dueAt,
            reminderMin: pref.homework_reminder_min,
            childName: nameMap[childId] ?? "자녀",
          });
        }
      }
    }
  }

  return NextResponse.json({ reminders });
}
