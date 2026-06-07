"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Settings {
  point_reward_name: string;
  point_reward_unit: string;
  reward_trigger?: string;
  score_multiplier?: number;
}

interface Props {
  pairId: string;
  settings: Settings | null;
}

export default function RewardsSettingForm({ pairId, settings }: Props) {
  const router = useRouter();
  const [name, setName] = useState(settings?.point_reward_name ?? "용돈");
  const [unit, setUnit] = useState(settings?.point_reward_unit ?? "P");
  const [trigger, setTrigger] = useState(settings?.reward_trigger ?? "completion");
  const [multiplier, setMultiplier] = useState(settings?.score_multiplier ?? 1);
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
      reward_trigger: trigger,
      score_multiplier: multiplier,
    }, { onConflict: "pair_id" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="text-sm font-semibold text-gray-500 mb-3">리워드 설정</p>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">리워드 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">단위</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* 리워드 지급 기준 */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">리워드 지급 기준</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTrigger("completion")}
              className={`py-2 px-3 rounded-lg text-sm font-semibold border-2 transition-colors ${
                trigger === "completion"
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              ✅ 완료 시 지급
            </button>
            <button
              onClick={() => setTrigger("score")}
              className={`py-2 px-3 rounded-lg text-sm font-semibold border-2 transition-colors ${
                trigger === "score"
                  ? "border-purple-500 bg-purple-50 text-purple-600"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              📝 점수 기반 지급
            </button>
          </div>
        </div>

        {trigger === "completion" && (
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
            숙제 완료 버튼을 누르면 각 숙제에 설정된 리워드가 즉시 적립됩니다.
          </p>
        )}

        {trigger === "score" && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              문제 1개 맞을 때마다 지급할 리워드
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
              <span className="text-sm text-gray-500">{unit} / 문제</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              채점 완료 후 맞은 문제 수 × {multiplier}{unit} 적립
            </p>
          </div>
        )}

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
