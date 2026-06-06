# Architecture

## 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| Frontend | Next.js 15 (App Router) | 웹 MVP 최적, 추후 React Native 확장 용이 |
| Styling | Tailwind CSS | 빠른 UI 개발 |
| Backend / DB | Supabase (PostgreSQL + RLS) | Google OAuth 내장, 1인 개발 BaaS 최적 |
| AI 파싱 | Anthropic Claude API (claude-sonnet-4-6) | homework-alert 검증된 파싱 로직 이식 |
| Hosting | Vercel | Next.js 최적화, GitHub 연동 자동 배포 |
| CI/CD | GitHub Actions | 어디서나 빌드·테스트 자동화 |

## 시스템 구조

```
[브라우저]
    │
    ├─ Next.js App (Vercel)
    │      ├─ /app/parent/*    부모 페이지
    │      ├─ /app/child/*     자녀 페이지
    │      └─ /app/api/*       Server Actions / Route Handlers
    │              │
    │              ├─ Supabase (DB + Auth + RLS)
    │              └─ Anthropic API (숙제 파싱)
    │
    └─ GitHub Actions (push → lint/test → Vercel 자동 배포)
```

## 주요 설계 원칙

- **RLS 격리**: 부모-자녀 pair_id 기준으로 데이터 접근 제어
- **AI 파싱 분리**: homework-alert의 claude.ts 파싱 로직을 `/lib/parse-homework.ts`로 이식
- **Server Actions 우선**: API Route보다 Server Action으로 DB 직접 접근
- **웹 우선 → 앱 전환 고려**: UI 컴포넌트는 shadcn/ui 기반으로 나중에 React Native 포팅 용이하게

## 폴더 구조 (Next.js)

```
src/
  app/
    (auth)/
      login/page.tsx
      pair/page.tsx
    parent/
      dashboard/page.tsx
      homework/new/page.tsx
      rewards/page.tsx
    child/
      calendar/page.tsx
      today/page.tsx
      rewards/page.tsx
    api/
      parse-homework/route.ts    ← Claude API 호출
  components/
    calendar/
    homework/
    rewards/
  lib/
    supabase/
      client.ts
      server.ts
    parse-homework.ts            ← homework-alert claude.ts 기반 파싱 로직
    types.ts
```
