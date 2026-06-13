"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AVATARS, getAvatar } from "@/lib/avatars";

interface Props {
  userId: string;
  displayName: string;
  avatarId: string | null;
}

const AVATAR_CATEGORIES = [
  { key: "boy",    label: "남자아이" },
  { key: "girl",   label: "여자아이" },
  { key: "animal", label: "동물" },
] as const;

export default function ProfileEditForm({ userId, displayName, avatarId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(displayName);
  const [selectedAvatarId, setSelectedAvatarId] = useState(avatarId ?? "boy-medium");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = getAvatar(selectedAvatarId);

  async function handleLogout() {
    if (!confirm("로그아웃 하시겠어요?")) return;
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from("user_profiles").update({
      display_name: name.trim(),
      avatar_id: selectedAvatarId,
    }).eq("id", userId);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push("/child/dashboard");
      router.refresh();
    }, 800);
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 현재 선택 미리보기 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-2">
        <span className="text-7xl">{current.emoji}</span>
        <p className="text-lg font-bold">{name || "이름을 입력하세요"}</p>
      </div>

      {/* 이름 입력 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <label className="text-sm text-gray-500 mb-2 block">이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* 아바타 선택 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-3">캐릭터 선택</p>
        {AVATAR_CATEGORIES.map(({ key, label }) => (
          <div key={key} className="mb-4">
            <p className="text-xs text-gray-400 font-semibold mb-2">{label}</p>
            <div className="flex flex-wrap gap-2">
              {AVATARS.filter((a) => a.category === key).map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatarId(avatar.id)}
                  className={`w-14 h-14 text-3xl rounded-2xl flex items-center justify-center transition-all border-2 ${
                    selectedAvatarId === avatar.id
                      ? "border-blue-500 bg-blue-50 scale-110 shadow-md"
                      : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  title={avatar.label}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="py-4 bg-blue-600 text-white rounded-2xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saved ? "저장됨 ✓" : saving ? "저장 중..." : "저장하기"}
      </button>

      {/* 계정 */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.04em", textTransform: "uppercase", margin: "4px 4px 8px" }}>
          계정
        </p>
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
            }}
          >
            <span style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#FEF2F2", flexShrink: 0 }}>
              <span style={{ fontSize: 17 }}>🚪</span>
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: "#E11D48" }}>로그아웃</span>
          </button>
        </div>
      </div>
    </div>
  );
}
