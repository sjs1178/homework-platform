# CLAUDE.md

## Project

**kiddoloop** — 부모와 자녀가 함께 숙제를 AI로 관리하고 완료 시 리워드를 받는 패밀리 학습 플랫폼.

- 프로덕션: https://kiddoloop.com
- 대표 메일: contact@kiddoloop.com
- GitHub: https://github.com/sjs1178/homework-platform

## Stack

- **Frontend**: Next.js 15 App Router + CSS Variables + Inline Styles (Tailwind 없음)
- **Backend/DB/Auth**: Supabase (Seoul) — PostgreSQL + RLS + Google OAuth
- **AI**: Anthropic Claude API (`claude-sonnet-4-6`) + BYOK (Claude/OpenAI/Gemini)
- **Hosting**: Vercel icn1(Seoul) / GitHub push 자동 배포
- **Email**: Nodemailer + Zoho Mail SMTP (contact@kiddoloop.com)

## Role

Act as a senior full-stack engineer, product manager, and technical cofounder.

## 핵심 설계 원칙

- **RLS 격리**: pair_id 기준 데이터 접근 제어 — 서버에서 RLS 절대 우회 금지
- **역할 격리**: 미들웨어에서 role 기반 라우트 보호 (DB 실시간 검증)
- **BYOK**: 사용자 AI 토큰은 localStorage에만 저장, DB 저장 절대 금지
- **서버 컴포넌트 우선**: 초기 데이터 페칭은 Server Component, 인터랙션만 Client Component
- **API Route 사용**: Server Action 대신 Route Handler (BYOK 토큰 전달 필요)

## Development Rules

- 기능 변경 전 `docs/04-architecture.md` 확인.
- 제품 결정 전 `docs/kiddoloop-product-spec.md` 확인.
- 백로그 변경 시 `backlog/backlog.md` 업데이트.
- 새 라이브러리 도입 시 반드시 이유 설명.
- DB 스키마 변경은 `supabase/migrations/` SQL 파일로 추가 + RLS 정책 함께 작성.

## Coding Style

- 함수 작게, 이름 명확하게, 오버엔지니어링 금지.
- 주석은 WHY가 비자명할 때만 (WHAT 설명 주석 금지).
- 에러 핸들링은 시스템 경계(외부 API, 사용자 입력)에만.

## 현재 구현 상태 (2026-06-20 기준)

### 배포 인프라
- 프로덕션 URL: https://kiddoloop.com
- Vercel 리전: icn1 (Seoul)
- Supabase 프로젝트: muzevgexilkborqisrai.supabase.co (Seoul)
- GitHub push → Vercel 자동 배포

### 완료된 주요 기능
- Google OAuth 로그인 (웹 + Android WebView 네이티브 브리지)
- 온보딩 위저드: 역할→생년월일→약관 동의 (서버사이드 강제)
- 미성년자 법정대리인 승인 흐름 (pending_approvals + 이메일 발송)
- 만 14세 미만 동의 생략 (법정대리인 대리 동의, 개인정보보호법 제22조의2)
- 가입 이메일 자동 발송 (부모 승인 요청 + 자녀 승인 완료, Nodemailer + Zoho SMTP)
- 미들웨어 역할 격리 (부모↔자녀 페이지 격리, 온보딩 미완료 차단)
- 워크스루 슬라이드 (비로그인 첫 방문자, localStorage skip)
- 부모: 자연어/이미지 숙제 입력 → Claude AI 파싱 → 저장
- 부모: AI 숙제 검사 (Claude Vision) + 수동 검사 모드
- 부모: 캘린더 (자녀 숙제 읽기 전용, /parent/calendar)
- 부모: 리워드 수동 지급·차감 + 이름·단위 커스텀
- 부모: 자녀 학년 설정 + 다:다 연결 (초대 코드)
- 자녀: 월간 캘린더 + 완료 처리 + 리워드 적립 + 숙제 등록 요청
- 자녀: 학습 통계 (과목별 완료 현황 + 직업군 가이드)
- 자녀: 이모지 아바타 프로필 + 로그아웃
- BYOK AI 토큰 (Claude/OpenAI/Gemini, localStorage, 광고 게이트)
- 어드민 패널 (회원/페어링/숙제/검사/리워드/콘텐츠)
- 공지사항·약관·개인정보처리방침·도움말 (공개 페이지)

### 다음 우선순위 (backlog/backlog.md 참고)
- Android WebView 앱 코드 작성 + FCM 푸시 알림
- 자녀 완료 시 부모 알림
- 숙제 수정·삭제 UI
- 과목별 규칙 설정 UI

## 주요 파일 위치

| 역할 | 경로 |
|------|------|
| 인증 콜백 | `src/app/auth/callback/route.ts` |
| 미들웨어 (역할 보호) | `src/middleware.ts` |
| 온보딩 위저드 | `src/app/onboarding/OnboardingFlow.tsx` |
| 부모 대시보드 | `src/app/parent/dashboard/page.tsx` |
| 부모 캘린더 | `src/app/parent/calendar/page.tsx` |
| 자녀 캘린더 | `src/app/child/calendar/page.tsx` |
| 숙제 파싱 로직 | `src/lib/parse-homework.ts` |
| AI 채점 로직 | `src/lib/check-homework.ts` |
| BYOK 멀티 AI 호출 | `src/lib/ai-caller.ts` |
| 이메일 발송 | `src/lib/send-email.ts` |
| Supabase 클라이언트 | `src/lib/supabase/client.ts`, `server.ts` |
| 디자인 토큰 | `src/app/globals.css` |
| 공통 컴포넌트 | `src/components/ui/` |

## AI 파싱 규칙

- 자연어 입력 → `parseHomeworkText()` in `src/lib/parse-homework.ts`
- 이미지 입력 → `parseHomeworkImage()` in `src/lib/parse-homework.ts`
- 과목별 규칙 → `subject_rules` 테이블에서 로드 → 프롬프트 주입
- Prompt caching 적용 (`cache_control: ephemeral`)
- BYOK 라우팅 → `src/lib/ai-caller.ts` (Claude/OpenAI/Gemini 통합)
