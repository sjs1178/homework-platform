-- 검사 결과 부모 수정 이력 (학습 데이터 자산)
create table homework_check_corrections (
  id uuid primary key default gen_random_uuid(),
  homework_check_id uuid references homework_checks not null,
  pair_id uuid references pairs not null,
  problem_number int not null,
  subject text not null,
  question text not null,
  student_answer text not null,
  -- AI 원본
  ai_is_correct boolean not null,
  ai_correct_answer text,
  ai_explanation text,
  -- 부모 수정값
  corrected_is_correct boolean not null,
  corrected_correct_answer text,
  corrected_explanation text,
  created_at timestamptz default now(),
  unique(homework_check_id, problem_number)
);

-- 검사 부모 검토 여부
alter table homework_checks
  add column if not exists is_reviewed boolean default false,
  add column if not exists reviewed_at timestamptz;

-- RLS
alter table homework_check_corrections enable row level security;

create policy "corrections_pair" on homework_check_corrections
  for all using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );

-- 패밀리 관리: pairs 테이블에 pair_name 추가 (자녀 별칭)
alter table pairs add column if not exists pair_name text;
