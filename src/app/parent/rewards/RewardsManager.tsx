"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

interface Log {
  id: string;
  type: "earn" | "spend";
  amount: number;
  note: string | null;
  created_at: string;
}

interface RewardRequest {
  id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
}

interface Props {
  pairId: string;
  childId: string;
  childName: string;
  unit: string;
  rewardName: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  logs: Log[];
  pendingRequests: RewardRequest[];
}

export default function RewardsManager({
  pairId, childId, childName, unit, rewardName,
  balance: initBalance, totalEarned: initEarned, totalSpent: initSpent,
  logs: initLogs, pendingRequests: initRequests,
}: Props) {
  const [balance, setBalance] = useState(initBalance);
  const [totalEarned, setTotalEarned] = useState(initEarned);
  const [totalSpent, setTotalSpent] = useState(initSpent);
  const [logs, setLogs] = useState<Log[]>(initLogs);
  const [requests, setRequests] = useState<RewardRequest[]>(initRequests);
  const [resolving, setResolving] = useState<string | null>(null);

  const [adjustType, setAdjustType] = useState<"earn" | "spend">("earn");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  async function handleResolve(requestId: string, action: "approved" | "rejected") {
    setResolving(requestId);
    const req = requests.find((r) => r.id === requestId);
    const res = await fetch("/api/reward-request/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (action === "approved" && req) {
        setBalance((b) => b + req.amount);
        setTotalEarned((e) => e + req.amount);
        setLogs((prev) => [{
          id: crypto.randomUUID(),
          type: "earn",
          amount: req.amount,
          note: req.reason ? `요청: ${req.reason}` : "자녀 요청 승인",
          created_at: new Date().toISOString(),
        }, ...prev]);
      }
    }
    setResolving(null);
  }

  async function handleAdjust() {
    const amt = parseInt(adjustAmount);
    if (!amt || amt <= 0) { setAdjustError("금액을 입력해주세요"); return; }
    setAdjusting(true);
    setAdjustError("");

    const res = await fetch("/api/adjust-reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pairId, childId,
        type: adjustType,
        amount: amt,
        note: adjustNote.trim() || (adjustType === "earn" ? "부모 직접 지급" : "부모 차감"),
      }),
    });

    if (res.ok) {
      const newLog: Log = {
        id: crypto.randomUUID(),
        type: adjustType,
        amount: amt,
        note: adjustNote.trim() || (adjustType === "earn" ? "부모 직접 지급" : "부모 차감"),
        created_at: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev]);
      if (adjustType === "earn") {
        setTotalEarned((e) => e + amt);
        setBalance((b) => b + amt);
      } else {
        setTotalSpent((s) => s + amt);
        setBalance((b) => b - amt);
      }
      setAdjustAmount("");
      setAdjustNote("");
    } else {
      setAdjustError("처리 중 오류가 발생했어요");
    }
    setAdjusting(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* 잔액 카드 */}
      <div
        style={{
          borderRadius: 24,
          padding: "20px 20px 18px",
          background: "linear-gradient(150deg,#FBBF24,#E5890B)",
          color: "#fff",
          boxShadow: "var(--sh-hero-gold)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -26, top: -26, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.14)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 9, position: "relative", marginBottom: 6 }}>
          <Icon name="star" size={17} color="#fff" stroke={0} fill="#fff" />
          <span style={{ fontSize: 13.5, fontWeight: 700, opacity: 0.95, whiteSpace: "nowrap" }}>
            {childName}님 잔여 {rewardName}
          </span>
        </div>
        <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em", position: "relative" }}>
          {balance.toLocaleString()}<span style={{ fontSize: 22 }}> {unit}</span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 14, position: "relative" }}>
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.8 }}>총 적립</p>
            <p style={{ fontSize: 16, fontWeight: 800 }}>{totalEarned.toLocaleString()}{unit}</p>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,.3)" }} />
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.8 }}>총 사용</p>
            <p style={{ fontSize: 16, fontWeight: 800 }}>{totalSpent.toLocaleString()}{unit}</p>
          </div>
        </div>
      </div>

      {/* 자녀 리워드 요청 */}
      {requests.length > 0 && (
        <div style={{
          background: "#fff", borderRadius: "var(--r-card)",
          padding: "16px 16px 10px", boxShadow: "var(--sh-md)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Icon name="send" size={16} color="var(--green)" stroke={2} />
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
              {childName}님의 요청
            </p>
            <span style={{
              fontSize: 11, fontWeight: 800, color: "#fff", background: "#E11D48",
              padding: "2px 7px", borderRadius: 999, marginLeft: "auto",
            }}>
              {requests.length}
            </span>
          </div>
          {requests.map((req) => (
            <div key={req.id} style={{
              padding: "12px 0", borderTop: "1px solid var(--line)",
              opacity: resolving === req.id ? 0.5 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--amber-d)" }}>
                  +{req.amount.toLocaleString()}{unit}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--faint)" }}>
                  {new Date(req.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </span>
              </div>
              {req.reason && (
                <p style={{ fontSize: 13.5, color: "var(--text-soft)", fontWeight: 600, marginBottom: 8 }}>
                  {req.reason}
                </p>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleResolve(req.id, "approved")}
                  disabled={resolving === req.id}
                  style={{
                    flex: 1, height: 38, borderRadius: 10, border: "none",
                    background: "var(--green)", color: "#fff",
                    fontWeight: 800, fontSize: 13, cursor: "pointer",
                  }}
                >
                  승인
                </button>
                <button
                  onClick={() => handleResolve(req.id, "rejected")}
                  disabled={resolving === req.id}
                  style={{
                    flex: 1, height: 38, borderRadius: 10,
                    border: "1.5px solid var(--line-strong)", background: "#fff",
                    color: "var(--muted)", fontWeight: 800, fontSize: 13, cursor: "pointer",
                  }}
                >
                  거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 수동 지급·차감 */}
      <div
        style={{
          background: "#fff", borderRadius: "var(--r-card)",
          padding: "16px 16px 18px", boxShadow: "var(--sh-md)",
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>직접 지급 · 차감</p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {(["earn", "spend"] as const).map((t) => {
            const on = adjustType === t;
            const isEarn = t === "earn";
            return (
              <button
                key={t}
                onClick={() => setAdjustType(t)}
                style={{
                  flex: 1, height: 42, borderRadius: 12, fontWeight: 800, fontSize: 14,
                  border: `2px solid ${on ? (isEarn ? "var(--green)" : "#F2607D") : "var(--line-strong)"}`,
                  background: on ? (isEarn ? "var(--green-50)" : "#FEF2F2") : "#fff",
                  color: on ? (isEarn ? "var(--green-d)" : "#E11D48") : "var(--muted)",
                  cursor: "pointer", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Icon
                  name={isEarn ? "plus" : "minus"}
                  size={16}
                  color={on ? (isEarn ? "var(--green-d)" : "#E11D48") : "var(--muted)"}
                  stroke={2.5}
                />
                {isEarn ? "지급" : "차감"}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="number"
              min={1}
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="금액"
              style={{
                width: "100%", height: 44, borderRadius: 12,
                border: "1.5px solid var(--line-strong)", padding: "0 40px 0 14px",
                fontSize: 15, fontWeight: 700, color: "var(--text)",
                outline: "none", boxSizing: "border-box",
              }}
            />
            <span
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, fontWeight: 700, color: "var(--muted)", pointerEvents: "none",
              }}
            >
              {unit}
            </span>
          </div>
        </div>

        <input
          value={adjustNote}
          onChange={(e) => setAdjustNote(e.target.value)}
          placeholder={adjustType === "earn" ? "예) 심부름 도와줌" : "예) 게임시간 30분"}
          style={{
            width: "100%", height: 44, borderRadius: 12,
            border: "1.5px solid var(--line-strong)", padding: "0 14px",
            fontSize: 14, color: "var(--text)", outline: "none",
            marginBottom: 12, boxSizing: "border-box",
          }}
        />

        {adjustError && (
          <p style={{ color: "#E11D48", fontSize: 13, marginBottom: 8 }}>{adjustError}</p>
        )}

        <button
          onClick={handleAdjust}
          disabled={adjusting || !adjustAmount}
          style={{
            width: "100%", height: 48, borderRadius: 14, border: "none",
            background: adjustType === "earn" ? "var(--green)" : "#F2607D",
            color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: adjusting || !adjustAmount ? 0.5 : 1,
            boxShadow: adjustType === "earn" ? "var(--sh-green)" : "0 6px 14px -6px rgba(242,96,125,.6)",
          }}
        >
          {adjusting ? "처리 중..." : `${adjustAmount || "0"}${unit} ${adjustType === "earn" ? "지급하기" : "차감하기"}`}
        </button>
      </div>

      {/* 내역 */}
      <div
        style={{
          background: "#fff", borderRadius: "var(--r-card)",
          padding: "16px 16px 4px", boxShadow: "var(--sh-md)",
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>내역</p>
        {logs.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--faint)", textAlign: "center", padding: "20px 0" }}>
            아직 내역이 없어요
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 0", borderBottom: "1px solid var(--line)",
              }}
            >
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
                  {log.note ?? (log.type === "earn" ? "적립" : "사용")}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>
                  {new Date(log.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span
                style={{
                  fontWeight: 800, fontSize: 14, whiteSpace: "nowrap",
                  color: log.type === "earn" ? "var(--green-d)" : "#F2607D",
                }}
              >
                {log.type === "earn" ? "+" : "-"}{log.amount.toLocaleString()}{unit}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
