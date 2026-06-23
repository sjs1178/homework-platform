"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AVATARS, getAvatar } from "@/lib/avatars";
import Icon from "@/components/ui/Icon";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 현재 선택 미리보기 */}
      <div style={{
        background: "#fff", borderRadius: "var(--r-card)", padding: "24px 16px",
        boxShadow: "var(--sh-md)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 70 }}>{current.emoji}</span>
        <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{name || "이름을 입력하세요"}</p>
      </div>

      {/* 이름 입력 */}
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: 16, boxShadow: "var(--sh-md)" }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 8 }}>이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          style={{
            width: "100%", height: 48, borderRadius: 14,
            border: "2px solid var(--line-strong)", padding: "0 16px",
            fontSize: 15, fontWeight: 600, color: "var(--text)",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* 아바타 선택 */}
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: 16, boxShadow: "var(--sh-md)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>캐릭터 선택</p>
        {AVATAR_CATEGORIES.map(({ key, label }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--faint)", marginBottom: 8 }}>{label}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AVATARS.filter((a) => a.category === key).map((avatar) => {
                const isSelected = selectedAvatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatarId(avatar.id)}
                    title={avatar.label}
                    style={{
                      width: 52, height: 52, fontSize: 28, borderRadius: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `2.5px solid ${isSelected ? "var(--green)" : "var(--line)"}`,
                      background: isSelected ? "var(--green-50)" : "#fff",
                      cursor: "pointer",
                      transform: isSelected ? "scale(1.1)" : "none",
                      boxShadow: isSelected ? "var(--sh-md)" : "none",
                      transition: "all .15s",
                    }}
                  >
                    {avatar.emoji}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        style={{
          width: "100%", height: 54, borderRadius: 16, border: "none",
          background: "var(--green)", color: "#fff",
          fontWeight: 800, fontSize: 16, cursor: "pointer",
          boxShadow: "var(--sh-green)",
          opacity: saving || !name.trim() ? 0.4 : 1,
        }}
      >
        {saved ? "저장됨 ✓" : saving ? "저장 중..." : "저장하기"}
      </button>

      {/* 계정 */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 800, color: "var(--faint)", letterSpacing: "0.04em", textTransform: "uppercase", margin: "4px 4px 8px" }}>
          계정
        </p>
        <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", overflow: "hidden" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span style={{
              width: 42, height: 42, borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#FEF2F2", flexShrink: 0,
            }}>
              <Icon name="log-out" size={22} color="#DC2626" stroke={2} />
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: "#E11D48" }}>로그아웃</span>
          </button>
          <button
            onClick={() => router.push("/account-deletion")}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
            }}
          >
            <span style={{
              width: 42, height: 42, borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#FEF2F2", flexShrink: 0,
            }}>
              <Icon name="trash-2" size={22} color="#DC2626" stroke={2} />
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: "#E11D48" }}>회원 탈퇴</span>
          </button>
        </div>
      </div>
    </div>
  );
}
