"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <p className="text-gray-500 mb-4">부모님께 받은 초대 코드를 입력해주세요.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="초대 코드 6자리"
          maxLength={6}
          className="border border-gray-300 rounded-lg px-4 py-3 text-center text-xl font-bold tracking-widest uppercase focus:outline-none focus:border-blue-400"
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || code.length < 6}
          className="py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-semibold"
        >
          {loading ? "확인 중..." : "연결하기"}
        </button>
      </form>
    </div>
  );
}
