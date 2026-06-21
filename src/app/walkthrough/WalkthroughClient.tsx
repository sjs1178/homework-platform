"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KiddoloopAppicon } from "@/components/ui/Logo";
import Icon from "@/components/ui/Icon";

const FEATURES = [
  {
    icon: "sparkles" as const,
    title: "AI 숙제 채점",
    desc: "숙제 사진을 찍으면 AI가 문제별로 채점하고, 틀린 문제는 아이 눈높이에 맞춰 풀이를 설명해줍니다. 부모가 직접 검사하는 수동 모드도 지원합니다.",
  },
  {
    icon: "gift" as const,
    title: "리워드 시스템",
    desc: "숙제를 완료하면 포인트가 적립됩니다. 아이는 적립된 포인트로 게임시간, 용돈 등 부모가 설정한 리워드를 교환 요청할 수 있어요.",
  },
  {
    icon: "target" as const,
    title: "미션 도전",
    desc: "매일, 매주, 매월 단위의 미션을 달성하면 보너스 리워드를 받을 수 있어요. 작은 성취의 반복이 습관으로 이어집니다.",
  },
  {
    icon: "trending-up" as const,
    title: "학습 통계",
    desc: "과목별 완료율과 정답률을 한눈에 확인하세요. 동학년 평균과 비교해서 아이의 강점과 보완이 필요한 영역을 파악할 수 있습니다.",
  },
  {
    icon: "calendar" as const,
    title: "숙제 캘린더",
    desc: "등록된 숙제가 캘린더에 자동으로 표시됩니다. 아이는 매일 무엇을 해야 하는지 스스로 확인하고, 완료 버튼을 눌러 숙제를 관리합니다.",
  },
  {
    icon: "zap" as const,
    title: "자연어 숙제 등록",
    desc: "\"내일까지 수학 4단원 연습문제 1번~10번 풀기\" — 말하듯 입력하면 AI가 과목, 내용, 마감일을 자동으로 파싱해서 등록합니다.",
  },
];

const STEPS = [
  {
    num: "1",
    title: "가입하고 연결하기",
    desc: "부모와 자녀 모두 Google 계정으로 간편하게 가입합니다. 부모가 받은 초대 코드를 자녀가 입력하면 바로 연결됩니다.",
  },
  {
    num: "2",
    title: "숙제 등록하기",
    desc: "부모가 자연어로 숙제를 입력하면 AI가 파싱해서 자녀의 캘린더에 자동 등록합니다. 과목, 마감일, 리워드가 한번에 설정됩니다.",
  },
  {
    num: "3",
    title: "완료하고 리워드 받기",
    desc: "자녀가 숙제를 완료하면 리워드가 적립됩니다. 부모는 AI 채점 또는 직접 검사로 결과를 확인하고, 아이의 성장을 통계로 지켜봅니다.",
  },
];

const FAQS = [
  {
    q: "무료로 사용할 수 있나요?",
    a: "네, 기본 기능은 모두 무료입니다. AI 숙제 채점은 광고 시청 후 무료로 이용하거나, 자체 AI API 키를 연동해서 무제한으로 사용할 수 있습니다.",
  },
  {
    q: "어떤 과목을 지원하나요?",
    a: "수학, 국어, 영어, 과학, 사회, 음악, 미술, 체육, 도덕, 정보 등 초등학교부터 고등학교까지 전 과목을 지원합니다. 2022 개정 교육과정에 맞춰 과목별 영역을 자동으로 분류합니다.",
  },
  {
    q: "아이의 개인정보는 안전한가요?",
    a: "개인정보보호법(PIPA)을 엄격히 준수합니다. 만 14세 미만 아동은 법정대리인의 동의를 받아야 가입할 수 있으며, 수집하는 개인정보를 최소화하고 있습니다. AI API 키는 기기에만 저장되며 서버로 전송되지 않습니다.",
  },
  {
    q: "어떤 기기에서 사용할 수 있나요?",
    a: "스마트폰, 태블릿, PC 등 웹 브라우저가 있는 모든 기기에서 사용할 수 있습니다. Android 앱도 준비 중이며, 모바일에 최적화된 화면으로 제공됩니다.",
  },
  {
    q: "AI 채점은 정확한가요?",
    a: "최신 AI 모델(Claude, GPT-4o, Gemini)을 사용하며, 부모가 AI 채점 결과를 직접 확인하고 수정할 수 있는 검수 기능을 제공합니다. AI 채점이 어려운 과목은 수동 검사 모드로 직접 채점할 수 있습니다.",
  },
  {
    q: "부모와 자녀 여러 명도 가능한가요?",
    a: "네, 한 부모가 여러 자녀와 연결할 수 있고, 한 자녀도 여러 부모(예: 아빠, 엄마)와 연결될 수 있습니다. 각 연결마다 독립적으로 숙제와 리워드가 관리됩니다.",
  },
];

export default function WalkthroughClient() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("wt_seen")) {
      router.replace("/auth/login");
    }
  }, [router]);

  function handleStart() {
    localStorage.setItem("wt_seen", "1");
    router.push("/auth/login");
  }

  return (
    <div style={{ minHeight: "100svh", background: "#F4F8F5" }}>
      {/* ── 헤더 ── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(244,248,245,0.92)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid #E2EBE5",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <KiddoloopAppicon size={32} />
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 20 }}>
              <span style={{ color: "#13241B" }}>kiddo</span>
              <span style={{ color: "#16A34A" }}>loop</span>
            </span>
          </div>
          <button
            onClick={handleStart}
            style={{
              padding: "8px 18px", borderRadius: 10, border: "none",
              background: "var(--green)", color: "#fff",
              fontSize: 13.5, fontWeight: 800, cursor: "pointer",
            }}
          >
            시작하기
          </button>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 40px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block", padding: "4px 14px", borderRadius: 999,
            background: "#DCFCE7", color: "#15803D",
            fontSize: 12.5, fontWeight: 700, marginBottom: 16,
          }}
        >
          부모와 자녀가 함께하는 AI 학습 플랫폼
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#13241B", lineHeight: 1.35, margin: "0 0 14px" }}>
          아이가 스스로 만드는<br />숙제 루틴
        </h1>
        <p style={{ fontSize: 16, color: "#6B7B72", lineHeight: 1.7, margin: "0 auto 28px", maxWidth: 480, fontWeight: 500 }}>
          AI가 숙제를 채점하고, 완료하면 리워드가 쌓여요.
          매일 반복되는 작은 성취가 자기주도 학습 습관으로 이어집니다.
        </p>
        <button
          onClick={handleStart}
          style={{
            height: 52, padding: "0 32px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #16A34A, #059669)",
            color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 8px 24px -6px rgba(22,163,74,.5)",
          }}
        >
          무료로 시작하기 →
        </button>
        <p style={{ fontSize: 12.5, color: "#9AA8A0", marginTop: 10, fontWeight: 500 }}>
          Google 계정으로 30초만에 가입
        </p>

        {/* 히어로 비주얼: 앱 미리보기 카드 */}
        <div
          style={{
            marginTop: 36, display: "flex", gap: 10, justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: "sparkles" as const, label: "AI 채점", sub: "사진 올리면 자동 채점", bg: "#EFF6FF", color: "#2563EB" },
            { icon: "gift" as const, label: "리워드", sub: "완료 즉시 포인트 적립", bg: "#ECFDF5", color: "#16A34A" },
            { icon: "target" as const, label: "미션", sub: "도전으로 보너스 획득", bg: "#FEF9C3", color: "#A16207" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#fff", borderRadius: 16, padding: "18px 16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                width: 150, textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: 13, background: item.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 10px",
                }}
              >
                <Icon name={item.icon} size={22} color={item.color} stroke={2} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#13241B", marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "#6B7B72", fontWeight: 500 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 기능 소개 ── */}
      <section style={{ background: "#fff", padding: "48px 20px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#13241B", margin: "0 0 8px" }}>
              주요 기능
            </h2>
            <p style={{ fontSize: 14.5, color: "#6B7B72", margin: 0, fontWeight: 500 }}>
              숙제 관리부터 학습 분석까지, 필요한 모든 기능을 제공합니다
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#F4F8F5", borderRadius: 18, padding: "22px 18px",
                  border: "1px solid #E2EBE5",
                }}
              >
                <div
                  style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: "#DCFCE7",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <Icon name={f.icon} size={21} color="#15803D" stroke={2} />
                </div>
                <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "#13241B", margin: "0 0 6px" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13.5, color: "#6B7B72", lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 이용 방법 ── */}
      <section style={{ padding: "48px 20px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#13241B", margin: "0 0 8px" }}>
              이용 방법
            </h2>
            <p style={{ fontSize: 14.5, color: "#6B7B72", margin: 0, fontWeight: 500 }}>
              3단계로 간단하게 시작할 수 있어요
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {STEPS.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "#fff", borderRadius: 18, padding: "22px 20px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "flex-start", gap: 16,
                }}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "linear-gradient(135deg, #16A34A, #059669)",
                    color: "#fff", fontSize: 18, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {s.num}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "#13241B", margin: "0 0 5px" }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 13.5, color: "#6B7B72", lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: "#fff", padding: "48px 20px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#13241B", margin: "0 0 8px" }}>
              자주 묻는 질문
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  style={{
                    background: "#F4F8F5", borderRadius: 14,
                    border: isOpen ? "1.5px solid #BBF7D0" : "1px solid #E2EBE5",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: "100%", padding: "16px 18px",
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12, textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: "#13241B", lineHeight: 1.4 }}>
                      {faq.q}
                    </span>
                    <span
                      style={{
                        flexShrink: 0, transition: "transform .2s",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      <Icon name="chevron-down" size={18} color="#6B7B72" stroke={2} />
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 18px 16px" }}>
                      <p style={{ fontSize: 13.5, color: "#6B7B72", lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 하단 CTA ── */}
      <section style={{ padding: "48px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #16A34A, #059669)",
              borderRadius: 24, padding: "40px 24px",
              boxShadow: "0 12px 32px -8px rgba(22,163,74,.4)",
            }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>
              오늘부터 숙제 습관을 만들어보세요
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: "0 0 24px", fontWeight: 500, lineHeight: 1.6 }}>
              가입은 무료이며, 30초면 시작할 수 있습니다.
            </p>
            <button
              onClick={handleStart}
              style={{
                height: 50, padding: "0 30px", borderRadius: 13, border: "none",
                background: "#fff", color: "#15803D",
                fontSize: 15.5, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              무료로 시작하기 →
            </button>
          </div>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer style={{ borderTop: "1px solid #E2EBE5", padding: "24px 20px 32px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
            <a href="/terms" style={{ fontSize: 12.5, color: "#6B7B72", textDecoration: "none", fontWeight: 600 }}>이용약관</a>
            <a href="/privacy" style={{ fontSize: 12.5, color: "#6B7B72", textDecoration: "none", fontWeight: 600 }}>개인정보처리방침</a>
            <a href="/notices" style={{ fontSize: 12.5, color: "#6B7B72", textDecoration: "none", fontWeight: 600 }}>공지사항</a>
            <a href="/help" style={{ fontSize: 12.5, color: "#6B7B72", textDecoration: "none", fontWeight: 600 }}>도움말</a>
          </div>
          <p style={{ fontSize: 11.5, color: "#9AA8A0", margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
            © 2025 kiddoloop. 문의: contact@kiddoloop.com
          </p>
        </div>
      </footer>
    </div>
  );
}
