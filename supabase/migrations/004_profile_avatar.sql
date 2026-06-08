alter table user_profiles
  add column if not exists avatar_id text default 'boy-medium';
