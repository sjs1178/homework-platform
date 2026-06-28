import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyUsers, getPrefsMap } from "@/lib/notify";
import { toKSTDateString } from "@/lib/date";

// KST(UTC+9) 기준 date/time 문자열을 UTC epoch(ms)로 변환
function kstToUtcMs(dueDate: string, dueTime: string): number {
  const time = dueTime.length === 5 ? `${dueTime}:00` : dueTime; // HH:MM → HH:MM:SS
  return new Date(`${dueDate}T${time}+09:00`).getTime();
}

export async function GET(req: NextRequest) {
  if (
    process.env.CRON_SECRET &&
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = Date.now();
  const todayStr = toKSTDateString();
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const tomorrowStr = toKSTDateString(tomorrow);

  // 마감 시간이 있고, 아직 미완료·미발송이며, 오늘~내일 마감인 숙제
  const { data: hws } = await admin
    .from("homeworks")
    .select("id, pair_id, subject, due_date, due_time, reminded_at, is_completed")
    .eq("is_completed", false)
    .is("reminded_at", null)
    .not("due_time", "is", null)
    .gte("due_date", todayStr)
    .lte("due_date", tomorrowStr);

  if (!hws?.length) {
    return NextResponse.json({ ok: true, sent: 0, checked: 0 });
  }

  // pair → child 매핑
  const pairIds = [...new Set(hws.map((h) => h.pair_id))];
  const { data: pairs } = await admin
    .from("pairs")
    .select("id, child_id, parent_id, status")
    .in("id", pairIds);
  const pairChild: Record<string, string> = {};
  for (const p of pairs ?? []) {
    if (p.child_id) pairChild[p.id] = p.child_id as string;
  }

  const childIds = [...new Set(Object.values(pairChild))];
  const prefs = await getPrefsMap(admin, childIds);

  // 자녀별 부모 목록 (homework_notify_parent용)
  const parentsOfChild: Record<string, string[]> = {};
  const { data: allPairs } = await admin
    .from("pairs")
    .select("child_id, parent_id, status")
    .in("child_id", childIds)
    .eq("status", "active");
  for (const p of allPairs ?? []) {
    const c = p.child_id as string;
    if (!parentsOfChild[c]) parentsOfChild[c] = [];
    if (p.parent_id) parentsOfChild[c].push(p.parent_id as string);
  }

  let sent = 0;
  for (const hw of hws) {
    const childId = pairChild[hw.pair_id];
    if (!childId) continue;
    const pref = prefs[childId];
    if (!pref || pref.homework_reminder_min <= 0) continue;

    const dueMs = kstToUtcMs(hw.due_date as string, hw.due_time as string);
    const remindAt = dueMs - pref.homework_reminder_min * 60_000;

    // 알림 시점 도달 & 아직 마감 전
    if (now < remindAt || now > dueMs) continue;

    const recipients = [childId];
    if (pref.homework_notify_parent) {
      recipients.push(...(parentsOfChild[childId] ?? []));
    }

    const dueLabel = (hw.due_time as string).slice(0, 5);
    await notifyUsers(admin, recipients, {
      title: "숙제 마감 알림",
      body: `'${hw.subject}' 숙제 마감이 ${dueLabel}까지예요.`,
      type: "homework_reminder",
      link: "/child/dashboard",
    });
    await admin.from("homeworks").update({ reminded_at: new Date().toISOString() }).eq("id", hw.id);
    sent++;
  }

  return NextResponse.json({ ok: true, sent, checked: hws.length, at: new Date().toISOString() });
}
