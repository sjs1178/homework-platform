# Kiddoloop 서비스 기획서

> **최종 업데이트**: 2026-06-10
> **서비스 URL**: https://homework-platform-ten.vercel.app
> **도메인 (구매 완료)**: kiddoloop.com
> **GitHub**: https://github.com/sjs1178/homework-platform

---

## 1. 서비스 개요

### 한 줄 설명

부모와 자녀가 함께 숙제를 AI로 관리하고, 완료 시 리워드를 받는 패밀리 학습 플랫폼.

### 배경 및 문제 정의

| 문제 | 현재 대안 | 한계 |
|------|-----------|------|
| 숙제 관리가 산발적 | 카카오톡, 수기 메모 | 검색·이력 없음 |
| 자녀 자기주도 학습 부재 | 알림장 앱 | 단순 알림에 그침 |
| 숙제 검사 후 피드백 없음 | 직접 채점 | 학습 데이터 축적 안 됨 |
| 리워드 관리 기준 없음 | 구두 약속 | 일관성 없이 흐지부지 |

### 핵심 가치 제안

1. **AI 입력** — 자연어 또는 사진 한 장으로 숙제 일정 자동 등록
2. **AI 숙제 검사** — Claude Vision이 채점하고 부모가 검토 → 학습 데이터 누적
3. **리워드 시스템** — 완료/점수 기반 자동 적립 + 부모 직접 조정
4. **패밀리 연결** — 초대 코드로 부모-자녀 연결, 설정 한 곳에서 관리

---

## 2. 타겟 사용자

| 구분 | 대상 | 주요 니즈 |
|------|------|-----------|
| 부모 | 초등~중등 자녀를 둔 학부모 | 숙제를 빠르게 등록하고 자녀 학습 상태를 확인하고 싶다 |
| 자녀 | 초등~중등 학생 | 오늘 할 일을 한눈에 보고, 완료하면 보상받고 싶다 |

---

## 3. 사용자 플로우

### 3-1. 공통 — 온보딩

```
앱 접속
  → Google 로그인
  → 역할 선택 (부모 / 자녀)
  → 부모: 초대 코드 생성 → 자녀에게 공유
  → 자녀: 초대 코드 입력 → 페어링 완료
  → 각자 대시보드로 이동
```

### 3-2. 부모 플로우

```
대시보드
  ├── [히어로 카드] 자녀 이름·학년·스트릭·주간 완료 도트·리워드 잔액
  ├── 검사 기다리는 숙제 목록
  ├── 빠른 메뉴: 숙제 입력 / 리워드 관리
  │
  ├── 숙제 입력
  │     ├── 자연어 텍스트 입력 → Claude API 파싱
  │     ├── 사진 촬영/업로드 → Claude Vision 파싱
  │     ├── 파싱 결과 미리보기
  │     ├── 리워드 트리거 설정 (완료 시 지급 / 점수 기반 지급)
  │     └── 리워드 금액 입력 → 저장
  │
  ├── 숙제 검사
  │     ├── 완료된 숙제 목록 확인
  │     ├── 자녀 제출 사진 업로드 (선택) → Claude Vision 자동 채점
  │     ├── 문제별 O/X + 정답 + 해설 확인
  │     ├── 부모 검토·수정 (인라인 편집)
  │     └── 검사 완료 → 학습 데이터 누적 + 리워드 자동 지급
  │
  ├── 리워드 관리
  │     ├── 자녀 리워드 잔액·내역 조회
  │     └── 수동 지급·차감 (금액 + 사유 입력)
  │
  └── 설정
        ├── 자녀 관리 (연결·해제·학년 설정·초대 코드)
        ├── 리워드 이름·단위 설정
        ├── 로그아웃
        └── 공지사항 / 이용약관 / 개인정보처리방침
```

### 3-3. 자녀 플로우

```
대시보드 (BottomNav: 홈·캘린더·리워드·내정보)
  ├── 숙제 캘린더
  │     ├── 월간 뷰: 날짜별 숙제 개수 표시
  │     ├── 날짜 클릭 → 일간 숙제 목록
  │     └── 완료 버튼 클릭 → 리워드 자동 적립
  │
  ├── 내 리워드
  │     ├── 잔액 히어로 카드 (다음 목표 프로그레스 바)
  │     ├── 리워드 교환 카탈로그
  │     └── 적립·사용 내역
  │
  └── 내 정보
        └── 프로필 편집 (이름·아바타)
```

---

## 4. 기능 상세

### 4-1. 인증 및 페어링

| 기능 | 상태 | 설명 |
|------|------|------|
| Google OAuth 로그인 | ✅ | Supabase Auth + Google Provider |
| 역할 선택 | ✅ | 가입 시 부모/자녀 선택 |
| 초대 코드 생성 | ✅ | 부모가 6자리 코드 생성, 클립보드 복사 |
| 초대 코드 입력 | ✅ | 자녀가 코드 입력 → pairs.child_id 연결 |
| 다중 자녀 페어링 | ✅ | pairs 테이블에 parent_id당 여러 행 허용 |

### 4-2. 숙제 입력 (부모)

| 기능 | 상태 | 설명 |
|------|------|------|
| 자연어 텍스트 입력 | ✅ | Claude API `parseHomeworkText()` |
| 이미지 입력 | ✅ | Claude Vision `parseHomeworkImage()` |
| AI 파싱 결과 미리보기 | ✅ | 과목/내용/날짜/시간 확인 후 저장 |
| 과목별 규칙 주입 | ✅ | subject_rules → Claude 프롬프트 주입 |
| 리워드 트리거 설정 | ✅ | 숙제별 "완료 시 지급" / "점수 기반 지급" 토글 |
| 리워드 금액 입력 | ✅ | 숙제별 지급량 직접 입력 |

### 4-3. 숙제 캘린더 (자녀)

| 기능 | 상태 | 설명 |
|------|------|------|
| 월간 캘린더 뷰 | ✅ | 날짜별 숙제 개수 표시 |
| 일간 상세 뷰 | ✅ | 날짜 클릭 시 숙제 목록 |
| 완료 처리 | ✅ | is_completed 업데이트 + reward_logs 적립 |
| 1시간 전 브라우저 알림 | ✅ | Notification API + setTimeout |

### 4-4. 리워드 시스템

| 기능 | 상태 | 설명 |
|------|------|------|
| 리워드 이름·단위 커스텀 | ✅ | pair별 설정 (예: 포인트 / P) |
| 완료 기반 자동 적립 | ✅ | 숙제 완료 시 reward_logs earn |
| 점수 기반 자동 적립 | ✅ | 정답 1개당 reward_amount 적립 |
| 부모 수동 지급·차감 | ✅ | 금액 + 사유 입력, 직접 조정 |
| 자녀 리워드 잔액 확인 | ✅ | 히어로 카드 + 적립·사용 내역 |
| 리워드 교환 카탈로그 | ✅ | pair별 교환 목록 (reward_catalog 테이블) |

### 4-5. AI 숙제 검사

| 기능 | 상태 | 설명 |
|------|------|------|
| 자녀 제출 사진 업로드 | ✅ | 부모가 사진 업로드 (선택사항) |
| Claude Vision 자동 채점 | ✅ | 문제별 O/X + 정답 + 해설 + 점수 |
| AI 총평 생성 | ✅ | sparkles 카드에 총평 표시 |
| 부모 검토·수정 | ✅ | 인라인 편집 (O/X 토글 + 정답·해설 수정) |
| 수동 완료 처리 | ✅ | 사진 없이 "확인 완료로 저장" 가능 |
| 점수 도넛 링 | ✅ | conic-gradient로 정답률 시각화 |
| 학습 데이터 누적 | ✅ | AI 원본 + 부모 수정값 모두 보존 |
| curriculum_meta 자동 태깅 | ✅ | 검사 시 미태깅 숙제 자동 보완 |

### 4-6. 학습 통계

| 기능 | 상태 | 설명 |
|------|------|------|
| 과목별 완료 현황 | ✅ | curriculum_meta 없어도 subject 폴백 처리 |
| 직업군 가이드 | ✅ | 교육과정 메타 기반 직업군 연계 안내 |

### 4-7. 부모 대시보드

| 기능 | 상태 | 설명 |
|------|------|------|
| 히어로 카드 | ✅ | 자녀 이름·학년·리워드 잔액 pill |
| 연속 완료 스트릭 | ✅ | 연속으로 숙제 완료한 날 수 |
| 주간 완료 도트 | ✅ | 월~일 7개 도트, 완료일 체크 표시 |
| 검사 대기 숙제 목록 | ✅ | 완료됐지만 검사 안 된 숙제 |

### 4-8. 설정 페이지

| 기능 | 상태 | 설명 |
|------|------|------|
| 자녀 관리 | ✅ | 초대 코드 복사·삭제, 연결 해제, 학년 설정 |
| 학년 자동 승급 | ✅ | 매년 3월 1일 기준 grade_school_year 로직 |
| 리워드 이름·단위 설정 | ✅ | 설정 페이지로 이동 (리워드 관리에서 분리) |
| 로그아웃 | ✅ | Supabase signOut → 로그인 페이지 |
| 공지사항 링크 | ✅ | /notices 페이지 연결 |
| 이용약관 링크 | ✅ | /terms 페이지 연결 |
| 개인정보처리방침 링크 | ✅ | /privacy 페이지 연결 |

### 4-9. 어드민 패널 (`/admin`)

| 기능 | 상태 | 설명 |
|------|------|------|
| 어드민 로그인 | ✅ | ID: admin / PW: 1178 또는 sjs1178@gmail.com 자동 |
| 회원 관리 | ✅ | 전체 회원 목록, 이름·이메일·역할·가입일 검색·조회 |
| 회원 삭제 | ✅ | 연결된 숙제·리워드 cascade 삭제 후 auth 계정 삭제 |
| 페어링 관리 | ✅ | 전체 페어 목록, 자녀 UUID 변경, 페어 삭제 |
| 리워드 관리 | ✅ | 페어별 잔액 요약, 내역 조회, 어드민 직접 지급·차감 |
| 공지사항 CRUD | ✅ | 작성·수정·삭제, 공개/비공개 토글 |
| 이용약관 버전 관리 | ✅ | 신규 버전 게시 시 이전 버전 is_current=false, 이력 보존 |
| 개인정보처리방침 버전 관리 | ✅ | 동일 (버전명·수정자·날짜 기록) |

### 4-10. 공개 콘텐츠 페이지 (로그인 불필요)

| URL | 설명 |
|-----|------|
| `/notices` | 공지사항 목록 (최신순) |
| `/notices/[id]` | 공지사항 상세 |
| `/terms` | 현재 이용약관 (버전·수정일 표기) |
| `/privacy` | 현재 개인정보처리방침 (버전·수정일 표기) |

---

## 5. 디자인 시스템 (B 디자인)

### 브랜드 & 타이포

- **폰트**: Pretendard Variable (CDN)
- **브랜드명**: kiddoloop (소문자, 고정)

### 컬러 토큰

| 토큰 | 값 | 용도 |
|------|----|------|
| `--green` | `#16A34A` | Primary action, CTA |
| `--green-d` | `#15803D` | Hover, text accent |
| `--green-50` | `#F0FDF4` | 버튼 배경 (보조) |
| `--amber` | `#F59E0B` | 리워드, 포인트 |
| `--amber-d` | `#D97706` | 리워드 강조 |
| `--bg` | `#F4F8F5` | 앱 배경 |
| `--surface` | `#FFFFFF` | 카드 배경 |
| `--text` | `#13241B` | 본문 |
| `--muted` | `#6B7B72` | 보조 텍스트 |

### 그림자 토큰

| 토큰 | 용도 |
|------|------|
| `--sh-sm` | 작은 카드 |
| `--sh-md` | 일반 카드 |
| `--sh-green` | CTA 버튼 |
| `--sh-hero-green` | 부모 히어로 카드 |
| `--sh-hero-gold` | 리워드 히어로 카드 |

### 공통 컴포넌트

| 컴포넌트 | 경로 | 설명 |
|----------|------|------|
| `Icon` | `src/components/ui/Icon.tsx` | Lucide-style SVG 아이콘 (30+ 종) |
| `BottomNav` | `src/components/ui/BottomNav.tsx` | 자녀 하단 탭 (홈·캘린더·리워드·내정보) |

---

## 6. 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | Next.js (App Router) | 15.x |
| Styling | CSS Variables + Inline Styles | — |
| Database | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth + Google OAuth | — |
| AI | Anthropic Claude API | claude-sonnet-4-6 |
| Hosting | Vercel | — |
| CI/CD | GitHub push → Vercel 자동 배포 | — |
| Language | TypeScript (strict mode) | — |

---

## 7. 데이터베이스 구조

### 테이블 목록

| 테이블 | 역할 |
|--------|------|
| `user_profiles` | 사용자 역할·이름·아바타·pair_id·학년 |
| `pairs` | 부모-자녀 페어, 초대 코드, pair_name |
| `homeworks` | 등록된 숙제 (과목·내용·날짜·완료 여부·리워드·트리거) |
| `reward_settings` | pair별 리워드 명칭·단위 |
| `reward_logs` | 리워드 적립·사용 내역 |
| `reward_catalog` | pair별 교환 가능 리워드 목록 |
| `subject_rules` | 과목별 AI 파싱 규칙 |
| `homework_checks` | AI 채점 결과 (문제별 O/X·정답·해설·점수·총평) |
| `homework_check_corrections` | 부모 검토·수정 데이터 (학습 corpus) |
| `announcements` | 공지사항 (제목·내용·공개 여부) |
| `legal_documents` | 약관·개인정보처리방침 버전 이력 |

### homeworks 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `reward_trigger` | text | `'completion'` \| `'score'` |
| `reward_amount` | int | 지급량 (completion: 고정, score: 정답당) |
| `curriculum_meta` | jsonb | AI 자동 태깅 교육과정 메타 |

### legal_documents 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `doc_type` | text | `'terms'` \| `'privacy'` |
| `version` | text | 예: `v2026.06.10` |
| `is_current` | boolean | 현재 버전 여부 (최신 1개만 true) |
| `edited_by` | text | 수정자 |

### DB 마이그레이션 이력

| 파일 | 내용 |
|------|------|
| 001_initial_schema.sql | 기본 스키마 + RLS |
| 002_homework_check.sql | homework_checks + reward_trigger |
| 003_family_and_corrections.sql | homework_check_corrections + pair_name |
| 004_profile_avatar.sql | user_profiles.avatar_id 추가 |
| 005_user_profiles_pair_read.sql | pair 구성원 간 프로필 읽기 RLS |
| 006_grade.sql | user_profiles.grade + grade_school_year |
| 007_curriculum_meta.sql | homeworks.curriculum_meta jsonb |
| 008_reward_catalog.sql | reward_catalog 테이블 |
| 009_homework_reward_trigger.sql | homeworks.reward_trigger 컬럼 |
| 010_admin_content.sql | announcements + legal_documents 테이블 |

### RLS 정책 요약

| 테이블 | 정책 |
|--------|------|
| user_profiles | 본인만 쓰기; 같은 pair 상대방은 읽기 허용 |
| pairs | parent_id 또는 child_id가 본인인 경우 |
| homeworks | 같은 pair 구성원 읽기; 부모만 쓰기 |
| reward_logs | 같은 pair 구성원 모두 |
| reward_settings | 같은 pair 구성원 모두 |
| reward_catalog | 같은 pair 구성원 모두 |
| homework_checks | 같은 pair 구성원 모두 |
| homework_check_corrections | 부모만 쓰기 |
| announcements | 공개 글 전체 읽기 (service role만 쓰기) |
| legal_documents | 전체 읽기 (service role만 쓰기) |

---

## 8. AI 기능 상세

### 숙제 파싱

- **입력**: 자연어 텍스트 또는 숙제 사진
- **모델**: `claude-sonnet-4-6`
- **출력**: `{ subject, description, due_date, due_time, end_time }[]`
- **최적화**: System prompt에 `cache_control: ephemeral` (과목 규칙 캐싱)

### 숙제 채점 (Vision)

- **입력**: 자녀 숙제 사진 (base64, 선택)
- **모델**: `claude-sonnet-4-6` (Vision)
- **출력**: 문제별 `{ isCorrect, correctAnswer, explanation }` + 전체 점수 + 총평
- **학습 데이터**: AI 원본 + 부모 수정값 → `homework_check_corrections` 보존

### 교육과정 메타 자동 태깅

- **입력**: 숙제 subject + description + 학년
- **출력**: `{ subject, area, grade, detail }` → `homeworks.curriculum_meta`
- **트리거**: 숙제 검사 시 curriculum_meta가 null이면 자동 보완

---

## 9. 화면 목록

### 공통

| URL | 대상 | 설명 |
|-----|------|------|
| `/auth/login` | 공통 | Google 로그인 (kiddoloop 브랜드) |
| `/auth/select-role` | 신규 | 부모/자녀 역할 선택 |
| `/notices` | 공개 | 공지사항 목록 |
| `/notices/[id]` | 공개 | 공지사항 상세 |
| `/terms` | 공개 | 이용약관 (현재 버전) |
| `/privacy` | 공개 | 개인정보처리방침 (현재 버전) |

### 부모

| URL | 설명 |
|-----|------|
| `/parent/dashboard` | 히어로 카드·스트릭·주간 도트·검사 대기 목록 |
| `/parent/homework/new` | 숙제 입력 (텍스트/이미지 + 리워드 설정) |
| `/parent/homework/check` | 숙제 검사 + AI 채점 + 검토·수정 |
| `/parent/rewards` | 리워드 잔액·내역 + 수동 지급·차감 |
| `/parent/stats` | 학습 통계 + 직업군 가이드 |
| `/parent/settings` | 자녀 관리·리워드 설정·로그아웃·앱 정보 |

### 자녀

| URL | 설명 |
|-----|------|
| `/child/calendar` | 월간 숙제 캘린더 |
| `/child/rewards` | 리워드 히어로·내역·교환 카탈로그 |
| `/child/profile` | 프로필 편집 (이름·아바타) |

### 어드민

| URL | 설명 |
|-----|------|
| `/admin/login` | 어드민 로그인 (admin/1178) |
| `/admin/users` | 회원 목록 + 삭제 |
| `/admin/pairs` | 페어링 현황 + 자녀 변경 |
| `/admin/rewards` | 페어별 리워드 내역 + 조정 |
| `/admin/content` | 공지사항 CRUD + 약관 버전 관리 |

---

## 10. API 엔드포인트

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/parse-homework` | POST | 자연어/이미지 → 숙제 파싱 |
| `/api/check-homework` | POST | 숙제 사진 → AI 채점 |
| `/api/correct-homework` | POST | 부모 수정 저장 |
| `/api/complete-homework` | POST | 자녀 완료 처리 + 리워드 적립 |
| `/api/adjust-reward` | POST | 부모 수동 리워드 조정 |
| `/api/redeem-reward` | POST | 자녀 리워드 교환 |
| `/api/stats` | GET | 학습 통계 데이터 |
| `/api/family` | POST | 페어 생성·수정·삭제·학년 설정 |
| `/api/pair` | POST | 자녀 초대 코드 입력 → 페어링 |
| `/api/admin/login` | POST | 어드민 로그인 → cookie 발급 |
| `/api/admin/logout` | POST | 어드민 로그아웃 |
| `/api/admin/users` | GET/DELETE | 회원 목록 조회 / 삭제 |
| `/api/admin/pairs` | GET/PATCH/DELETE | 페어 조회 / 자녀 변경 / 삭제 |
| `/api/admin/rewards` | GET/POST | 리워드 현황 / 어드민 조정 |
| `/api/admin/content/announcements` | GET/POST/PATCH/DELETE | 공지사항 CRUD |
| `/api/admin/content/legal` | GET/POST | 약관 조회 / 신규 버전 게시 |

---

## 11. 배포 현황

| 항목 | 내용 |
|------|------|
| 프로덕션 URL | https://homework-platform-ten.vercel.app |
| 도메인 | kiddoloop.com (가비아 구매 완료, Vercel 연결 예정) |
| 배포 방식 | GitHub push → Vercel 자동 배포 |
| Supabase 프로젝트 | stlxwsufitsktgpwjunm.supabase.co |
| 최근 배포 | 2026-06-10 (B 디자인 + 어드민 + 설정 페이지) |

---

## 12. 향후 개발 백로그

### 높은 우선순위

| 기능 | 설명 |
|------|------|
| kiddoloop.com 도메인 연결 | Vercel 도메인 설정 + 가비아 DNS |
| 부모 완료 알림 | 자녀 완료 처리 시 푸시/이메일 알림 |
| 과목별 규칙 설정 UI | subject_rules 테이블 CRUD UI |
| 리워드 카탈로그 관리 UI | 부모가 교환 항목 직접 추가·삭제 |

### 중간 우선순위

| 기능 | 설명 |
|------|------|
| 숙제 수정·삭제 | 등록된 숙제 편집 기능 |
| 자녀 결과 확인 화면 | 숙제 검사 결과 자녀가 확인 |
| 월간 리포트 | 완료율·리워드 통계 |
| PWA / 홈 화면 추가 | 모바일 앱처럼 설치 가능 |

### 낮은 우선순위 (MVP 이후)

| 기능 | 설명 |
|------|------|
| React Native 앱 | 웹 검증 후 모바일 앱 전환 |
| 학습 데이터 활용 | corrections corpus로 과목별 맞춤 피드백 |
| 다중 자녀 프로필 전환 | 부모가 대시보드에서 자녀 전환 |
| 학원 연동 | 외부 학원 숙제 데이터 연결 |

---

## 13. 주요 의사결정 기록

| 날짜 | 결정 | 이유 |
|------|------|------|
| 초기 | 이미지 업로드 대신 이모지 아바타 | 저장 비용 없음, 구현 단순, 아이들에게 친숙 |
| 초기 | BaaS(Supabase) 선택 | 1인 개발, Auth+DB+RLS 통합, 빠른 MVP |
| 초기 | homework-alert claude.ts 파싱 로직 이식 | 검증된 로직 재사용, 개발 시간 단축 |
| 초기 | 다중 자녀 지원 설계 | pairs 테이블에 parent_id당 여러 행 허용 |
| 배포 | Next.js 15.x 강제 업그레이드 | CVE-2025-66478 보안 취약점 (Vercel 배포 차단) |
| RLS | user_profiles pair 읽기 정책 추가 | 부모가 자녀 이름·아바타를 읽지 못하는 버그 수정 |
| 2026-06-10 | Tailwind → CSS Variables + Inline Styles | B 디자인 토큰 시스템 적용, 디자인-코드 일관성 |
| 2026-06-10 | 리워드 트리거를 전역 설정 → 숙제별 컬럼으로 | 숙제마다 다른 지급 방식 필요 |
| 2026-06-10 | 리워드·패밀리 설정 → 설정 페이지로 통합 | 부모 대시보드 단순화, 설정 집중화 |
| 2026-06-10 | 어드민 인증: admin/1178 + 관리자 이메일 자동 로그인 | 별도 관리자 계정 운영 불필요, 단순 운영 |
| 2026-06-10 | 약관·공지 버전 이력 DB 보존 | 법적 요건 대비, 이전 버전 열람 가능 |
