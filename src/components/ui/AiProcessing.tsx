"use client";

import Icon from "./Icon";

export default function AiProcessing({ label = "AI 처리 중" }: { label?: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 12, padding: "24px 0",
    }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="ai-processing-star">
            <Icon name="sparkles" size={20} color="var(--green)" stroke={2} />
          </span>
        ))}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>
        {label}
      </span>
    </div>
  );
}
