"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/ui/Icon";

const CONSENT_ITEMS = [
  "모든 숙제·검사·리워드·미션 데이터가 즉시 영구 삭제되며, 복구할 수 없습니다.",
  "보유 중인 리워드 포인트가 모두 소멸됩니다.",
  "연결된 자녀/부모 계정과의 페어링이 해제됩니다.",
  "동일 계정으로 재가입하더라도 이전 데이터는 복원되지 않습니다.",
];

export default function AccountDeletionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [consents, setConsents] = useState<boolean[]>(CONSENT_ITEMS.map(() => false));
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [doneType, setDoneType] = useState<"deleted" | "requested">("deleted");
  const [error, setError] = useState<string | null>(null);
  const [alreadyRequested, setAlreadyRequested] = useState(false);

  const allConsented = consents.every(Boolean);

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { setLoading(false); return; }
      setUser({ id: u.id, email: u.email ?? undefined });

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", u.id)
        .single();
      setRole(profile?.role ?? null);

      if (profile?.role === "child") {
        const { data: pending } = await supabase
          .from("withdrawal_requests")
          .select("id")
          .eq("child_id", u.id)
          .eq("status", "pending");
        if (pending && pending.length > 0) setAlreadyRequested(true);
      }

      setLoading(false);
    })();
  }, [supabase]);

  function toggleConsent(idx: number) {
    setConsents((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  }

  async function handleParentWithdraw() {
    setProcessing(true);
    setError(null);
    const res = await fetch("/api/account-delete", { method: "POST" });
    if (!res.ok) {
      setError("탈퇴 처리에 실패했습니다. 다시 시도해주세요.");
      setProcessing(false);
      return;
    }
    await supabase.auth.signOut();
    setDoneType("deleted");
    setDone(true);
    setProcessing(false);
  }

  async function handleChildRequest() {
    setProcessing(true);
    setError(null);
    const res = await fetch("/api/withdrawal-request", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "요청에 실패했습니다. 다시 시도해주세요.");
      setProcessing(false);
      return;
    }
    setDoneType("requested");
    setDone(true);
    setProcessing(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F7F3" }}>
        <div style={{ width: 32, height: 32, border: "3px solid var(--green)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      </div>
    );
  }

  if (done) {
    const isRequest = doneType === "requested";
    return (
      <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: "40px 28px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: isRequest ? "#EFF6FF" : "#E9F4EC", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icon name={isRequest ? "send" : "check"} size={32} color={isRequest ? "#2563EB" : "var(--green)"} stroke={2.5} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>
            {isRequest ? "탈퇴 요청이 전달되었습니다" : "탈퇴가 완료되었습니다"}
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>
            {isRequest
              ? "부모님(법정대리인)이 승인하면\n계정과 모든 데이터가 삭제됩니다."
              : "모든 데이터가 즉시 삭제되었습니다.\n이용해 주셔서 감사합니다."}
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              width: "100%", height: 48, borderRadius: 14, border: "none",
              background: "var(--green)", color: "#fff",
              fontWeight: 800, fontSize: 15, cursor: "pointer",
            }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100svh", background: "#F1F7F3", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 14 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon name="arrow-left" size={23} color="var(--text)" stroke={2.2} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>회원 탈퇴</h1>
        </div>
      </div>

      <div style={{ padding: "0 20px 40px" }}>
        {/* 삭제되는 데이터 안내 */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "20px",
          boxShadow: "0 1px 6px rgba(0,0,0,.06)", marginBottom: 16,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 14 }}>삭제되는 데이터</h3>
          {([
            ["user", "계정 정보 (이메일, 이름, 프로필)"],
            ["calendar", "숙제 등록·완료 이력"],
            ["gift", "리워드 적립·사용 내역"],
            ["target", "미션 달성 기록"],
            ["bar-chart-2", "학습 통계 데이터"],
            ["link", "부모-자녀 연결 정보"],
          ] as const).map(([icon, label]) => (
            <div key={icon} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <Icon name={icon} size={18} color="var(--muted)" stroke={2} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{label}</span>
            </div>
          ))}
          <p style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600, marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>
            서버 접속 로그(IP, 접속 시간)는 호스팅 인프라에서 3개월간 자동 관리 후 파기됩니다.
            그 외 모든 서비스 데이터는 탈퇴 즉시 영구 삭제됩니다.
          </p>
        </div>

        {/* 로그인 상태별 분기 */}
        {!user ? (
          <div style={{
            background: "#fff", borderRadius: 16, padding: "24px 20px",
            boxShadow: "0 1px 6px rgba(0,0,0,.06)", textAlign: "center",
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              회원 탈퇴를 원하시나요?
            </p>
            <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.6, marginBottom: 16 }}>
              로그인 후 이 페이지에서 직접 탈퇴하거나,<br />
              <b>contact@kiddoloop.com</b>으로 이메일을 보내주세요.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              style={{
                width: "100%", height: 48, borderRadius: 14, border: "none",
                background: "var(--green)", color: "#fff",
                fontWeight: 800, fontSize: 14, cursor: "pointer",
              }}
            >
              로그인하기
            </button>
          </div>
        ) : role === "child" && alreadyRequested ? (
          <div style={{
            background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 16,
            padding: "24px 20px", textAlign: "center",
          }}>
            <Icon name="clock" size={36} color="#2563EB" stroke={2} />
            <p style={{ fontSize: 16, fontWeight: 800, color: "#1D4ED8", marginTop: 12, marginBottom: 8 }}>
              탈퇴 요청 대기 중
            </p>
            <p style={{ fontSize: 14, color: "#3B82F6", fontWeight: 600, lineHeight: 1.6 }}>
              부모님(법정대리인)에게 탈퇴 요청이<br />전달된 상태입니다.
            </p>
          </div>
        ) : (
          <>
            {/* 자녀 안내 배너 */}
            {role === "child" && (
              <div style={{
                background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 16,
                padding: "16px 18px", marginBottom: 16,
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <span style={{ flexShrink: 0, marginTop: 2 }}><Icon name="info" size={20} color="#D97706" stroke={2} /></span>
                <p style={{ fontSize: 13.5, color: "#92400E", fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                  자녀 계정은 <b>부모님(법정대리인)의 승인</b> 후 탈퇴가 처리됩니다. 아래 동의 후 요청하면 부모님에게 승인 요청이 전달됩니다.
                </p>
              </div>
            )}

            {/* 동의 항목 */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "20px",
              boxShadow: "0 1px 6px rgba(0,0,0,.06)", marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 14 }}>탈퇴 동의 항목</h3>
              {CONSENT_ITEMS.map((text, idx) => (
                <label
                  key={idx}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 0", borderBottom: idx < CONSENT_ITEMS.length - 1 ? "1px solid var(--line)" : "none",
                    cursor: "pointer",
                  }}
                >
                  <div
                    onClick={() => toggleConsent(idx)}
                    style={{
                      width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginTop: 1,
                      border: consents[idx] ? "none" : "2px solid #D1D5DB",
                      background: consents[idx] ? "#E11D48" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .15s",
                    }}
                  >
                    {consents[idx] && <Icon name="check" size={16} color="#fff" stroke={3} />}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.6 }}>{text}</span>
                </label>
              ))}
            </div>

            {/* 이메일 표시 */}
            <div style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, textAlign: "center", marginBottom: 12 }}>
              <b>{user.email}</b> 계정{role === "child" ? " · 자녀" : " · 부모"}
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#E11D48", fontWeight: 700, textAlign: "center", marginBottom: 8 }}>{error}</p>
            )}

            {/* 탈퇴 버튼 */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!allConsented}
              style={{
                width: "100%", height: 52, borderRadius: 14, border: "none",
                background: allConsented ? "#E11D48" : "#E5E7EB",
                color: allConsented ? "#fff" : "#9CA3AF",
                fontWeight: 800, fontSize: 15, cursor: allConsented ? "pointer" : "not-allowed",
                transition: "all .2s",
              }}
            >
              {role === "child" ? "탈퇴 요청하기" : "회원 탈퇴하기"}
            </button>

            {!allConsented && (
              <p style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600, textAlign: "center", marginTop: 8 }}>
                모든 항목에 동의해야 {role === "child" ? "요청" : "탈퇴"}할 수 있습니다
              </p>
            )}
          </>
        )}
      </div>

      {/* 최종 확인 모달 */}
      {showConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,.45)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={() => !processing && setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 24, padding: "28px 24px 22px",
              width: "100%", maxWidth: 320, boxShadow: "var(--sh-md)",
              textAlign: "center",
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icon name={role === "child" ? "send" : "user-x"} size={28} color="#E11D48" stroke={2} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
              {role === "child" ? "탈퇴를 요청하시겠어요?" : "정말 탈퇴하시겠어요?"}
            </p>
            <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>
              {role === "child"
                ? "부모님이 승인하면 계정과\n모든 데이터가 삭제됩니다."
                : "모든 데이터가 즉시 영구 삭제되며\n복구할 수 없습니다."}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={processing}
                style={{
                  flex: 1, height: 46, borderRadius: 14,
                  border: "1.5px solid var(--line-strong)", background: "#fff",
                  color: "var(--text-soft)", fontWeight: 800, fontSize: 14, cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={role === "child" ? handleChildRequest : handleParentWithdraw}
                disabled={processing}
                style={{
                  flex: 1, height: 46, borderRadius: 14, border: "none",
                  background: "#E11D48", color: "#fff",
                  fontWeight: 800, fontSize: 14, cursor: "pointer",
                  opacity: processing ? 0.6 : 1,
                }}
              >
                {processing
                  ? (role === "child" ? "요청 중..." : "탈퇴 중...")
                  : (role === "child" ? "요청하기" : "탈퇴하기")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
