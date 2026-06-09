"use client";

import Icon from "./Icon";

type Tab = "홈" | "캘린더" | "리워드" | "내정보";

const TABS: [string, Tab, string][] = [
  ["home", "홈", "/parent/dashboard"],
  ["calendar", "캘린더", "/child/calendar"],
  ["gift", "리워드", "/child/rewards"],
  ["user", "내정보", "/child/profile"],
];

export default function BottomNav({ active }: { active: Tab }) {
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
        padding: "10px 14px 26px",
        background: "rgba(255,255,255,.92)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--line)",
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
