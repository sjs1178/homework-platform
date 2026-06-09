-- 공지사항
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists announcements_created_at_idx on announcements(created_at desc);

-- 약관 / 개인정보처리방침 버전 이력
create table if not exists legal_documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('terms', 'privacy')),
  content text not null,
  version text not null,
  is_current boolean default false,
  edited_by text,
  created_at timestamptz default now()
);

create index if not exists legal_type_idx on legal_documents(doc_type, is_current);

-- RLS
alter table announcements enable row level security;
create policy "announcements_public_select" on announcements
  for select using (published = true);

alter table legal_documents enable row level security;
create policy "legal_public_select" on legal_documents
  for select using (true);
