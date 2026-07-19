-- 024_backfill_reward_ledger.sql
-- 기존 데이터 백필. ⚠️ 통화 확정(3단계)은 되돌리기 까다로우므로 백업 테이블을 먼저 만든다.

-- ── 1) 스냅샷 (복구용) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_logs_backup_023 AS SELECT * FROM reward_logs;

-- ── 2) entry_kind 추정 (note 패턴 기반) ───────────────────────────────────
-- 적립
UPDATE reward_logs SET entry_kind = 'homework'
  WHERE entry_kind IS NULL AND type = 'earn' AND homework_id IS NOT NULL;

UPDATE reward_logs SET entry_kind = 'mission'
  WHERE entry_kind IS NULL AND type = 'earn' AND note LIKE '%미션%';

-- 검사 완료 모달 지급은 homework_id가 없지만 숙제 보상임
UPDATE reward_logs SET entry_kind = 'homework'
  WHERE entry_kind IS NULL AND type = 'earn' AND note LIKE '%검사%';

UPDATE reward_logs SET entry_kind = 'request'
  WHERE entry_kind IS NULL AND type = 'earn' AND (note LIKE '%요청%' OR note LIKE '%승인%');

UPDATE reward_logs SET entry_kind = 'grant'
  WHERE entry_kind IS NULL AND type = 'earn';

-- 차감
UPDATE reward_logs SET entry_kind = 'redeem'
  WHERE entry_kind IS NULL AND type = 'spend' AND note LIKE '%교환%';

UPDATE reward_logs SET entry_kind = 'revoke'
  WHERE entry_kind IS NULL AND type = 'spend' AND (note LIKE '%차감%' OR note LIKE '%취소%');

-- 판별 불가한 과거 차감은 unknown → 사용 통계에서 '미분류'로 제외
UPDATE reward_logs SET entry_kind = 'unknown'
  WHERE entry_kind IS NULL AND type = 'spend';

-- ── 3) 통화 확정: 단위가 '분/시간'인 가정 → time 원장으로 이관 ────────────
-- ⚠️ 반드시 child_id 기준으로 일괄 적용 (공동양육자 pair가 갈라지면 잔액이 쪼개짐)

-- 3-1) 해당 자녀의 모든 리워드 로그를 time 통화로
UPDATE reward_logs SET reward_type = 'time'
WHERE child_id IN (
  SELECT DISTINCT p.child_id
  FROM reward_settings rs
  JOIN pairs p ON p.id = rs.pair_id
  WHERE p.child_id IS NOT NULL
    AND (rs.point_reward_unit ILIKE '%분%'
      OR rs.point_reward_unit ILIKE '%시간%'
      OR lower(rs.point_reward_unit) IN ('min', 'mins', 'minute', 'minutes'))
);

-- 3-2) 해당 자녀의 모든 pair 설정을 time 주통화로 (이름·단위 이관)
UPDATE reward_settings rs
SET primary_kind     = 'time',
    time_reward_name = COALESCE(NULLIF(rs.point_reward_name, ''), '게임시간'),
    time_reward_unit = COALESCE(NULLIF(rs.point_reward_unit, ''), '분')
FROM pairs p
WHERE p.id = rs.pair_id
  AND p.child_id IN (
    SELECT DISTINCT p2.child_id
    FROM reward_settings rs2
    JOIN pairs p2 ON p2.id = rs2.pair_id
    WHERE p2.child_id IS NOT NULL
      AND (rs2.point_reward_unit ILIKE '%분%'
        OR rs2.point_reward_unit ILIKE '%시간%'
        OR lower(rs2.point_reward_unit) IN ('min', 'mins', 'minute', 'minutes'))
  );

-- ── 참고) 과거 이중 지급(자녀 완료 + 부모 검사) 의심 건 조회 ──────────────
-- 이번 백필은 이를 수정하지 않는다. 필요 시 아래로 확인 후 수동 정리:
--   SELECT homework_id, child_id, count(*), sum(amount)
--   FROM reward_logs
--   WHERE type='earn' AND homework_id IS NOT NULL
--   GROUP BY homework_id, child_id HAVING count(*) > 1;
