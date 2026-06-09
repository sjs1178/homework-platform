alter table homeworks
  add column if not exists reward_trigger text default 'completion'
    check (reward_trigger in ('completion', 'score'));
