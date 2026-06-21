"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

interface Mission {
  type: "daily" | "weekly" | "monthly";
  label: string;
  desc: string;
  total: number;
  done: number;
  reward: number;
  claimed: boolean;
  periodKey: string;
}

interface Props {
  missions: Mission[];
  pairId: string;
  unit: string;
}

const GRADIENTS: Record<string, string> = {
  daily: "linear-gradient(140deg,#34D399,#16A34A)",
  weekly: "linear-gradient(140deg,#60A5FA,#3B82F6)",
  monthly: "linear-gradient(140deg,#FBBF24,#F59E0B)",
};

const ICONS: Record<string, string> = {
  daily: "zap",
  weekly: "flame",
  monthly: "star",
};

export default function MissionBoard({ missions, pairId, unit }: Props) {
  const [claimedLocal, setClaimedLocal] = useState<Set<string>>(
    new Set(missions.filter((m) => m.claimed).map((m) => m.type))
  );
  const [claiming, setClaiming] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  async function handleClaim(mission: Mission) {
    setClaiming(mission.type);
    const res = await fetch("/api/claim-mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, missionType: mission.type }),
    });
    if (res.ok) {
      const data = await res.json();
      setClaimedLocal((prev) => new Set([...prev, mission.type]));
      setToast(`🎉 ${mission.label} 달성! +${data.reward}${unit}`);
      setTimeout(() => setToast(""), 3000);
    } else {
      const err = await res.json();
      setToast(err.error || "오류가 발생했어요");
      setTimeout(() => setToast(""), 3000);
    }
    setClaiming(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
      {missions.map((m) => {
        const pct = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
        const allDone = m.total > 0 && m.done >= m.total;
        const isClaimed = claimedLocal.has(m.type);
        const canClaim = allDone && !isClaimed;

        return (
          <div
            key={m.type}
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "18px 18px 16px",
              boxShadow: "var(--sh-md)",
              border: canClaim ? "2px solid var(--green)" : "2px solid transparent",
            }}
          >
            {/* 헤더 */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: GRADIENTS[m.type],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 10px -3px rgba(0,0,0,.2)",
                }}
              >
                <Icon name={ICONS[m.type]} size={22} color="#fff" stroke={2} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{m.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
                  {m.desc}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="star" size={14} color="var(--amber-d)" stroke={0} fill="var(--amber-d)" />
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--amber-d)" }}>
                    {m.reward}{unit}
                  </span>
                </div>
              </div>
            </div>

            {/* 프로그레스 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)" }}>
                  진행률
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: allDone ? "var(--green-d)" : "var(--muted)" }}>
                  {m.done}/{m.total} ({pct}%)
                </span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: allDone ? "var(--green)" : GRADIENTS[m.type],
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* 액션 */}
            {m.total === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "8px 0",
                  fontSize: 13,
                  color: "var(--faint)",
                  fontWeight: 600,
                }}
              >
                {m.type === "daily" ? "오늘" : m.type === "weekly" ? "이번 주" : "이번 달"} 숙제가 없어요
              </div>
            ) : isClaimed ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 0",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "var(--green-d)",
                }}
              >
                <Icon name="check-circle" size={18} color="var(--green)" stroke={2.2} />
                달성 완료!
              </div>
            ) : canClaim ? (
              <button
                onClick={() => handleClaim(m)}
                disabled={claiming === m.type}
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 14,
                  border: "none",
                  background: "var(--green)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "var(--sh-green)",
                  opacity: claiming === m.type ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Icon name="star" size={18} color="#fff" stroke={0} fill="#fff" />
                {claiming === m.type ? "처리 중..." : `리워드 받기 (+${m.reward}${unit})`}
              </button>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "8px 0",
                  fontSize: 13,
                  color: "var(--muted)",
                  fontWeight: 700,
                }}
              >
                숙제를 모두 완료하면 리워드를 받을 수 있어요
              </div>
            )}
          </div>
        );
      })}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--text)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 999,
            fontSize: 13.5,
            fontWeight: 700,
            boxShadow: "var(--sh-md)",
            whiteSpace: "nowrap",
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
