"use client";

import Icon from "./Icon";

type Tab = "홈" | "캘린더" | "리워드" | "내정보";

interface Props {
  active: Tab;
  role?: "parent" | "child";
}

export default function BottomNav({ active, role = "child" }: Props) {
  const TABS: [string, Tab, string][] = [
    ["home", "홈", role === "parent" ? "/parent/dashboard" : "/child/dashboard"],
    ["calendar", "캘린더", role === "parent" ? "/parent/calendar" : "/child/calendar"],
    ["gift", "리워드", role === "parent" ? "/parent/rewards" : "/child/rewards"],
    ["user", "내정보", role === "parent" ? "/parent/settings" : "/child/profile"],
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
        padding: "10px 14px calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 4px)",
        background: "rgba(255,255,255,.92)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--line)",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {TABS.map(([icon, label, href]) => {
        const on = label === active;
        return (
          <a
            key={label}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              flex: 1,
              textDecoration: "none",
            }}
          >
            <Icon
              name={icon}
              size={23}
              stroke={on ? 2.4 : 2}
              color={on ? "var(--green)" : "#A6B2AB"}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: on ? 800 : 600,
                color: on ? "var(--green-d)" : "#9AA8A0",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </a>
        );
      })}
    </div>
  );
}
