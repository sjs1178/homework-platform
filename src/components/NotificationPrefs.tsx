"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";

interface Prefs {
  homework_reminder_min: number;
  homework_notify_parent: boolean;
  check_request: boolean;
  check_complete: boolean;
  reward_change: boolean;
}

const DEFAULTS: Prefs = {
  homework_reminder_min: 30,
  homework_notify_parent: false,
  check_request: true,
  check_complete: true,
  reward_change: true,
};

const REMINDER_OPTIONS = [
  { value: 0, label: "끔" },
  { value: 10, label: "10분 전" },
  { value: 30, label: "30분 전" },
  { value: 60, label: "1시간 전" },
  { value: 1440, label: "하루 전" },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 46, height: 28, borderRadius: 999, border: "none", cursor: "pointer",
        background: on ? "var(--green)" : "var(--line-strong)",
        position: "relative", flexShrink: 0, transition: "background .15s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 22, height: 22, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,.25)", transition: "left .15s",
      }} />
    </button>
  );
}

function Row({
  title, desc, right,
}: { title: string; desc?: string; right: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, padding: "13px 0", borderBottom: "1px solid var(--line)",
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{title}</p>
        {desc && <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2, lineHeight: 1.45 }}>{desc}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  );
}

export default function NotificationPrefs({ role }: { role: "parent" | "child" }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    fetch("/api/notification-prefs")
      .then((r) => r.json())
      .then((j) => {
        if (j.prefs) {
          setPrefs({
            homework_reminder_min: j.prefs.homework_reminder_min ?? DEFAULTS.homework_reminder_min,
            homework_notify_parent: j.prefs.homework_notify_parent ?? DEFAULTS.homework_notify_parent,
            check_request: j.prefs.check_request ?? DEFAULTS.check_request,
            check_complete: j.prefs.check_complete ?? DEFAULTS.check_complete,
            reward_change: j.prefs.reward_change ?? DEFAULTS.reward_change,
          });
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  async function save(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await fetch("/api/notification-prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt((t) => (Date.now() - t >= 1800 ? 0 : t)), 2000);
  }

  if (!loaded) {
    return (
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", padding: "16px 16px 6px", minHeight: 80 }}>
        <p style={{ fontSize: 13, color: "var(--faint)", textAlign: "center", padding: "16px 0" }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", padding: "4px 16px 6px" }}>
      {role === "child" && (
        <>
          <Row
            title="숙제 마감 알림"
            desc="숙제 마감 전에 미리 알려드려요"
            right={
              <select
                value={prefs.homework_reminder_min}
                onChange={(e) => save({ homework_reminder_min: Number(e.target.value) })}
                style={{
                  height: 36, borderRadius: 10, border: "1.5px solid var(--line-strong)",
                  padding: "0 10px", fontSize: 13, fontWeight: 700, color: "var(--text)",
                  background: "#fff", outline: "none", cursor: "pointer",
                }}
              >
                {REMINDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            }
          />
          <Row
            title="부모님도 함께 받기"
            desc="내 숙제 알림을 부모님도 받아요"
            right={<Toggle on={prefs.homework_notify_parent} onClick={() => save({ homework_notify_parent: !prefs.homework_notify_parent })} />}
          />
          <Row
            title="숙제 검사 완료 알림"
            desc="부모님이 검사를 끝내면 알려드려요"
            right={<Toggle on={prefs.check_complete} onClick={() => save({ check_complete: !prefs.check_complete })} />}
          />
          <Row
            title="리워드 변경 알림"
            desc="리워드가 지급·차감되면 알려드려요"
            right={<Toggle on={prefs.reward_change} onClick={() => save({ reward_change: !prefs.reward_change })} />}
          />
        </>
      )}

      {role === "parent" && (
        <>
          <Row
            title="숙제 검사 요청 알림"
            desc="자녀가 숙제를 완료하면 알려드려요"
            right={<Toggle on={prefs.check_request} onClick={() => save({ check_request: !prefs.check_request })} />}
          />
          <Row
            title="리워드 변경 알림"
            desc="자녀의 리워드 요청·교환 등을 알려드려요"
            right={<Toggle on={prefs.reward_change} onClick={() => save({ reward_change: !prefs.reward_change })} />}
          />
        </>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 0 8px", opacity: savedAt ? 1 : 0, transition: "opacity .2s" }}>
        <Icon name="check-circle" size={14} color="var(--green)" stroke={2.2} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-d)" }}>저장됐습니다</span>
      </div>
    </div>
  );
}
