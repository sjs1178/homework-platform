"use client";

import { useState } from "react";
import HabitStats from "@/components/HabitStats";
import type { CurrencyConfig, LedgerLog } from "@/lib/reward";

interface GoalRow {
  daily_limit: number | null; weekly_limit: number | null;
  monthly_budget: number | null; saving_goal: number | null;
}

interface Props {
  learning: React.ReactNode;
  currencies: CurrencyConfig[];
  logs: LedgerLog[];
  goals: Record<string, GoalRow>;
}

export default function StatsTabs({ learning, currencies, logs, goals }: Props) {
  const tabs = ["학습", ...currencies.map((c) => c.name)];
  const [active, setActive] = useState(0);

  return (
    <>
      <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", borderRadius: 14, padding: 4, marginBottom: 14 }}>
        {tabs.map((label, i) => {
          const on = active === i;
          return (
            <button
              key={label}
              onClick={() => setActive(i)}
              style={{
                flex: 1, height: 38, borderRadius: 10, border: "none",
                background: on ? "#fff" : "transparent",
                color: on ? "var(--text)" : "var(--muted)",
                boxShadow: on ? "var(--sh-sm)" : "none",
                fontWeight: 800, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {active === 0
        ? learning
        : (() => {
            const cur = currencies[active - 1];
            return cur ? <HabitStats currency={cur} logs={logs} goal={goals[cur.kind]} /> : null;
          })()}
    </>
  );
}
