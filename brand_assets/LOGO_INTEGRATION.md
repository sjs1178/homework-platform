# kiddoloop — 로고 에셋 & 적용 가이드

Claude Code가 이 프로젝트(`homework-platform`)에 로고/아이콘을 바로 적용할 수 있도록 정리한 패키지입니다.

---

## 📁 파일 구성

```
brand_assets/
├─ svg/                         ← 웹/앱 구현용 마스터 (가장 우선 사용)
│  ├─ symbol.svg                심볼 (초록 고리 + 호박 체크, 투명)
│  ├─ symbol-white.svg          반전용 (흰 고리 + 밝은 호박 체크) — 어두운/컬러 배경
│  ├─ symbol-mono.svg           단색 잉크 — 인쇄·워터마크
│  ├─ appicon.svg               앱 아이콘 (초록 그라데이션 라운드 스퀘어)
│  └─ logo-lockup.svg           가로 조합 (심볼 + "kiddoloop" 워드마크)
├─ png/                         ← 래스터가 필요한 곳 (스토어·파비콘·OG)
│  ├─ symbol-1024/512/256.png   투명 배경 심볼
│  ├─ appicon-1024/512/180/120.png  앱 아이콘
│  └─ favicon-64/32.png         파비콘
└─ vector/                      ← 디자이너·인쇄용
   ├─ kiddoloop-symbol.pdf / .ai
   └─ kiddoloop-appicon.pdf / .ai
```

> **포맷 선택 기준**
> - **코드(웹/RN)에 넣을 때 → `svg/`** 를 쓰세요. 무한 확대·색 교체·작은 용량.
> - **iOS/Android 앱 아이콘, 파비콘, 스토어 등록, OG 이미지 → `png/`** (고정 픽셀이 필요한 곳).
> - **인쇄물·굿즈·외부 디자이너 전달 → `vector/`** (`.ai`는 Illustrator에서 열리는 PDF 호환 포맷, 완전 편집 가능).

---

## 🎯 어떤 걸 어디에 쓰나

| 위치 | 파일 | 비고 |
|---|---|---|
| 앱 헤더·스플래시 로고 | `svg/symbol.svg` 또는 `logo-lockup.svg` | 밝은 배경 |
| 로그인 화면 상단 마크 | `svg/appicon.svg` 또는 `symbol.svg` | 기존 로그인 디자인의 초록 타일 자리 |
| 어두운/초록 배경 위 로고 | `svg/symbol-white.svg` | 흰 고리 버전 |
| iOS 앱 아이콘 | `png/appicon-1024.png` | App Store는 1024 필수, 모서리 자동 마스킹 → `appicon.svg`의 라운드는 참고용 |
| Android 앱 아이콘 | `png/appicon-512.png` (+ adaptive) | foreground로 `symbol.svg`, background 초록 |
| 파비콘 | `png/favicon-32.png`, `favicon-64.png` | |
| 브라우저 탭/PWA | `svg/appicon.svg` | maskable 권장 |

---

## 💻 코드 적용 예시

### React (웹) — 인라인 컴포넌트
SVG를 그대로 컴포넌트화하면 `color`/크기 제어가 쉽습니다.

```jsx
// Logo.jsx — symbol.svg 기반
export function KiddoloopMark({ size = 32, variant = 'full' }) {
  const ring  = variant === 'white' ? '#FFFFFF' : variant === 'mono' ? '#13241B' : '#16A34A';
  const check = variant === 'white' ? '#FBBF24' : variant === 'mono' ? '#13241B' : '#F59E0B';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="kiddoloop">
      <path d="M62.68 22.81 A30 30 0 1 0 77.19 37.32" stroke={ring} strokeWidth="13" strokeLinecap="round"/>
      <path d="M44 50 L53 59 L74 30" stroke={check} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
```

### 정적 파일로 참조
```html
<img src="/brand_assets/svg/logo-lockup.svg" alt="kiddoloop" height="32" />
<link rel="icon" href="/brand_assets/png/favicon-32.png" />
<link rel="apple-touch-icon" href="/brand_assets/png/appicon-180.png" />
```

### React Native
`react-native-svg`로 `symbol.svg`의 두 `<path>`를 그대로 옮기거나, `appicon-1024.png`를 `Image`로 사용하세요.

---

## 🎨 브랜드 토큰 (CSS 변수)

```css
:root{
  --loop:   #16A34A;  /* Loop Green — primary, 고리/CTA */
  --loop-d: #15803D;
  --reward: #F59E0B;  /* Reward Amber — accent, 포인트/보상/체크 */
  --reward-br:#FBBF24;
  --ink:    #13241B;  /* Ink Green — 텍스트, 워드마크 'kiddo' */
  --paper:  #FAF9F5;  /* Cream Paper — 배경 */
}
/* 앱아이콘 그라데이션 */
/* linear-gradient(150deg, #22C55E, #15803D) */
```

폰트: 워드마크/영문 헤드라인 = **Fredoka**(600), 한글 UI/본문 = **Pretendard**.

---

## 🔧 마크 지오메트리 (단일 출처)

모든 포맷이 동일한 두 path에서 나옵니다. 직접 다시 그릴 일이 있으면 이 값을 쓰세요. (viewBox `0 0 100 100`, `stroke-width 13`, 둥근 캡/조인)

- **고리(loop):** `M62.68 22.81 A30 30 0 1 0 77.19 37.32` — 중심 (50,50), 반지름 30, 우상단 40° 열림
- **체크(check):** `M44 50 L53 59 L74 30` — 고리 틈을 통과해 위로 빠져나옴

색 규칙: 고리=Loop Green, 체크=Reward Amber. 반전 시 고리=흰색, 체크=#FBBF24. **체크 방향·비율은 절대 변경 금지** (로고 가이드의 금지 사용 참조).

---

## 📐 사용 규칙 요약 (전체는 `kiddoloop 로고 가이드.html` 참고)

- 클리어스페이스: 심볼 높이의 절반(½) 이상 여백 확보
- 최소 크기: 심볼 24px / 조합 로고 폭 120px 이상
- 금지: 비율 왜곡, 회전, 임의 색상, 그림자·효과, 체크 방향 반전, 복잡한 배경 위 풀컬러

---

## 📝 참고

- 앱 이름 **kiddoloop**, 태그라인 "아이가 스스로 만드는 숙제 루틴"은 현재 제안값입니다.
- `.ai` 파일은 **PDF 호환 구조**로 저장되어 Adobe Illustrator에서 바로 열고 편집할 수 있습니다.
- 앱 아이콘 PDF/AI는 벡터 그라데이션(축 셰이딩)으로 들어가 있어 인쇄·확대에도 깨지지 않습니다.
- 더 필요한 사이즈(예: Android adaptive foreground/background 분리, 마스커블 패딩 버전)가 있으면 추가로 생성해 드릴 수 있어요.
