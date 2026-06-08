-- 같은 pair 구성원끼리 상대방 프로필 읽기 허용
-- (부모 → 자녀 이름/아바타 조회, 자녀 → 부모 이름 조회)
create policy "user_profiles_pair_read" on user_profiles
  for select using (
    id in (
      select child_id from pairs
        where parent_id = auth.uid() and child_id is not null
      union
      select parent_id from pairs
        where child_id = auth.uid()
    )
  );
