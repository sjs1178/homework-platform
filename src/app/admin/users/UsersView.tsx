"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  profile: {
    role: "parent" | "child" | null;
    display_name: string | null;
    pair_id: string | null;
  } | null;
}

export default function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setLoading(false); });
  }, []);

  async function handleDelete(user: User) {
    if (!confirm(`"${user.email}" 계정을 완전히 삭제할까요?\n\n연결된 숙제, 리워드 내역이 모두 삭제됩니다.`)) return;
    setDeleting(user.id);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      const d = await res.json();
      alert("삭제 실패: " + (d.error ?? "unknown error"));
    }
    setDeleting(null);
  }

  const filtered = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.profile?.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>회원 관리</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>총 {users.length}명</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 또는 이메일 검색..."
          style={{
            width: 240, height: 38, borderRadius: 8,
            border: "1.5px solid #E2E8F0", padding: "0 12px",
            fontSize: 13, color: "#0F172A", outline: "none",
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: "#94A3B8" }}>불러오는 중...</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["이름", "이메일", "역할", "페어 ID", "가입일", "최근 로그인", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#64748B", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                    {user.profile?.display_name ?? "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#334155" }}>{user.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <RoleBadge role={user.profile?.role ?? null} />
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8", fontFamily: "monospace" }}>
                    {user.profile?.pair_id ? user.profile.pair_id.slice(0, 8) + "…" : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>
                    {fmtDate(user.createdAt)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>
                    {user.lastSignIn ? fmtDate(user.lastSignIn) : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={deleting === user.id}
                      style={{
                        padding: "6px 12px", borderRadius: 6,
                        border: "1.5px solid #FECDD3", background: "#FFF1F2",
                        color: "#E11D48", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", whiteSpace: "nowrap",
                        opacity: deleting === user.id ? 0.5 : 1,
                      }}
                    >
                      {deleting === user.id ? "삭제 중…" : "삭제"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                    검색 결과가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>;
  const color = role === "parent" ? ["#DBEAFE", "#1D4ED8"] : ["#DCFCE7", "#15803D"];
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: color[0], color: color[1] }}>
      {role === "parent" ? "부모" : "자녀"}
    </span>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}
