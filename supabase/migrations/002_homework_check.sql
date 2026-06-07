-- 숙제 검사 결과
create table homework_checks (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid references homeworks not null unique,
  pair_id uuid references pairs not null,
  results jsonb not null,
  score int not null,
  total_problems int not null,
  created_at timestamptz default now()
);

-- 리워드 설정 고도화
alter table reward_settings
  add column if not exists reward_trigger text default 'completion', -- 'completion' | 'score'
  add column if not exists score_multiplier int default 1; -- 점수당 리워드

-- RLS
alter table homework_checks enable row level security;

create policy "homework_checks_pair" on homework_checks
  for all using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );
