-- 자녀 학년 저장
-- grade: 1~12 (초1=1 ... 고3=12)
-- grade_school_year: 해당 grade를 설정한 학년도 (3월 기준 연도)
alter table user_profiles
  add column if not exists grade int check (grade between 1 and 12),
  add column if not exists grade_school_year int;
