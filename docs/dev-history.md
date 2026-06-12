# Kiddoloop 개발 히스토리

> 개발 기간: 2026-06-06 ~ 2026-06-11 (6일)
> 개발자: SongJinseok
> AI 페어 프로그래밍: Claude Sonnet 4.6

---

## 2026-06-06 (Day 1) — 프로젝트 부트스트랩

### 목표
MVP 개발을 위한 기반 인프라 구축

### 완료 작업

#### 프로젝트 초기화
- `homework-platform` 리포지토리 생성 및 Next.js 15 App Router 프로젝트 구조 세팅
- TypeScript strict mode 활성화
- GitHub 연결 + Vercel 자동 배포 파이프라인 구성

#### Supabase 연동
- Supabase 프로젝트 생성 (`stlxwsufitsktgpwjunm.supabase.co`)
- Google OAuth 프로바이더 설정
- 초기 DB 스키마 설계 및 마이그레이션 (`001_initial_schema.sql`)
  - `user_profiles`, `pairs`, `homeworks`, `reward_settings`, `reward_logs`, `subject_rules` 테이블
  - 전 테이블 RLS 정책 적용 (pair 멤버십 기반)

#### 기본 인증 플로우
- `/auth/login` — Google 로그인 페이지
- `/auth/callback` — OAuth 코드 교환 + 역할 리디렉션
- `/auth/select-role` — 부모/자녀 역할 선택 (추후 onboarding으로 교체)

#### Supabase SSR 클라이언트 설정
- `src/lib/supabase/server.ts` — Server Component용
- `src/lib/supabase/client.ts` — Client Component용

### 기술 결정
- **BaaS 선택**: Supabase — Auth + DB + RLS를 한 곳에서 관리, 1인 개발에 최적
- **App Router**: Next.js 15 App Router + Server Components로 서버 사이드 데이터 페칭 최소화

---

## 2026-06-08 (Day 2) — 핵심 기능 완성

> 이틀치 작업 집중 완료 (오전~밤)

### 목표
부모-자녀 숙제 관리 핵심 루프 완성

### 완료 작업

#### Next.js 보안 업그레이드
- CVE-2025-66478 취약점으로 Vercel 배포 차단 발생
- Next.js 15.3.4 → 15.3.9 긴급 업그레이드
- TypeScript 빌드 오류 3건 수정

#### 숙제 입력 (부모)
- 자연어 텍스트 입력 → `parseHomeworkText()` Claude API 파싱
- 이미지 업로드 → `parseHomeworkImage()` Claude Vision 파싱
- 파싱 결과 미리보기 + 과목·날짜·시간 편집
- homework-alert 프로젝트의 claude.ts 파싱 로직 이식 + 최적화 (prompt caching)
- `subject_rules` 테이블에서 과목별 규칙 로드 → Claude 프롬프트에 주입

#### 숙제 검사 시스템 (`002_homework_check.sql`)
- `homework_checks` 테이블 추가 (문제별 O/X·정답·해설·점수·총평·AI 총평)
- Claude Vision 자동 채점 API (`/api/check-homework`)
- 점수 도넛 링 시각화 (conic-gradient)
- 부모 검토·수정 인라인 편집 (`/api/correct-homework`)
- 부모 수정 데이터 별도 보존 (`homework_check_corrections` 테이블, `003_family_and_corrections.sql`)
- 리워드 트리거: "완료 시 지급" / "점수 기반 지급" 토글

#### 리워드 시스템
- 숙제 완료 시 `reward_logs` 자동 적립
- 점수 기반 적립 (정답 1개당 n포인트)
- 부모 수동 지급·차감 (`/api/adjust-reward`)
- 리워드 이름·단위 커스텀 설정

#### 캘린더 브라우저 알림
- Notification API 권한 요청
- 숙제 마감 1시간 전 `setTimeout` 알림 등록

#### 패밀리 관리 (`003_family_and_corrections.sql`)
- `pairs.pair_name` 추가 (자녀 별칭)
- 부모: 초대 코드 생성·복사·삭제 (`/api/family`)
- 자녀: 초대 코드 입력 → 페어링 (`/api/pair`)

#### 자녀 프로필 편집 (`004_profile_avatar.sql`)
- `user_profiles.avatar_id` 추가
- 이모지 아바타 선택 UI (`/child/profile`)
- 이름 변경 기능

#### 부모 화면 자녀 아바타 연동
- `005_user_profiles_pair_read.sql` — 부모가 자녀 프로필 읽기 RLS 추가
- 부모 대시보드 히어로 카드에 자녀 이모지 아바타 표시

### 기술 결정
- **RLS 보안**: pair 구성원만 데이터 접근, 어드민 작업은 service role로 RLS 우회
- **리워드 트리거**: 전역 설정 대신 숙제별 컬럼으로 — 숙제마다 다른 지급 방식 필요

---

## 2026-06-09 (Day 3) — 학년 시스템 + 교육과정 메타

### 목표
학년 기반 개인화 기능 및 학습 통계 구축

### 완료 작업

#### 학년 등록·수정·자동 승급 (`006_grade.sql`)
- `user_profiles.grade`, `grade_school_year` 컬럼 추가
- 초등 1~6학년 / 중등 1~3학년 / 고등 1~3학년 선택 UI
- 매년 3월 1일 기준 자동 승급 로직 (`getEffectiveGradeLabel`)
- 학년 설정 위치: 자녀 프로필 → 부모 패밀리 관리로 이동 (부모가 학년 관리)

#### 교육과정 메타 자동 태깅 (`007_curriculum_meta.sql`)
- `homeworks.curriculum_meta jsonb` 컬럼 추가
- 숙제 검사 시 curriculum_meta가 null이면 Claude로 자동 태깅
- 태깅 내용: `{ subject, area, grade, detail }` (교육과정 단원 정보)

#### 학습 통계 페이지 (`/parent/stats`)
- 과목별 완료 현황 시각화
- curriculum_meta 기반 직업군 가이드 연계 안내
- curriculum_meta 없는 경우 subject 폴백 처리

### 기술 결정
- **학년 설정 권한**: 자녀가 아닌 부모가 관리 — 자녀가 임의로 변경하는 문제 방지
- **자동 승급**: grade는 고정값, grade_school_year(입학년도)로 현재 학년 계산 → 별도 스케줄러 불필요

---

## 2026-06-10 (Day 4) — B 디자인 시스템 + 어드민 패널

### 오전 작업 (`cf6bb50`)

#### B 디자인 시스템 전면 적용
- Tailwind CSS 완전 제거 → CSS Variables + Inline Styles 전환
- 디자인 토큰 정의 (`globals.css`)
  - 컬러: `--green`, `--amber`, `--bg`, `--surface`, `--text`, `--muted` 외
  - 그림자: `--sh-sm`, `--sh-md`, `--sh-green`, `--sh-hero-green`, `--sh-hero-gold`
  - 레이디어스: `--r-card`, `--r-btn`
- 폰트: Pretendard Variable (CDN)
- 부모 화면 전체 재디자인 (히어로 카드, 숙제 입력, 검사, 리워드, 설정)

#### 어드민 패널 신설 (`/admin`)
- 별도 쿠키 인증 (`admin_session` httpOnly cookie)
- 회원 관리: 목록 조회, 이름·이메일·역할 검색, 계정 삭제 (cascade)
- 페어링 관리: 전체 페어 목록, 자녀 UUID 변경, 페어 삭제
- 리워드 관리: 페어별 잔액 요약, 내역 조회, 어드민 직접 지급·차감

#### 설정 페이지 고도화 (`/parent/settings`)
- 자녀 관리 섹션: 초대 코드 복사·삭제, 연결 해제, 학년 설정 인라인 패널
- 리워드 이름·단위 설정 섹션
- 계정 섹션: 로그아웃, 이름 표시
- 앱 정보 섹션: 버전, 공지사항, 이용약관, 개인정보처리방침 링크

#### 공개 콘텐츠 페이지 (`010_admin_content.sql`)
- `announcements` + `legal_documents` 테이블 추가
- `/notices`, `/notices/[id]` — 공지사항 (로그인 불필요)
- `/terms` — 현재 이용약관 (버전·수정일 표기)
- `/privacy` — 현재 개인정보처리방침

#### 어드민 콘텐츠 관리 (`/admin/content`)
- 공지사항 CRUD (작성·수정·삭제, 공개/비공개)
- 약관 버전 관리 (신규 버전 등록 시 자동 이전 버전 아카이브)

### 저녁 작업 (`2bd3e58`)

#### kiddoloop 브랜드 로고 시스템
- `src/components/ui/Logo.tsx` 신설
  - `KiddoloopMark` — 심볼 SVG (고리 + 노란 체크)
  - `KiddoloopAppicon` — 그라데이션 앱 아이콘 타일
  - `LogoLockup` — 심볼 + "kiddoloop" 워드마크 (Fredoka 폰트)
- 파비콘 교체: 기존 Next.js 기본 → kiddoloop SVG
- `manifest.json` 업데이트: 앱 이름, 아이콘
- 모든 로그인·헤더 화면에 LogoLockup 적용

### 기술 결정
- **Tailwind 제거**: 디자인 토큰 시스템과 충돌 방지, inline styles로 디자인 코드 일관성
- **어드민 인증 분리**: Supabase Auth와 별개로 httpOnly cookie — 어드민 전용 단순 인증
- **리워드 트리거 리팩터**: 전역 설정 → 숙제별 컬럼 (`009_homework_reward_trigger.sql`)

---

## 2026-06-11 (Day 5) — BYOK + 자녀 UI 개편 + 온보딩 + 다:다 페어링

> 가장 많은 작업량: 3개의 대형 커밋

### 오전 1차 작업 (`28181bc`)

#### BYOK (Bring Your Own Key) AI 토큰 시스템

**배경**: 시스템 Anthropic API 키의 비용 부담 + 사용자 선택권 제공

**설계 원칙**:
- 사용자 API 토큰 → 브라우저 `localStorage`에만 저장, DB 기록 없음
- AI 호출 시 클라이언트에서 토큰 읽기 → HTTPS로 서버 전달 → 1회 사용 후 폐기
- DB 침해 발생해도 사용자 API 키 유출 없음

**구현 내용**:
- `src/lib/ai-token.ts` — localStorage CRUD 유틸리티
- `src/lib/ai-caller.ts` — Claude/OpenAI/Gemini 통합 호출 추상화
  - Claude: `@anthropic-ai/sdk` dynamic import
  - OpenAI/Gemini: 직접 `fetch` (의존성 추가 없음)
- 설정 화면 "AI 설정" 섹션
  - 제공자 탭 (Claude / ChatGPT / Gemini)
  - 토큰 입력 (password 필드, 보기/숨기기)
  - 저장된 토큰 마스킹 표시 (`...last6chars`)

**광고 게이트 (AdGateModal)**:
- 토큰 없는 사용자 → AI 기능 시도 시 게이트 노출
- 5초 카운트다운 광고 (플레이스홀더, 추후 SDK 교체)
- "광고 시청" 또는 "수동 입력" 선택

**수동 입력 모드**:
- 숙제 입력: AI 파싱 없이 과목·내용 직접 추가/삭제
- 숙제 검사: 맞은 개수/전체, 틀린 문제, 부모 코멘트 직접 입력

### 오전 2차 작업 (`e4d480b`)

#### 자녀 화면 B 디자인 전면 적용

**자녀 대시보드 완전 재작성**:
- 히어로 카드: 아바타·이름·학년·리워드 pill·7일 완료 도트
- 도트 디자인: 완료=흰색+체크, 숙제 있음=황금 점, 오늘=점선 원
- 다음 숙제 카드: 가장 가까운 미완료 숙제 + 과목 태그 + 날짜
- 퀵메뉴 2열: 캘린더(초록) / 리워드(황금)

**자녀 캘린더 재디자인**:
- 월 네비게이터 (이전/다음 버튼)
- 날짜 셀: 일요일=빨강, 토요일=파랑, 오늘=초록 아웃라인, 선택=초록 100
- 완료=초록 체크, 미완료=황금 도트
- 범례 표시

**자녀 DayDetail 재디자인**:
- 과목 컬러 태그 (수학=인디고, 국어=빨강, 영어=시안)
- 완료 시 녹색 체크+취소선, 미완료 시 "완료" 버튼
- 채점 결과 보기 링크 (hasCheck 경우)

**부모 UX 수정**:
- `BackButton` 컴포넌트 (`window.history.back()`) — 하드코딩된 링크 대신 히스토리 백
- `BottomNav` `role` prop 추가 — "내정보" 탭: 부모→설정, 자녀→프로필
- 부모 대시보드 `childAvatar` props 연동 수정

### 오전 3차 작업 (`bd68e75`)

#### 역할 뱃지
- `LogoLockup`에 `badge?: "parent" | "child"` prop 추가
- 부모 대시보드: 파란 "부모" pill
- 자녀 대시보드: 초록 "자녀" pill

#### 회원가입 온보딩 플로우

**신규 `/onboarding` 위저드** (기존 `/auth/select-role` 대체):
- Step 1: 역할 선택 + 이름 입력
- Step 2: 생년월일 입력 + 만 나이 자동 계산 + 성인/미성년자 안내
- Step 3: 이용약관 + 개인정보처리방침 체크박스 (전문 하이퍼링크)
- Step 4 (미성년자): 부모 이메일 입력 + 승인 요청 발송
- 완료 화면: 성인=즉시 가입/미성년자=승인 코드 표시

**법령 준수 설계** (대한민국):
- 만 14세 미만: 개인정보보호법 제22조의2 — 법정대리인 동의 의무 → 부모 승인 흐름 충족
- 만 14세~18세: 서비스 정책상 부모 참여 권장 (법적 의무 이상의 보호 수준)
- 만 19세 이상: 본인 직접 동의 (명시적 체크박스)
- `consent_at`(동의 일시), `terms_version`(약관 버전), `parent_consent_data`(법정대리인 동의 내용) DB 영구 보존

**온보딩 API 3종**:
- `/api/onboarding/complete` — 성인 가입 완료 (프로필 생성 + consent_at 기록)
- `/api/onboarding/request-parent` — 미성년자 부모 승인 요청 (pending_approvals 생성)
- `/api/onboarding/approve-child` — 부모 승인 처리 (자녀 프로필 생성 + 자동 페어링)

**인증 흐름 변경**:
- `auth/callback`: profile 없거나 consent_at 없으면 → `/onboarding` 리디렉션
- `middleware`: `/onboarding` 경로 인증 없이 접근 허용

#### 다:다 페어링 + 동의 시스템

**DB 마이그레이션 011**:
- `pairs.status` 컬럼 추가 (`active` / `pending` / `rejected`)
- `user_profiles.birthday`, `consent_at`, `terms_version` 컬럼 추가
- `pending_approvals` 테이블 신설 (미성년자 법정대리인 동의 대기)
- RLS 갱신: `homeworks_pair`, `homeworks_complete` 정책에 `status='active'` 조건 추가
- `pending_approvals` RLS: JWT `email` claim으로 부모 이메일 매칭

**자녀 다중 부모 지원**:
- `/api/pair`: 두 번째 초대 코드 입력 시 기존 pair_id 덮어쓰지 않음
- 자녀 대시보드: `user_profiles.pair_id` 대신 `pairs WHERE child_id=user.id` 전체 조회
- 자녀 캘린더: `pair_id` (단일) → `pairIds` (배열) → `.in("pair_id", pairIds)` 쿼리

**부모 설정 → 가입 승인 대기 섹션**:
- service role로 `pending_approvals WHERE parent_email = user.email` 조회
- 자녀 이름·생년월일·나이 표시
- "승인하기" (법정대리인 약관 동의 확인 포함) / "거절" 버튼

---

## 2026-06-13 (Day 6) — 런칭 준비: UX 완성 + 인프라 셋업

### 목표
서비스 공개를 위한 UX 마무리 및 운영 인프라(도메인, 메일, 앱) 구축

### 완료 작업

#### AdSense 연동 및 ads.txt 설정
- `google-adsense-account` 메타태그 `metadata.other`에 추가
- `<script async>` 태그를 Next.js `<head>` JSX에 직접 삽입 (크롤러 가시성 확보)
  - 기존 `strategy="afterInteractive"` 방식: 봇이 JS 실행 안 해 미탐지
- `public/ads.txt` 생성
- 미들웨어 PUBLIC_PATHS에 `/ads.txt` 추가 (인증 없이 접근 허용)

#### 루트 페이지 스마트 라우팅
- `/` 접속 시 Supabase 세션 확인 후 분기:
  - 로그인 상태 + parent → `/parent/dashboard`
  - 로그인 상태 + child → `/child/dashboard`
  - 미로그인 → `/walkthrough` (이전: `/auth/login`)

#### 어드민 패널 강화
- 회원 목록에 `birthday`, `consent_at`, `terms_version` 컬럼 추가
- 클릭 시 행 확장 → 상세 정보 (id, birthday, terms_version, consent_at, pair_id)
- `/admin/homeworks` 신설 — 전체 숙제 등록 데이터 조회 (subject/description/이름 검색, 완료/대기 필터)
- `/admin/homework-checks` 신설 — 전체 숙제 검사 데이터 조회 (점수 뱃지, 문제별 O/X 확장)
- 어드민 비밀번호 변경: `admin1178`

#### 약관 동의 서버사이드 강제
- `/api/onboarding/complete`, `/api/onboarding/request-parent`
- `termsAgreed`, `privacyAgreed` 미동의 시 400 반환
- 클라이언트(`OnboardingFlow.tsx`)에서 두 필드 API body에 포함

#### 로그인 화면 일러스트 추가
- `brand_assets/login-illustration-1480.png` → `sips`로 860×604로 리사이즈
- `public/login-illustration.png` 저장 (225KB)
- 로그인 페이지에 `next/image`로 삽입
- 미들웨어 매처 정규식에 `.png` 등 정적 파일 확장자 예외 추가 → 이미지 404 해결

#### 사용방법 도움말 페이지 (`/help`)
- 11개 아코디언 섹션: 계정/로그인/페어링/부모대시보드/숙제입력/자녀완료/프로필/숙제검사/AI토큰/리워드/통계
- AI 토큰 섹션: API 키 발급 방법, 보안 안내, 광고 대안 안내
- 부모 설정(`/parent/settings`) + 자녀 프로필(`/child/profile`)에서 진입 링크 추가
- 미들웨어 PUBLIC_PATHS에 `/help` 추가

#### 페이지 헤더 UI 표준화
- `PageHeader` 컴포넌트 신설 (`src/components/ui/PageHeader.tsx`)
  - `useRouter().back()` 기반 뒤로가기 (역할 무관하게 동작)
  - 기존 `href="javascript:history.back()"` 오류 수정
- `MarkdownBody` 컴포넌트 신설 (`src/components/ui/MarkdownBody.tsx`)
  - `react-markdown` v10 + 커스텀 렌더러 (h1~h3, p, ul, ol, li, strong, code, table 등)
  - 이용약관·개인정보처리방침 마크다운 기호 노출 → 렌더링 정상화
- 공지사항, 이용약관, 개인정보처리방침, 도움말 페이지에 `PageHeader` 적용

#### 워크스루 온보딩 슬라이드 (`/walkthrough`)
- 3슬라이드 구성:
  - Slide 1: 계정 만들고 연결 (로그인 + 페어링 화면 CSS 목업)
  - Slide 2: 숙제 등록 + 완료/검사 요청 (부모 입력 + 자녀 완료 화면)
  - Slide 3: 리워드 + 통계 (잔액 카드 + 과목별 바 차트)
- 터치 스와이프(40px 임계값) + 하단 버튼 네비게이션
- 슬라이드 인디케이터 도트 (현재 = 늘어나는 pill)
- `localStorage.wt_seen` 플래그 — 재방문자 자동 skip
- "건너뛰기" 버튼 / 마지막 슬라이드 "시작하기 →" 버튼 → `/auth/login`
- 미들웨어 PUBLIC_PATHS에 `/walkthrough` 추가

#### 문의하기 버튼
- 부모 설정 "앱 정보" 섹션에 `SettingRow icon="mail"` 추가 → `mailto:contact@kiddoloop.com`
- 자녀 프로필 하단에 문의하기 링크 추가

#### 운영 인프라 셋업
- **Zoho Mail** 유료 Lite($1/월) 가입 → `contact@kiddoloop.com` 메일함 생성
  - 가비아 DNS: MX 3개 + SPF TXT + DKIM TXT(1024비트, `zmail._domainkey`) + DMARC 등록
  - 수발신 정상 확인
- **Android Studio** 설치 + Kiddoloop 프로젝트 생성 (`com.kiddoloop.app`, API 24)
- **Firebase** 프로젝트 생성 + Android 앱 등록 + `google-services.json` 추가
  - 향후 FCM 푸시 알림 연동 예정 (별도 세션)

---

## 개발 지표 요약

| 항목 | 수치 |
|------|------|
| 총 개발 기간 | 7일 (2026-06-06 ~ 2026-06-13) |
| Git 커밋 수 | 25개+ |
| 생성된 파일 수 | 85+ |
| DB 마이그레이션 | 11개 |
| API 엔드포인트 | 24개 |
| 페이지/화면 수 | 26개 |
| 운영 도메인 | kiddoloop.com |
| 대표 메일 | contact@kiddoloop.com |

## 기술 부채 및 주의사항

| 항목 | 내용 | 우선순위 |
|------|------|---------|
| Android 앱 FCM 미완성 | Firebase 프로젝트 생성까지 완료, WebView+FCM 코드 미작성 | 높음 |
| 광고 SDK 미연동 | AdGateModal에 `[AD_PLACEHOLDER]` 마커, 현재 5초 카운트다운만 | 중간 |
| 이메일 발송 미구현 | 부모 승인 요청 시 이메일 없음 (인앱 알림으로만 처리) | 높음 |
| 과목별 규칙 UI 없음 | subject_rules 테이블 있으나 어드민 편집 UI 미구현 | 높음 |
| 다중 자녀 부모 대시보드 | 부모에게 자녀 여러 명 있을 경우 선택 UI 없음 | 높음 |
| 리워드 카탈로그 UI 없음 | reward_catalog 테이블 있으나 부모 CRUD UI 없음 | 중간 |
| 만료된 pending_approval 정리 | 7일 만료 후 자동 status 변경 크론 없음 | 낮음 |
