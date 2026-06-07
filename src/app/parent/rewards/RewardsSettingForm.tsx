"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Settings {
  id?: string;
  point_reward_name: string;
  point_reward_unit: string;
}

interface Props {
  pairId: string;
  settings: Settings | null;
}

export default function RewardsSettingForm({ pairId, settings }: Props) {
  const router = useRouter();
  const [name, setName] = useState(settings?.point_reward_name ?? "용돈");
  const [unit, setUnit] = useState(settings?.point_reward_unit ?? "P");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("reward_settings").upsert({
      pair_id: pairId,
      point_reward_name: name,
      point_reward_unit: unit,
      time_reward_name: "게임시간",
      time_reward_unit: "분",
    }, { onConflict: "pair_id" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="text-sm font-semibold text-gray-500 mb-3">리워드 설정</p>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">리워드 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 용돈, 포인트"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">단위</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="예: P, 원, 점"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-semibold"
        >
          {saved ? "저장됨 ✓" : saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
