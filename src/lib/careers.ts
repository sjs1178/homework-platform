export interface CareerSubjectRec {
  subject: string;
  importance: "필수" | "중요" | "권장";
}

export interface CareerPath {
  id: string;
  name: string;
  emoji: string;
  shortDesc: string;
  coreSubjects: CareerSubjectRec[];
  elementaryTip: string;
  middleTip: string;
  roadmap: string;
}

export const CAREERS: CareerPath[] = [
  {
    id: "medical",
    name: "의료·보건의료",
    emoji: "🏥",
    shortDesc: "의사·치과·한의·약사·수의사",
    coreSubjects: [
      { subject: "수학", importance: "필수" },
      { subject: "과학", importance: "필수" },
      { subject: "국어", importance: "중요" },
      { subject: "영어", importance: "중요" },
    ],
    elementaryTip: "수학 연산의 정확성과 과학(생명·물질) 흥미 형성, 독서로 긴 지문 독해력 다지기",
    middleTip: "수학을 절대 놓치지 않기(이차방정식·함수까지). 과학은 생명·화학 중심으로 개념 정리",
    roadmap: "초: 수학·과학·독서 → 중: 수학/생명·화학 + 내신 → 고: 미적분+생명/화학 심화 → 의약학 계열",
  },
  {
    id: "nursing",
    name: "간호·보건·재활",
    emoji: "💊",
    shortDesc: "간호사·임상병리사·물리치료사",
    coreSubjects: [
      { subject: "과학", importance: "필수" },
      { subject: "국어", importance: "중요" },
      { subject: "영어", importance: "중요" },
      { subject: "수학", importance: "중요" },
    ],
    elementaryTip: "과학(인체·생명) 흥미와 기본 수학 다지기, 타인을 돕는 봉사·공감 경험",
    middleTip: "생명과학 개념 확실히, 국어·영어 독해력 유지, 봉사활동 등 진로 탐색",
    roadmap: "초: 과학+수학 기초 → 중: 생명과학 + 봉사 → 고: 생명·화학 + 보건계열 진학 → 면허 취득",
  },
  {
    id: "engineering",
    name: "공학·IT·SW",
    emoji: "💻",
    shortDesc: "개발자·AI 엔지니어·반도체",
    coreSubjects: [
      { subject: "수학", importance: "필수" },
      { subject: "정보", importance: "필수" },
      { subject: "과학", importance: "중요" },
      { subject: "영어", importance: "중요" },
    ],
    elementaryTip: "수학 연산·도형 흥미, 블록코딩·로봇 등 컴퓨팅 사고 경험, 만들기·분해 활동",
    middleTip: "수학(함수·기하) 강화, 정보 과목에서 프로그래밍 기초(파이썬 등), 물리·과학 개념 정리",
    roadmap: "초: 수학+코딩 놀이 → 중: 수학·프로그래밍 → 고: 미적분+물리+정보/AI → 공학·SW 진학",
  },
  {
    id: "science",
    name: "자연과학·연구",
    emoji: "🔬",
    shortDesc: "기초과학·생명공학·데이터 과학자",
    coreSubjects: [
      { subject: "수학", importance: "필수" },
      { subject: "과학", importance: "필수" },
      { subject: "영어", importance: "중요" },
      { subject: "국어", importance: "권장" },
    ],
    elementaryTip: "관찰·실험 호기심 키우기, 수학 기초, 과학 도서·다큐 접하기",
    middleTip: "수학·과학 심화 개념 학습, 자유학기 탐구활동·과학 동아리 참여",
    roadmap: "초: 호기심·관찰 → 중: 수학·과학 탐구 → 고: 수학+과학 심화 → 자연과학 진학 → 대학원 연구",
  },
  {
    id: "law",
    name: "법률·행정·공공",
    emoji: "⚖️",
    shortDesc: "변호사·판검사·공무원",
    coreSubjects: [
      { subject: "국어", importance: "필수" },
      { subject: "사회", importance: "필수" },
      { subject: "영어", importance: "중요" },
      { subject: "수학", importance: "권장" },
    ],
    elementaryTip: "독서량 확보(긴 글 이해), 글쓰기·토론 경험, 사회 현상에 관심",
    middleTip: "국어 비문학 독해·논술, 사회(정치·법) 개념, 토론·신문 읽기 습관",
    roadmap: "초: 독서·글쓰기 → 중: 비문학+사회 → 고: 국어·사회 심화 → 법·행정 학부 → 시험 합격",
  },
  {
    id: "business",
    name: "경영·경제·금융",
    emoji: "📈",
    shortDesc: "회계사·세무사·금융·컨설팅",
    coreSubjects: [
      { subject: "수학", importance: "필수" },
      { subject: "사회", importance: "중요" },
      { subject: "국어", importance: "중요" },
      { subject: "영어", importance: "중요" },
    ],
    elementaryTip: "수학 연산·문제해결력, 용돈 관리 등 경제 감각, 독해력",
    middleTip: "수학(함수·통계) 강화, 사회(경제) 개념, 영어 독해력",
    roadmap: "초: 수학+경제감각 → 중: 수학·통계 → 고: 미적분/확통+경제 → 상경계열 → 전문자격",
  },
  {
    id: "education",
    name: "교육·인문사회",
    emoji: "📚",
    shortDesc: "교사·교수·연구자·작가",
    coreSubjects: [
      { subject: "국어", importance: "필수" },
      { subject: "영어", importance: "필수" },
      { subject: "사회", importance: "중요" },
      { subject: "수학", importance: "중요" },
    ],
    elementaryTip: "폭넓은 독서, 글쓰기·발표 경험, 가르치고 설명하는 활동",
    middleTip: "국어·영어·사회 균형 학습, 관심 교과 심화, 멘토링·발표 경험",
    roadmap: "초: 독서·표현 → 중: 균형 학습+관심교과 → 고: 전공교과 심화 → 사범·인문계열 → 임용·대학원",
  },
  {
    id: "arts",
    name: "예술·디자인·콘텐츠",
    emoji: "🎨",
    shortDesc: "디자이너·영상작가·뮤지션",
    coreSubjects: [
      { subject: "미술", importance: "필수" },
      { subject: "음악", importance: "필수" },
      { subject: "국어", importance: "중요" },
      { subject: "정보", importance: "중요" },
    ],
    elementaryTip: "예술 표현 경험 풍부히, 다양한 매체 접하기, 표현·관찰력 키우기",
    middleTip: "관심 분야 실기 집중(미술·음악·영상), 포트폴리오 기초, 국어·인문 소양",
    roadmap: "초: 표현 경험 → 중: 실기 집중+포트폴리오 → 고: 실기 심화+디지털 툴 → 예술·콘텐츠 진학",
  },
];

export function getCareer(id: string): CareerPath | undefined {
  return CAREERS.find((c) => c.id === id);
}
