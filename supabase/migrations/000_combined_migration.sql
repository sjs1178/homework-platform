-- ============================================================
-- Kiddoloop 전체 마이그레이션 (001 ~ 011 통합)
-- 새 Supabase 프로젝트 SQL Editor에 전체 붙여넣기 후 실행
-- ============================================================

-- 001: 초기 스키마
create table pairs (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  parent_id uuid references auth.users not null,
  child_id uuid references auth.users,
  created_at timestamptz default now()
);

create table user_profiles (
  id uuid primary key references auth.users,
  role text check (role in ('parent', 'child')) not null,
  display_name text,
  pair_id uuid references pairs,
  created_at timestamptz default now()
);

create table homeworks (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid references pairs not null,
  subject text not null,
  description text not null,
  due_date date not null,
  due_time time,
  end_time time,
  reward_amount int not null default 0,
  is_completed boolean default false,
  completed_at timestamptz,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

create table reward_settings (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid references pairs not null unique,
  time_reward_name text default '게임시간',
  time_reward_unit text default '분',
  point_reward_name text default '용돈',
  point_reward_unit text default 'P'
);

create table reward_logs (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid references pairs not null,
  child_id uuid references auth.users not null,
  homework_id uuid references homeworks,
  type text check (type in ('earn', 'spend')) not null,
  reward_type text check (reward_type in ('time', 'point')) not null,
  amount int not null,
  note text,
  created_at timestamptz default now()
);

create table subject_rules (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid references pairs not null,
  subject text not null,
  rule_content text not null,
  created_at timestamptz default now(),
  unique(pair_id, subject)
);

alter table pairs enable row level security;
alter table user_profiles enable row level security;
alter table homeworks enable row level security;
alter table reward_settings enable row level security;
alter table reward_logs enable row level security;
alter table subject_rules enable row level security;

create policy "user_profiles_self" on user_profiles
  for all using (id = auth.uid());

create policy "pairs_member" on pairs
  for all using (parent_id = auth.uid() or child_id = auth.uid());

create policy "homeworks_pair" on homeworks
  for select using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );
create policy "homeworks_parent_write" on homeworks
  for insert with check (created_by = auth.uid());
create policy "homeworks_parent_update" on homeworks
  for update using (created_by = auth.uid());
create policy "homeworks_complete" on homeworks
  for update using (
    pair_id in (select id from pairs where child_id = auth.uid())
  );

create policy "reward_logs_pair" on reward_logs
  for all using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );

create policy "reward_settings_pair" on reward_settings
  for all using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );

create policy "subject_rules_pair" on subject_rules
  for all using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );

-- 002: 숙제 검사
create table homework_checks (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid references homeworks not null unique,
  pair_id uuid references pairs not null,
  results jsonb not null,
  score int not null,
  total_problems int not null,
  created_at timestamptz default now()
);

alter table reward_settings
  add column if not exists reward_trigger text default 'completion',
  add column if not exists score_multiplier int default 1;

alter table homework_checks enable row level security;

create policy "homework_checks_pair" on homework_checks
  for all using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );

-- 003: 검사 수정 이력 + 패밀리
create table homework_check_corrections (
  id uuid primary key default gen_random_uuid(),
  homework_check_id uuid references homework_checks not null,
  pair_id uuid references pairs not null,
  problem_number int not null,
  subject text not null,
  question text not null,
  student_answer text not null,
  ai_is_correct boolean not null,
  ai_correct_answer text,
  ai_explanation text,
  corrected_is_correct boolean not null,
  corrected_correct_answer text,
  corrected_explanation text,
  created_at timestamptz default now(),
  unique(homework_check_id, problem_number)
);

alter table homework_checks
  add column if not exists is_reviewed boolean default false,
  add column if not exists reviewed_at timestamptz;

alter table homework_check_corrections enable row level security;

create policy "corrections_pair" on homework_check_corrections
  for all using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );

alter table pairs add column if not exists pair_name text;

-- 004: 아바타
alter table user_profiles
  add column if not exists avatar_id text default 'boy-medium';

-- 005: 페어 구성원 간 프로필 읽기
create policy "user_profiles_pair_read" on user_profiles
  for select using (
    id in (
      select child_id from pairs where parent_id = auth.uid() and child_id is not null
      union
      select parent_id from pairs where child_id = auth.uid()
    )
  );

-- 006: 학년
alter table user_profiles
  add column if not exists grade int check (grade between 1 and 12),
  add column if not exists grade_school_year int;

-- 007: 교육과정 메타
alter table homeworks
  add column if not exists curriculum_meta jsonb;

-- 008: 리워드 카탈로그
create table if not exists reward_catalog (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pairs(id) on delete cascade,
  emoji text not null default '🎁',
  title text not null,
  cost int not null check (cost > 0),
  created_at timestamptz default now()
);

alter table reward_catalog enable row level security;

create policy "reward_catalog_pair_member" on reward_catalog
  for all using (
    pair_id in (
      select id from pairs where parent_id = auth.uid() or child_id = auth.uid()
    )
  );

-- 009: 숙제별 리워드 트리거
alter table homeworks
  add column if not exists reward_trigger text default 'completion'
    check (reward_trigger in ('completion', 'score'));

-- 010: 어드민 콘텐츠
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists announcements_created_at_idx on announcements(created_at desc);

create table if not exists legal_documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('terms', 'privacy')),
  content text not null,
  version text not null,
  is_current boolean default false,
  edited_by text,
  created_at timestamptz default now()
);

create index if not exists legal_type_idx on legal_documents(doc_type, is_current);

alter table announcements enable row level security;
create policy "announcements_public_select" on announcements
  for select using (published = true);

alter table legal_documents enable row level security;
create policy "legal_public_select" on legal_documents
  for select using (true);

-- 011: 다:다 페어링 + 미성년자 동의
ALTER TABLE pairs ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
  CHECK (status IN ('active', 'pending', 'rejected'));

UPDATE pairs SET status = 'active' WHERE status IS NULL;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text DEFAULT 'v1.0';

UPDATE user_profiles SET consent_at = created_at WHERE consent_at IS NULL;

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
  parent_consent_data jsonb,
  child_role text DEFAULT 'child' CHECK (child_role IN ('parent', 'child')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  approved_at timestamptz
);

ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "child_read_own_pending" ON pending_approvals
  FOR SELECT USING (child_auth_id = auth.uid());

CREATE POLICY "parent_read_pending_by_email" ON pending_approvals
  FOR SELECT USING (
    parent_email = (auth.jwt() ->> 'email')
  );

CREATE POLICY "child_create_pending" ON pending_approvals
  FOR INSERT WITH CHECK (child_auth_id = auth.uid());

DROP POLICY IF EXISTS "homeworks_complete" ON homeworks;
CREATE POLICY "homeworks_complete" ON homeworks
  FOR UPDATE USING (
    pair_id IN (
      SELECT id FROM pairs WHERE child_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "homeworks_pair" ON homeworks;
CREATE POLICY "homeworks_pair" ON homeworks
  FOR SELECT USING (
    pair_id IN (
      SELECT id FROM pairs
      WHERE (parent_id = auth.uid() OR child_id = auth.uid())
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "pairs_member" ON pairs;
CREATE POLICY "pairs_member" ON pairs
  FOR ALL USING (parent_id = auth.uid() OR child_id = auth.uid());
