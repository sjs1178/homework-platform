"use client";

import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/users", label: "회원 관리" },
  { href: "/admin/pairs", label: "페어링 관리" },
  { href: "/admin/rewards", label: "리워드 관리" },
  { href: "/admin/content", label: "콘텐츠 관리" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <nav
      style={{
        width: 220,
        background: "#1E293B",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        padding: "24px 0 20px",
      }}
    >
      <div style={{ padding: "0 20px 28px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em" }}>KIDDOLOOP</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#F8FAFC", marginTop: 4 }}>Admin</div>
      </div>

      <div style={{ flex: 1 }}>
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <a
              key={href}
              href={href}
              style={{
                display: "block",
                padding: "11px 20px",
                fontSize: 13.5,
                fontWeight: active ? 800 : 500,
                color: active ? "#F8FAFC" : "#94A3B8",
                background: active ? "rgba(255,255,255,.08)" : "none",
                borderLeft: active ? "3px solid #38BDF8" : "3px solid transparent",
                textDecoration: "none",
                transition: "all .15s",
              }}
            >
              {label}
            </a>
          );
        })}
      </div>

      <div style={{ padding: "0 16px" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            background: "rgba(255,255,255,.06)", border: "none",
            color: "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "pointer",
            textAlign: "left",
          }}
        >
          로그아웃
        </button>
      </div>
    </nav>
  );
}
