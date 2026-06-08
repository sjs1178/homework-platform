export interface CurriculumEntry {
  schoolLevel: string;
  gradeRange: string;
  subject: string;
  area: string;
  learningUnit: string;
}

export interface CurriculumMeta {
  subject: string;
  area: string;
  learningUnit: string;
}

// 2022 개정 교육과정 전체 데이터 (Excel 원본)
export const CURRICULUM: CurriculumEntry[] = [
  { schoolLevel: "초등학교", gradeRange: "초1", subject: "국어", area: "문자/기초", learningUnit: "한글 자음·모음, 받침, 낱자와 소리, 바른 글씨 쓰기" },
  { schoolLevel: "초등학교", gradeRange: "초1", subject: "국어", area: "읽기/듣기말하기", learningUnit: "그림책·짧은 글 읽기, 바르게 듣고 말하기, 자기소개" },
  { schoolLevel: "초등학교", gradeRange: "초2", subject: "국어", area: "낱말과 문장", learningUnit: "낱말 익히기, 문장 부호, 짧은 글짓기, 받아쓰기" },
  { schoolLevel: "초등학교", gradeRange: "초2", subject: "국어", area: "문학/표현", learningUnit: "동시·이야기 감상, 인물의 마음 알기, 겪은 일 쓰기" },
  { schoolLevel: "초등학교", gradeRange: "초3", subject: "국어", area: "읽기", learningUnit: "문단의 짜임, 중심 문장, 글의 종류 구분" },
  { schoolLevel: "초등학교", gradeRange: "초3", subject: "국어", area: "문법/어휘", learningUnit: "낱말의 뜻, 국어사전 활용, 높임 표현" },
  { schoolLevel: "초등학교", gradeRange: "초4", subject: "국어", area: "읽기/쓰기", learningUnit: "글의 흐름 파악, 사실과 의견 구분, 회의·제안하는 글" },
  { schoolLevel: "초등학교", gradeRange: "초4", subject: "국어", area: "문학", learningUnit: "시·이야기의 감각적 표현, 이어질 내용 상상하기" },
  { schoolLevel: "초등학교", gradeRange: "초5", subject: "국어", area: "읽기/듣기말하기", learningUnit: "글의 구조와 요약, 토의·토론 기초, 매체 자료 읽기" },
  { schoolLevel: "초등학교", gradeRange: "초5", subject: "국어", area: "쓰기/문법", learningUnit: "주장과 근거 쓰기, 낱말의 관계, 호응 관계" },
  { schoolLevel: "초등학교", gradeRange: "초6", subject: "국어", area: "읽기/매체", learningUnit: "비유 표현, 추론하며 읽기, 뉴스·광고 등 매체 비판" },
  { schoolLevel: "초등학교", gradeRange: "초6", subject: "국어", area: "쓰기/문법", learningUnit: "논설문 쓰기, 관용 표현, 글 고쳐쓰기" },
  { schoolLevel: "중학교", gradeRange: "중1", subject: "국어", area: "문학", learningUnit: "시·소설·수필·극의 갈래 이해, 비유와 상징" },
  { schoolLevel: "중학교", gradeRange: "중1", subject: "국어", area: "문법", learningUnit: "음운의 체계와 변동, 품사, 어휘의 체계" },
  { schoolLevel: "중학교", gradeRange: "중1", subject: "국어", area: "읽기/쓰기", learningUnit: "설명하는 글·주장하는 글, 통일성·응집성, 매체 자료 활용" },
  { schoolLevel: "중학교", gradeRange: "중2", subject: "국어", area: "문학", learningUnit: "갈등의 진행과 해결, 작품 속 사회·문화적 맥락" },
  { schoolLevel: "중학교", gradeRange: "중2", subject: "국어", area: "문법", learningUnit: "단어의 짜임, 문장 성분과 구조, 어휘의 양상" },
  { schoolLevel: "중학교", gradeRange: "중2", subject: "국어", area: "듣기말하기/쓰기", learningUnit: "토의·토론, 면담, 보고하는 글, 설득 전략" },
  { schoolLevel: "중학교", gradeRange: "중3", subject: "국어", area: "문학", learningUnit: "문학의 심미적 체험, 작가의 개성, 한국 문학의 전통" },
  { schoolLevel: "중학교", gradeRange: "중3", subject: "국어", area: "문법", learningUnit: "문장의 짜임, 담화, 한글 창제 원리, 통일 시대 국어" },
  { schoolLevel: "중학교", gradeRange: "중3", subject: "국어", area: "읽기/쓰기", learningUnit: "논증 방법, 비판적 읽기, 건의·성찰하는 글" },
  { schoolLevel: "고등학교", gradeRange: "고1", subject: "국어", area: "공통국어1", learningUnit: "화법·작문·독서·문학·문법·매체 통합 기초, 갈래별 작품 읽기" },
  { schoolLevel: "고등학교", gradeRange: "고1", subject: "국어", area: "공통국어2", learningUnit: "사실/추론/비판/창의적 읽기, 논증과 설득, 매체 비평" },
  { schoolLevel: "고등학교", gradeRange: "고2-3", subject: "국어", area: "화법과 언어", learningUnit: "담화 관습, 언어 예절, 발표·협상·면접, 국어 규범" },
  { schoolLevel: "고등학교", gradeRange: "고2-3", subject: "국어", area: "독서와 작문", learningUnit: "주제 통합 독서, 정보 전달·설득·정서 표현 글쓰기" },
  { schoolLevel: "고등학교", gradeRange: "고2-3", subject: "국어", area: "문학", learningUnit: "갈래별 작품 감상·비평, 한국 문학사, 문학과 사회" },
  { schoolLevel: "초등학교", gradeRange: "초1", subject: "수학", area: "수와 연산", learningUnit: "9까지의 수→100까지의 수, 한 자리 덧셈·뺄셈" },
  { schoolLevel: "초등학교", gradeRange: "초1", subject: "수학", area: "도형/측정", learningUnit: "여러 가지 모양, 시계 보기(몇 시), 비교하기" },
  { schoolLevel: "초등학교", gradeRange: "초2", subject: "수학", area: "수와 연산", learningUnit: "세 자리 수, 두 자리 덧셈·뺄셈, 곱셈구구(구구단)" },
  { schoolLevel: "초등학교", gradeRange: "초2", subject: "수학", area: "측정/규칙", learningUnit: "길이 재기(cm,m), 시각과 시간, 규칙 찾기, 표와 그래프" },
  { schoolLevel: "초등학교", gradeRange: "초3", subject: "수학", area: "수와 연산", learningUnit: "나눗셈, (세 자리)×(한 자리) 곱셈, 분수와 소수 도입" },
  { schoolLevel: "초등학교", gradeRange: "초3", subject: "수학", area: "도형/측정", learningUnit: "평면도형, 길이·시간·들이·무게, 원, 막대그래프" },
  { schoolLevel: "초등학교", gradeRange: "초4", subject: "수학", area: "수와 연산", learningUnit: "큰 수, 곱셈·나눗셈 확장, 분수의 덧셈·뺄셈, 소수 연산" },
  { schoolLevel: "초등학교", gradeRange: "초4", subject: "수학", area: "도형/자료", learningUnit: "각도, 삼각형·사각형, 평면도형 이동, 꺾은선그래프" },
  { schoolLevel: "초등학교", gradeRange: "초5", subject: "수학", area: "수와 연산", learningUnit: "약수와 배수, 약분·통분, 분수·소수의 곱셈" },
  { schoolLevel: "초등학교", gradeRange: "초5", subject: "수학", area: "측정/규칙성", learningUnit: "다각형의 둘레와 넓이, 대응 관계, 평균과 가능성" },
  { schoolLevel: "초등학교", gradeRange: "초6", subject: "수학", area: "수와 연산", learningUnit: "분수·소수의 나눗셈, 비와 비율, 비례식과 비례배분" },
  { schoolLevel: "초등학교", gradeRange: "초6", subject: "수학", area: "도형/자료", learningUnit: "각기둥·각뿔, 원의 넓이, 원기둥·원뿔·구, 비율그래프, 정비례·반비례" },
  { schoolLevel: "중학교", gradeRange: "중1", subject: "수학", area: "수와 연산/문자와 식", learningUnit: "소인수분해, 정수와 유리수, 문자의 사용, 일차방정식" },
  { schoolLevel: "중학교", gradeRange: "중1", subject: "수학", area: "좌표평면/함수", learningUnit: "순서쌍과 좌표, 정비례·반비례 그래프" },
  { schoolLevel: "중학교", gradeRange: "중1", subject: "수학", area: "기하/통계", learningUnit: "기본 도형, 작도와 합동, 평면·입체도형, 자료의 정리(도수분포)" },
  { schoolLevel: "중학교", gradeRange: "중2", subject: "수학", area: "수와 식", learningUnit: "유리수와 순환소수, 식의 계산, 일차부등식, 연립일차방정식" },
  { schoolLevel: "중학교", gradeRange: "중2", subject: "수학", area: "함수", learningUnit: "일차함수와 그래프, 일차함수와 일차방정식의 관계" },
  { schoolLevel: "중학교", gradeRange: "중2", subject: "수학", area: "기하/확률", learningUnit: "삼각형·사각형의 성질, 도형의 닮음, 경우의 수와 확률" },
  { schoolLevel: "중학교", gradeRange: "중3", subject: "수학", area: "수와 식", learningUnit: "제곱근과 실수, 다항식의 곱셈·인수분해" },
  { schoolLevel: "중학교", gradeRange: "중3", subject: "수학", area: "방정식/함수", learningUnit: "이차방정식, 이차함수와 그래프" },
  { schoolLevel: "중학교", gradeRange: "중3", subject: "수학", area: "기하/통계", learningUnit: "삼각비, 원의 성질, 대푯값과 산포도" },
  { schoolLevel: "고등학교", gradeRange: "고1", subject: "수학", area: "공통수학1", learningUnit: "다항식, 방정식과 부등식, 경우의 수(순열·조합), 행렬" },
  { schoolLevel: "고등학교", gradeRange: "고1", subject: "수학", area: "공통수학2", learningUnit: "도형의 방정식, 집합과 명제, 함수와 그래프" },
  { schoolLevel: "고등학교", gradeRange: "고2-3", subject: "수학", area: "대수", learningUnit: "지수·로그(함수), 삼각함수, 수열" },
  { schoolLevel: "고등학교", gradeRange: "고2-3", subject: "수학", area: "미적분Ⅰ", learningUnit: "함수의 극한과 연속, 미분, 적분(다항함수)" },
  { schoolLevel: "고등학교", gradeRange: "고2-3", subject: "수학", area: "확률과 통계", learningUnit: "순열·조합, 확률, 확률분포, 통계적 추정" },
  { schoolLevel: "초등학교", gradeRange: "초3", subject: "영어", area: "듣기/말하기", learningUnit: "알파벳·파닉스, 인사·자기소개, 쉬운 낱말 듣고 말하기" },
  { schoolLevel: "초등학교", gradeRange: "초4", subject: "영어", area: "듣기/말하기/읽기", learningUnit: "일상 표현, 숫자·색·날씨, 쉬운 단어 읽기" },
  { schoolLevel: "초등학교", gradeRange: "초5", subject: "영어", area: "읽기/쓰기", learningUnit: "문장 단위 읽기·쓰기, 기초 대화, 의사 표현" },
  { schoolLevel: "초등학교", gradeRange: "초6", subject: "영어", area: "통합", learningUnit: "짧은 글 이해, 자기 생각 말하기·쓰기, 기초 의사소통" },
  { schoolLevel: "중학교", gradeRange: "중1", subject: "영어", area: "문법/의사소통", learningUnit: "be동사·일반동사, 시제, 의문문, 기초 어휘·듣기·말하기" },
  { schoolLevel: "중학교", gradeRange: "중2", subject: "영어", area: "문법/독해", learningUnit: "조동사, 비교급·최상급, to부정사·동명사, 문단 독해" },
  { schoolLevel: "중학교", gradeRange: "중3", subject: "영어", area: "문법/작문", learningUnit: "관계대명사, 수동태, 분사, 가정법 기초, 문단 쓰기" },
  { schoolLevel: "고등학교", gradeRange: "고1", subject: "영어", area: "공통영어1·2", learningUnit: "듣기·읽기·말하기·쓰기 통합, 문법 심화, 글의 구조 파악" },
  { schoolLevel: "고등학교", gradeRange: "고2-3", subject: "영어", area: "영어Ⅰ·Ⅱ", learningUnit: "학술·실용 지문 독해, 논리적 글쓰기, 발표·토론" },
  { schoolLevel: "초등학교", gradeRange: "초1-2", subject: "사회/도덕", area: "통합교과", learningUnit: "학교·가족·이웃·우리나라·계절, 규칙과 예절" },
  { schoolLevel: "초등학교", gradeRange: "초3", subject: "사회", area: "지역/생활", learningUnit: "우리 고장의 모습, 고장의 옛이야기, 교통·통신의 변화" },
  { schoolLevel: "초등학교", gradeRange: "초4", subject: "사회", area: "지역/사회", learningUnit: "지역의 위치와 특성, 촌락과 도시, 공공기관과 주민 참여" },
  { schoolLevel: "초등학교", gradeRange: "초5", subject: "사회", area: "국토/역사", learningUnit: "국토의 지리, 인권과 헌법, 한국사(선사~조선)" },
  { schoolLevel: "초등학교", gradeRange: "초6", subject: "사회", area: "정치/경제/세계", learningUnit: "민주주의와 선거, 경제(가계·기업), 세계 여러 나라, 근현대사" },
  { schoolLevel: "초등학교", gradeRange: "초3-6", subject: "도덕", area: "가치·태도", learningUnit: "자신·타인·사회·자연과의 관계, 정직·배려·책임·생명존중" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "사회", area: "지리 영역", learningUnit: "자연환경과 인간생활, 인구·도시·자원, 지역화와 세계화" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "사회", area: "일반사회 영역", learningUnit: "인권과 헌법, 정치과정, 경제생활, 사회문제와 변동" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "역사", area: "세계사+한국사", learningUnit: "문명의 형성~현대, 한국사 통사(고대~현대)" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "도덕", area: "윤리", learningUnit: "도덕적 자아, 타인·공동체·자연과의 관계, 윤리적 성찰" },
  { schoolLevel: "고등학교", gradeRange: "고1", subject: "통합사회", area: "공통", learningUnit: "인간·사회·환경의 통합적 이해, 정의·인권·시장·세계화·미래" },
  { schoolLevel: "고등학교", gradeRange: "고1", subject: "한국사", area: "공통", learningUnit: "전근대 한국사, 근현대 한국사(개항~현대)" },
  { schoolLevel: "초등학교", gradeRange: "초3", subject: "과학", area: "물질/생명/지구", learningUnit: "물질의 성질, 동물·식물의 한살이, 지표의 변화, 자석" },
  { schoolLevel: "초등학교", gradeRange: "초4", subject: "과학", area: "운동/물질/지구", learningUnit: "물체의 무게, 물질의 상태, 그림자·거울, 화산과 지진, 식물의 생활" },
  { schoolLevel: "초등학교", gradeRange: "초5", subject: "과학", area: "에너지/생명/지구", learningUnit: "온도와 열, 태양계와 별, 용해와 용액, 다양한 생물" },
  { schoolLevel: "초등학교", gradeRange: "초6", subject: "과학", area: "화학/물리/지구", learningUnit: "산과 염기, 빛과 렌즈, 전기, 연소와 소화, 계절의 변화, 생태계" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "과학", area: "역학·전자기·파동", learningUnit: "힘과 운동, 일과 에너지, 전기와 자기, 빛·파동" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "과학", area: "물질·반응", learningUnit: "물질의 구성, 상태 변화, 화학 반응, 산·염기" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "과학", area: "생명현상", learningUnit: "생물의 구성, 소화·순환·호흡·배설, 생식과 유전" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "과학", area: "지구·우주", learningUnit: "지권·수권·기권의 변화, 날씨, 천체와 우주" },
  { schoolLevel: "고등학교", gradeRange: "고1", subject: "과학", area: "통합과학1·2", learningUnit: "물질과 규칙성, 시스템과 상호작용, 변화와 다양성, 환경과 에너지" },
  { schoolLevel: "초등학교", gradeRange: "초3-6", subject: "음악", area: "표현/감상/생활화", learningUnit: "바른 자세 노래·연주, 리듬·가락, 음악 감상, 생활 속 음악" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "음악", area: "가창·기악·창작·감상", learningUnit: "가창·기악 표현, 간단한 창작, 음악사와 문화" },
  { schoolLevel: "초등학교", gradeRange: "초3-6", subject: "미술", area: "체험/표현/감상", learningUnit: "조형 요소·원리, 다양한 표현 재료, 작품 감상" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "미술", area: "표현·감상·미술문화", learningUnit: "드로잉·디자인·입체, 미술사, 시각 문화 이해" },
  { schoolLevel: "초등학교", gradeRange: "초1-6", subject: "체육", area: "기본운동/도전/경쟁/표현/건강", learningUnit: "기본 움직임, 게임·도전 활동, 표현 활동, 건강·안전" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "체육", area: "건강·도전·경쟁·표현·안전", learningUnit: "체력 관리, 스포츠 활동, 표현 활동, 안전 교육" },
  { schoolLevel: "초등학교", gradeRange: "초5-6", subject: "실과", area: "가정·기술·정보", learningUnit: "생활 안전, 가정생활(식·의·주), 기술 시스템, 소프트웨어 기초" },
  { schoolLevel: "중학교", gradeRange: "중1-3", subject: "정보", area: "컴퓨팅", learningUnit: "정보문화, 자료와 정보, 문제해결과 프로그래밍, 컴퓨팅 시스템" },
];

// grade 값(1-12) → grade 레이블
const GRADE_LABEL_MAP: Record<number, string> = {
  1: "초1", 2: "초2", 3: "초3", 4: "초4", 5: "초5", 6: "초6",
  7: "중1", 8: "중2", 9: "중3",
  10: "고1", 11: "고2", 12: "고3",
};

// grade 레이블 → 정렬 번호
const GRADE_ORDER: Record<string, number> = {
  "초1": 1, "초2": 2, "초3": 3, "초4": 4, "초5": 5, "초6": 6,
  "중1": 7, "중2": 8, "중3": 9,
  "고1": 10, "고2": 11, "고3": 12,
};

function gradeInRange(gradeLabel: string, rangeStr: string): boolean {
  const gradeNum = GRADE_ORDER[gradeLabel];
  if (!gradeNum) return false;
  if (GRADE_ORDER[rangeStr] !== undefined) return GRADE_ORDER[rangeStr] === gradeNum;

  // "초1-2", "중1-3", "초3-6", "고2-3", "초1-6" 형태
  const m = rangeStr.match(/^(초|중|고)(\d+)[~\-](초|중|고)?(\d+)$/);
  if (m) {
    const sp = m[1], ss = parseInt(m[2]);
    const ep = m[3] || m[1], es = parseInt(m[4]);
    const startNum = GRADE_ORDER[`${sp}${ss}`] ?? 0;
    const endNum = GRADE_ORDER[`${ep}${es}`] ?? 12;
    return gradeNum >= startNum && gradeNum <= endNum;
  }
  return false;
}

// 과목 유사 매칭
function subjectMatches(hwSubject: string, currSubject: string): boolean {
  const hw = hwSubject.toLowerCase().trim();
  const curr = currSubject.toLowerCase();

  if (curr.includes(hw) || hw.includes(curr)) return true;

  const MAP: Record<string, string[]> = {
    "수학": ["수학"],
    "국어": ["국어"],
    "영어": ["영어"],
    "과학": ["과학", "통합과학", "물리", "화학", "생명과학", "지구과학"],
    "사회": ["사회", "통합사회", "도덕", "역사", "한국사"],
    "도덕": ["도덕", "사회/도덕"],
    "역사": ["역사", "한국사"],
    "음악": ["음악"],
    "미술": ["미술"],
    "체육": ["체육"],
    "정보": ["정보", "실과", "기술"],
    "실과": ["실과", "기술·가정", "정보"],
  };
  for (const [key, vals] of Object.entries(MAP)) {
    if (hw.includes(key)) return vals.some((v) => curr.includes(v));
  }
  return false;
}

// 설명 키워드로 최적 영역 찾기
function bestArea(description: string, candidates: CurriculumEntry[]): CurriculumEntry {
  const desc = description;
  let best = candidates[0];
  let bestScore = -1;
  for (const entry of candidates) {
    const keywords = entry.learningUnit.split(/[·,、\s·]+/).filter((k) => k.length > 1);
    const score = keywords.filter((k) => desc.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  return best;
}

// 메인 태깅 함수 — 숙제 저장 시 호출
export function tagCurriculum(
  subject: string,
  description: string,
  gradeValue: number | null
): CurriculumMeta | null {
  if (!gradeValue) return null;
  const gradeLabel = GRADE_LABEL_MAP[gradeValue];
  if (!gradeLabel) return null;

  const candidates = CURRICULUM.filter(
    (e) => subjectMatches(subject, e.subject) && gradeInRange(gradeLabel, e.gradeRange)
  );
  if (!candidates.length) return null;

  const entry = bestArea(description, candidates);
  return { subject: entry.subject, area: entry.area, learningUnit: entry.learningUnit };
}

// 통계 페이지용: 과목 목록
export const CORE_SUBJECTS = ["국어", "수학", "영어", "과학", "사회"];
