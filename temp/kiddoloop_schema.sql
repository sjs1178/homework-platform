-- ============================================================
-- KiddoLoop Database Schema
-- PostgreSQL 15+
-- Created for data asset accumulation (Physical AI era)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ============================================================
-- SECTION 1. 사용자 & 가족
-- ============================================================

CREATE TABLE families (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_code     VARCHAR(8) UNIQUE NOT NULL, -- 자녀 앱 연결용 초대코드
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id       UUID REFERENCES families(id) ON DELETE CASCADE,
  role            VARCHAR(10) NOT NULL CHECK (role IN ('parent', 'child')),
  nickname        VARCHAR(50) NOT NULL,
  -- 개인정보 최소 수집 원칙 (PIPA)
  email           VARCHAR(255), -- 부모만
  password_hash   VARCHAR(255),
  -- 자녀 프로필
  birth_year      SMALLINT,     -- 나이 계산용 (생년만 수집)
  grade           SMALLINT,     -- 학년 (1~12)
  school_type     VARCHAR(20) CHECK (school_type IN ('elementary', 'middle', 'high', NULL)),
  -- 동의 관리 (PIPA 필수)
  consents        JSONB DEFAULT '{}',
  -- 예시: {
  --   "terms": true,
  --   "privacy": true,
  --   "ai_analysis": true,       -- AI 숙제 검사 동의
  --   "data_training": false,    -- AI 학습 데이터 활용 동의 (별도 받아야 함)
  --   "marketing": false,
  --   "consented_at": "2025-01-01T00:00:00Z",
  --   "guardian_verified": true  -- 만 14세 미만 법정대리인 확인
  -- }
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 익명화 ID (데이터 자산용 — 실제 user_id와 분리)
CREATE TABLE anonymous_child_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  anon_id         VARCHAR(32) UNIQUE NOT NULL, -- 외부 공개용 익명 ID
  -- 비식별 통계 속성 (데이터셋 가치 높이는 메타데이터)
  age_group       VARCHAR(10), -- '6-7', '8-9', '10-11', '12-13', '14+'
  grade_group     VARCHAR(20), -- 'lower_elem', 'upper_elem', 'middle', 'high'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 2. 할일 & 리워드 (플랫폼 코어)
-- ============================================================

CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id       UUID REFERENCES families(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES users(id), -- 부모
  assigned_to     UUID REFERENCES users(id), -- 자녀
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  task_type       VARCHAR(30) CHECK (task_type IN (
                    'homework', 'chore', 'reading', 'exercise', 'other'
                  )),
  subject         VARCHAR(30) CHECK (subject IN (
                    'math', 'korean', 'english', 'science', 'social',
                    'art', 'music', 'pe', 'other', NULL
                  )),
  point_value     SMALLINT DEFAULT 0,
  requires_photo  BOOLEAN DEFAULT FALSE, -- 사진 제출 필요 여부
  requires_ai_check BOOLEAN DEFAULT FALSE, -- AI 검사 필요 여부
  due_date        DATE,
  due_time        TIME,
  recurrence      VARCHAR(20) CHECK (recurrence IN ('once', 'daily', 'weekly', NULL)),
  recurrence_days SMALLINT[], -- 요일 (0=일, 1=월 ... 6=토)
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_completions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         UUID REFERENCES tasks(id) ON DELETE CASCADE,
  child_id        UUID REFERENCES users(id),
  completed_at    TIMESTAMPTZ DEFAULT NOW(),
  -- 완료 컨텍스트 (행동 데이터)
  started_at      TIMESTAMPTZ,    -- 시작 시각 (소요시간 계산)
  duration_secs   INTEGER,        -- 실제 소요 시간(초)
  attempt_number  SMALLINT DEFAULT 1,
  -- 검수 상태
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                    'pending', 'ai_approved', 'parent_approved', 'rejected', 'skipped'
                  )),
  parent_note     TEXT,           -- 부모 코멘트
  points_awarded  SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rewards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id       UUID REFERENCES families(id) ON DELETE CASCADE,
  requested_by    UUID REFERENCES users(id), -- 자녀가 등록
  approved_by     UUID REFERENCES users(id), -- 부모가 승인
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  point_cost      SMALLINT NOT NULL,
  reward_type     VARCHAR(30) CHECK (reward_type IN (
                    'item', 'activity', 'screen_time', 'money', 'custom'
                  )),
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                    'pending', 'approved', 'archived'
                  )),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reward_redemptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reward_id       UUID REFERENCES rewards(id),
  child_id        UUID REFERENCES users(id),
  points_spent    SMALLINT NOT NULL,
  redeemed_at     TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at    TIMESTAMPTZ,    -- 부모가 실제로 지급한 시각
  -- 동기 데이터 (물리AI 학습 자산)
  days_to_redeem  SMALLINT,       -- 리워드 등록 후 며칠 만에 교환했는지
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 3. 미션 시스템
-- ============================================================

CREATE TABLE missions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id       UUID REFERENCES families(id) ON DELETE SET NULL, -- NULL = 플랫폼 기본 미션
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  mission_type    VARCHAR(20) CHECK (mission_type IN ('solo', 'cooperative')),
  frequency       VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'challenge')),
  nature          VARCHAR(20) CHECK (nature IN ('behavior', 'result', 'habit')),
  -- 달성 조건 (유연한 JSON 구조)
  condition       JSONB NOT NULL,
  -- 예시들:
  -- {"type": "streak_days", "count": 7}
  -- {"type": "task_count", "task_type": "homework", "count": 5}
  -- {"type": "ai_score_above", "score": 90, "count": 3}
  -- {"type": "all_tasks_week"}
  -- {"type": "submit_before_time", "time": "15:00", "count": 3}
  bonus_points    SMALLINT DEFAULT 0,
  bonus_reward_id UUID REFERENCES rewards(id),
  is_system       BOOLEAN DEFAULT FALSE, -- 플랫폼 기본 미션 여부
  is_active       BOOLEAN DEFAULT TRUE,
  valid_from      DATE,
  valid_until     DATE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mission_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id      UUID REFERENCES missions(id) ON DELETE CASCADE,
  child_id        UUID REFERENCES users(id),
  -- 진행 상태
  status          VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN (
                    'in_progress', 'completed', 'failed', 'expired'
                  )),
  progress_data   JSONB DEFAULT '{}',
  -- 예시: {"current": 3, "target": 7, "last_updated": "2025-06-01"}
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  -- 달성 속도 (동기 데이터)
  days_to_complete SMALLINT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (mission_id, child_id) -- 동일 미션 중복 진행 방지
);

-- ============================================================
-- SECTION 4. 숙제 검사 (AI 핵심 기능)
-- ============================================================

CREATE TABLE homework_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  anon_child_id   UUID REFERENCES anonymous_child_profiles(id), -- 데이터 자산용
  task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
  -- 세션 컨텍스트 (Layer 1)
  subject         VARCHAR(30),
  session_date    DATE NOT NULL,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  duration_secs   INTEGER,
  -- 환경 컨텍스트 (물리AI에 중요)
  environment     VARCHAR(20) CHECK (environment IN (
                    'alone', 'parent_nearby', 'sibling_nearby', 'group'
                  )),
  time_of_day     VARCHAR(20) CHECK (time_of_day IN (
                    'morning', 'afternoon', 'evening', 'night'
                  )),
  -- 행동 집계 (Layer 3)
  help_requested_count  SMALLINT DEFAULT 0,
  give_up_count         SMALLINT DEFAULT 0,
  focus_interruptions   SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE homework_submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID REFERENCES homework_sessions(id) ON DELETE CASCADE,
  child_id        UUID REFERENCES users(id),
  -- 이미지 저장 (S3/R2)
  image_key       VARCHAR(500) NOT NULL, -- S3 object key
  image_url       TEXT,                  -- CDN URL (signed url 생성용)
  image_meta      JSONB DEFAULT '{}',
  -- 예시: {"width": 1080, "height": 1920, "size_bytes": 204800, "format": "jpeg"}
  submission_type VARCHAR(20) CHECK (submission_type IN (
                    'final', 'progress', 'resubmit'
                  )) DEFAULT 'final',
  attempt_number  SMALLINT DEFAULT 1,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_analyses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id   UUID REFERENCES homework_submissions(id) ON DELETE CASCADE,
  -- AI 판정 결과 (Layer 2 핵심)
  model_used      VARCHAR(50), -- 'claude-3-5-sonnet', 'gpt-4o' 등
  model_version   VARCHAR(20),
  analysis_at     TIMESTAMPTZ DEFAULT NOW(),
  -- 분석 결과 (JSONB for flexibility)
  subject_detected VARCHAR(30),
  problem_count   SMALLINT,
  correct_count   SMALLINT,
  completion_level VARCHAR(20) CHECK (completion_level IN (
                    'incomplete', 'partial', 'complete'
                  )),
  -- 오류 상세 (가장 가치 있는 데이터)
  error_details   JSONB DEFAULT '[]',
  -- 예시: [
  --   {
  --     "problem_index": 3,
  --     "error_type": "calculation",  -- calculation|concept|transcription|skip
  --     "subject_topic": "multiplication_2digit",
  --     "bbox": {"x": 120, "y": 340, "w": 80, "h": 60},
  --     "student_answer": "48",
  --     "correct_answer": "56",
  --     "ai_confidence": 0.92
  --   }
  -- ]
  handwriting_quality VARCHAR(20) CHECK (handwriting_quality IN (
                    'poor', 'fair', 'good', 'excellent'
                  )),
  -- 원시 AI 응답 (감사 및 재분석용)
  raw_response    JSONB,
  confidence_score NUMERIC(4,3), -- 0.000 ~ 1.000
  processing_ms   INTEGER,       -- API 응답 시간
  api_cost_usd    NUMERIC(10,6), -- API 비용 추적
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parent_validations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id   UUID REFERENCES homework_submissions(id) ON DELETE CASCADE,
  ai_analysis_id  UUID REFERENCES ai_analyses(id),
  parent_id       UUID REFERENCES users(id),
  validated_at    TIMESTAMPTZ DEFAULT NOW(),
  -- 검수 결과 (황금 레이블 생성)
  decision        VARCHAR(20) CHECK (decision IN ('approved', 'rejected', 'partial')),
  -- AI와 다르게 판정한 항목들 (핵심 레이블 데이터)
  overrides       JSONB DEFAULT '[]',
  -- 예시: [
  --   {
  --     "problem_index": 3,
  --     "ai_said": "wrong",
  --     "parent_said": "correct",
  --     "reason": "acceptable_alternative_answer"
  --   }
  -- ]
  feedback_to_child TEXT, -- 부모가 자녀에게 남기는 코멘트
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 5. 학습 궤적 (longitudinal 데이터 — 물리AI 핵심)
-- ============================================================

CREATE TABLE skill_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  anon_child_id   UUID REFERENCES anonymous_child_profiles(id),
  -- 스킬 정의
  subject         VARCHAR(30) NOT NULL,
  topic           VARCHAR(100) NOT NULL, -- '두자리곱셈', '받침받아쓰기' 등
  topic_code      VARCHAR(50),           -- 교육과정 코드 (2022 개정)
  -- 숙달 궤적
  first_seen_at   TIMESTAMPTZ,
  mastered_at     TIMESTAMPTZ,           -- 연속 3회 이상 정답 시점
  mastery_score   NUMERIC(4,3),          -- 현재 숙달도 (0~1)
  -- 날짜별 정답률 시계열
  accuracy_history JSONB DEFAULT '[]',
  -- 예시: [
  --   {"date": "2025-03-01", "accuracy": 0.4, "attempts": 5},
  --   {"date": "2025-03-08", "accuracy": 0.7, "attempts": 5},
  --   {"date": "2025-03-15", "accuracy": 1.0, "attempts": 5}
  -- ]
  total_attempts  SMALLINT DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (child_id, subject, topic)
);

CREATE TABLE intervention_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id        UUID REFERENCES users(id),
  session_id      UUID REFERENCES homework_sessions(id),
  skill_id        UUID REFERENCES skill_records(id),
  -- 개입 컨텍스트 (물리AI가 "언제 개입할지" 학습하는 데이터)
  trigger_type    VARCHAR(50) CHECK (trigger_type IN (
                    'repeated_error',     -- 같은 문제 반복 실수
                    'give_up',            -- 포기 시도
                    'time_overrun',       -- 예상 시간 초과
                    'low_score',          -- AI 점수 낮음
                    'parent_initiated'    -- 부모 자발적 개입
                  )),
  intervention_type VARCHAR(50) CHECK (intervention_type IN (
                    'hint_provided',
                    'parent_explanation',
                    'retry_requested',
                    'skip_allowed',
                    'break_suggested'
                  )),
  -- 개입 효과 측정 (물리AI 핵심 학습 신호)
  pre_accuracy    NUMERIC(4,3),  -- 개입 전 정답률
  post_accuracy   NUMERIC(4,3),  -- 개입 후 정답률
  outcome         VARCHAR(30) CHECK (outcome IN (
                    'improved', 'no_change', 'declined', 'task_abandoned'
                  )),
  occurred_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 6. 참여도 & 동기 데이터
-- ============================================================

CREATE TABLE engagement_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  anon_child_id   UUID REFERENCES anonymous_child_profiles(id),
  metric_date     DATE NOT NULL,
  -- 세션 집계
  total_sessions       SMALLINT DEFAULT 0,
  total_active_mins    SMALLINT DEFAULT 0,
  tasks_attempted      SMALLINT DEFAULT 0,
  tasks_completed      SMALLINT DEFAULT 0,
  -- 집중도 패턴
  best_focus_hour      SMALLINT,   -- 가장 집중 잘 된 시간 (0~23)
  avg_session_mins     NUMERIC(5,2),
  longest_streak_mins  SMALLINT,
  -- 동기 지표
  missions_triggered   SMALLINT DEFAULT 0, -- 미션 때문에 한 행동 수
  voluntary_tasks      SMALLINT DEFAULT 0, -- 시키지 않고 스스로 한 수
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (child_id, metric_date)
);

CREATE TABLE reward_interactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_id       UUID REFERENCES rewards(id),
  mission_id      UUID REFERENCES missions(id),
  -- 동기-행동 연결 데이터
  interaction_type VARCHAR(30) CHECK (interaction_type IN (
                    'reward_viewed',       -- 리워드 목록 조회
                    'reward_selected',     -- 목표 리워드 설정
                    'mission_started',     -- 미션 시작
                    'mission_abandoned',   -- 미션 포기
                    'mission_completed',   -- 미션 완료
                    'reward_redeemed'      -- 리워드 교환
                  )),
  -- 리워드/미션이 행동에 미친 영향
  tasks_completed_after SMALLINT, -- 이 이벤트 후 24시간 내 완료 할일 수
  occurred_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 7. 포인트 원장 (이벤트 소싱)
-- ============================================================

CREATE TABLE point_ledger (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  amount          SMALLINT NOT NULL, -- 양수=적립, 음수=차감
  balance_after   SMALLINT NOT NULL,
  source_type     VARCHAR(30) CHECK (source_type IN (
                    'task_complete',
                    'mission_complete',
                    'parent_bonus',
                    'reward_redeem',
                    'adjustment'
                  )),
  source_id       UUID, -- task_completion.id or mission_progress.id 등
  description     VARCHAR(200),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- 자주 조회되는 패턴 기준
CREATE INDEX idx_users_family ON users(family_id);
CREATE INDEX idx_tasks_family ON tasks(family_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_task_completions_child ON task_completions(child_id);
CREATE INDEX idx_task_completions_status ON task_completions(status);
CREATE INDEX idx_homework_sessions_child ON homework_sessions(child_id);
CREATE INDEX idx_homework_sessions_date ON homework_sessions(session_date);
CREATE INDEX idx_submissions_session ON homework_submissions(session_id);
CREATE INDEX idx_ai_analyses_submission ON ai_analyses(submission_id);
CREATE INDEX idx_skill_records_child ON skill_records(child_id, subject);
CREATE INDEX idx_engagement_date ON engagement_metrics(child_id, metric_date);
CREATE INDEX idx_point_ledger_child ON point_ledger(child_id, created_at DESC);
CREATE INDEX idx_mission_progress_child ON mission_progress(child_id, status);
-- 데이터 자산 쿼리용 (익명화 ID 기준)
CREATE INDEX idx_anon_sessions ON homework_sessions(anon_child_id, session_date);
CREATE INDEX idx_anon_skills ON skill_records(anon_child_id, subject, topic);

-- ============================================================
-- VIEWS (자주 쓰는 집계)
-- ============================================================

-- 자녀별 현재 포인트 잔액
CREATE VIEW child_point_balances AS
SELECT
  child_id,
  SUM(amount) AS current_balance,
  MAX(created_at) AS last_transaction_at
FROM point_ledger
GROUP BY child_id;

-- 자녀별 스킬 취약점 (부모 대시보드용)
CREATE VIEW child_weak_skills AS
SELECT
  child_id,
  subject,
  topic,
  mastery_score,
  total_attempts,
  (mastered_at IS NULL) AS not_yet_mastered
FROM skill_records
WHERE mastery_score < 0.7
ORDER BY mastery_score ASC;

-- AI vs 부모 판정 불일치율 (모델 품질 모니터링)
CREATE VIEW ai_accuracy_stats AS
SELECT
  DATE_TRUNC('week', aa.analysis_at) AS week,
  aa.model_used,
  COUNT(*) AS total_analyses,
  COUNT(pv.id) AS validated_count,
  COUNT(CASE WHEN jsonb_array_length(pv.overrides) > 0 THEN 1 END) AS override_count,
  ROUND(
    COUNT(CASE WHEN jsonb_array_length(pv.overrides) > 0 THEN 1 END)::numeric
    / NULLIF(COUNT(pv.id), 0) * 100, 2
  ) AS override_rate_pct
FROM ai_analyses aa
LEFT JOIN parent_validations pv ON pv.ai_analysis_id = aa.id
GROUP BY 1, 2
ORDER BY 1 DESC;
