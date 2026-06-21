# KiddoLoop — Claude Code 구현 가이드

## 프로젝트 개요

KiddoLoop는 한국 가족을 위한 숙제 관리 + 리워드 플랫폼입니다.
부모가 할일/미션을 등록하고, 자녀는 완료하고 리워드를 얻습니다.
AI 비전으로 숙제 사진을 검사하며, 쌓인 학습 데이터가 미래 Physical AI의 학습 자산이 됩니다.

**운영자:** 송진석 (개인 사업자)
**도메인:** kiddoloop.com
**대상:** 한국 가족, 특히 초등학생 자녀를 둔 부모
**법적 제약:** PIPA (개인정보보호법) — 만 14세 미만 법정대리인 동의 필수

---

## 현재 기술 스택

```
Backend:   Node.js (Express or Fastify)
Database:  PostgreSQL (Railway 호스팅)
Storage:   Cloudflare R2 또는 AWS S3 (이미지)
AI API:    Anthropic Claude API (vision) — primary
           OpenAI GPT-4o (fallback 검토 중)
Hosting:   Railway
Frontend:  웹 우선 (모바일 앱은 WebView wrapper 예정)
Ad:        Google AdSense → GAM (rewarded ad) 연동 중
```

---

## Phase 1 구현 목표 (이번 작업 범위)

### 1-A. 데이터베이스 마이그레이션

`kiddoloop_schema.sql` 파일을 Railway PostgreSQL에 적용합니다.

```bash
# Railway CLI로 직접 실행
railway run psql $DATABASE_URL -f kiddoloop_schema.sql
```

**테이블 생성 순서 (의존성 순):**
1. `families`
2. `users`
3. `anonymous_child_profiles`
4. `tasks`, `rewards`
5. `missions`
6. `task_completions`, `reward_redemptions`, `mission_progress`
7. `homework_sessions`
8. `homework_submissions`
9. `ai_analyses`, `parent_validations`
10. `skill_records`, `intervention_records`
11. `engagement_metrics`, `reward_interactions`
12. `point_ledger`

---

### 1-B. 파일 구조 (권장)

```
src/
├── db/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   ← kiddoloop_schema.sql 내용
│   ├── queries/
│   │   ├── tasks.js
│   │   ├── homework.js
│   │   ├── missions.js
│   │   └── points.js
│   └── index.js                     ← pg Pool 설정
├── services/
│   ├── aiReview.js                  ← Claude Vision API 호출
│   ├── pointEngine.js               ← 포인트 적립/차감 로직
│   ├── missionEngine.js             ← 미션 달성 조건 체크
│   └── anonymizer.js                ← 익명화 ID 관리
├── routes/
│   ├── auth.js
│   ├── tasks.js
│   ├── homework.js
│   ├── missions.js
│   └── rewards.js
├── middleware/
│   ├── auth.js
│   └── consent.js                   ← 동의 여부 체크 미들웨어
└── utils/
    └── storage.js                   ← R2/S3 업로드 헬퍼
```

---

### 1-C. 핵심 서비스 구현 명세

#### aiReview.js — 숙제 사진 분석

```javascript
// 구현할 함수
async function analyzeHomeworkImage(imageBase64, context) {
  // context: { subject, grade, task_description }
  
  // Claude Vision API 호출
  // model: claude-sonnet-4-6
  // max_tokens: 1000
  
  // 반환해야 할 구조:
  // {
  //   subject_detected: string,
  //   problem_count: number,
  //   correct_count: number,
  //   completion_level: 'incomplete'|'partial'|'complete',
  //   error_details: Array<{
  //     problem_index: number,
  //     error_type: 'calculation'|'concept'|'transcription'|'skip',
  //     subject_topic: string,
  //     student_answer: string,
  //     correct_answer: string,
  //     ai_confidence: number
  //   }>,
  //   handwriting_quality: 'poor'|'fair'|'good'|'excellent',
  //   confidence_score: number,
  //   raw_response: object
  // }
}
```

**Claude Vision 프롬프트 가이드:**
```
시스템 프롬프트에 포함할 것:
- 분석할 과목과 학년 정보
- JSON 형식으로만 응답 요청
- 한국 초등학교 교육과정 기준 적용
- 오답 위치를 최대한 구체적으로 설명

응답 언어: 한국어 (아이에게 보여주는 피드백용)
```

#### pointEngine.js — 포인트 이벤트 소싱

```javascript
// point_ledger 테이블에 모든 포인트 변동을 기록
// 절대 users 테이블에 balance 컬럼 두지 말 것 → 이벤트 소싱 유지

async function awardPoints(childId, amount, sourceType, sourceId, description) {
  // 1. 현재 잔액 계산 (SUM from point_ledger)
  // 2. INSERT INTO point_ledger
  // 3. 잔액 반환
}

async function getBalance(childId) {
  // SELECT SUM(amount) FROM point_ledger WHERE child_id = ?
}
```

#### missionEngine.js — 미션 달성 조건 체크

```javascript
// missions.condition JSONB 기반으로 달성 여부 판정

async function checkMissionProgress(childId, missionId) {
  // condition type별 분기:
  // "streak_days"     → task_completions에서 연속일 계산
  // "task_count"      → task_completions COUNT
  // "ai_score_above"  → ai_analyses에서 정답률 계산
  // "all_tasks_week"  → 이번 주 할일 전부 완료 여부
  // "submit_before_time" → completed_at의 시각 체크
  
  // 달성 시: mission_progress.status = 'completed' 업데이트
  //          + pointEngine.awardPoints 호출
  //          + reward_interactions INSERT
}
```

#### anonymizer.js — 익명화 처리

```javascript
// 신규 자녀 가입 시 자동으로 anon_id 생성
async function createAnonProfile(userId, birthYear, grade) {
  const ageGroup = calculateAgeGroup(birthYear);
  const gradeGroup = calculateGradeGroup(grade);
  // INSERT INTO anonymous_child_profiles
  // anon_id: crypto.randomBytes(16).toString('hex')
}

// 데이터 자산 쿼리 시 anon_id로만 조회 (user_id 노출 금지)
async function getDatasetRecords(filters) {
  // anon_child_id 기준으로만 JOIN
  // user_id, email 등 식별 정보 SELECT 금지
}
```

---

### 1-D. API 엔드포인트 명세

#### 숙제 검사 플로우

```
POST /api/homework/sessions
  body: { task_id, subject, environment }
  → homework_sessions 생성, session_id 반환

POST /api/homework/sessions/:sessionId/submit
  body: FormData { image, submission_type, attempt_number }
  → 1. R2에 이미지 업로드
  → 2. homework_submissions INSERT
  → 3. aiReview.analyzeHomeworkImage 호출
  → 4. ai_analyses INSERT
  → 5. skill_records 업데이트 (비동기 처리)
  → 분석 결과 즉시 반환

POST /api/homework/submissions/:submissionId/validate
  body: { decision, overrides, feedback_to_child }
  → parent_validations INSERT
  → decision이 'approved'이면 task_completions.status = 'parent_approved'
  → pointEngine.awardPoints 호출
  → missionEngine.checkMissionProgress 호출 (비동기)

GET /api/homework/sessions/:sessionId
  → 세션 + 제출 이력 + AI 분석 결과 + 부모 검수 결과 JOIN 반환
```

#### 미션 플로우

```
GET /api/missions?child_id=:id
  → 시스템 미션 + 가족 커스텀 미션 목록
  → mission_progress JOIN해서 진행 상태 포함

POST /api/missions (부모만)
  body: { title, mission_type, frequency, nature, condition, bonus_points }
  → missions INSERT (family_id 설정)

GET /api/missions/:missionId/progress/:childId
  → 달성 진행도 반환 (progress_data 기반)
```

#### 포인트 & 리워드

```
GET /api/children/:childId/points
  → 현재 잔액 + 최근 10개 거래 내역

POST /api/rewards/:rewardId/redeem
  → 잔액 확인 → reward_redemptions INSERT → pointEngine 차감
  → reward_interactions INSERT (motivation data)
```

---

### 1-E. 스킬 기록 업데이트 로직

숙제 제출 후 비동기로 실행:

```javascript
async function updateSkillRecords(childId, anonChildId, analysisResult) {
  for (const error of analysisResult.error_details) {
    const topic = error.subject_topic;
    
    // UPSERT skill_records
    // accuracy_history 배열에 오늘 날짜 데이터 추가
    // mastery_score 재계산: 최근 5회 정답률의 가중 평균
    
    // 숙달 판정: 최근 3회 연속 정답률 >= 0.9이면 mastered_at 설정
  }
}
```

---

### 1-F. 환경변수 설정

```env
# Database
DATABASE_URL=postgresql://...

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=kiddoloop-homework
R2_PUBLIC_URL=https://...

# AI APIs
ANTHROPIC_API_KEY=
OPENAI_API_KEY=          # fallback용

# App
JWT_SECRET=
NODE_ENV=production
```

---

## Phase 2 이후 (이번 작업 범위 외)

- **뱃지/레벨 시스템:** `badges`, `child_levels` 테이블 추가
- **실시간 카메라 집중도:** WebSocket + 주기적 스냅샷 분석
- **부모 대시보드 리포트:** `child_weak_skills` view 기반
- **데이터셋 익스포트 API:** 파트너사 연동용 (anon_id 기준, 동의자만)
- **AdMob 연동:** 웹뷰 앱 전환 시 AdSense → AdMob 교체

---

## 데이터 자산화 주의사항 (개발 시 필수 준수)

### PIPA 컴플라이언스
- `users.consents.data_training = true`인 자녀 데이터만 데이터셋으로 활용 가능
- AI 학습 데이터 활용 동의는 서비스 이용 동의와 **별도**로 받아야 함
- 만 14세 미만: `consents.guardian_verified = true` 필수 확인
- 동의 여부 체크는 `middleware/consent.js`에서 중앙 처리

### 익명화 원칙
- 데이터 자산 관련 쿼리는 **반드시** `anon_child_id` 기준
- `user_id`, `email`, `nickname` 절대 데이터셋에 포함 금지
- `anonymous_child_profiles` ↔ `users` JOIN은 내부 서비스 로직에서만 허용

### 이미지 보존 정책
- 원본 이미지: R2에 영구 보존 (암호화 저장)
- 이미지 URL: 서명된 임시 URL로만 제공 (7일 만료)
- 부모가 계정 탈퇴 시: 이미지는 익명화 후 보존 가능 (동의 받은 경우)
  → 개인정보처리방침에 명시 필요

---

## 구현 우선순위 요약

```
즉시 (MVP):
  ✅ DB 마이그레이션 (schema.sql 적용)
  ✅ 사진 업로드 → AI 분석 → 결과 저장 플로우
  ✅ 포인트 적립 이벤트 소싱
  ✅ 미션 달성 조건 체크 (5~6개 하드코딩)

다음 단계:
  ⬜ 스킬 기록 자동 업데이트 (비동기)
  ⬜ 부모 커스텀 미션 생성
  ⬜ 참여도 일별 집계 배치 (engagement_metrics)
  ⬜ 익명화 프로필 자동 생성
```
