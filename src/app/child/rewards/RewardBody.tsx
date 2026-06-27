"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface PendingRequest {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

interface Props {
  childName: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  logs: LogItem[];
  catalog: CatalogItem[];
  pairId: string;
  unit: string;
  rewardName: string;
  pendingRequests: PendingRequest[];
}

export default function RewardBody({
  childName, balance, totalEarned, totalSpent,
  logs, catalog, pairId, unit, rewardName, pendingRequests,
}: Props) {
  const router = useRouter();
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [localBalance, setLocalBalance] = useState(balance);
  const [localEarned, setLocalEarned] = useState(totalEarned);
  const [localSpent, setLocalSpent] = useState(totalSpent);
  const [localLogs, setLocalLogs] = useState(logs);
  const [toast, setToast] = useState("");

  const [reqAmount, setReqAmount] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const [showAllHistory, setShowAllHistory] = useState(false);
  const displayLogs = showAllHistory ? localLogs : localLogs.slice(0, 10);

  const nextTarget = catalog
    .filter((c) => c.cost > localBalance)
    .sort((a, b) => a.cost - b.cost)[0] ?? null;
  const progressPct = nextTarget
    ? Math.min(100, Math.round((localBalance / nextTarget.cost) * 100))
    : 100;

  async function handleRequest() {
    const amt = parseInt(reqAmount) || 0;
    if (amt <= 0) return;
    setRequesting(true);
    const res = await fetch("/api/reward-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, amount: amt, reason: reqReason.trim() }),
    });
    if (res.ok) {
      setToast(`${amt}${unit} 요청 완료!`);
      setTimeout(() => setToast(""), 3000);
      setShowRequestForm(false);
      setReqAmount("");
      setReqReason("");
      router.refresh();
    }
    setRequesting(false);
  }

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
      setLocalSpent((s) => s + item.cost);
      setLocalLogs((prev) => [{
        id: crypto.randomUUID(),
        type: "spend",
        amount: item.cost,
        note: `${item.title} 교환`,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setToast(`${item.emoji} ${item.title} 교환 완료!`);
      setTimeout(() => setToast(""), 3000);
    }
    setRedeeming(null);
  }

  return (
    <>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 2px 14px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>리워드</h1>
      </div>

      {/* 잔액 히어로 */}
      <div
        style={{
          borderRadius: 24, padding: "20px 20px 18px",
          color: "#fff", position: "relative", overflow: "hidden",
          background: "linear-gradient(150deg,#FBBF24,#E5890B)",
          boxShadow: "var(--sh-hero-gold)", marginBottom: 14,
        }}
      >
        <div style={{ position: "absolute", right: -26, top: -26, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.14)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 9, position: "relative", marginBottom: 6 }}>
          <Icon name="star" size={17} color="#fff" stroke={0} fill="#fff" />
          <span style={{ fontSize: 13.5, fontWeight: 700, opacity: 0.95, whiteSpace: "nowrap" }}>
            {childName}님이 모은 {rewardName}
          </span>
        </div>
        <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em", position: "relative" }}>
          {localBalance.toLocaleString()}<span style={{ fontSize: 22 }}> {unit}</span>
        </div>

        {/* 총 적립 / 총 사용 */}
        <div style={{ display: "flex", gap: 16, marginTop: 14, position: "relative" }}>
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.8 }}>총 적립</p>
            <p style={{ fontSize: 16, fontWeight: 800 }}>{localEarned.toLocaleString()}{unit}</p>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,.3)" }} />
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.8 }}>총 사용</p>
            <p style={{ fontSize: 16, fontWeight: 800 }}>{localSpent.toLocaleString()}{unit}</p>
          </div>
        </div>

        {/* 다음 리워드 진행 바 */}
        {nextTarget ? (
          <div style={{ position: "relative", marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
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
            모든 리워드를 교환할 수 있어요!
          </div>
        ) : null}
      </div>

      {/* 리워드 조르기 */}
      <div style={{
        background: "#fff", borderRadius: "var(--r-card)",
        boxShadow: "var(--sh-md)", marginBottom: 14, overflow: "hidden",
      }}>
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          style={{
            width: "100%", height: 52, border: "none",
            background: showRequestForm ? "var(--surface-2)" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="send" size={18} color="var(--green-d)" stroke={2} />
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text)" }}>
              {rewardName} 조르기
            </span>
          </div>
          <Icon name={showRequestForm ? "chevron-up" : "chevron-down"} size={18} color="var(--muted)" stroke={2} />
        </button>

        {showRequestForm && (
          <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--line)" }}>
            <p style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, margin: "12px 0 10px" }}>
              부모님에게 {rewardName}를 요청할 수 있어요
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ position: "relative", flex: "0 0 100px" }}>
                <input
                  type="number"
                  min={1}
                  value={reqAmount}
                  onChange={(e) => setReqAmount(e.target.value)}
                  placeholder="금액"
                  style={{
                    width: "100%", height: 44, borderRadius: 10,
                    border: "1.5px solid var(--line-strong)", padding: "0 30px 0 12px",
                    fontSize: 16, fontWeight: 800, color: "var(--text)", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 13, fontWeight: 800, color: "var(--amber-d)", pointerEvents: "none",
                }}>{unit}</span>
              </div>
              <input
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                placeholder="이유 (예: 시험 잘 봤어요)"
                style={{
                  flex: 1, height: 44, borderRadius: 10,
                  border: "1.5px solid var(--line-strong)", padding: "0 12px",
                  fontSize: 13.5, fontWeight: 600, color: "var(--text)", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={handleRequest}
              disabled={requesting || !reqAmount || parseInt(reqAmount) <= 0}
              style={{
                width: "100%", height: 44, borderRadius: 10, border: "none",
                background: reqAmount && parseInt(reqAmount) > 0 ? "var(--green)" : "var(--line-strong)",
                color: reqAmount && parseInt(reqAmount) > 0 ? "#fff" : "var(--faint)",
                fontWeight: 800, fontSize: 14, cursor: "pointer",
                opacity: requesting ? 0.6 : 1,
              }}
            >
              {requesting ? "요청 중..." : "요청 보내기"}
            </button>
          </div>
        )}
      </div>

      {/* 대기 중인 요청 */}
      {pendingRequests.length > 0 && (
        <div style={{
          background: "#fff", borderRadius: "var(--r-card)",
          padding: "14px 16px", boxShadow: "var(--sh-sm)", marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Icon name="clock" size={15} color="var(--amber-d)" stroke={2} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--amber-d)" }}>
              대기 중인 요청
            </span>
            <span style={{
              fontSize: 11, fontWeight: 800, color: "#fff", background: "var(--amber)",
              padding: "2px 7px", borderRadius: 999, marginLeft: "auto",
            }}>
              {pendingRequests.length}
            </span>
          </div>
          {pendingRequests.map((req) => (
            <div key={req.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 0", borderTop: "1px solid var(--line)",
            }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--green-d)" }}>
                  +{req.amount.toLocaleString()}{unit}
                </span>
                {req.reason && (
                  <p style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
                    {req.reason}
                  </p>
                )}
              </div>
              <span style={{
                fontSize: 11.5, fontWeight: 700, color: "var(--amber-d)",
                background: "var(--amber-50)", padding: "3px 8px", borderRadius: 6,
                whiteSpace: "nowrap",
              }}>
                승인 대기
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 리워드 교환 */}
      {catalog.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "6px 4px 13px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>리워드 교환</h2>
          </div>

          {catalog.map((item) => {
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
                    <span style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: locked ? "#F1F5F2" : "var(--amber-50)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                    }}>
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
                    <span style={{
                      display: "flex", alignItems: "center", gap: 4,
                      color: "var(--faint)", fontWeight: 800, fontSize: 12.5, whiteSpace: "nowrap",
                    }}>
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
          })}
        </>
      )}

      {catalog.length === 0 && (
        <div style={{
          background: "#fff", borderRadius: "var(--r-card)",
          padding: "32px 16px", textAlign: "center", boxShadow: "var(--sh-sm)", marginBottom: 14,
        }}>
          <div style={{
            width: 88, height: 88, borderRadius: 26, background: "#E9F4EC",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
          }}>
            <Icon name="gift" size={46} color="#9DB3A6" stroke={1.9} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 800, color: "#13241B" }}>리워드가 아직 없어요</p>
          <p style={{ fontSize: 13.5, color: "#7B8A81", marginTop: 6, lineHeight: 1.6 }}>
            부모님이 리워드를 등록하면 여기서 포인트로 교환할 수 있어요
          </p>
        </div>
      )}

      {/* 적립/사용 내역 */}
      <div style={{
        background: "#fff", borderRadius: "var(--r-card)",
        padding: "16px 16px 4px", boxShadow: "var(--sh-md)", marginTop: 6,
      }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>
          적립 · 사용 내역
        </p>
        {localLogs.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--faint)", textAlign: "center", padding: "20px 0" }}>
            아직 내역이 없어요
          </p>
        ) : (
          <>
            {displayLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 0", borderBottom: "1px solid var(--line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: log.type === "earn" ? "var(--green-50)" : "#FEF2F2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon
                      name={log.type === "earn" ? "plus" : "minus"}
                      size={14}
                      color={log.type === "earn" ? "var(--green-d)" : "#E11D48"}
                      stroke={2.5}
                    />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: 13.5, fontWeight: 600, color: "var(--text)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {log.note ?? (log.type === "earn" ? "적립" : "사용")}
                    </p>
                    <p style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>
                      {new Date(log.created_at).toLocaleDateString("ko-KR", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span style={{
                  fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", marginLeft: 8,
                  color: log.type === "earn" ? "var(--green-d)" : "#F2607D",
                }}>
                  {log.type === "earn" ? "+" : "-"}{log.amount.toLocaleString()}{unit}
                </span>
              </div>
            ))}
            {localLogs.length > 10 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                style={{
                  width: "100%", padding: "12px 0", background: "none", border: "none",
                  color: "var(--green-d)", fontWeight: 700, fontSize: 13.5, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >
                {showAllHistory ? "접기" : `전체 내역 보기 (${localLogs.length}건)`}
                <Icon name={showAllHistory ? "chevron-up" : "chevron-down"} size={14} color="var(--green-d)" stroke={2} />
              </button>
            )}
          </>
        )}
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "var(--text)", color: "#fff",
          padding: "12px 20px", borderRadius: 999,
          fontSize: 13.5, fontWeight: 700, boxShadow: "var(--sh-md)", whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
