"use client";

import { useState } from "react";

interface Section {
  id: string;
  icon: string;
  title: string;
  content: React.ReactNode;
}

function Accordion({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 1px 6px rgba(0,0,0,.06)",
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 22, flexShrink: 0 }}>{section.icon}</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
          {section.title}
        </span>
        <span style={{ fontSize: 13, color: "var(--faint)", transition: "transform .2s", transform: open ? "rotate(90deg)" : "none" }}>
          ▶
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: "0 18px 20px 18px",
            borderTop: "1px solid var(--line)",
            fontSize: 14,
            color: "var(--text)",
            lineHeight: 1.75,
          }}
        >
          {section.content}
        </div>
      )}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 10, padding: "10px 14px", borderRadius: 10,
      background: "#F0FDF4", border: "1px solid #BBF7D0",
      fontSize: 13, color: "#166534", fontWeight: 600, lineHeight: 1.65,
    }}>
      💡 {children}
    </div>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%", background: "var(--green)",
        color: "#fff", fontWeight: 800, fontSize: 12,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
      }}>
        {num}
      </div>
      <div style={{ flex: 1, fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function Label({ color = "green", children }: { color?: "green" | "blue" | "orange" | "red"; children: React.ReactNode }) {
  const map = {
    green: ["#DCFCE7", "#15803D"],
    blue:  ["#DBEAFE", "#1D4ED8"],
    orange:["#FEF3C7", "#92400E"],
    red:   ["#FEE2E2", "#B91C1C"],
  } as const;
  const [bg, fg] = map[color];
  return (
    <span style={{ fontSize: 11.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: bg, color: fg, marginRight: 6 }}>
      {children}
    </span>
  );
}

const SECTIONS: Section[] = [
  {
    id: "accounts",
    icon: "👤",
    title: "부모 계정과 자녀 계정의 차이",
    content: (
      <div style={{ paddingTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ padding: "14px", borderRadius: 12, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1D4ED8", marginBottom: 8 }}>👨‍👩‍👧 부모 계정</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#1e40af", lineHeight: 1.8 }}>
              <li>숙제 등록 · 수정 · 삭제</li>
              <li>자녀 완료 현황 확인</li>
              <li>AI 또는 직접 숙제 검사</li>
              <li>리워드 설정 및 지급</li>
              <li>과목별 통계 열람</li>
            </ul>
          </div>
          <div style={{ padding: "14px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#15803D", marginBottom: 8 }}>🧒 자녀 계정</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#166534", lineHeight: 1.8 }}>
              <li>오늘의 숙제 확인</li>
              <li>완료 처리 · 사진 제출</li>
              <li>리워드 내역 조회</li>
              <li>내 통계 · 성취 확인</li>
              <li>프로필 설정</li>
            </ul>
          </div>
        </div>
        <Tip>한 Google 계정으로 하나의 역할만 선택할 수 있으며, 가입 후 역할 변경은 불가합니다.</Tip>
      </div>
    ),
  },
  {
    id: "login",
    icon: "🔑",
    title: "로그인 방법",
    content: (
      <div style={{ paddingTop: 14 }}>
        <Step num={1}>kiddoloop.com에 접속합니다.</Step>
        <Step num={2}><b>Google로 시작하기</b> 버튼을 탭해 Google 계정으로 로그인합니다.</Step>
        <Step num={3}>
          처음 가입이라면 온보딩 화면이 나타납니다.
          <br />① 역할(부모/자녀) 선택 → ② 이름 입력 → ③ 생년월일 입력 → ④ 약관 동의 → 가입 완료
        </Step>
        <Step num={4}>이후 접속 시에는 자동으로 대시보드로 이동합니다.</Step>
        <Tip>만 19세 미만 자녀가 가입할 경우, 부모님 이메일을 입력하면 부모 계정에서 승인 요청이 도착합니다.</Tip>
      </div>
    ),
  },
  {
    id: "pairing",
    icon: "🔗",
    title: "부모–자녀 연결 및 해제 방법",
    content: (
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>연결하기</div>
        <Step num={1}>부모 계정으로 로그인 후 <b>설정 &gt; 자녀 관리</b>에서 초대 코드를 확인합니다.</Step>
        <Step num={2}>자녀에게 초대 코드(6자리)를 알려줍니다.</Step>
        <Step num={3}>자녀가 대시보드에서 <b>초대 코드 입력</b>란에 입력하면 연결이 완료됩니다.</Step>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", margin: "16px 0 8px" }}>해제하기</div>
        <Step num={1}>부모 계정 <b>설정 &gt; 자녀 관리</b>에서 연결된 자녀 항목을 찾습니다.</Step>
        <Step num={2}><b>연결 해제</b> 버튼을 탭하면 즉시 해제됩니다.</Step>
        <Tip>부모 한 명이 여러 자녀와 연결할 수 있고, 자녀도 여러 부모(공동 양육)와 연결할 수 있습니다.</Tip>
      </div>
    ),
  },
  {
    id: "parent-dashboard",
    icon: "🏠",
    title: "부모 대시보드 화면 설명",
    content: (
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>화면 구성</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="blue">상단 요약</Label> 연결된 자녀별 오늘 숙제 완료 현황을 한눈에 표시
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="green">숙제 목록</Label> 날짜별로 등록한 숙제와 각 완료 상태 표시
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="orange">+ 숙제 추가</Label> 새 숙제를 텍스트 또는 이미지로 등록
          </div>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>오늘 할 일 보는 법</div>
        <Step num={1}>대시보드 상단에 <b>오늘의 숙제</b> 섹션이 바로 표시됩니다.</Step>
        <Step num={2}>캘린더 탭 → 오늘 날짜를 탭하면 해당 날 숙제 전체 목록을 확인할 수 있습니다.</Step>
      </div>
    ),
  },
  {
    id: "homework-input",
    icon: "✏️",
    title: "부모: 숙제 입력 및 관리",
    content: (
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>① 텍스트로 입력 (자연어 인식)</div>
        <Step num={1}>대시보드 하단 <b>+ 숙제 추가</b>를 탭합니다.</Step>
        <Step num={2}>자연어로 자유롭게 입력합니다.<br />
          <span style={{ fontFamily: "monospace", fontSize: 12.5, background: "#F1F5F9", padding: "2px 6px", borderRadius: 6 }}>
            "내일까지 수학 4단원 연습문제 1-10번"
          </span>
        </Step>
        <Step num={3}>AI가 과목·마감일·내용을 자동으로 분석해 미리보기를 보여줍니다.</Step>
        <Step num={4}>내용을 확인하고 <b>저장</b>을 탭합니다.</Step>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", margin: "16px 0 8px" }}>② 반복 일정 등록</div>
        <Step num={1}>숙제 입력 시 <b>반복</b> 옵션을 활성화합니다.</Step>
        <Step num={2}>반복 주기(매일 / 매주 특정 요일)와 종료일을 선택합니다.</Step>
        <Step num={3}>저장하면 선택 기간 동안 자동으로 같은 숙제가 생성됩니다.</Step>
        <Tip>피아노 연습, 받아쓰기처럼 매주 반복되는 숙제는 한 번만 설정하면 됩니다.</Tip>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", margin: "16px 0 8px" }}>③ 가정통신문·인쇄물 이미지로 등록</div>
        <Step num={1}>숙제 추가 화면에서 <b>이미지 첨부</b> 아이콘을 탭합니다.</Step>
        <Step num={2}>카메라로 가정통신문을 촬영하거나 갤러리에서 사진을 선택합니다.</Step>
        <Step num={3}>AI가 이미지 속 텍스트를 분석해 숙제 내용·마감일을 자동으로 추출합니다.</Step>
        <Step num={4}>내용을 확인·수정하고 저장합니다.</Step>
        <Tip>여러 과목이 적힌 가정통신문도 한 번에 촬영하면 항목별로 분리해서 등록해줍니다.</Tip>
      </div>
    ),
  },
  {
    id: "child-dashboard",
    icon: "🧒",
    title: "자녀 대시보드 화면 설명",
    content: (
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>화면 구성</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="green">오늘의 숙제</Label> 오늘 해야 할 숙제 목록이 화면 첫 번째에 표시
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="orange">리워드 현황</Label> 현재 모은 포인트·게임 시간 잔액 확인
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="blue">캘린더</Label> 월별 숙제 일정 전체 조회 가능
          </div>
        </div>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>오늘 할 일 확인하는 법</div>
        <Step num={1}>대시보드를 열면 <b>오늘의 숙제</b>가 가장 먼저 보입니다.</Step>
        <Step num={2}>캘린더 탭에서 오늘 날짜(동그라미 표시)를 탭해도 확인할 수 있습니다.</Step>
      </div>
    ),
  },
  {
    id: "child-complete",
    icon: "✅",
    title: "자녀: 숙제 완료 처리 · 사진 제출",
    content: (
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>숙제 완료 처리</div>
        <Step num={1}>대시보드 또는 캘린더에서 완료할 숙제를 확인합니다.</Step>
        <Step num={2}>숙제 항목 오른쪽의 <b>완료</b> 버튼을 탭합니다.</Step>
        <Step num={3}>완료 처리와 동시에 리워드가 자동으로 적립됩니다. 🎉</Step>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", margin: "16px 0 8px" }}>완료한 숙제 사진 찍어 올리기</div>
        <Step num={1}>완료 버튼 탭 후 나타나는 <b>사진 올리기</b> 버튼을 탭합니다.</Step>
        <Step num={2}>카메라로 노트·문제집 풀이를 직접 촬영하거나 갤러리에서 선택합니다.</Step>
        <Step num={3}>업로드가 완료되면 부모님이 앱에서 사진을 확인하고 검사할 수 있습니다.</Step>
        <Tip>사진은 밝은 곳에서 글씨가 잘 보이도록 찍어주세요. AI 검사 정확도가 높아집니다.</Tip>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", margin: "16px 0 8px" }}>내 프로필 관리</div>
        <Step num={1}>대시보드 상단 아바타 아이콘을 탭합니다.</Step>
        <Step num={2}><b>이름</b>과 <b>아바타 캐릭터</b>를 원하는 것으로 변경할 수 있습니다.</Step>
        <Step num={3}>저장 후 대시보드에 바로 반영됩니다.</Step>
      </div>
    ),
  },
  {
    id: "homework-check",
    icon: "🔍",
    title: "부모: 완료된 숙제 검사 방법",
    content: (
      <div style={{ paddingTop: 14 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>
          자녀가 사진을 올리면 부모 대시보드에 <b>검사 대기 알림</b>이 표시됩니다.
        </p>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>① AI 자동 검사</div>
        <Step num={1}>검사할 숙제 항목을 탭하고 <b>AI 검사</b> 버튼을 탭합니다.</Step>
        <Step num={2}>AI가 자녀가 올린 사진을 분석해 문항별로 정답·오답을 자동 판별합니다.</Step>
        <Step num={3}>결과 화면에서 점수와 틀린 문항을 확인할 수 있습니다.</Step>
        <Step num={4}>결과를 그대로 저장하거나 수정 후 저장합니다.</Step>
        <Tip>AI 검사는 자체 API 키를 설정한 경우에만 사용할 수 있습니다. (설정 &gt; AI 설정)</Tip>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", margin: "16px 0 8px" }}>② 직접 검사</div>
        <Step num={1}>숙제 항목을 탭해 자녀가 올린 사진을 확인합니다.</Step>
        <Step num={2}><b>직접 검사</b>를 선택하면 문항 목록이 표시됩니다.</Step>
        <Step num={3}>각 문항에 ○ / ✕ 버튼으로 직접 채점합니다.</Step>
        <Step num={4}>저장하면 점수와 함께 자녀 통계에 반영됩니다.</Step>
      </div>
    ),
  },
  {
    id: "stats",
    icon: "📊",
    title: "통계 · 커리큘럼 분석으로 아이디어 얻기",
    content: (
      <div style={{ paddingTop: 14 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--muted)", fontWeight: 600, lineHeight: 1.7 }}>
          제출된 사진과 검사 결과를 바탕으로 kiddoloop이 과목·영역별 통계를 자동으로 생성합니다.
        </p>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>어떤 통계를 볼 수 있나요?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="blue">과목별 정답률</Label> 수학·국어·영어 등 과목별 누적 정답률 그래프
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="orange">영역별 취약점</Label> 연산·독해·문법 등 세부 영역에서 반복적으로 틀리는 유형 분석
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="green">완료율 추이</Label> 주별·월별 숙제 완료율 변화로 학습 습관 추세 파악
          </div>
        </div>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>커리큘럼 기준 보완 아이디어 얻기</div>
        <Step num={1}>통계 탭에서 <b>커리큘럼 분석</b> 섹션으로 이동합니다.</Step>
        <Step num={2}>학년·학기 교육과정과 실제 숙제 이력이 자동으로 대조됩니다.</Step>
        <Step num={3}>
          <b>아직 다루지 않은 단원</b> 또는 <b>취약도가 높은 영역</b>을 목록으로 확인합니다.
        </Step>
        <Step num={4}>추천된 보완 학습 아이템을 참고해 다음 숙제를 계획합니다.</Step>
        <Tip>통계는 검사 데이터가 쌓일수록 정확해집니다. 꾸준히 AI 또는 직접 검사를 진행해주세요.</Tip>

        <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: 13, color: "#1D4ED8", lineHeight: 1.7 }}>
          <b>통계 화면 이동 방법</b><br />
          부모: 대시보드 하단 탭 &gt; 📊 통계<br />
          자녀: 대시보드 하단 탭 &gt; 📊 내 성취
        </div>
      </div>
    ),
  },
];

export default function HelpContent() {
  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--bg)",
        maxWidth: 480,
        margin: "0 auto",
        padding: "0 16px 40px",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "var(--bg)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 0 14px",
          borderBottom: "1px solid var(--line)",
          marginBottom: 20,
        }}
      >
        <a
          href="javascript:history.back()"
          style={{ fontSize: 20, color: "var(--faint)", textDecoration: "none", lineHeight: 1 }}
        >
          ←
        </a>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>사용 방법</h1>
      </div>

      {/* 인트로 */}
      <div
        style={{
          background: "linear-gradient(135deg, #F0FDF4, #EFF6FF)",
          borderRadius: 16,
          padding: "18px 18px",
          marginBottom: 20,
          border: "1px solid #BFDBFE",
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 6 }}>📖</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>kiddoloop 시작 가이드</div>
        <div style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.65 }}>
          궁금한 항목을 탭하면 자세한 설명을 볼 수 있어요.
        </div>
      </div>

      {/* 아코디언 섹션 */}
      {SECTIONS.map((s) => (
        <Accordion key={s.id} section={s} />
      ))}
    </div>
  );
}
