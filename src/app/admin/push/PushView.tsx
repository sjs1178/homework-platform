"use client";

import { useEffect, useState } from "react";

interface PushUser {
  id: string;
  email: string;
  displayName: string;
  role: "parent" | "child" | null;
  tokenCount: number;
}

interface SendResult {
  ok: boolean;
  sent?: number;
  failed?: number;
  errors?: string[];
  error?: string;
}

export default function PushView() {
  const [users, setUsers] = useState<PushUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<PushUser | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  useEffect(() => {
    fetch("/api/admin/push")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSend() {
    if (!selectedUser || !title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          title: title.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    }

    setSending(false);
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
        푸쉬 알림 발송
      </h1>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>
        FCM 디바이스 토큰이 등록된 사용자에게 푸쉬 알림을 보냅니다
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* 왼쪽: 사용자 목록 */}
        <div>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,.06)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E2E8F0" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이메일 또는 이름 검색..."
                style={{
                  width: "100%",
                  height: 36,
                  borderRadius: 8,
                  border: "1.5px solid #E2E8F0",
                  padding: "0 12px",
                  fontSize: 13,
                  color: "#0F172A",
                  outline: "none",
                }}
              />
            </div>

            {loading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                불러오는 중...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                {users.length === 0
                  ? "등록된 디바이스 토큰이 없습니다"
                  : "검색 결과가 없습니다"}
              </div>
            ) : (
              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {filtered.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setResult(null);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        borderBottom: "1px solid #F1F5F9",
                        background: isSelected ? "#EFF6FF" : "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                          {user.displayName}
                          {user.role && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: 999,
                                background:
                                  user.role === "parent" ? "#DBEAFE" : "#DCFCE7",
                                color:
                                  user.role === "parent" ? "#1D4ED8" : "#15803D",
                              }}
                            >
                              {user.role === "parent" ? "부모" : "자녀"}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                          {user.email}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#94A3B8",
                          whiteSpace: "nowrap",
                        }}
                      >
                        토큰 {user.tokenCount}개
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 발송 폼 */}
        <div>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,.06)",
              padding: 20,
            }}
          >
            {!selectedUser ? (
              <div
                style={{
                  padding: "40px 16px",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: 13,
                }}
              >
                왼쪽에서 발송 대상을 선택하세요
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: "#F8FAFC",
                    borderRadius: 10,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#475569",
                      flexShrink: 0,
                    }}
                  >
                    {(selectedUser.displayName ?? "?")[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                      {selectedUser.displayName}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      {selectedUser.email}
                    </div>
                  </div>
                </div>

                <label style={labelStyle}>푸쉬 제목</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 숙제 완료 알림"
                  style={inputStyle}
                />

                <label style={labelStyle}>푸쉬 내용</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="예: 자녀가 수학 숙제를 완료했어요!"
                  rows={3}
                  style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" }}
                />

                <label style={labelStyle}>
                  이미지 URL <span style={{ color: "#94A3B8", fontWeight: 500 }}>(선택)</span>
                </label>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  style={inputStyle}
                />

                {imageUrl.trim() && (
                  <div style={{ marginBottom: 16 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl.trim()}
                      alt="미리보기"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 150,
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={handleSend}
                  disabled={sending || !title.trim() || !body.trim()}
                  style={{
                    width: "100%",
                    height: 44,
                    borderRadius: 10,
                    border: "none",
                    background:
                      sending || !title.trim() || !body.trim()
                        ? "#CBD5E1"
                        : "#0F172A",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor:
                      sending || !title.trim() || !body.trim()
                        ? "not-allowed"
                        : "pointer",
                    marginTop: 4,
                  }}
                >
                  {sending ? "발송 중..." : "푸쉬 발송"}
                </button>

                {result && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: result.ok ? "#F0FDF4" : "#FEF2F2",
                      border: `1.5px solid ${result.ok ? "#BBF7D0" : "#FECDD3"}`,
                    }}
                  >
                    {result.ok ? (
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>
                        발송 완료 — 성공 {result.sent}건
                        {(result.failed ?? 0) > 0 && `, 실패 ${result.failed}건`}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>
                        발송 실패: {result.error ?? result.errors?.join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 700,
  color: "#475569",
  marginBottom: 6,
  marginTop: 14,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 8,
  border: "1.5px solid #E2E8F0",
  padding: "0 12px",
  fontSize: 13.5,
  color: "#0F172A",
  outline: "none",
};
