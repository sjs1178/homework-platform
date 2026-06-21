"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

interface Props {
  pairId: string;
  childName: string;
  unit: string;
  dailyReward: number;
  weeklyReward: number;
  monthlyReward: number;
  progress: {
    daily: { total: number; done: number };
    weekly: { total: number; done: number };
    monthly: { total: number; done: number };
  };
}

const MISSIONS = [
  { key: "daily" as const, label: "데일리 미션", desc: "매일 숙제 전부 완료", icon: "zap", gradient: "linear-gradient(140deg,#34D399,#16A34A)" },
  { key: "weekly" as const, label: "위클리 미션", desc: "이번 주 숙제 전부 완료", icon: "flame", gradient: "linear-gradient(140deg,#60A5FA,#3B82F6)" },
  { key: "monthly" as const, label: "먼슬리 미션", desc: "이번 달 숙제 전부 완료", icon: "star", gradient: "linear-gradient(140deg,#FBBF24,#F59E0B)" },
];

export default function MissionSettings({
  pairId, childName, unit,
  dailyReward: initDaily, weeklyReward: initWeekly, monthlyReward: initMonthly,
  progress,
}: Props) {
  const [daily, setDaily] = useState(String(initDaily));
  const [weekly, setWeekly] = useState(String(initWeekly));
  const [monthly, setMonthly] = useState(String(initMonthly));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const values = { daily, weekly, monthly };
  const setters = { daily: setDaily, weekly: setWeekly, monthly: setMonthly };

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/mission-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pairId,
        daily_reward: parseInt(daily) || 5,
        weekly_reward: parseInt(weekly) || 30,
        monthly_reward: parseInt(monthly) || 100,
      }),
    });
    if (res.ok) {
      setToast("저장 완료!");
      setTimeout(() => setToast(""), 2500);
    }
    setSaving(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
      {/* 현황 요약 */}
      <div
        style={{
          borderRadius: 20,
          padding: "18px 18px 16px",
          background: "linear-gradient(150deg,#1FB259,#15803D)",
          color: "#fff",
          boxShadow: "var(--sh-hero-green)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -26, top: -26, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, position: "relative" }}>
          <Icon name="target" size={18} color="#fff" stroke={2} />
          <span style={{ fontSize: 15, fontWeight: 800 }}>{childName}님 미션 현황</span>
        </div>
        <div style={{ display: "flex", gap: 12, position: "relative" }}>
          {MISSIONS.map((m) => {
            const p = progress[m.key];
            const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
            return (
              <div key={m.key} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.85, marginBottom: 6 }}>
                  {m.key === "daily" ? "오늘" : m.key === "weekly" ? "이번 주" : "이번 달"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{pct}%</div>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, marginTop: 2 }}>
                  {p.done}/{p.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 미션별 리워드 설정 */}
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "18px 18px 20px",
          boxShadow: "var(--sh-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Icon name="settings" size={17} color="var(--green)" stroke={2} />
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>미션 리워드 설정</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {MISSIONS.map((m) => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: m.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={m.icon} size={20} color="#fff" stroke={2} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{m.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>{m.desc}</div>
              </div>
              <div style={{ position: "relative", width: 90 }}>
                <input
                  type="number"
                  min={0}
                  value={values[m.key]}
                  onChange={(e) => setters[m.key](e.target.value)}
                  style={{
                    width: "100%",
                    height: 40,
                    borderRadius: 10,
                    border: "1.5px solid var(--line-strong)",
                    padding: "0 30px 0 12px",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--text)",
                    outline: "none",
                    textAlign: "right",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--amber-d)",
                    pointerEvents: "none",
                  }}
                >
                  {unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 14,
            border: "none",
            background: "var(--green)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "var(--sh-green)",
            marginTop: 18,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>

      {/* 설명 */}
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "16px 18px",
          boxShadow: "var(--sh-sm)",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-soft)", marginBottom: 8 }}>
          미션이란?
        </p>
        <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.7, fontWeight: 600 }}>
          미션은 일정 기간 내 모든 숙제를 완료하면 자동으로 달성됩니다.
          자녀가 미션 페이지에서 리워드를 직접 받을 수 있어요.
          리워드 금액은 위에서 자유롭게 설정할 수 있습니다.
        </p>
      </div>

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
