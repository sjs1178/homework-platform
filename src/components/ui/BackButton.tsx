"use client";

import Icon from "./Icon";

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      style={{
        width: 40, height: 40, borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "none", border: "none", cursor: "pointer", flexShrink: 0,
      }}
    >
      <Icon name="arrow-left" size={23} color="var(--text)" stroke={2.2} />
    </button>
  );
}
