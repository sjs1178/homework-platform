-- 020_reward_child_centric.sql
-- 리워드를 child_id 중심으로 전환: 자녀 + 연결된 모든 부모(공동양육자)가
-- 동일한 잔액·내역·요청을 공유하도록 RLS 정책 변경.
-- 기존에는 pair_id 기준이라 부모마다 별도 pair로 데이터가 분리됐음.

-- ── reward_logs: 자녀 본인 + 연결된 모든 부모가 조회/관리 ──────────────
DROP POLICY IF EXISTS "reward_logs_pair" ON reward_logs;
CREATE POLICY "reward_logs_child_centric" ON reward_logs
  FOR ALL USING (
    child_id = auth.uid()
    OR child_id IN (
      SELECT child_id FROM pairs
      WHERE parent_id = auth.uid() AND status = 'active'
    )
  );

-- ── reward_requests: 연결된 모든 부모가 조회/수정 (child_id 기준) ──────
DROP POLICY IF EXISTS "parent_read_pair" ON reward_requests;
DROP POLICY IF EXISTS "parent_update_pair" ON reward_requests;

CREATE POLICY "parent_read_child" ON reward_requests
  FOR SELECT USING (
    child_id IN (
      SELECT child_id FROM pairs
      WHERE parent_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "parent_update_child" ON reward_requests
  FOR UPDATE USING (
    child_id IN (
      SELECT child_id FROM pairs
      WHERE parent_id = auth.uid() AND status = 'active'
    )
  );
