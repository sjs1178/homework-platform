import type { SupabaseClient } from "@supabase/supabase-js";
import { sendFcmToUser } from "./fcm";

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
