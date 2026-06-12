"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KiddoloopAppicon } from "@/components/ui/Logo";

/* ─────────────── 슬라이드별 목업 컴포넌트 ─────────────── */

function MockPhone({ children, bg = "#F1F7F3" }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{
      width: 200, flexShrink: 0,
      background: bg,
      borderRadius: 28,
      border: "5px solid #1E293B",
      overflow: "hidden",
      boxShadow: "0 16px 40px -8px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.1)",
      position: "relative",
    }}>
      {/* 노치 */}
      <div style={{ height: 20, background: "#1E293B", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 56, height: 10, background: "#0F172A", borderRadius: 8 }} />
      </div>
      <div style={{ padding: "10px 10px 14px", minHeight: 320 }}>
        {children}
      </div>
    </div>
  );
}

/* 슬라이드 1 - 로그인 & 연결 */
function MockSlide1() {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "center" }}>
      {/* 로그인 화면 */}
      <MockPhone>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingTop: 18 }}>
          <KiddoloopAppicon size={44} />
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 18, color: "#0F172A" }}>kiddoloop</div>
          <div style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>아이가 스스로 만드는 숙제 루틴</div>
        </div>
        <div style={{ marginTop: 22, background: "#E9F0EB", borderRadius: 14, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 28 }}>🖼️</div>
        </div>
        <div style={{ marginTop: 14, background: "#fff", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#4285F4,#EA4335,#FBBC05,#34A853)", flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#0F172A" }}>Google로 시작하기</span>
        </div>
      </MockPhone>

      {/* 화살표 */}
      <div style={{ fontSize: 20, color: "#16A34A", marginTop: 60, flexShrink: 0 }}>→</div>

      {/* 페어링 화면 */}
      <MockPhone bg="#F0FDF4">
        <div style={{ fontSize: 10, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>자녀 관리</div>
        {/* 초대코드 카드 */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "8px 10px", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 8.5, color: "#64748B", fontWeight: 600, marginBottom: 4 }}>초대 코드</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.15em", color: "#16A34A", textAlign: "center" }}>AB12CD</div>
        </div>
        <div style={{ fontSize: 8, color: "#94A3B8", textAlign: "center", marginBottom: 10 }}>자녀에게 알려주세요</div>
        {/* 자녀 입력 영역 */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "8px 10px", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 8.5, color: "#64748B", fontWeight: 600, marginBottom: 4 }}>코드 입력</div>
          <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "6px 8px", fontSize: 10, color: "#94A3B8", border: "1.5px solid #E2E8F0" }}>AB12CD</div>
          <div style={{ marginTop: 8, background: "#16A34A", borderRadius: 8, padding: "6px", textAlign: "center", fontSize: 9, color: "#fff", fontWeight: 800 }}>연결하기</div>
        </div>
        {/* 연결 완료 표시 */}
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#DCFCE7", borderRadius: 10 }}>
          <span style={{ fontSize: 14 }}>🧒</span>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 800, color: "#15803D" }}>민준이 연결됨</div>
            <div style={{ fontSize: 7.5, color: "#16A34A" }}>✓ 활성 상태</div>
          </div>
        </div>
      </MockPhone>
    </div>
  );
}

/* 슬라이드 2 - 숙제 등록 & 완료 요청 */
function MockSlide2() {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "center" }}>
      {/* 부모: 숙제 입력 */}
      <MockPhone bg="#FAF9F5">
        <div style={{ fontSize: 10, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>숙제 입력</div>
        <div style={{ background: "#fff", borderRadius: 10, padding: "8px 10px", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 8.5, color: "#94A3B8", marginBottom: 6 }}>자연어로 입력하세요</div>
          <div style={{ fontSize: 8.5, color: "#0F172A", lineHeight: 1.5 }}>내일까지 수학 4단원<br />연습문제 1-10번</div>
        </div>
        <div style={{ background: "#16A34A", borderRadius: 8, padding: "5px 8px", fontSize: 8.5, color: "#fff", fontWeight: 800, textAlign: "center", marginBottom: 10 }}>AI 파싱 →</div>
        {/* 파싱 결과 카드들 */}
        {[
          { subj: "수학", color: "#EDE9FE", tc: "#5B21B6", desc: "4단원 연습문제 1-10번", date: "내일" },
          { subj: "국어", color: "#FEE2E2", tc: "#B91C1C", desc: "받아쓰기 10개 연습", date: "오늘" },
        ].map((hw, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "7px 9px", marginBottom: 6, boxShadow: "0 1px 4px rgba(0,0,0,.06)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 999, background: hw.color, color: hw.tc, flexShrink: 0 }}>{hw.subj}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8.5, color: "#0F172A", fontWeight: 600 }}>{hw.desc}</div>
              <div style={{ fontSize: 7.5, color: "#94A3B8" }}>마감 {hw.date}</div>
            </div>
          </div>
        ))}
      </MockPhone>

      <div style={{ fontSize: 20, color: "#16A34A", marginTop: 60, flexShrink: 0 }}>→</div>

      {/* 자녀: 완료 & 검사 요청 */}
      <MockPhone bg="#F1F7F3">
        <div style={{ fontSize: 10, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>오늘의 숙제</div>
        {[
          { subj: "수학", color: "#EDE9FE", tc: "#5B21B6", desc: "4단원 연습문제", done: true },
          { subj: "국어", color: "#FEE2E2", tc: "#B91C1C", desc: "받아쓰기 연습", done: false },
        ].map((hw, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "8px 9px", marginBottom: 7, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 999, background: hw.color, color: hw.tc }}>{hw.subj}</span>
              <span style={{ fontSize: 8.5, color: "#0F172A", flex: 1 }}>{hw.desc}</span>
            </div>
            {hw.done ? (
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ flex: 1, background: "#DCFCE7", borderRadius: 6, padding: "4px", textAlign: "center", fontSize: 8, color: "#15803D", fontWeight: 800 }}>✓ 완료</div>
                <div style={{ flex: 1, background: "#EFF6FF", borderRadius: 6, padding: "4px", textAlign: "center", fontSize: 8, color: "#1D4ED8", fontWeight: 800 }}>📷 사진 올리기</div>
              </div>
            ) : (
              <div style={{ background: "#16A34A", borderRadius: 6, padding: "5px", textAlign: "center", fontSize: 8.5, color: "#fff", fontWeight: 800 }}>완료하기 →</div>
            )}
          </div>
        ))}
        {/* 검사 요청 배너 */}
        <div style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 10, padding: "7px 9px" }}>
          <div style={{ fontSize: 8.5, fontWeight: 800, color: "#713F12" }}>🔍 부모님 검사 요청됨</div>
          <div style={{ fontSize: 7.5, color: "#92400E", marginTop: 2 }}>사진이 전송되었습니다</div>
        </div>
      </MockPhone>
    </div>
  );
}

/* 슬라이드 3 - 리워드 & 통계 */
function MockSlide3() {
  const bars = [
    { subj: "수학", pct: 82, color: "#7C3AED" },
    { subj: "국어", pct: 65, color: "#DC2626" },
    { subj: "영어", pct: 90, color: "#1D4ED8" },
    { subj: "과학", pct: 74, color: "#059669" },
  ];
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "center" }}>
      {/* 리워드 화면 */}
      <MockPhone bg="#FAF9F5">
        <div style={{ fontSize: 10, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>리워드 현황</div>
        {/* 잔액 카드 */}
        <div style={{ background: "linear-gradient(135deg,#16A34A,#059669)", borderRadius: 14, padding: "14px 12px", marginBottom: 8, color: "#fff" }}>
          <div style={{ fontSize: 8, fontWeight: 600, opacity: 0.85, marginBottom: 4 }}>현재 잔액</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>150<span style={{ fontSize: 12 }}>P</span></div>
          <div style={{ fontSize: 8, opacity: 0.75, marginTop: 4 }}>이번 달 획득 +80P</div>
        </div>
        {/* 최근 내역 */}
        <div style={{ fontSize: 8.5, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>최근 내역</div>
        {[
          { label: "수학 완료", amt: "+10P", color: "#16A34A" },
          { label: "국어 완료", amt: "+10P", color: "#16A34A" },
          { label: "리워드 사용", amt: "-20P", color: "#DC2626" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: 8.5, color: "#334155" }}>{r.label}</span>
            <span style={{ fontSize: 8.5, fontWeight: 800, color: r.color }}>{r.amt}</span>
          </div>
        ))}
      </MockPhone>

      <div style={{ fontSize: 20, color: "#16A34A", marginTop: 60, flexShrink: 0 }}>+</div>

      {/* 통계 화면 */}
      <MockPhone bg="#F8FAFC">
        <div style={{ fontSize: 10, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>과목별 통계</div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "10px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 8 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: "#334155" }}>{b.subj}</span>
                <span style={{ fontSize: 8.5, fontWeight: 800, color: b.color }}>{b.pct}%</span>
              </div>
              <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${b.pct}%`, background: b.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
        {/* 취약점 뱃지 */}
        <div style={{ fontSize: 8.5, fontWeight: 800, color: "#0F172A", marginBottom: 5 }}>보완 추천</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {["국어 독해", "수학 도형", "영어 문법"].map((t) => (
            <span key={t} style={{ fontSize: 7.5, background: "#FEF9C3", color: "#92400E", borderRadius: 999, padding: "2px 7px", fontWeight: 700 }}>{t}</span>
          ))}
        </div>
      </MockPhone>
    </div>
  );
}

/* ─────────────── 슬라이드 데이터 ─────────────── */
const SLIDES = [
  {
    mockup: <MockSlide1 />,
    title: "계정을 만들고 연결하세요",
    desc: "Google 계정으로 간편하게 가입하고 초대 코드 하나로 부모와 자녀를 연결합니다.",
    badge: "계정 · 연결",
    badgeColor: "#DBEAFE",
    badgeText: "#1D4ED8",
  },
  {
    mockup: <MockSlide2 />,
    title: "숙제를 등록하고 완료 요청",
    desc: "부모는 말하듯 입력하면 AI가 파싱합니다. 자녀는 완료 후 사진을 올려 검사를 요청해요.",
    badge: "숙제 · 검사",
    badgeColor: "#DCFCE7",
    badgeText: "#15803D",
  },
  {
    mockup: <MockSlide3 />,
    title: "리워드 지급 · 통계 확인",
    desc: "완료 즉시 리워드가 쌓이고, 과목별 통계로 아이의 학습 패턴을 파악할 수 있어요.",
    badge: "리워드 · 통계",
    badgeColor: "#EDE9FE",
    badgeText: "#5B21B6",
  },
];

/* ─────────────── 메인 컴포넌트 ─────────────── */
export default function WalkthroughClient() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 이미 본 사용자는 login으로 skip
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("wt_seen")) {
      router.replace("/auth/login");
    }
  }, [router]);

  function next() {
    if (current < SLIDES.length - 1) setCurrent((c) => c + 1);
  }
  function prev() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  }

  function handleStart() {
    localStorage.setItem("wt_seen", "1");
    router.push("/auth/login");
  }

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        minHeight: "100svh",
        background: "linear-gradient(170deg, #F0FDF4 0%, #EFF6FF 60%, #F8FAFC 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        maxWidth: 480,
        margin: "0 auto",
        padding: "0 20px",
        userSelect: "none",
        overflowX: "hidden",
      }}
    >
      {/* 상단: 로고 + Skip */}
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, paddingBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <KiddoloopAppicon size={30} />
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 18, color: "#0F172A" }}>kiddoloop</span>
        </div>
        <button
          onClick={handleStart}
          style={{ fontSize: 13, fontWeight: 700, color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: "6px 2px" }}
        >
          건너뛰기
        </button>
      </div>

      {/* 뱃지 */}
      <div style={{ marginTop: 16, marginBottom: 10 }}>
        <span style={{
          fontSize: 11.5, fontWeight: 800, padding: "4px 12px", borderRadius: 999,
          background: slide.badgeColor, color: slide.badgeText,
          letterSpacing: "0.03em",
        }}>
          {slide.badge}
        </span>
      </div>

      {/* 목업 영역 */}
      <div
        style={{
          width: "100%",
          transition: "opacity .25s",
          padding: "4px 0 20px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {slide.mockup}
      </div>

      {/* 텍스트 */}
      <div style={{ textAlign: "center", paddingBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 10px" }}>
          {slide.title}
        </h2>
        <p style={{ fontSize: 14.5, color: "#475569", fontWeight: 600, lineHeight: 1.7, margin: 0, maxWidth: 320 }}>
          {slide.desc}
        </p>
      </div>

      {/* 페이지 인디케이터 */}
      <div style={{ display: "flex", gap: 7, marginBottom: 28 }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 22 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? "#16A34A" : "#CBD5E1",
              border: "none",
              cursor: "pointer",
              transition: "width .2s, background .2s",
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* 버튼 영역 */}
      <div style={{ width: "100%", paddingBottom: 40 }}>
        {isLast ? (
          <button
            onClick={handleStart}
            style={{
              width: "100%", height: 56, borderRadius: 18, border: "none",
              background: "linear-gradient(135deg, #16A34A, #059669)",
              color: "#fff", fontSize: 17, fontWeight: 800,
              cursor: "pointer", boxShadow: "0 8px 24px -6px rgba(22,163,74,.55)",
              letterSpacing: "0.01em",
            }}
          >
            시작하기 →
          </button>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <button
              onClick={prev}
              disabled={current === 0}
              style={{
                height: 52, borderRadius: 16, border: "1.5px solid #E2E8F0",
                background: "#fff", color: "#475569", fontSize: 15, fontWeight: 700,
                cursor: current === 0 ? "default" : "pointer",
                opacity: current === 0 ? 0.3 : 1,
              }}
            >
              ←
            </button>
            <button
              onClick={next}
              style={{
                height: 52, borderRadius: 16, border: "none",
                background: "#16A34A",
                color: "#fff", fontSize: 15, fontWeight: 800,
                cursor: "pointer", boxShadow: "0 6px 18px -6px rgba(22,163,74,.5)",
              }}
            >
              다음 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
