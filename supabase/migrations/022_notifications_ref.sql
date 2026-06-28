-- 022_notifications_ref.sql
-- 알림 이력의 원본 참조(예: 숙제 id). 숙제 리마인더 이력의 중복 생성 방지에 사용.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ref_id uuid;

CREATE INDEX IF NOT EXISTS idx_notifications_user_ref
  ON notifications(user_id, type, ref_id);
