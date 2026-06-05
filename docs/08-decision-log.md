# Decision Log

## 2026-06-06: 프로젝트 초기 설정

### Decision

1인 개발 환경 구성: Claude Code + Markdown 문서 + Git repo 구조로 시작.

### Reason

1인 개발이므로 문서와 코드가 같은 맥락을 공유하는 구조가 필요. Claude Code가 직접 읽고 참조할 수 있도록 Git repo 안에 Markdown 문서를 두는 방식 채택.

### Alternatives Considered

- Notion 중심 문서화 → Claude Code와 맥락 분리 문제
- 별도 Wiki → 유지 관리 부담

### Follow-up

기술 스택 결정 후 `docs/04-architecture.md` 업데이트.
