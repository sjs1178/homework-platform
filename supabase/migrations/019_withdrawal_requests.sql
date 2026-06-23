-- 자녀 탈퇴 요청 (부모 승인 필요)
create table if not exists withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references auth.users(id) on delete cascade,
  pair_id uuid not null references pairs(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(child_id, pair_id, status)
);

create index idx_withdrawal_requests_pair on withdrawal_requests(pair_id);

alter table withdrawal_requests enable row level security;

create policy "child_read_own" on withdrawal_requests
  for select using (child_id = auth.uid());

create policy "child_create_own" on withdrawal_requests
  for insert with check (
    child_id = auth.uid()
    and pair_id in (select id from pairs where child_id = auth.uid())
  );

create policy "parent_read" on withdrawal_requests
  for select using (
    pair_id in (select id from pairs where parent_id = auth.uid())
  );

create policy "parent_update" on withdrawal_requests
  for update using (
    pair_id in (select id from pairs where parent_id = auth.uid())
  );
