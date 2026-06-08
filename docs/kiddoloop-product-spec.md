# Kiddoloop 서비스 기획서

> **최종 업데이트**: 2026-06-08
> **서비스 URL**: https://homework-platform-ten.vercel.app
> **도메인 (구매 완료)**: kiddoloop.com
> **GitHub**: https://github.com/sjs1178/homework-platform

---

## 1. 서비스 개요

### 한 줄 설명

부모와 자녀가 함께 숙제를 AI로 관리하고, 완료 시 리워드를 받는 패밀리 캘린더 플랫폼.

### 배경 및 문제 정의

| 문제 | 현재 대안 | 한계 |
|------|-----------|------|
| 숙제 관리가 산발적 | 카카오톡, 수기 메모 | 검색·이력 없음 |
| 자녀 자기주도 학습 부재 | 알림장 앱 | 단순 알림에 그침 |
| 숙제 검사 후 피드백 없음 | 직접 채점 | 학습 데이터 축적 안 됨 |

### 핵심 가치 제안

1. **AI 입력** — 자연어 또는 사진 한 장으로 숙제 일정 자동 등록
2. **리워드 시스템** — 완료 처리 시 게임시간·용돈포인트 자동 적립
3. **AI 숙제 검사** — Claude Vision이 채점하고, 부모가 검토·수정 → 학습 데이터 누적
4. **패밀리 연결** — 초대 코드로 간단하게 부모-자녀 연결

---

## 2. 타겟 사용자

| 구분 | 대상 | 주요 니즈 |
|------|------|-----------|
| 부모 | 초등~중등 자녀를 둔 학부모 | 숙제를 빠르게 등록하고, 자녀 학습 상태를 확인하고 싶다 |
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
  ├── 숙제 입력
  │     ├── 자연어 텍스트 입력 → Claude API 파싱
  │     ├── 사진 촬영/업로드 → Claude Vision 파싱
  │     └── 파싱 결과 미리보기 → 저장
  │
  ├── 숙제 검사
  │     ├── 완료된 숙제 목록 확인
  │     ├── 자녀 제출 사진 업로드 → Claude Vision 자동 채점
  │     ├── 문제별 O/X + 정답 + 해설 확인
  │     ├── 부모 검토·수정 (인라인 편집)
  │     └── 수정 내용 저장 → 학습 데이터 누적
  │
  ├── 리워드 설정
  │     ├── 게임시간 리워드 (명칭·단위 설정)
  │     └── 용돈포인트 리워드 (명칭·단위 설정)
  │
  └── 패밀리 관리
        ├── 연결된 자녀 목록 + 아바타/이름 확인
        ├── 자녀 연결 해제
        ├── 초대 코드 복사/삭제
        └── 자녀 추가 (다중 자녀 지원)
```

### 3-3. 자녀 플로우

```
대시보드 (아바타 + 이름 표시)
  ├── 프로필 편집
  │     ├── 이름 변경
  │     └── 아바타 선택 (남자아이/여자아이 인종별 5종 + 동물 4종)
  │
  ├── 숙제 캘린더
  │     ├── 월간 뷰: 날짜별 숙제 개수 표시
  │     ├── 날짜 클릭 → 일간 숙제 목록
  │     └── 완료 버튼 클릭 → 리워드 자동 적립
  │
  ├── 내 리워드
  │     ├── 게임시간 잔여·적립 내역
  │     └── 용돈포인트 잔여·적립 내역
  │
  └── 숙제 검사 결과 (부모가 검사 완료 시)
        ├── 점수 확인
        ├── 문제별 O/X 피드백
        └── 해설 확인 (정답은 미표시)
```

---

## 4. 기능 상세

### 4-1. 인증 및 페어링

| 기능 | 상태 | 설명 |
|------|------|------|
| Google OAuth 로그인 | ✅ 완료 | Supabase Auth + Google Provider |
| 역할 선택 | ✅ 완료 | 가입 시 부모/자녀 선택, user_profiles에 저장 |
| 초대 코드 생성 | ✅ 완료 | 부모가 6자리 코드 생성, 클립보드 복사 |
| 초대 코드 입력 | ✅ 완료 | 자녀가 코드 입력 → pairs.child_id 연결 |
| 다중 자녀 페어링 | ✅ 완료 | pairs 테이블에 parent_id당 여러 행 허용 |
| 모바일 Google 로그인 | ✅ 완료 | Supabase redirect URL 추가 설정 |

### 4-2. 숙제 입력 (부모)

| 기능 | 상태 | 설명 |
|------|------|------|
| 자연어 텍스트 입력 | ✅ 완료 | Claude API `parseHomeworkText()` |
| 이미지 입력 | ✅ 완료 | Claude Vision `parseHomeworkImage()` |
| AI 파싱 결과 미리보기 | ✅ 완료 | 과목/내용/날짜/시간 확인 후 저장 |
| 과목별 규칙 주입 | ✅ 완료 | subject_rules 테이블 → Claude 프롬프트 주입 |
| 캘린더 저장 | ✅ 완료 | homeworks 테이블 upsert |

### 4-3. 숙제 캘린더 (자녀)

| 기능 | 상태 | 설명 |
|------|------|------|
| 월간 캘린더 뷰 | ✅ 완료 | 날짜별 숙제 개수 표시 |
| 일간 상세 뷰 | ✅ 완료 | 날짜 클릭 시 숙제 목록 |
| 완료 처리 | ✅ 완료 | is_completed 업데이트 + reward_logs 적립 |
| 1시간 전 브라우저 알림 | ✅ 완료 | Notification API + setTimeout |

### 4-4. 리워드 시스템

| 기능 | 상태 | 설명 |
|------|------|------|
| 게임시간 리워드 설정 | ✅ 완료 | 명칭·단위 커스텀 |
| 용돈포인트 리워드 설정 | ✅ 완료 | 명칭·단위 커스텀 |
| 완료 기반 자동 적립 | ✅ 완료 | 숙제 완료 시 reward_logs earn |
| 점수 기반 적립 | ✅ 완료 | 숙제 검사 점수에 따라 multiplier 적용 |
| 자녀 리워드 내역 조회 | ✅ 완료 | 잔여·사용 내역 표시 |

### 4-5. AI 숙제 검사

| 기능 | 상태 | 설명 |
|------|------|------|
| 자녀 제출 사진 업로드 | ✅ 완료 | 부모가 사진 업로드 |
| Claude Vision 자동 채점 | ✅ 완료 | 문제별 O/X + 정답 + 해설 + 점수 |
| 부모 검토·수정 | ✅ 완료 | 인라인 편집 UI (O/X 토글 + 정답·해설 수정) |
| 수정 데이터 저장 | ✅ 완료 | homework_check_corrections 테이블 |
| 자녀 결과 확인 | ✅ 완료 | 점수·O/X·해설 표시 (정답 미노출) |
| 학습 데이터 누적 | ✅ 완료 | AI 원본 + 부모 수정값 모두 보존 |

### 4-6. 패밀리 관리

| 기능 | 상태 | 설명 |
|------|------|------|
| 연결된 자녀 목록 | ✅ 완료 | 아바타·이름 표시 |
| 자녀 연결 해제 | ✅ 완료 | pairs.child_id → null |
| 초대 코드 관리 | ✅ 완료 | 복사·삭제 |
| 자녀 추가 | ✅ 완료 | 새 pair 생성 |

### 4-7. 프로필

| 기능 | 상태 | 설명 |
|------|------|------|
| 자녀 이름 변경 | ✅ 완료 | user_profiles.display_name 업데이트 |
| 아바타 선택 | ✅ 완료 | 14종 이모지 (남자아이 5·여자아이 5·동물 4) |
| 부모 화면 연동 | ✅ 완료 | 대시보드·패밀리 페이지에 자녀 아바타 반영 |

---

## 5. 아바타 목록

| 카테고리 | ID | 이모지 |
|----------|----|--------|
| 남자아이 | boy-light | 👦🏻 |
| 남자아이 | boy-medium-light | 👦🏼 |
| 남자아이 | boy-medium | 👦🏽 |
| 남자아이 | boy-medium-dark | 👦🏾 |
| 남자아이 | boy-dark | 👦🏿 |
| 여자아이 | girl-light | 👧🏻 |
| 여자아이 | girl-medium-light | 👧🏼 |
| 여자아이 | girl-medium | 👧🏽 |
| 여자아이 | girl-medium-dark | 👧🏾 |
| 여자아이 | girl-dark | 👧🏿 |
| 동물 | dog | 🐶 |
| 동물 | cat | 🐱 |
| 동물 | rabbit | 🐰 |
| 동물 | otter | 🦦 |

---

## 6. 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | Next.js (App Router) | 15.3.9 |
| Styling | Tailwind CSS | 3.x |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth + Google OAuth | - |
| AI | Anthropic Claude API | claude-sonnet-4-6 |
| Hosting | Vercel | - |
| CI/CD | GitHub + Vercel 자동 배포 | - |
| Language | TypeScript | strict mode |

---

## 7. 데이터베이스 구조

### 테이블 목록

| 테이블 | 역할 |
|--------|------|
| `user_profiles` | 사용자 역할·이름·아바타·pair_id |
| `pairs` | 부모-자녀 페어, 초대 코드 |
| `homeworks` | 등록된 숙제 (과목·내용·날짜·완료 여부·리워드) |
| `reward_settings` | pair별 리워드 명칭·단위·트리거 방식 |
| `reward_logs` | 리워드 적립·사용 내역 |
| `subject_rules` | 과목별 AI 파싱 규칙 |
| `homework_checks` | AI 채점 결과 (문제별 O/X·정답·해설·점수) |
| `homework_check_corrections` | 부모 검토·수정 데이터 (학습 데이터 corpus) |

### RLS 정책 요약

| 테이블 | 정책 |
|--------|------|
| user_profiles | 본인만 쓰기; 같은 pair 상대방은 읽기 허용 |
| pairs | parent_id 또는 child_id가 본인인 경우 |
| homeworks | 같은 pair 구성원 읽기; 부모만 쓰기 |
| reward_logs | 같은 pair 구성원 모두 |
| reward_settings | 같은 pair 구성원 모두 |
| subject_rules | 같은 pair 구성원 모두 |
| homework_checks | 같은 pair 구성원 모두 |
| homework_check_corrections | 부모만 쓰기 |

### DB 마이그레이션 이력

| 파일 | 내용 |
|------|------|
| 001_initial_schema.sql | 기본 스키마 + RLS |
| 002_homework_check.sql | homework_checks + reward_trigger |
| 003_family_and_corrections.sql | homework_check_corrections + is_reviewed + pair_name |
| 004_profile_avatar.sql | user_profiles.avatar_id 추가 |
| 005_user_profiles_pair_read.sql | pair 구성원 간 프로필 읽기 RLS 추가 |

---

## 8. AI 기능 상세

### 숙제 파싱

- **입력**: 자연어 텍스트 또는 숙제 사진
- **모델**: `claude-sonnet-4-6`
- **출력**: `{ subject, description, due_date, due_time, end_time }[]`
- **최적화**: System prompt에 `cache_control: ephemeral` 적용 (과목 규칙 캐싱)

### 숙제 채점 (Vision)

- **입력**: 자녀 숙제 사진 (base64)
- **모델**: `claude-sonnet-4-6` (Vision)
- **출력**: 문제별 `{ isCorrect, correctAnswer, explanation }` + 전체 점수
- **학습 데이터**: AI 원본 채점 + 부모 수정값을 `homework_check_corrections`에 모두 보존

---

## 9. 화면 목록

| URL | 대상 | 설명 |
|-----|------|------|
| `/auth/login` | 공통 | Google 로그인 |
| `/auth/select-role` | 신규 | 부모/자녀 역할 선택 |
| `/parent/dashboard` | 부모 | 대시보드 (자녀 연결 상태·완료 숙제 목록) |
| `/parent/homework/new` | 부모 | 숙제 입력 (텍스트/이미지) |
| `/parent/homework/check` | 부모 | 숙제 검사 + 검토·수정 |
| `/parent/rewards` | 부모 | 리워드 설정 |
| `/parent/family` | 부모 | 패밀리 관리 |
| `/child/dashboard` | 자녀 | 대시보드 (아바타·이름·메뉴) |
| `/child/profile` | 자녀 | 프로필 편집 (이름·아바타) |
| `/child/calendar` | 자녀 | 월간 숙제 캘린더 |
| `/child/rewards` | 자녀 | 리워드 내역 |
| `/child/results` | 자녀 | 숙제 검사 결과 확인 |

---

## 10. 배포 현황

| 항목 | 내용 |
|------|------|
| 프로덕션 URL | https://homework-platform-ten.vercel.app |
| 도메인 | kiddoloop.com (가비아 구매 완료, Vercel 연결 예정) |
| 배포 방식 | GitHub push → Vercel 자동 배포 |
| Supabase 프로젝트 | stlxwsufitsktgpwjunm.supabase.co |

---

## 11. 향후 개발 백로그

### 높은 우선순위

| 기능 | 설명 |
|------|------|
| kiddoloop.com 도메인 연결 | Vercel 도메인 설정 + 가비아 DNS |
| 숙제별 리워드 금액 설정 UI | 현재 기본값 0으로 저장됨 |
| 부모 완료 알림 | 자녀 완료 처리 시 푸시/이메일 알림 |
| 과목별 규칙 설정 UI | subject_rules 테이블 CRUD |

### 중간 우선순위

| 기능 | 설명 |
|------|------|
| 숙제 수정·삭제 | 등록된 숙제 편집 기능 |
| 리워드 수동 추가·차감 | 부모가 직접 조정 |
| 월간 리포트 | 완료율·리워드 통계 |
| 다크모드 | |

### 낮은 우선순위 (MVP 이후)

| 기능 | 설명 |
|------|------|
| React Native 앱 | 웹 검증 후 모바일 앱 전환 |
| 학습 데이터 활용 | corrections corpus로 과목별 맞춤 피드백 |
| 학원 연동 | 외부 학원 숙제 데이터 연결 |
| 소셜 공유 | 리워드 현황 공유 |

---

## 12. 주요 의사결정 기록

| 날짜 | 결정 | 이유 |
|------|------|------|
| 초기 | 이미지 업로드 대신 이모지 아바타 | 저장 비용 없음, 구현 단순, 아이들에게 친숙 |
| 초기 | BaaS(Supabase) 선택 | 1인 개발, Auth+DB+RLS 통합, 빠른 MVP |
| 초기 | homework-alert claude.ts 파싱 로직 이식 | 검증된 로직 재사용, 개발 시간 단축 |
| 초기 | 다중 자녀 지원 설계 | pairs 테이블에 parent_id당 여러 행 허용 |
| 배포 | Next.js 15.3.9로 강제 업그레이드 | CVE-2025-66478 보안 취약점 (Vercel 배포 차단) |
| RLS | user_profiles pair 읽기 정책 추가 | 부모가 자녀 이름·아바타를 읽지 못하는 버그 수정 |
