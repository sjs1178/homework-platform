# Decision Log

## 2026-06-06: 프로젝트 초기화

### Decision
1인 개발 환경 구성: Claude Code + Markdown 문서 + Git repo 구조로 시작.

### Reason
문서와 코드가 같은 맥락을 공유하도록 Git repo 안에 Markdown 문서 운영.

### Follow-up
기술 스택 결정 후 `docs/04-architecture.md` 업데이트. → 완료

---

## 2026-06-06: 기술 스택 결정

### Decision
- Frontend: Next.js 15 (App Router) + Tailwind CSS
- Backend/DB/Auth: Supabase
- AI: Anthropic Claude API (claude-sonnet-4-6)
- Hosting: Vercel
- CI/CD: GitHub Actions

### Reason
1인 개발 BaaS 최적화. Google OAuth, RLS, Realtime이 Supabase 하나로 해결됨.
AI 파싱은 homework-alert에서 검증된 로직(claude.ts) 이식.
Vercel은 Next.js 최적화 + GitHub push 자동 배포.

### Alternatives Considered
- Firebase: Google 계정과 궁합 좋으나 SQL 없이 복잡한 쿼리 불편
- Django + PostgreSQL: 서버 운영 부담

---

## 2026-06-06: AI 숙제 파싱 방식

### Decision
homework-alert의 claude.ts 파싱 로직을 `/src/lib/parse-homework.ts`로 이식.
자연어 + 이미지(Base64) 입력 → HomeworkItem[] 반환.
과목별 규칙은 subject_rules 테이블에 저장 (rules.json → DB 이전).

### Reason
homework-alert에서 이미 검증된 프롬프트와 파싱 구조. 재작성 불필요.

### Follow-up
이미지 입력 시 Supabase Storage에 업로드 후 Base64 변환 or 직접 전달 방식 결정 필요.
