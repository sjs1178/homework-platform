# Backlog

> **최종 업데이트**: 2026-06-13
> 서비스 현황: v0.1 운영 중 (https://kiddoloop.com)

---

## 진행 중

- 문서 업데이트 (기획서·아키텍처·히스토리)

---

## 우선순위 높음 (v0.2 스프린트)

- [ ] **Android WebView 앱 코드 작성**
  - MainActivity WebView 설정 (URL, cookie, JS 허용)
  - 네이티브 Google Sign-In → `window.onNativeGoogleToken` JS Bridge
  - FCM 푸시 알림 수신 + JS 콜백
- [ ] **자녀 완료 시 부모 알림**
  - FCM: 자녀 기기 → 서버 → 부모 기기 푸시
  - 또는 이메일 (Zoho Mail SMTP)
- [ ] **숙제 수정·삭제 UI**
  - 부모가 등록된 숙제 편집·삭제
  - `/parent/homework/[id]/edit` 페이지 또는 인라인 편집
- [ ] **부모 승인 요청 이메일 자동 발송**
  - `pending_approvals` 생성 시 부모 이메일로 알림 발송
  - Zoho Mail SMTP 또는 Resend API 활용
- [ ] **과목별 규칙 설정 UI**
  - 부모가 과목별 AI 파싱 규칙 직접 입력·편집
  - `/parent/settings` 또는 별도 페이지

---

## 우선순위 보통 (v0.3)

- [ ] **리워드 카탈로그 관리 UI**
  - 부모가 교환 가능 리워드 항목 직접 추가·삭제
  - `reward_catalog` 테이블 있음, UI만 없음
- [ ] **다중 자녀 대시보드 전환**
  - 부모 히어로 카드에서 자녀 선택 스위처
  - 현재는 첫 번째 연결 자녀만 표시
- [ ] **숙제 검사 결과 자녀 확인 화면 개선**
  - `/child/results` 페이지 UX 고도화
- [ ] **월간 리포트**
  - 부모: 이번 달 완료율·과목별 분포·리워드 지급 요약
- [ ] **PWA 설치 배너**
  - `manifest.json` 확장 + `beforeinstallprompt` 처리
- [ ] **AdSense 광고 실제 SDK 교체**
  - `AdGateModal` 내 5초 플레이스홀더 → 실제 광고 단위

---

## 우선순위 낮음 (v0.x 이후)

- [ ] **만료된 pending_approval 자동 정리**
  - 7일 만료 후 status=expired 변경 크론 (Vercel Cron 또는 Supabase Edge Function)
- [ ] **과목별 맞춤 피드백**
  - `homework_check_corrections` corpus 활용한 오답 패턴 분석
- [ ] **학원 연동**
  - 외부 학원 숙제 데이터 API 연결
- [ ] **자녀 앱 알림 (PWA/WebPush)**
  - 숙제 마감 전 브라우저 푸시 (현재 `setTimeout` 방식)

---

## 완료

### v0.1 (2026-06-06 ~ 2026-06-13)

#### 인프라 & 인증
- [x] Next.js 15 + Supabase 개발환경 구축
- [x] Google OAuth 로그인 (웹)
- [x] Android 네이티브 Google 로그인 (WebView JS Bridge)
- [x] Supabase SSR 쿠키 인증 (`@supabase/ssr`)
- [x] Supabase 서울 리전 이전 (`muzevgexilkborqisrai`)
- [x] Vercel 서울 리전 (icn1) 배포
- [x] kiddoloop.com 도메인 연결 (가비아 DNS)
- [x] contact@kiddoloop.com 메일함 (Zoho Mail Lite)
- [x] GitHub push → Vercel 자동 배포
- [x] Google AdSense 연동 (ads.txt 등록, 심사 대기)

#### 온보딩
- [x] 워크스루 슬라이드 (`/walkthrough`, 3슬라이드, localStorage skip)
- [x] 온보딩 위저드 (`/onboarding`, 역할→생년월일→약관)
- [x] 성인 즉시 가입 (consent_at 기록)
- [x] 미성년자 부모 승인 흐름 (pending_approvals, 7일 만료)
- [x] 역할 기반 미들웨어 보호 (부모↔자녀 페이지 격리)

#### DB 스키마 (11개 마이그레이션)
- [x] user_profiles, pairs, homeworks, reward_settings, reward_logs, subject_rules
- [x] homework_checks, homework_check_corrections
- [x] reward_catalog, announcements, legal_documents
- [x] pending_approvals, pairs.status, user_profiles.consent_at/birthday
- [x] 전 테이블 RLS 정책 적용

#### 부모 기능
- [x] 자연어/이미지 숙제 입력 → Claude AI 파싱 (BYOK 지원)
- [x] 파싱 결과 미리보기·편집·저장
- [x] AI 숙제 검사 (Claude Vision, 문제별 O/X + 정답 + 해설)
- [x] 수동 검사 모드 (AI 없이 점수·항목·코멘트 직접 입력)
- [x] 채점 결과 부모 수정·확정 (`homework_check_corrections` 보존)
- [x] 부모 캘린더 (`/parent/calendar`, 자녀 숙제 읽기 전용)
- [x] 리워드 수동 지급·차감
- [x] 리워드 이름·단위 커스텀 (pair별)
- [x] 자녀 학년 설정 (매년 3월 자동 승급 로직)
- [x] 다자녀 연결 (초대 코드 다:다)
- [x] 미성년자 가입 승인 (법정대리인 동의 포함)
- [x] 과목별 학습 통계 + 직업군 가이드
- [x] 설정 페이지 (자녀관리·AI설정·리워드·계정·로그아웃)

#### 자녀 기능
- [x] 월간 숙제 캘린더 (다:다 통합 표시)
- [x] 숙제 완료 처리 + 리워드 자동 적립
- [x] 1시간 전 브라우저 알림 (Notification API)
- [x] 이모지 아바타 프로필 편집
- [x] 리워드 잔액·내역·교환 카탈로그
- [x] 채점 결과 확인 (`/child/results`)
- [x] 로그아웃

#### AI & BYOK
- [x] BYOK 시스템 (Claude/OpenAI/Gemini, localStorage 저장)
- [x] 광고 게이트 (AdGateModal, 5초 플레이스홀더)
- [x] 수동 입력 모드 폴백
- [x] 과목별 규칙 DB 로드 → 프롬프트 주입 (subject_rules)
- [x] curriculum_meta 자동 태깅 (검사 시 미태깅 숙제 보완)
- [x] Prompt caching (system prompt에 cache_control: ephemeral)

#### 공통 UX & 어드민
- [x] B 디자인 시스템 (CSS Variables, Inline Styles, Tailwind 제거)
- [x] kiddoloop 로고 시스템 (KiddoloopMark, KiddoloopAppicon, LogoLockup)
- [x] 역할 뱃지 (부모=파랑, 자녀=초록)
- [x] PageHeader 컴포넌트 (backHref + ?from= 파라미터 지원)
- [x] BottomNav (role별 링크 분기, 부모/자녀 캘린더 독립)
- [x] MarkdownBody (react-markdown v10 커스텀 렌더러)
- [x] 도움말 페이지 (`/help`, 11개 아코디언)
- [x] 공지사항 (어드민 발행, 마크다운 렌더링)
- [x] 이용약관·개인정보처리방침 (버전 이력, 뒤로가기 정상화)
- [x] 문의하기 (contact@kiddoloop.com, 부모설정+자녀프로필)
- [x] 로그인 일러스트 (next/image)
- [x] 어드민 패널 (회원/페어링/숙제/검사/리워드/콘텐츠, 쿠키 인증)
