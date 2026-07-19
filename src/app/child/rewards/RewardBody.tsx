"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import {
  balanceOf, usageLogs, CATEGORIES, CATEGORY_EMOJI,
  type CurrencyConfig, type LedgerLog, type RewardKind,
} from "@/lib/reward";
import { getKSTWeekRange, getKSTYearMonth } from "@/lib/date";

interface LogItem extends LedgerLog {
  id: string;
  note: string | null;
  created_at: string;
}

interface CatalogItem { id: string; emoji: string; title: string; cost: number }
interface PendingRequest { id: string; amount: number; reason: string | null; created_at: string }
interface GoalRow {
  daily_limit: number | null; weekly_limit: number | null;
  monthly_budget: number | null; saving_goal: number | null;
}

interface Props {
  childName: string;
  pairId: string;
  currencies: CurrencyConfig[];
  logs: LogItem[];
  goals: Record<string, GoalRow>;
  catalog: CatalogItem[];
  pendingRequests: PendingRequest[];
}

function kstDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export default function RewardBody({
  childName, pairId, currencies, logs, goals, catalog, pendingRequests,
}: Props) {
  const router = useRouter();
  const [kind, setKind] = useState<RewardKind>(currencies[0]?.kind ?? "money");
  const [localLogs, setLocalLogs] = useState<LogItem[]>(logs);
  const [toast, setToast] = useState("");
  const [showAllHistory, setShowAllHistory] = useState(false);

  // 사용 기록 시트
  const [sheetOpen, setSheetOpen] = useState(false);
  const [useAmount, setUseAmount] = useState("");
  const [useCategory, setUseCategory] = useState("");
  const [useNote, setUseNote] = useState("");
  const [saving, setSaving] = useState(false);

  // 조르기
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqAmount, setReqAmount] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [requesting, setRequesting] = useState(false);

  const [redeeming, setRedeeming] = useState<string | null>(null);

  const cur = currencies.find((c) => c.kind === kind) ?? currencies[0];
  const isPrimary = currencies[0]?.kind === kind;
  const isTime = kind === "time";
  const { earned, spent, balance } = balanceOf(localLogs, kind);
  const goal = goals[kind];

  // 기간 사용량 (시간=이번 주 / 용돈=이번 달)
  const { mondayStr, sundayStr } = getKSTWeekRange();
  const { year, month } = getKSTYearMonth();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const periodUsed = usageLogs(localLogs, kind)
    .filter((l) => {
      const d = kstDate(l.created_at!);
      return isTime ? d >= mondayStr && d <= sundayStr : d.startsWith(monthPrefix);
    })
    .reduce((s, l) => s + l.amount, 0);
  const limit = isTime ? goal?.weekly_limit : goal?.monthly_budget;
  const limitPct = limit && limit > 0 ? Math.min(100, Math.round((periodUsed / limit) * 100)) : 0;
  const over = !!(limit && periodUsed > limit);

  const kindLogs = localLogs.filter((l) => (l.reward_type ?? "point") === (isTime ? "time" : "point"));
  const displayLogs = showAllHistory ? kindLogs : kindLogs.slice(0, 10);

  async function submitUsage() {
    const amt = parseInt(useAmount) || 0;
    if (amt <= 0) return;
    setSaving(true);
    const res = await fetch("/api/reward-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, amount: amt, category: useCategory || "기타", note: useNote.trim() }),
    });
    if (res.ok) {
      setLocalLogs((prev) => [{
        id: crypto.randomUUID(), type: "spend",
        reward_type: isTime ? "time" : "point",
        entry_kind: "use", category: useCategory || "기타",
        amount: amt, note: useNote.trim() || (useCategory || "기타"),
        created_at: new Date().toISOString(),
      }, ...prev]);
      setToast(`${amt}${cur.unit} 사용 기록됨`);
      setTimeout(() => setToast(""), 3000);
      setSheetOpen(false);
      setUseAmount(""); setUseCategory(""); setUseNote("");
      router.refresh();
    }
    setSaving(false);
  }

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
      setToast(`${amt}${cur.unit} 요청 완료!`);
      setTimeout(() => setToast(""), 3000);
      setShowRequestForm(false);
      setReqAmount(""); setReqReason("");
      router.refresh();
    }
    setRequesting(false);
  }

  async function handleRedeem(item: CatalogItem) {
    if (balance < item.cost) return;
    if (!confirm(`"${item.title}"을(를) ${item.cost}${cur.unit}으로 교환할까요?`)) return;
    setRedeeming(item.id);
    const res = await fetch("/api/redeem-reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, catalogId: item.id }),
    });
    if (res.ok) {
      setLocalLogs((prev) => [{
        id: crypto.randomUUID(), type: "spend", reward_type: "point",
        entry_kind: "redeem", category: null,
        amount: item.cost, note: `${item.title} 교환`,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setToast(`${item.emoji} ${item.title} 교환 완료!`);
      setTimeout(() => setToast(""), 3000);
      router.refresh();
    }
    setRedeeming(null);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 2px 14px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>리워드</h1>
      </div>

      {/* 통화 세그먼트 (2개 이상일 때만) */}
      {currencies.length > 1 && (
        <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", borderRadius: 14, padding: 4, marginBottom: 14 }}>
          {currencies.map((c) => {
            const on = c.kind === kind;
            return (
              <button
                key={c.kind}
                onClick={() => { setKind(c.kind); setUseCategory(""); }}
                style={{
                  flex: 1, height: 38, borderRadius: 10, border: "none",
                  background: on ? "#fff" : "transparent",
                  color: on ? "var(--text)" : "var(--muted)",
                  boxShadow: on ? "var(--sh-sm)" : "none",
                  fontWeight: 800, fontSize: 13.5, cursor: "pointer",
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 잔액 히어로 */}
      <div style={{
        borderRadius: 24, padding: "20px 20px 18px", color: "#fff",
        position: "relative", overflow: "hidden",
        background: isTime ? "linear-gradient(150deg,#60A5FA,#2563EB)" : "linear-gradient(150deg,#FBBF24,#E5890B)",
        boxShadow: "var(--sh-hero-gold)", marginBottom: 14,
      }}>
        <div style={{ position: "absolute", right: -26, top: -26, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.14)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 9, position: "relative", marginBottom: 6 }}>
          <Icon name={isTime ? "clock" : "star"} size={17} color="#fff" stroke={2} />
          <span style={{ fontSize: 13.5, fontWeight: 700, opacity: 0.95, whiteSpace: "nowrap" }}>
            {childName}님의 {cur.name}
          </span>
        </div>
        <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em", position: "relative" }}>
          {balance.toLocaleString()}<span style={{ fontSize: 22 }}> {cur.unit}</span>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 14, position: "relative" }}>
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.8 }}>총 적립</p>
            <p style={{ fontSize: 16, fontWeight: 800 }}>{earned.toLocaleString()}{cur.unit}</p>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,.3)" }} />
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.8 }}>총 사용</p>
            <p style={{ fontSize: 16, fontWeight: 800 }}>{spent.toLocaleString()}{cur.unit}</p>
          </div>
        </div>

        {/* 목표 대비 진행바 */}
        {limit && limit > 0 && (
          <div style={{ position: "relative", marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.95 }}>
                {isTime ? "이번 주" : "이번 달"} 사용 {periodUsed.toLocaleString()} / {limit.toLocaleString()}{cur.unit}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 800 }}>
                {over ? "한도 초과" : `${limitPct}%`}
              </span>
            </div>
            <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,.3)", overflow: "hidden" }}>
              <div style={{ width: `${limitPct}%`, height: "100%", borderRadius: 999, background: over ? "#FCA5A5" : "#fff" }} />
            </div>
          </div>
        )}
      </div>

      {/* 사용 기록 버튼 */}
      <button
        onClick={() => setSheetOpen(true)}
        style={{
          width: "100%", height: 50, borderRadius: 14, border: "none",
          background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 15,
          cursor: "pointer", boxShadow: "var(--sh-green)", marginBottom: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        <Icon name="plus" size={18} color="#fff" stroke={2.5} />
        {isTime ? "사용한 시간 기록" : "쓴 돈 기록"}
      </button>

      {/* 조르기 (주 통화에서만) */}
      {isPrimary && (
        <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", marginBottom: 14, overflow: "hidden" }}>
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
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--green-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="send" size={18} color="var(--green-d)" stroke={2} />
              </span>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text)" }}>{cur.name} 조르기</span>
            </div>
            <Icon name={showRequestForm ? "chevron-up" : "chevron-down"} size={18} color="var(--muted)" stroke={2} />
          </button>

          {showRequestForm && (
            <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: 8, margin: "12px 0 10px" }}>
                <input
                  type="number" min={1} value={reqAmount}
                  onChange={(e) => setReqAmount(e.target.value)} placeholder="금액"
                  style={{ flex: "0 0 100px", height: 44, borderRadius: 10, border: "1.5px solid var(--line-strong)", padding: "0 12px", fontSize: 16, fontWeight: 800, color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                />
                <input
                  value={reqReason} onChange={(e) => setReqReason(e.target.value)}
                  placeholder="이유 (예: 시험 잘 봤어요)"
                  style={{ flex: 1, height: 44, borderRadius: 10, border: "1.5px solid var(--line-strong)", padding: "0 12px", fontSize: 13.5, fontWeight: 600, color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <button
                onClick={handleRequest}
                disabled={requesting || !reqAmount || parseInt(reqAmount) <= 0}
                style={{
                  width: "100%", height: 44, borderRadius: 10, border: "none",
                  background: reqAmount && parseInt(reqAmount) > 0 ? "var(--green)" : "var(--line-strong)",
                  color: reqAmount && parseInt(reqAmount) > 0 ? "#fff" : "var(--faint)",
                  fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: requesting ? 0.6 : 1,
                }}
              >
                {requesting ? "요청 중..." : "요청 보내기"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 대기 중인 요청 */}
      {isPrimary && pendingRequests.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: "14px 16px", boxShadow: "var(--sh-sm)", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Icon name="clock" size={15} color="var(--amber-d)" stroke={2} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--amber-d)" }}>대기 중인 요청</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: "var(--amber)", padding: "2px 7px", borderRadius: 999, marginLeft: "auto" }}>
              {pendingRequests.length}
            </span>
          </div>
          {pendingRequests.map((req) => (
            <div key={req.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--line)" }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--green-d)" }}>+{req.amount.toLocaleString()}{cur.unit}</span>
                {req.reason && <p style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{req.reason}</p>}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--amber-d)", background: "var(--amber-50)", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                승인 대기
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 리워드 교환 */}
      {isPrimary && catalog.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "6px 4px 13px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>리워드 교환</h2>
          </div>
          {catalog.map((item) => {
            const locked = balance < item.cost;
            return (
              <div key={item.id} style={{ background: "#fff", borderRadius: "var(--r-card)", padding: "13px 14px", marginBottom: 11, boxShadow: "var(--sh-sm)", opacity: locked ? 0.6 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                    <span style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: locked ? "#F1F5F2" : "var(--amber-50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                      {item.emoji}
                    </span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", color: "var(--text)" }}>{item.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                        <Icon name="star" size={13} color="var(--amber-d)" stroke={0} fill="var(--amber-d)" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--amber-d)", whiteSpace: "nowrap" }}>
                          {item.cost.toLocaleString()}{cur.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  {locked ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--faint)", fontWeight: 800, fontSize: 12.5, whiteSpace: "nowrap" }}>
                      <Icon name="lock" size={13} color="var(--faint)" stroke={2.2} />
                      {(item.cost - balance).toLocaleString()}{cur.unit} 부족
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRedeem(item)}
                      disabled={redeeming === item.id}
                      style={{ height: 38, padding: "0 17px", borderRadius: 11, border: "none", background: "var(--amber)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 14px -6px rgba(245,158,11,.7)", whiteSpace: "nowrap", opacity: redeeming === item.id ? 0.6 : 1 }}
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

      {/* 적립 · 사용 내역 */}
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: "16px 16px 4px", boxShadow: "var(--sh-md)", marginTop: 6 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>적립 · 사용 내역</p>
        {kindLogs.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--faint)", textAlign: "center", padding: "20px 0" }}>아직 내역이 없어요</p>
        ) : (
          <>
            {displayLogs.map((log) => {
              const isEarn = log.type === "earn";
              const isRevoke = log.entry_kind === "revoke";
              return (
                <div key={log.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: isEarn ? "var(--green-50)" : isRevoke ? "#FEF2F2" : "var(--surface-2)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    }}>
                      {isEarn
                        ? <Icon name="plus" size={14} color="var(--green-d)" stroke={2.5} />
                        : log.category
                          ? (CATEGORY_EMOJI[log.category] ?? "📦")
                          : <Icon name="minus" size={14} color={isRevoke ? "#E11D48" : "var(--muted)"} stroke={2.5} />}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.note ?? (isEarn ? "적립" : "사용")}
                        {isRevoke && <span style={{ fontSize: 11, color: "#E11D48", fontWeight: 700, marginLeft: 5 }}>회수</span>}
                      </p>
                      <p style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>
                        {new Date(log.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", marginLeft: 8, color: isEarn ? "var(--green-d)" : "#F2607D" }}>
                    {isEarn ? "+" : "-"}{log.amount.toLocaleString()}{cur.unit}
                  </span>
                </div>
              );
            })}
            {kindLogs.length > 10 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                style={{ width: "100%", padding: "12px 0", background: "none", border: "none", color: "var(--green-d)", fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
              >
                {showAllHistory ? "접기" : `전체 내역 보기 (${kindLogs.length}건)`}
                <Icon name={showAllHistory ? "chevron-up" : "chevron-down"} size={14} color="var(--green-d)" stroke={2} />
              </button>
            )}
          </>
        )}
      </div>

      {/* 사용 기록 바텀시트 */}
      {sheetOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(19,36,27,.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSheetOpen(false); }}
        >
          <div style={{ width: "100%", maxWidth: 430, background: "#fff", borderRadius: "24px 24px 0 0", padding: "22px 20px 30px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>
                {isTime ? "사용한 시간 기록" : "쓴 돈 기록"}
              </p>
              <button onClick={() => setSheetOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <Icon name="x" size={20} color="var(--faint)" stroke={2} />
              </button>
            </div>

            {/* 프리셋 */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {(isTime ? [15, 30, 60] : [1000, 3000, 5000]).map((v) => (
                <button
                  key={v}
                  onClick={() => setUseAmount(String(v))}
                  style={{
                    flex: 1, height: 40, borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: "pointer",
                    border: `2px solid ${useAmount === String(v) ? "var(--green)" : "var(--line-strong)"}`,
                    background: useAmount === String(v) ? "var(--green-50)" : "#fff",
                    color: useAmount === String(v) ? "var(--green-d)" : "var(--muted)",
                  }}
                >
                  {v.toLocaleString()}{cur.unit}
                </button>
              ))}
            </div>

            <input
              type="number" min={1} value={useAmount}
              onChange={(e) => setUseAmount(e.target.value)}
              placeholder={isTime ? "사용한 시간 (분)" : "쓴 금액"}
              style={{ width: "100%", height: 46, borderRadius: 12, border: "1.5px solid var(--line-strong)", padding: "0 14px", fontSize: 16, fontWeight: 800, color: "var(--text)", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            />

            <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>어디에 썼나요?</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {CATEGORIES[kind].map((c) => {
                const on = useCategory === c;
                return (
                  <button
                    key={c}
                    onClick={() => setUseCategory(c)}
                    style={{
                      height: 38, padding: "0 12px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
                      border: `2px solid ${on ? "var(--green)" : "var(--line-strong)"}`,
                      background: on ? "var(--green-50)" : "#fff",
                      color: on ? "var(--green-d)" : "var(--muted)",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <span>{CATEGORY_EMOJI[c] ?? "📦"}</span>{c}
                  </button>
                );
              })}
            </div>

            <input
              value={useNote}
              onChange={(e) => setUseNote(e.target.value)}
              placeholder="메모 (선택)"
              style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid var(--line-strong)", padding: "0 14px", fontSize: 14, color: "var(--text)", outline: "none", boxSizing: "border-box", marginBottom: 14 }}
            />

            <button
              onClick={submitUsage}
              disabled={saving || !useAmount || parseInt(useAmount) <= 0}
              style={{
                width: "100%", height: 50, borderRadius: 14, border: "none",
                background: useAmount && parseInt(useAmount) > 0 ? "var(--green)" : "var(--line-strong)",
                color: useAmount && parseInt(useAmount) > 0 ? "#fff" : "var(--faint)",
                fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "기록 중..." : "기록하기"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "var(--text)", color: "#fff", padding: "12px 20px", borderRadius: 999, fontSize: 13.5, fontWeight: 700, boxShadow: "var(--sh-md)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </>
  );
}
