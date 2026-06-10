-- 011_onboarding_many_to_many.sql
-- 다:다 페어링, 미성년자 부모 동의, 온보딩 지원

-- 1. pairs 테이블: status 추가 (동의 상태 관리)
ALTER TABLE pairs ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
  CHECK (status IN ('active', 'pending', 'rejected'));

-- 기존 pairs는 모두 active 처리
UPDATE pairs SET status = 'active' WHERE status IS NULL;

-- 2. user_profiles: 생년월일 및 약관 동의 기록 추가 (법령 준수용)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text DEFAULT 'v1.0';

-- 기존 유저는 생년월일 없이 가입된 것으로 간주 (선택 동의 시 추가)
-- consent_at을 created_at으로 소급 적용
UPDATE user_profiles SET consent_at = created_at WHERE consent_at IS NULL;

-- 3. pending_approvals: 미성년자 부모 동의 대기 테이블
-- 개인정보보호법 제22조의2: 만 14세 미만 아동 개인정보 수집 시 법정대리인 동의 필수
CREATE TABLE IF NOT EXISTS pending_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_auth_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_name text NOT NULL,
  child_birthday date NOT NULL,
  parent_email text NOT NULL,
  approval_code text UNIQUE NOT NULL DEFAULT
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  -- 동의 기록 (법적 증적 보관)
  parent_consent_data jsonb,    -- 부모 약관 동의 내용
  child_role text DEFAULT 'child' CHECK (child_role IN ('parent', 'child')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  approved_at timestamptz
);

-- RLS
ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;

-- 자녀: 자신의 승인 요청만 조회
CREATE POLICY "child_read_own_pending" ON pending_approvals
  FOR SELECT USING (child_auth_id = auth.uid());

-- 부모: 자신의 이메일로 대기 중인 요청 조회 (JWT claims 활용)
CREATE POLICY "parent_read_pending_by_email" ON pending_approvals
  FOR SELECT USING (
    parent_email = (auth.jwt() ->> 'email')
  );

-- 자녀: 자신의 요청 생성
CREATE POLICY "child_create_pending" ON pending_approvals
  FOR INSERT WITH CHECK (child_auth_id = auth.uid());

-- 4. 다:다 지원을 위한 RLS 업데이트
-- homeworks_complete 정책: child_id로 직접 lookup (pair_id 경유)
DROP POLICY IF EXISTS "homeworks_complete" ON homeworks;
CREATE POLICY "homeworks_complete" ON homeworks
  FOR UPDATE USING (
    pair_id IN (
      SELECT id FROM pairs WHERE child_id = auth.uid() AND status = 'active'
    )
  );

-- homeworks_pair 정책 업데이트
DROP POLICY IF EXISTS "homeworks_pair" ON homeworks;
CREATE POLICY "homeworks_pair" ON homeworks
  FOR SELECT USING (
    pair_id IN (
      SELECT id FROM pairs
      WHERE (parent_id = auth.uid() OR child_id = auth.uid())
        AND status = 'active'
    )
  );

-- pairs_member 정책 업데이트: pending 포함 조회 허용
DROP POLICY IF EXISTS "pairs_member" ON pairs;
CREATE POLICY "pairs_member" ON pairs
  FOR ALL USING (parent_id = auth.uid() OR child_id = auth.uid());
