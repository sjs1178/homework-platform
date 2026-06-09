"use client";

import { useEffect, useState } from "react";

interface PairUser { id: string; name: string; email: string; }
interface Pair {
  id: string;
  inviteCode: string;
  pairName: string | null;
  createdAt: string;
  parent: PairUser | null;
  child: PairUser | null;
}

export default function PairsView() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newChildId, setNewChildId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/pairs")
      .then((r) => r.json())
      .then((d) => { setPairs(d.pairs ?? []); setLoading(false); });
  }, []);

  async function handleSavePairing(pairId: string) {
    setSaving(true);
    const res = await fetch("/api/admin/pairs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, childId: newChildId.trim() || null }),
    });
    if (res.ok) {
      setPairs((prev) =>
        prev.map((p) =>
          p.id === pairId
            ? {
                ...p,
                child: newChildId.trim()
                  ? { id: newChildId.trim(), name: "업데이트됨 (새로고침)", email: "" }
                  : null,
              }
            : p
        )
      );
      setEditingId(null);
      setNewChildId("");
    } else {
      alert("저장 실패");
    }
    setSaving(false);
  }

  async function handleDelete(pairId: string) {
    if (!confirm("이 페어를 삭제할까요? 연결된 숙제/리워드가 모두 삭제됩니다.")) return;
    setDeletingId(pairId);
    const res = await fetch("/api/admin/pairs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId }),
    });
    if (res.ok) setPairs((prev) => prev.filter((p) => p.id !== pairId));
    else alert("삭제 실패");
    setDeletingId(null);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>페어링 관리</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>총 {pairs.length}개 페어</p>
      </div>

      {loading ? (
        <p style={{ color: "#94A3B8" }}>불러오는 중...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pairs.map((pair) => (
            <div
              key={pair.id}
              style={{
                background: "#fff", borderRadius: 12,
                boxShadow: "0 1px 4px rgba(0,0,0,.06)", padding: "18px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", background: "#F1F5F9", padding: "2px 8px", borderRadius: 6, color: "#475569" }}>
                      {pair.inviteCode}
                    </span>
                    <span style={{ fontSize: 11.5, color: "#94A3B8" }}>{fmtDate(pair.createdAt)}</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <UserCell label="부모" user={pair.parent} color="#1D4ED8" bg="#DBEAFE" />
                    <UserCell label="자녀" user={pair.child} color="#15803D" bg="#DCFCE7" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      setEditingId(editingId === pair.id ? null : pair.id);
                      setNewChildId(pair.child?.id ?? "");
                    }}
                    style={{
                      padding: "7px 12px", borderRadius: 8,
                      border: "1.5px solid #E2E8F0", background: "#F8FAFC",
                      color: "#334155", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    자녀 변경
                  </button>
                  <button
                    onClick={() => handleDelete(pair.id)}
                    disabled={deletingId === pair.id}
                    style={{
                      padding: "7px 12px", borderRadius: 8,
                      border: "1.5px solid #FECDD3", background: "#FFF1F2",
                      color: "#E11D48", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {deletingId === pair.id ? "삭제 중…" : "삭제"}
                  </button>
                </div>
              </div>

              {editingId === pair.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                  <p style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>
                    새 자녀 User ID 입력 (비워두면 연결 해제)
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={newChildId}
                      onChange={(e) => setNewChildId(e.target.value)}
                      placeholder="UUID..."
                      style={{
                        flex: 1, height: 38, borderRadius: 8,
                        border: "1.5px solid #CBD5E1", padding: "0 12px",
                        fontSize: 13, color: "#0F172A", outline: "none",
                        fontFamily: "monospace",
                      }}
                    />
                    <button
                      onClick={() => handleSavePairing(pair.id)}
                      disabled={saving}
                      style={{
                        padding: "0 16px", borderRadius: 8, border: "none",
                        background: "#0F172A", color: "#fff", fontWeight: 700,
                        fontSize: 13, cursor: "pointer",
                      }}
                    >
                      저장
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setNewChildId(""); }}
                      style={{
                        padding: "0 12px", borderRadius: 8,
                        border: "1.5px solid #E2E8F0", background: "#fff",
                        color: "#64748B", fontSize: 13, cursor: "pointer",
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {pairs.length === 0 && (
            <p style={{ color: "#94A3B8", textAlign: "center", padding: 32 }}>페어가 없습니다</p>
          )}
        </div>
      )}
    </div>
  );
}

function UserCell({ label, user, color, bg }: { label: string; user: PairUser | null; color: string; bg: string }) {
  return (
    <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px" }}>
      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: bg, color, marginBottom: 6, display: "inline-block" }}>
        {label}
      </span>
      {user ? (
        <>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{user.name}</p>
          <p style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>{user.email}</p>
          <p style={{ fontSize: 10, color: "#CBD5E1", fontFamily: "monospace", marginTop: 2 }}>{user.id.slice(0, 12)}…</p>
        </>
      ) : (
        <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>미연결</p>
      )}
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}
