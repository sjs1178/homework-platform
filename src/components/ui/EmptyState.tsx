import Icon from "./Icon";

interface EmptyStateProps {
  icon: string;
  title: string;
  desc?: string;
  actionLabel?: string;
  actionIcon?: string;
  actionHref?: string;
}

export default function EmptyState({ icon, title, desc, actionLabel, actionIcon, actionHref }: EmptyStateProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 88, height: 88, borderRadius: 26,
          background: "#E9F4EC",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name={icon} size={46} color="#9DB3A6" stroke={1.9} />
      </div>
      <p style={{ fontSize: 17, fontWeight: 800, color: "#13241B", margin: 0 }}>{title}</p>
      {desc && <p style={{ fontSize: 13.5, color: "#7B8A81", margin: 0, maxWidth: 210, textAlign: "center", lineHeight: 1.6 }}>{desc}</p>}
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            height: 42, padding: "0 20px", borderRadius: 12,
            background: "#16A34A", color: "#fff",
            fontWeight: 800, fontSize: 14,
            textDecoration: "none",
            marginTop: 2,
          }}
        >
          {actionIcon && <Icon name={actionIcon} size={18} color="#fff" stroke={2.2} />}
          {actionLabel}
        </a>
      )}
    </div>
  );
}
