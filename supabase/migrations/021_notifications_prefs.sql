-- 021_notifications_prefs.sql
-- 알림 설정(사용자별) + 숙제 리마인더 추적 + 알림 분류 컬럼

-- ── 사용자별 알림 설정 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  homework_reminder_min int NOT NULL DEFAULT 30,        -- 자녀: 숙제 마감 N분 전 알림 (0 = 끔)
  homework_notify_parent boolean NOT NULL DEFAULT false, -- 자녀: 숙제 알림을 부모도 함께 수신
  check_request boolean NOT NULL DEFAULT true,           -- 부모: 자녀가 숙제 완료(검사 요청) 시 수신
  check_complete boolean NOT NULL DEFAULT true,          -- 자녀: 숙제 검사 완료 시 수신
  reward_change boolean NOT NULL DEFAULT true,           -- 리워드 변경 시 수신 (부모/자녀)
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_notification_prefs" ON notification_preferences
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 숙제 리마인더 중복 발송 방지 ───────────────────────────
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS reminded_at timestamptz;

-- ── 알림 분류 / 딥링크 ─────────────────────────────────────
-- type: homework_reminder | check_request | check_complete | reward_change | general
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'general';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link text;
