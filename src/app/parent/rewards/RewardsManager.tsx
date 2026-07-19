"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import {
  balanceOf, usageLogs, CATEGORIES, CATEGORY_EMOJI,
  type CurrencyConfig, type LedgerLog, type RewardKind,
} from "@/lib/reward";
import { getKSTWeekRange, getKSTYearMonth } from "@/lib/date";

interface Log extends LedgerLog {
  id: string;
  note: string | null;
  created_at: string;
}

interface RewardRequest {
  id: string; amount: number; reason: string; status: string; created_at: string;
}

interface GoalRow {
  daily_limit: number | null; weekly_limit: number | null;
  monthly_budget: number | null; saving_goal: number | null;
}

interface Props {
  pairId: string;
  childId: string;
  childName: string;
  currencies: CurrencyConfig[];
  goals: Record<string, GoalRow>;
  logs: Log[];
  pendingRequests: RewardRequest[];
}

type Mode = "grant" | "use" | "revoke";

function kstDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export default function RewardsManager({
  pairId, childId, childName, currencies, goals,
  logs: initLogs, pendingRequests: initRequests,
}: Props) {
  const router = useRouter();
  const [kind, setKind] = useState<RewardKind>(currencies[0]?.kind ?? "money");
  const [logs, setLogs] = useState<Log[]>(initLogs);
  const [requests, setRequests] = useState<RewardRequest[]>(initRequests);
  const [resolving, setResolving] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("grant");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showAll, setShowAll] = useState(false);

  const cur = currencies.find((c) => c.kind === kind) ?? currencies[0];
  const isTime = kind === "time";
  const isPrimary = currencies[0]?.kind === kind;
  const { earned, spent, balance } = balanceOf(logs, kind);
  const goal = goals[kind];

  const { mondayStr, sundayStr } = getKSTWeekRange();
  const { year, month } = getKSTYearMonth();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const periodUsed = usageLogs(logs, kind)
    .filter((l) => {
      const d = kstDate(l.created_at!);
      return isTime ? d >= mondayStr && d <= sundayStr : d.startsWith(monthPrefix);
    })
    .reduce((s, l) => s + l.amount, 0);
  const limit = isTime ? goal?.weekly_limit : goal?.monthly_budget;
  const limitPct = limit && limit > 0 ? Math.min(100, Math.round((periodUsed / limit) * 100)) : 0;
  const over = !!(limit && periodUsed > limit);

  const kindLogs = logs.filter((l) => (l.reward_type ?? "point") === (isTime ? "time" : "point"));
  const displayLogs = showAll ? kindLogs.slice(0, 100) : kindLogs.slice(0, 20);

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
        setLogs((prev) => [{
          id: crypto.randomUUID(), type: "earn",
          reward_type: currencies[0]?.kind === "time" ? "time" : "point",
          entry_kind: "request", category: null,
          amount: req.amount,
          note: req.reason ? `요청: ${req.reason}` : "자녀 요청 승인",
          created_at: new Date().toISOString(),
        }, ...prev]);
      }
      router.refresh();
    }
    setResolving(null);
  }

  async function submit() {
    const amt = parseInt(amount);
    if (!amt || amt <= 0) { setErr("금액을 입력해주세요"); return; }
    if (mode === "revoke" && !note.trim()) { setErr("회수 사유를 입력해주세요"); return; }
    setBusy(true); setErr("");

    let ok = false;
    if (mode === "use") {
      const res = await fetch("/api/reward-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, kind, amount: amt, category: category || "기타", note: note.trim() }),
      });
      ok = res.ok;
    } else {
      const res = await fetch("/api/adjust-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId, childId, kind,
          type: mode === "grant" ? "earn" : "spend",
          entryKind: mode === "grant" ? "grant" : "revoke",
          amount: amt,
          note: note.trim() || (mode === "grant" ? "부모 직접 지급" : "부모 회수"),
        }),
      });
      ok = res.ok;
    }

    if (ok) {
      setLogs((prev) => [{
        id: crypto.randomUUID(),
        type: mode === "grant" ? "earn" : "spend",
        reward_type: isTime ? "time" : "point",
        entry_kind: mode === "grant" ? "grant" : mode === "use" ? "use" : "revoke",
        category: mode === "use" ? (category || "기타") : null,
        amount: amt,
        note: note.trim() || (mode === "grant" ? "부모 직접 지급" : mode === "use" ? (category || "기타") : "부모 회수"),
        created_at: new Date().toISOString(),
      }, ...prev]);
      setAmount(""); setNote(""); setCategory("");
      router.refresh();
    } else {
      setErr("처리 중 오류가 발생했어요");
    }
    setBusy(false);
  }

  const modeMeta: Record<Mode, { label: string; icon: string; color: string; bg: string }> = {
    grant: { label: "지급", icon: "plus", color: "var(--green-d)", bg: "var(--green-50)" },
    use: { label: "사용", icon: "minus", color: "var(--text-soft)", bg: "var(--surface-2)" },
    revoke: { label: "회수", icon: "x", color: "#E11D48", bg: "#FEF2F2" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* 통화 세그먼트 */}
      {currencies.length > 1 && (
        <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", borderRadius: 14, padding: 4 }}>
          {currencies.map((c) => {
            const on = c.kind === kind;
            return (
              <button
                key={c.kind}
                onClick={() => { setKind(c.kind); setCategory(""); }}
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

      {/* 잔액 카드 */}
      <div style={{
        borderRadius: 24, padding: "20px 20px 18px", color: "#fff",
        background: isTime ? "linear-gradient(150deg,#60A5FA,#2563EB)" : "linear-gradient(150deg,#FBBF24,#E5890B)",
        boxShadow: "var(--sh-hero-gold)", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -26, top: -26, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.14)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 9, position: "relative", marginBottom: 6 }}>
          <Icon name={isTime ? "clock" : "star"} size={17} color="#fff" stroke={2} />
          <span style={{ fontSize: 13.5, fontWeight: 700, opacity: 0.95, whiteSpace: "nowrap" }}>
            {childName}님 잔여 {cur.name}
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
        {limit && limit > 0 && (
          <div style={{ position: "relative", marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.95 }}>
                {isTime ? "이번 주" : "이번 달"} 사용 {periodUsed.toLocaleString()} / {limit.toLocaleString()}{cur.unit}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 800 }}>{over ? "한도 초과" : `${limitPct}%`}</span>
            </div>
            <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,.3)", overflow: "hidden" }}>
              <div style={{ width: `${limitPct}%`, height: "100%", borderRadius: 999, background: over ? "#FCA5A5" : "#fff" }} />
            </div>
          </div>
        )}
      </div>

      {/* 자녀 요청 (주 통화에서만) */}
      {isPrimary && requests.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: "16px 16px 10px", boxShadow: "var(--sh-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Icon name="send" size={16} color="var(--green)" stroke={2} />
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{childName}님의 요청</p>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: "#E11D48", padding: "2px 7px", borderRadius: 999, marginLeft: "auto" }}>
              {requests.length}
            </span>
          </div>
          {requests.map((req) => (
            <div key={req.id} style={{ padding: "12px 0", borderTop: "1px solid var(--line)", opacity: resolving === req.id ? 0.5 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--amber-d)" }}>+{req.amount.toLocaleString()}{cur.unit}</span>
                <span style={{ fontSize: 11.5, color: "var(--faint)" }}>
                  {new Date(req.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </span>
              </div>
              {req.reason && <p style={{ fontSize: 13.5, color: "var(--text-soft)", fontWeight: 600, marginBottom: 8 }}>{req.reason}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleResolve(req.id, "approved")} disabled={resolving === req.id}
                  style={{ flex: 1, height: 38, borderRadius: 10, border: "none", background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  승인
                </button>
                <button onClick={() => handleResolve(req.id, "rejected")} disabled={resolving === req.id}
                  style={{ flex: 1, height: 38, borderRadius: 10, border: "1.5px solid var(--line-strong)", background: "#fff", color: "var(--muted)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 지급 · 사용 · 회수 */}
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: "16px 16px 18px", boxShadow: "var(--sh-md)" }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>{cur.name} 조정</p>

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {(["grant", "use", "revoke"] as const).map((m) => {
            const on = mode === m;
            const meta = modeMeta[m];
            return (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(""); }}
                style={{
                  flex: 1, height: 42, borderRadius: 12, fontWeight: 800, fontSize: 13.5, cursor: "pointer",
                  border: `2px solid ${on ? meta.color : "var(--line-strong)"}`,
                  background: on ? meta.bg : "#fff",
                  color: on ? meta.color : "var(--muted)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                <Icon name={meta.icon} size={15} color={on ? meta.color : "var(--muted)"} stroke={2.5} />
                {meta.label}
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600, marginBottom: 10, lineHeight: 1.5 }}>
          {mode === "grant" && "자녀에게 리워드를 지급합니다."}
          {mode === "use" && "실제로 사용한 양을 기록합니다. 사용 통계에 반영돼요."}
          {mode === "revoke" && "잘못 지급했거나 벌칙으로 되돌립니다. 사용 통계에는 포함되지 않아요."}
        </p>

        <div style={{ position: "relative", marginBottom: 10 }}>
          <input
            type="number" min={1} value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder="금액"
            style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid var(--line-strong)", padding: "0 40px 0 14px", fontSize: 15, fontWeight: 700, color: "var(--text)", outline: "none", boxSizing: "border-box" }}
          />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 700, color: "var(--muted)", pointerEvents: "none" }}>
            {cur.unit}
          </span>
        </div>

        {mode === "use" && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {CATEGORIES[kind].map((c) => {
              const on = category === c;
              return (
                <button key={c} onClick={() => setCategory(c)}
                  style={{
                    height: 36, padding: "0 11px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                    border: `2px solid ${on ? "var(--green)" : "var(--line-strong)"}`,
                    background: on ? "var(--green-50)" : "#fff",
                    color: on ? "var(--green-d)" : "var(--muted)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                  <span>{CATEGORY_EMOJI[c] ?? "📦"}</span>{c}
                </button>
              );
            })}
          </div>
        )}

        <input
          value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={mode === "revoke" ? "회수 사유 (필수)" : mode === "use" ? "메모 (선택)" : "예) 심부름 도와줌"}
          style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid var(--line-strong)", padding: "0 14px", fontSize: 14, color: "var(--text)", outline: "none", marginBottom: 12, boxSizing: "border-box" }}
        />

        {err && <p style={{ color: "#E11D48", fontSize: 13, marginBottom: 8 }}>{err}</p>}

        <button
          onClick={submit}
          disabled={busy || !amount}
          style={{
            width: "100%", height: 48, borderRadius: 14, border: "none",
            background: mode === "revoke" ? "#F2607D" : mode === "use" ? "var(--text-soft)" : "var(--green)",
            color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: busy || !amount ? 0.5 : 1,
          }}
        >
          {busy ? "처리 중..." : `${amount || "0"}${cur.unit} ${modeMeta[mode].label}하기`}
        </button>
      </div>

      {/* 내역 */}
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: "16px 16px 4px", boxShadow: "var(--sh-md)" }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>내역</p>
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
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0, fontSize: 14,
                      background: isEarn ? "var(--green-50)" : isRevoke ? "#FEF2F2" : "var(--surface-2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
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
            {kindLogs.length > 20 && (
              <button
                onClick={() => setShowAll(!showAll)}
                style={{ width: "100%", padding: "12px 0", background: "none", border: "none", color: "var(--green-d)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
              >
                {showAll ? "접기" : `전체 내역 보기 (${kindLogs.length}건)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
