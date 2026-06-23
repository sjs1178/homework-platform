"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

interface Section {
  id: string;
  icon: string;
  title: string;
  content: React.ReactNode;
}

function Accordion({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 6px rgba(0,0,0,.06)", overflow: "hidden", marginBottom: 10 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: 22, flexShrink: 0 }}>{section.icon}</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{section.title}</span>
        <span style={{ fontSize: 12, color: "var(--faint)", transition: "transform .2s", display: "inline-block", transform: open ? "rotate(90deg)" : "none" }}>▶</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 20px", borderTop: "1px solid var(--line)", fontSize: 14, color: "var(--text)", lineHeight: 1.75 }}>
          {section.content}
        </div>
      )}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", fontSize: 13, color: "#166534", fontWeight: 600, lineHeight: 1.65 }}>
      💡 {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: 13, color: "#1D4ED8", fontWeight: 600, lineHeight: 1.65 }}>
      ℹ️ {children}
    </div>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
        {num}
      </div>
      <div style={{ flex: 1, fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function Label({ color = "green", children }: { color?: "green" | "blue" | "orange" | "red" | "purple"; children: React.ReactNode }) {
  const map: Record<string, [string, string]> = {
    green:  ["#DCFCE7", "#15803D"],
    blue:   ["#DBEAFE", "#1D4ED8"],
    orange: ["#FEF3C7", "#92400E"],
    red:    ["#FEE2E2", "#B91C1C"],
    purple: ["#EDE9FE", "#5B21B6"],
  };
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
          <div style={{ padding: 14, borderRadius: 12, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1D4ED8", marginBottom: 8 }}>👨‍👩‍👧 부모 계정</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#1e40af", lineHeight: 1.8 }}>
              <li>숙제 등록·삭제</li>
              <li>AI 또는 직접 숙제 검사</li>
              <li>리워드·미션 설정</li>
              <li>과목별 통계 열람</li>
              <li>자녀 계정 연결 관리</li>
            </ul>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#15803D", marginBottom: 8 }}>🧒 자녀 계정</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#166534", lineHeight: 1.8 }}>
              <li>오늘의 숙제 확인</li>
              <li>숙제 완료·완료 취소</li>
              <li>미션 달성·리워드 받기</li>
              <li>리워드 내역 조회</li>
              <li>프로필·아바타 설정</li>
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
          처음 가입이라면 온보딩 화면이 나타납니다.<br />
          ① 역할(부모/자녀) 선택 → ② 이름 입력 → ③ 생년월일 입력 → ④ 약관 동의 → 가입 완료
        </Step>
        <Step num={4}>이후 접속 시에는 로그인 세션이 유지되어 대시보드로 바로 이동합니다.</Step>
        <Tip>만 19세 미만 자녀가 가입할 경우, 부모님 이메일을 입력하면 부모 계정에서 승인 요청을 받을 수 있습니다.</Tip>
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
        <Step num={1}>부모 계정 <b>내정보 → 자녀 관리</b>에서 초대 코드(6자리)를 확인합니다.</Step>
        <Step num={2}>자녀에게 코드를 알려줍니다.</Step>
        <Step num={3}>자녀가 대시보드 <b>초대 코드 입력</b>란에 입력하면 즉시 연결됩니다.</Step>

        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", margin: "16px 0 8px" }}>해제하기</div>
        <Step num={1}>부모 계정 <b>내정보 → 자녀 관리</b>에서 연결된 자녀를 선택합니다.</Step>
        <Step num={2}><b>연결 해제</b>를 탭하면 즉시 해제됩니다.</Step>
        <Tip>부모 한 명이 여러 자녀와, 자녀도 여러 부모(공동 양육)와 연결할 수 있습니다.</Tip>
      </div>
    ),
  },
  {
    id: "parent-dashboard",
    icon: "🏠",
    title: "부모 대시보드 화면 설명",
    content: (
      <div style={{ paddingTop: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="green">히어로 카드</Label> 자녀별 이번 주 숙제 현황 · 스트릭 · 리워드 잔액 표시
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="blue">오늘의 숙제</Label> 오늘 숙제 목록 · 카드를 탭하면 상세 팝업
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="orange">퀵 액션</Label> 숙제 입력 · 리워드 · 미션 관리 · 학습 통계 바로가기
          </div>
        </div>
        <Note>주간 요일 표시에서 노란 점은 숙제가 있는 날, 초록 체크는 완료된 날을 의미합니다.</Note>
      </div>
    ),
  },
  {
    id: "homework-input",
    icon: "✏️",
    title: "부모: 숙제 입력 방법",
    content: (
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>① 텍스트 자연어 입력</div>
        <Step num={1}>대시보드 <b>숙제 입력</b> 버튼을 탭합니다.</Step>
        <Step num={2}>
          자유롭게 입력합니다.<br />
          <span style={{ fontFamily: "monospace", fontSize: 12.5, background: "#F1F5F9", padding: "2px 6px", borderRadius: 6 }}>&quot;내일까지 수학 4단원 연습문제 1-10번&quot;</span>
        </Step>
        <Step num={3}>AI가 과목·마감일·내용을 자동 분석해 미리보기를 보여줍니다.</Step>
        <Step num={4}>확인 후 <b>저장</b>합니다.</Step>

        <div style={{ fontSize: 13.5, fontWeight: 800, margin: "16px 0 8px" }}>② 반복 일정 등록</div>
        <Step num={1}>숙제 입력 시 <b>반복</b> 옵션을 켭니다.</Step>
        <Step num={2}>반복 주기(매일·매주 특정 요일)와 종료일을 선택합니다.</Step>
        <Step num={3}>저장하면 기간 내 동일한 숙제가 자동 생성됩니다.</Step>
        <Tip>피아노 연습, 받아쓰기처럼 매주 반복되는 숙제는 한 번만 설정하면 됩니다.</Tip>

        <div style={{ fontSize: 13.5, fontWeight: 800, margin: "16px 0 8px" }}>③ 가정통신문·인쇄물 이미지로 등록</div>
        <Step num={1}>숙제 입력 화면에서 <b>이미지 첨부</b> 아이콘을 탭합니다.</Step>
        <Step num={2}>카메라로 촬영하거나 갤러리에서 선택합니다.</Step>
        <Step num={3}>AI가 이미지 속 텍스트를 분석해 숙제 내용·마감일을 자동 추출합니다.</Step>
        <Step num={4}>내용을 확인·수정하고 저장합니다.</Step>
        <Tip>여러 과목이 적힌 가정통신문도 한 번에 촬영하면 항목별로 분리해서 등록해줍니다.</Tip>
      </div>
    ),
  },
  {
    id: "child-complete",
    icon: "✅",
    title: "자녀: 숙제 확인·완료·취소",
    content: (
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>숙제 확인하기</div>
        <Step num={1}>대시보드에서 <b>다음 숙제</b> 카드를 확인하거나, <b>숙제 캘린더</b>에서 날짜별로 확인합니다.</Step>
        <Step num={2}>숙제 카드를 탭하면 과목·내용·마감일이 담긴 <b>상세 팝업</b>이 나타납니다.</Step>

        <div style={{ fontSize: 13.5, fontWeight: 800, margin: "16px 0 8px" }}>완료 처리하기</div>
        <Step num={1}>캘린더에서 숙제 카드를 탭합니다.</Step>
        <Step num={2}>상세 팝업 하단의 <b>완료하기</b> 버튼을 탭합니다.</Step>
        <Step num={3}>완료와 동시에 리워드가 자동 적립됩니다.</Step>

        <div style={{ fontSize: 13.5, fontWeight: 800, margin: "16px 0 8px" }}>완료 취소하기</div>
        <Step num={1}><b>오늘 날짜</b>에 완료된 숙제 카드를 탭합니다.</Step>
        <Step num={2}>상세 팝업 하단의 <b>완료 취소하기</b> 버튼을 탭합니다.</Step>
        <Step num={3}>적립된 리워드도 함께 차감됩니다.</Step>
        <Note>완료 취소는 오늘 날짜 숙제만 가능합니다. 지난 날짜의 숙제는 취소할 수 없습니다.</Note>
      </div>
    ),
  },
  {
    id: "homework-check",
    icon: "🔍",
    title: "부모: 숙제 검사 방법",
    content: (
      <div style={{ paddingTop: 14 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>
          자녀가 숙제를 완료하면 대시보드에 <b>검사 대기</b> 상태로 표시됩니다. 숙제 카드를 탭해 상세 팝업에서 검사 화면으로 이동합니다.
        </p>

        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>① AI 자동 검사</div>
        <Step num={1}>검사 화면에서 숙제 풀이 사진을 업로드합니다.</Step>
        <Step num={2}><b>AI 검사</b> 버튼을 탭합니다.</Step>
        <Step num={3}>AI가 사진을 분석해 문항별 정답·오답을 자동 판별하고 점수를 산출합니다.</Step>
        <Step num={4}>결과를 확인하고, 필요하면 수정 후 저장합니다.</Step>

        <div style={{ fontSize: 13.5, fontWeight: 800, margin: "16px 0 8px" }}>② 직접 검사</div>
        <Step num={1}>검사 화면에서 <b>직접 검사</b>를 선택합니다.</Step>
        <Step num={2}>각 문항에 ○ / ✕ 버튼으로 직접 채점합니다.</Step>
        <Step num={3}>저장하면 점수가 자녀 통계에 반영됩니다.</Step>

        <Tip>AI 검사 시 사진은 밝은 곳에서 글씨가 잘 보이도록 찍어주세요. 사진이 4장 이상이면 처리 시간이 길어질 수 있습니다.</Tip>
      </div>
    ),
  },
  {
    id: "mission",
    icon: "🎯",
    title: "미션 시스템",
    content: (
      <div style={{ paddingTop: 14 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--muted)", fontWeight: 600, lineHeight: 1.7 }}>
          숙제를 꾸준히 완료하면 미션을 달성하고 추가 리워드를 받을 수 있습니다. 미션은 3단계입니다.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="green">일별 미션</Label> 오늘의 숙제를 모두 완료하면 달성
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="blue">주간 미션</Label> 이번 주 숙제를 모두 완료하면 달성
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="purple">월간 미션</Label> 이번 달 숙제를 모두 완료하면 달성
          </div>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>자녀: 미션 리워드 받기</div>
        <Step num={1}>대시보드의 <b>오늘의 미션</b> 배너를 탭합니다.</Step>
        <Step num={2}>달성된 미션의 <b>리워드 받기</b> 버튼을 탭합니다.</Step>

        <div style={{ fontSize: 13.5, fontWeight: 800, margin: "16px 0 8px" }}>부모: 미션 리워드 설정</div>
        <Step num={1}>대시보드의 <b>미션 관리</b> 배너를 탭합니다.</Step>
        <Step num={2}>일별·주간·월간 미션별 리워드 금액을 설정합니다.</Step>
        <Tip>미션 리워드는 숙제 완료 리워드와 별도로 추가 적립됩니다.</Tip>
      </div>
    ),
  },
  {
    id: "reward",
    icon: "🎁",
    title: "리워드 시스템",
    content: (
      <div style={{ paddingTop: 14 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--muted)", fontWeight: 600, lineHeight: 1.7 }}>
          자녀가 숙제를 완료하면 부모가 설정한 리워드 포인트가 자동으로 적립됩니다.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="green">자동 적립</Label> 숙제 완료 시 설정된 포인트가 즉시 적립
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="blue">검사 연동</Label> AI/직접 검사 점수 기반 적립도 가능 (점수당 리워드)
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="orange">수동 지급·차감</Label> 부모가 리워드 화면에서 직접 지급하거나 차감 가능
          </div>
        </div>
        <Tip>부모 내정보 → 리워드 설정에서 이름과 단위를 원하는 대로 바꿀 수 있습니다. (예: &quot;별★&quot;, &quot;쿠키🍪&quot;)</Tip>
      </div>
    ),
  },
  {
    id: "ai-token",
    icon: "🤖",
    title: "AI 기능 설정 (API 토큰)",
    content: (
      <div style={{ paddingTop: 14 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--muted)", fontWeight: 600, lineHeight: 1.7 }}>
          kiddoloop의 AI 기능(숙제 파싱·이미지 분석·자동 검사)은 본인의 API 키로 작동합니다. 아래 3개 AI 중 하나를 선택해 사용할 수 있습니다.
        </p>

        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>API 토큰 입력 방법</div>
        <Step num={1}>부모 계정 <b>내정보 → AI 설정</b>으로 이동합니다.</Step>
        <Step num={2}>AI 제공사를 선택합니다 (Claude / ChatGPT / Gemini).</Step>
        <Step num={3}>아래 안내에 따라 발급받은 API 키를 입력합니다.</Step>
        <Step num={4}>저장하면 즉시 AI 기능이 활성화됩니다.</Step>

        <div style={{ fontSize: 13.5, fontWeight: 800, margin: "16px 0 8px" }}>① Google Gemini (무료로 시작 가능)</div>
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: 13, color: "#1D4ED8", lineHeight: 1.75, marginBottom: 10 }}>
          Google 계정만 있으면 <b>무료로 API 키를 발급</b>받아 바로 사용할 수 있습니다.<br /><br />
          <b>발급 방법:</b><br />
          1. <b>aistudio.google.com</b>에 Google 계정으로 로그인<br />
          2. 왼쪽 메뉴에서 <b>API keys</b> 클릭<br />
          3. <b>Create API key</b> 버튼 클릭 → 키 복사<br />
          4. kiddoloop AI 설정에서 <b>Gemini</b> 탭 선택 후 붙여넣기
        </div>

        <div style={{ fontSize: 13.5, fontWeight: 800, margin: "16px 0 8px" }}>② Anthropic Claude (유료, 가장 정확)</div>
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "#F5F3FF", border: "1px solid #DDD6FE", fontSize: 13, color: "#5B21B6", lineHeight: 1.75, marginBottom: 10 }}>
          숙제 분석과 채점 정확도가 가장 높습니다.<br /><br />
          <b>발급 방법:</b><br />
          1. <b>console.anthropic.com</b>에서 회원가입<br />
          2. 결제 수단 등록 후 크레딧 충전 ($5부터)<br />
          3. <b>API Keys</b> 메뉴에서 키 생성 → 복사<br />
          4. kiddoloop AI 설정에서 <b>Claude</b> 탭 선택 후 붙여넣기
        </div>

        <div style={{ fontSize: 13.5, fontWeight: 800, margin: "16px 0 8px" }}>③ OpenAI ChatGPT (유료)</div>
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", fontSize: 13, color: "#166534", lineHeight: 1.75, marginBottom: 10 }}>
          <b>발급 방법:</b><br />
          1. <b>platform.openai.com</b>에서 로그인<br />
          2. 결제 수단 등록 후 크레딧 충전 ($5부터)<br />
          3. <b>API Keys</b> 메뉴에서 키 생성 → 복사<br />
          4. kiddoloop AI 설정에서 <b>ChatGPT</b> 탭 선택 후 붙여넣기
        </div>

        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "#FFF7ED", border: "1px solid #FED7AA", fontSize: 13, color: "#92400E", lineHeight: 1.7 }}>
          <b>🔒 보안 안내</b><br />
          입력한 API 키는 내 기기(브라우저)에만 저장되며, 서버·데이터베이스에는 절대 전송되지 않습니다.
        </div>

        <div style={{ fontSize: 13.5, fontWeight: 800, margin: "16px 0 8px" }}>API 키가 없다면?</div>
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", fontSize: 13, color: "#166534", lineHeight: 1.75 }}>
          API 키 없이도 서비스를 이용할 수 있습니다.<br />
          AI 기능 대신 <b>직접 입력 모드</b>로 숙제를 수동 등록하거나, <b>광고 시청</b> 후 AI 기능을 이용할 수 있습니다.<br />
          처음이라면 <b>무료인 Gemini</b>부터 시작해보세요!
        </div>
      </div>
    ),
  },
  {
    id: "profile",
    icon: "🧑‍🎨",
    title: "자녀: 프로필 관리",
    content: (
      <div style={{ paddingTop: 14 }}>
        <Step num={1}>하단 네비게이션의 <b>내정보</b>를 탭합니다.</Step>
        <Step num={2}><b>이름</b>과 <b>아바타 캐릭터</b>를 원하는 것으로 변경할 수 있습니다.</Step>
        <Step num={3}>저장하면 대시보드에 즉시 반영됩니다.</Step>
        <Note>아바타는 남자아이·여자아이·동물 카테고리 중에서 선택할 수 있습니다.</Note>
      </div>
    ),
  },
  {
    id: "stats",
    icon: "📊",
    title: "학습 통계 보기",
    content: (
      <div style={{ paddingTop: 14 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--muted)", fontWeight: 600, lineHeight: 1.7 }}>
          숙제 검사 결과를 바탕으로 과목·영역별 통계가 자동 생성됩니다.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="blue">과목별 정답률</Label> 수학·국어·영어 등 과목별 누적 정답률
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="orange">직업군 가이드</Label> 학습 패턴 기반 진로 탐색 가이드
          </div>
        </div>

        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>통계 화면 이동</div>
        <Step num={1}>부모: 대시보드 하단의 <b>학습 통계 · 직업군 가이드</b> 배너를 탭합니다.</Step>
        <Step num={2}>자녀: 대시보드 하단의 퀵 액션 또는 캘린더에서 확인할 수 있습니다.</Step>
        <Tip>통계는 검사 데이터가 쌓일수록 정확해집니다. 꾸준히 AI 또는 직접 검사를 진행해주세요.</Tip>
      </div>
    ),
  },
  {
    id: "navigation",
    icon: "📱",
    title: "화면 구성 및 네비게이션",
    content: (
      <div style={{ paddingTop: 14 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--muted)", fontWeight: 600, lineHeight: 1.7 }}>
          하단 네비게이션 바를 통해 주요 화면을 이동할 수 있습니다.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="green">홈</Label> 대시보드 · 오늘 숙제 현황 · 퀵 액션
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="blue">캘린더</Label> 월간 숙제 달력 · 날짜별 숙제 상세
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="orange">리워드</Label> 포인트 잔액 · 적립/사용 내역
          </div>
          <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13.5, lineHeight: 1.7 }}>
            <Label color="purple">내정보</Label> 프로필 · 자녀 관리 · AI 설정 · 로그아웃
          </div>
        </div>
      </div>
    ),
  },
];

export default function HelpContent() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100svh", background: "var(--bg)", maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" }}>
      {/* 헤더 */}
      <div style={{ position: "sticky", top: 0, background: "var(--bg)", zIndex: 10, paddingTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 14 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon name="arrow-left" size={23} color="var(--text)" stroke={2.2} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>사용 방법</h1>
        </div>
      </div>

      {/* 인트로 */}
      <div style={{ background: "linear-gradient(135deg, #F0FDF4, #EFF6FF)", borderRadius: 16, padding: "18px", marginBottom: 20, border: "1px solid #BFDBFE" }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>📖</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>kiddoloop 사용 가이드</div>
        <div style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.65 }}>궁금한 항목을 탭하면 자세한 설명을 볼 수 있어요.</div>
      </div>

      {SECTIONS.map((s) => (
        <Accordion key={s.id} section={s} />
      ))}

      {/* 문의 안내 */}
      <div style={{ marginTop: 20, padding: "16px 18px", background: "#fff", borderRadius: 16, boxShadow: "0 1px 6px rgba(0,0,0,.06)", textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>더 궁금한 점이 있으신가요?</p>
        <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 0 }}>
          contact@kiddoloop.com 으로 문의해주세요.
        </p>
      </div>
    </div>
  );
}
