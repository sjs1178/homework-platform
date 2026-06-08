-- 숙제별 교육과정 메타 (과목·영역 자동 태깅)
alter table homeworks
  add column if not exists curriculum_meta jsonb;
-- 예: { "subject": "수학", "area": "수와 연산", "learningUnit": "약수와 배수, ..." }
