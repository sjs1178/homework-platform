-- pairs
create table pairs (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  parent_id uuid references auth.users not null,
  child_id uuid references auth.users,
  created_at timestamptz default now()
);

-- users profile
create table user_profiles (
  id uuid primary key references auth.users,
  role text check (role in ('parent', 'child')) not null,
  display_name text,
  pair_id uuid references pairs,
  created_at timestamptz default now()
);

-- homeworks
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

-- reward_settings
create table reward_settings (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid references pairs not null unique,
  time_reward_name text default '게임시간',
  time_reward_unit text default '분',
  point_reward_name text default '용돈',
  point_reward_unit text default 'P'
);

-- reward_logs
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

-- subject_rules
create table subject_rules (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid references pairs not null,
  subject text not null,
  rule_content text not null,
  created_at timestamptz default now(),
  unique(pair_id, subject)
);

-- RLS
alter table pairs enable row level security;
alter table user_profiles enable row level security;
alter table homeworks enable row level security;
alter table reward_settings enable row level security;
alter table reward_logs enable row level security;
alter table subject_rules enable row level security;

-- user_profiles: 본인만 조회/수정
create policy "user_profiles_self" on user_profiles
  for all using (id = auth.uid());

-- pairs: 본인이 parent 또는 child인 pair만
create policy "pairs_member" on pairs
  for all using (parent_id = auth.uid() or child_id = auth.uid());

-- homeworks: 같은 pair 구성원만
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

-- reward_logs: 같은 pair 구성원만
create policy "reward_logs_pair" on reward_logs
  for all using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );

-- reward_settings: 같은 pair 구성원만
create policy "reward_settings_pair" on reward_settings
  for all using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );

-- subject_rules: 같은 pair 구성원만
create policy "subject_rules_pair" on subject_rules
  for all using (
    pair_id in (select id from pairs where parent_id = auth.uid() or child_id = auth.uid())
  );
