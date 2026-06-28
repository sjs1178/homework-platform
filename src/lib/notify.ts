import type { SupabaseClient } from "@supabase/supabase-js";
import { sendFcmToUser } from "./fcm";
import { toKSTDateString } from "./date";

export type NotificationType =
  | "homework_reminder"
  | "check_request"
  | "check_complete"
  | "reward_change"
  | "general";

export interface NotificationPrefs {
  homework_reminder_min: number;
  homework_notify_parent: boolean;
  check_request: boolean;
  check_complete: boolean;
  reward_change: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  homework_reminder_min: 30,
  homework_notify_parent: false,
  check_request: true,
  check_complete: true,
  reward_change: true,
};

interface NotifyPayload {
  title: string;
  body: string;
  type?: NotificationType;
  link?: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

// 여러 사용자에게 알림: 플랫폼 내 이력(notifications) 저장 + FCM 푸시 발송.
// admin은 service role 클라이언트여야 함.
export async function notifyUsers(
  admin: SupabaseClient,
  userIds: string[],
  payload: NotifyPayload
): Promise<void> {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return;

  const { title, body, type = "general", link, imageUrl, data } = payload;

  // 1) 플랫폼 내 알림 이력 저장
  await admin.from("notifications").insert(
    ids.map((user_id) => ({
      user_id,
      title,
      body,
      type,
      link: link ?? null,
      image_url: imageUrl ?? null,
    }))
  );

  // 2) FCM 푸시 (등록된 디바이스 토큰이 있는 경우)
  const { data: tokens } = await admin
    .from("device_tokens")
    .select("user_id, fcm_token")
    .in("user_id", ids);

  if (!tokens?.length) return;

  const fcmData = { type, ...(link ? { link } : {}), ...(data ?? {}) };
  await Promise.all(
    tokens.map((t) =>
      sendFcmToUser([t.fcm_token], title, body, imageUrl, fcmData).catch(() => null)
    )
  );
}

// 사용자별 알림 설정 조회 (없으면 기본값)
export async function getPrefsMap(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Record<string, NotificationPrefs>> {
  const ids = [...new Set(userIds)].filter(Boolean);
  const map: Record<string, NotificationPrefs> = {};
  for (const id of ids) map[id] = { ...DEFAULT_PREFS };
  if (ids.length === 0) return map;

  const { data } = await admin
    .from("notification_preferences")
    .select("*")
    .in("user_id", ids);

  for (const row of data ?? []) {
    map[row.user_id] = {
      homework_reminder_min: row.homework_reminder_min ?? DEFAULT_PREFS.homework_reminder_min,
      homework_notify_parent: row.homework_notify_parent ?? DEFAULT_PREFS.homework_notify_parent,
      check_request: row.check_request ?? DEFAULT_PREFS.check_request,
      check_complete: row.check_complete ?? DEFAULT_PREFS.check_complete,
      reward_change: row.reward_change ?? DEFAULT_PREFS.reward_change,
    };
  }
  return map;
}

// 특정 자녀와 연결된 부모 user_id 목록 (active pair 기준)
export async function getParentIdsOfChild(
  admin: SupabaseClient,
  childId: string
): Promise<string[]> {
  const { data } = await admin
    .from("pairs")
    .select("parent_id")
    .eq("child_id", childId)
    .eq("status", "active");
  return [...new Set((data ?? []).map((p) => p.parent_id as string))].filter(Boolean);
}

export interface ReminderItem {
  homeworkId: string;
  subject: string;
  dueAtMs: number;     // 마감 시각 (UTC epoch ms)
  reminderMin: number; // 마감 몇 분 전
  childName: string;
  link: string;        // 딥링크 (역할별)
}

function kstToMs(dueDate: string, dueTime: string): number {
  const time = dueTime.length === 5 ? `${dueTime}:00` : dueTime;
  return new Date(`${dueDate}T${time}+09:00`).getTime();
}

// 로그인 사용자에게 보여줄 "마감 N분 전" 리마인더 대상 숙제 목록.
// 온디바이스 로컬 알림 예약(API) + 인앱 이력 지연 생성에서 공용으로 사용.
export async function getReminderItems(
  admin: SupabaseClient,
  userId: string
): Promise<ReminderItem[]> {
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role, display_name")
    .eq("id", userId)
    .single();
  if (!profile) return [];

  const todayStr = toKSTDateString();
  const weekLaterStr = toKSTDateString(new Date(Date.now() + 7 * 24 * 3600 * 1000));

  async function hwForPairs(pairIds: string[]) {
    if (pairIds.length === 0) return [];
    const { data } = await admin
      .from("homeworks")
      .select("id, subject, due_date, due_time")
      .in("pair_id", pairIds)
      .eq("is_completed", false)
      .not("due_time", "is", null)
      .gte("due_date", todayStr)
      .lte("due_date", weekLaterStr);
    return data ?? [];
  }

  const items: ReminderItem[] = [];

  if (profile.role === "child") {
    const pref = (await getPrefsMap(admin, [userId]))[userId];
    if (pref.homework_reminder_min <= 0) return [];
    const { data: pairs } = await admin
      .from("pairs").select("id").eq("child_id", userId).eq("status", "active");
    const hws = await hwForPairs((pairs ?? []).map((p) => p.id));
    for (const hw of hws) {
      items.push({
        homeworkId: hw.id as string,
        subject: hw.subject as string,
        dueAtMs: kstToMs(hw.due_date as string, hw.due_time as string),
        reminderMin: pref.homework_reminder_min,
        childName: profile.display_name ?? "자녀",
        link: "/child/dashboard",
      });
    }
  } else if (profile.role === "parent") {
    const { data: pairs } = await admin
      .from("pairs").select("child_id").eq("parent_id", userId).eq("status", "active");
    const childIds = [...new Set((pairs ?? []).map((p) => p.child_id).filter(Boolean) as string[])];
    if (childIds.length === 0) return [];
    const prefsMap = await getPrefsMap(admin, childIds);
    const { data: childProfiles } = await admin
      .from("user_profiles").select("id, display_name").in("id", childIds);
    const nameMap = Object.fromEntries((childProfiles ?? []).map((c) => [c.id, c.display_name]));

    for (const childId of childIds) {
      const pref = prefsMap[childId];
      if (!pref.homework_notify_parent || pref.homework_reminder_min <= 0) continue;
      const { data: cpairs } = await admin
        .from("pairs").select("id").eq("child_id", childId).eq("status", "active");
      const hws = await hwForPairs((cpairs ?? []).map((p) => p.id));
      for (const hw of hws) {
        items.push({
          homeworkId: hw.id as string,
          subject: hw.subject as string,
          dueAtMs: kstToMs(hw.due_date as string, hw.due_time as string),
          reminderMin: pref.homework_reminder_min,
          childName: (nameMap[childId] as string) ?? "자녀",
          link: "/parent/dashboard",
        });
      }
    }
  }

  return items;
}

// 리마인더 시각이 지난 숙제를 인앱 알림 이력으로 지연 생성(중복 방지).
// 로컬 알림은 기기에서만 울리므로, 사용자가 앱/웹을 열 때 이력을 보강한다.
export async function materializeDueReminders(
  admin: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    const items = await getReminderItems(admin, userId);
    if (items.length === 0) return;
    const now = Date.now();
    const GRACE_MS = 12 * 3600 * 1000; // 마감 후 12시간까지만 이력화

    for (const it of items) {
      const remindAt = it.dueAtMs - it.reminderMin * 60_000;
      if (now < remindAt || now > it.dueAtMs + GRACE_MS) continue;

      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "homework_reminder")
        .eq("ref_id", it.homeworkId)
        .limit(1)
        .maybeSingle();
      if (existing) continue;

      await admin.from("notifications").insert({
        user_id: userId,
        title: "숙제 마감 알림",
        body: `'${it.subject}' 숙제 마감이 ${new Date(it.dueAtMs).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}까지예요.`,
        type: "homework_reminder",
        link: it.link,
        ref_id: it.homeworkId,
        created_at: new Date(remindAt).toISOString(),
      });
    }
  } catch (e) {
    console.error("[materializeDueReminders] failed:", e);
  }
}
