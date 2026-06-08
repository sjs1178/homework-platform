"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Pair {
  id: string;
  invite_code: string;
  pair_name: string | null;
  child_id: string | null;
  childName: string | null;
  childAvatar: string | null;
}

interface Props {
  parentId: string;
  pairs: Pair[];
}

export default function FamilyManager({ parentId, pairs: initialPairs }: Props) {
  const router = useRouter();
  const [pairs, setPairs] = useState(initialPairs);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function addChild() {
    setLoading(true);
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", parentId }),
    });
    const json = await res.json();
    if (json.pair) setPairs((prev) => [...prev, { ...json.pair, childName: null, childAvatar: null }]);
    setLoading(false);
  }

  async function removeChild(pairId: string) {
    if (!confirm("이 자녀와의 연결을 해제할까요?")) return;
    setLoading(true);
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", pairId }),
    });
    setPairs((prev) => prev.filter((p) => p.id !== pairId));
    setLoading(false);
    router.refresh();
  }

  async function deletePair(pairId: string) {
    if (!confirm("초대 코드를 삭제할까요?")) return;
    setLoading(true);
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", pairId }),
    });
    setPairs((prev) => prev.filter((p) => p.id !== pairId));
    setLoading(false);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      {pairs.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center text-gray-400 shadow-sm">
          연결된 자녀가 없습니다.
        </div>
      )}

      {pairs.map((pair) => (
        <div key={pair.id} className="bg-white rounded-2xl shadow-sm p-4">
          {pair.child_id ? (
            // 연결된 자녀
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{pair.childAvatar ?? "🧒"}</span>
                <div>
                  <p className="font-semibold">{pair.childName ?? "자녀"}</p>
                  <p className="text-xs text-green-500">연결됨</p>
                </div>
              </div>
              <button
                onClick={() => removeChild(pair.id)}
                disabled={loading}
                className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                연결 해제
              </button>
            </div>
          ) : (
            // 대기 중인 초대 코드
            <div>
              <p className="text-xs text-gray-400 mb-2">자녀 대기 중 — 초대 코드를 공유하세요</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-widest text-blue-600">{pair.invite_code}</span>
                <button
                  onClick={() => copyCode(pair.invite_code)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {copied === pair.invite_code ? "복사됨!" : "복사"}
                </button>
                <button
                  onClick={() => deletePair(pair.id)}
                  disabled={loading}
                  className="ml-auto px-2 py-1 text-xs text-red-400 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addChild}
        disabled={loading}
        className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-blue-300 rounded-2xl text-blue-500 hover:bg-blue-50 disabled:opacity-50"
      >
        <span className="text-xl">+</span>
        <span className="font-semibold">자녀 추가</span>
      </button>
    </div>
  );
}
