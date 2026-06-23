-- device_tokens: 본인 토큰만 CRUD
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_tokens_select" ON device_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "own_tokens_insert" ON device_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_tokens_update" ON device_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "own_tokens_delete" ON device_tokens
  FOR DELETE USING (user_id = auth.uid());

-- notifications: 본인 알림만 읽기·업데이트(is_read 처리)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_notifications_select" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "own_notifications_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
