# Data Model

## Supabase Tables

### users (Supabase Auth 기본 + 확장)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK (auth.users 연동) |
| role | enum('parent','child') | 역할 |
| display_name | text | 표시 이름 |
| pair_id | uuid FK | 연결된 pair |
| created_at | timestamptz | |

### pairs

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| invite_code | text UNIQUE | 초대 코드 (6자리) |
| parent_id | uuid FK → users | |
| child_id | uuid FK → users | nullable (페어링 전) |
| created_at | timestamptz | |

### homeworks

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| pair_id | uuid FK → pairs | RLS 기준 |
| subject | text | 과목명 |
| description | text | 숙제 내용 |
| due_date | date | 마감일 |
| due_time | time | 마감 시각 (nullable) |
| end_time | time | 종료 시각 (nullable) |
| reward_amount | int | 완료 시 리워드 양 |
| is_completed | boolean | 완료 여부 |
| completed_at | timestamptz | 완료 시각 |
| created_by | uuid FK → users | 등록한 부모 |
| created_at | timestamptz | |

### reward_settings

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| pair_id | uuid FK → pairs | |
| type | enum('time','point') | 게임시간 or 용돈포인트 |
| name | text | 리워드 명칭 (예: "게임시간", "용돈") |
| unit | text | 단위 (예: "분", "P") |

### reward_logs

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| pair_id | uuid FK → pairs | |
| child_id | uuid FK → users | |
| homework_id | uuid FK → homeworks | nullable (수동 지급 시) |
| type | enum('earn','spend') | 적립/사용 |
| reward_type | enum('time','point') | |
| amount | int | |
| note | text | 사유 |
| created_at | timestamptz | |

### subject_rules

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| pair_id | uuid FK → pairs | |
| subject | text | 과목명 |
| rule_content | text | Claude 파싱 규칙 |
| created_at | timestamptz | |

## RLS 정책 요약

- 모든 테이블: `pair_id = auth.user의 pair_id` 조건으로 격리
- homeworks 수정/삭제: `created_by = auth.uid()` (부모만)
- reward_logs 생성: 자녀도 earn 가능 (homework 완료 시)
