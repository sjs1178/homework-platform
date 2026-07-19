-- 023_reward_ledger_kinds.sql
-- 리워드 원장 확장: 통화(게임시간/용돈) 구분 + 잔액 변동 사유 + 사용 카테고리 + 습관 목표
-- reward_logs.reward_type('time'|'point')은 001에 이미 존재 → 통화 식별자로 실제 사용 시작.
--   'time'  = 게임시간
--   'point' = 용돈(money)

-- ── 잔액이 왜 변했는가 (통계에서 '사용'만 집계하기 위해 필수) ──────────────
-- earn : homework | mission | grant | request | topup
-- spend: use | redeem | revoke | correct | unknown(과거 추정 불가)
ALTER TABLE reward_logs ADD COLUMN IF NOT EXISTS entry_kind text;

-- ── 무엇에 썼는가 (entry_kind가 use/redeem일 때만 의미) ────────────────────
-- time : 게임 | 유튜브 | OTT | 기타
-- money: 간식 | 문구 | 게임아이템 | 저축 | 기부 | 기타
ALTER TABLE reward_logs ADD COLUMN IF NOT EXISTS category text;

CREATE INDEX IF NOT EXISTS idx_reward_logs_child_type
  ON reward_logs(child_id, reward_type, created_at DESC);

-- ── 가정별 통화 구성 ──────────────────────────────────────────────────────
-- primary_kind: 이 가정이 주로 쓰는 통화. 기존 데이터는 모두 point이므로 기본 'money'.
-- secondary_enabled: 두 번째 통화를 함께 관리하는지
ALTER TABLE reward_settings ADD COLUMN IF NOT EXISTS primary_kind text NOT NULL DEFAULT 'money'
  CHECK (primary_kind IN ('time', 'money'));
ALTER TABLE reward_settings ADD COLUMN IF NOT EXISTS secondary_enabled boolean NOT NULL DEFAULT false;

-- ── 습관 목표(한도·예산) — child_id 기준으로 공동양육자 공유 ──────────────
CREATE TABLE IF NOT EXISTS habit_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('time', 'money')),
  daily_limit int,      -- time: 하루 최대 사용(분)
  weekly_limit int,     -- time: 주간 한도(분)
  monthly_budget int,   -- money: 월 예산
  saving_goal int,      -- money: 월 저축 목표
  updated_at timestamptz DEFAULT now(),
  UNIQUE (child_id, kind)
);

ALTER TABLE habit_goals ENABLE ROW LEVEL SECURITY;

-- 자녀 본인 + 연결된 모든 부모(공동양육자)가 조회
CREATE POLICY "habit_goals_read" ON habit_goals
  FOR SELECT USING (
    child_id = auth.uid()
    OR child_id IN (
      SELECT child_id FROM pairs WHERE parent_id = auth.uid() AND status = 'active'
    )
  );

-- 목표 설정은 부모만
CREATE POLICY "habit_goals_parent_write" ON habit_goals
  FOR ALL USING (
    child_id IN (
      SELECT child_id FROM pairs WHERE parent_id = auth.uid() AND status = 'active'
    )
  ) WITH CHECK (
    child_id IN (
      SELECT child_id FROM pairs WHERE parent_id = auth.uid() AND status = 'active'
    )
  );
