-- 자녀 → 부모 리워드 요청 테이블
CREATE TABLE IF NOT EXISTS reward_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reward_requests_pair_id ON reward_requests(pair_id);
CREATE INDEX IF NOT EXISTS idx_reward_requests_status ON reward_requests(status);

-- RLS
ALTER TABLE reward_requests ENABLE ROW LEVEL SECURITY;

-- 자녀: 자신의 요청 읽기/생성
CREATE POLICY "child_read_own" ON reward_requests
  FOR SELECT USING (child_id = auth.uid());

CREATE POLICY "child_insert_own" ON reward_requests
  FOR INSERT WITH CHECK (child_id = auth.uid());

-- 부모: 자신의 pair 요청 읽기/수정
CREATE POLICY "parent_read_pair" ON reward_requests
  FOR SELECT USING (
    pair_id IN (SELECT id FROM pairs WHERE parent_id = auth.uid())
  );

CREATE POLICY "parent_update_pair" ON reward_requests
  FOR UPDATE USING (
    pair_id IN (SELECT id FROM pairs WHERE parent_id = auth.uid())
  );
