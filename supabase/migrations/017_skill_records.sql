-- 스킬 숙달 궤적 (과목·주제별 시계열 데이터)
create table if not exists skill_records (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pairs(id) on delete cascade,
  child_id uuid not null references auth.users,
  subject text not null,
  topic text not null,
  learning_unit text,
  total_attempts int not null default 0,
  correct_count int not null default 0,
  mastery_score numeric(4,3) not null default 0.000,
  first_seen_at timestamptz not null default now(),
  mastered_at timestamptz,
  accuracy_history jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(pair_id, child_id, subject, topic)
);

create index idx_skill_records_pair_child on skill_records(pair_id, child_id);
create index idx_skill_records_subject on skill_records(child_id, subject, topic);

alter table skill_records enable row level security;

drop policy if exists "pair members can read skill_records" on skill_records;
create policy "pair members can read skill_records" on skill_records for select using (
  pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
);
