# CLAUDE.md

## Project

**homework-platform** — 부모와 자녀가 함께 숙제 일정을 캘린더로 관리하고 리워드를 받는 패밀리 플랫폼.

## Stack

- Frontend: Next.js 15 (App Router) + Tailwind CSS
- Backend/DB/Auth: Supabase (Google OAuth + PostgreSQL + RLS)
- AI: Anthropic Claude API (`claude-sonnet-4-6`)
- Hosting: Vercel / GitHub Actions CI

## Role

Act as a senior full-stack engineer, product manager, and technical cofounder.

## Development Rules

- Always read `docs/00-product-brief.md` before making product-level decisions.
- Always read `docs/04-architecture.md` before changing tech structure.
- Do not introduce new libraries without explaining why.
- Prefer simple, maintainable architecture over premature optimization.
- Write tests for business-critical logic.
- When modifying code, summarize:
  1. What changed
  2. Why it changed
  3. Files modified
  4. How to test

## Coding Style

- Keep functions small and readable.
- Use clear naming.
- Avoid overengineering.
- Server Actions over API Routes when possible.
- RLS is the primary security layer — never bypass it.

## AI 파싱 규칙

- 숙제 파싱 로직: `src/lib/parse-homework.ts` (homework-alert의 claude.ts 기반)
- 자연어 입력 → `parseHomeworkText()`, 이미지 입력 → `parseHomeworkImage()`
- 과목별 규칙은 `subject_rules` 테이블에서 로드 → 프롬프트에 주입
- Prompt caching 적용 (system prompt에 `cache_control: ephemeral`)

## Documentation Rules

- 주요 의사결정 시 `docs/08-decision-log.md` 업데이트.
- 기능 추가 시 `docs/02-requirements.md` 또는 `docs/03-user-stories.md` 업데이트.
- `backlog/backlog.md` 항상 최신 상태 유지.

## DB 변경 규칙

- 스키마 변경은 `supabase/migrations/` 에 SQL 파일로 추가.
- RLS 정책 항상 함께 작성.

## 현재 구현 상태 (2026-06-08 기준)

### 완료된 기능
- Google OAuth 로그인 → 역할 선택(부모/자녀) → 페어링(초대 코드)
- 부모: 자연어/이미지 숙제 입력 → Claude 파싱 → 미리보기 → 저장
- 자녀: 월간 캘린더 + 날짜 클릭 → 일간 숙제 목록 + 완료 버튼
- 완료 처리 → reward_logs에 자동 적립
- 부모/자녀: 리워드 현황 및 내역 조회
- 부모: 리워드 이름/단위 설정

### 배포
- 프로덕션 URL: https://homework-platform-ten.vercel.app
- GitHub push → Vercel 자동 배포
- Supabase 프로젝트: stlxwsufitsktgpwjunm.supabase.co

### 다음 우선순위 (backlog/backlog.md 참고)
- kiddoloop.com 도메인 연결 (가비아에서 구매 완료)
- 숙제별 리워드 금액 입력 UI (현재 기본값 0으로 저장됨)
- 부모: 완료 알림
- 과목별 규칙 설정 UI

### 주요 파일 구조
- 인증/페어링: `src/app/auth/`, `src/app/api/pair/`
- 부모 기능: `src/app/parent/`
- 자녀 기능: `src/app/child/`
- AI 파싱 API: `src/app/api/parse-homework/`
- 완료 처리 API: `src/app/api/complete-homework/`
- Claude 파싱 로직: `src/lib/parse-homework.ts`
