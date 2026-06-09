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
      select id from pairs
      where parent_id = auth.uid() or child_id = auth.uid()
    )
  );
