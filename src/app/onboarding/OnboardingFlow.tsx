"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KiddoloopAppicon } from "@/components/ui/Logo";

type Step = "role" | "birthday" | "consent" | "parent-request" | "done";
type Role = "parent" | "child";

interface Props {
  userName: string;
  userEmail: string;
}

function calculateAge(birthday: string): number {
  const today = new Date();
  const bday = new Date(birthday);
  let age = today.getFullYear() - bday.getFullYear();
  const m = today.getMonth() - bday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
  return age;
}

const TERMS_VERSION = "v1.0";
const CURRENT_YEAR = new Date().getFullYear();

export default function OnboardingFlow({ userName, userEmail }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role>("parent");
  const [displayName, setDisplayName] = useState(userName.split(" ")[0] || userName);
  const [birthday, setBirthday] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const age = birthday ? calculateAge(birthday) : null;
  const isMinor = age !== null && age < 19;

  async function handleBirthdayNext() {
    if (!birthday) return;
    if (age! < 5) {
      setError("만 5세 이상만 가입할 수 있습니다.");
      return;
    }
    setError("");
    if (age! < 14) {
      setStep("parent-request");
    } else {
      setStep("consent");
    }
  }

  async function handleConsentComplete() {
    if (!termsAgreed || !privacyAgreed) {
      setError("이용약관 및 개인정보처리방침에 모두 동의해주세요.");
      return;
    }
    setLoading(true);
    setError("");

    if (isMinor) {
      // 미성년자: 부모 이메일 입력 단계로
      setLoading(false);
      setStep("parent-request");
      return;
    }

    // 성인: 바로 가입 완료
    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, displayName, birthday, termsAgreed, privacyAgreed }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "가입 처리 중 오류가 발생했습니다.");
      return;
    }
    router.push(`/${role}/dashboard`);
  }

  async function handleParentRequest() {
    if (!parentEmail.includes("@")) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");

    // 미성년자: 부모 승인 전 프로필 미생성, pending_approval만 생성
    const res = await fetch("/api/onboarding/request-parent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childName: displayName,
        childBirthday: birthday,
        parentEmail,
        role,
        termsAgreed,
        privacyAgreed,
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "요청 중 오류가 발생했습니다.");
      return;
    }
    setStep("done");
  }

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 20,
    padding: "24px 20px",
    boxShadow: "0 4px 20px -4px rgba(0,0,0,.10)",
    marginBottom: 16,
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    height: 54,
    borderRadius: 16,
    border: "none",
    background: "var(--green)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 6px 18px -6px rgba(22,163,74,.6)",
  };

  const btnDisabled: React.CSSProperties = { ...btnPrimary, opacity: 0.4, cursor: "default" };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "2px solid var(--line-strong)",
    padding: "0 16px",
    fontSize: 16,
    fontWeight: 600,
    color: "var(--text)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "linear-gradient(160deg, #F0FDF4 0%, #FAF9F5 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 20px 40px",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* 헤더 */}
      <div style={{ paddingTop: 56, paddingBottom: 32, textAlign: "center" }}>
        <KiddoloopAppicon size={72} />
        <div style={{ marginTop: 16, fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
          kiddoloop 시작하기
        </div>
        <div style={{ marginTop: 6, fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>
          {userEmail}
        </div>
      </div>

      {/* 스텝 인디케이터 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {(["role", "birthday", "consent"] as Step[]).map((s, i) => {
          const stepOrder: Step[] = ["role", "birthday", "consent", "parent-request", "done"];
          const currentIdx = stepOrder.indexOf(step);
          const isActive = i === Math.min(currentIdx, 2);
          const isDone = i < Math.min(currentIdx, 2);
          return (
            <div
              key={s}
              style={{
                width: isActive ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: isActive || isDone ? "var(--green)" : "var(--line-strong)",
                transition: "width .2s",
              }}
            />
          );
        })}
      </div>

      {/* ── STEP 1: 역할 선택 ── */}
      {step === "role" && (
        <div style={{ width: "100%" }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>어떤 역할로 시작할까요?</h2>
            <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, marginBottom: 20 }}>
              나중에 설정에서 변경할 수 없으니 신중하게 선택해주세요.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {(["parent", "child"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    padding: "20px 12px",
                    borderRadius: 16,
                    border: `2.5px solid ${role === r ? "var(--green)" : "var(--line)"}`,
                    background: role === r ? "var(--green-50)" : "#fff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    transition: "border-color .15s, background .15s",
                  }}
                >
                  <span style={{ fontSize: 36 }}>{r === "parent" ? "👨‍👩‍👧" : "🧒"}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                      {r === "parent" ? "부모" : "자녀"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
                      {r === "parent" ? "숙제를 등록해요" : "숙제를 완료해요"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <label style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 8 }}>
              이름
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="사용할 이름을 입력하세요"
              style={inputStyle}
            />
          </div>

          <button
            onClick={() => setStep("birthday")}
            disabled={!displayName.trim()}
            style={displayName.trim() ? btnPrimary : btnDisabled}
          >
            다음 →
          </button>
        </div>
      )}

      {/* ── STEP 2: 생년월일 ── */}
      {step === "birthday" && (
        <div style={{ width: "100%" }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>생년월일을 입력해주세요</h2>
            <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, marginBottom: 20 }}>
              만 14세 미만은 법정대리인(부모)의 동의가 필요합니다.
              <br />
              만 19세 미만(미성년자)의 경우 부모 계정과 연동됩니다.
            </p>
            <input
              type="date"
              value={birthday}
              onChange={(e) => { setBirthday(e.target.value); setError(""); }}
              max={`${CURRENT_YEAR}-12-31`}
              min="1920-01-01"
              style={inputStyle}
            />
            {birthday && age !== null && (
              <div style={{
                marginTop: 12, padding: "10px 14px", borderRadius: 12,
                background: isMinor ? "#FFF7ED" : "var(--green-50)",
                color: isMinor ? "#C2410C" : "var(--green-d)",
                fontSize: 13, fontWeight: 700,
              }}>
                {isMinor
                  ? `만 ${age}세 · 미성년자 — 부모 계정 연동이 필요합니다`
                  : `만 ${age}세 · 성인`}
              </div>
            )}
            {error && (
              <p style={{ color: "var(--red)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>{error}</p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <button onClick={() => setStep("role")} style={{ ...btnPrimary, background: "var(--line-strong)", color: "var(--text-soft)" }}>
              ← 이전
            </button>
            <button
              onClick={handleBirthdayNext}
              disabled={!birthday}
              style={birthday ? btnPrimary : btnDisabled}
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: 약관 동의 ── */}
      {step === "consent" && (
        <div style={{ width: "100%" }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>약관 동의</h2>
            {isMinor && (
              <div style={{
                padding: "10px 14px", borderRadius: 12,
                background: "#FFF7ED", color: "#92400E",
                fontSize: 13, fontWeight: 700, marginBottom: 16,
                border: "1px solid #FED7AA",
              }}>
                미성년자({age}세)로 확인되었습니다. 동의 후 부모님의 확인이 필요합니다.
              </div>
            )}

            <ConsentCheckbox
              checked={termsAgreed}
              onChange={setTermsAgreed}
              label="이용약관 동의 (필수)"
              linkText="전문 보기"
              linkHref="/terms"
            />
            <ConsentCheckbox
              checked={privacyAgreed}
              onChange={setPrivacyAgreed}
              label="개인정보처리방침 동의 (필수)"
              linkText="전문 보기"
              linkHref="/privacy"
            />

            {isMinor && (
              <div style={{
                marginTop: 16, padding: "12px 14px", borderRadius: 12,
                background: "#F0FDF4", border: "1px solid #BBF7D0",
                fontSize: 12.5, color: "var(--green-d)", fontWeight: 600, lineHeight: 1.6,
              }}>
                미성년자의 경우 부모님이 위 약관에 대해 법정대리인으로서 동의합니다.
                다음 단계에서 부모님의 이메일을 입력하면 부모님이 승인할 수 있습니다.
              </div>
            )}

            {error && (
              <p style={{ color: "var(--red)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>{error}</p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <button onClick={() => setStep("birthday")} style={{ ...btnPrimary, background: "var(--line-strong)", color: "var(--text-soft)" }}>
              ← 이전
            </button>
            <button
              onClick={handleConsentComplete}
              disabled={loading || !termsAgreed || !privacyAgreed}
              style={!loading && termsAgreed && privacyAgreed ? btnPrimary : btnDisabled}
            >
              {loading ? "처리 중..." : isMinor ? "다음 — 부모님 연결 →" : "가입 완료"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: 부모 이메일 입력 (미성년자) ── */}
      {step === "parent-request" && (
        <div style={{ width: "100%" }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>부모님 이메일 입력</h2>
            <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, marginBottom: 20, lineHeight: 1.6 }}>
              부모님의 구글 계정 이메일을 입력해주세요.
              부모님이 kiddoloop에 가입하시면 승인 요청을 확인하실 수 있습니다.
            </p>
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => { setParentEmail(e.target.value); setError(""); }}
              placeholder="부모님 구글 이메일"
              style={inputStyle}
            />
            {parentEmail === userEmail && (
              <p style={{ color: "var(--red)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
                본인 이메일은 입력할 수 없습니다.
              </p>
            )}
            {error && (
              <p style={{ color: "var(--red)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>{error}</p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <button onClick={() => setStep(age !== null && age < 14 ? "birthday" : "consent")} style={{ ...btnPrimary, background: "var(--line-strong)", color: "var(--text-soft)" }}>
              ← 이전
            </button>
            <button
              onClick={handleParentRequest}
              disabled={loading || !parentEmail.includes("@") || parentEmail === userEmail}
              style={!loading && parentEmail.includes("@") && parentEmail !== userEmail ? btnPrimary : btnDisabled}
            >
              {loading ? "요청 중..." : "승인 요청 보내기"}
            </button>
          </div>
        </div>
      )}

      {/* ── DONE: 완료 ── */}
      {step === "done" && (
        <div style={{ width: "100%", textAlign: "center" }}>
          <div style={{ ...cardStyle, padding: "36px 24px" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>
              {isMinor ? "⏳" : "🎉"}
            </div>
            {isMinor ? (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                  부모님 승인을 기다리고 있어요
                </h2>
                <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.7 }}>
                  부모님이 kiddoloop에 가입하시면
                  <br />
                  설정에서 승인 요청을 확인하실 수 있습니다.
                </p>
                <p style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600, lineHeight: 1.6, marginTop: 16 }}>
                  요청은 7일 후 만료됩니다.
                </p>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                  가입이 완료되었어요!
                </h2>
                <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.7 }}>
                  kiddoloop에 오신 것을 환영합니다.
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => router.push(`/${role}/dashboard`)}
            style={btnPrimary}
          >
            시작하기 →
          </button>
        </div>
      )}
    </div>
  );
}

function ConsentCheckbox({
  checked, onChange, label, linkText, linkHref,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  linkText: string;
  linkHref: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          border: `2px solid ${checked ? "var(--green)" : "var(--line-strong)"}`,
          background: checked ? "var(--green)" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
        {label}
      </span>
      <a
        href={linkHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--green-d)",
          whiteSpace: "nowrap",
          textDecoration: "underline",
        }}
      >
        {linkText}
      </a>
    </div>
  );
}
