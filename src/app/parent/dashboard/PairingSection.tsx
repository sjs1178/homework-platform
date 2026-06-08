"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  pair: { id: string; invite_code: string; child_id: string | null } | null;
  childName: string | null;
  childAvatar: string;
  childGrade: string;
}

export default function PairingSection({ userId, pair, childName, childAvatar, childGrade }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createPair() {
    setLoading(true);
    const supabase = createClient();
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from("pairs")
      .insert({ parent_id: userId, invite_code: code })
      .select()
      .single();

    if (!error && data) {
      await supabase
        .from("user_profiles")
        .update({ pair_id: data.id })
        .eq("id", userId);
      router.refresh();
    }
    setLoading(false);
  }

  function copyCode() {
    if (!pair) return;
    navigator.clipboard.writeText(pair.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!pair) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-gray-500 mb-4">아직 자녀와 연결되지 않았어요.</p>
        <button
          onClick={createPair}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "생성 중..." : "초대 코드 생성"}
        </button>
      </div>
    );
  }

  if (!pair.child_id) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-gray-500 mb-2 text-sm">자녀에게 아래 초대 코드를 알려주세요</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold tracking-widest text-blue-600">
            {pair.invite_code}
          </span>
          <button
            onClick={copyCode}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {copied ? "복사됨!" : "복사"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">자녀가 코드를 입력하면 자동으로 연결됩니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{childAvatar}</span>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-green-700 font-semibold">{childName ?? "자녀"}와 연결되었어요!</p>
            {childGrade && (
              <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                {childGrade}
              </span>
            )}
          </div>
          <p className="text-xs text-green-500">✅ 연결됨</p>
        </div>
      </div>
    </div>
  );
}
