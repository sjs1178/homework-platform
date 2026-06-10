"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

export default function PairInput() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "유효하지 않은 코드입니다. 다시 확인해주세요.");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div
      style={{
        background: "#fff", borderRadius: "var(--r-card)",
        padding: "22px 20px", boxShadow: "var(--sh-md)",
      }}
    >
      <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, marginBottom: 16, lineHeight: 1.6 }}>
        부모님께 받은 초대 코드 6자리를 입력해주세요.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="초대 코드 6자리"
          maxLength={6}
          style={{
            height: 56, borderRadius: 14,
            border: `2px solid ${error ? "var(--red)" : code.length === 6 ? "var(--green)" : "var(--line-strong)"}`,
            padding: "0 16px", textAlign: "center",
            fontSize: 24, fontWeight: 800, letterSpacing: "0.18em",
            color: "var(--text)", outline: "none",
            background: code.length === 6 ? "var(--green-50)" : "#fff",
            transition: "border-color .15s",
          }}
        />
        {error && (
          <p style={{ color: "var(--red)", fontSize: 13.5, textAlign: "center", fontWeight: 600 }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || code.length < 6}
          style={{
            height: 52, borderRadius: 14, border: "none",
            background: "var(--green)", color: "#fff",
            fontWeight: 800, fontSize: 15, cursor: code.length >= 6 ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: code.length < 6 ? 0.4 : 1,
            boxShadow: code.length >= 6 ? "var(--sh-green)" : "none",
          }}
        >
          <Icon name="link" size={18} color="#fff" stroke={2} />
          {loading ? "확인 중..." : "연결하기"}
        </button>
      </form>
    </div>
  );
}
