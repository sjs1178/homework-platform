"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

interface LogItem {
  id: string;
  type: "earn" | "spend";
  amount: number;
  note: string | null;
  created_at: string;
}

interface CatalogItem {
  id: string;
  emoji: string;
  title: string;
  cost: number;
}

interface Props {
  childName: string;
  balance: number;
  logs: LogItem[];
  catalog: CatalogItem[];
  pairId: string;
  unit: string;
}

export default function RewardBody({ childName, balance, logs, catalog, pairId, unit }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [localBalance, setLocalBalance] = useState(balance);
  const [localLogs, setLocalLogs] = useState(logs);
  const [toast, setToast] = useState("");

  // 다음 교환 가능 리워드 (잔액 부족한 것 중 가장 가까운 것)
  const nextTarget = catalog
    .filter((c) => c.cost > localBalance)
    .sort((a, b) => a.cost - b.cost)[0] ?? null;
  const progressPct = nextTarget
    ? Math.min(100, Math.round((localBalance / nextTarget.cost) * 100))
    : 100;

  async function handleRedeem(item: CatalogItem) {
    if (localBalance < item.cost) return;
    if (!confirm(`"${item.title}"을(를) ${item.cost}${unit}으로 교환할까요?`)) return;
    setRedeeming(item.id);

    const res = await fetch("/api/redeem-reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, catalogId: item.id, cost: item.cost }),
    });

    if (res.ok) {
      setLocalBalance((b) => b - item.cost);
      setLocalLogs((prev) => [
        {
          id: crypto.randomUUID(),
          type: "spend",
          amount: item.cost,
          note: `${item.title} 교환`,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setToast(`${item.emoji} ${item.title} 교환 완료!`);
      setTimeout(() => setToast(""), 3000);
    }
    setRedeeming(null);
  }

  return (
    <>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 2px 14px",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>리워드</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "none", border: "none",
            color: "var(--muted)", fontWeight: 700, fontSize: 13.5,
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          <Icon name="clock" size={15} color="var(--muted)" stroke={2} />
          적립 내역
        </button>
      </div>

      {/* 골드 잔액 히어로 */}
      <div
        style={{
          borderRadius: 24,
          padding: "20px 20px 18px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(150deg,#FBBF24,#E5890B)",
          boxShadow: "var(--sh-hero-gold)",
          marginBottom: 22,
        }}
      >
        <div
          style={{
            position: "absolute", right: -26, top: -26,
            width: 110, height: 110, borderRadius: "50%",
            background: "rgba(255,255,255,.14)",
            pointerEvents: "none",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 9, position: "relative", marginBottom: 6 }}>
          <Icon name="star" size={17} color="#fff" stroke={0} fill="#fff" />
          <span style={{ fontSize: 13.5, fontWeight: 700, opacity: 0.95, whiteSpace: "nowrap" }}>
            {childName}님이 모은 포인트
          </span>
        </div>
        <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em", position: "relative" }}>
          {localBalance.toLocaleString()}<span style={{ fontSize: 22 }}> {unit}</span>
        </div>

        {/* 다음 리워드 진행 바 */}
        {nextTarget ? (
          <div style={{ position: "relative", marginTop: 14 }}>
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 7,
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.95, whiteSpace: "nowrap" }}>
                다음 리워드 · {nextTarget.emoji} {nextTarget.title}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                {(nextTarget.cost - localBalance).toLocaleString()}{unit} 남음
              </span>
            </div>
            <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,.3)", overflow: "hidden" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", borderRadius: 999, background: "#fff" }} />
            </div>
          </div>
        ) : catalog.length > 0 ? (
          <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
            모든 리워드를 교환할 수 있어요! 🎉
          </div>
        ) : null}
      </div>

      {/* 적립 내역 (토글) */}
      {showHistory && (
        <div
          style={{
            background: "#fff", borderRadius: "var(--r-card)",
            padding: "15px 16px", boxShadow: "var(--sh-md)", marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>적립 내역</p>
          {localLogs.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "var(--faint)", textAlign: "center", padding: "16px 0" }}>
              아직 내역이 없어요
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {localLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 0", borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
                      {log.note ?? (log.type === "earn" ? "적립" : "사용")}
                    </p>
                    <p style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>
                      {new Date(log.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span
                    style={{
                      fontWeight: 800, fontSize: 14,
                      color: log.type === "earn" ? "var(--green-d)" : "#F2607D",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {log.type === "earn" ? "+" : "-"}{log.amount.toLocaleString()}{unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 리워드 교환 */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          margin: "0 4px 13px",
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>리워드 교환</h2>
        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, whiteSpace: "nowrap" }}>
          부모가 등록
        </span>
      </div>

      {catalog.length === 0 ? (
        <div
          style={{
            background: "#fff", borderRadius: "var(--r-card)",
            padding: "32px 16px", textAlign: "center",
            boxShadow: "var(--sh-sm)",
          }}
        >
          <div style={{
            width: 88, height: 88, borderRadius: 26, background: "#E9F4EC",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <Icon name="gift" size={46} color="#9DB3A6" stroke={1.9} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 800, color: "#13241B" }}>
            리워드가 아직 없어요
          </p>
          <p style={{ fontSize: 13.5, color: "#7B8A81", marginTop: 6, lineHeight: 1.6 }}>
            부모가 리워드를 등록하면 여기서 포인트로 교환할 수 있어요
          </p>
        </div>
      ) : (
        catalog.map((item) => {
          const locked = localBalance < item.cost;
          return (
            <div
              key={item.id}
              style={{
                background: "#fff", borderRadius: "var(--r-card)",
                padding: "13px 14px", marginBottom: 11,
                boxShadow: "var(--sh-sm)", opacity: locked ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <span
                    style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: locked ? "#F1F5F2" : "var(--amber-50)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24,
                    }}
                  >
                    {item.emoji}
                  </span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", color: "var(--text)" }}>
                      {item.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <Icon name="star" size={13} color="var(--amber-d)" stroke={0} fill="var(--amber-d)" />
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--amber-d)", whiteSpace: "nowrap" }}>
                        {item.cost.toLocaleString()}{unit}
                      </span>
                    </div>
                  </div>
                </div>

                {locked ? (
                  <span
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      color: "var(--faint)", fontWeight: 800, fontSize: 12.5, whiteSpace: "nowrap",
                    }}
                  >
                    <Icon name="lock" size={13} color="var(--faint)" stroke={2.2} />
                    {(item.cost - localBalance).toLocaleString()}{unit} 부족
                  </span>
                ) : (
                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={redeeming === item.id}
                    style={{
                      height: 38, padding: "0 17px", borderRadius: 11, border: "none",
                      background: "var(--amber)", color: "#fff",
                      fontWeight: 800, fontSize: 14, cursor: "pointer",
                      boxShadow: "0 6px 14px -6px rgba(245,158,11,.7)",
                      whiteSpace: "nowrap", opacity: redeeming === item.id ? 0.6 : 1,
                    }}
                  >
                    {redeeming === item.id ? "..." : "교환"}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {toast && (
        <div
          style={{
            position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
            background: "var(--text)", color: "#fff",
            padding: "12px 20px", borderRadius: 999,
            fontSize: 13.5, fontWeight: 700, boxShadow: "var(--sh-md)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
