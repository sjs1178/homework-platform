-- 미션 설정 (부모가 페어별로 리워드 설정)
create table if not exists mission_settings (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pairs(id) on delete cascade,
  daily_reward int not null default 5,
  weekly_reward int not null default 30,
  monthly_reward int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(pair_id)
);

alter table mission_settings enable row level security;
create policy "pair members can read" on mission_settings for select using (
  pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
);
create policy "parent can upsert" on mission_settings for all using (
  pair_id in (select id from pairs where parent_id = auth.uid())
);

-- 미션 클레임 기록 (중복 방지)
create table if not exists mission_claims (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pairs(id) on delete cascade,
  child_id uuid not null references user_profiles(id),
  mission_type text not null check (mission_type in ('daily', 'weekly', 'monthly')),
  period_key text not null,
  reward_amount int not null default 0,
  claimed_at timestamptz not null default now()
);

create unique index mission_claims_unique on mission_claims(pair_id, child_id, mission_type, period_key);
create index mission_claims_pair on mission_claims(pair_id);

alter table mission_claims enable row level security;
create policy "pair members can read" on mission_claims for select using (
  pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
);
create policy "child can insert own" on mission_claims for insert with check (
  child_id = auth.uid()
  and pair_id in (select id from pairs where child_id = auth.uid())
);
