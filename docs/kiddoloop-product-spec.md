# Kiddoloop 서비스 기획서

> **최종 업데이트**: 2026-06-13
> **서비스 URL**: https://kiddoloop.com (도메인 연결 예정) / https://homework-platform-ten.vercel.app
> **대표 메일**: contact@kiddoloop.com
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
4. **패밀리 연결** — 초대 코드로 다:다 연결, 공동 양육 지원
5. **법령 준수 온보딩** — 미성년자 법정대리인 동의 흐름 내재화

---

## 2. 타겟 사용자

| 구분 | 대상 | 주요 니즈 |
|------|------|-----------|
| 부모 | 초등~중등 자녀를 둔 학부모 | 숙제를 빠르게 등록하고 자녀 학습 상태를 확인하고 싶다 |
| 자녀 | 초등~중등 학생 | 오늘 할 일을 한눈에 보고, 완료하면 보상받고 싶다 |
| 공동 양육자 | 이혼·별거 부모, 조부모 등 | 동일 자녀를 여러 보호자가 함께 관리하고 싶다 |

---

## 3. 사용자 플로우

### 3-1. 온보딩 (신규 가입)

```
Google 로그인
  → 프로필 미존재 감지 → /onboarding 리디렉션
  │
  ├── Step 1: 역할 선택 (부모 / 자녀) + 이름 입력
  ├── Step 2: 생년월일 입력 → 성인/미성년자 자동 판별
  │
  ├── [성인 경로 — 만 19세 이상]
  │     ├── 이용약관 + 개인정보처리방침 동의 (전문 링크 포함)
  │     └── 가입 완료 → 역할별 대시보드
  │
  └── [미성년자 경로 — 만 19세 미만]
        ├── 약관 내용 확인 (법정대리인 동의 안내 표시)
        ├── 부모님 구글 계정 이메일 입력
        ├── pending_approvals 레코드 생성 → 승인 코드 발급
        └── 대기 화면 표시 (승인 코드 + 만료일)
              ↓
        [부모님 로그인 후 설정 → "가입 승인 대기" 섹션]
              ├── 자녀 이름·생년월일 확인
              ├── 법정대리인 약관 동의 선택
              └── 승인 → 자녀 프로필 생성 + 자동 페어링
```

**법령 준수 근거:**
- 만 14세 미만: 개인정보보호법 제22조의2 — 법정대리인 동의 필수 → 부모 승인 흐름 충족
- 만 14세~18세: 자기 동의 가능하나 서비스 정책상 부모 참여 권장
- 만 19세 이상: 본인 직접 동의 (이용약관 + 개인정보처리방침 명시적 체크박스)
- 동의 일시(`consent_at`) + 약관 버전(`terms_version`) + 법정대리인 동의 내용(`parent_consent_data`) DB 영구 보존

### 3-2. 부모 플로우

```
대시보드 (헤더: kiddoloop [부모] 뱃지)
  ├── [히어로 카드] 자녀 아바타·이름·학년·스트릭·주간 완료 도트·리워드 잔액
  ├── 검사 기다리는 숙제 목록
  ├── 빠른 메뉴: 숙제 입력 / 리워드 관리
  │
  ├── 숙제 입력
  │     ├── AI 게이트: 보유 토큰 있으면 직접 호출 → 없으면 광고 시청 또는 수동 입력
  │     ├── 자연어 텍스트 입력 → Claude/ChatGPT/Gemini 파싱
  │     ├── 사진 촬영/업로드 → Vision 파싱
  │     ├── 파싱 결과 미리보기 + 편집
  │     ├── 리워드 트리거 설정 (완료 시 지급 / 점수 기반 지급)
  │     └── 리워드 금액 입력 → 저장
  │
  ├── 숙제 검사
  │     ├── AI 모드: 자녀 사진 업로드 → Vision 자동 채점
  │     ├── 수동 모드: 점수·틀린 문제·코멘트 직접 입력
  │     ├── 문제별 O/X + 정답 + 해설 확인 및 수정
  │     └── 검사 완료 → 학습 데이터 누적 + 리워드 자동 지급
  │
  ├── 리워드 관리
  │     ├── 자녀 리워드 잔액·내역 조회
  │     └── 수동 지급·차감
  │
  └── 설정
        ├── [가입 승인 대기] — 미성년 자녀 승인 요청 목록 (해당 시)
        ├── 자녀 관리 (연결·해제·학년 설정·초대 코드 생성)
        ├── 리워드 이름·단위 설정
        ├── AI 설정 (개인 API 토큰 입력 — 기기 로컬 저장)
        ├── 로그아웃
        └── 공지사항 / 이용약관 / 개인정보처리방침
```

### 3-3. 자녀 플로우

```
대시보드 (헤더: kiddoloop [자녀] 뱃지)
  ├── 히어로 카드: 아바타·이름·학년·리워드 pill·7일 완료 도트
  ├── 다음 숙제 카드 (가장 가까운 미완료 숙제)
  ├── 퀵메뉴: 캘린더 / 리워드
  │
  ├── 숙제 캘린더
  │     ├── 월간 뷰: 날짜별 완료 현황 표시
  │     ├── 날짜 클릭 → 일간 숙제 목록
  │     └── 완료 버튼 → 리워드 자동 적립
  │
  ├── 내 리워드
  │     ├── 잔액 히어로 카드 + 프로그레스 바
  │     ├── 리워드 교환 카탈로그
  │     └── 적립·사용 내역
  │
  └── 내 정보
        └── 프로필 편집 (이름·아바타)
```

---

## 4. 기능 상세

### 4-1. 인증 및 온보딩

| 기능 | 상태 | 설명 |
|------|------|------|
| Google OAuth 로그인 | ✅ | Supabase Auth + Google Provider |
| 온보딩 위저드 | ✅ | 역할→생년월일→약관 단계별 흐름 |
| 성인 자가 가입 | ✅ | 약관 체크박스 동의 후 즉시 완료 |
| 미성년자 부모 승인 흐름 | ✅ | 부모 이메일 입력→pending_approval→부모 설정 화면 승인 |
| 부모 동시 가입 + 자동 페어링 | ✅ | 승인 시 자녀 프로필 생성 + 페어 자동 연결 |
| 동의 기록 보존 | ✅ | consent_at, terms_version, parent_consent_data DB 저장 |

### 4-2. 다:다 페어링 시스템

| 기능 | 상태 | 설명 |
|------|------|------|
| 다중 자녀 연결 | ✅ | 부모 1명이 여러 자녀 초대 코드 생성 |
| 다중 부모 연결 | ✅ | 자녀가 여러 초대 코드 입력 → 다수 부모 연결 |
| 동의 기반 페어링 | ✅ | 초대 코드 발급 = 발급자 동의, 코드 입력 = 입력자 동의 |
| 페어 상태 관리 | ✅ | pairs.status (active / pending / rejected) |
| 연결 해제 | ✅ | 부모가 설정에서 연결 해제 가능 |
| 승인 대기 화면 | ✅ | 미성년자 대기 화면에 승인 코드·만료일 표시 |

### 4-3. 역할 뱃지

| 기능 | 상태 | 설명 |
|------|------|------|
| 부모 화면 "부모" 뱃지 | ✅ | 헤더 LogoLockup 우측에 파란 pill |
| 자녀 화면 "자녀" 뱃지 | ✅ | 헤더 LogoLockup 우측에 초록 pill |

### 4-4. 숙제 입력 (부모)

| 기능 | 상태 | 설명 |
|------|------|------|
| 자연어 텍스트 입력 | ✅ | Claude API `parseHomeworkText()` |
| 이미지 입력 | ✅ | Claude Vision `parseHomeworkImage()` |
| AI 파싱 결과 미리보기 | ✅ | 과목/내용/날짜/시간 확인 후 저장 |
| 과목별 규칙 주입 | ✅ | subject_rules → Claude 프롬프트 주입 |
| 리워드 트리거 설정 | ✅ | 숙제별 "완료 시 지급" / "점수 기반 지급" |
| 리워드 금액 입력 | ✅ | 숙제별 지급량 직접 입력 |
| 수동 입력 모드 | ✅ | AI 없이 항목 직접 추가·삭제 |

### 4-5. BYOK AI 토큰 시스템

| 기능 | 상태 | 설명 |
|------|------|------|
| Claude (Anthropic) 토큰 | ✅ | `sk-ant-api03-...` 형식 |
| ChatGPT (OpenAI) 토큰 | ✅ | `sk-proj-...` 형식 |
| Gemini (Google) 토큰 | ✅ | `AIzaSy...` 형식 |
| 기기 로컬 저장 | ✅ | localStorage만 사용, DB 저장 없음 |
| HTTPS 1회성 전달 | ✅ | API 호출 시 전달 후 즉시 폐기 |
| 광고 게이트 | ✅ | 토큰 없을 시 5초 광고 또는 수동 모드 |
| 수동 검사 모드 | ✅ | 점수·틀린 항목·코멘트 직접 입력 |

**보안 설계 원칙:**
- 사용자 토큰은 브라우저 localStorage에만 존재
- 서버 DB에 기록하지 않음
- AI 호출 시 HTTPS로 전달 → 서버 메모리에서 1회 사용 후 폐기
- 시스템 토큰(환경변수)이 폴백으로 동작하지 않음 (사용자 토큰 없으면 광고 게이트)

### 4-6. 숙제 캘린더 (자녀)

| 기능 | 상태 | 설명 |
|------|------|------|
| 월간 캘린더 뷰 | ✅ | 날짜별 완료 현황 도트 |
| 월 이동 | ✅ | 클라이언트 상태로 이전/다음 월 전환 |
| 일간 상세 뷰 | ✅ | 날짜 클릭 시 숙제 목록 |
| 완료 처리 | ✅ | is_completed 업데이트 + reward_logs 적립 |
| 1시간 전 브라우저 알림 | ✅ | Notification API + setTimeout |
| 다:다 숙제 통합 표시 | ✅ | 연결된 모든 부모의 숙제를 합산 표시 |

### 4-7. 리워드 시스템

| 기능 | 상태 | 설명 |
|------|------|------|
| 리워드 이름·단위 커스텀 | ✅ | pair별 설정 |
| 완료 기반 자동 적립 | ✅ | 숙제 완료 시 reward_logs earn |
| 점수 기반 자동 적립 | ✅ | 정답 1개당 reward_amount 적립 |
| 부모 수동 지급·차감 | ✅ | 금액 + 사유 입력, 직접 조정 |
| 자녀 리워드 잔액 확인 | ✅ | 히어로 카드 + 적립·사용 내역 |
| 리워드 교환 카탈로그 | ✅ | pair별 교환 목록 (reward_catalog 테이블) |

### 4-8. AI 숙제 검사

| 기능 | 상태 | 설명 |
|------|------|------|
| 자녀 제출 사진 업로드 | ✅ | 부모가 사진 업로드 (선택사항) |
| Claude Vision 자동 채점 | ✅ | 문제별 O/X + 정답 + 해설 + 점수 |
| AI 총평 생성 | ✅ | sparkles 카드에 총평 표시 |
| 수동 검사 모드 | ✅ | 맞은 개수/전체, 틀린 항목, 부모 코멘트 직접 입력 |
| 부모 검토·수정 | ✅ | 인라인 편집 (O/X 토글 + 정답·해설 수정) |
| 점수 도넛 링 | ✅ | conic-gradient로 정답률 시각화 |
| 학습 데이터 누적 | ✅ | AI 원본 + 부모 수정값 모두 보존 |
| curriculum_meta 자동 태깅 | ✅ | 검사 시 미태깅 숙제 자동 보완 |

### 4-9. 학습 통계

| 기능 | 상태 | 설명 |
|------|------|------|
| 과목별 완료 현황 | ✅ | curriculum_meta 없어도 subject 폴백 처리 |
| 직업군 가이드 | ✅ | 교육과정 메타 기반 직업군 연계 안내 |

### 4-10. 부모 대시보드

| 기능 | 상태 | 설명 |
|------|------|------|
| 히어로 카드 | ✅ | 자녀 아바타·이름·학년·리워드 잔액 pill |
| 연속 완료 스트릭 | ✅ | 연속으로 숙제 완료한 날 수 |
| 주간 완료 도트 | ✅ | 월~일 7개 도트, 완료일 체크 표시 |
| 검사 대기 숙제 목록 | ✅ | 완료됐지만 검사 안 된 숙제 |
| 자녀 이모지 아바타 연동 | ✅ | 자녀가 설정한 아바타 부모 화면에 반영 |

### 4-11. 자녀 대시보드

| 기능 | 상태 | 설명 |
|------|------|------|
| 히어로 카드 | ✅ | 아바타·이름·학년·리워드 pill·7일 완료 도트 |
| 다음 숙제 카드 | ✅ | 가장 가까운 미완료 숙제 1개 |
| 퀵메뉴 2열 | ✅ | 캘린더(초록) / 리워드(황금) |
| 페어링 전 화면 | ✅ | 초대 코드 입력 컴포넌트 |

### 4-12. 설정 페이지 (부모)

| 기능 | 상태 | 설명 |
|------|------|------|
| 가입 승인 대기 섹션 | ✅ | 미성년 자녀의 승인 요청 목록 표시 |
| 자녀 가입 승인 | ✅ | 약관 동의 확인 후 승인 → 자녀 프로필 + 자동 페어링 |
| 자녀 가입 거절 | ✅ | 거절 시 pending_approvals.status = rejected |
| 자녀 관리 | ✅ | 초대 코드 복사·삭제, 연결 해제, 학년 설정 |
| 학년 자동 승급 | ✅ | 매년 3월 1일 기준 grade_school_year 로직 |
| 리워드 이름·단위 설정 | ✅ | 설정 페이지 내 별도 섹션 |
| AI 설정 | ✅ | 개인 토큰 입력·저장(기기)·삭제 |
| 로그아웃 | ✅ | Supabase signOut → 로그인 페이지 |
| 법적 정보 링크 | ✅ | 공지사항 / 이용약관 / 개인정보처리방침 |

### 4-13. 어드민 패널 (`/admin`)

| 기능 | 상태 | 설명 |
|------|------|------|
| 어드민 로그인 | ✅ | ID: admin / PW: 1178 또는 sjs1178@gmail.com 자동 |
| 회원 관리 | ✅ | 전체 회원 목록, 이름·이메일·역할·가입일 검색·조회 |
| 회원 삭제 | ✅ | 연결된 숙제·리워드 cascade 삭제 후 auth 계정 삭제 |
| 페어링 관리 | ✅ | 전체 페어 목록, 자녀 UUID 변경, 페어 삭제 |
| 리워드 관리 | ✅ | 페어별 잔액 요약, 내역 조회, 어드민 직접 지급·차감 |
| 공지사항 CRUD | ✅ | 작성·수정·삭제, 공개/비공개 토글 |
| 이용약관 버전 관리 | ✅ | 신규 버전 게시 시 이전 버전 is_current=false, 이력 보존 |
| 개인정보처리방침 버전 관리 | ✅ | 동일 방식 |

### 4-14. 공개 콘텐츠 (로그인 불필요)

| URL | 설명 |
|-----|------|
| `/notices` | 공지사항 목록 (최신순) |
| `/notices/[id]` | 공지사항 상세 |
| `/terms` | 현재 이용약관 (버전·수정일 표기) |
| `/privacy` | 현재 개인정보처리방침 (버전·수정일 표기) |

---

## 5. 디자인 시스템 (B 디자인)

### 브랜드

- **서비스명**: kiddoloop (소문자 고정)
- **폰트**: Pretendard Variable (본문) + Fredoka (로고 워드마크)
- **로고 컴포넌트** (`src/components/ui/Logo.tsx`)
  - `KiddoloopMark` — 심볼 SVG (고리 + 체크)
  - `KiddoloopAppicon` — 그라데이션 라운드스퀘어 아이콘
  - `LogoLockup` — 심볼 + 워드마크 + 선택적 역할 뱃지(`badge="parent" | "child"`)

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
| `--sh-hero-green` | 부모/자녀 히어로 카드 |
| `--sh-hero-gold` | 리워드 히어로 카드 |

### 공통 컴포넌트

| 컴포넌트 | 경로 | 설명 |
|----------|------|------|
| `Icon` | `ui/Icon.tsx` | Lucide-style SVG 아이콘 30+ 종 |
| `LogoLockup` | `ui/Logo.tsx` | 로고 + 역할 뱃지 |
| `BottomNav` | `ui/BottomNav.tsx` | 하단 탭 (role="parent"\|"child") |
| `BackButton` | `ui/BackButton.tsx` | `window.history.back()` 클라이언트 버튼 |
| `AdGateModal` | `ui/AdGateModal.tsx` | 광고 게이트 (5초 카운트다운 플레이스홀더) |

---

## 6. 기술 스택

| 영역 | 기술 | 버전/비고 |
|------|------|-----------|
| Frontend | Next.js App Router | 15.x |
| Styling | CSS Variables + Inline Styles | Tailwind 제거 |
| Database | Supabase (PostgreSQL + RLS) | — |
| Auth | Supabase Auth + Google OAuth | — |
| AI | Anthropic Claude API | `claude-sonnet-4-6` |
| AI (BYOK) | Claude / OpenAI / Gemini | 사용자 개인 토큰 |
| Hosting | Vercel | — |
| CI/CD | GitHub push → Vercel 자동 배포 | — |
| Language | TypeScript (strict) | — |

---

## 7. 데이터베이스 구조

### 테이블 목록

| 테이블 | 역할 |
|--------|------|
| `user_profiles` | 사용자 역할·이름·아바타·pair_id·학년·생년월일·약관동의 |
| `pairs` | 부모-자녀 페어 (초대코드·status·pair_name) |
| `pending_approvals` | 미성년자 부모 동의 대기 (법령 준수) |
| `homeworks` | 등록된 숙제 (과목·내용·날짜·완료·리워드·트리거·교육과정 메타) |
| `reward_settings` | pair별 리워드 명칭·단위 |
| `reward_logs` | 리워드 적립·사용 내역 |
| `reward_catalog` | pair별 교환 가능 리워드 목록 |
| `subject_rules` | 과목별 AI 파싱 규칙 |
| `homework_checks` | AI 채점 결과 (문제별 O/X·정답·해설·점수·총평) |
| `homework_check_corrections` | 부모 검토·수정 데이터 (학습 corpus) |
| `announcements` | 공지사항 |
| `legal_documents` | 이용약관·개인정보처리방침 버전 이력 |

### user_profiles 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `birthday` | date | 생년월일 (성인/미성년자 판별) |
| `consent_at` | timestamptz | 약관 동의 일시 (법적 증적) |
| `terms_version` | text | 동의한 약관 버전 (`v1.0`) |

### pairs 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `status` | text | `active` \| `pending` \| `rejected` |
| `pair_name` | text | 자녀 별칭 |

### pending_approvals 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `child_auth_id` | uuid | 자녀 auth.users id |
| `child_name` | text | 자녀 이름 |
| `child_birthday` | date | 자녀 생년월일 |
| `parent_email` | text | 부모 구글 이메일 |
| `approval_code` | text | 8자리 승인 코드 |
| `status` | text | `pending` \| `approved` \| `rejected` \| `expired` |
| `parent_consent_data` | jsonb | 부모 동의 기록 (법적 증적) |
| `expires_at` | timestamptz | 7일 후 만료 |

### DB 마이그레이션 이력

| 파일 | 내용 |
|------|------|
| `001_initial_schema.sql` | 기본 스키마 + RLS |
| `002_homework_check.sql` | homework_checks + reward_trigger |
| `003_family_and_corrections.sql` | homework_check_corrections + pair_name |
| `004_profile_avatar.sql` | user_profiles.avatar_id |
| `005_user_profiles_pair_read.sql` | pair 구성원 간 프로필 읽기 RLS |
| `006_grade.sql` | user_profiles.grade + grade_school_year |
| `007_curriculum_meta.sql` | homeworks.curriculum_meta jsonb |
| `008_reward_catalog.sql` | reward_catalog 테이블 |
| `009_homework_reward_trigger.sql` | homeworks.reward_trigger 컬럼 |
| `010_admin_content.sql` | announcements + legal_documents |
| `011_onboarding_many_to_many.sql` | pairs.status + user_profiles.birthday/consent_at + pending_approvals + RLS 갱신 |

### RLS 정책 요약

| 테이블 | 정책 |
|--------|------|
| user_profiles | 본인만 쓰기; 같은 pair 상대방은 읽기 허용 |
| pairs | parent_id 또는 child_id가 본인인 경우 |
| pending_approvals | 자녀=자신 레코드 읽기; 부모=자신 이메일 레코드 읽기 (JWT claim) |
| homeworks | 같은 pair(active) 구성원 읽기; 부모만 쓰기 |
| reward_logs | 같은 pair 구성원 모두 |
| reward_settings | 같은 pair 구성원 모두 |
| reward_catalog | 같은 pair 구성원 모두 |
| homework_checks | 같은 pair 구성원 모두 |
| homework_check_corrections | 부모만 쓰기 |
| announcements | 공개 글 전체 읽기 |
| legal_documents | 전체 읽기 |

---

## 8. AI 기능 상세

### 숙제 파싱

- **입력**: 자연어 텍스트 또는 숙제 사진
- **모델**: `claude-sonnet-4-6` (시스템 토큰) 또는 사용자 지정 모델
- **출력**: `{ subject, description, due_date, due_time, end_time }[]`
- **최적화**: System prompt에 `cache_control: ephemeral` (과목 규칙 캐싱)
- **BYOK 라우팅** (`src/lib/ai-caller.ts`): Claude → Anthropic SDK, OpenAI/Gemini → direct fetch

### 숙제 채점 (Vision)

- **입력**: 자녀 숙제 사진 (base64, 선택)
- **출력**: 문제별 `{ isCorrect, correctAnswer, explanation }` + 전체 점수 + 총평
- **수동 모드**: 사진 없이 점수·틀린 항목·코멘트 직접 입력 → 동일 CheckResult 형식으로 저장

### 교육과정 메타 자동 태깅

- **입력**: 숙제 subject + description + 학년
- **출력**: `{ subject, area, grade, detail }` → `homeworks.curriculum_meta`
- **트리거**: 숙제 검사 시 curriculum_meta가 null이면 자동 보완

---

## 9. 화면 목록

### 공통

| URL | 대상 | 설명 |
|-----|------|------|
| `/auth/login` | 공통 | Google 로그인 |
| `/onboarding` | 신규 | 역할·생년월일·약관 동의 위저드 |
| `/notices` | 공개 | 공지사항 목록 |
| `/notices/[id]` | 공개 | 공지사항 상세 |
| `/terms` | 공개 | 이용약관 (현재 버전) |
| `/privacy` | 공개 | 개인정보처리방침 (현재 버전) |

### 부모

| URL | 설명 |
|-----|------|
| `/parent/dashboard` | 히어로 카드·스트릭·주간 도트·검사 대기 목록 |
| `/parent/homework/new` | 숙제 입력 (텍스트/이미지 + 리워드 + AI 게이트) |
| `/parent/homework/check` | 숙제 검사 (AI 모드 / 수동 모드) |
| `/parent/rewards` | 리워드 잔액·내역 + 수동 지급·차감 |
| `/parent/stats` | 학습 통계 + 직업군 가이드 |
| `/parent/settings` | 가입 승인 대기·자녀 관리·AI 설정·리워드·계정 |

### 자녀

| URL | 설명 |
|-----|------|
| `/child/dashboard` | 히어로 카드·다음 숙제·퀵메뉴 |
| `/child/calendar` | 월간 숙제 캘린더 (다:다 통합) |
| `/child/rewards` | 리워드 히어로·내역·교환 카탈로그 |
| `/child/profile` | 프로필 편집 (이름·아바타) |

### 어드민

| URL | 설명 |
|-----|------|
| `/admin/login` | 어드민 로그인 |
| `/admin/users` | 회원 목록 + 삭제 |
| `/admin/pairs` | 페어링 현황 + 자녀 변경 |
| `/admin/rewards` | 페어별 리워드 내역 + 조정 |
| `/admin/content` | 공지사항 CRUD + 약관 버전 관리 |

---

## 10. API 엔드포인트

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/parse-homework` | POST | 자연어/이미지 → 숙제 파싱 (aiToken/aiProvider 지원) |
| `/api/check-homework` | POST | 숙제 사진 → AI 채점 / 수동 결과(manualResult) 처리 |
| `/api/correct-homework` | POST | 부모 수정 저장 |
| `/api/complete-homework` | POST | 자녀 완료 처리 + 리워드 적립 |
| `/api/adjust-reward` | POST | 부모 수동 리워드 조정 |
| `/api/redeem-reward` | POST | 자녀 리워드 교환 |
| `/api/stats` | GET | 학습 통계 데이터 |
| `/api/family` | POST | 페어 생성·수정·삭제·학년 설정 |
| `/api/pair` | POST | 자녀 초대 코드 입력 → 다:다 페어링 |
| `/api/onboarding/complete` | POST | 온보딩 완료 (프로필 생성 + 동의 기록) |
| `/api/onboarding/request-parent` | POST | 미성년자 부모 승인 요청 생성 |
| `/api/onboarding/approve-child` | POST | 부모가 자녀 승인 → 프로필 생성 + 자동 페어링 |
| `/api/admin/login` | POST | 어드민 로그인 → cookie 발급 |
| `/api/admin/users` | GET/DELETE | 회원 목록 / 삭제 |
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
| 최근 배포 | 2026-06-11 |

---

## 12. 향후 개발 백로그

### 높은 우선순위

| 기능 | 설명 |
|------|------|
| kiddoloop.com 도메인 연결 | Vercel 도메인 설정 + 가비아 DNS |
| 부모 완료 알림 | 자녀 완료 처리 시 푸시/이메일 알림 |
| 과목별 규칙 설정 UI | subject_rules 테이블 CRUD UI |
| 리워드 카탈로그 관리 UI | 부모가 교환 항목 직접 추가·삭제 |
| 다중 자녀 대시보드 전환 | 부모가 자녀 선택해 각 자녀 현황 확인 |

### 중간 우선순위

| 기능 | 설명 |
|------|------|
| 숙제 수정·삭제 | 등록된 숙제 편집 기능 |
| 자녀 결과 확인 화면 | 숙제 검사 결과 자녀가 확인 |
| 월간 리포트 | 완료율·리워드 통계 |
| PWA / 홈 화면 추가 | 모바일 앱처럼 설치 가능 |
| 이메일 알림 | 부모 승인 요청 시 이메일 발송 |

### 낮은 우선순위 (MVP 이후)

| 기능 | 설명 |
|------|------|
| React Native 앱 | 웹 검증 후 모바일 앱 전환 |
| 학습 데이터 활용 | corrections corpus로 과목별 맞춤 피드백 |
| 학원 연동 | 외부 학원 숙제 데이터 연결 |

---

## 13. 주요 의사결정 기록

| 날짜 | 결정 | 이유 |
|------|------|------|
| 초기 | 이미지 업로드 대신 이모지 아바타 | 저장 비용 없음, 구현 단순, 아이들에게 친숙 |
| 초기 | BaaS(Supabase) 선택 | 1인 개발, Auth+DB+RLS 통합, 빠른 MVP |
| 초기 | homework-alert claude.ts 파싱 로직 이식 | 검증된 로직 재사용, 개발 시간 단축 |
| 2026-06-08 | Next.js 15.x 강제 업그레이드 | CVE-2025-66478 보안 취약점 (Vercel 배포 차단) |
| 2026-06-08 | user_profiles pair 읽기 RLS 추가 | 부모가 자녀 이름·아바타를 읽지 못하는 버그 수정 |
| 2026-06-10 | Tailwind → CSS Variables + Inline Styles | B 디자인 토큰 시스템 일관성 확보 |
| 2026-06-10 | 리워드 트리거를 전역 설정 → 숙제별 컬럼으로 | 숙제마다 다른 지급 방식 필요 |
| 2026-06-10 | 리워드·패밀리 설정 → 설정 페이지로 통합 | 부모 대시보드 단순화 |
| 2026-06-10 | 어드민 인증: admin/1178 | 별도 관리자 계정 운영 불필요, 단순 운영 |
| 2026-06-11 | BYOK: 사용자 토큰 로컬에만 저장 | DB 침해 시 토큰 유출 차단, 서버 무상태 유지 |
| 2026-06-11 | 광고 게이트 도입 (토큰 없는 경우) | 운영 AI 비용 분담; 수동 모드로 완전 무료 경로도 제공 |
| 2026-06-11 | 미성년자 부모 승인 → 페어 자동 생성 | 한 번의 승인으로 가입 + 연결을 동시 처리, UX 단순화 |
| 2026-06-11 | pairs.status 컬럼 추가 | 동의 상태 명시적 관리, 향후 pending 연결 UI 확장 기반 |
| 2026-06-13 | AdSense 스크립트를 raw `<script>` 태그로 삽입 | `strategy="afterInteractive"` 방식은 봇이 JS 미실행으로 크롤러 미탐지 |
| 2026-06-13 | 미들웨어 매처에 정적 파일 확장자 예외 추가 | 이미지 등 정적 자원이 인증 리다이렉트에 걸리는 버그 수정 |
| 2026-06-13 | 워크스루 → localStorage wt_seen으로 재방문자 skip | 이미 앱을 아는 사용자에게 매번 워크스루 강제 노출 방지 |
| 2026-06-13 | Zoho Mail Lite $1/월 선택 | 무료 플랜 신규 가입 불가, 최소 비용으로 정식 메일함 확보 |
| 2026-06-13 | Android 앱: WebView 래퍼 방식 선택 | 웹 배포만으로 앱 업데이트 가능, FCM은 JS Bridge로 연결 |

---

## 14. 현재 구현 완성도 (v0.1 기준, 2026-06-13)

### 완료된 기능 체크리스트

#### 인증 & 온보딩
- [x] Google OAuth 로그인
- [x] 역할 선택 (부모/자녀) + 이름/생년월일 입력
- [x] 이용약관·개인정보처리방침 동의 (서버사이드 강제)
- [x] 미성년자 법정대리인 승인 흐름
- [x] consent_at·terms_version DB 기록
- [x] 세션 기반 자동 리다이렉트 (루트 → 역할별 대시보드)
- [x] 워크스루 온보딩 슬라이드 (비로그인 첫 방문자)

#### 부모 기능
- [x] 자연어 숙제 입력 → Claude AI 파싱
- [x] 이미지 숙제 입력 → Claude Vision 파싱
- [x] 파싱 결과 미리보기·편집
- [x] 숙제 검사 (Claude Vision 자동 채점)
- [x] 채점 결과 부모 수정·확정
- [x] 리워드 수동 지급·차감
- [x] 리워드 이름·단위 커스텀
- [x] 자녀 학년 설정
- [x] 다자녀 연결 (초대 코드)
- [x] 미성년자 가입 승인
- [x] 과목별 통계 조회

#### 자녀 기능
- [x] 월간 캘린더 (날짜별 숙제 현황)
- [x] 숙제 완료 처리
- [x] 이모지 아바타 프로필
- [x] 리워드 잔액·내역 확인

#### 공통 UX
- [x] 도움말 페이지 (11개 섹션)
- [x] 공지사항 (어드민 발행)
- [x] 이용약관·개인정보처리방침 (마크다운 렌더링)
- [x] 문의하기 (contact@kiddoloop.com)
- [x] 로그인 일러스트
- [x] BYOK AI 토큰 (Claude/OpenAI/Gemini)
- [x] 광고 게이트 (토큰 없는 경우)
- [x] 수동 입력 모드 (AI 없이 직접 입력)

#### 인프라
- [x] Vercel 자동 배포 (GitHub push)
- [x] Supabase RLS 전 테이블 적용
- [x] AdSense 연동 (승인 대기 중)
- [x] contact@kiddoloop.com 메일함 (Zoho Mail)
- [x] 어드민 패널 (회원/페어링/숙제/검사/리워드/콘텐츠)

### 미완성 / 예정 기능

| 기능 | 상태 | 예정 |
|------|------|------|
| Android WebView 앱 + FCM | 프로젝트 생성 완료, 코드 미작성 | 다음 스프린트 |
| 부모 승인 요청 이메일 발송 | 미구현 (인앱 코드만) | 다음 스프린트 |
| 숙제 수정·삭제 UI | 미구현 | 다음 스프린트 |
| 과목별 규칙 어드민 편집 UI | 미구현 | 다음 스프린트 |
| kiddoloop.com 도메인 연결 | DNS 설정 진행 중 | 이번 주 |
| AdSense 승인 | 심사 대기 중 | 미정 |
| 2026-06-11 | /auth/select-role → /onboarding 위저드로 교체 | 단순 역할 선택 → 법령 준수 온보딩 흐름으로 고도화 |
