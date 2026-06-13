# Kiddoloop 개발 아키텍처

> **최종 업데이트**: 2026-06-13

---

## 1. 기술 스택

| 영역 | 기술 | 버전/비고 |
|------|------|-----------|
| Frontend | Next.js App Router | 15.x |
| Styling | CSS Variables + Inline Styles | Tailwind 제거 (Day 4) |
| Database | Supabase (PostgreSQL + RLS) | Seoul 리전 |
| Auth | Supabase Auth + Google OAuth | 웹 + 네이티브 WebView 브리지 |
| AI | Anthropic Claude API | `claude-sonnet-4-6` |
| AI (BYOK) | Claude / OpenAI / Gemini | 사용자 개인 API 토큰 |
| Hosting | Vercel | icn1 (Seoul) 리전 |
| CI/CD | GitHub push → Vercel 자동 배포 | — |
| Language | TypeScript (strict) | — |
| Email | Zoho Mail Lite | contact@kiddoloop.com |
| Domain | kiddoloop.com | 가비아 DNS |
| Mobile | Android WebView (예정) | com.kiddoloop.app |

---

## 2. 시스템 구조

```
[브라우저 / Android WebView]
    │
    ├── Next.js App (Vercel, icn1 Seoul)
    │     ├── /app/auth/*         Google OAuth 로그인·콜백
    │     ├── /app/onboarding/*   역할·생년월일·약관 위저드
    │     ├── /app/walkthrough/*  비로그인 첫 방문 슬라이드
    │     ├── /app/parent/*       부모 전용 페이지
    │     ├── /app/child/*        자녀 전용 페이지
    │     ├── /app/admin/*        어드민 패널 (쿠키 인증)
    │     ├── /app/notices/*      공지사항 (공개)
    │     ├── /app/terms/*        이용약관 (공개)
    │     ├── /app/privacy/*      개인정보처리방침 (공개)
    │     ├── /app/help/*         사용방법 (공개)
    │     └── /app/api/*          Route Handlers
    │                │
    │                ├── Supabase (PostgreSQL + RLS, Seoul)
    │                │     └── 12개 테이블, 역할별 RLS 정책
    │                │
    │                └── Anthropic Claude API (BYOK + 시스템 토큰)
    │
    └── GitHub → Vercel 자동 배포 (push on main)

[Android WebView]
    └── window.onNativeGoogleToken(idToken)
          └── /api/auth/google-native → Supabase signInWithIdToken
```

---

## 3. 인증 아키텍처

### 웹 OAuth 플로우
```
로그인 버튼 클릭
  → supabase.auth.signInWithOAuth({ provider: "google" })
  → Google 동의 화면
  → /auth/callback (code 교환)
  → user_profiles 조회
      ├── 프로필 없거나 consent_at NULL → /onboarding
      └── 프로필 있음 → /{role}/dashboard
```

### 네이티브 WebView 플로우 (Android)
```
Android 네이티브 Google Sign-In
  → idToken 발급
  → WebView.evaluateJavascript("window.onNativeGoogleToken(idToken)")
  → /api/auth/google-native (POST)
  → supabase.auth.signInWithIdToken({ provider: "google", token: idToken })
  → 프로필 확인 → redirectTo 반환
  → router.replace(redirectTo)
```

### 미들웨어 역할 보호 (`src/middleware.ts`)
```
모든 요청 →
  1. 어드민 경로 → admin_session 쿠키 검사
  2. 공개 경로 (notices, terms, privacy, help, walkthrough) → 통과
  3. 미인증 → /auth/login 리다이렉트
  4. /parent/* 또는 /child/* →
       user_profiles 조회 (role + consent_at)
       ├── consent_at 없음 → /onboarding
       ├── child → /parent/* 접근 시 → /child/dashboard
       └── parent → /child/* 접근 시 → /parent/dashboard
```

---

## 4. BYOK AI 토큰 시스템

```
[사용자] API 토큰 입력 → localStorage 저장 (DB 기록 없음)

AI 기능 요청 시:
  클라이언트가 localStorage에서 토큰 읽기
  → HTTPS POST /api/parse-homework (body: { aiToken, aiProvider, ... })
  → 서버: ai-caller.ts에서 해당 provider API 직접 호출
  → 응답 후 토큰 즉시 폐기 (서버 메모리에만 존재)

토큰 없는 경우:
  → AdGateModal 노출 (5초 광고 또는 수동 모드 선택)
```

**보안 원칙:**
- 사용자 토큰 → 브라우저 localStorage에만 존재
- 서버 DB에 기록하지 않음
- 시스템 토큰(환경변수)이 폴백으로 동작하지 않음

---

## 5. 데이터 접근 계층

```
Server Component (page.tsx)
  └── createClient() [src/lib/supabase/server.ts]
        └── Cookie 기반 세션 → RLS 자동 적용

Client Component (*.tsx, "use client")
  └── createClient() [src/lib/supabase/client.ts]
        └── 브라우저 세션 → RLS 자동 적용

API Route (route.ts)
  ├── createClient() → 사용자 세션 (RLS 적용)
  └── createClient(URL, SERVICE_KEY) → 서비스 롤 (RLS 우회, 어드민 전용)
```

---

## 6. 폴더 구조

```
src/
  app/
    page.tsx                    ← 루트: 세션 확인 후 역할별 대시보드/워크스루 분기
    layout.tsx                  ← 전역 레이아웃 (fonts, metadata, AdSense)
    middleware.ts               ← 인증 + 역할 기반 라우트 보호
    walkthrough/
      WalkthroughClient.tsx     ← 3슬라이드 온보딩 (localStorage wt_seen)
    auth/
      login/page.tsx            ← Google 로그인 (+ 네이티브 WebView 훅)
      callback/route.ts         ← OAuth 코드 교환 + 프로필 확인 리다이렉트
      select-role/page.tsx      ← (레거시, 미사용)
    onboarding/
      OnboardingFlow.tsx        ← 역할→생년월일→약관→부모이메일 위저드
    parent/
      dashboard/                ← 히어로·스트릭·검사 대기 목록
      calendar/                 ← 부모 캘린더 (자녀 숙제 읽기 전용, NEW)
        ParentCalendarView.tsx
      homework/
        new/                    ← 숙제 입력 (텍스트/이미지/수동)
        check/                  ← 숙제 검사 (AI/수동)
      rewards/                  ← 리워드 잔액·내역·수동 지급
      stats/                    ← 학습 통계
      settings/                 ← 자녀관리·AI설정·리워드·계정
      family/                   ← 패밀리 관리 (레거시, settings로 통합)
    child/
      dashboard/                ← 히어로·다음숙제·퀵메뉴
      calendar/                 ← 월간 캘린더·완료 처리
        CalendarView.tsx
        DayDetail.tsx           ← 완료 버튼 포함
      rewards/                  ← 리워드 잔액·내역·카탈로그
      profile/                  ← 아바타·이름·로그아웃
      results/                  ← 채점 결과 확인
      stats/                    ← 자녀 학습 통계
    admin/
      login/                    ← 어드민 로그인 (쿠키 발급)
      users/                    ← 회원 목록·삭제
      pairs/                    ← 페어링 관리
      rewards/                  ← 리워드 내역·조정
      homeworks/                ← 전체 숙제 조회
      homework-checks/          ← 전체 검사 조회
      content/                  ← 공지사항 CRUD + 약관 버전 관리
    notices/[id]/               ← 공지사항 (공개)
    terms/                      ← 이용약관 (?from= 지원)
    privacy/                    ← 개인정보처리방침 (?from= 지원)
    help/                       ← 사용방법 (11개 아코디언)
    api/
      auth/google-native/       ← 네이티브 WebView Google 로그인
      parse-homework/           ← 자연어/이미지 파싱
      check-homework/           ← 숙제 채점
      correct-homework/         ← 부모 수정 저장
      complete-homework/        ← 자녀 완료 처리
      adjust-reward/            ← 부모 수동 리워드 조정
      redeem-reward/            ← 자녀 리워드 교환
      stats/                    ← 학습 통계 데이터
      family/                   ← 페어 생성·수정·삭제
      pair/                     ← 자녀 초대 코드 입력
      onboarding/
        complete/               ← 성인 가입 완료
        request-parent/         ← 미성년자 부모 승인 요청
        approve-child/          ← 부모 자녀 승인
      admin/
        login/ logout/ users/ pairs/ rewards/
        content/ announcements/ legal/
        homeworks/ homework-checks/

  components/
    ui/
      Icon.tsx                  ← Lucide-style SVG 아이콘 30+종
      Logo.tsx                  ← KiddoloopMark / KiddoloopAppicon / LogoLockup
      BottomNav.tsx             ← 하단 탭 (role="parent"|"child")
      BackButton.tsx            ← window.history.back() 클라이언트 버튼
      PageHeader.tsx            ← 뒤로가기 + 타이틀 헤더 (backHref 지원)
      MarkdownBody.tsx          ← react-markdown v10 커스텀 렌더러
      AdGateModal.tsx           ← 광고 게이트 (5초 플레이스홀더)
    NotificationSetup.tsx       ← 브라우저 알림 권한 + setTimeout 등록

  lib/
    supabase/
      client.ts                 ← 브라우저용 Supabase 클라이언트
      server.ts                 ← 서버용 Supabase 클라이언트
    parse-homework.ts           ← 자연어/이미지 → 숙제 파싱 (Claude)
    check-homework.ts           ← 숙제 사진 → AI 채점 (Claude Vision)
    ai-caller.ts                ← BYOK 멀티 AI 호출 추상화
    ai-token.ts                 ← localStorage BYOK 토큰 CRUD
    admin-auth.ts               ← 어드민 쿠키 상수
    avatars.ts                  ← 이모지 아바타 목록
    grade.ts                    ← 학년 목록·자동 승급 로직
    curriculum.ts               ← 교육과정 메타 유틸
    careers.ts                  ← 직업군 가이드 데이터
    types.ts                    ← 공통 TypeScript 타입
```

---

## 7. 주요 설계 원칙

| 원칙 | 내용 |
|------|------|
| RLS 격리 | pair_id 기준 데이터 접근 제어, 서버 코드에서 RLS 우회 불가 |
| 역할 격리 | 미들웨어에서 role 기반 라우트 보호 (DB 쿼리로 실시간 검증) |
| BYOK | 사용자 AI 토큰 localStorage만 저장, DB 미보존 |
| 서버 컴포넌트 우선 | 초기 데이터 페칭은 Server Component에서, 인터랙션만 Client Component |
| API Route | Server Action 대신 Route Handler 사용 (BYOK 토큰 전달 필요) |
| 단일 도메인 | Vercel(Seoul) + Supabase(Seoul) 동일 리전 배치 → ~5ms DB 레이턴시 |

---

## 8. 배포 인프라

| 항목 | 내용 |
|------|------|
| 프로덕션 URL | https://kiddoloop.com |
| Vercel 프로젝트 | homework-platform-ten.vercel.app |
| Vercel 리전 | icn1 (Seoul) |
| Supabase 프로젝트 | muzevgexilkborqisrai.supabase.co (Seoul) |
| 도메인 등록 | 가비아 (kiddoloop.com) |
| DNS | 가비아 → Vercel (A/CNAME) + Zoho Mail (MX/SPF/DKIM/DMARC) |
| 이메일 | Zoho Mail Lite (contact@kiddoloop.com) |
| AdSense | 승인 대기 중 (ads.txt 등록 완료) |

---

## 9. 환경변수 목록

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (클라이언트용) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (서버 전용) |
| `ANTHROPIC_API_KEY` | Claude API (시스템 토큰, BYOK 폴백 없음) |

---

## 10. Android 앱 계획 (예정)

```
Android WebView 앱 (com.kiddoloop.app)
  ├── MainActivity: WebView → https://kiddoloop.com
  ├── 네이티브 Google Sign-In
  │     └── AndroidNativeAuth JS Bridge
  │           └── window.onNativeGoogleToken(idToken) 호출
  ├── FCM 푸시 알림
  │     └── 자녀 완료 알림 → 부모 기기 푸시
  └── 딥링크 처리
```

**현재 상태**: Firebase 프로젝트 생성 + `google-services.json` 추가 완료. WebView + FCM 코드 미작성.
