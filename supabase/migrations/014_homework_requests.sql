-- 자녀 숙제 입력 요청 테이블
create table if not exists homework_requests (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pairs(id) on delete cascade,
  child_id uuid not null references auth.users(id),
  parent_id uuid not null references auth.users(id),
  image_url text,
  comment text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table homework_requests enable row level security;

create policy "homework_requests_pair_access" on homework_requests
  for all using (
    parent_id = auth.uid() or child_id = auth.uid()
  );

-- 인덱스
create index idx_homework_requests_pair on homework_requests(pair_id);
create index idx_homework_requests_parent_status on homework_requests(parent_id, status);

-- Supabase Storage: homework-request-images 버킷은 대시보드에서 수동 생성 필요
-- 또는 아래 SQL로 생성 (서비스 역할 필요):
-- insert into storage.buckets (id, name, public) values ('homework-request-images', 'homework-request-images', true);
