"use client";

import { useEffect, useState } from "react";

interface Summary {
  pairId: string;
  parentName: string;
  childName: string;
  rewardName: string;
  unit: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface Log {
  id: string;
  type: "earn" | "spend";
  amount: number;
  note: string | null;
  created_at: string;
}

export default function RewardsView() {
  const [summary, setSummary] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Summary | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [adjType, setAdjType] = useState<"earn" | "spend">("earn");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjNote, setAdjNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/rewards")
      .then((r) => r.json())
      .then((d) => { setSummary(d.summary ?? []); setLoading(false); });
  }, []);

  async function selectPair(s: Summary) {
    setSelected(s);
    setLogsLoading(true);
    const res = await fetch(`/api/admin/rewards?pairId=${s.pairId}`);
    const d = await res.json();
    setLogs(d.logs ?? []);
    setLogsLoading(false);
  }

  async function handleAdjust() {
    if (!selected || !adjAmount) return;
    setAdjusting(true);
    const res = await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pairId: selected.pairId,
        type: adjType,
        amount: parseInt(adjAmount),
        note: adjNote.trim() || undefined,
      }),
    });
    if (res.ok) {
      const newLog: Log = {
        id: crypto.randomUUID(),
        type: adjType,
        amount: parseInt(adjAmount),
        note: adjNote.trim() || (adjType === "earn" ? "어드민 지급" : "어드민 차감"),
        created_at: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev]);
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              balance: prev.balance + (adjType === "earn" ? parseInt(adjAmount) : -parseInt(adjAmount)),
              totalEarned: adjType === "earn" ? prev.totalEarned + parseInt(adjAmount) : prev.totalEarned,
              totalSpent: adjType === "spend" ? prev.totalSpent + parseInt(adjAmount) : prev.totalSpent,
            }
          : null
      );
      setAdjAmount("");
      setAdjNote("");
    } else alert("조정 실패");
    setAdjusting(false);
  }

  return (
    <div style={{ display: "flex", gap: 24, height: "100%" }}>
      {/* Left: pair list */}
      <div style={{ width: 300, flexShrink: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>리워드 관리</h1>
        {loading ? (
          <p style={{ color: "#94A3B8" }}>불러오는 중...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {summary.map((s) => (
              <button
                key={s.pairId}
                onClick={() => selectPair(s)}
                style={{
                  width: "100%", textAlign: "left", padding: "14px 16px",
                  borderRadius: 10, border: `2px solid ${selected?.pairId === s.pairId ? "#0EA5E9" : "#E2E8F0"}`,
                  background: selected?.pairId === s.pairId ? "#F0F9FF" : "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                  {s.childName} <span style={{ color: "#94A3B8", fontWeight: 500 }}>({s.parentName})</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>
                  {s.balance.toLocaleString()}{s.unit}
                </div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
                  적립 {s.totalEarned.toLocaleString()} · 사용 {s.totalSpent.toLocaleString()}
                </div>
              </button>
            ))}
            {summary.length === 0 && <p style={{ color: "#94A3B8" }}>데이터 없음</p>}
          </div>
        )}
      </div>

      {/* Right: detail + adjustment */}
      {selected ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Header */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
              {selected.childName}
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <Stat label="잔액" value={`${selected.balance.toLocaleString()}${selected.unit}`} accent />
              <Stat label="총 적립" value={`${selected.totalEarned.toLocaleString()}${selected.unit}`} />
              <Stat label="총 사용" value={`${selected.totalSpent.toLocaleString()}${selected.unit}`} />
            </div>
          </div>

          {/* Adjust panel */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>리워드 조정</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {(["earn", "spend"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAdjType(t)}
                  style={{
                    flex: 1, height: 38, borderRadius: 8, fontWeight: 700, fontSize: 13,
                    border: `2px solid ${adjType === t ? (t === "earn" ? "#16A34A" : "#E11D48") : "#E2E8F0"}`,
                    background: adjType === t ? (t === "earn" ? "#F0FDF4" : "#FFF1F2") : "#fff",
                    color: adjType === t ? (t === "earn" ? "#15803D" : "#E11D48") : "#64748B",
                    cursor: "pointer",
                  }}
                >
                  {t === "earn" ? "지급" : "차감"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
                placeholder={`금액 (${selected.unit})`}
                style={{
                  flex: 1, height: 38, borderRadius: 8,
                  border: "1.5px solid #E2E8F0", padding: "0 12px",
                  fontSize: 13, color: "#0F172A", outline: "none",
                }}
              />
              <input
                value={adjNote}
                onChange={(e) => setAdjNote(e.target.value)}
                placeholder="사유 (선택)"
                style={{
                  flex: 2, height: 38, borderRadius: 8,
                  border: "1.5px solid #E2E8F0", padding: "0 12px",
                  fontSize: 13, color: "#0F172A", outline: "none",
                }}
              />
              <button
                onClick={handleAdjust}
                disabled={adjusting || !adjAmount}
                style={{
                  padding: "0 18px", height: 38, borderRadius: 8, border: "none",
                  background: adjType === "earn" ? "#16A34A" : "#E11D48",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", opacity: !adjAmount ? 0.5 : 1,
                }}
              >
                {adjusting ? "처리 중" : "적용"}
              </button>
            </div>
          </div>

          {/* Log */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", flex: 1, overflowY: "auto" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>내역</p>
            {logsLoading ? (
              <p style={{ color: "#94A3B8" }}>불러오는 중...</p>
            ) : logs.length === 0 ? (
              <p style={{ color: "#94A3B8" }}>내역 없음</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{log.note ?? (log.type === "earn" ? "적립" : "사용")}</p>
                    <p style={{ fontSize: 11.5, color: "#94A3B8" }}>{fmtDateTime(log.created_at)}</p>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 13, color: log.type === "earn" ? "#15803D" : "#E11D48" }}>
                    {log.type === "earn" ? "+" : "-"}{log.amount.toLocaleString()}{selected.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 14 }}>
          왼쪽에서 페어를 선택하세요
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 11.5, color: "#64748B" }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, color: accent ? "#F59E0B" : "#0F172A" }}>{value}</p>
    </div>
  );
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
